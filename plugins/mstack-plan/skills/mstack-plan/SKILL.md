---
name: mstack-plan
description: Use when the user has a spec, requirements or a spec.md and wants an implementation plan, a master plan, a phase or task breakdown, or work decomposed for agents, or says "plan this", "break this down", "decompose the spec", "create the plan" or "plan the implementation", even if they do not name this skill. Turns an approved spec into a reviewed, phase-by-phase, test-first plan with the right skills named for every task, a progress file, and an execute-plan.md that starts inline or multi-agent execution. Plans only; it never implements, and it does not run an existing plan (the mstack review workflows do that).
---

# mstack plan

You turn an approved spec into an implementation plan that an agent in a fresh session can execute task by task. The plan is the deliverable. You never implement it.

A good plan here has five properties. Every requirement in the spec maps to a task. Every task fits one fresh agent session and proves itself with a test that fails first. Every task names the skills that help with exactly that work. A model from another vendor has reviewed the plan, or, when that reviewer is not available, a fresh subagent of the same vendor, recorded as such. And the plan carries its own progress file and start-up prompt, so inline execution and the mstack review workflows can pick it up, hand it over, and resume it.

## Host tools

This skill runs in Claude Code, in Codex and in Antigravity. It names roles, not tools.

| Role | Claude Code | Codex | Antigravity |
|---|---|---|---|
| Your question tool | `AskUserQuestion` | A numbered round in chat, then wait for the reply | `ask_question`, then wait for the reply |
| Your subagent tool | `Agent` | The session's agent tool if it has one, otherwise a separate read-only `codex exec` run | `invoke_subagent`, on the subagent tier that the `antigravity` row of the model call below names under "How to set" |
| Loading a skill | The Skill tool | Read the skill's SKILL.md and follow it | Read the skill's SKILL.md with `read_file` and follow it |
| The skill folder | The base directory shown when this skill loaded | The folder of this SKILL.md | The folder of this SKILL.md |
| The cross-vendor reviewer | Codex, through the skill-codex `codex` skill | Claude, by a read-only `claude -p` run | None in this skill: the plan review runs as the same-vendor fallback of `references/plan-review.md`, with its warning |
| `<host>` for the scripts | `claude` | `codex` | `antigravity` |

Without a subagent tool, do the delegated step yourself and say so.

Set the model on every subagent, because one started without it runs on this session's model, the most expensive choice. Before the first subagent, and in every run before phase 3 sets a tier, make one called-mode call to `mstack-best-model-for` with exactly this message:

```text
Called by: mstack-plan
Vendor: both
Tiers: cheap, standard, most capable
```

In Antigravity the second line says `Vendor: all` instead, and the block then has three rows per tier: `both` returns only the `claude` and `codex` rows, and a missing row is never an answer. This host's vendor is `claude` in Claude Code, `codex` in Codex and `antigravity` in Antigravity.

Rule 8 of phase 3 governs every model named here and below: no flagged model runs or is written without its own yes. A lookup that runs before rule 8's round uses a model that is not flagged: when the `cheap` row of this host says Expensive `yes`, make the second call below first and use the first model it returns that is not flagged; the cheap-helper slot still gets its question in the round, and after a no later lookups keep that alternative.

Its `cheap` answer for this host's vendor, as rule 8 settled it, goes on every read-only search or lookup; the same answers fill `execute-plan.md` in phase 5 and the same-vendor fallback reviewer in phase 7. The plan review is the exception and uses the model `references/plan-review.md` names.

One second called-mode call follows only when a row of that block says Expensive `yes`. It holds one request per such row, and its answer for a row is that row's alternative (phase 3, rule 8):

```text
Called by: mstack-plan
Vendor: <the row's vendor>, Tier: <the row's tier>, never: <the row's model>        (one line per row that says yes)
```

A called skill's result block ends that skill, never your turn. Write the block and start your next step, with its tool call, in the same message: a message that holds only the block ends the turn before the plan exists.

## Files in this skill

