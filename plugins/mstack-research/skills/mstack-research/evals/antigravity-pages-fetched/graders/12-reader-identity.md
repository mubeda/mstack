---
type: llm
focus: outcome
weight: 1
---

Read in the self-test from the case's `session.jsonl` and every `subagent-<n>.json`: every `invoke_subagent` call of the session has the `TypeName` `antigravity-reader` and no other, and every record says `subagentDescriptor.typeName` `antigravity-reader`.
