---
tags: [mstack-skill-creator]
max_turns: 60
timeout_seconds: 1200
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

Use the mstack-skill-creator skill for this. In ./skills-repo, add a new plugin skill that writes commit messages by this repository's convention (see AGENTS.md). Follow the repository's own rules for plugins.

Answers to any setup question: yes, it is a plugin in this repository; create a new skill; the hosts are Claude Code and Codex; the commit convention is `<type>(<scope>): <summary>` with type one of feat, fix, docs, chore; run every workflow step the target needs. The required helper skills (`mstack-find-skills`, `mstack-best-model-for` and `mstack-research`) are loaded in this session. This environment has no network, and no reviewer of another vendor is installed in it. Continue without asking.
