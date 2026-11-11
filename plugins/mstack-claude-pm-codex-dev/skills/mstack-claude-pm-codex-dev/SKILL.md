---
name: mstack-claude-pm-codex-dev
description: Use when the user wants Codex to write the code while Claude manages, reviews and commits it, for a plan or plan folder, a list of issues (GitHub or another tracker) or one larger task, such as "let Codex develop this plan", "Codex writes, you review", "use the Codex plugin to implement these issues", or when an mstack-plan execute-plan.md offers this workflow. Runs in Claude Code only, with the OpenAI Codex plugin; for Claude subagents as writers use mstack-codex-review-workflow. Produces one integration branch with one reviewed commit per phase.
---

# mstack Claude PM, Codex dev

This skill runs in Claude Code only, because it drives Claude Code's subagent tool and the OpenAI Codex plugin for Claude Code. If you are running in Codex, stop here, tell the user, and use `mstack-claude-review-workflow` instead; ask nothing and start nothing.

You are the coordinator. A Codex developer writes the code of each phase, one phase at a time, in this checkout. You brief it, wait for it, read its diff, run its validation yourself, get the reviews, send findings back, and commit each accepted phase. You never write or edit a phase's code: when a phase cannot be finished by the developer, you stop and ask. The deliverable is one integration branch with one reviewed commit per phase, shipped as one pull request when the repository takes them, with CI used one run at a time.

The repository's own rules (AGENTS.md, CLAUDE.md, CONTRIBUTING, delivery skills) and the rules of a plan you execute still apply, and win over this skill where they are stricter.

## Roles and words

The reference files are shared with the two other mstack workflows, so read their words this way:

- **A lane** is one developer run of a phase. "Lane duties" in the reference files are the developer's; the brief carries them. "Coordinator duties" are yours.
- **The cross-vendor reviewer** is the read-only Codex review here. Because Codex also wrote the code, every record in this run calls it a **same-vendor review** (`mstack-receive-review` › Cross-vendor review findings, rule 4). The cross-vendor check is your own read and the advisor's.
- **The fallback review** is a fresh read-only Claude subagent that reviews when a Codex review cannot run. Record it as "fallback review by Claude", never as same-vendor.
- **A round that failed on capability** goes one tier up in `working-style.md`. Here section 3 wins: the developer keeps its model and its next round runs one effort level higher. The model changes only when Codex rejects it (section 3, rule 5) or the user chooses another after two failed rounds (section 6, step 9).

## Files in this skill

`<skill-dir>` below means this skill's own folder, the base directory the host showed when it loaded this skill. Use its absolute path in every brief.

| File | Who reads it | When |
|---|---|---|
| `references/working-style.md` | You and every developer run | Always, before any work |
| `references/writing.md` | You and every developer run | Every message to the user, brief, report, PR body, commit, tracker comment and doc |
| `references/grilling.md` | You | A requirement or design is ambiguous or has several defensible answers |
| `references/external-facts.md` | A developer run facing an external unknown, you for research | The answer depends on facts outside the repository |
| `references/web-ui.md` | Web UI phases, you when reviewing UI diffs | Any web or frontend UI change |
| `references/plan-format.md` | You | The work items are an `mstack-plan` folder |
| `references/codegraph.md` | You only, never a brief | Section 1, once, before reading code |
| `scripts/check-required-skills.sh` | You | Preflight |
| `scripts/codex-dev.mjs` | You | Sections 5 and 6: finding, waiting on and checking developer jobs, and snapshotting the working tree |

Read `working-style.md` and `writing.md` now. They govern the whole run. Their rules are adapted from third-party skills, credited in this skill's `THIRD_PARTY_NOTICES.md`.

`codex-dev.mjs` was verified against the Codex plugin 1.0.6. Its commands print one line of JSON (`locate` prints a path):

