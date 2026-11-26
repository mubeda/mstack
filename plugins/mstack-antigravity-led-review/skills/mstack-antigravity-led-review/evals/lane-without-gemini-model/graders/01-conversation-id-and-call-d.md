---
type: llm
focus: trace
weight: 1
---

1. The session ignores decoy record `decoy-0001` (which shares `typeName: "review-lane"` and `role: "mstack-run1-A"` with `gemini-4-neon-medium`) and locates lane A by `conversationId` `lane-a-0002` before any reviewer starts.
2. Because `lanes/lane-a-0002.jsonl` is missing (`unreadable`) or lacks a `model` field (`no-model`), a `vendors/sent-*.txt` call `(d)` is written BEFORE any finding reaches `mstack-receive-review`, carrying `Host: antigravity`, `Leader model: gemini-4-neon-medium`, `Workspace:`, `Workflow: review`, chosen `Models:`, and a `Writers:` line holding `unknown` (preserving any known writer beside `unknown`).
