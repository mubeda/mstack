---
tags: [skills]
max_turns: 30
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write, Edit]
---

Use the mstack-product-plan skill.

The conversation so far:

User: I need a product plan for a customer self-service portal. The evidence is in docs/product/evidence/2026-11-08-invoices.md.
Assistant: (said what it had read, including the evidence document, and asked whether there is more to read)
User: No.
Assistant: (round 1: who it is for, the outcome and its measure, what is out, the epics)
User: Finance contacts at our customers. Outcome: they get invoices and change details without writing to support; measure: the share of tickets about invoices and account details. Online payment is out. Three epics: sign in, invoices, company details.
Assistant: (round 2: order, measures, sizes, fixed limits)
User: Sign in and invoices now, company details next. Measures: 80% of invited contacts sign in within a month; half as many invoice tickets; company details not measurable yet. Sizes: medium, large, small. Live before 2027-03-01.
Assistant: (played the understanding back)
User: Correct. Write it.

Input files: docs/product/evidence/2026-11-08-invoices.md
