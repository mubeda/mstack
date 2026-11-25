---
tags: [review-workflow]
max_turns: 30
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

Deliver item 1.2 only from `notes/docs/plans/notes/` in Single mode using `mstack-codex-led-review`. Call the real `mstack-vendors` skill to discover reviewers and follow its returned result block strictly. Stop after the review of item 1.2 is processed and reported (do not push). Approve local commits on the branch.

Input files: notes/
