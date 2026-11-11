---
name: mstack-claude-review-workflow
description: Use when working in Codex and the user hands over work to deliver in a repository with Codex lanes and Claude review, whether a list of issues (GitHub or another tracker, as numbers, links, a table or a screenshot), an execution plan or task file, or one larger task, or says "fan out agents", "solve these issues", "execute this plan" or "process the backlog", or asks for Claude review of Codex work or serialized CI, or mentions mstack, even if they do not name this skill. Runs in Codex only; in Claude Code, use mstack-codex-review-workflow instead.
---

# mstack Claude review workflow

This skill runs in Codex only, because it uses Codex's own tools. If you are running in Claude Code, stop here, tell the user, and use `mstack-codex-review-workflow` instead.

You are Codex, the coordinator and the implementer. In Workflow mode, Codex lanes write the code and you partition, brief, review, integrate and report. In Single mode, you write it yourself. Claude Code is a read-only second pair of eyes, called the cross-vendor reviewer in the reference files, and it reviews through the `claude-review` skill of the `claude` plugin from [agent-bridges](https://github.com/mubeda/agent-bridges). The deliverable is one integration branch that completes every work item, reviewed and validated. When the repository takes pull requests, it ships as one PR, pushed once every item is finished, with CI used one run at a time.

The repository's own rules (AGENTS.md, CONTRIBUTING, delivery skills) and the rules of a plan you execute still apply, and win over this skill where they are stricter.

## Files in this skill

`<skill-dir>` below means this skill's own folder, the folder of the SKILL.md you loaded. Use its absolute path in every brief, because lanes run in other worktrees.

| File | Who reads it | When |
|---|---|---|
| `references/working-style.md` | You and every lane | Always, before any work |
| `references/writing.md` | You and every lane | Every message to the user, lane report, PR body, commit, tracker comment and doc |
| `references/grilling.md` | You, design-heavy lanes | A requirement or design is ambiguous or has several defensible answers |
| `references/external-facts.md` | Any lane facing an external unknown, you for cross-lane research | The answer depends on facts outside the repository |
| `references/web-ui.md` | Web UI lanes, you when reviewing UI diffs | Any web or frontend UI change |
| `references/plan-format.md` | You | The work items are an `mstack-plan` folder |
| `references/codegraph.md` | You only, never a lane brief | Section 1, once, before reading code |
| `scripts/check-required-skills.sh` | You | Preflight |
| `scripts/check-lanes.mjs` | You | Section 3, before any lane starts and whenever a lane changes tier |

Read `working-style.md` and `writing.md` now. They govern the whole run. The rules in these files are adapted from third-party skills, credited in this skill's `THIRD_PARTY_NOTICES.md`. The reference files mention an advisor tool. Codex has none, so skip those steps and rely on your own review plus Claude's.

## Work items

A work item is one unit of work with its own acceptance criteria and its own entry in the status table. The run starts from one of these sources.

| Source | Examples | How you read it at intake | Item IDs |
|---|---|---|---|
| Tracker issues | GitHub issue numbers or links, an issue table or screenshot, issues in another tracker | On GitHub, `gh issue view <n> --json number,title,body,labels,comments,state`. For another tracker, use its CLI or connected tool if the session has one, otherwise ask the user to paste each issue. A table or screenshot is only a pointer list. A triage table from `mstack-backlog-triage` is one too: its now rows are the items, its Type column gives each item's type, and its acceptance hint seeds the criteria, marked inferred. The issue body and comments are the requirements | The tracker's IDs (`#41`, `PROJ-12`) |
| A plan | An execution plan, a tasks file, phase files, a plan folder | Read the whole plan and every file it points to. Each task or phase becomes an item, with the plan's own acceptance criteria, file lists, order and validation commands as the requirements | The plan's own task or phase IDs |
| One task | A feature, a refactor or a bug described in the request | Split it into the smallest items that each give an independently verifiable result, and confirm the list with the user in the grilling round | `T1`, `T2`, and so on |

When the plan tracks status itself (checkboxes, a status column, a tasks file), you own that file. Update it as items change state and commit it at integration. Lanes never edit it.

An `mstack-plan` folder (it holds `plan.md`, `progress.md` and `execute-plan.md`) follows `references/plan-format.md`, so read that file at intake and run its resume and staleness checks first. Each task is a work item, with its task ID as the item ID. Its Satisfies line and the spec's matching requirements are the acceptance criteria, its Files are the predicted files, its Depends on lines and the phase rounds are the dependencies, its Tier is the row of the model table in section 3, and its Done when is the evidence. `progress.md` is the plan's status file. Set its `Executor` line to this skill and its `Branch` line to the integration branch, skip Closed tasks after checking their work is on that branch (bring in any that a stopped run closed but never integrated), resume In progress tasks from their log lines, and update the task's row and append a log line with the evidence every time an item changes state, in the same message as the status table. A Closed line names the lane branch and its accepted commits, because the task is closed before integration. Without such a folder, the run works exactly as described for its source.

## Status table

Show the status of every work item in one table, using exactly three states.

| State | Meaning |
|---|---|
| Open | Not started yet, or blocked. The note says why when it is blocked |
| In progress | A lane (or you, in Single mode) is working on it, or it is in review or a fix round |
| Closed | Its work is accepted. It passed your review and Claude's, its findings are resolved, and its validation ran green |

```markdown
| Item | Title | State | Lane | Note |
|---|---|---|---|---|
| #41 | Second save loses changes | In progress | A, standard | Claude review running |
| #42 | Reset to defaults button | Open | B, standard | Waits for lane A's store change |
```

1. Print the whole table at the end of intake, with every item Open.
2. Print it again, whole, in every message where at least one item changes state, right after the message's position line. Do not print it when nothing changed.
3. An item sent back by review stays In progress. An item that cannot be completed here stays Open, with the reason in its note.
4. These are the workflow's states. They do not change the item in its tracker. A GitHub issue closes when the PR that closes it merges.
5. The final report includes the same table.

## Commands the sandbox blocks

Codex's `workspace-write` sandbox keeps `.git` read-only and turns the network off. Several of your commands need one or the other, so run each with escalated permissions (Codex asks the user to approve it), or ask the user to start the session with the access they want to grant.

| Command | Needs | Why |
|---|---|---|
| `git worktree add`, `git commit`, `git cherry-pick`, branch changes | Write access to `.git` | Git stores worktree metadata, the index and commits there |
| `codex exec` and `codex exec resume` for lanes | Network | The lane talks to the model API |
| The `claude-review` companion command | Network, and writes under the home folder | Claude talks to Anthropic's API, and the companion keeps job state in the home folder |
| `gh`, `git push` | Network | They talk to the host |
| `scripts/check-required-skills.sh --github` | Network | Its `gh auth status` check asks the host, and without network it reports a logged-in `gh` as missing |

Lanes run in `workspace-write` with the network off, so a lane can never commit. Each lane leaves its changes in its worktree, and you commit them (section 6). Give a lane network access with `-c sandbox_workspace_write.network_access=true` only when its brief needs it, such as a dependency install or an external-facts lookup.

## 0. Ask before starting

**Required skills, first.** Before anything else, check the three shared skills this workflow calls: `mstack-find-skills`, `mstack-best-model-for` and `mstack-receive-review`. For each one:

1. It is in this session's skill list (as `<name>` or `<plugin>:<name>`): continue.
2. It is not in the list, but the preflight checker reports it `ok` on disk: it was installed after this session started. Say that a new session is needed, and stop.
3. Otherwise it is not installed. Print this and stop, with no lane started and no question asked:

   ```text
   mstack-claude-review-workflow needs <name>, which is not installed.
   Claude Code: claude plugin marketplace add mubeda/mstack, then claude plugin install <name>@mstack
   Codex:       codex plugin marketplace add mubeda/mstack, then codex plugin add <name>@mstack
   Skills CLI:  npx skills add mubeda/mstack --skill <name> -g -a <claude-code|codex> -y
   Or install mstack-setup the same way and run it: it installs everything the mstack skills need.
   Then start a new session.
   ```

There is no built-in fallback for any of them. This check comes before the message below.

Before the preflight or any other work, send one message that restates the user's goal and the smallest change that meets it (see `working-style.md`), and in that same message ask the user and wait for the answers. The items are read only at intake, so restate the goal from what the request says and refine it after intake. Say in the same message that the run will ask for approval of the commands in the table above.

1. Which model Claude reviews with. Offer `opus` as the recommended answer, then the code-review model and effort `mstack-best-model-for` gives for vendor `claude` (load it in called mode, ask for the task "code review"), and `sonnet` as the faster alternative when the answer is not `sonnet`. Accept any full model name the user types.
2. Which effort Claude uses. Offer `medium` as the recommended answer, then `high` and `low`.
3. Which execution mode to run. Recommend Workflow mode when the work has two or more items whose predicted files do not overlap, and Single mode otherwise.

Skip a question only when the user's request already answers it. A hand-off from an `mstack-plan` `execute-plan.md` counts as the request, so the answers the user gave there about the reviewer model, the effort and the commits answer those questions here. A request that names the Claude model or effort answers that question. "Fan out agents", "parallel" or "workflow" mean Workflow mode, and "one by one", "single" or "no subagents" mean Single mode. Claude always reviews read-only, and that is never asked.

Record the answers as `<claude-model>` and `<claude-effort>`. Every Claude review in the run uses that model, and that effort is the most any review uses, so you do not ask again per review. The review of a cheap-tier lane (section 3) runs one effort level lower, never below `low`, because a docs or mechanical diff does not need the effort a design change does. These two answers are passed to every `claude-review` run. If the first Claude run rejects the model or the effort, rerun with the alternative model from question 1 (or the next lower effort), use it for the rest of the run, and say so in the final report. Reviews never wait on the user.

- Workflow mode runs parallel `codex exec` lanes in their own worktrees, as described in sections 2 to 6. It is fastest for many independent items and costs more tokens and machine resources.
- Single mode means you implement the items yourself, one after another, on one branch, in the order the partition suggests. No lanes. Everything else still applies: the reference files, the status table, Claude reviews processed with `mstack-receive-review`, local validation, one PR, serialized CI. You are the only lane, so the lane rules in the reference files apply to you, and you fix review findings yourself.

State the chosen mode and the Claude model and effort in your first message after the answers and in the final report.

## Preflight: required tools

Run the checker from the repository root. Add `--github` when the items are GitHub issues or the PR goes to GitHub. Add `--web-ui` when any item touches web UI.

```bash
bash <skill-dir>/scripts/check-required-skills.sh [--github] [--web-ui]
```

The checker finds the skill files and checks that the CLIs it needs are logged in. Also confirm that each skill appears in this session's skill list, because a skill installed after the session started loads only in a new session. Look for `mstack-diagnose`, `mstack-find-skills`, `mstack-best-model-for` and `mstack-receive-review` (shown as `<name>:<name>` from a plugin, or the bare name from the skills CLI) and `claude-review` from the `claude` plugin (shown as `claude:claude-review`).

Required always: `ponytail`, `mstack-diagnose`, `mstack-find-skills` and `mstack-best-model-for` from this marketplace, `node`, and `git`. Recommended: the `claude-review` skill from the agent-bridges `claude` plugin with a logged-in `claude` CLI, the cross-vendor reviewer. Without it the run continues, and section 6 › When the cross-vendor reviewer is missing says how reviews are done instead. Required for GitHub: a logged-in `gh`. Required for web UI work: `ui-ux-pro-max` and Python 3.

If anything is missing:

1. `mstack-find-skills`, `mstack-best-model-for` or `mstack-receive-review`: section 0's required-skills step already stopped the run.
2. `ponytail`, `mstack-diagnose`, `node` or `git`, or for this work `gh`, `ui-ux-pro-max` or Python 3: tell the user exactly which items are missing, say that `mstack-setup` installs the missing skills and plugins at user scope after one yes and lists the rest (`gh`, Python 3, logins) as steps for the user, and stop, because without them the code style and diagnosis this workflow guarantees would silently not happen. If a skill is installed but not in this session's list, say that a new session is needed.
3. The cross-vendor reviewer: warn the user, name `mstack-setup` as the way to install it, and continue with the fallback in section 6.

This workflow installs nothing itself. Installing runs third-party code, so the user decides, through `mstack-setup`.

## 1. Intake (you, not a lane)

This skill is project-agnostic. Discover each repository's own rules, tools and checks instead of assuming them.

1. Read every applicable AGENTS.md and CONTRIBUTING file, run `git status --short`, and follow the repository's pre-work (code index sync, docs index, setup steps). Then follow `references/codegraph.md` once, in your own checkout, before reading code. Lanes never run those steps and never build an index. Lanes need git worktrees, so if the target is not a Git repository, stop and ask the user. Do not run `git init` yourself. If the repository's rules restrict commits, branches or pushes (for example commits only on an explicit request), ask the user once, here, to approve the lane-branch commits, the integration branch and the PR this workflow makes, and follow their answer.
2. Read every work item in full, as the work items table says for its source. When the input is a whole backlog that nobody has triaged (many open issues and no triage table), recommend running `mstack-backlog-triage` first when it is installed, and ask the user once whether to triage or to go ahead with the issues as given.
3. Record per item the acceptance criteria (when an item states none, write the ones you infer, mark them as inferred, and confirm them in the grilling round), the type (bug, feature, docs, test, CI, measurement), the owning package, its dependencies on other items (a plan's order counts), and the files it will most likely touch. Use the repository's code index or `rg` to predict the file set. A guess is fine, but write it down, because the partition depends on it.
4. Where requirements or a needed decision are ambiguous, run a grilling round with the user (`grilling.md`) before lanes start, so no lane builds on a guess. Settle facts yourself. Ask the user only for decisions.
5. Prefer agent-runnable verification (scripts, end-to-end drivers, local Docker labs). If an item can only be done by a person at a GUI or device and the repository is agent-managed, propose dropping it (closing it as not planned, for a tracker issue) instead of handing the user manual steps.
6. Flag items that cannot be completed on this machine (another OS, hardware, a human measurement, a secret). Plan the part that can be done and say up front what will remain.
7. Check disk space (`df -h`) before any wave of lanes that build heavy targets (Rust, C++, Xcode, Android). Keep a healthy margin and cap concurrent heavy builders.
8. Record `<base>`, the branch the work starts from. It is the branch the user names, otherwise the current branch. For an `mstack-plan` folder it is the `Base` line of `plan.md`. Create `<run-dir>`, a folder outside the repository for briefs, lane logs, worktrees and review output, for example `${TMPDIR:-/tmp}/mstack-<repo>-<run-id>`, where `<run-id>` is the start time as `<yyyymmdd-hhmm>`. Keep only letters, digits, dots and hyphens in `<repo>`, and put the path in double quotes in every command when the temp folder's own path has a space, because the commands below write it unquoted. Nothing in it is ever committed. The reference files call this folder the session scratchpad. It holds the lanes' uncommitted work, so name it in any handoff.
9. Print the status table, with every item Open.

## 2. Partition into lanes

A lane is one `codex exec` process in its own git worktree with an exclusive file set. The goal is maximum parallelism with zero overlapping edits.

- Two items whose predicted file sets intersect go in the same lane (done in sequence by one agent), or the later one waits for the earlier lane to finish. The same holds without a file overlap when one item changes code the other calls or relies on (a store, an API, a shared type), or when a plan orders them. Put them in one lane, or order them and start the later lane from the earlier lane's accepted branch. Shared hot files (lockfiles, changelogs, generated schemas, shared docs indexes, CI workflows, a plan's status file) are owned by exactly one lane or deferred to you at integration.
- Changelog and release-note lines are reported by lanes and written by you at integration, so no two lanes touch the same file.
- Open the lane table with the throughput checkpoint from `working-style.md`. Then write the table before spawning, with lane, items, owned files and directories, forbidden files, plan tier, tier, model, effort, reason, reference files, and validation commands.
- Prefer more small lanes over a few big ones, but never split one item across two writers.

## 3. Choose model and effort per lane

Spend tokens where the difficulty is. Before writing the lane table, load `mstack-best-model-for` in called mode once: say that `mstack-claude-review-workflow` is calling, and ask for vendor `codex`, the tiers `cheap`, `standard` and `most capable`, with the limits `max effort: medium`. Its answers fill the Model and Effort columns of this table for the whole run, and the table overrides any other model or effort default. An `mstack-plan` written before this change names the same three tiers, so it runs unchanged.

| Tier | Task shape | Model | Effort |
|---|---|---|---|
| cheap | Docs, README, copy, mechanical edits, log or CI-artifact reading, focused re-checks | the `cheap` answer | the `cheap` answer |
| standard | Contained UI or test work in one package with clear criteria | the `standard` answer | the `standard` answer |
| most capable | Root-cause bugs, concurrency, persistence or protocol changes, cross-package design | the `most capable` answer | the `most capable` answer |

Never give a lane effort above `medium`, with the one exception below. Set `-m` and `model_reasoning_effort` explicitly on every lane and every resume, because a run started without them takes the configured default, whatever it costs. Say in the lane table why a lane needs the most capable tier. If a lane rejects a model, use the next tier the account accepts and say so.

1. **A plan's tier picks the row.** For an `mstack-plan` task, use the row named by the task's `Tier` line. A lane that holds several tasks takes the highest tier among them. Put a lane on another row only with the reason in the lane table.
2. **Helpers are cheap.** A read-only helper run you start yourself (a search, a log or CI-artifact reader, a focused re-check) uses the cheap row, with `-m` and the effort set like any lane.
3. **Move up, never repeat.** A round fails on capability when the work is wrong or incomplete although the brief was clear and the tools worked. A context limit, a dropped connection or a tool error is not that, and `working-style.md` says how to retry those. After such a round, do not send another round to the same model. Resume the lane with `-m` set to the model one tier up (the resume command in section 6 takes the model again), and record the move and its reason in the lane table. A fix round that is only mechanical (a rename, a doc line, formatting) may resume one tier down. A most capable lane has no tier above it: its second round runs on the same model, and after two failed rounds step 5 of section 6 replans it under rule 4.
4. **The one exception to the cap.** When a most capable lane has failed two rounds and is replanned (section 6, step 5), the replanned lane may run the most capable model at `high`. Write "escalated" and the reason in the lane table and in the final report. Nothing else runs above `medium`.
5. **Check the table before starting lanes.** Write the lane table to `<run-dir>/lane-table.md` with the columns Lane, Items, Plan tier, Tier, Model, Effort and Reason, and run the check. It also fails a lane whose model is not its tier's unless the Reason says why (a rejected model, for example). Start lanes only when it passes, and run it again whenever a lane changes tier.

   ```bash
   node <skill-dir>/scripts/check-lanes.mjs --allow cheap=<cheap model> --allow standard=<standard model> \
     --allow 'most capable=<most capable model>' <run-dir>/lane-table.md
   ```

## 4. Assign reference files and skills

Every brief names the files the lane must read in full before any work, by absolute path.

| Condition | Files |
|---|---|
| Every lane | `working-style.md`, `writing.md`, and the `mstack-receive-review` skill |
| A task from an `mstack-plan` folder | The Read first entries of the task and its phase, and the skills in their Skills lines. The plan names skills without a plugin prefix, so name each in the brief the way this host lists it. A skill this host does not have is skipped and named in the report |
| Bug, regression, flaky test, crash, hang, leak, performance problem or production incident | The `mstack-diagnose` skill. The lane loads it (or reads its SKILL.md in full) and the reference file its branch table names. A lane cannot ask the user, so where the skill says to ask, the lane finishes what does not depend on the answer and ends its run with the question in its report |
| Design-heavy work with open choices | `grilling.md` (the lane half: settle facts, return decisions as questions) |
| Depends on facts outside the repository | `external-facts.md` |
| Any web or frontend UI change | `web-ui.md`, plus the `ui-ux-pro-max` skill |

Every lane also uses `ponytail` for code. It asks for the smallest change that fully solves the task, with every caller, test and fixture the change breaks still updated, and one line on what was skipped. That line is content and stays in the lane report.

For the work items whose plan gives no Skills line, or that come from no plan, load `mstack-find-skills` in called mode once, before the briefs: say that `mstack-claude-review-workflow` is calling and give those items as work items. Name in each brief the skills its section of the result returns. List the candidates it reports for gaps in the final report; nothing is installed during the run.

Every brief also carries section 3's answers for the tiers `cheap`, `standard` and `most capable` (model and effort), and the skills for its items. A lane never calls a skill to get them. A lane that loads `mstack-diagnose` uses those answers for its own subagents, and that skill's own required-skills step and model call are skipped inside a lane.

When a reference file collides with a repository rule or a plan rule (for example a required documentation update), that rule wins and the report says so.

## 5. Brief and spawn

For each lane, create its worktree from its base (an approved command, because it writes `.git`), write its brief to a file, and start it in the background.

```bash
git worktree add -b mstack/<run-id>/<lane> <run-dir>/wt/<lane> <lane base>
nohup codex exec -m <model> --config model_reasoning_effort="<effort>" --sandbox workspace-write -C <run-dir>/wt/<lane> \
  --json -o <run-dir>/lane-<lane>.md - < <run-dir>/brief-<lane>.md \
  > <run-dir>/lane-<lane>.jsonl 2> <run-dir>/lane-<lane>.err &
echo $! > <run-dir>/lane-<lane>.pid
```

The lane branch carries `<run-id>`, because a branch left by an earlier run with the same lane name would make `git worktree add -b` fail. The lane base is `<base>`, or the earlier lane's accepted branch when this lane depends on it. Start all independent lanes before you wait on any of them. Move each item to In progress as its lane starts, and print the status table. The first line of `lane-<lane>.jsonl` is a `thread.started` event, and its `thread_id` is the lane's session id. Record it in `<run-dir>/lanes.md`, with the lane's branch and worktree, because fix rounds resume that session. A lane is finished when its process has exited (`kill -0 $(cat <run-dir>/lane-<lane>.pid)` fails). Its report is `lane-<lane>.md`. An empty report means the lane failed, so read the end of `lane-<lane>.err` and handle it as `working-style.md` says for retries.

Every brief is self-contained, follows `writing.md` › Prose rules, and contains these parts, in order:

1. The user's goal in one sentence, the item IDs and titles, and the full acceptance criteria pasted in (the lane has no conversation context). For a plan item, also paste the plan's instructions for that task or phase. For an `mstack-plan` task, that is the whole task block, its phase's Goal, Owns, Must not touch and Checkpoint lines, and `plan.md` › Global constraints, and the task's Done when is the evidence in part 4.
2. The files to read in full before any work, by absolute path, from section 4, plus the repository rules to read and the skills to use.
3. Owned files and forbidden files, and "if you need a forbidden file, stop and report instead of editing it".
4. The evidence that proves the work done: the command and its expected result. If you cannot name it, the lane is not scoped yet.
5. Build hygiene. Its own target directory (never share a build directory between live worktrees), capped build jobs, and the repository's pinned toolchain (check the version first, because a system install earlier on PATH can shadow the pin and produce errors that are not in the code).
6. The validation it must run and report verbatim (focused tests, typecheck, lint and format, the repository's or the plan's completion checklist).
7. "Do not commit, push, open a PR or trigger CI. The sandbox keeps `.git` read-only, so leave every change in this worktree, and the coordinator commits it. Where a reference file tells you to commit at a point that later work changes again (for example the failing test before the fix, when both touch one file), stop your run at that point and end it with that commit in your report, its files and its message written per `writing.md`. The coordinator commits it and resumes you to continue. List any remaining commits at the end of your report, in order, each with its files and its message."
8. "You cannot ask the user or the coordinator while you run. When a reference file tells you to ask or to wait (an open decision, or a root-cause check before a fix), finish everything that does not depend on the answer, then end your run with the question and its evidence in your report. The coordinator resumes your session with the answer."
9. "Process every review you receive (from the coordinator or Claude) with `mstack-receive-review`, and report per finding what you did."
10. The report format, written per `writing.md` › Lane reports. It has the outcome (done, partial or blocked), files changed, each acceptance criterion with its evidence, commands run with results, the external-facts list if any, what could not be done and why, open decisions as questions, the commits to make in order (files and message for each), and the changelog line it proposes.

## 6. Review loop (per lane, as each finishes)

You own every line that ships. A "done" summary is a claim, not proof.

Every review is processed with `mstack-receive-review`, by you and by the lanes. That covers Claude reviews, your own findings sent to a lane, CI review bots and human PR comments. Put this rule in every brief, and repeat it in every message that carries findings to a lane.

1. Commit the lane's work on its branch, as approved commands, in the order the lane listed. A lane that stopped at a commit point gets that commit made now, then a resume (as in step 4) with the message "Committed. Continue.", and its review waits until it reports done. For each commit, write its message to `<run-dir>/commit-<lane>-<n>.txt`, run the mechanical check from `writing.md` on it, then run `git -C <run-dir>/wt/<lane> add <its files>` and `git -C <run-dir>/wt/<lane> commit -F <run-dir>/commit-<lane>-<n>.txt`. Check with `git -C <run-dir>/wt/<lane> status --short` that nothing was left out. Then read the diff yourself (`git -C <run-dir>/wt/<lane> diff <lane base>...HEAD`). Check it against the acceptance criteria, scope (no unrelated edits, no files outside the lane), tests that prove the behavior, and the repository and plan rules. For a bug lane, check the report against the acceptance list at the end of this section. For a web UI lane, check that the pre-review UI check in `web-ui.md` ran and passed.
2. Get Claude's review through the `claude-review` skill. Load it, and resolve `<claude-plugin-root>` the way that skill says (for a Codex install, the plugin's folder under `~/.codex/plugins/cache/agent-bridges/claude/`). The command for one lane is below. It runs Claude read-only in plan mode against the lane's branch. Run it as an approved command, and run reviews for different lanes in parallel.

   ```bash
   node "<claude-plugin-root>/scripts/claude-companion.mjs" review --wait \
     --cwd <run-dir>/wt/<lane> --base <lane base> --scope branch \
     --model <claude-model> --effort <claude-effort> \
     </dev/null > <run-dir>/claude-review-<lane>.md 2> <run-dir>/claude-review-<lane>.err
   ```
   For a cheap-tier lane, pass one effort level below `<claude-effort>`. The review reads the branch diff, not the acceptance criteria, so checking the criteria stays your job in step 1. Never pass `--write`. A non-zero exit or an empty output file is never a clean review. Read the end of the `.err` file. For a model or effort error, switch as section 0 says and rerun once. For an error an agent cannot fix (a login), or a second failure, use the fallback below for this review and warn the user.
