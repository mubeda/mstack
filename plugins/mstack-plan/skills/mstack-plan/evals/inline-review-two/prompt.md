---
tags: [mstack-plan]
max_turns: 50
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

This session is an Antigravity session: wherever the text has a column or a line per host, follow Antigravity's.

Execute docs/plans/greeting/execute-plan.md. Stop and wait for my reply whenever you ask me questions.

Do not call mstack-vendors. Write each called message you would send to vendors/sent-<n>.txt, then use vendors/result-<n>.md as its reply. In this stand-in run, approval for the handed `bin/review-ok` command is already granted: run each reviewer command directly, one after the other, when the steps tell you to run it. Do not push.

Input files: docs/plans/greeting/, app/, vendors/
