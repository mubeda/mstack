---
name: mstack-codex-review-workflow
description: Use when the user hands over work to deliver in a repository with writer subagents and Codex review, whether a list of issues (GitHub or another tracker, as numbers, links, a table or a screenshot), an execution plan or task file, or one larger task, or says "fan out agents", "solve these issues", "execute this plan" or "process the backlog", or asks for Codex review of agent work or serialized CI, or mentions mstack, even if they do not name this skill. Runs in Claude Code only; in Codex, use mstack-claude-review-workflow instead.
---

# mstack Codex review workflow

This skill runs in Claude Code only, because it uses Claude Code's own tools. If you are running in Codex, stop here, tell the user, and use `mstack-claude-review-workflow` instead.

You are the coordinator. Subagents write code. You partition, brief, review, integrate and report. Codex is a read-only second pair of eyes, called the cross-vendor reviewer in the reference files. The deliverable is one integration branch that completes every work item, reviewed and validated. When the repository takes pull requests, it ships as one PR, pushed once every item is finished, with CI used one run at a time.

The repository's own rules (AGENTS.md, CLAUDE.md, CONTRIBUTING, delivery skills) and the rules of a plan you execute still apply, and win over this skill where they are stricter.

## Files in this skill

`<skill-dir>` below means this skill's own folder, the base directory the host showed when it loaded this skill. Use its absolute path in every brief, because lanes run in other worktrees.

| File | Who reads it | When |
|---|---|---|
| `references/working-style.md` | You and every lane | Always, before any work |
| `references/writing.md` | You and every lane | Every message to the user, lane report, PR body, commit, tracker comment and doc |
| `references/receiving-review.md` | You and every lane | Before acting on any review |
| `references/grilling.md` | You, design-heavy lanes | A requirement or design is ambiguous or has several defensible answers |
| `references/external-facts.md` | Any lane facing an external unknown, you for cross-lane research | The answer depends on facts outside the repository |
| `references/web-ui.md` | Web UI lanes, you when reviewing UI diffs | Any web or frontend UI change |
| `references/plan-format.md` | You | The work items are an `mstack-plan` folder |
| `scripts/check-required-skills.sh` | You | Preflight |

Read `working-style.md` and `writing.md` now. They govern the whole run. The rules in these files are adapted from third-party skills, credited in this skill's `THIRD_PARTY_NOTICES.md`.

## Work items

A work item is one unit of work with its own acceptance criteria and its own entry in the status table. The run starts from one of these sources.

| Source | Examples | How you read it at intake | Item IDs |
|---|---|---|---|
| Tracker issues | GitHub issue numbers or links, an issue table or screenshot, issues in another tracker | On GitHub, `gh issue view <n> --json number,title,body,labels,comments,state`. For another tracker, use its CLI or connected tool if the session has one, otherwise ask the user to paste each issue. A table or screenshot is only a pointer list. The issue body and comments are the requirements | The tracker's IDs (`#41`, `PROJ-12`) |
| A plan | An execution plan, a tasks file, phase files, a plan folder | Read the whole plan and every file it points to. Each task or phase becomes an item, with the plan's own acceptance criteria, file lists, order and validation commands as the requirements | The plan's own task or phase IDs |
| One task | A feature, a refactor or a bug described in the request | Split it into the smallest items that each give an independently verifiable result, and confirm the list with the user in the grilling round | `T1`, `T2`, and so on |

When the plan tracks status itself (checkboxes, a status column, a tasks file), you own that file. Update it as items change state and commit it at integration. Lanes never edit it.

An `mstack-plan` folder (it holds `plan.md`, `progress.md` and `execute-plan.md`) follows `references/plan-format.md`, so read that file at intake and run its resume and staleness checks first. Each task is a work item, with its task ID as the item ID. Its Satisfies line and the spec's matching requirements are the acceptance criteria, its Files are the predicted files, its Depends on lines and the phase rounds are the dependencies, and its Done when is the evidence. `progress.md` is the plan's status file. Set its `Executor` line to this skill and its `Branch` line to the integration branch, skip Closed tasks after checking their work is on that branch (bring in any that a stopped run closed but never integrated), resume In progress tasks from their log lines, and update the task's row and append a log line with the evidence every time an item changes state, in the same message as the status table. A Closed line names the lane branch and its accepted commits, because the task is closed before integration. Without such a folder, the run works exactly as described for its source.