3. Triage the findings with `mstack-receive-review`. Verify each point against the real code, reproducing Claude's findings before accepting them, reject wrong ones with a reason, and keep the real ones.
4. Send the real findings back to the same lane session. Write them to `<run-dir>/findings-<lane>-<n>.md`, telling the lane to process them with `mstack-receive-review` and to report per finding fixed or rejected with a reason, then resume the lane from its worktree. You do not patch lane code. `codex exec resume` takes its model, effort and sandbox from the current configuration, not from the lane's first run, so pass the lane's model, effort and sandbox again every time, and the network override too when the first run had it. When it finishes, commit its changes as in step 1, re-review the fix diff, and repeat Claude's review only if the fix is substantial.

   ```bash
   cd <run-dir>/wt/<lane> && nohup codex exec --sandbox workspace-write resume <thread-id> -m <model> \
     -c model_reasoning_effort="<effort>" --json -o <run-dir>/lane-<lane>-fix<n>.md - \
     < <run-dir>/findings-<lane>-<n>.md > <run-dir>/lane-<lane>-fix<n>.jsonl 2> <run-dir>/lane-<lane>-fix<n>.err &
   echo $! > <run-dir>/lane-<lane>.pid
   ```
   The resumed lane is finished when that new process has exited, as in section 5, and its report is `lane-<lane>-fix<n>.md`.
