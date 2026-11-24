---
tags: [skill-creator]
max_turns: 120
timeout_seconds: 2400
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

Plan the implementation of the password reset spec in ./shop/docs/specs/2026-11-09-add-password-reset.md.

Answers to your start-up questions, so you do not need to ask them: put the plan in shop/docs/plans/password-reset/. There are no external sources beyond the repository, and nothing needs research outside it. Reviewer: `gpt-6.2-sol` at `high` effort. Do not install anything; if the cross-vendor reviewer is not available, use the fallback. Where you would ask me a planning question of section 2, take your recommendation and record it as the agent's call; this answers no question about an expensive tier or model.

I approve these phases: phase 1 "reset tokens: creation, storage, expiry (security, stored data)", phase 2 "per-address send limit shared across worker threads (concurrency)", phase 3 "forms and pages". The split into tasks is yours. I approve your outline as you propose it. Phase 1 and each of its tasks get tier most capable; I chose it. If you ask about phase 2, about any of its tasks, or about the fallback reviewer: no. Stop when the plan files of your phase 5 are written, before the check and the review, and tell me what each phase, task and model slot records.

Input files: shop/
