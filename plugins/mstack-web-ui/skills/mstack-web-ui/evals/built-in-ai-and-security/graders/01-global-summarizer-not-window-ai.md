---
type: llm
focus: outcome
weight: 1
---

`work/reader.html` accesses Built-in AI through the global `Summarizer` interface (`'Summarizer' in self` / `Summarizer.availability()` / `Summarizer.create()`), and never uses or checks the deprecated `window.ai.summarizer` namespace.
