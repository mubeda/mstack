---
type: llm
focus: outcome
weight: 1
---

The `fallback` row has an empty Command cell, and so has the codex row that is not available. The `Steps` say what the session does: it starts one fresh read-only subagent of its own and hands its review over with `Reviewer vendor: claude`. No command starts a Claude client.