| File | When |
|---|---|
| `references/plan-format.md` | Phases 3 and 5. The plan's file layout, fields, states and resume rules. The three mstack workflows that execute plans (`mstack-codex-review-workflow`, `mstack-claude-review-workflow`, `mstack-claude-pm-codex-dev`) ship the same file |
| `references/codegraph.md` | Phase 1, before reading the code |
| `references/plan-review.md` | Phase 7 |
| `references/execute-plan-template.md` | Phase 5 |
| `scripts/check-required-skills.sh` | Preflight |
| `scripts/check-plan.mjs` | Phases 6 and 7 |

## Ground rules

1. **Plan, do not build.** Write only inside the plan folder. Never change the repository's code, and never commit or push unless the user asks.
2. **The spec is the binding authority.** The plan argues from it. A requirement that turns out to be undecided goes back to the spec (`mstack-write-specs`), never into the plan as a guess.
3. **Facts are yours, decisions are the user's.** Settle every fact from the repository, its docs and the sources the user gave, and cite where it came from. Ask the user only for decisions, each with your recommendation.
4. **Test first.** Every task that changes behavior is written red-green: the failing test, the run that shows it failing, the minimum code, the run that shows it passing, and a check that the test can still fail. Only work with no behavior to test is exempt, with the reason written down.
5. **The review always runs.** Every plan is reviewed before approval, by the cross-vendor reviewer when it is available and otherwise by the same-vendor fallback in `references/plan-review.md`. Never ask the user whether to review.
6. **Approval is an explicit yes to the written plan.** A yes to an outline, an earlier "just write it", silence, or a reviewer's verdict is not approval. Any edit after approval sets the plan back to Draft.
7. **Keep secrets out.** Cite external sources by link or name. Never copy credentials, tokens or personal data from them into the plan.

## 0. Start

**Required skills, first.** Before any question or other work, check the four shared skills this skill calls: `mstack-find-skills`, `mstack-best-model-for`, `mstack-receive-review` and `mstack-research`. For each one:

1. It is in this session's skill list (as `<name>` or `<plugin>:<name>`): continue.
2. It is not in the list, but `scripts/check-required-skills.sh` (Preflight) reports it `ok` on disk: it was installed after this session started. Say that a new session is needed, and stop.
3. Otherwise it is not installed. Print this and stop, with nothing else done:

   ```text
   mstack-plan needs <name>, which is not installed.
   Claude Code: claude plugin marketplace add mubeda/mstack, then claude plugin install <name>@mstack
   Codex:       codex plugin marketplace add mubeda/mstack, then codex plugin add <name>@mstack
   Antigravity: agy plugin install https://github.com/mubeda/mstack/tree/main/plugins/<name>
   Skills CLI:  npx skills add mubeda/mstack --skill <name> -g -a <claude-code|codex|antigravity> -y
   Or install mstack-setup the same way and run it: it installs everything the mstack skills need.
   Then start a new session.
   ```

There is no built-in fallback for any of them.

Then send one message that restates the user's goal in a sentence and asks these questions together with your question tool. Skip a question only when the request already answers it.

1. **Where should the plan go?** Recommend, in this order: the folder the spec already sits in when it is a plan folder of its own, the repository's existing plans folder if it has one (look for `docs/plans/`, `plans/`, `docs/specs/`), or `docs/plans/<yyyy-mm-dd>-<slug>/`. Accept any path.
2. **Which spec?** Only when the request names none. Offer the specs you find (`rg -l --glob '*.md' '^### R1\b'`, `docs/specs/`), newest first.
3. **External sources.** Ask whether there is any information outside the repository the plan should use, such as links, wiki pages, design files, tracker issues, API or vendor documentation, or earlier decisions. Recommend "none" only when the spec's Source line and the repository docs already cover the work.
4. **Reviewer model and effort.** In Claude Code, the Codex model (recommend `gpt-6.2-sol`, alternative `gpt-6.2-astra`) and effort (recommend `high`, then `medium`, `xhigh`, `max`). In Codex, the Claude model (recommend `opus`, alternative `sonnet`) and effort (recommend `medium`, then `high`, `low`). Accept any other name the user types. Write "(expensive)" after an option whose model is flagged (phase 3, rule 8). A reviewer model the user names in their answer is the user's choice. An answer that only points at an offered option ("the alternative", "the second one") names no model: when that option is flagged, the plan reviewer gets its own question under phase 3, rule 8, and no file names that model before its yes. Ask this also when the preflight warned that the reviewer is missing, because the user may install it before phase 7; never ask for a model of the same-vendor fallback, which takes its model from the model call. In Antigravity, skip this question and put this line into your first message to the user, whatever else that message holds: "The plan review will be a same-vendor review by a fresh subagent, because this skill has no cross-vendor reviewer in Antigravity yet."

