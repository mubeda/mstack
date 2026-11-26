---
type: llm
focus: outcome
weight: 1
---

The fallback row (claude, fallback, available, same-vendor) has an empty Command cell. The `Steps` tell the session to start one read-only subagent of the same session, on the subagent tier that inherits the session's model, and say never to start a second Antigravity session. No step and no command starts the Antigravity client.
