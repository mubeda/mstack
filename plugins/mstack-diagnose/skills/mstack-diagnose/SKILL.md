---
name: mstack-diagnose
description: Use when something is broken and the cause is not known yet, such as a crash, segfault, abort, panic or core dump, a bug or wrong output, a failing or flaky test, a regression ("it worked before", "since the last update"), a slowdown or performance problem, a hang, deadlock or memory leak, a CI failure, or a vague report like "X doesn't work" or "X keeps dying". Works in Claude Code and Codex. Use it even when the user only asks "why did X crash" or "fix this bug" and does not name this skill.
---

# mstack diagnose

Find out why something is broken, prove it, and fix it only when the user wants a fix. The goal is an honest account backed by evidence, not a plausible story. Every claim in your final report either points at output you produced in this session or says plainly that it is an inference.

## Using this skill in Claude Code and Codex

This file is the same for both hosts. It never names a host tool outside the table below. Where it says "your subagent tool" or "your question tool", use the host's equivalent.

| This file says | Claude Code | Codex |
|---|---|---|
| your question tool | `AskUserQuestion` | Ask in chat with numbered options, then wait |
| your subagent tool | `Agent`, with `isolation: "worktree"` when it edits code | A separate `codex exec` run in its own `git worktree`, or the session's agent tool if it has one |
| a cheap subagent | `model` and `effort` set to `mstack-best-model-for`'s answer for the tier `cheap` | `-m` and `model_reasoning_effort` set to its answer for the tier `cheap` |
| a standard subagent | `model` and `effort` set to its answer for the tier `standard` | `-m` and `model_reasoning_effort` set to its answer for the tier `standard` |
| the skill folder | The base directory the host showed when it loaded this skill | The folder of the SKILL.md you loaded |
| the user skill folders | `~/.claude/skills/`, `~/.agents/skills/` and the plugin cache `~/.claude/plugins/cache/`, but only under a plugin that `claude plugin list` shows as installed, because the cache keeps leftover copies (`CLAUDE_CONFIG_DIR` replaces `~/.claude`) | `~/.codex/skills/`, `~/.agents/skills/` and the plugin cache `~/.codex/plugins/cache/`, but only under a plugin that Codex has enabled in its `config.toml` (`CODEX_HOME` replaces `~/.codex`) |

Before the first subagent of a run, load `mstack-best-model-for` in called mode once: say which skill is calling, and ask for this host's vendor (`claude` in Claude Code, `codex` in Codex) and the tiers `cheap`, `standard` and `most capable`. A subagent started without a model runs on the session's model, the most expensive choice, so set it every time. A subagent that only reads (a log search, a history lookup) is a cheap subagent. A subagent that tests a hypothesis or edits code is a standard subagent. A subagent whose hypothesis is about concurrency, memory corruption or a cause that spans components runs on the `most capable` answer instead (ask for that tier in the same call), and the report says why.

Without a subagent tool, do the delegated steps yourself, one after another. Refer to the files below by their path inside the skill folder.

## Ground rules

1. **Evidence first.** Do not read code to build a theory before you have a signal (Phase 1). Reading code to find where to test is fine.
2. **Never invent.** An unresolved stack frame stays `??`. A missing log line is missing. Absence of evidence is not evidence of absence, so say what you searched.
3. **Leave the system as you found it.** Diagnosis reads. Machine-wide changes (core handler, ptrace settings, CPU governor, registry keys, packages) are offered to the user with their undo command, never applied unasked. Records the system made (core dumps, crash reports, logs) belong to the user. Delete only your own copies.
4. **Treat crash data as secret.** A core, a minidump or a runtime crash report is a copy of process memory or environment, and it can hold passwords, tokens and private documents. Extract it only to a fresh `mktemp` path, delete it when done, and quote only the lines that carry the signal, with secrets replaced by `<REDACTED>`.
5. **Symbol lookups go over the network.** A debuginfod or symbol-server lookup can send the binary's build ID and the user's IP address. Tell the user before the first lookup, and skip it for proprietary binaries unless they agree.
6. **Ask only after trying.** Exhaust every route you can run yourself before asking the user for access, an artifact or a manual step. Then ask once, with the reason, using your question tool. The one exception is evidence that a retry, a restart or a cleanup would destroy: ask for it to be captured at once, before your own routes are exhausted, because waiting loses it.
7. **Quote names from crash records.** A program or file name taken from a crash record can contain a quote character, so always quote it in shell commands. Match processes by their exact name or binary path (`pgrep -x <name>`), never with `pkill -f <text>`, which can match your own shell. Confirm a PID before you signal it.

## Phase 0. Intake and classify

