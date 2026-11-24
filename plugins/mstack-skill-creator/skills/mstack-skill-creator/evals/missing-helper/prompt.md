---
tags: [mstack-skill-creator]
max_turns: 20
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

Use the mstack-skill-creator skill for this. In ./skills-repo, add a new plugin skill that writes commit messages by this repository's convention (see AGENTS.md). Follow the repository's own rules for plugins.

Answers to any setup question: yes, it is a plugin in this repository; create a new skill; the hosts are Claude Code and Codex; run every workflow step the target needs. No mstack skill other than `mstack-skill-creator` is installed: none is in this session's skill list, and none is installed in a skill folder on disk. Take that as given, without checking the disk for it. Continue without asking.