5. Two rounds without accepted evidence means stop and replan the lane, following the retry rules in `working-style.md`, instead of a third identical round. A round that failed on capability runs its next round one tier up when there is one, as section 3 says.
6. Move an item to Closed once its work is accepted, and print the status table.


### When the cross-vendor reviewer is missing

When the `claude-review` skill or a logged-in `claude` CLI is missing and the user did not install it, or a Claude run fails in a way an agent cannot fix, the review still happens, by Codex in a fresh context.

1. Warn the user once, in the next message, that Claude is not available (say what is missing), and that reviews will run as a same-vendor review by a fresh Codex run, which tends to miss more than a review by another vendor. Name `mstack-setup` as the way to install it.
2. For each review, start a separate read-only Codex run on the lane's worktree, as an approved command because it needs network. Use the most capable model in section 3's table at `medium` effort (or `<claude-effort>` when the user chose a lower one), both set explicitly. Write the prompt to `<run-dir>/review-prompt-<lane>.md` the way you write lane briefs, never with `echo` or a heredoc, because acceptance criteria are untrusted text and a shell would run any backticks or `$(...)` in them.

   ```text
   Read-only code review. Do not edit, write, commit or run anything that changes files. Review branch <branch> against <lane base> (git diff <lane base>...HEAD) for work items <item IDs and acceptance criteria>. Check correctness, regressions, missing tests and scope. Report each finding with file, line, the failing scenario and how to reproduce it. No findings is a valid result.
   ```

   ```bash
   codex exec -m <model> --config model_reasoning_effort="medium" --sandbox read-only -C <run-dir>/wt/<lane> - \
     < <run-dir>/review-prompt-<lane>.md > <run-dir>/review-<lane>.md 2> <run-dir>/review-<lane>.err
   ```
   An empty output file is never a clean review. Read the end of the `.err` file, fix the cause, and rerun once.
