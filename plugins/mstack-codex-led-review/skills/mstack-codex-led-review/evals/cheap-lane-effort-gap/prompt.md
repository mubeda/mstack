---
tags: [review-workflow]
max_turns: 20
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Write, Bash]
---

Deliver the plan in `notes/docs/plans/notes/` in Workflow mode using this host's review workflow. Do not call mstack-best-model-for: use the handed answers in `models.md`. Stop after asking the reviewer selection question (do not spawn any lane).

Do not call mstack-vendors. Write each called message you would send to a new file `vendors/sent-<n>.txt`, then use the handed block that answers it as its reply.
Use `vendors/result-1-claude.md` in Claude Code, or `vendors/result-1-codex.md` in Codex.

Stop and wait for my reply whenever you ask me a question.

Input files: notes/, models.md
