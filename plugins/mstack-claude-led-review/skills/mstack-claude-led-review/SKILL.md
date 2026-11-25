---
name: mstack-claude-led-review
description: Use when working in Claude Code and the user hands over work to deliver in a repository with Claude writer lanes and review by the other installed vendor (`codex`, or a fallback review) through `mstack-vendors`, whether a list of issues, an execution plan or task file, or one larger task, or says "fan out agents", "solve these issues", "execute this plan" or "process the backlog", even if they do not name this skill. Runs in Claude Code only.
---

# mstack review workflow

Read `host.md` next to this file first: `## This plugin` names this plugin's host, workflow names and `Executor` value. If this session runs in another host, stop immediately, name that host's review workflow from the host table below, and change nothing. Whenever the input is a plan folder, run section 0's **Old plan folder, first** check before checking any required skill, calling any skill or asking any question.

You are the coordinator. In Workflow mode, writer lanes edit isolated worktrees while you partition, brief, review, integrate and report; in Single mode, you implement items yourself on one branch. Other installed vendors offered by `mstack-vendors` review read-only (the cross-vendor reviewer in the reference files), or a fallback review runs with a warning when none is offered or returns a review. The deliverable is one validated integration branch (and one PR with serialized CI when the repository takes PRs). Repository rules and plan rules win where stricter.

## Files in this skill

`<skill-dir>` is defined in the host table. Use its absolute path in every brief.

| File | Who reads it | When |
|---|---|---|
| `host.md` | You | Always first; host identity, lanes, fix rounds and approvals |
| `references/working-style.md` | You and every lane | Always, before any work |
| `references/writing.md` | You and every lane | All prose, reports, commits, PRs and docs |
| `references/review-intake-and-briefs.md` | You | Sections 1, 2, 4 and 5 (work items, intake, partition, skills table, 10-part brief) |
| `references/review-loop-and-delivery.md` | You | Section 6 bug lanes (root-cause rubric) and sections 7 to 9 (integration, PR/CI, report) |
| `references/grilling.md` | You, design-heavy lanes | Ambiguous requirements or open design choices |
| `references/external-facts.md` | Lanes with external unknowns, you for broad research | Facts outside the repository |
| `references/web-ui.md` | Web UI lanes, you when reviewing UI diffs | Any web or frontend UI change |
| `references/follow-up-issues.md` | You | Section 9, when follow-ups were deferred |
| `references/plan-format.md` | You | `mstack-plan` folders |
| `references/codegraph.md` | You only, never a lane | Section 1, once, before reading code |
| `scripts/check-required-skills.sh` | You | Preflight |
| `scripts/check-lanes.mjs` | You | Section 3, before spawning and on tier changes |

Read `host.md`, `references/working-style.md` and `references/writing.md` now. Credits for adapted rules live in `THIRD_PARTY_NOTICES.md`.

## Host table

Identical across the three review workflows below frontmatter. Use the column for `host.md` › This plugin.

| Role | Claude Code | Codex | Antigravity |
|---|---|---|---|
| Review workflow | `mstack-claude-led-review` | `mstack-codex-led-review` | `mstack-antigravity-led-review` |
| Dev workflow | `mstack-claude-led-dev` | `mstack-codex-led-dev` | `mstack-antigravity-led-dev` |
| `<host>` for preflight | `claude` | `codex` | `antigravity` |
| `Host:` for `mstack-vendors` | `claude-code` | `codex` | `antigravity` |
| Question tool | `AskUserQuestion` (if absent, ask in chat and end your turn to wait) | Numbered list in chat, then end your turn to wait | `ask_question`, then wait (if absent, ask in chat and end your turn to wait) |
| Loading a skill | The Skill tool | Read `SKILL.md` and follow it | Read `SKILL.md` with `read_file` and follow it |
| `<skill-dir>` | Base directory shown on load | Folder of `SKILL.md` | Folder of `SKILL.md` |
| Scratch folder | Session scratch folder (`<scratchpad>`) | New folder outside repo, e.g. `${TMPDIR:-/tmp}/mstack-<repo>-<run-id>` (`<run-dir>`, never committed; quote if space) | New folder outside repo, removed after run |
| Advisor | `advisor` tool when available; else rely on your review + offered reviewers | None; rely on your review + offered reviewers | None; rely on your review + offered reviewers |
| Model call vendor & limits | `Vendor: claude`, `Limits: never: fable; max effort: medium`; never use `fable` for lanes | `Vendor: codex`, `Limits: max effort: medium` | `Vendor: antigravity`, `Limits: max effort: medium` |
| `check-lanes.mjs` flags | `--forbid fable --allow cheap=<cheap>,<standard> --allow standard=<standard> --allow 'most capable=<most capable>'` | `--allow cheap=<cheap> --allow standard=<standard> --allow 'most capable=<most capable>'` | `--subagent-tier flash --subagent-tier pro --allow cheap=flash --allow standard=flash --allow 'most capable=pro'` |
| Move up a tier | Fresh lane one tier up on failed lane's branch (`Agent` keeps its model) | Resume lane thread with `-m` one tier up (mechanical fix may resume one tier down); on rejected lane model switch to next tier account accepts (asking §3's expensive-model question first if flagged) | Fresh `review-lane` on `pro` when `flash` fails (`pro` has no tier above it) |
| A lane's transcript | None; lane vendor is `claude` | None; lane vendor is `codex` | Read each lane's transcript (`host.md` › Lanes) before any reviewer starts |
| The leader's model | Always `claude`; ask no model question, send no `Leader model` line, say nothing in §9 | Always `codex`; ask no model question, send no `Leader model` line, say nothing in §9 | Run read-only `agy models` once, ask once with question tool for listed id or `"I do not know"`, send only exact listed id as `Leader model` (§0 & `host.md`) |
| Eligible reviewer vendors (`Models:`) | `codex` alone | `claude` alone (omit `codex=`) | `claude` and `codex` |

