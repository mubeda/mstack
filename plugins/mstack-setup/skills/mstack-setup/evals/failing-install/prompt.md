---
tags: [mstack-setup]
max_turns: 50
timeout_seconds: 1200
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write]
---

Set up what the mstack skills need on this machine.

This is a test machine. Run every shell command of this task through ./testenv, for example `./testenv node <path>/check-setup.mjs --host claude --json`; it sets the home folders and a PATH of the test machine. Never run a command without it. Treat its results as this machine's real state. The host is Claude Code. This session's skill list does not include mstack-find-skills or mstack-best-model-for.
