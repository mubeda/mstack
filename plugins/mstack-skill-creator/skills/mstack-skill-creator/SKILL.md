---
name: mstack-skill-creator
description: Use when the user wants to create a new agent skill, write or fix a SKILL.md, improve, test or benchmark an existing skill, turn a workflow they keep repeating into a skill, or add a skill as a plugin to an mstack-style marketplace repository, in Claude Code, Codex, Antigravity, OpenCode or Cursor, even if they only say "make this a skill". Produces one skill folder that all five hosts load, with evidence from a run with and without it.
---

# mstack skill creator

You create or improve one agent skill: a folder with a `SKILL.md` that Claude Code, Codex, Antigravity, OpenCode and Cursor all load. You test it against a baseline before you call it finished. In a repository laid out like mstack you also package it as a plugin. You never commit, push or publish.

## Host tools

This file is the same on every host. It names roles. The table says which tool plays each role, and the host file in `references/` has the detail.

| Role | Claude Code | Codex | Antigravity | OpenCode | Cursor |
|---|---|---|---|---|---|
| Your question tool | `AskUserQuestion`, or a numbered round in chat | A numbered round in chat, then wait | A numbered round with `ask_question`, then wait | A numbered round in chat, then wait | A numbered round in chat, then wait |
| Your subagent tool | `Agent`, with `model` and `effort` from `mstack-best-model-for` set on every call | The session's agent tool, or a separate `codex exec` run | `invoke_subagent`, on the subagent tier from `mstack-best-model-for` | None: use the fresh-session command | None: use the fresh-session command |
| Loading a skill | The Skill tool | Read its SKILL.md and follow it | Read its SKILL.md with `read_file` and follow it | The `skill` tool | By its description, or `/<name>` |
| The fresh-session command | `claude -p` | `codex exec` | None: use your subagent tool, or hand the prompt to the user | `opencode run` | `cursor-agent -p` |
| The cross-vendor reviewer | From `mstack-vendors` (Phase 8) | From `mstack-vendors` (Phase 8) | From `mstack-vendors` (Phase 8) | A read-only run of another vendor's own client that is installed: `codex exec`, else `claude -p` | A read-only run of another vendor's own client that is installed: `codex exec`, else `claude -p` |
| Your vendor for `mstack-best-model-for` | `claude` | `codex` | `antigravity` | Not used | Not used |
| The host file | `references/host-claude-code.md` | `references/host-codex.md` | `references/host-antigravity.md` | `references/host-opencode.md` | `references/host-cursor.md` |
| The skill folder | The base directory shown when this skill loaded | The folder of this SKILL.md | The folder of this SKILL.md | The folder of this SKILL.md | The folder of this SKILL.md |

Read your host file once in Phase 0. On a host the table does not list, follow the portable path (no subagents, a numbered round for questions, the comparison test handed to the user) and say which parts were untested there.

In Claude Code, Codex and Antigravity, before the first subagent, fresh-session run or Phase 8 `mstack-vendors` call, load `mstack-best-model-for` in called mode once (`Vendor: both` in Claude Code and Codex, `Vendor: all` in Antigravity), requesting the tier `standard` (the comparison and test runs on this host's vendor) and the task description `code review` (for the reviewer vendors of Phase 8's `Models` line: `codex` alone in Claude Code, `claude` alone in Codex, both `claude` and `codex` in Antigravity). Set what its "How to set" column gives on each of those runs: on a subagent the model and effort, or in Antigravity the subagent tier; on a headless run of the Claude Code client or in a `Models` entry for `claude`, always use the full headless model id from `Claude headless id` / `How to set`, never an alias, because an alias can run another model there.

## Files in this skill

| File | Read in |
|---|---|
| The host file for this host (table above) | Phase 0, and wherever a phase says "the host file" |
| `references/workflow-steps.md` | Phases 0, 1 and 2: optional steps, the existing-skill check, the mstack skills per step and their fallbacks |
| `references/writing-rules.md` | Phase 3, and before Phase 9 |
| `references/testing.md` | Phases 5 and 6 |
| `references/plugin-packaging.md` | Phase 0 for a plugin target, Phases 7 and 8 (package, then review) |
| `scripts/check-skill.mjs` | Phase 4: `node <skill-folder>/scripts/check-skill.mjs <created-skill-folder>` |
| `scripts/scan-private.mjs` | Phase 4, for a public repository: `node <skill-folder>/scripts/scan-private.mjs <folder>` |
| `scripts/vendor/anthropic-skill-creator/` | Phase 6, the benchmark and review page, copied unchanged from Anthropic's skill creator |

## Ground rules

