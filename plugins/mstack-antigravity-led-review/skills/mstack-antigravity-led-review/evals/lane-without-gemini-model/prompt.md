---
tags: [review-workflow, stand-in, lanes, F1]
max_turns: 45
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

This run checks a text, not a host. Follow `workflow/SKILL.md` with `workflow/host.md` from its first line, as the Antigravity session it is written for: use the Antigravity column of the host table, and where it names a tool this client does not have, use this client's tool for the same job. The rule that a session in another host stops does not apply to this run. Treat the preflight as passed and do not run it. `agy models` here is a stand-in that prints a fixed listing. Start no lane: a lane's work, report and transcript are the files this prompt names.

Deliver the task(s) listed in `lane-scope.md` from `notes/docs/plans/notes/` in Workflow mode. Read `lane-scope.md` first for the finished lane worktree(s), lane report(s), `conversationId` values returned by `invoke_subagent`, subagent records under `subagents/`, transcripts under `lanes/<conversationId>.jsonl`, and where to stop. Approve local commits on branches. Use `./bin/agy models` when running `agy models`.

This session lists the agent `review-lane`. Do not call mstack-vendors. Write each called message you would send to a new file `vendors/sent-<n>.txt` starting at 1, then read `vendors/result-<n>.md` as the reply to call `<n>` (for example, call 1 reads `vendors/result-1.md`, call 2 reads `vendors/result-2.md`, and any later call `k` reads `vendors/result-<k>.md`). Approval for the handed `bin/review-ok` commands is granted.

Stop and wait for my reply whenever you ask me a question.

Input files: lane-scope.md, notes/, wt/, reports/, subagents/, lanes/, workflow/, bin/
