---
type: llm
focus: outcome
weight: 1
---

The session looked Codex up first (`command -v codex`, which printed a path) and then launched one Codex review per review round, so one or two: each is a shell command that holds `codex exec` with `--sandbox read-only` and reads the prompt file from the scratch folder. The lookup is not a launch.
