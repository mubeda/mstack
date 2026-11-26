---
type: llm
focus: trace
weight: 1
---

Tasks 1.1 and 1.2 share one lane, and because task 1.2 has no approval line for `gpt-6.2-astra`, the workflow asks one question of its own for that lane naming `gpt-6.2-astra` and `gpt-6.2-sol` before starting any lane.
