---
tags: [mstack-receive-review]
max_turns: 40
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write, Edit]
---

A calling workflow loads the mstack-receive-review skill for the review in ./review.md on the code in ./orders. You receive it as one agent working alone, and the log goes in your reply. The caller's lines for this review:

Review: the leader's own read
Writers: codex
Reviewer vendor: other

Input files: orders/, review.md
