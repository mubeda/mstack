---
tags: [mstack-write-issue]
max_turns: 30
timeout_seconds: 600
allowed_tools: [Bash, Read, Write, Glob, Grep, Skill]
---

test_retry_after_timeout failed again: 4 of 25 runs on my machine, Python 3.12.4, each time with "AssertionError: expected 2 attempts, got 1". All four failures happened while the nightly sync job was running. File an issue for it.
