---
type: llm
focus: trace
weight: 1
---

A later `vendors/sent-*.txt` holds `Job: developer` group(s) with `codex=gpt-6.2-sol` (and no `claude=` on the developer groups) plus a `Job: code review` group with `Workflow: dev` and `Writers: codex`. After reply-3 types `sonnet` for the claude reviewer, no expensive-model question about `sonnet` is asked.
