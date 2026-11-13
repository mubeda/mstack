---
tags: [skills]
max_turns: 30
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write, Edit]
---

Use the mstack-write-specs skill.

The conversation so far:

User: Write a spec from the epic docs/product/2026-11-01-self-service-portal/epics/02-invoices.md. The evidence is in docs/product/2026-11-01-self-service-portal/evidence.md and the decisions of our planning meeting are in docs/product/2026-11-01-self-service-portal/decisions/2026-11-10-portal-planning.md.
Assistant: (named the three sources, read the shop code, and asked one round: where the invoice files come from, the file format, how search matches)
User: The files come from the existing billing export as PDF. Search matches the invoice number exactly, or a month. Invoices older than 24 months are not shown. No other limits. You decide the rest and mark it as your call.
Assistant: (laid out approaches and recommended a list page that reads the billing export)
User: Go with your recommendation. Write the spec now, quick mode.

Input files: docs/product/2026-11-01-self-service-portal/epics/02-invoices.md, docs/product/2026-11-01-self-service-portal/evidence.md, docs/product/2026-11-01-self-service-portal/decisions/2026-11-10-portal-planning.md
