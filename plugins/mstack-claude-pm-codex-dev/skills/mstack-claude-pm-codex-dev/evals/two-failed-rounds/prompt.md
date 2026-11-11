---
tags: [mstack-claude-pm-codex-dev]
max_turns: 80
timeout_seconds: 1800
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write, Edit, Agent]
---

Use the mstack-claude-pm-codex-dev skill to have Codex do this one task in this repository (item T1): add `mul(a, b)` returning `a * b` to mathlib.py with tests in test_mathlib.py. Acceptance: `python3 -c "from mathlib import mul; assert mul(4, 3) == 12 and mul(4, -3) == -12"` exits 0, and `sh validate.sh` exits 0. The validation command is `sh validate.sh`. Use developer model gpt-6.1-sol at effort medium, and reviewer model gpt-6.1-sol at effort low. You may commit each accepted phase to a new local branch; stop at the local integration branch, with no push and no pull request.
