---
tags: [mstack-vendors]
max_turns: 20
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Bash]
---

Called by: a test of mstack-vendors
Host: antigravity
Workspace: workspace

Job: code review
Writers: codex
Workflow: dev
Models: claude=claude-test-model high; codex=gpt-test-codex high

(End of the called message. What follows is about this test and is not part of the message.) Load the skill mstack-vendors and answer the called message above. This is a test machine: run every shell command of this task through ./testenv, for example `./testenv node <skill folder>/scripts/check-vendors.mjs --host <host> --workspace workspace`; it sets the home folder and a PATH of the test machine. Never run a command without it. Treat its results as this machine's real state.
