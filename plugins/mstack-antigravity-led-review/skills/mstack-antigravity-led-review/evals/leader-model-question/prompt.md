---
tags: [review-workflow, stand-in]
max_turns: 25
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Write, Bash]
---

This run checks a text, not a host. Follow `workflow/SKILL.md` with `workflow/host.md` from its first line, as the Antigravity session it is written for: use the Antigravity column of the host table, and where it names a tool this client does not have, use this client's tool for the same job. The rule that a session in another host stops does not apply to this run. Treat the preflight as passed and do not run it. `agy models` here is a stand-in that prints a fixed listing. Start no lane: a lane's work, report and transcript are the files this prompt names.

Check if `run-constraints.md` exists in the run folder first and obey it if present. Deliver the plan in `notes/docs/plans/notes/` in Workflow mode. The session lists the agent `review-lane`. Start no lane, stop once the reviewer answer is applied, then give the final report of what was decided. Use `./bin/agy models` when running `agy models`.

Do not call mstack-vendors. Write each called message you would send to a new file `vendors/sent-<n>.txt`, then use the handed block that answers it as its reply.
Use `vendors/result-1.md` for the leader call, `vendors/result-2.md` for the selection call, and `vendors/result-3.md` for any selection refresh call.

Unless `run-constraints.md` says nobody can answer questions, stop and wait for my reply whenever you ask me a question.

Input files: notes/, workflow/, bin/
