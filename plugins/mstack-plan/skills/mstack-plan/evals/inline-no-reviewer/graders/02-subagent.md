---
type: llm
focus: trace
weight: 1
---

The case subagent's transcript holds an `invoke_subagent` call whose `Prompt` asks for a read-only review of the branch, NO pick question, and NO `run_command` whose parsed command after `cd <abs> &&` launches `claude -p`, `codex exec`, or an Antigravity session (invoking `agy` in print mode with `-p` or ACP mode with `acp`).
