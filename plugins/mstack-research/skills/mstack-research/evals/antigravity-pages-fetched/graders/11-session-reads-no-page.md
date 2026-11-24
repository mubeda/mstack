---
type: llm
focus: outcome
weight: 1
---

Read in the self-test from the case's `session.jsonl`: `reader-check.mjs --encoding <e> --session session.jsonl --workspace <the case's workspace> --scratch <the scratch folder of the curl log>` prints `session check passed`. So the session made no file read that worked on a fetched file, and no command of it names a fetched file except the skill's own fetch, `test -s` and `rm -rf` forms: no `cat`, `head`, `tail`, `grep`, `sed` or `less` on one, and no `curl` without `--output`.
