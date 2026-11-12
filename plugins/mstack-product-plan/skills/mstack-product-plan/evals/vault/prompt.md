---
tags: [skills]
max_turns: 30
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write, Edit]
---

Use the mstack-product-plan skill.

The conversation so far:

User: I need a product plan for a customer self-service portal. Support answered 1,140 requests for invoice copies and address changes last quarter, a third of all tickets. It is for the finance contacts at our customers.
Assistant: (said what it had read, and asked whether there is more to read)
User: No, nothing else to read. Put it into the vault, folder Projects.
Assistant: (round 1: which parts, what is out, any fixed date)
User: Three epics: sign in for finance contacts, invoices, company details. Online payment is out. It must be live before 2027-03-01. We should build it with a queue.
Assistant: (round 2: order, a measure for each epic, size)
User: Sign in and invoices now, company details next. Sign in: 80% of invited contacts sign in within a month. Invoices: 60% fewer invoice requests to support in three months, and it is worth about a quarter of the team. Company details: I cannot name a measure, we do not count those tickets apart. I do not know whether the billing system can export invoices older than two years.
Assistant: (played the understanding back)
User: Correct. Write it into the vault, folder Projects.

Input files: the notes in this vault
