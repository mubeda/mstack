---
tags: [mstack-find-skills]
max_turns: 40
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Bash]
---

Is there a skill for writing Driftwright end-to-end tests (Driftwright is the browser test framework in ./web/package.json) for ./web? Show me the candidates; I will decide later whether to install one.

This test machine keeps its command-line tools in ./bin: run every shell command with PATH="$PWD/bin:$PATH" so that npx and curl come from there.
