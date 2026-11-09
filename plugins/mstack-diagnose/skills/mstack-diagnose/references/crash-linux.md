# Crash on Linux

Read this file when Phase 0 chose the crash branch and the crashed program ran on a Linux machine.

Read the help before running a command marked "check `--help` first". A step marked "look it up on the machine" has no checked command line.

## Find where the evidence lives

1. Read the core handler.
   ```bash
   cat /proc/sys/kernel/core_pattern
   ```
2. Match the value to a store.
   - `|` with a path to `systemd-coredump`, or `@@` with a socket under `/run/systemd/coredumpd/` (systemd 262 on newer kernels), means coredumpctl holds the records. Continue with step 3.
   - An Apport handler writes reports to `/var/crash/`. Look up its tools on the machine.
   - With ABRT, run `abrt-cli list`, then `abrt-cli info -d <id>`.
   - A plain pattern such as `core` puts the core in the crashed process's working directory.
3. List the program's crashes, quoting the path, and open one.
   ```bash
   coredumpctl list '<exe-path>'
   coredumpctl info <pid>
   ```
4. Write down the Signal, Command Line, Executable and Storage lines. The command line often shows what the program was doing. Storage reads `present` with a file path when a core exists. In the COREFILE column, `missing` means the file was deleted and `truncated` means only part was kept.

## Decide whether it is a one-off or a pattern

5. Compare the entries. Identical signal and top frames suggest a deterministic bug, varying top frames suggest corruption or a race, and unrelated programs dying together suggest a system cause. Label these as inferences.
6. Cores expire, so write "first recorded", never "first". Read the retention from the coredump line of `systemd-tmpfiles --cat-config`.

## Rule out an out-of-memory kill

7. An out-of-memory victim gets SIGKILL and usually leaves no core, so an empty list proves nothing. Find the crash's boot and read its kernel messages, which include a task dump for each kill by default.
   ```bash
   free -h
   journalctl --list-boots
   journalctl -k -b <boot>
   oomctl
   ```
8. systemd-oomd kills every process in the chosen cgroup before the kernel acts. Read its messages with `journalctl -b <boot> -u systemd-oomd.service` (check `--help` first).
9. A memory kill is not a bug in the victim. Report it, and use `references/hang-leak.md` to find what used the memory.

## Line up the crash time

10. Read the journal around the crash. For an older crash, copy the date and time from `coredumpctl info` into the documented `YYYY-MM-DD HH:MM:SS` form, a minute or two on each side. Add `-b -1` when the crash took the session down.
    ```bash
    journalctl --since "-3min" --until "now" -o short-precise --no-pager
    journalctl --since "<YYYY-MM-DD HH:MM:SS>" --until "<YYYY-MM-DD HH:MM:SS>" -o short-precise --no-pager
    ```
11. Compare the modification times of files in the command line and the program's configuration folder with the crash second. A match is a strong lead.
12. Look for an update of the program, or of a library in its crashing frames, just before the first recorded crash. On Arch, read `/var/log/pacman.log`, and `pacman -Qo '<file>'` names a library's package. On Debian and Ubuntu, read `/var/log/dpkg.log`, and look up the apt history log on the machine. With dnf5, run `dnf5 history list`, then `dnf5 history info <id>`.

## Read every thread with symbols

13. Before the first symbol lookup, tell the user that debuginfod sends the build ID and their IP address to a public server. Skip it for a proprietary binary unless they agree.
14. Run `echo "$DEBUGINFOD_URLS"`. When it prints nothing, put `DEBUGINFOD_URLS="<server>"` in front of the gdb command, with the server from the table.
15. Extract the core to a private file deleted on exit, and print every thread. Batch mode turns debuginfod off, so the `set` line is required, and it must be `-iex`, which runs before gdb loads the files. With `-ex` it runs after the symbols were already looked up.
    ```bash
    core=$(mktemp -t crash-XXXXXX.core)
    trap 'rm -f "$core"' EXIT
    coredumpctl dump <pid> --output="$core"
    gdb -q '<exe>' "$core" -batch -iex 'set debuginfod enabled on' -ex 'thread apply all bt'
    ```
16. Read the other threads for work in flight. Note third-party code in the process (plugins, extensions, drivers), but blame it only with evidence.
17. Some frames stay `??` even with debuginfod. Report them as unresolved and never guess a name. You can still name the library of each frame and the kind of thread it ran on.

| Distribution | Server |
|---|---|
| Any (federated) | `https://debuginfod.elfutils.org/` |
| Arch | `https://debuginfod.archlinux.org/` |
| Fedora 35 and later | `https://debuginfod.fedoraproject.org/` |
| Debian | `https://debuginfod.debian.net/` |
| Ubuntu | `https://debuginfod.ubuntu.com/` |
| openSUSE Tumbleweed | `https://debuginfod.opensuse.org/` |

Other servers are listed at `https://sourceware.org/elfutils/Debuginfod.html`.

## Keep the record private

18. A core is process memory. Never run `strings` on it or print raw memory unless the user asks.
19. The journal keeps the full command line, which can hold tokens. Redact it before quoting.
20. Leave `/var/lib/systemd/coredump/` and the journal alone. Your `trap` deletes only your copy.

## Change nothing without consent

21. Never change any of these unasked:
    - `core_pattern` or the coredump storage settings,
    - the ptrace setting,
    - a permanent `DEBUGINFOD_URLS` or `.gdbinit` line,
    - packages, including `dnf5 history undo` and rollback,
    - stored crash records.
22. For an approved change, record the current value first and state the undo with it. A coredump setting goes in a drop-in such as `/etc/systemd/coredump.conf.d/custom.conf`, undone by deleting that file. A kernel setting is undone by writing the recorded value back (look up the command on the machine). List each change and undo under System state.
