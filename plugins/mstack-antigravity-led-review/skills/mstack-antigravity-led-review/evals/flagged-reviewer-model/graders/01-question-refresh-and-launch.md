---
type: llm
focus: trace
weight: 1
---

After "Yes." to the reviewer pick question, the workflow asks one question of its own about the flagged reviewer model `gpt-6.2-astra` with `gpt-6.2-sol` as the next non-flagged model down. After "No.", it writes a refresh `vendors/sent-*.txt` naming `codex=gpt-6.2-sol`, launches ONLY `codex gpt-6.2-sol` in `calls.log` (never `gpt-6.2-astra`), and records the answer in section 9.
