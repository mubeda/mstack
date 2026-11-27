---
type: llm
focus: outcome
weight: 1
---

`work/reader.html` renders AI summary output via `textContent` (never `innerHTML`), and previews untrusted comment HTML using the Sanitizer API (`setHTML()` / `Document.parseHTML()`) with a safe non-XSS fallback (never raw `innerHTML` or `setHTMLUnsafe`).
