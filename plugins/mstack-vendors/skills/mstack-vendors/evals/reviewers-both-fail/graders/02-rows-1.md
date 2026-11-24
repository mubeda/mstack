---
type: llm
focus: outcome
weight: 1
---

Section 1 (`### code review`) says `Writers: antigravity`, and its table has exactly 2 rows, in this order, given here as (Vendor, Role, State, Record): (claude, reviewer, available, cross-vendor), (codex, reviewer, available, cross-vendor). The section says `Recommend: claude, codex`, and its `Steps` line is followed by numbered steps. The Command cell of the claude row is a complete command that holds `cd "workspace" &&`, `/bin/claude" -p`, `--safe-mode`, `--model claude-test-model`, `--effort high`, `--output-format json`, `--permission-mode plan`, `--tools "Read,Grep,Glob"`, `--settings '{"advisorModel":"off"}'`, `< "<prompt file>"`, `> "<scratch file>"`. The Command cell of the codex row is a complete command that holds `/bin/codex" exec`, `-m gpt-test-codex`, `--sandbox read-only`, `-C "workspace"`, `< "<prompt file>"`, `> "<scratch file>"`, `model_reasoning_effort="high"`.
