---
type: llm
focus: outcome
weight: 1
---

1. Variant `codex-left` (both reviewers chosen): `calls.log` holds NO `claude` line and ONE `codex` launch for lane A; the review is recorded as `writer unknown` (never `cross-vendor`).
2. Variant `none-left` (`claude` alone chosen): `calls.log` holds NO `claude` line and NO `codex` line, ONE `fallback` launch, a warning in the reply that no other vendor returned a review, and the review is recorded as `writer unknown`.
