# Runtime crash and hang reports

Read this file during the crash or hang branch when the program runs on Python, Node.js, a JVM, Go, Rust or .NET.

A crash of an interpreted program is filed under the interpreter's binary, so the runtime's own report often says more than the core. Turn a report on only for the run you reproduce with, never in a profile or system setting. A report the runtime already left belongs to the user, so read it in place. Read the help before running a command marked "check `--help` first".

## Python

1. Run with `PYTHONFAULTHANDLER=1` or `python -X faulthandler`. On SIGSEGV, SIGFPE, SIGABRT, SIGBUS or SIGILL, Python prints "Fatal Python error" and a traceback for each thread.
2. The traceback goes to stderr. It lists file, function and line for up to 100 frames per thread and 100 threads. A free-threaded build dumps only the current thread, and Python 3.14 adds the C stack.
3. It holds paths and names but no variable values. There is no reduced form, so redact paths that name the user.
4. For a hang, `py-spy dump --pid <pid>` prints every thread's stack. Leave out `--locals` unless the user agrees, because local variables can hold secrets. Inside the code, `faulthandler.dump_traceback_later(timeout)` dumps all threads after a timeout, and `faulthandler.register(signum)` dumps them on a signal (not on Windows).

## Node.js

1. Start the program with the report flags and the two exclusion flags. They also work through `NODE_OPTIONS`.
   ```bash
   node --report-on-fatalerror --report-uncaught-exception --report-exclude-env --report-exclude-network '<script>'
   ```
2. The report is `report.<date>.<time>.<pid>.0.<seq>.json` in the process's working directory. `--report-directory` and `--report-filename` change that.
3. A full report holds environment variables (tokens and credentials), MAC and IP addresses, host names, the working directory and the command line. `--report-exclude-env` needs Node 23.3.0 or 22.13.0 and later, and `--report-exclude-network` needs 22.0.0 or 20.13.0 and later, so check the installed version first.
4. For a hang, the process must have started with `--report-on-signal`. Then send SIGUSR2 (the default signal, which `--report-signal` changes) to the confirmed PID with `kill -USR2 <pid>`. This does not work on Windows.

## JVM (HotSpot)

1. On a fatal error the JVM writes `hs_err_pid<pid>.log` without being asked, in the working directory, or else in the temporary folder (`/tmp` on Linux, `TMP` then `TEMP` on Windows). `-XX:ErrorFile=<dir>/java_error%p.log` sets the path.
2. The header names the signal and the problematic frame. A `C` frame is native code, `j` is interpreted Java, `J` is compiled Java, `V` is the VM and `v` is a VM stub. A `C` frame in the program's own library points at that library.
3. The log holds the Java command, the class path, the JVM arguments, part of the environment and full library paths. There is no reduced form, so review and redact it before you quote it.
4. `-XX:+HeapDumpOnOutOfMemoryError` writes the whole heap to `java_pid<pid>.hprof`. Ask before you turn it on.
5. For a hang, `kill -QUIT <pid>` prints a thread dump with deadlock detection to the program's standard output on Linux. `jcmd <pid> Thread.print` prints every thread to your terminal (check `--help` first).

## Go

1. Run with `GOTRACEBACK=crash`. The default, `single`, prints only the current goroutine and exits with code 2. `all` adds every user goroutine, and `system` adds runtime frames.
2. The traceback goes to stderr. On Unix, `crash` also raises SIGABRT, so the platform's core handler records a core and the platform crash file applies. On Windows, use `wer`, which keeps Windows Error Reporting on.
3. The core holds the process's memory, so treat it as a secret.
4. For a hang, SIGQUIT makes a Go program print a stack dump and exit. It ends the process, so ask the user before you send it.

## Rust

1. Run with `RUST_BACKTRACE=1` for a short backtrace or `RUST_BACKTRACE=full` for all frames. The value is read once and cached. `RUST_LIB_BACKTRACE`, when set, controls backtraces the program captures itself.
2. The panic message and backtrace go to stderr. The message is whatever the program formatted, so read it before you quote it.
3. A native crash rather than a panic leaves a core, so the platform crash file applies. How backtraces behave with `panic=abort` was not checked.
4. For a hang, attach a native debugger, such as `gdb -p <pid> -batch -ex 'thread apply all bt'` on Linux (check `--help` first). The default ptrace restriction can refuse the attach. Relaxing it needs consent.

## .NET

1. Run with `DOTNET_DbgEnableMiniDump=1` and `DOTNET_DbgMiniDumpType=3`. Type 3 is a triage dump, which removes personal information such as paths and passwords. Type 1 is mini, 2 is heap (the default) and 4 is full. Single-file and Native AOT apps support only full dumps.
2. The dump goes to `/tmp/coredump.<pid>` by default, a shared and predictable path. Set `DOTNET_DbgMiniDumpName` to a file name in a fresh temporary folder instead, where `%p` expands to the PID. Outside Windows, `DOTNET_EnableCrashReport=1` adds `<dump>.crashreport.json` with the threads and frames.
3. With consent, install the reader with `dotnet tool install --global dotnet-dump`. Then print the managed stacks with `dotnet-dump analyze '<dump>' -c clrstack -c exit` (check `--help` first). `clrstack -all`, `clrthreads` and `pe` also help. It shows no native frames.
4. For a hang, run `dotnet-dump collect -p <pid> --type Triage -o '<path>'` as the target's user, with the path in a fresh temporary folder and the same `TMPDIR`. A full or heap dump can push a container over its memory limit.
