---
type: llm
focus: outcome
weight: 1
---

Read in the self-test from every `subagent-<n>.jsonl` of the case: `reader-check.mjs --encoding <e>` prints `reader check passed`, so no reader called a tool other than `search_web`, `read_file` and `send_message`; and with `--search-call` it passes for the transcript of each search call, which read no file at all.
