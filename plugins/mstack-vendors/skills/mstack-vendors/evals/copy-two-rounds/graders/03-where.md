---
type: llm
focus: trace
weight: 1
---

calls.log shows two `claude-dev` rounds, both with a working folder inside the copy (a folder named `mstack-vendors-dev-...`), neither with `--add-dir`, each seeing exactly the two variables `GIT_CONFIG_GLOBAL` and `GIT_CONFIG_SYSTEM` among the GIT_ variables, and a push exit code other than 0.
