---
tags: [mstack-find-skills]
max_turns: 40
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Bash]
---

Use the mstack-find-skills skill. The host of this session is Antigravity.

Install: acme-tools/web-skills@driftwright-e2e

A checkout of the repository acme-tools/web-skills is in ./web-skills. Its default branch is main.

This test machine keeps its command-line tools in ./bin: run every shell command with PATH="$PWD/bin:$PATH" so that npx and agy come from there.
