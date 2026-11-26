---
type: llm
focus: outcome
weight: 1
---

The session ran both lookups, `command -v codex` and then `command -v claude`, and each found nothing under the case's `PATH` (no output, a non-zero exit). In the self-test each of the two `run_command` calls is a run outside the sandbox, where the transcript records that. A session that reread the plan without both lookups fails.