**The model skill, first.** Before any other step, check `mstack-best-model-for`, which this skill calls for its subagents' models.

1. It is in this session's skill list (as `mstack-best-model-for` or `<plugin>:mstack-best-model-for`): continue.
2. Its folder exists on disk (in the user skill folders the host table names) but the session has not loaded it: say that a new session is needed, and stop.
3. Otherwise it is not installed. Print this once, then continue without subagents: do every delegated step yourself, one after another, start no subagent in this run, and say so in the report.

   ```text
   mstack-diagnose runs without subagents, because mstack-best-model-for is not installed. To install it:
   Claude Code: claude plugin marketplace add mubeda/mstack, then claude plugin install mstack-best-model-for@mstack
   Codex:       codex plugin marketplace add mubeda/mstack, then codex plugin add mstack-best-model-for@mstack
   Skills CLI:  npx skills add mubeda/mstack --skill mstack-best-model-for -g -a <claude-code|codex> -y
   Or install mstack-setup the same way and run it: it installs everything the mstack skills need.
   A new session picks it up.
   ```

No subagent starts without that skill's answer, because it would run on the session's model, the most expensive choice. Inside a workflow lane, whose brief carries the model and effort answers for the tiers `cheap`, `standard` and `most capable`, skip this step and the call in the host section above, use the brief's answers, and say so in the report.

Record these before anything else. Read `references/intake.md` for the full checklist and for what to do when the problem cannot be reproduced here.

1. The symptom, verbatim: the error text, exit code, signal, or the number that is wrong.
2. How often it happens: always, sometimes (roughly how often), or once.
3. The exact steps, the versions (commit, runtime, OS, lockfile), and what differs from an environment where it works.
4. The last known good version or commit, if there is one. It makes a regression bisectable.
5. The reporter's own theories, kept apart from the facts, as hypothesis candidates for Phase 3.
6. The problem type, which picks the branch below: crash, regression, flaky failure, performance, hang or leak, a past CI failure that cannot be rerun, or no repro yet.
7. The deliverable: diagnosis only, or diagnosis plus fix. When the user did not say, a "why" question gets a diagnosis and a "fix it" request gets both.

Gate: the record exists, one problem type is chosen, and the deliverable is chosen.

## Phase 1. Get a signal

Follow `references/codegraph.md` before reading the code under suspicion. Inside a workflow lane, skip it: the coordinator already refreshed the index.

A signal is one of two things.

- **A live loop.** One command that drives the real code path and fails on the user's exact symptom. Build it from whatever reaches the bug fastest, such as a failing test at the right seam, a script, a CLI run compared to a snapshot, a browser script, a replayed request, a throwaway harness, a property or fuzz loop, or `git bisect run` for a regression. Then tighten it on three levers. Make it fast (cache setup, skip unrelated startup, narrow the scope). Make it sharp, so it asserts the exact symptom rather than "did not crash". Make it deterministic (pin time, seed randomness, isolate the filesystem, stub the network). For a flaky failure, the loop's output is a measured rate.
- **A saved record.** For something that already happened and cannot be replayed on demand, the record it left: a core dump, a crash report, a minidump, a runtime fatal-error log, a profile or a trace, or for a CI job its log, its test-result files and the scheduler's record of the run. Treat it as a fixed dataset and read it. Do not re-run the event to "see it again". Secure a record that will not last before you analyze anything: a retry by someone else can recreate a container and take its logs with it, so copy what you can reach, and ask for the rest, before anyone retries.

Gate for a live loop: you have run the command, its redacted failing output is in front of you, it asserts the exact symptom (not a nearby one), it gives the same verdict every run (or a measured rate for a flake), it finishes in seconds and it runs unattended. Gate for a saved record: the record is found, its format is identified and it is loaded with the right tool, and its completeness is written down: for a crash record its symbol status (fully, partly or not symbolized), for logs and result files whether they are whole, cut off (and where) or missing.

No signal, no Phase 2. When you cannot get one, stop and report what you tried and what would unblock it (`references/intake.md` lists the routes in order).

## Phase 2. Reproduce and minimize

Run the loop several times and confirm it shows the reported failure. Then remove inputs, configuration, data and steps one at a time, rerunning after each cut.

- When the failure crosses several components (CI to build to deploy, client to API to service to database), log what enters and leaves each boundary first, including environment and configuration values, and run once. The layer where good input turns into bad output is where you dig.
- When the signal is a stack trace or a log, read all of it. Follow every "Caused by" or chained exception to the innermost one, read the log lines just before the first failure, and treat framework and wrapper frames as transport, not as the cause.

