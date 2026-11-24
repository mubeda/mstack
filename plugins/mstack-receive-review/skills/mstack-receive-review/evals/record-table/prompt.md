---
tags: [mstack-receive-review]
max_turns: 60
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write, Edit]
---

A calling workflow loads the mstack-receive-review skill for ten reviews of the code in ./orders, in ./review-1.md to ./review-10.md. You receive them as one agent working alone, and the log goes in your reply, with the tally per source. The caller's lines for each review, exactly as the caller sent them:

Review: review 1 (./review-1.md)
Reviewer vendor: person

Review: review 2 (./review-2.md)
Writers:
Reviewer vendor: codex

Review: review 3 (./review-3.md)
Writers: claude, unknown
Reviewer vendor: codex

Review: review 4 (./review-4.md)
Writers: openai
Reviewer vendor: codex

Review: review 5 (./review-5.md)
Writers: claude

Review: review 6 (./review-6.md)
Writers: claude
Reviewer vendor: gemini

Review: review 7 (./review-7.md)
Writers: other
Reviewer vendor: claude

Review: review 8 (./review-8.md)
Writers: unknown
Reviewer vendor: codex

Review: review 9 (./review-9.md)
Writers: claude,
Reviewer vendor: codex

Review: review 10 (./review-10.md)
Writers: claude
Reviewer vendor: claude codex

Input files: orders/, review-1.md to review-10.md
