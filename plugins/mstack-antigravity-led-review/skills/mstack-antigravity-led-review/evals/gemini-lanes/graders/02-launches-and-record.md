---
type: llm
focus: outcome
weight: 1
---

1. `calls.log` holds both a `claude` launch and a `codex` launch in sequence (first completes before second starts).
2. Both reviews are handed to `mstack-receive-review` unmerged, and the `codex` review is recorded as `cross-vendor` (never `writer unknown`).
