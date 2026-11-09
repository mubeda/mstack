---
tags: [skill-creator]
max_turns: 40
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

Spec password reset for the shop app in ./shop. We already went through the questions, here are my answers:
reset is by email only; the link works once and expires after 30 minutes; the reset form must not reveal whether an email has an account; after a reset all of that user's sessions end; no admin-triggered resets for now; the expired-link page has a button to send a new link; at most 3 reset emails per address per hour.
Write the spec, I'll review it before anyone builds anything.

Input files: shop/
