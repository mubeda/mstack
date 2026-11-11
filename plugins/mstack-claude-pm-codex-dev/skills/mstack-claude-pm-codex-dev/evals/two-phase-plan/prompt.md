---
tags: [mstack-claude-pm-codex-dev]
max_turns: 150
timeout_seconds: 3600
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write, Edit, Agent]
---

Use the mstack-claude-pm-codex-dev skill to have Codex implement the plan in ./docs/plans/mathlib-functions. Use developer model gpt-6.1-sol at effort low, and reviewer model gpt-6.1-sol at effort low. You may commit each accepted phase to the plan's integration branch; stop at the local integration branch, with no push and no pull request.
