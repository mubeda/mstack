---
tags: [mstack-skill-creator]
max_turns: 50
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

Use the mstack-skill-creator skill for this. In ./skills-repo, add a new plugin skill named `agy-note` that summarizes an Antigravity session into a three-bullet note. Follow `AGENTS.md` (including its `## Single-host plugins` declaration for `agy-note`).

Answers to any setup question: yes, it is a plugin target in `./skills-repo`; create a new skill named `agy-note`; host is Antigravity only as `AGENTS.md` declares; inputs are the session notes, outputs are three bullets (Goal, Done, Next), never invent facts not in the notes; test task: summarize a short two-line session note into three bullets; skip web research, written spec and plan (offline environment, no network). Package the plugin and run `node scripts/check-plugins.mjs`, then finish Phase 8 and Phase 9. Continue without asking and do not commit or push.

Input files: skills-repo/
