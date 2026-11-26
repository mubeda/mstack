---
type: llm
focus: trace
weight: 1
---

1. The session log shows `lanes/lane-a-0001.jsonl` (or its link `lanes/A.jsonl`) read BEFORE the first `start` line in `calls.log`.
2. `vendors/sent-1.txt` and `vendors/sent-2.txt` hold `Host: antigravity` and `Leader model: gemini-4-neon-medium`.
3. NO `vendors/sent-*.txt` after selection sends `Writers: unknown` for lane A (because `gemini-4-prism-pro` starts with `gemini-`, even though it is not in `models-list.txt`).
