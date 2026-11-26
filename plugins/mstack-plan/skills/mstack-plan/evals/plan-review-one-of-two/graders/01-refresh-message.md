---
type: llm
focus: trace
weight: 1
---

After the user replied "Only codex, keep its model.", a later `vendors/sent-*.txt` holds a `Models:` line with ONLY `codex=` (keeping its model and effort) and NO `claude=` entry.
