---
type: llm
focus: trace
weight: 1
---

report.md explains that the set iteration order of strings changes between Python processes because string hashing is randomized per process (PYTHONHASHSEED), and that this makes the result order vary.
