---
type: llm
focus: trace
weight: 1
---

The subagent record that the `invoke_subagent` call led to and that subagent's transcript under `results/transcripts/` show `read_file` calls on the changed files of `app/`, NO `write_file` or `edit_file` call, and a `model` field equal to the `model` of the case subagent's own transcript; a reviewer transcript without a read of a changed file fails the case, and a missing record or transcript makes the case `not run`.
