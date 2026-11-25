---
type: llm
focus: outcome
weight: 1
---

1. Lane A's reviews are recorded as `writer unknown`, never `cross-vendor`.
2. In variant `no-model`, lane B (`lane-b-0003`, `claude-fixture-1`) triggers a call `(d)` holding `claude` beside `unknown` (excluding `claude` from reviewing lane B), and integration sends call `(e)` with `Writers:` holding `claude` beside `unknown` so `claude` stays excluded from reviewing integrated work while the integration review record stays `writer unknown`.
