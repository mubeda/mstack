# Crash on Windows

Read this file when Phase 0 chose the crash branch and the crashed program ran on Windows.

A step marked "look it up on the machine" has no checked command line or path. On Windows, a tool's help is usually `/?`, so read it first and never guess a flag.

## Find the record

1. Every application crash writes Event ID 1000, with the source "Application Error", to the Application log, and usually Event ID 1001 from Windows Error Reporting next to it. Read them in Event Viewer. A PowerShell query for these events was not checked, so look it up on the machine.
2. Write down the faulting application and its version, the faulting module, the exception code, the fault offset, the process ID, the start time and both paths.
3. Three exception codes are common. `0xc0000005` is an access violation, `0xc0000374` is heap corruption and `0xc0000022` is access denied.
4. `ntdll.dll`, `kernel32.dll` and `kernelbase.dll` often appear as the faulting module because corruption caused elsewhere trips them. Do not blame them on that line alone.
5. Look for a dump. Windows keeps none by default. If the LocalDumps registry key existed before the crash, the dump is in the folder its `DumpFolder` value names, by default `%LOCALAPPDATA%\CrashDumps`, or under the service profile for a crashed service. A program that does its own crash reporting gets no LocalDumps dump, and neither does a machine with automatic debugging (AeDebug) configured. The Windows Error Reporting archive folders were not checked, so look them up on the machine.

## Decide whether it is a one-off or a pattern

6. Open Reliability Monitor and count the program's failures.
   ```
   perfmon /rel
   ```
7. Repeated pairs of Event 1000 and 1001 mean a pattern. An identical code and offset suggests a deterministic bug, varying offsets or heap corruption suggest corruption or a race, and unrelated programs failing together suggest a system cause. Label these as inferences, and call the oldest event "first recorded".

## Rule out memory exhaustion

8. No Windows check for out-of-memory termination was verified for this skill. Treat memory exhaustion as a hypothesis. Look in Reliability Monitor for unrelated failures in the same minute, which point at the system, and mark any conclusion about memory as inferred.

## Line up the crash time

9. Read the Application and System logs for a minute or two on each side of the crash, for warnings from the same program or its neighbours.
10. Compare the modification times of the files the program had open with the crash second. A match is a strong lead.
11. The commands for Windows Update and install history were not checked, so look them up on the machine. Meanwhile, compare the application version in Event 1000 across crashes.

## Read every thread with symbols

12. Install WinDbg only with the user's consent.
    ```
    winget install Microsoft.WinDbg
    ```
13. Tell the user before the first symbol lookup, because the public symbol server receives a request from their machine. Symbols for a third-party program come only from its vendor.
14. Point the symbol path at the public server with a local cache, then open the dump in cdb.
    ```
    set _NT_SYMBOL_PATH=srv*<local-cache>*https://msdl.microsoft.com/download/symbols
    cdb -y "<SymbolPath>" -i "<ImagePath>" -z "<dump>"
    ```
    Inside the debugger, `.symfix+ <local-cache>` sets the same server and `.sympath` shows the path in use.
15. Run `!analyze -v` for the exception and the faulting thread.
16. Then read every other thread and the loaded module list. The debugger commands for those were not checked, so look them up in the debugger's own help before you run them.
17. A minidump holds only the memory it preserved. A frame without symbols stays unresolved in your report. Never fill in a function name. You can still name the module each frame belongs to.

## Keep the record private

18. A full dump holds all of the process's memory, and a minidump still holds stacks, which can contain secrets. Read dumps in place, and quote only frames, module names and exception codes.
19. The application path in Event 1000 can contain the user's name. Replace it and any other identifying text with `<REDACTED>` before you quote it.
20. Leave dumps in `CrashDumps` and the event log entries alone, because they belong to the user. Delete only copies you made.

## Change nothing without consent

21. Never make these changes unasked, and state each one's undo in the same message.
    - Adding a LocalDumps key, from an elevated prompt, so that the next crash leaves a dump. A `DumpType` of 1 is a minidump (the default) and 2 is a full dump of all memory, so prefer 1 unless the user agrees to a full one. For a 32-bit program, add the same per-program key under `HKLM\SOFTWARE\Wow6432Node\` as well. The undo is deleting the per-program key when the diagnosis ends, and the report names that key.
      ```
      reg add "HKLM\SOFTWARE\Microsoft\Windows\Windows Error Reporting\LocalDumps\<app>.exe" /v DumpType /t REG_DWORD /d 1 /f
      ```
    - Page heap checking for one program. The second line is its undo.
      ```
      Gflags.exe /i <app>.exe +hpa
      Gflags.exe /i <app>.exe -hpa
      ```
    - Installing WinDbg. Removal is a separate step, so look it up on the machine.
22. List each change you made and its undo under System state in the report.