When the folder already holds a plan (`plan.md` and `progress.md`), read both and resume instead. Before a Draft plan continues, make the model call of Host tools and check every stage and slot its files record against rule 8 of phase 3: each flagged tier or model that has no Decisions line of rule 8 gets its question now, whatever phase comes next. A Decisions line counts only when it names every model the current block flags for that stage or slot; for the ones it does not name, ask once. Then the Draft continues from its first unfinished phase of this skill. An Approved plan stays as it is unless the user asks for a change, and that change sets it back to Draft. A plan whose tasks are already In progress or Closed is being executed, so change only tasks that are still Open and log why. An `execute-plan.md` written by an earlier version of this skill tells the inline executor to switch to another reviewer model when the chosen one is rejected: when you resume such a folder, replace rule 3 of its "Rules for the whole run" and the whole failure bullet of its review step (the one that begins "An empty output or a non-zero exit") with the text of `references/execute-plan-template.md`, filling the placeholders from the old file, and log it in `progress.md`. An `execute-plan.md` whose review step reaches Claude from Codex through a plugin's script, and not through the Claude Code client itself, is also from an earlier version: replace that Codex bullet and the reviewer question (question 2 of "Ask the user first") with the template's the same way, and log it. Where such a file records or recommends a Claude reviewer by an alias, write the full model id in its place, from the "How to set" cell of the `claude` row that names the alias in the model block: a migrated start file never hands an alias to the Claude client. A value copied from the old file is no consent: before either edit writes a flagged model into a new instruction, also in an Approved plan, ask that slot's question of rule 8 once, and after a no write the alternative. Neither edit sets an Approved plan back to Draft, and a recorded reviewer model that is not flagged stays.

## Preflight

```bash
bash <skill-folder>/scripts/check-required-skills.sh --host <host>
```

It checks `node`, `git` and the four shared skills, warns when the cross-vendor reviewer is missing, and notes the recommended mstack skills. In Claude Code, also confirm the reviewer skill appears in this session's skill list, because a skill installed mid-session loads only in a new session.

If `node` or `git` is missing (a `MISSING` line), tell the user and stop until it is installed, because no fallback replaces them. A `MISSING` shared skill is handled by the required-skills step of section 0. If the checker warns that the cross-vendor reviewer is missing (a `WARN` line), tell the user that `mstack-setup` installs it (the login stays a step for the user), and continue without waiting. Warn the user that the plan review will run as a same-vendor review by a fresh subagent, which tends to miss more than a review by another vendor, and continue with the fallback in `references/plan-review.md` › When the run fails. The plan says so. In Antigravity the checker always prints that line, because this skill has no cross-vendor reviewer there: give the warning, name no install, and continue.

For any other missing item, the user runs `mstack-setup`: it installs the missing skills, plugins and command-line tools at user scope after one yes, and lists what it cannot install (`node`, `git`, logins) as steps for the user. This skill installs nothing itself.

## 1. Ground

Read before you ask. Send broad searches to your subagent tool and ask it for file pointers and short excerpts, not file dumps.