Gate: the failure repeats (or its rate is measured as failures out of runs), and removing any remaining element makes it pass. For a saved record, the record is reduced to one finding, such as the faulting thread and frame, the hot path, the chain that keeps leaked memory alive, or the first bad line of a job log with what overlapped it.

## Phase 3. Hypothesize

Write 3 to 5 ranked hypotheses before testing any of them. Seed them from the reduced finding, from a comparison with similar code in the same codebase that works (list every difference, however small), from the code structure around it, from the change history (`git log -S '<string>' -- <file>`, `git log -G '<regex>' -- <file>`, `git blame -L <a>,<b> <file>`), and from the reporter's theories. Each one states a prediction in the form "If X is the cause, then changing Y makes the failure go away." A hypothesis with no prediction is sharpened or dropped.

Gate: the ranked list and every prediction are written down.

## Phase 4. Eliminate and prove

Test one prediction per probe and change one variable at a time.

1. Order probes from cheapest and most telling to most expensive, for example a log search, then a unit test, then an integration test, then a full reproduction. Skip any probe whose result could not change your next step.
2. Prefer a debugger or a REPL. Next best are temporary logs at the boundaries that separate the hypotheses, each tagged with one unique prefix such as `[DEBUG-a4f2]` so they are easy to remove. Never "log everything and grep".
3. For performance, measure a baseline first, then bisect the cause (`references/performance.md`).
4. Keep asking why until the answer is a wrong decision in the code, not a consequence of an earlier one. That first wrong decision is the root cause. If the state that triggered the symptom is legitimate, the code that broke on it is the root cause. If the state should never exist, a guard where it crashes only hides the bug, and the real fix is in whatever produced that state.
5. When a probe refutes a hypothesis, revert everything that hypothesis motivated.
6. When two fixes that rest on one premise have failed the same check, write that premise as one sentence and test it directly before trying anything else. After three failed fixes in total, stop. The design itself may be wrong, so take that question to the user with your question tool, with the evidence from each attempt, before a fourth fix.
7. Independent hypotheses can be tested in parallel with your subagent tool, one subagent per hypothesis, each a standard subagent (see the table at the top, and its one exception) in its own worktree, with a brief that names the commit and the loop command. Rerun the deciding command yourself before you accept any subagent's verdict. A missing result is a gap, not a pass.

Gate: one prediction is confirmed by a probe that flipped the outcome, at least one independent check agrees with it (or one record is decisive on its own, such as a symbolized stack trace that ends at the faulting line), the others are refuted or marked untested, and the mechanism is mapped to `file:symbol:line` at the first wrong decision. For a saved record that cannot be replayed, no probe can flip the outcome, so the gate is instead: the records point at one cause, each other hypothesis is refuted by a record or marked untested, nothing in the records contradicts the cause, and the tier is Supported at most. A diagnosis-only run goes to Phase 6 from here.

## Phase 5. Fix and add a regression test

1. Find a correct seam, one that exercises the real failure where it happens. A test at too shallow a seam gives false confidence.
2. Commit the failing test first and watch it fail for the intended reason. If you forced the failure by changing code or a fixture, `diff` against a pristine copy to show the change landed.
3. Make the smallest fix the evidence justifies, watch the test pass, then rerun the original, unminimized loop.
4. A change that "might help" is a hypothesis, not a fix, and it does not ship.
5. If there is no correct seam, write no shallow test. Record "no correct seam" as a finding and paste the loop's failing and passing output instead.

Gate: failing before and passing after on the same surface as the symptom (or the "no correct seam" finding with both outputs), and nothing left that a refuted hypothesis motivated.

## Phase 6. Clean up and report

1. Remove every tagged debug line (`git grep -n --untracked '\[DEBUG-'` prints nothing; `--untracked` matters because new harnesses and test files are not tracked yet, and outside a Git repository use `grep -rn '\[DEBUG-' .`), throwaway harnesses, and the cores or dumps you extracted.
2. End any bisect with `git bisect reset`.
3. Undo any system change the user approved, or list it with its undo command.
4. Write the report below.

Gate: the debug-prefix search is empty, the system is as you found it (or every leftover is listed with its path), and the report is written.

## Branches by problem type

Read the file for the branch you chose in Phase 0, and the platform file when the branch needs one. Detect the platform from the machine (`uname -s`, whether `coredumpctl`, `xcrun` or `cdb` exists), never from the host you run in.

