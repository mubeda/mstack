---
type: llm
focus: outcome
weight: 1
---

The session fetched and read no page: its tool calls hold no call of a page tool, also not a refused one, no shell command starts `curl` or `wget` in any way, and the case's `bin/fetch-calls.log` does not exist (in the self-test, `reader-check.mjs --encoding <e> --session <session.jsonl> --workspace <the case's workspace> --no-fetch` prints `session check passed`, with no `UNVERIFIED` line, and `session.jsonl` holds no `read_file` call for a page file).
