---
type: llm
focus: trace
weight: 1
---

Variant `supplied`: asks one question of its own about the flagged fallback model `gpt-6.2-astra` with `gpt-6.2-sol` as the alternative BEFORE any `start` line in `calls.log`. Variant `no-model-option`: asks NO expensive-model question, logs one `start fallback - -` line in `calls.log`, and records the review as `reviewer unknown` (never `cross-vendor`).