| Problem | Read | What changes in the phases |
|---|---|---|
| Crash, segfault, abort, panic, core dump | `references/crash-linux.md`, `references/crash-macos.md` or `references/crash-windows.md`, plus `references/runtimes.md` for Python, Node, JVM, Go, Rust or .NET | Phase 1 is usually a saved record. Rule out out-of-memory kills first. Read every thread, not just the crashing frame |
| Regression | `references/regression.md` | Phase 1 is `git bisect run` with `scripts/bisect-run.sh`. The first bad commit narrows Phase 3 to one diff |
| Flaky failure | `references/flaky.md` | Phase 1 measures the failure rate. "Fixed" needs a run count chosen in advance |
| Performance problem | `references/performance.md` | Every claim is a measured number with its spread. Fix the cheapest cause first |
| Hang, deadlock, memory leak | `references/hang-leak.md` | Phase 1 is two or three stack dumps or a sanitizer report |
| A CI job that already failed and cannot be rerun | `references/ci-failure.md` | Secure what a retry destroys first. Phase 1 is the job log, the test-result files and the scheduler's record. List what else ran on the same runner or host at the time. Supported is the highest tier it can reach |
| Production incident (users affected now) | `references/incident.md` | Mitigate first, diagnose second. Severity sets the pace. A blameless postmortem follows the fix |
| No repro, vague report | `references/intake.md` | Phase 0 turns it into one of the branches above, or stops with what would unblock it |

## Commands in this skill

The command lines in `references/` were checked against the tool's own documentation or run on a real machine. A command marked "look it up on the machine" was not checked, so read the tool's `--help` or man page first and never guess its flags. When a command fails on the user's machine, report the exact error instead of improvising a replacement.

## Grading the evidence

Every root cause gets one tier, and every fix gets one verdict.

| Root-cause tier | What it takes |
|---|---|
| Confirmed | Reproduced on the symptom's own surface, and a one-variable probe flipped the outcome as predicted (or a before and after record differs as predicted). Mapped to `file:symbol:line`. For a bisected regression, reverting the first bad commit on top of the current code makes the loop pass |
| Supported | A real record (a symbolized core, a trace, a bisect result, a CI job's log with the scheduler's record) points at the location and nothing contradicts it, but no probe flipped it. The best a past crash or a past CI failure that cannot be reproduced can reach |
| Inferred | A chain of reasoning from the code or the timeline, walked step by step but not run. Write it as "Given A and B, C is likely because D" |
| Speculative | It fits the evidence, but so do other explanations. List it as a competing hypothesis with the evidence for and against |
| Unknown | You looked and found nothing. List what you searched |

| Fix verdict | Meaning |
|---|---|
| VERIFIED | The original loop failed before and passes after, on the same surface, with the failing test committed first (or a recorded "no correct seam"). A flaky failure passes every one of the runs chosen in advance (`references/flaky.md`). A performance fix shows a difference larger than the run-to-run spread (`references/performance.md`) |
| NOT VERIFIED | The check ran and the symptom is still there, or the check could not run |
| INCONCLUSIVE | Wrong surface, noise larger than the effect, or a check that did not test what it claimed. "Inconclusive" is never a pass, and passing unit tests show branch behavior, not that the bug is gone |

When something passes too easily, suspect the way you observed it before you trust the result.

## Report

When the work must stop before it is done (the cause is not proven yet, or the fix is not finished and verified) because the context or the session is running out, stop at a safe point and write a handoff with `mstack-handoff` when it is installed, listing the hypotheses with their status and the probes already run, so the next session does not repeat them.

Write the report in this shape. Leave out a line only when it does not apply, and say why.

```
Diagnosis: <problem type>. <One sentence that answers the user's question.>
Root cause: <tier>. Fix: <VERIFIED, NOT VERIFIED, INCONCLUSIVE, or not attempted>.

Symptom (verbatim, redacted): ...
Signal: <loop command, or record path, format and symbol status or completeness>. Failing output: ...
Rate or baseline: <k of N runs failed> or <median, range, run count, what limits it>
Proximate cause: <where the failure surfaced, such as the crashing frame or the failing assertion>
Root cause: <file:symbol:line>, the first wrong decision. <The mechanism in two sentences.>
How it was proven: <probe>, predicted <...>, observed <...>
Hypotheses: <rank, prediction, probe, and confirmed, refuted or untested for each>
Fix and proof: <commits in order>, failing then passing output, original loop rerun, <0 of M> or <before and after>
Competing explanations and unknowns: <what else fits, what was searched and not found>
Impact: <data lost and where to recover it>, <will it recur>, <how to avoid it>
System state: <changes made and undone>, <files deleted>, <records left in place and their paths>
Skipped phases: <phase and reason>
```

Separate what the evidence proves from what you infer in every line. If the cause is genuinely ambiguous, say so instead of building confidence out of guesswork.
