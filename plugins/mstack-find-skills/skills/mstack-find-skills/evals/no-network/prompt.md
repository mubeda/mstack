---
tags: [mstack-find-skills]
max_turns: 40
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Bash]
---

Find me a skill for writing contract tests for the Quillink RPC service in ./api (api/orders.qlink).

This test machine keeps its command-line tools in ./bin: run every shell command with PATH="$PWD/bin:$PATH" so that npx and curl come from there. Do not install anything.
