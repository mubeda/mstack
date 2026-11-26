---
type: llm
focus: trace
weight: 1
---

`vendors/calls.log` shows both reviewers ran one after the other: the first reviewer's `start` precedes its `end`, and its `end` precedes the second reviewer's `start` (`start 1 < end 1 < start 2`), with each run's exit code and output kept apart.
