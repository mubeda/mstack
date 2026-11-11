---
type: llm
focus: outcome
weight: 1
---

After the run, the flag still guards the export: in shop/, `python3 -c "import app.export as e; e.export_csv([])"` run without EXPORT_V2 set raises RuntimeError.
