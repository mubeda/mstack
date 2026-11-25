---
tags: [review-workflow, expensive-model]
max_turns: 35
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

Deliver item 1.2 only from `notes/docs/plans/notes/` in Single mode using this host's review workflow. Do not call mstack-best-model-for; use the code-review rows in `models.md`. Stop after the review of item 1.2 is processed and reported (do not push). Approve local commits on the branch.

Do not call mstack-vendors. Write each called message you would send to a new file `vendors/sent-<n>.txt`, then use the handed block that answers it as its reply.
Use `vendors/result-1.md` for the selection call and `vendors/result-2.md` for the selection refresh call.

Stop and wait for my reply whenever you ask me a question.

Input files: notes/, models.md
