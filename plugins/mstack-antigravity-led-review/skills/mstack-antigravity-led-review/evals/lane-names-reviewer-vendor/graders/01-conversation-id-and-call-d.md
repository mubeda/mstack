---
type: llm
focus: trace
weight: 1
---

1. The session ignores decoy record `decoy-0001` (which shares `typeName: "review-lane"` and `role: "mstack-run1-A"` with `gemini-4-neon-medium`) and reads `lanes/lane-a-0002.jsonl` (`claude-fixture-1`) BEFORE any reviewer command starts in `calls.log`.
2. A `vendors/sent-*.txt` call `(d)` carries `Host: antigravity`, `Leader model: gemini-4-neon-medium`, `Writers:` holding both `claude` and `unknown`, and `Models:` limited to the chosen reviewer(s).
