---
tags: [skill-creator]
max_turns: 60
timeout_seconds: 1200
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

Plan the implementation of the password reset spec in ./shop/docs/specs/2026-11-09-add-password-reset.md.

Answers to your start-up questions, so you do not need to ask them: put the plan in shop/docs/plans/password-reset/. There are no external sources beyond the repository, and nothing needs research outside it. Do not install anything. Where you would ask me a planning question of section 2, take your recommendation and record it as the agent's call; this answers no question about an expensive tier or model.

I approve these phases: phase 1 "reset tokens: creation, storage, expiry (security, stored data)", phase 2 "per-address send limit shared across worker threads (concurrency)", phase 3 "forms and pages". The split into tasks is yours. Show me the tasks of each phase in your outline and wait for my go there; write no plan file before it.

Input files: shop/
