---
tags: [mstack-setup]
max_turns: 50
timeout_seconds: 1200
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write]
---

Check what the mstack skills need here and install anything missing.

This is a test machine. Run every shell command of this task through ./testenv, for example `./testenv node <path>/check-setup.mjs --host antigravity --json`; it sets the home folder and a PATH of the test machine. Never run a command without it. Treat its results as this machine's real state. The host is Antigravity. This session's skill list holds every mstack skill. ./testenv is this session's sandbox: it does not show the `claude` and `codex` clients, which sit under the user's home folder. When a step needs a run outside the sandbox, request it with `./ask-outside <command>`, which stands for the client's approval prompt and prints the user's answer.