1. **The spec.** Read it in full. If it lives outside the plan folder, copy it to `<plan-folder>/spec.md` and record the original path under `plan.md` › Sources. If its Status is Draft, tell the user and recommend finishing it with `mstack-write-specs` first; plan from a Draft only on the user's explicit yes, and record that. With no spec at all, recommend `mstack-write-specs` with its save location set to `<plan-folder>/spec.md`, and stop until the spec exists. When the whole change touches one or two files with an obvious approach, say that it needs no plan, and stop unless the user still wants one.
2. **Repository rules.** Read every AGENTS.md, CLAUDE.md, CONTRIBUTING and README that applies. They bind the plan, the same as the spec.
3. **Documentation.** Find the repository's docs and decide which ones this plan must use.
   - Look in `docs/`, `doc/`, `documentation/`, `adr/`, `adrs/`, `decisions/`, `rfcs/`, `design/`, `architecture*`, `specs/`, `plans/`, `wiki/`, any docs index, and every path the rules files or README point to.
   - Search them case-insensitively for the spec's nouns: requirement names, components, entities, endpoints, screens. One hit is enough to read the file.
   - Keep each doc that constrains or explains the work, with its path and one line on why it matters. Earlier plans and specs in the repository show its conventions.
   - Each relevant doc goes into `plan.md` › Sources and into the Read first line of every phase and task it affects.
4. **External sources.** Read each source the user gave, with whatever tool the session has (a web fetch, a connected tool, `gh`). These are the sources somebody handed you; facts nobody gave are step 6's. Keep only what bears on the plan and cite it. When a source cannot be reached (a login, no connector), ask the user to paste the part that matters, and record it as "not reachable: <reason>" until they do.
5. **The code.** Follow `references/codegraph.md` before reading code. Then map the entry points, the conventions, the test layout, and every existing file the spec touches. Take the build, test, lint and format commands from CI config, a Makefile, a package manifest or a repository rule, and run the test command once to confirm it works (skip and say so when it needs services or takes very long).

6. **Research what the repository cannot answer.** After the code is read, list two kinds of item:
   - every package, SDK or external API that the spec's work adds, upgrades or uses in a way the repository does not use yet;
   - every name, signature, command, flag, limit or behavior of something outside the repository that a task's steps would state, and that the spec, the repository and the user's sources do not give.

   With no item, write "Research: none needed" under `plan.md` › Sources and continue. Otherwise load `mstack-research` with a message in exactly this form, at most 8 items per call and a second call for more:

   ```text
   Called by: mstack-plan
   Project: <path of the repository>
   Online search: off (<reason>)        (only when the user or the session says the network is off)
   Depth: quick                         (only when every item is a single package fact)

   <ID>: <question>
   Package: <name>                      (under each item about a package)
   ```

   Read its result block, which ends with a `Search:` line. Read that line whole: check for `Search: ran, pages not opened (<reason>)` before you take it as `Search: ran`, because both begin the same way.
   - A claim whose fourth field says `not opened` is open, not confirmed, under either closing line: the claim's own field decides. It goes under `plan.md` › Sources with its address and the words `not opened`, and never into a step or a Global constraint as a fact. Every task that needs it gets the line `unconfirmed: <claim> (<address>)` in Read first, and its steps leave that value to be confirmed.
   - Every other claim, whether from an opened page or from a file, goes under `plan.md` › Sources with its link or file path, the version it holds for and the date, and into the Read first line of every phase and task it affects. A claim read from a file keeps that file as its source, also when the pages were not opened. For a package, the `Version:` line of the block (the version in use and the file it was read from) goes into Global constraints.
   - A conflict, or a "Not found" that changes a task, becomes a question of phase 2, with the evidence.
   - When the block says `Search: not run`, continue, write "Research: not run (<reason>)" under Sources, and name it in the approval summary of phase 8.
   - When the block says `Search: ran, pages not opened (<reason>)`, continue, write "Research: pages not opened (<reason>)" under Sources, and name `pages not opened (<reason>)` in the approval summary of phase 8.

   Never state a call, a flag or a default of an external package in a task when neither the repository nor a claim of the block supports it.

## 2. Questions

Grill the plan, not the spec. The spec settled what to build. Ask only the decisions the spec leaves to the plan, such as the order of delivery, one pull request or several, the level of tests where the spec names none, migration and rollout order, what may be stubbed, and which existing code to reuse or replace.