3. Process its findings with `mstack-receive-review` exactly like a Claude review, reproducing each one before you accept it, and check the acceptance criteria yourself as in step 1.
4. Mark every review that ran this way as "same-vendor review" in the status table note, the lane's review record and the final report.

### Accepting a root-cause claim

Bug lanes follow the `mstack-diagnose` skill, so their reports carry its evidence. Accept a lane's root-cause claim only when the report has all of these. A missing item sends the lane back for it.

1. The signal: the loop command already run, with its redacted failing output, or the saved record with its symbol status.
2. Evidence that the reproduced failure matches the reported symptom and repeats (or its measured rate).
3. The minimized scenario, with every element shown to be needed.
4. The ranked hypotheses with their predictions, and which were confirmed, refuted or left untested.
5. Which probe tested which prediction, one variable at a time, and for performance the baseline, the run counts and the spread.
6. The root-cause tier from `mstack-diagnose`, and Confirmed unless the item is a diagnosis of a past event that cannot be reproduced (then Supported, said plainly).
7. For a fix, the regression test seen failing before and passing after (with the pristine `diff` if the failure was forced), the original loop rerun, the fix verdict, and for a flaky failure the passing runs chosen in advance. Or a recorded "no correct seam" finding with both outputs.
8. An empty debug-prefix search (`git grep -n --untracked '\[DEBUG-'`) on the lane's diff, and the hypothesis that proved correct named in the commit message, to carry into the PR body.

