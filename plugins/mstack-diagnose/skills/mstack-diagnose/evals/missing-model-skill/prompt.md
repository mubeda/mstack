---
tags: [mstack-diagnose]
max_turns: 20
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Bash, Agent]
---

The tests in this folder fail now and then, and I need to know why. Find the cause.

On this machine mstack-best-model-for is not installed: it is not in this session's skill list and no folder of it exists on disk. Every other skill and tool is installed.
