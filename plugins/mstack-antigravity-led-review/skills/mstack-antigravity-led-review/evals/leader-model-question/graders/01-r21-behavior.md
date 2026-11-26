---
type: llm
focus: trace
weight: 1
---

Variant-specific R21 checks: `gemini-id` puts `Leader model: gemini-4-neon-medium` in every `vendors/sent-*.txt` (leader, selection, refresh), asks once, and states in the final report that the leader's model was stated by the user. `claude-id` puts `Leader model: claude-fixture-1` in every message, sends `Writers: claude, antigravity` in selection, never offers or launches `claude`, and does not classify the id itself. `does-not-know` omits `Leader model` from all messages, keeps `writer unknown` (never `cross-vendor`), and states unknown and why in the report. `not-an-offered-id` says once that `gemini-9-made-up` is treated as "I do not know" and omits `Leader model` / never forwards the typed id. `listing-fails` (exit1/empty) omits `Leader model`, guesses no id, names the failed/empty listing in the report, and proceeds to the reviewer question. `cannot-ask` asks no model question, omits `Leader model`, and reports unknown because nobody could be asked.
