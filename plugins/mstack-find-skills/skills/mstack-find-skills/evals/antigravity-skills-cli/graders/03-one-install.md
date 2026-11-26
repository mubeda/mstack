---
type: llm
focus: trace
weight: 1
---

After the second turn, calls.log holds exactly one `skills add` line without `-l` or `--list`. That line names `acme-tools/web-skills`, `--skill driftwright-e2e` and `-g`, and holds no `--copy`. Its agent list equals the selection exactly: the only value given to `-a` or `--agent`, in the whole line, is `antigravity`. A second agent of any name (for example `-a antigravity cursor`, or a second `-a`) fails. calls.log holds no `agy` line.
