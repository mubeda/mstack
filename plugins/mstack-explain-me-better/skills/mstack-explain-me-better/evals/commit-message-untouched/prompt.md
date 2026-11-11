---
tags: [mstack-explain-me-better]
max_turns: 20
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write, Edit]
---

Use the mstack-explain-me-better skill. This is the conversation so far:

User: explain me better what that test failure meant
Assistant: The test failed because the cart ignored the quantity. One line was wrong and it is fixed now. The simple style is on now. Say "stop" to turn it off.

Now the next user message:

User: write the commit message for the staged change in ./shop. Do not commit.

Input files: shop/
