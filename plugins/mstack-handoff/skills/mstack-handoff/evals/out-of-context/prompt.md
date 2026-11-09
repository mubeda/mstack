---
tags: [skill-creator]
max_turns: 40
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

I'm about to run out of context on this session. We're in ./shop, fixing the CSV export that drops the last row (task 1.2 of the plan in docs/plans/export-fix). I already changed the slice in app/export.py but didn't run the tests yet. The staging API token is in shop/.env if the next session needs it. Write a handoff so a fresh Codex session can pick this up, put it in ./handoffs/, and give me a short prompt to paste there.

Input files: shop/