1. Model the open decisions as a tree. The frontier is every decision whose prerequisites are settled. Ask the whole frontier in one numbered round, never one question at a time and never everything at once. A question that depends on another open question waits for a later round.
2. Settle facts yourself and never ask them. In each question's body, cite the doc, source or file that frames it.
3. Word each question so that "yes" accepts your recommendation, and accept answers by number. Each item has the question, a short context with lettered options, and a last sentence with your recommendation and its reason.
4. Recompute the frontier after every answer. Stop when it is empty, then restate the shared understanding in a few lines and wait for the user to confirm it.
5. A question about a requirement itself (what the system must do) is a spec gap. Name it, recommend updating the spec with `mstack-write-specs`, and do not plan that part until it is settled.
6. Record every decision and every fact that resolved a question in `plan.md` › Appendix: questions record.

## 3. Decompose

Follow `references/plan-format.md`.

1. **Task size.** A task is the smallest unit that has its own test cycle, ends in a result that can be checked on its own, fits one fresh agent session, and is worth its own review: a reviewer could reject it while accepting its neighbor. Fold setup, configuration and docs into the task that needs them. Never split by layer, by time, by step count, or by the word "and" in a goal. Cut vertical slices that go through every layer the behavior needs.
2. **Phases.** A phase groups tasks into one outcome with a checkpoint the user can see. A simple change is one phase. Otherwise order phases as: prefactoring that makes the change easy, then the foundation everything else needs, then one phase per user story in the spec's priority order, then polish only if something is left.
3. **Wide changes.** Expand first (add the new form next to the old), migrate the callers in batches, then contract (remove the old form) in a task that depends on every batch.
4. **Dependencies.** Each task's Interfaces say what it consumes and produces, with exact names and signatures. Group phases into rounds from their dependencies. Phases in the same round must own disjoint files, build outputs, fixtures and shared types, or be sequenced. Reserve shared hot files (lockfiles, changelogs, docs indexes, `progress.md`) for the executor.
5. **File map and traceability.** Every file and external change appears once with one owning phase. Check every existing path. Every requirement maps to at least one task, and every Review focus item is pinned by a test in a named task.
6. **Red-green.** Each GIVEN/WHEN/THEN scenario in the spec becomes a test step with the spec's exact values, and each negative scenario becomes a test that proves what must not happen. Use the step pattern in `references/plan-format.md`.
7. **Tiers.** Give each task a model tier: cheap for a fixed command or a fully specified edit, standard for well-specified code, most capable for security, stored data, concurrency, or a design call the plan leaves open.
8. **Expensive stages and slots.** One principle stands above every other instruction of this skill and its references: this skill never runs and never writes a flagged model, in any step or file, unless the user said yes for exactly that stage or slot or named it. Wherever another instruction names a tier's row or a model (a helper of Host tools, the rows the start file is filled from, the fallback reviewer, a retry, a migration), read it as "the choice settled for that slot under this rule". When this principle and another instruction disagree, the principle wins.

   Nobody gets an expensive model without having said yes to it, so each of these needs the user's consent on its own. A tier is flagged when any row for it in the block of the Host tools call says Expensive `yes`, for any vendor, because the executing session may run on another host. A model is flagged when a row of that block names it and says `yes`.
   - A **stage** is each phase whose Tier is flagged and each task whose Tier is flagged. A task inside a flagged phase is a stage of its own.
   - A **model slot** is each flagged model the plan's files would name: the plan reviewer, the cheap helper and the standard helper of each vendor, and the fallback reviewer of each vendor (the `most capable` row).

   After the tiers are set and before you show the outline, ask about every stage and every slot with your question tool: one numbered round, one question per stage and one per slot. Never put two stages or slots into one question, and never offer one answer for all of them. Each question names its stage or slot, the flagged model of each vendor, and the alternative: for a stage the next tier down, for a slot the model the second call of Host tools returned. The alternative must itself not be flagged: walk down past a flagged tier to the next one that is not, and when the second call returns a model whose row says Expensive `yes`, call again with that model added to `never:` until a row says `no`. Never record a flagged alternative without a yes of its own. When no tier or model that is not flagged exists (for example a flagged `cheap` tier), say so in the question; after a no or no answer, record no tier or model for that stage or slot, write the Decisions line with "no approved model" in place of "<alternative> recorded", and stop there with one line that tells the user what to decide. That stop ends the run: the Decisions line is the last thing you write (in your reply, when `plan.md` does not exist yet), no plan file is written or offered for approval, and phases 5 and 6 run only after the user decided, because a task without a tier fails the plan check. Write each question out in full, never as "the same options as above". No answer covers another question. Then, per question:
   - **The user can answer.** Ask, end your turn and wait. Record the flagged choice only after a yes to that question. A default, a preselected option, your own recommendation or silence is never a yes.
   - **The user already answered it** in the conversation, before you asked: take that answer and do not ask again.
   - **A no,** or **a session that cannot answer** (the user or the prompt says so; then ask nothing): record the alternative. The flagged tier or model then appears nowhere for that stage or slot.
   - **The user named the tier or the model for that stage or slot** in the conversation: record it without a question, as the user's choice.

   Record every outcome as a line of `plan.md` › Decisions, in the form that fits:

   ```text
   - P<n>. <stage or slot> on <tier or model> (flagged: <models>). Approved models: <models>. Decided by: user, one question, <yyyy-mm-dd>.
   - P<n>. <stage or slot> on <tier or model> (flagged: <models>). Approved models: <models>. Decided by: user, named in the conversation, <yyyy-mm-dd>.
   - P<n>. <stage or slot>: the expensive choice was declined by the user, <yyyy-mm-dd>; <alternative> recorded.
   - P<n>. <stage or slot>: the expensive choice was not answered, <yyyy-mm-dd>; <alternative> recorded.
   ```

   One line per stage and per slot. The last two forms name no declined tier or model. After a no or no answer, write nothing else about the declined choice either: no extra Decisions line, no note in a phase or task, and no sentence in your reply that says which tier or model the stage or slot would have had. This covers what you write yourself: `plan.md`, the phase and task files, the start file and your reply. A reviewer's output saved under `reviews/` is the reviewer's text and stays unchanged, also when it names a declined choice. A task that keeps a flagged tier (the first two forms) also gets the line `- Approved models: <models> (user, <yyyy-mm-dd>)` directly after its `- Tier:` line.

   This rule runs again for every stage or slot that appears or changes after that round. A task that is split, a phase or task that is added (by the user at the outline, or by a review finding in phase 7), and a task moved to a flagged tier each get a question of their own before the tier or model is recorded. An approval covers exactly the stage or slot it named: the parts of a split task do not inherit it.

   A block without an `Expensive` column comes from an older `mstack-best-model-for`: print the install lines of section 0 for it under the line "mstack-plan needs a newer mstack-best-model-for", and stop. A Draft plan written by an earlier version of this skill may record a flagged tier or model without such a Decisions line: the resume check of section 0 asks that stage's or slot's question once before anything else, because an old value is no consent. An Approved plan stays as it is.

