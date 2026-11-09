# Hangs, deadlocks and memory leaks

Read this file when Phase 0 classifies the problem as a process that stops making progress, or as memory that grows or is never freed.

## Find the process

1. Find the program's PID with `pgrep -x <name>`, then confirm it (its command line, its start time) before you signal it. In some agent shells `$!` after `cmd &` is the PID of a wrapper shell, not of the program.
2. Never use `pkill -f <text>`. It matches whole command lines and can match and kill your own shell.

## Dump the stacks

A hang is diagnosed from stack dumps, not from reading code.

1. Take two or three dumps of every thread, a few seconds apart.
2. Compare them. The same frames, blocked on a lock or a condition variable in every dump, point to a deadlock. Frames that move inside user code point to a busy loop or a livelock. This reading is an inference, so confirm it with a probe in Phase 4.
3. Write down which thread holds what and which thread waits on what. That is the symptom the loop must match.

## Dump commands by runtime

1. For Python, run `py-spy dump --pid <pid>`, adding `--locals` for local variables. It needs the same ptrace permission as a debugger. Inside a test, `faulthandler.dump_traceback_later(<seconds>)` dumps every thread after a timeout, and `python -X faulthandler` dumps tracebacks on fatal signals.
2. For the JVM, `kill -QUIT <pid>` prints a thread dump with deadlock detection to the program's standard output, and the process keeps running. `jcmd` has a `Thread.print` command, but check `jcmd -h` first for the invocation on the installed JDK.
3. For Go, SIGQUIT prints every goroutine's stack and then ends the process, so ask the user first. `GOTRACEBACK=all` includes all user goroutines. Inside tests, `go test -timeout <d>` makes a stuck test binary panic.
4. For Node, start the program with `--report-on-signal`, then send the signal (SIGUSR2 by default, not on Windows) to get a diagnostic report.
5. For native code, read the next section.

## Native code and ptrace

The steps in this section are for Linux, where they were run. On macOS there is no `/proc`, no `coredumpctl` and no `ptrace_scope`, so use the platform's debugger (LLDB) or its sampling tools instead, name the tool and the command in the report, and keep the rest of this file's rules. On Windows, follow `references/crash-windows.md`.

1. Read `/proc/sys/kernel/yama/ptrace_scope` first. With a value of 1, attaching to a process you did not start fails. `gdb -p <pid> -batch -ex 'thread apply all bt'` printed "ptrace: Operation not permitted." on a test machine with that setting, so do not rely on it.
2. The route that worked there ends the process, so ask the user before you take it. Send `kill -ABRT <pid>` to make the kernel write a core.
3. Extract the core to a fresh temporary path, and delete it when you are done, because it is a copy of the process memory.

```sh
core=$(mktemp -t hang-XXXXXX.core)
trap 'rm -f "$core"' EXIT
coredumpctl dump <pid> --output="$core"
gdb -q <exe> "$core" -batch -ex 'thread apply all bt'
```

4. Read the blocked frame. In the test the dump showed `pthread_mutex_lock` called from `main` at the source line that took the lock.
5. If `coredumpctl` has no entry, the machine uses another core handler. Read `references/crash-linux.md` to find where the core went.
6. Changing `ptrace_scope` would allow a non-destructive attach, but the setting is machine-wide. Offer it only with its undo (write the value you read back to the same file), and never change it unasked.

## Leaks and memory errors as pass or fail signals

Make the tool's report the Phase 1 signal, so the loop exits non-zero exactly on the reported error. Run it once on a known-bad input and check the exit code before you rely on it.

1. Valgrind needs no rebuild beyond `-g` and runs about 20 to 30 times slower. `valgrind -q --leak-check=full --error-exitcode=1 ./prog` reports "definitely lost" blocks with the allocation site and exits 1.
2. AddressSanitizer with LeakSanitizer costs about 2 times. Build with `clang++ -O1 -g -fsanitize=address -fno-omit-frame-pointer <files>`. Leak detection is on by default on Linux, and on macOS it needs `ASAN_OPTIONS=detect_leaks=1`.
3. ThreadSanitizer costs 5 to 15 times the run time and 5 to 10 times the memory. Build with `clang -fsanitize=thread -g -O1 <files>`, and run with `TSAN_OPTIONS="halt_on_error=1"` so the first report fails the run.
4. UndefinedBehaviorSanitizer is built with `-fsanitize=undefined`. Add `-fno-sanitize-recover=<checks>` to make its checks fatal.
5. Whether AddressSanitizer and ThreadSanitizer can share one build was not checked, so look it up on the machine before you combine them.

## Memory that grows

A leak checker that runs at exit misses memory that is still reachable but keeps growing. The symptom is growth that keeps rising across K repetitions of one operation, and the finding is the chain of references from the leaked object to a root.

1. For native code, run `heaptrack <prog> <args>` and read the result with `heaptrack --analyze "<file>.gz"`. Attaching with `heaptrack --pid <pid>` goes through a debugger, so the ptrace limits above apply.
2. For Node, start with `--heapsnapshot-signal=SIGUSR2`, send `kill -USR2 <pid>` before and after the repetitions, and compare the two snapshots.
3. For Jest, the `--logHeapUsage` flag logs the heap after each test. Use it with `--runInBand` and Node's `--expose-gc`.
4. For .NET, `dotnet-dump` has heap statistics and root-chain commands. Check its help first for the exact commands on the installed version.

### Three snapshots for a growing heap

For any runtime that can take heap snapshots (browsers, Node, the JVM, .NET), use the same protocol.

1. Take a baseline snapshot with the app in its idle state.
2. Drive the app into the suspect state and back out again, about 10 times, so a small leak becomes easy to see. Take a second snapshot.
3. Undo the last action and let garbage collection run, then take a third snapshot.
4. Objects that grow from the first snapshot to the second and stay in the third are the leak candidates.
5. Before you change any code, read the chain of references that keeps each candidate alive, up to its root. Fix only when that chain ends in application code, and fix the link that should not hold the reference.