## Work items

Follow `references/review-intake-and-briefs.md` › Work items for tracker issues, plans or a single task. For an `mstack-plan` folder, read `references/plan-format.md`, set `Executor:` to `host.md`'s value and `Branch:` to the integration branch, and record `Executed by: <writers>.` on every Closed log line (bare `unknown` whenever any writer is unknown, with any known co-writers noted after `Evidence:` per `plan-format.md`).

## Status table

Three states only: `Open` (not started or blocked; note says why), `In progress` (lane or Single mode working, in review, or fix round), `Closed` (accepted after review, findings resolved, validation green).

```markdown
| Item | Title | State | Lane | Note |
|---|---|---|---|---|
| #41 | Second save loses changes | In progress | A, standard | Review running (codex) |
| #42 | Reset to defaults button | Open | B, standard | Waits for lane A's store change |
```

Print whole at intake (all Open), again whenever any item changes state right after the position line, and in §9. Sent-back items stay In progress; uncompletable items stay Open with reason. States never modify external trackers.

## 0. Ask before starting

**Old plan folder, first.** Before checking any required skill or asking any question, if the items are a plan folder, inspect every line of `progress.md` (header, every task-table cell including `Owner` and `Note`, and log) and `execute-plan.md`. If any line names `mstack-codex-review-workflow`, `mstack-claude-review-workflow` or `mstack-claude-pm-codex-dev`, print this message verbatim (`<replacement>`: `mstack-claude-led-review`, `mstack-codex-led-review`, `mstack-claude-led-dev` in that order; `<review workflow>` / `<dev workflow>` from `host.md` › This plugin) and stop immediately without checking skills, calling `mstack-vendors`, asking questions or changing any file:

```text
This plan folder was made for <old>, which mstack no longer ships. It is replaced by <replacement>; in this host use <review workflow> or <dev workflow>. Make the plan again with mstack-plan in a new folder. Nothing in this folder was changed.
```

**Required skills, next.** Check `mstack-find-skills`, `mstack-best-model-for`, `mstack-receive-review`, `mstack-research` and `mstack-vendors` in this session's skill list. If listed: continue. If absent from list but `ok` on disk: tell the user a new session is needed and stop. Otherwise print this install block (never running any install command) and stop with no lane started and no question asked:

```text
<this workflow> needs <name>, which is not installed.
Claude Code: claude plugin marketplace add mubeda/mstack, then claude plugin install <name>@mstack
Codex:       codex plugin marketplace add mubeda/mstack, then codex plugin add <name>@mstack
Antigravity: agy plugin install https://github.com/mubeda/mstack/tree/main/plugins/<name>
Skills CLI:  npx skills add mubeda/mstack --skill <name> -g -a <claude-code|codex|antigravity> -y
Or install mstack-setup the same way and run it: it installs everything the mstack skills need.
Then start a new session.
```

No built-in fallback exists for any of these five skills.

**First message: goal and mode.** Restate the goal and smallest change (`working-style.md`), include any upfront approval disclosure from `host.md` › Approvals, and ask with your question tool for execution mode (skip if already answered): **Workflow mode** (parallel lanes in worktrees; recommended for 2+ disjoint items) or **Single mode** (you implement sequentially on one branch; all reference files, status table, reviews via `mstack-receive-review`, validation, PR and serialized CI still apply).

