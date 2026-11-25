---
type: llm
focus: outcome
weight: 1
---

`stand-in/calls.log` holds EXACTLY ONE `claude` start (attempted once, no retry for exit-1 failure or wrong `modelUsage`). The leader's finished review is retained in the phase record with its `Record` (`cross-vendor`) and processed. The phase record and final report name the failed `claude` run and its reason and do NOT count it as a review. Phase 1 is committed.
