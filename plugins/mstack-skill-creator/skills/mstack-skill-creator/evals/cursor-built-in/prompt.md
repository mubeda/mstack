---
tags: [mstack-skill-creator]
max_turns: 30
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

This session is running in Cursor: follow `references/host-cursor.md` for every host-specific step. `mstack-vendors` is not installed in this environment.

Use the mstack-skill-creator skill to continue a plugin-target session in ./skills-repo for the new plugin `commit-msg`. Phases 0 through 7 are already done: `plugins/commit-msg` is written, checked, tested and packaged, and `node scripts/check-plugins.mjs` passed.

Run Phase 8 (Review) and Phase 9 (Report). Do not commit or push.

Input files: skills-repo/
