---
type: llm
focus: trace
weight: 1
---

Parsing each `run_command`'s `CommandLine` in the case subagent's transcript after its `cd <abs> &&` prefix (and optional `PATH=...`), the transcript holds one launch whose executable is `claude` (unquoted or double-quoted path) with `-p` and one whose executable is `codex` (unquoted or double-quoted path) with `exec`, the second starting after the first completed (each with its own approval/outcome retained), and NO `run_command` that starts an Antigravity session (invoking `agy` in print mode with `-p` or ACP mode with `acp`, while read-only `agy models` is permitted).
