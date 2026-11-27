---
type: llm
focus: outcome
weight: 1
---

`work/reader.html` calls `destroy()` on the summarizer session when finished, passes a fresh `AbortController` signal wired to the Stop button to both `create()` and `summarize()`/`summarizeStreaming()` (so stopping during setup or generation cancels cleanly without starting a summary), wraps async calls in `try`/`catch` with clear UI error feedback, and provides a graceful non-AI fallback when Built-in AI is unavailable.
