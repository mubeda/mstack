---
name: mstack-antigravity-led-dev
description: Use when working in Antigravity and the user wants another installed vendor offered by mstack-vendors (claude or codex) to write each phase while this session manages, reviews and commits the accepted tree, for an execution plan, a list of issues or one larger task. Runs in Antigravity only.
---

# mstack dev workflow

Read `host.md` next to this file first: `## This plugin` names this plugin's host, `Host:` value, review and dev workflow names, and `Executor` value. If this session runs in another host, stop immediately, name that host's dev workflow from the host table, and change nothing. For any plan folder, run §0's **Old plan folder, first** check before checking skills, calling any skill or asking any question.

You are the coordinator. Another installed vendor offered by `mstack-vendors` writes each phase, one at a time. You brief it, await completion, read its diff, run validation yourself, review every phase yourself (plus any chosen second reviewer), process every review with `mstack-receive-review`, send findings back, and commit only the exact accepted tree. Never write or edit a phase's code. **No unreviewed commits (non-negotiable):** if the user asks to skip reviews or commit right after the developer ends, explicitly decline skipping review in your reply and still run your §6 review and `mstack-receive-review` before `git commit`. Repository and plan rules win where stricter.

## Roles and words

- **A lane** in shared references is one developer run ("lane duties" are the developer's; "coordinator duties" are yours).
- **The cross-vendor reviewer** is your own review as the leader plus any chosen second reviewer from `mstack-vendors`. Record every review by the block's `Record` value (never invent a label or record `cross-vendor` from the leader's vendor).
- **No fallback review:** your leader review always runs; if a chosen second reviewer fails after its one repair, your review stands and no fallback starts.
- **Capability failure:** §3 wins over `working-style.md` — keep the model and raise effort one listed level. Change model only on rejection (§3) or user choice after two failed rounds (§6).

## Files in this skill

`<skill-dir>` is in the host table; pass its absolute path in every brief.

| File | Who reads it | When |
|---|---|---|
| `host.md` | You | Always first |
| `references/working-style.md` | You, developer | Before work |
| `references/writing.md` | You, developer | Prose, reports |
| `references/dev-brief-and-delivery.md` | You | Items, §§1, 4–9 |
| `references/grilling.md` | You, design phases | Open choices |
| `references/external-facts.md` | Developer (narrow), you (broad) | External facts |
| `references/web-ui.md` | Web UI phases, you | Web/frontend UI |
| `references/follow-up-issues.md` | You | §9 follow-ups |
| `references/plan-format.md` | You | `mstack-plan` |
| `references/codegraph.md` | You only, never briefs | §1, once |
| `scripts/check-required-skills.sh` | You | Preflight |

Read `host.md`, `references/working-style.md` and `references/writing.md` now. Credits: `THIRD_PARTY_NOTICES.md`.

## Host table

Identical across the three dev workflows below frontmatter. Use the column for `host.md` › This plugin.

| | Claude Code | Codex | Antigravity |
|---|---|---|---|
| Host file | `host.md` (`# Host: Claude Code`) | `host.md` (`# Host: Codex`) | `host.md` (`# Host: Antigravity`) |
| Question tool | `AskUserQuestion` (if absent, ask in chat and end your turn) | Numbered list in chat, then end your turn | `ask_question`, then wait (if absent, ask in chat and end your turn) |
| Helper subagent tool | `Agent` (`cheap` for `claude`, no `isolation`) | Fresh read-only subagent (`cheap` for `codex`) | `invoke_subagent` on tier `flash` (never a model id or effort) |
| Loading a skill | The Skill tool | Read `SKILL.md` and follow it | Read `SKILL.md` with `read_file` and follow it |
| Skill folder | Base directory shown on load (`<skill-dir>`) | Folder of `SKILL.md` (`<skill-dir>`) | Folder of `SKILL.md` (`<skill-dir>`) |
| Scratch folder | Session scratch subfolder or `mktemp -d "${TMPDIR:-/tmp}/mstack-dev-XXXXXX"` outside repo (`<scratchpad>`) | New folder outside repo (`<scratchpad>`, never committed; quote if space) | New folder outside repo (`<scratchpad>`, removed after run) |
| File tool | `Write` / `Edit` / `Read` | Direct file tool (no shell redirection) | `write_file` / `edit_file` / `read_file` |
| `Host:` value | `claude-code` | `codex` | `antigravity` |
| `<host>` / Skills CLI agent | `claude` / `claude-code` | `codex` / `codex` | `antigravity` / `antigravity` |
| Install plugin (`<name>`) | `claude plugin marketplace add mubeda/mstack`, then `claude plugin install <name>@mstack` | `codex plugin marketplace add mubeda/mstack`, then `codex plugin add <name>@mstack` | `agy plugin install https://github.com/mubeda/mstack/tree/main/plugins/<name>` |
| Leader model | None; ask nothing, send no `Leader model`, say nothing in §9 | None; ask nothing, send no `Leader model`, say nothing in §9 | Run read-only `agy models` once, ask once with `ask_question` for offered id or `"I do not know"`, send only exact offered id on `Leader model:` (§0 & `host.md`) |
| Advisor | `advisor` tool when available; else leader + offered second reviewer | None; leader + offered second reviewer | None; leader + offered second reviewer |
| This host's review workflow | `mstack-claude-led-review` | `mstack-codex-led-review` | `mstack-antigravity-led-review` |
| This host's dev workflow | `mstack-claude-led-dev` | `mstack-codex-led-dev` | `mstack-antigravity-led-dev` |

