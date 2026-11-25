---
type: llm
focus: trace
weight: 1
---

In `vendors/sent-*.txt`, there are two `Job: code review` groups. When `models.md` has effort `high` with `medium` listed, group 2 uses the same model at `medium`. When `models.md` is already at its lowest listed effort (`low`), group 2 repeats group 1's exact model and effort (`low`).
