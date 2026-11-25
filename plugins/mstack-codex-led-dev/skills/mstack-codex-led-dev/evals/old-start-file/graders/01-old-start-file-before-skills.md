---
type: llm
focus: outcome
weight: 1
---

Even though `mstack-vendors` is not loaded, the reply prints the verbatim old-plan stop message (naming one of the removed workflows, its replacement, and `mstack-codex-led-review` / `mstack-codex-led-dev`) rather than reporting `mstack-vendors` missing. No `vendors/sent-*.txt` exists, no question is asked, and every path and sha256 in the run folder matches the post-placement baseline (zero added, modified, or deleted files, including ignored files and `.git`).
