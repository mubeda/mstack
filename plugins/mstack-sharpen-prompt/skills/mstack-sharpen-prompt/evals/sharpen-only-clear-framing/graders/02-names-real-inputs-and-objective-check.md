---
type: llm
focus: outcome
weight: 1
---

Shared comparison check: the rewritten prompt is grounded in the actual `work/parser.js` implementation (calling out real edge cases present in `parseConfig`, such as values containing `=`, lines missing `=` causing `value.trim()` to throw, CRLF line endings, duplicate keys, empty values, or prototype keys like `__proto__`), names `node --test` from `package.json` as the objective check, and distinguishes empirically testable behavior from contract decisions the user must settle.
