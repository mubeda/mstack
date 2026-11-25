---
type: llm
focus: trace
weight: 1
---

In the session log, `mstack-vendors` writes the exact sentence "The vendor check must run outside the sandbox, so the client will ask you to approve that run." before calling `./bin/ask-outside`; every `reviewer` row in the `## mstack-vendors result` block is `not available` with reason `the run outside the sandbox was not approved` (never `not installed`); `Recommend: a fallback review`; after the block the fallback review runs with its warning and hands its findings to `mstack-receive-review`.