## Status table

Show the status of every work item in one table, using exactly three states.

| State | Meaning |
|---|---|
| Open | Not started yet, or blocked. The note says why when it is blocked |
| In progress | A lane (or you, in Single mode) is working on it, or it is in review or a fix round |
| Closed | Its work is accepted. It passed your review and the second opinions, its findings are resolved, and its validation ran green |

```markdown
| Item | Title | State | Lane | Note |
|---|---|---|---|---|
| #41 | Second save loses changes | In progress | A, sonnet | Codex review running |
| #42 | Reset to defaults button | Open | B, sonnet | Waits for lane A's store change |
```

1. Print the whole table at the end of intake, with every item Open.
2. Print it again, whole, in every message where at least one item changes state, right after the message's position line. Do not print it when nothing changed.
3. An item sent back by review stays In progress. An item that cannot be completed here stays Open, with the reason in its note.
4. These are the workflow's states. They do not change the item in its tracker. A GitHub issue closes when the PR that closes it merges.
5. The final report includes the same table.

## 0. Ask before starting

Before the preflight or any other work, send one message that restates the user's goal and the smallest change that meets it (see `working-style.md`), and in that same message ask with `AskUserQuestion`. The items are read only at intake, so restate the goal from what the request says and refine it after intake.

1. Which model Codex reviews with. Offer `gpt-6.1-sol` as the recommended answer and `gpt-6-astra` as the alternative, and accept any other model name the user types.
2. Which reasoning effort Codex uses. Offer `high` as the recommended answer, then `medium`, `xhigh` and `max`, and accept any other level the user types.
3. Which execution mode to run. Recommend Workflow mode when the work has two or more items whose predicted files do not overlap, and Single mode otherwise.

Skip a question only when the user's request already answers it. A hand-off from an `mstack-plan` `execute-plan.md` counts as the request, so the answers the user gave there about the reviewer model, the effort and the commits answer those questions here. A request that names the Codex model or effort answers that question. "Fan out agents", "parallel" or "workflow" mean Workflow mode, and "one by one", "single" or "no subagents" mean Single mode. The Codex sandbox is always `read-only` and is never asked.

Record the answers as `<codex-model>` and `<codex-effort>`. Every Codex review in the run uses them, so you do not ask again per review. These two answers are the model and effort choice the `codex` skill asks for. If the first Codex run rejects the model or the effort, rerun with the alternative model from question 1 (or the next lower effort), use it for the rest of the run, and say so in the final report. Reviews never wait on the user.

- Workflow mode runs parallel writer lanes in their own worktrees, as described in sections 2 to 6. It is fastest for many independent items and costs more tokens and machine resources.
- Single mode means you deliver the items yourself, one after another, on one branch, in the order the partition suggests. No writer subagents. Everything else still applies: the reference files, the status table, advisor and Codex reviews processed with `receiving-review.md`, local validation, one PR, serialized CI. Read-only helpers (Codex review, a cheap log reader) are still fine. You are the only lane, so the lane rules in the reference files apply to you, you fix review findings yourself, and the rule against patching lane code applies only in Workflow mode.

State the chosen mode and the Codex model and effort in your first message after the answers and in the final report.

## Preflight: required tools

Run the checker from the repository root. Add `--github` when the items are GitHub issues or the PR goes to GitHub. Add `--web-ui` when any item touches web UI.

```bash
bash <skill-dir>/scripts/check-required-skills.sh [--github] [--web-ui]
```

The checker finds the skill files and checks that the CLIs it needs are logged in. Also confirm that each skill appears in this session's available-skills list, because a skill installed after the session started loads only in a new session (or after `/reload-plugins` for plugins). Look for `mstack-diagnose:mstack-diagnose` and `skill-codex:codex` (or `codex` when installed as a standalone skill). The `codex:` skills from OpenAI's own Codex plugin are a different plugin and do not count.

Required always: `ponytail`, `mstack-diagnose` from this marketplace, and the `codex` skill from the skill-codex plugin with a logged-in `codex` CLI. Required for GitHub: a logged-in `gh`. Required for web UI work: `ui-ux-pro-max` and Python 3.

If anything is missing:

1. Tell the user exactly which items are missing and ask (`AskUserQuestion`) whether to install them now.
2. If they agree, install them with the commands below, re-run the checker, and continue only when it passes. If a new session is needed for the skills to load, say so and stop there.
3. If they decline, print the install instructions below for the missing items and stop. Without them, the reviews and code style this workflow guarantees would silently not happen.

When the user agrees, ask in the same round how they want each skill installed (`AskUserQuestion`). An agent cannot answer the skills CLI's own prompts, because run by an agent it installs without asking, so these answers are the user's only way to choose.

1. The route: as a plugin (recommended when the table offers one, because it updates with its marketplace), or with the skills CLI (`npx skills`), which installs only the skill folder.
2. For the skills CLI, the scope: global, for every project (recommended), or this repository only (into `.agents/skills` and `.claude/skills` in the repository, recorded in `skills-lock.json`).
3. For the skills CLI, the method: symlink (recommended, one copy that `npx skills update` refreshes), or copy (independent files, for file systems or sync tools that do not follow symlinks).
4. For the skills CLI, the agents: Claude Code only (recommended), or Claude Code and Codex.

Then run `npx skills add <source> --skill <skill> -a <agents> -y`, adding `-g` for global and `--copy` for copy, where `<agents>` is `claude-code`, `codex`, or `claude-code codex`. A skill installed during the session loads only in a new session.

| Missing | Install |
|---|---|
| `ponytail` | Plugin: `claude plugin marketplace add DietrichGebert/ponytail` then `claude plugin install ponytail@ponytail`. Skills CLI: source `DietrichGebert/ponytail`, skill `ponytail` |
| `mstack-diagnose` | Plugin: `/plugin marketplace add mubeda/mstack` then `/plugin install mstack-diagnose@mstack`, then `/reload-plugins`. Skills CLI: source `mubeda/mstack`, skill `mstack-diagnose` |
| `codex` skill (skill-codex) | Plugin: `/plugin marketplace add skills-directory/skill-codex` then `/plugin install skill-codex@skill-codex`. Skills CLI: source `skills-directory/skill-codex`, skill `codex`. It needs the `codex` CLI below |
| `codex` CLI | `npm install -g @openai/codex`, then `codex login`, then check `codex --version` |
| `gh` CLI | See https://cli.github.com, then `gh auth login` |
| `ui-ux-pro-max` | Plugin: `/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill` then `/plugin install ui-ux-pro-max@ui-ux-pro-max-skill`. Skills CLI: source `nextlevelbuilder/ui-ux-pro-max-skill`, skill `ui-ux-pro-max`. Details are in `references/web-ui.md` |
| Python 3 | The system package manager, or https://www.python.org/downloads/ |

Installing runs third-party code from those sources. That is why the user decides, not the skill.

## 1. Intake (you, not a subagent)

This skill is project-agnostic. Discover each repository's own rules, tools and checks instead of assuming them.

1. Read every applicable AGENTS.md, CLAUDE.md and CONTRIBUTING file, run `git status --short`, and follow the repository's pre-work (code index sync, docs index, setup steps). Lanes need git worktrees, so if the target is not a Git repository, stop and ask the user. Do not run `git init` yourself. If the repository's rules restrict commits, branches or pushes (for example commits only on an explicit request), ask the user once, here, to approve the lane-branch commits, the integration branch and the PR this workflow makes, and follow their answer.
2. Read every work item in full, as the work items table says for its source.
3. Record per item the acceptance criteria (when an item states none, write the ones you infer, mark them as inferred, and confirm them in the grilling round), the type (bug, feature, docs, test, CI, measurement), the owning package, its dependencies on other items (a plan's order counts), and the files it will most likely touch. Use the repository's code index or `rg` to predict the file set. A guess is fine, but write it down, because the partition depends on it.
4. Where requirements or a needed decision are ambiguous, run a grilling round with the user (`grilling.md`) before lanes start, so no lane builds on a guess. Settle facts yourself. Ask the user only for decisions.
5. Prefer agent-runnable verification (scripts, end-to-end drivers, local Docker labs). If an item can only be done by a person at a GUI or device and the repository is agent-managed, propose dropping it (closing it as not planned, for a tracker issue) instead of handing the user manual steps.
6. Flag items that cannot be completed on this machine (another OS, hardware, a human measurement, a secret). Plan the part that can be done and say up front what will remain.
7. Check disk space (`df -h`) before any wave of writers that build heavy targets (Rust, C++, Xcode, Android). Keep a healthy margin and cap concurrent heavy builders.
8. Record `<base>`, the branch the work starts from. It is the branch the user names, otherwise the current branch.
9. Print the status table, with every item Open.

## 2. Partition into lanes

A lane is one writer subagent in its own git worktree with an exclusive file set. The goal is maximum parallelism with zero overlapping edits.

- Two items whose predicted file sets intersect go in the same lane (done in sequence by one agent), or the later one waits for the earlier lane to finish. The same holds without a file overlap when one item changes code the other calls or relies on (a store, an API, a shared type), or when a plan orders them. Put them in one lane, or order them and give the later lane the earlier lane's branch as its base. Shared hot files (lockfiles, changelogs, generated schemas, shared docs indexes, CI workflows, a plan's status file) are owned by exactly one lane or deferred to you at integration.
- Changelog and release-note lines are reported by lanes and written by you at integration, so no two lanes touch the same file.
- Open the lane table with the throughput checkpoint from `working-style.md`. Then write the table before spawning, with lane, items, owned files and directories, forbidden files, model, effort, reference files, and validation commands.
- Prefer more small lanes over a few big ones, but never split one item across two writers.

