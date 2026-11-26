---
tags: [mstack-write-specs]
max_turns: 15
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Bash]
---

First load the skill mstack-write-specs with your skill tool. We are in the middle of a session of that skill, and you continue it in Phase 2.

Where we are: the spec is about exporting more than 100,000 orders from this folder's `export.js` without running out of memory. Phases 0 and 1 are done and the model skill was checked there. For the facts from outside the repository you called `mstack-research` three times, one item each, and its result blocks are in `research-result.md`, `research-result-2.md` and `research-result-3.md`. The page addresses in them are stand-ins for this test: read each as the page the block says it is.

Give me the facts now, and nothing else: each fact the spec can cite, with its source as the spec will cite it, and then what is still open. Ask no interview question yet, write no file, start no subagent and call no other skill.

Input files: package.json, package-lock.json, export.js, orders.json, research-result.md, research-result-2.md, research-result-3.md, .nvmrc
