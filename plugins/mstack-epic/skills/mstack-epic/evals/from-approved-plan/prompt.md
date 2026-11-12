---
tags: [skills]
max_turns: 30
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write, Edit]
---

Use the mstack-epic skill.

The conversation so far:

User: Detail epic 2, invoices, from the product plan.
Assistant: (said what it had read; round 1: acceptance, fixed limits, user stories)
User: A finance contact sees every invoice of the last 24 months, finds one by number or month, and downloads it as a file. Nobody sees another company's invoices. Same fixed date as the plan. Two stories: download last month's invoice, search by number.
Assistant: (played the understanding back)
User: Correct. Write it.

Input files: docs/product/2026-11-01-self-service-portal/product-plan.md
