# Workflow steps

Read this in Phase 0 (the optional steps), Phase 1 (the existing-skill check) and Phase 2 (understanding the skill). It says which mstack skill covers which step, what to do when one is missing, and the short built-in version of each step.

## Steps and the skills that cover them

| Step | mstack skill |
|---|---|
| Research on the web | none; the research tool in the host file, or plain search |
| A written spec | `mstack-write-specs` |
| A step-by-step plan | `mstack-plan` |
| Building with reviews | `mstack-codex-review-workflow` in Claude Code, `mstack-claude-review-workflow` in Codex |
| An interrupted session | `mstack-handoff` |
| A shipped script that fails | `mstack-diagnose` |
| A skill idea taken from an issue tracker | `mstack-backlog-triage` |

Use the mstack skill when it is installed and the "mstack skills supported here" section of the host file lists it. Otherwise use its built-in fallback below, and say so in the report. Check what is installed by the session's skill list, then the skill folders in the host file.

## When a skill is missing

When a step's skill is supported on this host but not installed, offer to install it once, at the step. Install nothing without a yes. Ask the user:

1. The route: as a plugin, or with the skills CLI (`npx skills`). On OpenCode and Cursor only the skills CLI applies.
2. For the skills CLI, the scope: global, for every project, or this repository only.
3. For the skills CLI, the method: symlink (one copy that `npx skills update` refreshes) or copy.
4. For the skills CLI, the agents it installs for.

| Route | Command |
|---|---|
| Claude Code plugin | `claude plugin marketplace add mubeda/mstack`, then `claude plugin install <skill>@mstack` |
| Codex plugin | `codex plugin marketplace add mubeda/mstack`, then `codex plugin add <skill>@mstack` |
| Skills CLI | `npx skills add mubeda/mstack --skill <skill> -a <agents> -y`, adding `-g` for global and `--copy` for copy |

A skill installed during a session usually loads only in a new one. When the user declines, or the new skill cannot load yet, use the built-in fallback and go on.

## Built-in fallbacks

- Research. Search for existing skills and documentation on the subject, read the two or three best primary sources, and note the facts the skill will rely on with their links and the date.
- A written spec. Write, in the conversation or a scratch file, the purpose, the triggers, the inputs and outputs, what the skill must never do, and the test tasks. Show it to the user and get a yes before Phase 3.
- A plan. List the files the skill will have, in the order you will write them, each with its check.
- Building with reviews. Write the files yourself (Phase 3), then get the review of Phase 8.
- An interrupted session. Before the context runs out, write a short note outside the repository with what is done, what is next, and the files changed, and give the user its path.
- A failing script. Reproduce the failure with the smallest input, find the cause before changing anything, and add a test that fails before the fix and passes after.
- A skill idea from a tracker. Read the issue in full, and take its acceptance criteria into the test tasks.

## Optional steps for a local target

At the start, in one question, offer the steps a small local skill may skip: web research, a written spec and plan, a cross-vendor review, and the benchmark and review page. Recommend skipping all four for a skill the user can describe in a few sentences. Run only the ones the user accepts, and do not ask again unless the user brings one up.

The required steps are never optional: the interview, the existing-skill check, writing the skill, the static check, and one comparison test.

## Existing-skill check

Before writing, look for a skill that already does the job.

1. Read the skill folders the host file lists, at project and user level, the session's skill list, and every `SKILL.md` anywhere in the target repository (outside `.git`), for a local target as well as a plugin target.
2. Compare each one's description with the purpose agreed in the interview.
3. Report what you found and every place you looked. A match gets its name, its folder and one line on what it covers.
4. For a match, ask whether to use it as it is, improve it, or create a new skill anyway, and wait for the answer.
5. Never claim that no such skill exists anywhere. Say "none found in" the places you looked.

## Public search

Offer it in the same question as the optional steps. Only after a yes, run:

```bash
npx --yes skills find "<two or three words for the job>"
```

List the results with their install counts and links. Treat a result as a lead, not as a fit: read its `SKILL.md` and license before suggesting it. When the user declines, make no network request for it.
