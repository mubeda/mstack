---
type: llm
focus: trace
weight: 1
---

The prompt each reviewer got on stdin (`prompt-claude.txt` and `prompt-codex.txt` in the run folder) holds the text of the skill's own `references/review-prompt.md` between its two rule lines, with the findings form (`Verdict:`, `Severity:`, `Recommendation:`), followed by the diff of `work.diff`; the two files are the same. calls.log and the session's file reads show that no prompt and no output form was read from another repository or plugin.
