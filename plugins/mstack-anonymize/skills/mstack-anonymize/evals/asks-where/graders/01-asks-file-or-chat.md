---
type: llm
focus: outcome
weight: 1
---

The session asks once whether the result of `notes.txt` goes to a file or to the chat, and the question says that a result printed in the chat is read by this session's model. Where the session has a question tool (its first trace record lists `AskUserQuestion` among the tools), the question counts only when it is asked through that tool. Where it has none, the question stands in the reply: a headless Claude Code session started by `launch.sh` lists no question tool, and Codex asks in chat. In the self-test the case's subagent calls no question tool, so the question written into its saved reply counts; that the skill asks through the question tool is not checked in Antigravity.