1. **Confirm the target before you write.** No file of the created skill exists until the user confirmed where it goes.
2. **Evidence before "finished".** A skill is finished only after the static check passed and a comparison test ran and its result was shown. Otherwise call it untested.
3. **Use what is installed.** When an mstack skill covers a step and the host file lists it as supported here, run it. Otherwise use the fallback in `references/workflow-steps.md`, and say so. The five required shared skills have no fallback: without them Phase 0 stops.
4. **Self-contained.** Everything the created skill uses sits in its own folder. Other skills are named, never pointed at by path. The one exception is an agent definition of a plugin skill, which Claude Code loads only from the plugin's `agents/` folder: the skill names it by its listed type and states what it does without it.
5. **Copy nothing unlicensed.** Adapted text is rewritten and credited inside the created skill's folder.
6. **No private data in a public repository.** Names of people and companies, home paths, private hosts and credentials stay out.
7. **Never overwrite without a yes.** An existing folder at the target location is shown to the user first.
8. **No outward action.** Never commit, push, open a pull request or publish. Offer the next step.
9. **A called skill's result block is not your answer.** `mstack-find-skills`, `mstack-best-model-for`, `mstack-research` and `mstack-vendors` each end with a result block. It ends the called skill, not your run: read it, and go straight on with your own next step. Your turn ends only at a question to the user, at a stop this file names, or with the Phase 9 report.

## When the request does not fit

- A rule, command, subagent or hook, not a skill: say it is out of scope, and offer to write a skill that does the same job.
- A name that breaks the rules or is longer than 64 characters: propose a valid one and ask.
- A target folder you cannot write to: report the error, and write nothing anywhere else without asking.
- A host that is none of the five: follow the portable path, and say which parts are untested there.
- No network: report research, the public search, install offers and, in Claude Code, Codex and Antigravity when no `mstack-vendors` block can be had, the review as not run with the reason (OpenCode and Cursor keep their built-in review steps), and continue the local steps.
- An interrupted session: continue from the files already written, and offer `mstack-handoff` when it is installed.

## Phases

| Phase | Work | Gate |
|---|---|---|
| 0. Start | Read the host file. Detect the target, confirm it, and ask the setup questions | The user confirmed the target. Nothing is written yet |
| 1. Existing-skill check | Look for a skill that already does the job | The user chose use, improve or create |
| 2. Understand | The interview, and research, spec and plan when they run | Purpose, triggers, inputs, outputs and at least one test task are agreed |
| 3. Write | The skill folder, by the writing rules and the host file | The files exist at the confirmed place |
| 4. Check | The static check, and the private-data scan for a public repository | Both pass, or every remaining line is shown to the user |
| 5. Comparison test | Run the test tasks with and without the skill | Both runs have results, or the skill is reported as untested |
| 6. Benchmark and page | Plugin target, or accepted for a local one | The page exists, or the report says why not |
| 7. Package | Plugin target only | The repository's checks pass, or their failing output is in the report |
| 8. Review | Plugin target, or accepted for a local one | Every finding is fixed, rejected with a reason, or listed, and the checks pass again after the fixes |
| 9. Report | The outcome of every step | The report is sent and nothing was committed |

### 0. Start