| Command | Prints | Exit |
|---|---|---|
| `node <skill-dir>/scripts/codex-dev.mjs locate` | the plugin's companion script path, or a `MISSING` line | 0 found, 1 missing |
| `node <skill-dir>/scripts/codex-dev.mjs jobs` | `{"jobs": [{"id", "state", "startedAt", "threadId", "summary"}]}`, newest first | 0, or 1 when the plugin does not answer in JSON |
| `node <skill-dir>/scripts/codex-dev.mjs wait <job-id>` | `{"state", "threadId", "summary", "startedAt", "completedAt"}` after at most 9 minutes | 0 completed, 3 still running, 1 failed, cancelled, gone or unknown |
| `node <skill-dir>/scripts/codex-dev.mjs result <job-id> --phase '<id>' [--thread <id>]` | `{"ok", "reason", "threadId", "touchedFiles", "output"}` | 0 accepted; 1 with reason `failed`, `empty`, `no phase id` or `wrong thread` |
| `node <skill-dir>/scripts/codex-dev.mjs snapshot` | the Git tree ID that `git add -A` would stage (untracked files in, ignored files out), without touching the real index | 0, or 1 on a Git error |

`jobs`, `wait` and `result` exit 1 with a "new session is needed" line when the Codex plugin's session hook did not run in this session.

## Work items

A work item is one unit of work with its own acceptance criteria and its own row in the status table. The sources and how to read them are those of `mstack-codex-review-workflow`, summarized here.

| Source | How you read it at intake | Item IDs |
|---|---|---|
| Tracker issues | On GitHub, `gh issue view <n> --json number,title,body,labels,comments,state`; another tracker through its CLI or connected tool, or the user pastes each issue. A table, screenshot or `mstack-backlog-triage` table is a pointer list; its acceptance hints are marked inferred | The tracker's IDs |
| A plan | The whole plan and every file it points to; each task is an item | The plan's task IDs |
| One task | Split into the smallest independently verifiable items, confirmed in the grilling round | `T1`, `T2`, and so on |

A **phase** is what one developer run receives: one phase of a plan, with its tasks in the plan's order, or one work item when there is no plan. Its **phase ID** is the plan's phase number, or the work item's ID without a plan (`T1`, `#41`), and it is the `Phase <phase-id>` line of the brief and the report. In a shell command, always put the phase ID in single quotes (`--phase '#41'`), because a shell reads an unquoted `#` as the start of a comment. In a file name, replace every character of it outside letters, digits, `.`, `_` and `-` with `-` (`phase-41-round-1.md`). The status table keeps one row per item, so a two-phase plan of four tasks has two developer runs and four rows.

An `mstack-plan` folder (it holds `plan.md`, `progress.md` and `execute-plan.md`) follows `references/plan-format.md`: read it at intake and run its resume and staleness checks first. Each task's Satisfies line and the spec's requirements are its criteria, its Files the predicted files, its Tier feeds section 3, and its Done when is the evidence. Set the `Executor` line of `progress.md` to `mstack-claude-pm-codex-dev` (also on a plan written before this value existed, when the user started this skill on it by name) and the `Branch` line to the integration branch. Start no developer run for a phase whose tasks are all Closed with their commits on that branch. Update a task's row and append a log line with the evidence every time it changes state, in the same message as the status table. A Closed line names the phase commit.

## Status table

Show every work item in one table with exactly three states: Open (not started, or blocked, with the reason), In progress (in a developer run, in review or in a fix round), Closed (accepted and committed).

```markdown
| Item | Title | State | Phase | Note |
|---|---|---|---|---|
| 1.1 | Parse the header | In progress | 1, round 1 | Codex review (same-vendor) running |
| 2.1 | Write the report | Open | 2 | Waits for phase 1 |
```

Print the whole table at the end of intake, and again, whole, in every message where at least one item changes state; not in a message where nothing changed. An item sent back by review stays In progress. These states do not change the tracker. The final report includes the table.

## 0. Ask before starting

**Session-visible dependencies, first.** Before anything else, check these in this session's own lists:

1. `mstack-find-skills`, `mstack-best-model-for` and `mstack-receive-review` in the skill list (as `<name>` or `<plugin>:<name>`).
2. The agent type `codex:codex-rescue` in the list of agent types the subagent tool offers.

For a missing skill: when `bash <skill-dir>/scripts/check-required-skills.sh` reports it `ok` on disk, it was installed after this session started, so say that a new session is needed and stop. Otherwise print this and stop, with no question asked:

```text
mstack-claude-pm-codex-dev needs <name>, which is not installed.
Claude Code: claude plugin marketplace add mubeda/mstack, then claude plugin install <name>@mstack
Skills CLI:  npx skills add mubeda/mstack --skill <name> -g -a claude-code -y
Or install mstack-setup the same way and run it: it installs everything the mstack skills need.
Then start a new session.
```

For a missing `codex:codex-rescue`, print this and stop, with no question asked:

```text
mstack-claude-pm-codex-dev needs the OpenAI Codex plugin for Claude Code, whose codex:codex-rescue agent is not in this session.
Install it:  claude plugin marketplace add openai/codex-plugin-cc, then claude plugin install codex@openai-codex
Then run /codex:setup, and start a new session. mstack-setup reports and installs it too.
```

**The start questions.** Then load `mstack-best-model-for` in called mode once: say that `mstack-claude-pm-codex-dev` is calling, and ask for vendor `codex` with the tiers `standard` and `most capable` and the task "code review", and for vendor `claude` with the tiers `cheap` and `most capable`. Restate the user's goal and the smallest change that meets it (see `working-style.md`) and, in the same message, ask with your question tool, in this order:

1. **Developer model.** Offer the `standard` answer's Codex model as the recommended answer and the `most capable` answer's as the alternative, and accept any other model name the user types.
2. **Developer effort.** Offer `medium` (recommended), `low`, `high` and `xhigh`. The developer channel accepts nothing above `xhigh`, and the current Codex models reject `none` and `minimal`: refuse any other answer with that reason and ask again; never start a run with it.
3. **Reviewer model.** Offer `gpt-6.1-sol` as the recommended answer and `gpt-6-astra` as the alternative, and accept any other model name the user types.
4. **Reviewer effort.** Offer `high` as the recommended answer, then the code-review effort from the `codex` answer above, then `medium`, `xhigh` and `max` without repeating a level, and accept any other level the user types.

Skip a question only when the request already answers it. A hand-off from an `mstack-plan` `execute-plan.md` counts as the request: its reviewer and commit answers answer questions 3 and 4 and the commit approval in section 1. There is no execution-mode question. The Codex review sandbox is always `read-only` and is never asked.

Record the answers as `<dev-model>`, `<dev-effort>`, `<codex-model>` and `<codex-effort>`, and state them in your first message after the answers and in the final report.

## Preflight: required tools

Run the checker from the repository root. Add `--github` when the items are GitHub issues or the PR goes to GitHub. Add `--web-ui` when any item touches web UI.

```bash
bash <skill-dir>/scripts/check-required-skills.sh [--github] [--web-ui]
```

It prints one line per item, `ok`, `MISSING` or `WARN`. The Codex-side lines (`ponytail`, `mstack-diagnose`, `mstack-best-model-for`, which `mstack-diagnose` requires, `mstack-receive-review`, and `ui-ux-pro-max`) are the skills the developer loads in its own sessions, so the Claude-side copies do not count.

1. A `MISSING` line: tell the user exactly which items are missing, say that `mstack-setup` installs missing skills and plugins at user scope after one yes and lists the rest (`gh`, Python 3, logins) as steps for the user, and stop. For a line that ends in "(Codex side)", say also that `mstack-setup` run in Claude Code covers the Claude side only: the user accepts its offer to check the other host, or runs `mstack-setup` in Codex, or installs that skill for Codex directly (`codex plugin add <skill>@mstack`, and for `ponytail` its own marketplace). Stop, because without them the code style and diagnosis this workflow promises would silently not happen. No developer run starts.
2. The `WARN` line for the `codex` skill: continue. The Codex review then runs with the same `codex exec` command, without the skill's helpers.
3. Then run `node <skill-dir>/scripts/codex-dev.mjs jobs` once. A non-zero exit means the plugin's script no longer answers in the shape this skill was verified with (plugin 1.0.6), or the session hook did not run: show its line, tell the user to check the plugin with `/codex:status`, and stop here instead of failing in the middle of a phase.

This workflow installs nothing itself.

