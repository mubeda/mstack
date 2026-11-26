---
type: llm
focus: trace
weight: 1
---

After the user declined `gpt-6.2-astra`, a later `vendors/sent-*.txt` carries `codex=gpt-6.2-sol`, and every `start codex` line in `vendors/calls.log` runs `gpt-6.2-sol` (never `gpt-6.2-astra`).
