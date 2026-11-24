---
type: llm
focus: trace
weight: 1
---

calls.log holds exactly one `claude -p` line and one `codex exec` line, each requested through `./ask-outside`, and the second `start` line stands after the first `end` line: the two reviewers ran one after the other, each requested on its own.
