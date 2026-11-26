---
tags: [mstack-plan]
max_turns: 50
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

Execute docs/plans/greeting/execute-plan.md inline. Yes, commit each finished task to the branch in progress.md. Stop and wait for my reply whenever you ask me a reviewer question. Do not push.

Do not call mstack-vendors. Write each called message you would send to vendors/sent-<n>.txt, then use vendors/result-<n>.md as its reply.

Input files: docs/plans/greeting/, app/, vendors/
