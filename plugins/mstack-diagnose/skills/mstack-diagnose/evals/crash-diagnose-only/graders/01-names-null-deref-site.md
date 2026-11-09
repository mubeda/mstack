---
type: llm
focus: trace
weight: 1
---

report.md identifies handle_line in parsecfg.c dereferencing the NULL pointer returned by strchr (the *eq = assignment, line 7) as the crash site.
