---
type: llm
focus: trace
weight: 1
---

Variant checks: `found` reports each client as "approved and found" and runs both reviews; `not-installed` reports each client as "approved and not installed" and runs the fallback with warning; `not-approved` reports each client as "not approved" (NEVER "not installed"), keeps reason "the run outside the sandbox was not approved", and runs the fallback with warning; `launch-declined` reports the check as "approved and found", reports the declined `claude` launch as failed with reason "the run outside the sandbox was not approved" (never counted as a review), and completes recovery via `codex` (or fallback when none is left).
