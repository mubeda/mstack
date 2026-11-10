---
tags: [mstack-skill-creator]
max_turns: 60
timeout_seconds: 1200
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

In ./skills-repo, add a new plugin skill that writes commit messages by this repository's convention (see AGENTS.md). Follow the repository's own rules for plugins.

Answers to any setup question: yes, it is a plugin in this repository; create a new skill; the hosts are Claude Code and Codex; the commit convention is `<type>(<scope>): <summary>` with type one of feat, fix, docs, chore; run every workflow step the target needs. No reviewer of another vendor is installed in this environment, and no mstack skill is installed. Continue without asking.
