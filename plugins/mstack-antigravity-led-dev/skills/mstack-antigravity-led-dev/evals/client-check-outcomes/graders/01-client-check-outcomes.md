---
type: llm
focus: outcome
weight: 1
---

Verify by variant: `found` reports clients as "approved and found" and runs developer + second review; `not-installed` reports clients as "approved and not installed", stops and names `mstack-antigravity-led-review`; `not-approved` reports clients as "not approved" (NEVER "not installed"), keeps reason "the run outside the sandbox was not approved", stops naming `mstack-antigravity-led-review` with no developer run; `launch-declined-dev` reports check "approved and found", treats declined developer launch as failed round with reason "the run outside the sandbox was not approved", and stops the phase; `launch-declined-reviewer` reports check "approved and found", treats declined second-reviewer launch as failed run with reason "the run outside the sandbox was not approved" (not counted as a review, no fallback review), and lets the leader's finished review stand.
