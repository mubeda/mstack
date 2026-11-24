---
type: llm
focus: outcome
weight: 1
---

Section 1 (`### code review`) says `Writers: claude`, and its table has exactly 2 rows, in this order, given here as (Vendor, Role, State, Record): (codex, reviewer, not available, -), (claude, fallback, available, same-vendor). A row that is `available` has an empty Reason cell. The Reason cell of the codex row holds "availability check failed: check-vendors.mjs: internal error / no vendor was checked". The section says `Recommend: a fallback review`.
