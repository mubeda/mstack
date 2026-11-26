---
tags: [mstack-write-issue]
max_turns: 30
timeout_seconds: 600
allowed_tools: [Bash, Read, Write, Glob, Grep, Skill]
---

Called by: mstack-claude-led-review
Repository: example--org/shop

F1: follow-up The CSV export loads every order into memory before it writes the file. The review of pull request 41 deferred streaming the rows, because that change only added the header row.
Evidence: app/export.py line 7, `rows = list(query.all())`
Source: https://github.com/example--org/shop/pull/41

F2: bug The order search puts the q parameter into the SQL text, so a crafted q returns the orders of other users.
Evidence: app/search.py line 5, the query is built with `%` formatting from `q`
Source: https://github.com/example--org/shop/pull/41