Then show the user the outline before writing the full files: a numbered list of phases with their round, and under each, its tasks with title, Satisfies and Depends on, plus the file map in short. Ask whether the granularity is right, whether each dependency is real, and whether to merge or split anything. Recommend approving it when you see no problem. Revise until the user approves the outline.

## 4. Skills

Name the skills for every phase and task with one call:

1. Load `mstack-find-skills` in called mode. Say that `mstack-plan` is calling, and give every task of the approved outline as a work item (its ID, goal and files). When the repository holds skill folders of its own that are not installed (for example `plugins/*/skills/`), add the line `Also read: <those folders>`.
2. Read its result block. Each task's Skills line takes the skills of that task's section, with their reasons. A skill every task in a phase needs goes on the phase instead.
3. When the block lists candidates for gaps, ask the user in one round which to install. For the ones accepted, load `mstack-find-skills` in user mode with one `Install: <owner/repo>@<skill>` line per accepted candidate; it asks how to install and runs the install, without searching again. A newly installed skill goes into the plan with the note "installed <yyyy-mm-dd>, loads in a new session".
4. A gap the user skips, or a search that did not run, is recorded in `plan.md` › Decisions, so the executor knows the task runs without a specialist.

Never install anything without the user's yes.

## 5. Write the plan

Write every file in `references/plan-format.md` › Folder layout, filling every field. Copy `references/execute-plan-template.md` into `execute-plan.md` and fill it, including the recommended mode and its reason. Fill its helper and fallback-reviewer placeholders from the `mstack-best-model-for` answers of the Host tools call, for every vendor the block has rows for, because the executing session may run on another host and may not have that skill. A plan made in Claude Code or Codex has no `antigravity` rows: write its three Antigravity placeholders as `none (planned in <host>)`. A placeholder whose answer is flagged takes what rule 8 of phase 3 settled for that slot: the flagged model after its yes, otherwise the alternative. Rule 8's principle holds for every value of the start file, the Antigravity ones and the reviewer recommendations included. Create `progress.md` with every task Open, `Executor: none`, and the first 12 hex digits of `spec.md`'s sha256 (`sha256sum` or `shasum -a 256`).

