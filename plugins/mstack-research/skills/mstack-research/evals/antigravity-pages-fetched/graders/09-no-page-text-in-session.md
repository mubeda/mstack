---
type: llm
focus: outcome
weight: 1
---

Read in the self-test with `reader-check.mjs --no-text` and the case's `page-phrases.txt`: it prints `text check passed` for `session.jsonl`, and with `--sent-only` for every `subagent-<n>.jsonl`. So neither the marker nor the page's own wording of its fact (a run of eight or more of its words, such as `hands out its generator under the name nanoid as a named export`) is in anything the session received, and no message a reader sent holds a sentence of the page word for word. The reply holds none of the phrases either. `NOT RUN` from the script (a cut record of a short transcript) makes the case not run.