## Work items

Follow `references/dev-brief-and-delivery.md` › Work items. For an `mstack-plan` folder, read `references/plan-format.md`, set `Executor:` to `host.md`'s value and `Branch:` to the integration branch, and write `Executed by: <developer>.` on every Closed log line.

## Status table

States: `Open`, `In progress`, `Closed` (never modify external trackers). Print whole at end of intake, on state changes, and in §9; sent-back items stay `In progress`.

```markdown
| Item | Title | State | Phase | Note |
|---|---|---|---|---|
| 1.1 | Parse header | In progress | 1, round 1 | Review running (cross-vendor) |
```

## 0. Ask before starting

**Old plan folder, first.** Before checking skills, calling any skill or asking any question, if the input is a plan folder, read every line of `progress.md` (header, every task-table cell including `Owner` and `Note`, and log) and `execute-plan.md` in full. If any line names `mstack-codex-review-workflow`, `mstack-claude-review-workflow` or `mstack-claude-pm-codex-dev`, print this verbatim (`<replacement>`: `mstack-claude-led-review`, `mstack-codex-led-review`, `mstack-claude-led-dev` respectively; `<review workflow>` / `<dev workflow>` from `host.md`) and stop without checking skills, calling `mstack-vendors`, asking questions or changing any file:

```text
This plan folder was made for <old>, which mstack no longer ships. It is replaced by <replacement>; in this host use <review workflow> or <dev workflow>. Make the plan again with mstack-plan in a new folder. Nothing in this folder was changed.
```

**No unreviewed commits.** Decline skipping reviews; run §6 review and `mstack-receive-review` before `git commit`.

**Required skills & preflight part one, next.** Run part one (`bash <skill-dir>/scripts/check-required-skills.sh --host <host> [--github]`) and check `mstack-find-skills`, `mstack-best-model-for`, `mstack-receive-review`, `mstack-research` and `mstack-vendors` in this session's skill list:
1. Any `MISSING` line on disk (priority over session-list absence): stop with no question asked and no file changed; print the script's host-specific install lines (`Install plugin` row + Skills CLI `-a <agent>`) and `mstack-setup`, installing nothing.
2. Part one exits 0 (all on disk), but any of the five is absent from the session list: tell the user a new session is needed and stop.
3. Part one exits 0 and all five are listed: continue. No built-in fallback exists.

**Model skill call (once).** Call `mstack-best-model-for` once for `codex` and `claude` (`standard`, `most capable`, `Task: code review`) and the leader vendor's `cheap` helper. Take Claude headless ids from `How to set` (never `Model`), and read accepted efforts and next non-flagged model down from `mstack-best-model-for`'s model table.

**Leader model (Antigravity only).** Before the first `mstack-vendors` call, run the listing once (host table `Leader model`), ask once (offering every listed id plus `"I do not know"`), and wait. Only an exact offered id goes on `Leader model: <id>` in every `mstack-vendors` call; any other text counts as `"I do not know"` — say so in your very next message and never send it. Failed/empty listing or a prompt stating nobody can answer (never merely no structured tool): ask nothing, omit `Leader model`, keep reason for §9. Never guess, classify, or ask again.

**Discovery, selection and refresh (`mstack-vendors`).** Always send the whole literal message by loading `mstack-vendors`, and write the full result block before any question or command. Never offer any unlisted vendor or `antigravity`. A typed Claude alias (`haiku`, `sonnet`, `opus`) stays user-typed (skipping R12) and resolves to its `Claude headless id` from `How to set` or `mstack-best-model-for`'s model table in `Models:`.