Keep it proportionate. Steps name exact signatures, values and commands, not whole code bodies. A plan several times longer than its spec, or longer than the code it describes, has written the code instead of planning it.

## 6. Check

1. Run `node <skill-folder>/scripts/check-plan.mjs <plan-folder>` and fix every line it prints.
2. Then read the plan against what the script cannot see. Every step decides something (no "TBD", no "handle edge cases"). Names and signatures agree across tasks. Each phase file can be executed by someone who read only it and the plan header. Every Read first entry exists. The Review focus is filled or says why it is empty.
3. Stop after three passes, and list for the user whatever still fails.

## 7. Cross-vendor review

Follow `references/plan-review.md`, and process the review with `mstack-receive-review`. The other vendor's model reviews the whole plan folder, read-only, or the same-vendor fallback when that reviewer is not available. The reviewer is the one rule 8 of phase 3 settled for the plan-reviewer slot, never a phase 0 answer that rule 8 changed. Nothing in this phase asks the user, except the one question for a reviewer model that was rejected (`references/plan-review.md` › When the run fails) and a question of rule 8 for a phase or a task that a finding adds, splits or moves to a flagged tier (rule 8's principle holds for every model this phase runs or records): verify every finding, fix the facts, reject what is wrong or contradicts a decision already made, keep design changes for the approval summary, and record how each finding was handled in `reviews/plan-review-<n>.md`. At most two review rounds.

## 8. Approval

Give the user the plan folder's path, a five-line summary (goal, phases and rounds, task count, the review verdict, open gaps, with research that did not run and `pages not opened (<reason>)` named among the gaps), and the review findings the run did not apply: each one kept for approval with your recommendation, and each one rejected because it contradicted a decision already made. Then ask for an explicit yes to the written plan, with any of those findings the user wants applied. On yes, set `Status: Approved <yyyy-mm-dd> (approved in chat by the user)` in `plan.md` and `Plan status: Approved <yyyy-mm-dd>` in `progress.md`, and run `check-plan.mjs` once more. Any later edit sets both back to Draft.

## 9. Hand-off

Report in this order:

1. The goal and the outcome in one line, with the plan folder's path.
2. Phases with their rounds as a small dependency graph, and the task count.
3. The skills named per phase, the installs the user accepted, and the gaps left. What `mstack-research` was asked, in one line, or that nothing external was needed, or that it did not run.
4. The review: reviewer, model, verdict, findings fixed, deferred and rejected.
5. How to start: "Open a new session in the repository and say: execute `<plan-folder>/execute-plan.md`." That file first asks which of three ways to run it: inline, with the mstack review workflow for that host, or, in Claude Code, with `mstack-claude-pm-codex-dev` (Codex writes each phase, Claude reviews and commits it). In Antigravity it offers inline only. It recommends inline or the review workflow. Say which and why.

Do not start execution in this session unless the user asks. A fresh session starts with a clean context and the plan as its only memory, which is what the plan was written for.
