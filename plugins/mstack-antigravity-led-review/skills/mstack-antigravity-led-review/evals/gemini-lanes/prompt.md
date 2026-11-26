---
tags: [review-workflow, stand-in, lanes]
max_turns: 35
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

This run checks a text, not a host. Follow `workflow/SKILL.md` with `workflow/host.md` from its first line, as the Antigravity session it is written for: use the Antigravity column of the host table, and where it names a tool this client does not have, use this client's tool for the same job. The rule that a session in another host stops does not apply to this run. Treat the preflight as passed and do not run it. `agy models` here is a stand-in that prints a fixed listing. Start no lane: a lane's work, report and transcript are the files this prompt names.

Deliver item 1.1 only from `notes/docs/plans/notes/` in Workflow mode. Stop after lane A's first reviews are processed and reported (do not integrate or push). Approve local commits on the branch. Use `./bin/agy models` when running `agy models`.

This session lists the agent `review-lane`. Lane A has already finished item 1.1:
- Worktree: `wt/A` (branch `mstack/run1/A`)
- Lane report: `reports/A.md`
- Subagent records directory: `subagents/`
- Lane A's `invoke_subagent` call returned `conversationId`: `lane-a-0001` (transcript file: `lanes/lane-a-0001.jsonl`, also linked at `lanes/A.jsonl`)

Do not call mstack-vendors. Write each called message you would send to a new file `vendors/sent-<n>.txt`, then use the handed block that answers it as its reply.
Use `vendors/result-1.md` for the leader call and `vendors/result-2.md` for the selection call. Approval for the handed `bin/review-ok` commands is granted.

Stop and wait for my reply whenever you ask me a question.

Input files: notes/, wt/, reports/, subagents/, lanes/, workflow/, bin/
