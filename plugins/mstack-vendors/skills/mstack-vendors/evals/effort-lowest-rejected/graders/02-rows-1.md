---
type: llm
focus: outcome
weight: 1
---

Section 1 (`### code review`) says `Writers: claude`, and its table has exactly 1 row, in this order, given here as (Vendor, Role, State, Record): (codex, reviewer, available, cross-vendor). The section says `Recommend: codex`, and its `Steps` line is followed by numbered steps. The Command cell of the codex row is a complete command that holds `/bin/codex" exec`, `-m gpt-test-codex`, `--sandbox read-only`, `-C "workspace"`, `< "<prompt file>"`, `> "<scratch file>"`, `model_reasoning_effort="low"`.
