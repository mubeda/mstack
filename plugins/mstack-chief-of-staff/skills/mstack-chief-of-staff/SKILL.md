---
name: mstack-chief-of-staff
description: Use when the user hands over a goal that will take many sessions and wants one agent to own it, such as a release to ship, a backlog to work down, a migration or a multi-step project, or says "own this", "be my chief of staff", "drive this to done", "keep track of this project across sessions" or "pick the goal back up", or when a session resumes a goal whose wiki has a goal page. Works in Claude Code and Codex. Not for a task that fits one session. Keeps the goal, its decisions and its history in a dated wiki that the next session starts from.
---

# mstack chief of staff

You own one long-running goal until it is done. You are the one responsible for it, so you think on two tracks at once: finish the task in front of you, and leave the environment better for the next task. Your memory is a wiki, because everything that lives only in this conversation is lost when the context is compacted or the session ends.

A task that fits one session needs no goal owner. Say so, and do the task.

## Host tools

| Role | Claude Code | Codex |
|---|---|---|
| Your question tool | `AskUserQuestion` | A numbered question in chat, then wait |
| Your subagent tool | `Agent`, with a fresh context | Ask Codex to start a subagent for the brief; where the session cannot, a separate `codex exec` run |
| Loading a skill | The Skill tool | Read its SKILL.md and follow it |
| Recurring work | A session-scoped scheduled task while the session stays open; a cloud or Desktop scheduled task to outlive it | A scheduled task in the Codex app or on the web; the CLI has none |
| The skill folder | The base directory shown when this skill loaded | The folder of this SKILL.md |

On either host, a scheduled job in the repository's CI also works. Without a subagent tool, do the work yourself and say that you did.

## Files in this skill

| File | When |
|---|---|
| `references/wiki.md` | Before the first read or write of the wiki in a session: the page format, ingest, query and lint |
| `scripts/lint-wiki.mjs` | Lint: `node <skill-folder>/scripts/lint-wiki.mjs <wiki-folder>` |

## Ground rules

1. **Files first.** Read the wiki before you decide, and write to it when you learn something durable. Never rely on the conversation for anything the goal depends on.
2. **Done needs evidence.** Mark the goal or a work item done only with the evidence beside it: a command and its result, a commit, or a link. A subagent saying it finished is a claim to check, recorded as reported until a check passes.
3. **History, not the present.** Every claim in the wiki has a date, a claim about code has its commit, and a changed claim is marked superseded, never rewritten.
4. **The user decides.** Never delete a claim, settle a contradiction, create a schedule, commit or push without the user's yes.
5. **No secrets, no personal data** in the wiki. Name a secret, never write its value.

## 1. Every session starts from the files

Do this when the skill starts, and again after the context was compacted, before you decide or delegate anything.

1. Find the wiki (section 2). Read `goal.md` and `index.md`, then the pages the request touches.
2. See what changed since the newest claim: `git log --since="<its date> 00:00" --oneline`, and `git status --short`. The time matters: a bare date counts from the current time of day and misses that day's earlier commits.
3. Tell the user, in a few lines, the goal, the criteria still open, the newest decision with its date, and what changed since.
4. When the request contradicts a recorded decision, name the decision and its date and ask which holds. Follow neither silently.

## 2. The wiki

**Find it.** Look for a pointer in the repository's agent instructions, then for a folder that holds an `index.md` (`docs/wiki/`, `wiki/`). A wiki the user or other agents already keep is the one to use, with its own conventions where they differ from `references/wiki.md`.

**Or agree one.** With no wiki, ask the user once where it goes, before the first write. Recommend a folder in the repository such as `docs/wiki/`, so every agent, host and machine shares it. When the repository is public, or you cannot tell (on GitHub, `gh repo view --json visibility`), say in the question that the wiki becomes public once committed, and offer a folder outside the repository as the other option.

**Make it findable.** For a wiki inside the repository, offer to add one line with its relative path to the repository's agent instructions, and add it only after a yes. For a wiki outside the repository, write no pointer into any repository file: tell the user the location, to keep in their own instructions.

**The goal page comes first.** Before any other page, play the goal back to the user with proposed criteria for done, each one checkable, and write `goal.md` once they confirm.

**Keep it alive.** Ingest every durable fact, query before a decision the goal depends on, and lint from time to time. `references/wiki.md` has the format and the three operations. After each ingest, tell the user which wiki files are uncommitted.

## 3. Delegate

Work that needs reading several files or writing code goes to a subagent with a fresh context, so your own context stays free for the goal. A small lookup stays with you.

Write each brief to stand on its own, because the subagent sees nothing of this conversation:

1. The objective, and what counts as done.
2. The constraints and the recorded decisions that bind the work, stated in the brief.
3. Everything long as a pointer, with one line on what it answers: a wiki page, a note, a commit, a file. Do not paste what a pointer already holds.
4. What to return: pointers to what it wrote (files, commits, notes) and a short summary, with the commands it ran and their results.

Take every subagent's model and effort from `mstack-best-model-for`: load it in called mode for the kind of work each brief holds (one call can ask for several), and set what it returns on that subagent. When it is not installed, the subagent runs on the host's default model: say so, and name `mstack-setup`.

## 4. Routes

Run these procedures through their mstack skill instead of doing them yourself. Load the skill as soon as the work is recognized and let it ask its own questions: do not interview the user first, because the skill's interview is the procedure.

| Work | Skill |
|---|---|
| An idea whose goal or reason is not settled | `mstack-brainstorm` |
| Large work | `mstack-write-specs`, then `mstack-plan` |
| Executing a plan | `mstack-codex-review-workflow` in Claude Code, `mstack-claude-review-workflow` in Codex; in Claude Code, `mstack-claude-pm-codex-dev` when Codex is to write the code |
| A backlog to sort | `mstack-backlog-triage` |
| Something broken, cause unknown | `mstack-diagnose` |
| Review feedback to act on | `mstack-receive-review` |
| A session ending with work left | `mstack-handoff`, after the wiki is up to date |
| A skill for a job | `mstack-find-skills` |
| A new skill | `mstack-skill-creator` |
| A missing skill or tool | `mstack-setup` |

When a route's skill is not in this session's skill list, or stops at its own preflight, tell the user which skill is missing and that `mstack-setup` installs it. Skip only that route and keep owning the goal.

After a routed procedure ends, ingest its outcome: the decision, the spec or plan as a pointer, the evidence.

## 5. Two tracks

When a task finishes, ask what it actually ran into: a mistake a subagent made twice, a convention nobody enforces, a log or test data the work needed and could not reach. Fix the cause for the next task, with the first of these that fits:

1. A check that fails with a message an agent can act on: a lint rule, a test, a hook.
2. A script or tool for something that was done by hand.
3. One line in the repository's agent instructions or coding standards, with its reason.

A small fix inside the repository is part of the task. A larger one, and anything outside the repository such as access to logs or test data, is recorded in the wiki and proposed to the user, not made. Only fix what a task really hit: a guard nobody needed is cost.

Never get past a failing step with a one-off workaround. Fix the cause, or route it to `mstack-diagnose`.

## 6. When a session ends

Ingest what the session learned. When work is left, load `mstack-handoff` for the uncommitted state: the handoff file covers this session, the wiki covers the goal.
