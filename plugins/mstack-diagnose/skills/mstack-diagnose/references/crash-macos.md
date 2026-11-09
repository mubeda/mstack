# Crash on macOS

Read this file when Phase 0 chose the crash branch and the crashed program ran on a Mac.

A step marked "look it up on the machine" has no checked command line or path, so read the tool's manual first and never guess.

## Find the report

1. Open Console, choose Crash Reports, and find the program by its binary name. Right-click the report and choose Reveal in Finder to learn its path. A standard user sees only their own reports, and an administrator sees all. The folder on disk was not checked, so look it up on the machine.
2. If the program crashed while a debugger was attached, detach it (`detach` in LLDB) so the system writes the report.
3. Since macOS 12, a crash report is an `.ips` file that holds two JSON objects. Parse the first line as metadata. When its `bug_type` is `309`, parse the rest of the file as the crash report. A `bug_type` of `288` is a stackshot, not a crash.
4. From the report body, write down `exception`, `termination`, `asi` (the application specific information), `procPath`, `procLaunch`, `captureTime`, `osVersion` and `bundleInfo`. The exception tells you how the process ended, but not always why.

## Decide whether it is a one-off or a pattern

5. Compare every report for the program. Identical exception and top frames suggest a deterministic bug, varying top frames suggest corruption or a race, and unrelated programs failing together suggest a system cause. Label these as inferences.
6. The `Incident Identifier` differs for every report, and the `CrashReporter Key` is the same for all reports from one device, so it tells you whether several reports came from one machine.
7. `build_version` and `bundleInfo` tie each report to a version. Call the oldest one you can see "first recorded", never "first".

## Rule out a kill by the system

8. Read `Termination Reason`. It can name causes outside the program's code, such as an invalid code signature or a missing library.
9. An `Exception Note` that says the event is simulated or non-fatal means it is not a crash.
10. When `isCorpse` is true or the note is `EXC_CORPSE_NOTIFY`, the process did not stop on a hardware trap. The system likely ended it, or the program called `abort()`. Read `asi` and `lastExceptionBacktrace` for the failed assertion or uncaught exception.
11. Watchdog, code signature, thermal and memory events can be filed as separate report types, so look in Console for one at the same time. No memory exhaustion check for macOS was verified for this skill. Treat memory pressure as a hypothesis and mark any conclusion about it as inferred.

## Line up the crash time

12. The unified log is stored in a binary format that you read through Console or the `log` tool. Its query syntax was not checked, so read `man log` on the machine before you build a query. Read a window of a minute or two on each side of `captureTime`.
13. Compare the modification times of the files the program had open with the crash second. A match is a strong lead.
14. The commands for system and app update history were not checked, so look them up on the machine. Meanwhile, compare `osVersion` and `build_version` between the last good report and the first bad one.

## Read every thread with symbols

15. `faultingThread` is an index into `threads`. Read that thread first, then every other thread, because they show the work in flight.
16. Symbolicate the whole report with Xcode's command-line tools.
    ```bash
    xcrun crashlog '<report>'
    ```
17. To resolve one address, take the architecture and the load address from the binary images list in the report (`usedImages`), and point `atos` at the DWARF file inside the dSYM, not at the app bundle. The `-i` flag shows inlined frames.
    ```bash
    atos -arch <arch> -o '<dSYM>/Contents/Resources/DWARF/<binary>' -l <load-address> -i <address>
    ```
18. Symbolication needs the dSYM that matches the crashed build. The search for a dSYM by its UUID was not checked, so look it up on the machine. A third-party framework's dSYM comes only from its vendor.
19. A frame that stays an address stays an address in your report. Never name a function you did not see symbolicated. An unsymbolicated report still names the binary that holds each frame.

## Keep the report private

20. macOS already masks user path components. The app name, bundle ID, `asi` text and command line can still identify the user or a private product. Replace a private app name or bundle ID with a placeholder of the same length, symbolicate before sharing, and quote only the frames that carry the signal.
21. Read reports where the system put them. If you need a working copy, make it in a fresh temporary file and delete it when you finish.

## Change nothing without consent

22. Never do any of these unasked:
    - delete or move crash reports,
    - install Xcode or its command-line tools,
    - change a system setting.
23. When the user approves a change, record the current state first and state the undo in the same message. For a setting, the undo is restoring the recorded value. For an installed tool, removal is a separate step, so look it up on the machine. List each change and its undo under System state in the report.