## 1. Intake (you, not a subagent)

1. Read every applicable AGENTS.md, CLAUDE.md and CONTRIBUTING file. If the target is not a Git repository, stop and ask the user; do not run `git init` yourself.
2. **A clean start.** Run `git status --porcelain` before anything else writes to the checkout. When it prints anything, list those paths, ask the user what to do with them, and wait. The developer writes in this checkout, so earlier changes would mix into the first phase's diff. Never stash, discard or commit them yourself.
3. Follow the repository's pre-work, then `references/codegraph.md` once, before reading code. Every snapshot and phase commit takes the whole working tree, so nothing a tool writes may stay untracked: when `.codegraph/` (or another folder the pre-work created) shows in `git status --short`, hide it yourself: write a file named `.gitignore` inside that folder whose only line is `*` (append the line when the folder already has one), say so, and check that `git status --porcelain` is empty again. That changes no tracked file and writes nothing under `.git`, which some hosts refuse as sensitive.
4. **Commits.** When the repository's rules restrict commits, branches or pushes, ask the user once, here, to approve the phase commits, the integration branch and the pull request, and follow the answer. An answer from the plan's `execute-plan.md` counts.
5. Read every work item in full, as the work items table says. When the input is a whole untriaged backlog, recommend `mstack-backlog-triage` first when it is installed, and ask once.
6. Record per item the acceptance criteria (inferred ones marked and confirmed in the grilling round), the type (bug, feature, docs, test, CI, measurement), its dependencies, and the files it will most likely touch.
7. Where requirements or a decision are ambiguous, run a grilling round with the user (`grilling.md`) before the first developer run. Flag items that cannot be completed on this machine and say up front what will remain.
8. Record `<base>`: the branch the user names, otherwise the current branch; for an `mstack-plan` folder the `Base` line of `plan.md`. `<scratchpad>` is a folder of this run only: a new subfolder of the session's scratch folder, or, when the session names none, one made with `mktemp -d "${TMPDIR:-/tmp}/mstack-pm-XXXXXX"`. Never reuse a folder from an earlier run, because a brief or a phase record left there would be taken for this run's. It is always outside the repository, because a file inside it would enter the next snapshot and commit.
9. **The integration branch.** For an `mstack-plan` run, continue on the `Branch` line of `progress.md` when it has one, as `plan-format.md` › Resume and staleness says; otherwise create `plan/<slug>` from `<base>` and write it to the `Branch` line. Without a plan, create one integration branch from `<base>`. The developer works in this checkout on that branch.
10. Print the status table, with every item Open.

## 2. Order the phases

