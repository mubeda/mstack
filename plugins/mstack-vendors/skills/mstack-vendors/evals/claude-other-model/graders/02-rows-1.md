---
type: llm
focus: outcome
weight: 1
---

Section 1 (`### code review`) says `Writers: codex`, and its table has exactly 1 row, in this order, given here as (Vendor, Role, State, Record): (claude, reviewer, available, cross-vendor). The section says `Recommend: claude`, and its `Steps` line is followed by numbered steps. The Command cell of the claude row is a complete command that holds `cd "workspace" &&`, `/bin/claude" -p`, `--safe-mode`, `--model claude-test-model`, `--effort high`, `--output-format json`, `--permission-mode plan`, `--tools "Read,Grep,Glob"`, `--settings '{"advisorModel":"off"}'`, `< "<prompt file>"`, `> "<scratch file>"`.
