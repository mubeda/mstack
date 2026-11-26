---
tags: [review-workflow, stand-in]
max_turns: 30
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

This run checks a text, not a host. Follow `workflow/SKILL.md` with `workflow/host.md` from its first line, as the Antigravity session it is written for: use the Antigravity column of the host table, and where it names a tool this client does not have, use this client's tool for the same job. The rule that a session in another host stops does not apply to this run. Treat the preflight as passed and do not run it. `agy models` here is a stand-in that prints a fixed listing. Start no lane: a lane's work, report and transcript are the files this prompt names.

Deliver item 1.2 only from `notes/docs/plans/notes/` in Single mode. Stop after the review of item 1.2 is processed and reported (do not push). Approve local commits on the branch. Use `./bin/agy models` when running `agy models`.

Do not call mstack-vendors. Write each called message you would send to a new file `vendors/sent-<n>.txt`, then use the handed block that answers it as its reply.
Use `vendors/result-1.md` for the leader call, `vendors/result-2.md` for the selection call, and `vendors/result-3.md` for the selection refresh call. Approval for the handed `bin/review-ok` commands is granted.

Stop and wait for my reply whenever you ask me a question.

Input files: notes/, workflow/, bin/
