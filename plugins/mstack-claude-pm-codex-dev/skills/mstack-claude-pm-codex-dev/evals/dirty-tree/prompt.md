---
tags: [mstack-claude-pm-codex-dev]
max_turns: 30
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write, Edit, Agent]
---

Use the mstack-claude-pm-codex-dev skill to have Codex implement the plan in ./docs/plans/mathlib-functions. Use developer model gpt-6.1-sol at effort medium, and reviewer model gpt-6.1-sol at effort low. You may commit each accepted phase to a new local branch; stop at the local integration branch, with no push and no pull request.
