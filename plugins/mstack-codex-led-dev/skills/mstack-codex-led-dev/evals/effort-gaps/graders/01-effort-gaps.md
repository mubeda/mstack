---
type: llm
focus: outcome
weight: 1
---

The selection `vendors/sent-*.txt` holds ONLY the listed pairs (`low` and `high`, never `medium`). In `stand-in/requests.jsonl`, Phase 1 (cheap) runs at `low`, Phase 2's fix round runs at `high` (skipping unlisted `medium`), and NO line in `requests.jsonl` or `sent-*.txt` names `medium`.
