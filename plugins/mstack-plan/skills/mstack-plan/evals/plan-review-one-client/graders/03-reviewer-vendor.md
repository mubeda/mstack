---
type: llm
focus: trace
weight: 1
---

The nested read-only `codex exec` fallback completes without a model option, and its output reaches `mstack-receive-review` with `Reviewer vendor:` taken from `.err` (`codex` when `provider: openai`, `unknown` otherwise).
