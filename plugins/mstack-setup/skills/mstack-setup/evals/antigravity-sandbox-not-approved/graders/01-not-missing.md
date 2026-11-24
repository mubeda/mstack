---
type: llm
focus: outcome
weight: 1
---

The reply shows the status table, and in it each of the four rows by name, `claude-cli`, `claude-login`, `codex-cli` and `codex-login`, with the state `not checked`. None of the four is shown as missing, as not installed, as signed out or as needing a login, and the reply proposes no install or login step for them. It says that these rows were not checked because the run outside the sandbox was not approved, and it does not predict how reviews will run. The trace holds the fallback run: after the refused request, the status script ran inside `./testenv` with `--vendors not-checked`.
