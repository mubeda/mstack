# Plan format

This file is the contract between `mstack-plan`, which writes a plan, and the agents that execute it: inline execution from `execute-plan.md`, `mstack-codex-review-workflow` in Claude Code, and `mstack-claude-review-workflow` in Codex. All three plugins ship an identical copy. Change all three copies in the same change, and handle plans written by the previous version (see "Format changes").

## Folder layout

A plan folder is recognized by `plan.md`, `progress.md` and `execute-plan.md` sitting together.

```text
<plan-folder>/
  spec.md                    the approved spec the plan implements (binding authority)
  plan.md                    the overview: goal, constraints, sources, phases, file map
  phases/PHASE-01-<slug>.md  one file per phase, holding its tasks
  progress.md                the only status record (one row per task)
  execute-plan.md            the hand-off prompt that starts execution
  receiving-review.md        how the executor processes every review, copied unchanged from the skill
  reviews/plan-review-<n>.md cross-vendor reviews of the plan and how each finding was handled
```

Phase numbers start at 01 and use two digits. A slug is lowercase, hyphenated, and at most six words.

## IDs

1. A task ID is `<phase>.<n>`, for example `1.1`, `1.2`, `2.1`. The phase number has no leading zero inside a task ID.
2. A task heading is exactly `### Task <ID>: <title>`, so tools that slice a plan by task heading find every task.
3. IDs are never renumbered once the plan is Approved. A task added later takes the next free number in its phase. A removed task stays in `progress.md` with the note "removed" and is never reused.
4. Requirement IDs (`R1`, `R2`) and decision IDs (`D1`) come from `spec.md` and keep its numbering.

## plan.md

```markdown
# <Plan title in plain words>

Status: Draft | Approved <yyyy-mm-dd> (approved in chat by the user)
Spec: spec.md (Status line: <copied from the spec>, sha256 <first 12 hex digits>)
Repository: <repository root, relative to the plan folder, or "this repository">
Base: <branch the work starts from>

## Goal
One to three outcomes the user can observe, taken from the spec's Goals.

## Global constraints
Exact values copied from the spec (versions, limits, names, formats), one per line, each with its
source (spec section or R-id). Every task obeys them without repeating them.

## Review focus
Up to five failure modes or input classes the spec implies but no requirement scenario covers,
most likely first. Each one names the task whose tests pin it. "None found" is allowed after a check.

## Out of scope
Copied from the spec's Non-goals, one line each with its reason.

## Sources
- Repository rules: <AGENTS.md, CLAUDE.md, CONTRIBUTING, each with what it constrains>
- Repository docs: <path> (why it matters to this plan)
- External: <link or name given by the user> (what it decides, or "not reachable: <reason>")

## Stack and commands
Per layer, the language, the framework and the real build, test, lint and format commands,
each taken from CI config, a Makefile, a package manifest or a repository rule, and run once.

## Phases
| Phase | File | Goal | Round | Depends on | Tier |
|---|---|---|---|---|---|
| 1 | phases/PHASE-01-<slug>.md | ... | 1 | none | standard |

Phases in the same round run in parallel. A phase depends only on phases in earlier rounds.

## File map
| Path or external change | Action | Phase | Verification |
|---|---|---|---|
| `src/reset/token.ts` | create | 1 | `npm test -- token` |

Every file the plan creates, modifies or deletes, and every external change (a migration, a setting,
a dependency), appears once, with exactly one owning phase.

Shared files reserved for the executor: <lockfiles, changelogs, docs indexes, progress.md>.
Parallel conflicts: "none" or, for each round with more than one phase, the paths two phases share
and the sequencing rule that keeps them apart.

## Traceability
| Requirement | Tasks |
|---|---|
| R1 | 1.1, 1.2 |

Every requirement in the spec appears here. A Could requirement may map to "not planned: <reason>".

## End-to-end verification
The checks that prove the whole plan worked, taken from the spec's Verification section, each a
command or an observable result.

## Risks
- <Risk> -> <mitigation, or the task that handles it>

## Decisions
- P1. <planning decision>. Alternatives: <option and why it lost>. Decided by: user | agent's call.

## Appendix: questions record
- <yyyy-mm-dd> Q: <question> / Recommended: <answer> / Decision: <outcome>
- <yyyy-mm-dd> Evidence: <file or source> / Decision: <resolved without asking>
```

## Phase file

```markdown
# Phase <N>: <title>

- Goal: <one sentence, an outcome that includes its tests and docs>
- Round: <n>
- Depends on: <phase numbers, or "none">
- Owns: <paths and globs this phase may change>
- Must not touch: <paths other phases own>
- Skills: <skills every task in the phase loads, each with a reason>
- Read first: <repository docs and external sources for this phase, each with a reason>
- Checkpoint: <command and expected result, plus what the user can see, that proves the phase works>

## Tasks

### Task <N>.1: <title>

- Satisfies: <R-ids and the scenario names this task pins>
- Depends on: <task IDs, or "none">
- Files: create `<path>`; modify `<path>`; test `<path>`
- Interfaces: consumes <exact names and signatures from earlier tasks>; produces <what later tasks rely on>
- Skills: <skill> (<reason specific to this task>); <skill> (<reason>)
- Read first: <path or source> (<reason>)
- Tier: cheap | standard | most capable
- TDD: red-green | exempt (<reason>)
- Done when: `<command>` exits 0 and <expected output>

Steps

1. [ ] Write the failing test `<test name>` in `<path>` asserting <the spec's exact values>.
2. [ ] Run `<command>`. Expected: FAIL with <the message that proves the test checks the right thing>.
3. [ ] Implement <exact signature> in `<path>`, the minimum that makes the test pass.
4. [ ] Run `<command>`. Expected: PASS, <count> tests.
5. [ ] Prove the test can fail: <temporary break, such as an early return or reverting the fix>, then run `<command>`. Expected: FAIL. Restore the code and run it again. Expected: PASS.
6. [ ] Run the phase's lint and format commands. Expected: no errors.
```

