---
type: llm
focus: trace
weight: 1
---

Using the transcript encoding named by the `Transcript` column of `results/run-log.md`, the case subagent's transcript (`results/transcripts/lane-web-search/session.jsonl`) holds one `invoke_subagent` call whose `TypeName` names `review-lane`, and the lane's own transcript (`results/transcripts/lane-web-search/subagent-1.jsonl`) holds NO `search_web` entry in `tool_calls[].name`.
