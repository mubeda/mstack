---
tags: [review-workflow, expensive-model]
max_turns: 20
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Write, Bash]
---

Deliver task 1.1 from `notes/docs/plans/notes/` using this host's review workflow. Workflow mode, the recommended reviewers and models; stop after the lane table check passes and start no lane.

Do not call mstack-vendors. Write each called message you would send to a new file `vendors/sent-<n>.txt`, then use the handed block that answers it as its reply.
Use `vendors/result-1-claude.md` in Claude Code, or `vendors/result-1-codex.md` in Codex.

Stop and wait for my reply whenever you ask me a question.

Input files: notes/