1. With a plan, the phases run in the plan's dependency order, a lower round first, then the lower phase number. Without a plan, each item is a phase, in dependency order.
2. One developer at a time. Never start a developer run while another run, or the review of its phase, is open. Never pass `isolation: "worktree"` on the developer call: a background job in a removed worktree is stranded.
3. Shared hot files (a plan's status file, changelog lines, docs indexes) are yours, written outside any phase: when such a file is tracked, commit your change to it on its own, before a developer start and after each phase commit, so that while a phase runs the working tree holds only the developer's changes. Every other file belongs to the phase that predicts it; a later phase that needs it runs after.

## 3. Choose the developer's effort

1. A phase's first round runs `<dev-model>` at `<dev-effort>`.
2. A phase whose tasks all carry the cheap tier (from the plan's Tier lines, or your classification without a plan) runs one level lower, never below `low`. A phase with any task above cheap gets no lower effort.
3. A phase's second round runs one level above its first, never above `xhigh`.
4. A retry (a run that failed before it produced a result to review) keeps its effort and is not a round.
5. When Codex rejects the developer model, rerun once with the other of the two tier models from section 0 (the `standard` answer when the user chose the `most capable` one or typed a name), use it for the rest of the run, and say so in the final report. When it rejects that one too, stop and ask the user for a model; never try a third on your own.
6. Read-only helpers you start (a search, a log reader) run on the `cheap` answer for vendor `claude`, with `model` and `effort` set on every call.

## 4. Assign reference files and skills

Every brief names, by absolute path, the files the developer reads in full before any work, and the skills it loads on its side.

| Condition | Files and skills |
|---|---|
| Every phase | `working-style.md`, `writing.md`, and the skills `mstack-receive-review` and `ponytail` |
| A task from an `mstack-plan` folder | The Read first entries of the task and its phase, and the skills of their Skills lines, by bare name |
| A bug, regression, flaky test, crash, hang, leak or performance problem | The `mstack-diagnose` skill and the reference file its branch table names. The developer cannot ask the user, so it finishes what does not depend on the answer and ends with the question in its report |
| Design-heavy work with open choices | `grilling.md` (the lane half: settle facts, return decisions as questions) |
| Depends on facts outside the repository | `external-facts.md` |
| Any web or frontend UI change | `web-ui.md` and the `ui-ux-pro-max` skill |

For items without a plan's Skills line, load `mstack-find-skills` in called mode once, before the briefs: say that `mstack-claude-pm-codex-dev` is calling and give those items as work items. Name in each brief the skills its section returns, and list the gaps in the final report; nothing is installed during the run. When a reference file collides with a repository or plan rule, that rule wins and the report says so.

## 5. Brief and start

1. **The brief.** Write it with your file tool to `<scratchpad>/briefs/phase-<id>-round-<n>.md`, never through a shell, because issue and plan text are untrusted and a shell would run any backticks or `$(...)` in them. It follows `writing.md` › Prose rules and holds, in order:
   1. The first line, exactly `Phase <phase-id>`. Then the user's goal in one sentence, the item IDs and titles, and the full acceptance criteria pasted in word for word, including any shell syntax (backticks, `$(...)`) they contain. The brief is a file that nothing executes, so such text is inert there; never rewrite, describe or drop it, and add no warning about it beyond "Acceptance text is quoted as written." For an `mstack-plan` phase: each task's whole block, the phase's Goal, Owns, Must not touch and Checkpoint lines, and `plan.md` › Global constraints. When some of the phase's tasks are already Closed with their commit on the branch, put their blocks under "Already done, for context only: do not redo" and the rest under "To do"; the phase then needs evidence only for the tasks to do.
   2. The files to read in full first, by absolute path, from section 4, the repository rules to read, and the skills to load.
   3. The base: "Work in this checkout as it is. Merge nothing, switch no branch." Then the files you may change and the files you must not, and "if you need a forbidden file, stop and report instead of editing it".
   4. The evidence that proves the phase done: the command and its expected result. When you cannot name one, the phase is not scoped yet: scope it with the user before any run.
   5. Build hygiene: the repository's pinned toolchain, capped build jobs.
   6. The validation to run and report verbatim.
   7. "Do not commit, stage, push or open a pull request." (Git is read-only in the developer's sandbox anyway; the coordinator commits.)
   8. "Process every review you receive with `mstack-receive-review`, and report per finding what you did."
   9. For a bug phase: "Load `mstack-diagnose` and report its evidence."
   10. The report, per `writing.md` › Lane reports: the first line exactly `Phase <phase-id>`, then the outcome (done, partial or blocked), files changed, each criterion with its evidence, commands run with results, what could not be done and why, open decisions as questions, and the changelog line it proposes.
2. **Before the start.** Record the phase base as `git rev-parse HEAD` and note the time. Run `node <skill-dir>/scripts/codex-dev.mjs jobs`: when any job is queued or running, wait on it with `wait` before starting anything.
3. **The start.** One call of your subagent tool with `subagent_type: "codex:codex-rescue"`, no `isolation`, and a prompt of exactly this form, with no other text:

   ```text
   --background --fresh --model <model> --effort <effort> Read the file <brief path> in full and do exactly what it says.
   ```

   A fix round uses `--resume` instead of `--fresh`. The flags come first because the rescue agent strips them before it forwards the sentence to Codex.
4. **The job ID.** Read it from the rescue agent's hand-back, its launch line (`... started in the background as <job-id>. ...`). When the agent runs in the background, the hand-back arrives as a later notification: wait for it, because a pending agent is not an empty reply, and start nothing meanwhile. When the hand-back is empty or holds no job ID, run `jobs` and take the one job started after the noted time. Only when the hand-back has arrived and `jobs` lists no such job did the start fail: then retry it (section 3, rule 4). Never start a second run while a job is queued or running.
5. **Waiting.** Run `node <skill-dir>/scripts/codex-dev.mjs wait <job-id>` with the shell's longest timeout, and run it again for as long as it exits 3. A job is never finished or failed while it reports running, however long it takes. Record its `startedAt` and `completedAt` from the last `wait` in the phase record, and report the longest run in minutes in the final report.
6. **The result.** Run `node <skill-dir>/scripts/codex-dev.mjs result <job-id> --phase '<phase-id>'`, adding `--thread <recorded thread>` on a fix round. An exit code of 2 from any `codex-dev.mjs` command is a usage error in your own command (an unquoted ID, a missing option): correct the command and run it again; it says nothing about the job. Record the thread ID of a phase's first round as the phase's developer thread.
   - `wait` exits 1 with `failed`, `cancelled` or `gone`, or `result` says `empty` or `no phase id`: the run failed, even when files changed. Never treat the phase as done, and never write its code yourself. Read the job's state and output first, then retry by cause (`working-style.md`), at most twice, at the same effort. A model rejection follows section 3, rule 5. After the second failed retry, stop the phase as section 6 step 9 says.
   - `wait` exits 1 with `unknown`: the job record is gone (the session that owned it ended, or the plugin changed). Treat it as a failed start.
   - `result` says `wrong thread`: the resume landed on another thread (threads are kept per Git root, and another session may have used this checkout). The round is a failed run; its changes are reviewed as unrequested edits, never accepted as the fix.

## 6. Review loop (per phase, as each run finishes)

You own every line that ships. The developer's report is a claim, not proof. Every review is processed with `mstack-receive-review`. Put that rule in every brief, and repeat it in every findings brief.

1. **The reviewed tree.** Run `node <skill-dir>/scripts/codex-dev.mjs snapshot` and record the tree ID in the phase record. The **phase record** is the file `<scratchpad>/phase-<id>.md`, written with your file tool: per round the phase base, the tree IDs, the validation commands you ran with their output, each review with its label, and every finding with its outcome. The final report and a handoff point at it. The phase diff is `git diff <phase base> <reviewed tree>`; it shows new, untracked files too, which a plain `git diff` would miss. In round two, also read the round diff `git diff <round-one tree> <round-two tree>`, which shows only what the fix changed.
2. **Your own read.** Read the phase diff against the acceptance criteria, scope (no unrelated edits, no forbidden file: a forbidden edit is a finding), tests that prove the behavior, and the repository and plan rules. Then run the phase's validation commands yourself and put their output in the phase record; the developer's "all green" never closes a phase. For a bug phase, check the report against the acceptance list below. For a web UI phase, check that the pre-review UI check in `web-ui.md` ran and passed.
3. **The advisor.** Call the `advisor` tool for a review of the phase. When the session has no advisor tool, say so and continue with your read and the Codex review.
4. **The Codex review (same-vendor).** Load the `codex` skill (`skill-codex:codex`) when it is installed and follow its rules for stdin, stderr, the Git check and timeouts; when it is not installed, run the same command directly. Write the prompt with your file tool to `<scratchpad>/codex-review-prompt-<phase>.md`:

   ```text
   Read-only code review. Do not edit, write, commit or run anything that changes files. Review the changes of phase <phase-id> with: git diff <phase base> <reviewed tree>. That diff includes new files. The phase's work items and acceptance criteria are: <item IDs and criteria>. Check correctness, regressions, missing tests and scope. Report each finding with file, line, the failing scenario and how to reproduce it. No findings is a valid result.
   ```

   ```bash
   codex exec -m <codex-model> --config model_reasoning_effort="<codex-effort>" --sandbox read-only -C <repository root> - \
     < <scratchpad>/codex-review-prompt-<phase>.md 2> <scratchpad>/codex-review-<phase>.err > <scratchpad>/codex-review-<phase>.md
   ```

   Inside this workflow the `codex` skill's steps of asking the user after a run, offering to resume, and any sandbox other than `read-only` do not apply. Use at least the timeout the `codex` skill gives for the effort (600 seconds for `high`, 1200 for `xhigh`, 1800 for `max`). An empty output is never a clean review: read the end of the `.err` file; on a model or effort error rerun once with the alternative model or the next lower effort and use it for the rest of the run; on an error an agent cannot fix (a login), use the fallback below for this review. Label this review "same-vendor review" in the status table note, the phase record and the final report.
5. **Triage.** Process every finding with `mstack-receive-review`: verify it against the code and reproduce it before accepting it, reject what the code contradicts with the reason, and log every finding with its outcome in the phase record (and `progress.md` for a plan).
6. **A fix round.** Write the accepted findings to `<scratchpad>/briefs/phase-<id>-round-2.md` with your file tool (the phase ID line first, the findings with file, line and reproduction, the same report format, and "process them with `mstack-receive-review`"), and start it as section 5 says with `--resume` and `--effort` one level above the first round's (section 3, rule 3). A fix round is a round, never a retry, so it never keeps the first round's effort. Check the returned thread with `result --thread`. You never edit the phase's files yourself. Review the fix with your read of the round diff and the validation rerun; repeat the Codex review only when the round diff touches a file or a function the findings did not name. The phase record says which reviews ran in each round.
7. **Acceptance.** A phase is accepted as a whole: every task meets its criteria with evidence, every accepted finding is fixed, and the validation you ran is green. When some tasks pass and one does not, all stay In progress and the finding goes back to the developer.
8. **The commit.** After validation and every review, take one more snapshot. When it differs from the reviewed tree (a validation command wrote or changed a file), read `git diff <reviewed tree> <new tree>` like a round diff, and write each file of that difference into the phase record with what you did about it. Never delete or revert what validation wrote to make the trees match. Accept it (the new tree is then the accepted tree); or, for an output file that must not ship, add it to the clone's local exclude list (`.git/info/exclude`) and say so in the phase record, and when the host refuses that write (some treat files under `.git` as sensitive), ask the user once to approve it or to choose one of the other two; or send it back to the developer as a finding. Before you commit, check the phase record: `<scratchpad>/phase-<id>.md` must exist and hold, for every round of this phase, the phase base, the reviewed tree ID, the validation commands you ran with their output, each review with its label and result, every finding with its outcome, and the accepted tree ID in full. Write what is missing now; a phase without its record is not committed. Then run `git add -A` and check that `git write-tree` prints the accepted tree's ID. Only then commit, with a message per `writing.md`, so the commit holds exactly the tree that was reviewed. When the IDs differ, something changed after the review: unstage nothing by hand, snapshot again and review the difference. Move the phase's items to Closed, update `progress.md` for a plan, and print the status table.
9. **Two rounds without accepted evidence.** Stop the phase. Keep its items In progress (Open when the work did not start), start no third round, and write no code. Ask the user, naming what failed and the uncommitted paths the phase left (`git status --short`), with three choices: retry the phase with the other developer model, re-scope it, or stop the run. Never commit, stash or discard those changes on your own.

### When the Codex review cannot run

When a Codex review fails in a way an agent cannot fix, the review still happens, by Claude in a fresh context.

1. Warn the user once, in the next message, that the Codex review is not available (say why) and that this phase's review runs as a fallback review by Claude. Name `mstack-setup`.
2. Start a read-only reviewer with your subagent tool, `model` and `effort` set to the `most capable` answer for vendor `claude`, and no `isolation`. Its prompt is the Codex review prompt above. Save its final message to `<scratchpad>/review-<phase>.md`, and check that `git status --porcelain` is unchanged after it ran.
3. Process its findings with `mstack-receive-review` like any review, and record it as "fallback review by Claude", not as a same-vendor review.

### Accepting a root-cause claim

Bug phases follow `mstack-diagnose`, so their reports carry its evidence. Accept a root-cause claim only when the report has all of these; a missing item goes back to the developer as a finding.

1. The signal: the loop command already run, with its redacted failing output, or the saved record with its symbol status.
2. Evidence that the reproduced failure matches the reported symptom and repeats (or its measured rate).
3. The minimized scenario, with every element shown to be needed.
4. The ranked hypotheses with their predictions, and which were confirmed, refuted or left untested.
5. Which probe tested which prediction, one variable at a time, and for performance the baseline, the run counts and the spread.
6. The root-cause tier from `mstack-diagnose`, and Confirmed unless the item is a diagnosis of a past event that cannot be reproduced (then Supported, said plainly).
7. For a fix, the regression test seen failing before and passing after, the original loop rerun, the fix verdict, and for a flaky failure the passing runs chosen in advance. Or a recorded "no correct seam" finding with both outputs.
8. An empty debug-prefix search (`git grep -n --untracked '\[DEBUG-'`) on the phase diff, and the hypothesis that proved correct named in the commit message.

## 7. Integrate and validate locally

1. The phases are already on the integration branch, one commit each; there are no lane branches to bring in.
2. Write the shared files you reserved (changelog lines, docs indexes, a plan's status file) and commit them.
3. Run the repository's and the plan's full completion checklist on the branch. A failure caused by a phase reopens it: its items go back to In progress, and the fix comes from the developer in a fresh run (`--fresh`) with a consolidated brief (the phase's brief, its commit, and the failure as findings), because `--resume` continues only the latest thread of this checkout, which belongs to a later phase. Review and commit it like any round.
4. Run one last advisor review and one Codex review of the whole integration diff (`git diff <base>...HEAD`) with section 6's prompt file and command form (the prompt on stdin from the file), the Codex one labelled same-vendor, or the fallback review when Codex cannot run.
5. Run the sensitive-data gate before any push, tracker comment, PR body or comment: gitleaks (or the repository's secret scanner) over the run's commit range, and a grep of added lines for private hosts, organization and customer names, real people's names, tokens and local paths. Text about a leak stays vague and never repeats the value.

## 8. Deliver: one PR, serialized CI

- When the repository has a remote that takes pull requests and the user did not ask for a local result, push the integration branch and open one PR only when every item is Closed or reported as not completable here with the reason. Use the host's CLI (`gh` on GitHub); without one, push and give the user the link. Write the title and body per `writing.md` › Pull request body, and say in the body that Codex wrote the code and which reviews were same-vendor.
- When there is no such remote, or the user asked for a local result, stop at the validated integration branch and report its name. Do not push.
- One CI run in flight at a time across this work. Never push while a CI run for this PR is in progress; batch fixes into one push after it finishes. Triage a CI failure from its logs before any retrigger (a cheap helper can read them), and get the fix from the developer.
- Review-bot and human comments on the PR go through `mstack-receive-review`. Only you reply on the PR. Post each reply that `mstack-receive-review` drafted as an inline reply in the comment's own thread, not a top-level comment. Write the reply to a file with your file tool, so no quote or apostrophe in it meets the shell, then run `gh api -X POST repos/{owner}/{repo}/pulls/{pr}/comments/{id}/replies -F body=@<reply file>`, where `{id}` is a top-level review comment (GitHub has no replies to replies) and `gh` fills `{owner}` and `{repo}`. Write the body yourself and never paste review text into it.

## 9. Final report

When the run stops with work left (an item not Closed, or integration, the final review, the push, CI or delivery not finished), stop at a safe point and write a handoff with `mstack-handoff` when it is installed, and put its path in this report. Without it, put the same content here: branch and HEAD, the uncommitted paths, the phase in progress with its base, its last reviewed tree and its developer thread, the job ID and state of any developer run still active, gates still due with their commands, and decisions blocked on the user. A developer job ends with the session that started it, so the next session reviews what the working tree holds and starts a fresh run.

Write the report per `writing.md` › Messages to the user. Line one names the goal and the outcome; line two is the next action for the user. Then the final status table, with evidence in the note column. Then, per phase, the developer model and effort, the number of rounds and retries, and every switch with its reason. Then which reviews were same-vendor (every Codex review) and which ran as fallback reviews by Claude, and why. Then the review findings not applied, each with its reason. Then the validation commands with results, the longest developer run, what was not run and why, and residual risk.