## 3. Choose model and effort per lane

Spend tokens where the difficulty is. This table overrides any other model or effort default.

| Task shape | Model | Effort |
|---|---|---|
| Docs, README, copy, mechanical edits, log or CI-artifact reading, focused re-checks | `haiku` or `sonnet` | low to medium |
| Contained UI or test work in one package with clear criteria | `sonnet` | medium |
| Root-cause bugs, concurrency, persistence or protocol changes, cross-package design | `opus` | medium at most |

Never use `fable` for subagents. Never give an Opus subagent effort above `medium`. Set `model` and `effort` explicitly on every spawn, and say in the lane table why a lane needs Opus.

## 4. Assign reference files and skills

Every brief names the files the lane must read in full before any work, by absolute path.

| Condition | Files |
|---|---|
| Every lane | `working-style.md`, `writing.md`, `receiving-review.md` |
| A task from an `mstack-plan` folder | The Read first entries of the task and its phase, and the skills in their Skills lines. The plan names skills without a plugin prefix, so name each in the brief the way this host lists it. A skill this host does not have is skipped and named in the report |
| Bug, regression, flaky test, crash, hang, leak, performance problem or production incident | The `mstack-diagnose` skill. The lane loads it (or reads its SKILL.md in full) and the reference file its branch table names. A lane cannot ask the user, so where the skill says to ask, the lane finishes what does not depend on the answer and ends its run with the question in its report |
| Design-heavy work with open choices | `grilling.md` (the lane half: settle facts, return decisions as questions) |
| Depends on facts outside the repository | `external-facts.md` |
| Any web or frontend UI change | `web-ui.md`, plus the `ui-ux-pro-max` skill |

Every writing lane also loads `ponytail` for code. It asks for the smallest change that fully solves the task, with every caller, test and fixture the change breaks still updated, and one line on what was skipped. That line is content and stays in the lane report.

Add task-specific skills that are installed in the session when the lane needs them, for example a test-first skill for regression tests, a benchmarking checklist for measured numbers, the framework's best-practice skill and the repository's UI guide for frontend work, accessibility and interface review skills, a platform skill family for platform work, and the repository's own delivery or review skills. Name each one in the brief. A skill that is not installed is not required.

When a reference file collides with a repository rule or a plan rule (for example a required documentation update), that rule wins and the report says so.

## 5. Brief and spawn

Spawn all independent lanes in one message with `Agent`, `isolation: "worktree"`, and the chosen `model` and `effort`. Use plain `Agent` subagents, not a Workflow script, so you can message each one with review findings later (messaging a Workflow-spawned agent resumes a duplicate writer). Move each item to In progress as its lane starts, and print the status table.

Every brief is self-contained, follows `writing.md` › Prose rules, and contains these parts, in order:

1. The user's goal in one sentence, the item IDs and titles, and the full acceptance criteria pasted in (the agent has no conversation context). For a plan item, also paste the plan's instructions for that task or phase. For an `mstack-plan` task, that is the whole task block, its phase's Goal, Owns, Must not touch and Checkpoint lines, and `plan.md` › Global constraints, and the task's Done when is the evidence in part 4.
2. The files to read in full before any work, by absolute path, from section 4, plus the repository rules to read and the skills to load.
3. The base. The lane's first command is `git merge --ff-only <lane base>`, where the lane base is `<base>`, or the earlier lane's accepted branch when this lane depends on it. If the merge fails, the lane stops and reports. Then the owned files and forbidden files, and "if you need a forbidden file, stop and report instead of editing it".
4. The evidence that proves the work done: the command and its expected result. If you cannot name it, the lane is not scoped yet.
5. Build hygiene. Its own target directory (never share a build directory between live worktrees), capped build jobs, and the repository's pinned toolchain (check the version first, because a system install earlier on PATH can shadow the pin and produce errors that are not in the code).
6. The validation it must run and report verbatim (focused tests, typecheck, lint and format, the repository's or the plan's completion checklist).
7. "Commit to your branch with a clear message. Do not push, do not open a PR, do not trigger CI."
8. "You may consult the advisor tool, if your harness has it, for a second opinion on a diagnosis or design."
9. "Process every review you receive (from the coordinator, Codex, the advisor) with `receiving-review.md`, and report per finding what you did."
10. The report format, written per `writing.md` › Lane reports. It has the outcome (done, partial or blocked), branch name, commits, files changed, each acceptance criterion with its evidence, commands run with results, the external-facts list if any, what could not be done and why, open decisions as questions, and the changelog line it proposes.

## 6. Review loop (per lane, as each finishes)

You own every line that ships. A "done" summary is a claim, not proof.

Every review is processed with `receiving-review.md`, by you and by the lanes. That covers Codex reviews, advisor reviews, your own findings sent to a lane, CI review bots and human PR comments. Put this rule in every brief, and repeat it in every message that carries findings to a lane.

1. Read the lane's diff yourself (`git -C <worktree> diff <base>...HEAD`). Check it against the acceptance criteria, scope (no unrelated edits, no files outside the lane), tests that prove the behavior, and the repository and plan rules. For a bug lane, check the report against the acceptance list at the end of this section. For a web UI lane, check that the pre-review UI check in `web-ui.md` ran and passed.
2. Get second opinions.
   - Call the `advisor` tool on judgment calls (root cause, scope, design trade-offs) and as a review before integration. If the tool is not available in the session, say so and rely on Codex plus your own review.
   - Run the Codex review through the `codex` skill (`skill-codex:codex` when installed as a plugin). Load it and follow its rules for closing stdin, keeping stderr out of your context, the Git-repository check and timeouts, with the model and effort chosen in section 0. The command for one lane is below, with the output written to the session scratchpad, never the worktree.

     ```bash
     codex exec -m <codex-model> --config model_reasoning_effort="<codex-effort>" --sandbox read-only -C <worktree> \
       "Read-only code review. Do not edit, write, commit or run anything that changes files. Review branch <branch> against <base> (git diff <base>...HEAD) for work items <item IDs and acceptance criteria>. Check correctness, regressions, missing tests and scope. Report each finding with file, line, the failing scenario and how to reproduce it. No findings is a valid result." \
       </dev/null 2> <scratchpad>/codex-review-<lane>.err > <scratchpad>/codex-review-<lane>.md
     ```
   - Inside this workflow these `codex` skill steps do not apply, because the workflow already decides them: asking the user after each Codex run (you triage the output with `receiving-review.md` instead), telling the user they can resume the session, and any sandbox other than `read-only`. Never pass `--skip-git-repo-check`, since every lane worktree is a Git repository. Codex reviews are read-only every time.
   - Run Codex reviews for different lanes in parallel as background shell commands, each with at least the timeout the `codex` skill gives for `<codex-effort>` (600 seconds for `high`, 1200 for `xhigh`, 1800 for `max`). An empty output file is never a clean review. Read the last lines of the `.err` file. If it shows a model or effort error, switch as section 0 says and rerun. If it shows an error an agent cannot fix (a login), report the lane's Codex review as not run, with the error, and carry on. If it shows none, the run was killed before it finished, so rerun it once with a longer timeout, and report the lane's Codex review as not run if that fails too.
