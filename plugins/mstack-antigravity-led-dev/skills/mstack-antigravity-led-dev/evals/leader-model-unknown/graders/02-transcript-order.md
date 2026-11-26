---
type: llm
focus: trace
weight: 1
---

In `results/transcripts/leader-model-unknown/session.jsonl` (reading its encoding — `full` or `short` — from the `Transcript` column of `results/run-log.md`): a `run_command` whose `CommandLine` invokes the `codex` executable with `exec` (matching basename `codex`, whether unquoted or a quoted absolute path like `"/path/to/codex" exec ...`) comes before a `run_command` whose `CommandLine` invokes the `claude` executable with `-p` (unquoted or quoted absolute path), and no `run_command` starts the Antigravity client (`agy`) with a prompt.
