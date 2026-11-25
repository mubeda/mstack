---
type: llm
focus: trace
weight: 1
---

`calls.log` holds exactly ONE `claude` launch (no retry) and ONE `codex` launch (no fallback); the report names the failed `claude` run with its reason (empty output or wrong model in `modelUsage`), never calls it clean, and counts the work as reviewed by `codex`.