1. Read the host file for this host. In Claude Code, Codex and Antigravity, then check the five shared skills this skill calls, `mstack-find-skills`, `mstack-best-model-for`, `mstack-research`, `mstack-vendors` and `mstack-receive-review`, as `references/workflow-steps.md` › Required shared skills says. A missing one stops the run there, with its install block and nothing written, also when the user said to continue without asking. In OpenCode and Cursor this check does not apply.
2. Detect the target as `references/plugin-packaging.md` describes: a plugin target (both registries exist) or a local target.
3. Ask in one round with your question tool, skipping what the user already said:
   - Create a new skill, or improve an existing one (which)?
   - The target, with your detection as the recommendation. For a plugin target, show the repository's rules and checks you found.
   - For a local target, the scope (this project or the user's home) and the hosts (recommend all five).
   - For a local target, the optional steps of `references/workflow-steps.md` › Optional steps, and the public search, in the same question.
4. When the host file names a native skill creator and it is installed, name it and offer its host-only tools for the steps they cover (for example its description optimizer in Claude Code). When none is installed, make no offer.
5. Wait for the answers. Write nothing before the target is confirmed.

### 1. Existing-skill check

In Claude Code, Codex and Antigravity, load `mstack-find-skills` in called mode: say that `mstack-skill-creator` is calling, give the agreed purpose as one work item, and add the line `Also read: <every folder of the target repository that holds a SKILL.md>`, so a skill that sits in the repository and is not installed is still found. Add the line `Online search: off (the user declined the public search)` unless the user accepted it. Read its result block and tell the user its outcome in one line. In OpenCode and Cursor, follow `references/workflow-steps.md` › Existing-skill check, and run its public search only if the user accepted it. On a match, ask whether to use it, improve it or create a new skill, and wait.

### 2. Understand

1. Interview the user until these are settled: what the skill does, the situations and phrases that should trigger it, its inputs and outputs, what it must never do, the hosts, and at least one realistic test task (two or three for a plugin). Ask in numbered rounds, each question with your recommendation.
2. The interview runs for every target, even when the user declined every optional step. A plugin target always runs research, a written spec and a plan. A local target runs them only when accepted. Use the mstack skill for each step when installed and supported here (`references/workflow-steps.md`), otherwise its fallback.
3. For a workflow the user already did in this conversation, take the steps, tools and corrections from the conversation first, and ask only for the gaps.

### 3. Write

1. For an improvement, copy the current version to a snapshot outside its folder before the first edit (`references/testing.md` › The baseline).
2. Choose the location. A local skill goes to `.agents/skills/<name>/` at the chosen scope, which Codex, OpenCode and Cursor load at both scopes and Antigravity at project scope. Add a link from `.claude/skills/<name>` when Claude Code is one of the hosts, and at user scope a link from the user skill folder in the Antigravity host file when Antigravity is one. A plugin skill goes in `<plugin>/skills/<name>/`. Details are in each host file.
3. If a folder with that name already exists there, show what is in it and ask. Never overwrite it without a yes.
4. Write the files by `references/writing-rules.md`: two frontmatter fields by default, a "Use when" description with triggers first and no step summary, a host table only when a step needs a host tool, everything inside the folder (ground rule 4 names the one exception), adapted text rewritten and credited.

### 4. Check

1. Run `node <skill-folder>/scripts/check-skill.mjs <created-skill-folder>`. Fix every FAIL line and run it again. Tell the user about each WARN line.
2. When the target repository is public, run `node <skill-folder>/scripts/scan-private.mjs <created-skill-folder>` and fix every hit. Check public or private with the hosting service's command-line tool when one is available (for GitHub, `gh repo view --json visibility`), otherwise ask. Unknown counts as public. Then read the skill for names of people, companies, customers and internal products, which no pattern finds, and compare with the names you met in this session.
3. Read the description once more. If it lists the skill's steps, rewrite it.

### 5. Comparison test

Follow `references/testing.md`. Use the first method the host allows: the subagent tool, then the fresh-session command in the host file, then a prompt the user runs. A host whose host file gives no fresh-session command skips that method: never start a second session of that host yourself. Show the user both results and what the skill changed. A prompt handed to the user counts only once the results come back.

### 6. Benchmark and review page

For a plugin target, or when the user accepted it: grade every run, then build the benchmark and the static review page with the copied tools, as `references/testing.md` › Benchmark and review page describes. Give the user the page's path. Without Python 3, grade inline and say the page was not produced.

### 7. Package

Plugin target only. Add every file the repository requires, set the versions, and run the repository's checks until they pass, as `references/plugin-packaging.md` describes. When one still fails, the skill is not ready to commit.

### 8. Review

For a plugin target, or when the user accepted it: get a read-only review of everything the earlier phases wrote, packaging included, following `references/plugin-packaging.md` › Cross-vendor review for this host. In Claude Code, Codex and Antigravity, follow `Claude Code, Codex and Antigravity` there (`mstack-vendors` and `mstack-receive-review`, making no reviewer choice of your own, and reporting the review as not run with the reason if no block can be had). In OpenCode and Cursor, follow `OpenCode and Cursor` there and the host file. After fixing verified findings, run the static check, the scan and, for a plugin target, the repository's checks again.

### 9. Report

Check the created skill against `references/writing-rules.md` › Before you finish. Then report:

1. The skill's name, its folder and the hosts it is for, in one line, and whether it is finished, untested or not ready to commit.
2. Every phase with its outcome, or "not run" and the reason: one line per phase, Phases 0 to 8, and none left out. For a plugin target add one line each for research, the spec, the plan, the versions and the repository's checks. Name each step that used a built-in fallback, and each host that was not tested.
3. The static check and scan result lines, the comparison test results, and the review page's path when there is one.
4. The review findings and what happened to each.
5. For a plugin target, the repository's check result lines, and for the Antigravity manifest its validator's result line or "not validated". A validated manifest is not a test in Antigravity.
6. The next step, offered and not taken: install the skill for more hosts, commit, or open a pull request, only when the user asks.
