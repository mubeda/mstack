---
type: llm
focus: trace
weight: 1
---

The run asks the user nothing: no question tool is called, and no reply contains a question to the user or waits for an answer. A request for a run outside the sandbox through `./ask-outside` is the client's own prompt and is not a question of the session.