## 7. Integrate and validate locally

1. Create one integration branch from `<base>`. For an `mstack-plan` run, the integration branch is the one in the `Branch` line of `progress.md` when it has one: continue on it, as `plan-format.md` › Resume and staleness says, and create no other. Otherwise create `plan/<slug>`, the branch the user approved in the plan's `execute-plan.md`, and write it to the `Branch` line. Bring in each accepted lane branch, by cherry-pick or rebase to keep a linear history unless the repository prefers merges. Conflicts should be rare by construction. Resolve any that appear yourself and re-run that lane's tests.
2. Write the shared files you reserved, such as changelog lines, docs indexes and a plan's status file.
3. Run the repository's (and the plan's) full completion checklist on the integrated tree (all focused tests together, typecheck, lint, format, broader suites when changes cross packages). Send integration breakage to the owning lane session, or to a fresh small lane if that session is gone. An item whose work breaks at integration goes back to In progress until it is fixed.
4. Run one last Claude review of the whole integration branch before pushing, with the same command, `--cwd` set to the repository and `--base <base>`, or the fallback review from section 6 when Claude is missing.
5. Run the sensitive-data gate before any push, tracker comment, PR body or comment. Run gitleaks (or the repository's secret scanner) over the run's commit range, and grep added lines for private hosts, organization and customer names, real people's names, tokens and local paths. Public repositories get placeholders only. Text about a leak stays vague and never repeats the value. Rewriting published history is the user's call.
6. Remove the lane worktrees with `git worktree remove <run-dir>/wt/<lane>` once their branches are integrated.

## 8. Deliver: one PR, serialized CI

- When the repository has a remote that takes pull requests (or merge requests) and the user did not ask for a local result, push the integration branch and open one PR only when every item is Closed or explicitly reported as not completable here with the reason. Use the host's CLI (`gh` on GitHub). On a host whose CLI the session lacks, push the branch and give the user the link to open the PR. Write the title and body per `writing.md` › Pull request body. Open it ready for review, not as a draft.
- When there is no such remote, or the user asked for a local result, stop at the validated integration branch and report its name. Do not push.
- When the repository runs CI, CI runs one at a time across all of this work, meaning one CI run (workflow run or pipeline) in flight at once. Never push while a CI run for this PR is in progress, never push lane branches, and never trigger CI on several branches in parallel. The jobs inside that one run may run in parallel as the CI definition says, so do not serialize jobs or matrix legs. Batch fixes for CI failures into one push after the current run finishes.
- Triage a CI failure before any retrigger, as `working-style.md` describes. Diagnose from the logs, fix through the owning lane, re-validate locally, then push once.
- Review-bot and human comments on the PR go through `mstack-receive-review` like any other review. Only you reply on the PR. Post each reply that `mstack-receive-review` drafted as an inline reply in the comment's own thread, not a top-level comment. Write the reply to a file with your file tool, so no quote or apostrophe in it meets the shell, then run `gh api -X POST repos/{owner}/{repo}/pulls/{pr}/comments/{id}/replies -F body=@<reply file>`, where `{id}` is a top-level review comment (GitHub has no replies to replies) and `gh` fills `{owner}` and `{repo}`. Write the body yourself and never paste review text into it.

## 9. Final report

When the run stops with work left (an item not Closed, or integration, the final review, the push, CI or delivery not finished), because the context or the session is running out, a blocker, or the user stops it, stop at a safe point and write a handoff with `mstack-handoff` when it is installed, then put its path in this report. Without it, put the same content in this report: branch and HEAD, uncommitted paths, running lanes and their worktrees, `<run-dir>`, gates still due with their commands, and decisions blocked on the user.

Write it per `writing.md` › Messages to the user. Line one names the goal and the outcome (for example "The goal was to finish the six tasks in the plan. PR #40 is open and completes 5 of 6."). Line two is the next action for the user. Then the final status table, with evidence in the note column. Then the models used: per lane its tier, model and effort, the number of rounds, and every move to another tier with its reason. Then which reviews ran as same-vendor fallback reviews and why, if any. Then the review findings the run did not apply, each rejected or deferred finding with its reason (see `mstack-receive-review` › Log every finding). Then validation commands with results, what was not run and why, residual risk, and the path of `<run-dir>` with a cleanup command once the user no longer needs its logs.
