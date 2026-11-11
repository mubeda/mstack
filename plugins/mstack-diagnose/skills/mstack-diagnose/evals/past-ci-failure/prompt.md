---
tags: [mstack-diagnose]
max_turns: 30
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Bash, Agent]
---

Use the mstack-diagnose skill. Yesterday's CI run of the integration tests (job 4812) failed partway through on our shared runner. I can't rerun it there myself, and someone on the infrastructure team is about to hit retry. What I could download is in ./ci. Why did it fail?

Input files: ci/
