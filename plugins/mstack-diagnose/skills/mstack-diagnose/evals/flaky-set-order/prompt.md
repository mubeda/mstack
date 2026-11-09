---
tags: [skill-creator]
max_turns: 40
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

test_tags keeps failing randomly in CI, maybe half the time, and passes when I rerun it. Can you find out why and fix it properly? Run it with `python3 -m unittest test_tags`. Write what you found and how you proved the fix in report.md.

Input files: tags.py, test_tags.py