1. **Discovery.** Send:

   ```text
   Called by: <this workflow>
   Host: <host table Host:>
   Workspace: <main checkout path>
   Leader model: <exact offered id; Antigravity only, omit if none>

   Job: developer
   Models: claude=<full headless id> <effort>; codex=<model> <effort>
   ```

   On `Recommend: no developer here`: stop immediately, say a dev workflow needs a second vendor, name this host's review workflow, and start nothing.

2. **Developer pick (one question).** Restate goal and smallest change (`working-style.md`), include `host.md` › Approvals disclosure, and ask once with your question tool (skip only parts already answered; end your turn): which `available` vendor develops (no preference when two; named as only one when one), its model (`mstack-best-model-for` options or typed name), and starting effort (listed levels only).

3. **Expensive developer model (separate turn).** Only after step 2 is answered (never same turn), if chosen developer model is flagged (`Expensive: yes`) and not typed by the user (number pick does not skip; plan `- Approved models:` never covers a role), ask one separate question naming it and next non-flagged down, and wait. On no, switch down.

4. **Preflight part two (developer side).** Run part two (`--host <host> --developer <developer> [--web-ui]`). Any `MISSING` line stops with remediation and `mstack-setup` **before any developer run**.

5. **Selection.** Send (full Claude headless id for `claude`; repeat `Job: developer` per `(model, effort)` pair §3 can reach; omit `Models:` under `code review` if none or already declined):

   ```text
   Called by: <this workflow>
   Host: <host table Host:>
   Workspace: <main checkout path>
   Leader model: <exact offered id; Antigravity only, omit if none>

   Job: developer
   Models: <developer>=<final model> <effort>

   Job: code review
   Writers: <developer>
   Workflow: dev
   Models: <vendor>=<pre-answered or code-review default model> <effort>
   ```

6. **Second reviewer pick and expensive-model question.**
   - `Recommend: the leader's review`: ask no reviewer question.
   - `Recommend: the leader's review + <vendor>`: unless already answered in the request, ask once whether `<vendor>` reviews every phase too and on which model (never `antigravity` or `<developer>`), and wait.
   - Only after that answer (never same turn), if `<vendor>` is chosen on a flagged model not typed by the user (plan `- Approved models:` never covers a role), ask one separate question naming it and next non-flagged down, and wait. On no, switch down.

