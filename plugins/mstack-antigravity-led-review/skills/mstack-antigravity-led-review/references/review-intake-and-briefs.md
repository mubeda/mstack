# Review workflow: intake, partitioning and lane briefs

Read this at sections 1, 2, 4 and 5 of `SKILL.md`.

## Work items

A work item is one unit of work with its own acceptance criteria and its own entry in the status table.

| Source | Examples | How you read it at intake | Item IDs |
|---|---|---|---|
| Tracker issues | GitHub issue numbers or links, an issue table or screenshot, issues in another tracker | On GitHub, `gh issue view <n> --json number,title,body,labels,comments,state`. For another tracker, use its CLI or connected tool if the session has one, otherwise ask the user to paste each issue. A table or screenshot is only a pointer list. A triage table from `mstack-backlog-triage` is one too: its now rows are the items, its Type column gives each item's type, and its acceptance hint seeds the criteria, marked inferred. The issue body and comments are the requirements | The tracker's IDs (`#41`, `PROJ-12`) |
| A plan | An execution plan, a tasks file, phase files, a plan folder | Read the whole plan and every file it points to. Each task or phase becomes an item, with the plan's own acceptance criteria, file lists, order and validation commands as the requirements | The plan's own task or phase IDs |
| One task | A feature, a refactor or a bug described in the request | Split it into the smallest items that each give an independently verifiable result, and confirm the list with the user in the grilling round | `T1`, `T2`, and so on |

When the plan tracks status itself (checkboxes, a status column, a tasks file), you own that file. Update it as items change state and commit it at integration. Lanes never edit it.

