---
tags: [skills]
max_turns: 30
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write, Edit]
---

Use the mstack-product-plan skill.

The conversation so far:

User: I need a product plan for a customer self-service portal.
Assistant: (said it had read README.md and docs/vision.md, and asked whether there is more to read)
User: No.
Assistant: (round 1: which parts, what is out)
User: Three epics: sign in, invoices, company details. Online payment is out.
Assistant: (round 2: order, measures, size)
User: Sign in and invoices now, company details next. Measures: 80% of invited contacts sign in within a month; 60% fewer invoice requests; company details not measurable yet. Sizes: medium, large, small.
Assistant: (played the understanding back)
User: Correct. Write it.

Input files: README.md, docs/vision.md