**Preflight and lane availability.** Run Preflight (`check-required-skills.sh`), and settle whether writer lanes will run (Workflow vs Single, and in Antigravity whether this session lists `review-lane` per `host.md` › Lanes).

**Reviewer discovery and selection (`mstack-vendors`).** One selection call serves the whole run; send a later call only for `(c)`–`(e)` below. Always send the whole literal message (never a summary and never unfilled `<model>`/`<effort>` placeholders), repeating `Called by`, `Host`, `Workspace`, `Leader model` (when present) and `Workflow`. First call `mstack-best-model-for` for `Task: code review` (`Vendor: both`) to obtain group 1's model, full Claude headless id (`How to set`, never an alias), effort and `Expensive` flag for each eligible reviewer vendor of the host table; for group 2 (cheap-tier lanes), ask `mstack-best-model-for` in the same call or a follow-up for `Task: code review` with `Limits: max effort: <one level below group 1's effort>` (`low < medium < high < xhigh < max`), repeating group 1's pair when group 1 is already `low` or the capped request returns `no model fits`.

- **(a) Leader call (Antigravity only).** Run the read-only model listing once (host table "The leader's model"), then ask once with your question tool (or in chat if absent) which listed id this session runs on plus `"I do not know"`, and end your turn to wait before calling `mstack-vendors` or editing files. Exact listed id -> `Leader model: <id>` on every call. Any other answer -> say once it is treated as `"I do not know"` and omit `Leader model`. `"I do not know"`, failed/empty listing, or a run where the user explicitly stated nobody can answer (never merely because a structured question tool is absent) -> omit `Leader model`, guess no id, keep reason for §9. Never ask again. Send this call and take its `Leader:` line as the leader's writer (never classify the id yourself):

  ```text
  Called by: <this workflow>
  Host: antigravity
  Workspace: <main checkout path>
  Leader model: <exact listed id; omit line if none>

  Job: code review
  Writers: unknown
  Workflow: review
  Models: claude=<full headless id> <effort>; codex=<model> <effort>
  ```

- **(b) Selection (start call, every host).** `Writers:` = leader's vendor (host's in Claude Code/Codex, `(a)`'s `Leader:` in Antigravity) plus lanes' vendor when lanes run (Antigravity lanes = `antigravity`). With `unknown` leader and no lanes: bare `Writers: unknown`; with `unknown` leader plus Antigravity lanes: `Writers: antigravity, unknown`. Send two `Job: code review` groups: group 1 holds each eligible reviewer vendor's `code review` model and effort (full Claude headless id; Codex-led omits `codex=`); group 2 (for cheap-tier lanes) holds the lower-effort pair from `mstack-best-model-for` above (or repeats group 1's pair when none is lower):

  ```text
  Called by: <this workflow>
  Host: <host table Host:>
  Workspace: <main checkout path>
  Leader model: <exact listed id; Antigravity only, omit if none>

  Job: code review
  Writers: <writers>
  Workflow: review
  Models: <group 1 models>

  Job: code review
  Writers: <writers>
  Workflow: review
  Models: <group 2 models for cheap-tier lanes>
  ```

  Write the full `mstack-vendors` result block before any question or command. When `Recommend:` names one or more reviewers, never assume the default or start editing or reviewing yet: ask once with your question tool (or in chat if absent) which offered reviewers should review and whether to keep their models (`Recommend:` as default; never offer `antigravity`), and end your turn immediately to wait before editing, committing, spawning lanes or running any reviewer command. Only after the user answers that reviewer-choice question (never in the same turn as it), once per chosen reviewer whose model `mstack-best-model-for` flags (`Expensive: yes`) and that the user did not explicitly name for that reviewer in this run, ask one separate question naming the flagged model and the next non-flagged model down and end your turn to wait (skip this question whenever the user already typed that model name for that reviewer, e.g. in their reply above — go straight to `(c)` if the selection differs, else proceed; a task's `Approved models` line never covers a reviewer role; on no, take the non-flagged model and send refresh `(c)` before any review runs). When `Recommend:` says `a fallback review`, ask no pick question, warn the user, and follow the block's fallback `Steps`.
- **(c) Selection refresh.** Whenever the user's chosen vendor subset OR any chosen model/effort differs from `(b)`'s `Recommend:` and `Models:` (including picking one of two offered reviewers on its same model), send one more literal message with `Models:` holding ONLY the chosen vendor(s) and their final model/effort (full Claude headless id; group 1 and group 2) before any review runs. Run ONLY that refreshed block's commands, and keep later `(d)`/`(e)` calls limited to those chosen vendor(s). In-place effort retries and rejected-model reruns follow `Steps`, not a new call.
- **(d) Unknown writer (Antigravity lane).** When any round on a lane branch has an unreadable or non-Gemini transcript (`host.md` › Lanes), send one literal call with `Writers:` preserving every known writer across all rounds of that lane branch beside `unknown` (e.g. `claude, unknown`, or bare `Writers: unknown` only when none is known) and `Models:` holding only the chosen reviewer(s) (both job groups so §6 picks group 2 for cheap-tier lanes, or one group at that lane tier's effort).
- **(e) Integration (§7 final review).** Compute `Writers:` as the union of verified writers across all rounds of accepted work (including co-writers noted after `Evidence:` on resumed runs) and the leader's writer (preserving known writers beside `unknown`; bare `Writers: unknown` only when none is known). Send one literal call with that `Writers:` and `Models:` holding only the chosen reviewer(s) whenever it differs from `(b)`/`(c)`.

State chosen mode and reviewer(s)/models/efforts after selection and in §9.

## Preflight: required tools

Run from the repository root (`--github` for GitHub issues/PRs; `--web-ui` for web UI):

```bash
bash <skill-dir>/scripts/check-required-skills.sh --host <host table value> [--github] [--web-ui]
```

Confirm each checked skill is in this session's skill list. Required: `ponytail`, `mstack-diagnose`, the five shared skills, `node`, `git`, plus `--github` logged-in `gh`, and `--web-ui` `ui-ux-pro-max` (`WARN` only in Antigravity) and Python 3. Reviewer availability belongs to `mstack-vendors`. If any required item is missing, name every missing item and `mstack-setup` and stop. Install nothing yourself.

## 1. Intake (you, not a lane)

Follow `references/review-intake-and-briefs.md` › Section 1 (repo rules, `references/codegraph.md` once, Git check without `git init`, read items, grill open decisions via `references/grilling.md`, set `<base>` and scratch folder, print status table all Open).

## 2. Partition into lanes

Follow `references/review-intake-and-briefs.md` › Section 2 (disjoint file sets, reserve hot shared files, open lane table with throughput checkpoint, never split one item across writers).

## 3. Choose model and effort per lane

Call `mstack-best-model-for` in called mode once using the host table's `Model call vendor & limits` row (`Tiers: cheap, standard, most capable`). Its answers fill the Model and Effort columns and override any other default.

| Tier | Task shape | Model | Effort |
|---|---|---|---|
| cheap | Docs, copy, mechanical edits, log reading, focused re-checks | `cheap` answer (or `standard` when judgment is needed) | `cheap` answer (`-` for subagent tier) |
| standard | Contained UI or test work with clear criteria | `standard` answer | `standard` answer (`-` for subagent tier) |
| most capable | Root-cause bugs, concurrency, persistence, cross-package design | `most capable` answer | `most capable` answer (`-` for subagent tier) |

Set model and effort (or subagent tier) explicitly on every lane and helper. Never exceed `medium` effort except rule 4. State why any lane needs `most capable`.

1. **Plan tier picks the row:** highest `Tier` among an `mstack-plan` lane's tasks; justify any override in Reason.
2. **Helpers are cheap:** read-only helpers run on the `cheap` row explicitly.
3. **Move up, never repeat:** on capability failure (distinct from context/connection/tool errors in `working-style.md`), move up per host table "Move up a tier" and record it. A `most capable` lane has no higher tier: after two failed rounds, §6 step 5 replans it.
4. **Escalation exception:** a replanned `most capable` lane after two failed rounds may run at `high` where effort levels apply; write `"escalated"` and the reason in the lane table and §9.
5. **Expensive lane models (before `check-lanes.mjs`):** per lane whose assigned model `mstack-best-model-for` flags (`Expensive: yes`), ask one question of its own naming the flagged model and the next non-flagged model down, and end your turn to wait before `check-lanes.mjs` or spawning. Skip only when every task of the lane carries `- Approved models:` naming that exact model, or the user explicitly named that exact model for that lane in this run (never when another model or lane was named, and a task's approval line never covers a reviewer role). On no, put the next non-flagged model down in the lane table (adding it to `--allow 'most capable=...'` for `check-lanes.mjs`) and record every answer for §9. Apply the same check before resuming a lane whose rejected model switches to a flagged tier.
6. **Check before spawning:** write `<scratch>/lane-table.md` (`Lane`, `Items`, `Plan tier`, `Tier`, `Model`, `Effort`, `Reason`) and run `node <skill-dir>/scripts/check-lanes.mjs` with the host table flags. Spawn only on pass, and rerun on tier changes (without `node`, check the script's top rules by hand and say so).

## 4. Assign reference files and skills

Follow `references/review-intake-and-briefs.md` › Section 4 (absolute paths in every brief, `ponytail` on writing lanes, `mstack-find-skills` once for non-plan items, paste §3 tier answers so lanes never call `mstack-best-model-for`).

## 5. Brief and spawn

Follow `host.md` › Lanes and `references/review-intake-and-briefs.md` › Section 5 (10-part brief, parallel worktrees, move started items to In progress and print status table).

## 6. Review loop (per lane, as each finishes)

You own every line that ships. Process every review with `mstack-receive-review`, and repeat that rule in every brief and fix message.

1. **Coordinator diff check.** Commit lane work first where `host.md` › Lanes says you commit. Inspect `git -C <worktree> diff <lane base>...HEAD` for acceptance criteria, scope, tests, repo/plan rules, bug-lane root-cause rubric (`references/review-loop-and-delivery.md` › Accepting a root-cause claim), and web-UI pre-review checks (`references/web-ui.md`).
2. **Lane transcript check.** Where the host table row "A lane's transcript" names a check, read the lane's transcript (`host.md` › Lanes) BEFORE launching any reviewer for that lane, accumulating writers across all rounds on that branch. Any chosen vendor whose model any round named must NOT review that lane; if unreadable or non-Gemini, send call `(d)` of §0 before handing findings to `mstack-receive-review`.
3. **Advisor and offered reviewer(s).** Consult the advisor where the host table names one. Run the chosen reviewer command(s) from the final `mstack-vendors` block: cheap-tier lanes use the second job group, all other lanes the first job group. Put the actual diff text directly in `<prompt file>` after the review prompt text, and fill ONLY the run-time parts `commands.md` names (`<prompt file>`, `<scratch file>`, a lane worktree verified by `git worktree list`, or an in-place effort/model change required by `Steps` after a rejection). Never leave a reviewer command running in the background or report before it completes and you read its output. With two reviewers, run them one after the other (second starts after first completes, whatever first returned, each with its own approval outside the sandbox in Antigravity, exit codes and outputs kept apart). Follow `Steps`: non-zero exit, empty/diagnostics-only output, `is_error`, wrong `modelUsage`, or non-empty `permission_denials` is a failed run (never clean); apply at most the one allowed repair; if no chosen reviewer returns a valid review (or none is left), warn the user and run the fallback review per `Steps` (a fallback on this session's own model or with no model option asks nothing; when a fallback's `Steps` supply a flagged model that differs from this session's model, ask one question of its own naming that model and the next non-flagged model down and wait before running it; on no, run the next non-flagged model down and record the answer in §9).
4. **Triage with `mstack-receive-review`.** Hand each review that counts to `mstack-receive-review`, ONE REVIEW AT A TIME and UNMERGED, with the exact three caller lines (`Review:`, `Writers:`, `Reviewer vendor:`) from `Steps`. Reproduce and verify every finding before accepting; never upgrade a review's record to `cross-vendor`.
5. **Fix rounds.** Send verified findings back via `host.md` › Fix rounds (never patch lane code in Workflow mode). Re-review fix diffs; repeat external review only for substantial fixes. Two rounds without accepted evidence -> stop and replan (`working-style.md`), moving up a tier on capability failures (§3).
6. **Close item.** Move accepted items to Closed, update `progress.md` (`Executed by: <writers>.`, branch and commits; bare `unknown` if any writer is unknown with known co-writers noted after `Evidence:`), and print the status table.

## 7. Integrate and validate locally

Follow `references/review-loop-and-delivery.md` › Section 7 (integrate accepted commits, reserved files, checklist, §0 call `(e)` if `Writers:` changed, final review unmerged via `mstack-receive-review`, sensitive-data gate, cleanup).

## 8. Deliver: one PR, serialized CI

Follow `references/review-loop-and-delivery.md` › Section 8 (push and open one PR or stop locally, serialize CI, process PR comments with `mstack-receive-review`).

## 9. Final report

Follow `references/review-loop-and-delivery.md` › Section 9 (handoff on stop, outcome, next action, status table, lane models/expensive-model answers, reviewers with exact `Record`/failures/fallbacks, Antigravity leader-model provenance omitted on Claude Code/Codex, findings, validation, risk, cleanup; `references/follow-up-issues.md` if deferred).