3. Triage the findings with `receiving-review.md`. Verify each point against the real code, reproducing Codex findings before accepting them, reject wrong ones with a reason, and keep the real ones.
4. Send the real findings back to the same lane agent (`SendMessage` to its id) to fix in its own worktree, telling it to process them with `receiving-review.md` and to report per finding fixed or rejected with a reason. You do not patch lane code. Re-review the fix diff, and repeat Codex only if the fix is substantial.
5. Two rounds without accepted evidence means stop and replan the lane, following the retry rules in `working-style.md`, instead of a third identical round.
6. Move an item to Closed once its work is accepted, and print the status table.


### Accepting a root-cause claim

Bug lanes follow the `mstack-diagnose` skill, so their reports carry its evidence. Accept a lane's root-cause claim only when the report has all of these. A missing item sends the lane back for it.

1. The signal: the loop command already run, with its redacted failing output, or the saved record with its symbol status.
2. Evidence that the reproduced failure matches the reported symptom and repeats (or its measured rate).
3. The minimized scenario, with every element shown to be needed.
4. The ranked hypotheses with their predictions, and which were confirmed, refuted or left untested.
5. Which probe tested which prediction, one variable at a time, and for performance the baseline, the run counts and the spread.
6. The root-cause tier from `mstack-diagnose`, and Confirmed unless the item is a diagnosis of a past event that cannot be reproduced (then Supported, said plainly).
7. For a fix, the regression test seen failing before and passing after (with the pristine `diff` if the failure was forced), the original loop rerun, the fix verdict, and for a flaky failure the passing runs chosen in advance. Or a recorded "no correct seam" finding with both outputs.
8. An empty debug-prefix search (`git grep -n '\[DEBUG-'`) on the lane's diff, and the hypothesis that proved correct named in the commit message, to carry into the PR body.

## 7. Integrate and validate locally

1. Create one integration branch from the base. Bring in each accepted lane branch, by cherry-pick or rebase to keep a linear history unless the repository prefers merges. Conflicts should be rare by construction. Resolve any that appear yourself and re-run that lane's tests.
2. Write the shared files you reserved, such as changelog lines, docs indexes and a plan's status file.
3. Run the repository's (and the plan's) full completion checklist on the integrated tree (all focused tests together, typecheck, lint, format, broader suites when changes cross packages). Send integration breakage to the owning lane agent, or to a fresh small agent if the lane is gone. An item whose work breaks at integration goes back to In progress until it is fixed.
4. Run one last advisor and Codex review of the whole integration diff before pushing.
5. Run the sensitive-data gate before any push, tracker comment, PR body or comment. Run gitleaks (or the repository's secret scanner) over the run's commit range, and grep added lines for private hosts, organization and customer names, real people's names, tokens and local paths. Public repositories get placeholders only. Text about a leak stays vague and never repeats the value. Rewriting published history is the user's call.

## 8. Deliver: one PR, serialized CI

- When the repository has a remote that takes pull requests (or merge requests) and the user did not ask for a local result, push the integration branch and open one PR only when every item is Closed or explicitly reported as not completable here with the reason. Use the host's CLI (`gh` on GitHub). On a host whose CLI the session lacks, push the branch and give the user the link to open the PR. Write the title and body per `writing.md` › Pull request body. Open it ready for review, not as a draft.
- When there is no such remote, or the user asked for a local result, stop at the validated integration branch and report its name. Do not push.
- When the repository runs CI, CI runs one at a time across all of this work, meaning one CI run (workflow run or pipeline) in flight at once. Never push while a CI run for this PR is in progress, never push lane branches, and never trigger CI on several branches in parallel. The jobs inside that one run may run in parallel as the CI definition says, so do not serialize jobs or matrix legs. Batch fixes for CI failures into one push after the current run finishes.
- Triage a CI failure before any retrigger, as `working-style.md` describes. Diagnose from the logs (a cheap model can read them), fix through the owning lane, re-validate locally, then push once.
- Review-bot and human comments on the PR go through `receiving-review.md` like any other review. Only you reply on the PR.

## 9. Final report

Write it per `writing.md` › Messages to the user. Line one names the goal and the outcome (for example "The goal was to finish the six tasks in the plan. PR #40 is open and completes 5 of 6."). Line two is the next action for the user. Then the final status table, with evidence in the note column. Then the review findings the run did not apply, each rejected or deferred finding with its reason (see `receiving-review.md` › Log every finding). Then validation commands with results, what was not run and why, residual risk, and disk cleanup commands for finished worktrees if builds were large.
