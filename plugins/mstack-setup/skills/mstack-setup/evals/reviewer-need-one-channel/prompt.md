---
tags: [mstack-setup]
max_turns: 50
timeout_seconds: 1200
allowed_tools: [Read, Glob, Grep, Skill, Bash, Write]
---

Load the skill mstack-setup in called mode and return its result block.

Called by: example-review-workflow
Needs: reviewer

This is a test machine. Run every shell command of this task through ./testenv, for example `./testenv node <path>/check-setup.mjs --host antigravity --json`; it sets the home folder and a PATH of the test machine. Never run a command without it. Treat its results as this machine's real state. The host is Antigravity. This session's skill list holds every mstack skill. When a step needs a run outside the sandbox, request it with `./ask-outside ./testenv <command>`, which stands for the client's approval prompt: it prints the user's answer and, when the answer is yes, runs the command.
