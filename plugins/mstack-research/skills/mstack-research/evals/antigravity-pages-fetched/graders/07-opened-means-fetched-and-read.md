---
type: llm
focus: outcome
weight: 1
---

Read in the self-test from the reply, the curl log and the readers' transcripts: each claim that carries `opened <yyyy-mm-dd>` for a page cites an address that exactly one line of the curl log names, that line says `exit 0`, and `reader-check.mjs`, given that line's `--output` file as `--fetched`, prints `read:` for it with the transcript of a reader of the case. An opened date is not accepted without all of this; a read that the tool refused prints `unread:`.
