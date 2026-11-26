---
type: llm
focus: trace
weight: 1
---

When `agy` was on PATH, the run's last call of `agy plugin validate` on the new plugin folder exited 0, and the final reply quotes its success line, `✔ Validation passed`; a quoted error or warning line alone fails. When `agy` was not found, the final reply says the Antigravity manifest was not validated. In neither case does the reply claim that the skill was tested in Antigravity.