### Field rules

1. **Satisfies.** Every task names at least one R-id, or "support" with the task it unblocks.
2. **Depends on.** Only IDs of tasks in this phase or in phases this phase depends on.
3. **Files.** Exact paths. A path that exists today was checked. A new path follows the repository's conventions.
4. **Interfaces.** Exact names, parameters and return types. An executor sees only its own task, so this is how it learns its neighbors' names.
5. **Skills.** Each skill by its bare name, the name in its SKILL.md without a plugin prefix (`test-driven-development`, not `superpowers:test-driven-development`), with a reason in six to twelve words that says what the skill does for this task. "none" is allowed. A skill that is not installed is marked "(not installed)". Never list a cross-vendor review skill here, because the reviewer depends on the host that executes the plan. The executor resolves each name on its own host (see Resume and staleness, rule 7).
6. **Tier.** A model tier, never a model name. The executor maps tiers to the models its host offers.
7. **TDD.** Code tasks are red-green. "exempt" is only for work with no behavior to test (documentation, configuration with no logic, research, a pure command run), and the reason says which.
8. **Done when.** A command and its expected result, or an observable result with how to observe it. A task without one is not scoped yet.
9. **Steps.** Each step is one action with a checkable result. Every command step has an `Expected:` line. Steps name signatures and exact values, not full code bodies, except where the exact text is the deliverable.

## progress.md

```markdown
# Progress: <plan title>

Plan: plan.md
Spec: spec.md (sha256 <first 12 hex digits>)
Plan status: Draft | Approved <yyyy-mm-dd>
Plan review: <reviewer and model>, round <n>, <outcome>
Executor: none | inline | mstack-codex-review-workflow | mstack-claude-review-workflow
Branch: <working branch, once execution starts>

| Task | Title | Phase | State | Owner | Note |
|---|---|---|---|---|---|
| 1.1 | Token store | 1 | Open | | |

## Log
- <yyyy-mm-dd hh:mm> 1.1 In progress. Owner: inline.
- <yyyy-mm-dd hh:mm> 1.1 Closed. Evidence: `npm test -- token` exit 0, 4 passing. Commits: <a1b2c3d>..<e4f5a6b>.
- <yyyy-mm-dd hh:mm> Ruling: <what was decided>, because <why>. Cost if wrong: <impact>.
```

### States

Exactly three states, the same three the review workflows show in their status table.

| State | Meaning |
|---|---|
| Open | Not started, blocked, removed or dropped. The note says which, and why |
| In progress | Someone is working on it, or it is in review or a fix round |
| Closed | Its Done when ran green, its review findings are resolved, and the evidence is in the log |

A dropped task needs the user's recorded decision in the log. A dropped or removed task does not unblock the tasks that depend on it.

### Who writes it

1. `mstack-plan` creates it with every task Open and `Executor: none`.
2. During execution, exactly one agent writes it: the inline executor, or the workflow coordinator. Lanes and subagents never edit it. They report, and the writer records.
3. The writer updates it every time a task changes state, and appends one log line per change with the evidence.
4. When the plan folder is inside the repository, the writer commits `progress.md` together with the work it records (inline) or at integration (workflow).
5. A Closed log line names the commits that hold the work and, when they are not on the `Branch` line's branch yet, the branch they are on (a workflow lane branch before integration). The `Branch` line names the branch execution continues on: the inline branch, or the workflow's integration branch.

## Resume and staleness

1. Before executing, compute the sha256 of `spec.md` and compare its first 12 hex digits with the `Spec` line of `progress.md`. A mismatch means the spec changed after planning. Stop and ask the user whether to re-plan the affected phases or continue on the old plan.
2. A plan whose status is Draft is not executed. Ask the user to approve it first, or to run `mstack-plan` again to finish it.
3. Resume on the branch in the `Branch` line when it has one, instead of creating a new branch.
4. A Closed task is never redone, but check first that its work is on that branch: `git merge-base --is-ancestor <last logged commit> HEAD`. When it is not, because a workflow closed the task and stopped before integrating it, bring the logged commits in from the logged branch (`git cherry-pick <first>^..<last>`). When that branch is gone, set the task back to In progress and log why.
5. Pick the next task by dependencies, not by ID. A task is ready when every task in its Depends on line is Closed and every phase its phase depends on is Closed. Among ready tasks, take the lowest phase and then the lowest ID. A task marked removed or dropped is skipped, and a task that depends on one stays Open, blocked, and is listed in the final report.
6. A task left In progress by an earlier session was interrupted. Read its log lines and `git log` on the branch, then either finish it from where the evidence stops or restart it. Trust the log and the git history over memory.
7. Resolve every skill name on the executing host before using it: the plugin form (`<plugin>:<name>`) or the bare name, whichever the host lists. A skill the host does not have is skipped with a log line, and the task's steps still apply.
8. A different executor can take over at any point, because the state lives in `progress.md`, not in a session. The new executor sets the `Executor` line and logs the switch.

## Format changes

When a later version of this format changes what a field or a file means, the skill that reads a plan written by the earlier version says what it does with each old value. An old value is never consent to new, wider behavior. Ask the user once instead.