7. **Refresh.** Whenever the user declines an offered second reviewer OR the final chosen developer/reviewer model or effort differs from step 5's block (regardless of when the user gave it), send one more literal `mstack-vendors` message before anything runs (same header; omit `Models:` on `Workflow: dev` `code review` when declined so the block recommends `the leader's review` alone, or set `Models:` to only the chosen reviewer's final full headless model and effort, plus developer groups). Run **only** the final block's commands.

State chosen developer, model, effort and reviewers after selection and in §9.

## Preflight: required tools

Run from repo root in two parts (install nothing yourself):

1. **Part one (host):** `bash <skill-dir>/scripts/check-required-skills.sh --host <host> [--github]`. Stop on `MISSING` with remediation and `mstack-setup`.
2. **Part two (developer, after pick):** `bash <skill-dir>/scripts/check-required-skills.sh --host <host> --developer <claude|codex> [--web-ui]`. Stop on `MISSING` **before any developer run**. For `claude`, keep every `in-copy` and `outside-copy` path for §5 briefs.

## 1. Intake (you, not a subagent)

Follow `references/dev-brief-and-delivery.md` › Section 1 (repo rules, never `git init`, `references/codegraph.md` once, commits, items, grilling, `<base>`, fresh `<scratchpad>`, branch, resumed status table). Two hard rules before any developer runs:

- **Uncommitted tracked changes & untracked baseline:** run `git status --porcelain` first; if tracked changes exist with no phase record, list them, stop, and ask whether to keep them for a first review or discard them — never stash, discard, commit, or tell the user to commit them. Record pre-existing untracked paths (`git ls-files --others --exclude-standard`) as `<initial-untracked>` so copy phases never sweep them in.
- **Tracked plan folder (any developer):** commit pending plan-start bookkeeping on its own before starting the developer's clean-start check or `dev-copy.mjs make` (or keep start metadata in `<scratchpad>` / stop and ask if commits are not allowed).

## 2. Order the phases

1. Plan phases run in dependency order (lower round, then lower phase number); without a plan, one item per phase.
2. One developer at a time; never overlap two runs or a run with an open review. Follow `host.md` › Developer runs.
3. Never edit tracked `progress.md` between creating a developer copy and the phase commit: keep findings and notes in `<scratchpad>/phase-<id>.md`, then write one bookkeeping commit after the phase commit so every round's diff meets an unchanged base.

## 3. Choose the developer's effort

Use only effort levels listed for the chosen developer model (`low`, `medium`, `high`, `xhigh`, `max`); skip an unlisted level to the nearest listed level in the same direction and stay at boundaries. Never launch an unlisted effort.

1. Round 1 runs `<dev-model>` at `<dev-effort>`.
2. All-`cheap` phase runs one listed level below `<dev-effort>` (never below lowest listed); any higher task gets no reduction.
3. Round 2 (fix round) runs one listed level above round 1 (never above highest listed, or `xhigh` where capped).
4. A retry keeps its effort and does not count as a round.
5. **Rejected model:** switch to the other tier model (`standard` if `most capable`/typed failed; `most capable` if `standard` failed): if unflagged, get a new `mstack-vendors` block first and report the switch in §9; if flagged, ask one R12 question first. If rejected again or declined, stop and ask; never try a third.
6. Read-only helpers use the leader vendor's `cheap` answer via the host table's helper subagent tool.

## 4. Assign reference files and skills

Follow `references/dev-brief-and-delivery.md` › Section 4 (absolute paths for `working-style.md`, `writing.md`, `mstack-receive-review`, `ponytail`, plan `Read first`/`Skills`, `mstack-diagnose`, `grilling.md`, `external-facts.md`, `web-ui.md` + `ui-ux-pro-max`; `mstack-find-skills` once for non-plan items; repo/plan rules win).

## 5. Brief and start

1. **Brief content.** Prepare the brief per `references/dev-brief-and-delivery.md` › Brief structure; write `<scratchpad>/briefs/phase-<id>-round-<n>.md` **once** with your file tool (never shell redirection) after step 3's preparation (`dev-copy.mjs make` or clean-start check).
2. **Copy developer under `--safe-mode`.** A `claude` developer runs under `--safe-mode` (installed skills off). Name plan files at `<plan>`, state tracked project skills live in the copy, and list every required `SKILL.md` from preflight part two's `in-copy` (relative in copy) and `outside-copy` (absolute path read in place; `--safe-mode` confines nothing) lines.
3. **Prepare, launch, collect (defer check/apply/review/commit/remove to §6).** Execute only the final `mstack-vendors` block's `Steps` that prepare the workspace, write the brief once (step 1), run the Command cell, and parse output; defer `check`, `diff`, `apply`, `snapshot`, review, fix-round resume, commit and `remove` to §6 so each patch applies once and the copy stays until §6 commits. Stop and ask with any step's exact message. Run commands with the shell's longest time limit, never backgrounded; await completion and output. Track run times and exit-2 usage errors per `references/dev-brief-and-delivery.md` › Sections 5 and 6 details. Keep `session_id` (resume `--resume <session id>` in the **same copy**) or `<thread>` (wrong thread = failed round, never accept/commit). Non-zero exit, empty/diagnostics-only output, `is_error: true`, or wrong `modelUsage` is a failed round (retry by cause at most twice at same effort; model rejection follows §3 rule 5; after second failed retry stop per §6 step 8).

## 6. Review loop (per phase, as each round finishes)

You own every line that ships; the developer's report is a claim, not proof. Process every review with `mstack-receive-review` (once per review, unmerged, with exact `Review:`, `Writers:`, `Reviewer vendor:` lines from `Steps`).

1. **Apply once, reviewed tree, phase record.** For a copy developer, run `Steps`'s `dev-copy.mjs check`, `diff` (`--base <base>`), and `apply` (`--source <source>`, `--previous` on fix rounds) **once**; `<phase base>` is checkout `HEAD` (`source`), `base` is for `diff` only. Snapshot reviewed tree: `Steps`'s `snapshot` (`codex`), or initialize a fresh non-existent index under `<scratchpad>` with `git read-tree <source>`, stage ONLY `diff`'s literal `files` (NUL literal pathspecs, skip empty, never `<initial-untracked>`; `references/dev-brief-and-delivery.md` › Sections 5 and 6 details), and run `git write-tree`. Record base, reviewed tree ID, session/thread, duration, validation, reviews (`Record`), and findings in `<scratchpad>/phase-<id>.md`. Phase diff is `git diff <phase base> <reviewed tree>` (round 2 also `git diff <round-one tree> <round-two tree>`).
2. **Your own read and validation (mandatory — never skippable).** If a second reviewer applies this round (steps 3, 5), start it **before** running your diff read/validation; then read the diff against criteria, scope (forbidden edit = finding), tests, repo/plan rules, bug rubric (`references/dev-brief-and-delivery.md`) and `references/web-ui.md`. Run validation yourself and record output. This review and `mstack-receive-review` override any request to skip reviews: decline skipping review in your reply and complete both before `git commit`.
3. **Advisor and chosen second reviewer.** Consult the advisor where the host table names one. If the final block chose a second reviewer: start its review command **before or in the same turn as** your diff read and validation (no background job; await completion before processing findings; if an approval modal blocks, complete both reviews first). Follow `Steps`'s cause-specific repair rule first (rejected effort -> retry once one level down; rejected model -> ask user once and retry once; every other cause — sign-in/network error, declined approval, empty answer, wrong `modelUsage`, non-empty `permission_denials`, other non-zero exit — no retry), then count the run only when it exited 0 with findings or a clean verdict. If it still fails, your review stands, record the failed run and reason in the phase record and §9 (not counted), and start **no fallback review**.
4. **Triage.** Hand your review and (if counted) the second review to `mstack-receive-review` one at a time, unmerged, with exact `Steps` caller lines. Record every review by its block `Record` (`reviewer unknown` under `Leader: unknown`; never upgrade to `cross-vendor` from leader vendor). Reproduce findings before accepting; log in `<scratchpad>/phase-<id>.md`.
5. **Fix round.** Write verified findings to `<scratchpad>/briefs/phase-<id>-round-2.md` (first line `Phase <phase-id>`, findings with file/line/reproduction, report format, `mstack-receive-review`, same `--safe-mode` skill paths for `claude`). Resume the **same developer session** (same copy + `--resume <session id>`, or same `<thread>`) one listed effort level up (§3 rule 3). Never edit phase code yourself. Re-review round diff and rerun validation; repeat second reviewer only if fix touched a file or function findings did not name.
6. **Acceptance.** Accepted only as a whole: every task meets criteria with evidence, accepted findings fixed, validation green.
7. **Accepted-tree commit.** After validation and every review, initialize a fresh index under `<scratchpad>` with `git read-tree HEAD`, stage **all tracked modifications/deletions** (`git add -u`) plus phase new files and new untracked files outside `<initial-untracked>` (literal NUL pathspecs; skip empty; omit `<initial-untracked>`), and run `git write-tree`.
   - If it differs from the reviewed tree, read `git diff <reviewed tree> <new tree>` like a round diff and resolve **every** differing file individually in `<scratchpad>/phase-<id>.md`: **accept**; **exclude** via `.git/info/exclude` (**new untracked files only**, never modified tracked files; ask once if host refuses); or **send back** as a finding. **Never delete or revert** what validation wrote; run **no second full review loop**. Once all differences are resolved, snapshot the accepted set as the **accepted tree ID**.
   - Verify `<scratchpad>/phase-<id>.md` holds every round's base, reviewed tree ID, validation outputs, reviews (`Record`), findings with outcomes, and full accepted tree ID. Never commit without it.
   - Stage only the exact literal accepted paths (NUL-delimited, skip if empty, never `<initial-untracked>`), verify `git write-tree` equals accepted tree ID, commit (`references/writing.md`), verify `git rev-parse 'HEAD^{tree}'` equals accepted tree ID, and record commit ID in `<scratchpad>/phase-<id>.md`. If `git write-tree` differs, unstage nothing by hand: re-snapshot and review.
   - Only **after** the verified phase commit: run `dev-copy.mjs remove` (copy developer), write one bookkeeping commit updating tracked `progress.md` (`Closed`, `Executed by: <developer>.`, commit ID), and print the status table.
8. **Two rounds without accepted evidence.** Stop, keep items `In progress` (`Open` if unstarted), start no third round, write no code. Ask the user, naming what failed and `git status --short`, with three choices: retry with another developer model, re-scope, or stop. Never commit, stash or discard changes yourself.

## 7. Integrate and validate locally

Follow `references/dev-brief-and-delivery.md` › Section 7 (shared files, full checklist, final review of `git diff <base>...HEAD`, sensitive-data gate).

## 8. Deliver: one PR, serialized CI

Follow `references/dev-brief-and-delivery.md` › Section 8 (PR with writer and `Record`, or local stop; serialized CI; inline PR replies).

## 9. Final report

Follow `references/dev-brief-and-delivery.md` › Section 9 (handoff, status table, per-phase models/rounds/switches, reviews with `Record` and failed runs, findings, validation, risk, `follow-up-issues.md`). **Antigravity only:** state whether the leader's model was stated by the user, or unknown and why (`"I do not know"`, not an offered id, listing failed/empty, or nobody could be asked); omit on Claude Code and Codex.