For an `mstack-plan` folder (holding `plan.md`, `progress.md` and `execute-plan.md`), read `references/plan-format.md` at intake and run its resume and staleness checks first. Each task is a work item with its task ID as the item ID. Its Satisfies line and matching spec requirements are the acceptance criteria, its Files are the predicted files, its Depends on lines and phase rounds are the dependencies, its Tier picks the row of section 3's table, and its Done when is the evidence. Set `progress.md`'s `Executor` line to `host.md`'s `Executor` value and `Branch` to the integration branch. Skip Closed tasks after checking their commits are on the integration branch (bring in any that a stopped run closed but never integrated), resume In progress tasks from their log lines, and update the task's row and append a log line whenever an item changes state, in the same message as the status table: `In progress` lines carry `Owner: <lane or inline>`, and `Closed` lines carry `Executed by: <writers>.` (the lane's verified vendor, the leader's vendor in Single mode, both when the leader also edited the lane's files, or bare `unknown` whenever any writer is unknown, recording any known co-writers after `Evidence:` per `plan-format.md`), `Evidence:`, the lane branch and its accepted commits, because the task closes before integration.

## Section 1: Intake checklist

1. Read every applicable AGENTS.md, CLAUDE.md and CONTRIBUTING file, run `git status --short`, and follow repository pre-work (code index sync, docs index, setup steps). Follow `references/codegraph.md` once in your checkout before reading code. Lanes never run pre-work or build an index. Lanes need git worktrees, so if the target is not a Git repository, stop and ask the user (never run `git init` yourself). If repository rules restrict commits, branches or pushes, ask once here to approve lane commits, the integration branch and the PR, and follow the answer.
2. Read every work item in full per the Work items table above. For an untriaged backlog with no triage table, recommend `mstack-backlog-triage` when installed and ask once whether to triage or proceed.
3. Record per item: acceptance criteria (mark inferred criteria as inferred and confirm while grilling), type (bug, feature, docs, test, CI, measurement), owning package, dependencies (a plan's order counts), and predicted files (`rg` or code index).
4. Where requirements or decisions are ambiguous, grill the user (`references/grilling.md`) before lanes start. Settle facts yourself; ask only for decisions.
5. Prefer agent-runnable verification (scripts, end-to-end drivers, local Docker labs). If an item requires a person at a GUI or device in an agent-managed repository, propose dropping it instead of handing manual steps.
6. Flag items that cannot complete on this machine (another OS, hardware, human measurement, secret). Plan what can be done and state up front what remains.
7. Check disk space (`df -h`) before waves that build heavy targets (Rust, C++, Xcode, Android) and cap concurrent heavy builders.
8. Record `<base>` (branch named by the user, `plan.md` › Base for an `mstack-plan`, otherwise the current branch) and set up the scratch folder per the host table.
9. Print the status table with every item Open.

## Section 2: Partition rules

- Two items whose predicted files overlap, where one changes code the other relies on (store, API, shared type), or that a plan orders go in one lane in sequence, or the later lane starts from the earlier lane's accepted branch.
- Reserve shared hot files (lockfiles, changelogs, generated schemas, shared docs indexes, CI workflows, a plan's status file) for one lane or for you at integration.
- Lanes report changelog and release-note lines; you write them at integration.
- Open the lane table with the throughput checkpoint (`references/working-style.md`), then list lane, items, owned files, forbidden files, plan tier, tier, model, effort, reason, reference files and validation commands before spawning.
- Prefer smaller independent lanes over a few large ones, and never split one item across two writers.

## Section 4: Reference files and skills table

Every brief names the files the lane must read in full before any work, by absolute path:

| Condition | Files |
|---|---|
| Every lane | `references/working-style.md`, `references/writing.md`, and the `mstack-receive-review` skill |
| An `mstack-plan` task | The Read first entries and Skills lines of the task and its phase (named as this host lists them; skip missing skills and report them) |
| Bug, regression, flaky test, crash, hang, leak, performance or incident | The `mstack-diagnose` skill and the reference file its branch table names (a lane cannot ask the user: finish independent work and end with the question) |
| Design-heavy work with open choices | `references/grilling.md` (the lane fact-finding half) |
| Depends on facts outside the repository | `references/external-facts.md` |
| Any web or frontend UI change | `references/web-ui.md`, plus `ui-ux-pro-max` where installed |

Every writing lane uses `ponytail` for code and keeps its skipped/risk line in the lane report. For work items with no plan `Skills` line, call `mstack-find-skills` once in called mode before writing briefs, include each item's returned skills in its brief, and list gap candidates in section 9 (never install during the run). Include section 3's tier answers in every brief so lanes never call `mstack-best-model-for` or re-run `mstack-diagnose`'s required-skills step. Repository or plan rules win over reference files when they collide (note this in the report).

## Section 5: Lane brief template

Every brief is self-contained, follows `references/writing.md` › Prose rules, and includes parts 1 to 10 in order:

1. User's goal in one sentence, item IDs and titles, and pasted acceptance criteria (for an `mstack-plan` task: whole task block, phase Goal/Owns/Must not touch/Checkpoint, and `plan.md` › Global constraints, with Done when as part 4's evidence).
2. Absolute paths of files to read in full (section 4), repository rules and skills to load.
3. Base branch (`<lane base>` = `<base>` or earlier accepted lane branch), owned files, forbidden files, and "if you need a forbidden file, stop and report instead of editing it" (plus any host-specific base merge rule from `host.md` › Lanes).
4. Proof of done: exact command and expected output. If you cannot name it, the lane is not scoped yet.
5. Build hygiene: isolated target/build directory, capped build jobs, pinned toolchain version check.
6. Validation commands to run and report verbatim (focused tests, typecheck, lint/format, repo/plan checklist).
7. Commit and git rules from `host.md` › Lanes (never push, never open a PR, never trigger CI).
8. Advisor / question rules from `host.md` › Lanes (a lane cannot ask the user directly).
9. "Process every review you receive with `mstack-receive-review`, and report per finding what you did."
10. Report format per `references/writing.md` › Lane reports and `host.md` › Lanes (outcome, branch/commits or commits to make, files changed, each criterion with evidence, commands run, external-facts list, skipped/blocked items, open questions, proposed changelog line).
