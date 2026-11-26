# Old start file migration passages

Verbatim passages kept for `references/resume.md` when resuming a folder whose `execute-plan.md` was written by an earlier version of `mstack-plan` (one that holds the failure bullet below). Do not apply to a start file written with `mstack-vendors`.

## Rule 3 of "Rules for the whole run"

3. Keep going without status check-ins. Stop and ask only for: an irreversible or destructive operation, a security-sensitive action, a side effect outside this repository (a push, a publish, a merge), a reviewer model that was rejected (the review step below), or a plan so broken that every way forward is a guess. When the context or the session is running out, stop at a safe point, make sure `progress.md` is current, write a handoff with `mstack-handoff` when it is installed, and give its path; the next session continues from `progress.md` and the handoff.

## Review step failure bullet

- An empty output, a non-zero exit, or a Claude result that fails one of its four checks is never a clean review. Read the end of the `.err` file, fix the cause (a rejected effort: the next lower level, without asking; a rejected model: ask the user once for another model and record it, because the model chosen in question 2 is not consent to another one), and rerun once. If it still fails, the user names no other model, or this host's reviewer is not installed, warn the user that the review will be same-vendor, and run the same review prompt through a fresh, read-only subagent of this host (in Claude Code the `Agent` tool with the model and effort of <fallback reviewer: claude>; in Codex a separate `codex exec -m <fallback model> --config model_reasoning_effort="<fallback effort>" --sandbox read-only -C <repository root> - < <tmp>/review-prompt.md`, where those two are the model and effort of <fallback reviewer: codex>, with the prompt above written to that file, as an approved command because it needs network). Log it as a same-vendor review, and say so in the final report. The fallback never waits on the user; a rejected model is the one thing that does.
