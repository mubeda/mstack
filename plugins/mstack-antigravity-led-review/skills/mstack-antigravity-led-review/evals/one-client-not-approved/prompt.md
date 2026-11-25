---
tags: [review-workflow, stand-in]
max_turns: 30
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash, Agent]
---

This run checks a text, not a host. Follow `workflow/SKILL.md` with `workflow/host.md` from its first line, as the Antigravity session it is written for: use the Antigravity column of the host table, and where it names a tool this client does not have, use this client's tool for the same job. The rule that a session in another host stops does not apply to this run. Treat the preflight as passed and do not run it. `agy models` here is a stand-in that prints a fixed listing. Start no lane: a lane's work, report and transcript are the files this prompt names.

Deliver item 1.2 only from `notes/docs/plans/notes/` in Single mode. Stop after the review of item 1.2 is processed and reported (do not push). Approve local commits on the branch. Call the REAL `mstack-vendors` skill (do not mock it).

This is a test machine: run `agy models` and every `check-vendors.mjs` call through `./bin/testenv` (for example `./bin/testenv agy models` or `./bin/testenv node <skill folder>/scripts/check-vendors.mjs ...`). `./bin/testenv` is this session's sandbox: it hides `claude` and `codex`. Whenever `mstack-vendors` needs a run outside the sandbox, request it with `./bin/ask-outside ./bin/testenv <command>`, which stands for the client's approval prompt.

Stop and wait for my reply whenever you ask me a question.

Input files: notes/, workflow/, bin/
