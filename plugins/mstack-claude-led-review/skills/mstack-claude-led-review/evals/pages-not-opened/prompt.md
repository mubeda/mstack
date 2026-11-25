---
tags: [review-workflow]
max_turns: 20
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Write, Bash]
---

Use this host's review workflow and its `references/external-facts.md` rules on `notes/docs/plans/notes/` in Workflow mode. Three broad-research results from `mstack-research` are already saved in `research-1.md`, `research-2.md` and `research-3.md` (do not run `mstack-research` or fetch the web). Summarize what goes to lanes as settled facts versus what stays unconfirmed / open to ask the user, then stop without spawning lanes.

Input files: notes/, research-1.md, research-2.md, research-3.md
