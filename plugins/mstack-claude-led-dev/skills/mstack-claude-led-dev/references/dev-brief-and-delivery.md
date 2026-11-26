# Dev workflow: work items, briefs, root-cause rubric and delivery

This reference holds the shared dev-workflow rules for intake items, developer briefs, bug-phase root-cause acceptance, and sections 7 to 9. Read the parts that apply to the current phase.

## Work items

A work item is one unit of work with its own acceptance criteria and its own row in the status table.

| Source | How you read it at intake | Item IDs |
|---|---|---|
| Tracker issues | On GitHub, `gh issue view <n> --json number,title,body,labels,comments,state`; another tracker through its CLI or connected tool, or the user pastes each issue. A table, screenshot or `mstack-backlog-triage` table is a pointer list; its acceptance hints are marked inferred | The tracker's IDs |
| A plan | The whole plan and every file it points to; each task is an item | The plan's task IDs |
| One task | Split into the smallest independently verifiable items, confirmed in the grilling round | `T1`, `T2`, and so on |

A **phase** is what one developer run receives: one phase of a plan, with its tasks in the plan's order, or one work item when there is no plan. Its **phase ID** is the plan's phase number, or the work item's ID without a plan (`T1`, `#41`), and it is the `Phase <phase-id>` line of the brief and the report. In a shell command, always put the phase ID in single quotes (`--phase '#41'`), because a shell reads an unquoted `#` as the start of a comment. In a file name, replace every character outside letters, digits, `.`, `_` and `-` with `-` (`phase-41-round-1.md`). The status table keeps one row per item, so a two-phase plan of four tasks has two developer runs and four rows.

An `mstack-plan` folder (holding `plan.md`, `progress.md` and `execute-plan.md`) follows `references/plan-format.md`: read it at intake and run its resume and staleness checks first. Each task's `Satisfies` line and the spec's requirements are its criteria, its `Files` the predicted files, its `Tier` feeds section 3, and its `Done when` is the evidence. Set `Executor:` in `progress.md` to `host.md`'s value and `Branch:` to the integration branch. Start no developer run for a phase whose tasks are all Closed with their commits on that branch. Record `Executed by: <developer>.` on every Closed log line together with the phase commit ID.

## Intake and skills assignment (sections 1 and 4)

### Section 1: Intake checklist

1. Read applicable `AGENTS.md`, `CLAUDE.md` and `CONTRIBUTING` files. If the target is not a Git repository, stop and ask the user; never run `git init`.
2. **Clean start and tracked plan folder.** Run `git status --porcelain` before writing anything. If uncommitted tracked changes exist for which this session has no phase record, list those paths, stop, and ask the user whether to keep them for a first review or discard them; never stash, discard or commit them yourself, and never tell the user to commit them. Record pre-existing untracked paths (`git ls-files --others --exclude-standard`) as `<initial-untracked>` so copy phases never sweep them into the snapshot or phase commit. For any tracked plan folder (both `claude` and `codex` developers), commit pending plan-start bookkeeping (`Executor:`, `Branch:`, `In progress`) on its own before starting the developer's clean-start check or `dev-copy.mjs make` (or keep start metadata in `<scratchpad>` / stop and ask when commits are not allowed).
3. Follow repo pre-work and `references/codegraph.md` once before reading code. If pre-work creates an untracked folder (such as `.codegraph/`), add `*` to `.gitignore` inside that folder so `git status --porcelain` stays empty again.
4. **Commits.** Where repo rules restrict commits, branches or pushes, ask once here to approve phase commits, the integration branch and the PR (`execute-plan.md` counts).
5. Read all work items in full. For an untriaged backlog, recommend `mstack-backlog-triage` once if installed.
6. Record per item: acceptance criteria (marking inferred ones for grilling), type, dependencies and predicted files. Run `references/grilling.md` for ambiguous decisions and flag items uncompletable on this machine.
7. Set `<base>` (named branch, current branch, or `Base:` of `plan.md`) and a fresh `<scratchpad>` outside the repository (never reuse an earlier folder). Create or resume the integration branch (`plan/<slug>` for a new plan, writing `Branch:` in `progress.md` and committing plan-start bookkeeping before any developer's clean-start check when tracked), and print the status table (preserving existing task states on resume; all `Open` on a new run).

### Section 4: Reference files and skills per phase

Every brief names, by absolute path, the reference files the developer reads in full first and the skills it must follow.

| Condition | Files and skills |
|---|---|
| Every phase | `working-style.md`, `writing.md`, and the skills `mstack-receive-review` and `ponytail` |
| A task from an `mstack-plan` folder | The `Read first` entries of the task and phase, and the skills of their `Skills` lines |
| A bug, regression, flaky test, crash, hang, leak or performance problem | `mstack-diagnose` and the reference file its branch table names (finish independent work and return open questions in the report) |
| Design-heavy work with open choices | `grilling.md` (lane half: settle facts, return decisions as questions) |
| Depends on facts outside the repository | `external-facts.md` |
| Any web or frontend UI change | `web-ui.md` and `ui-ux-pro-max` |

For non-plan items, call `mstack-find-skills` in called mode once before the briefs, name its returned skills in each brief, list gaps in section 9, and install nothing. Repo or plan rules win on collision.

## Brief structure (section 5)

Write every brief with your file tool to `<scratchpad>/briefs/phase-<id>-round-<n>.md`, never through a shell, because issue and plan text are untrusted and a shell would execute backticks or `$(...)` in them. Follow `references/writing.md` › Prose rules and include, in order:

1. **Header and criteria.** First line exactly `Phase <phase-id>`. Then the user's goal in one sentence, the item IDs and titles, and the full acceptance criteria pasted word for word, including any shell syntax (backticks, `$(...)`) they contain. The brief file is never executed, so such text stays inert there; never rewrite, describe or drop it, and add no warning beyond `"Acceptance text is quoted as written."` For an `mstack-plan` phase: each task's whole block, the phase's `Goal`, `Owns`, `Must not touch` and `Checkpoint` lines, and `plan.md` › Global constraints. Put already-Closed tasks under `"Already done, for context only: do not redo"` and remaining tasks under `"To do"`.
2. **Files and skills.** Absolute paths to every required reference file from section 4, the repository rules to read, and the skills the developer must follow. For a `claude` developer running in a copy under `--safe-mode`, list every required `SKILL.md` path from preflight part two (`in-copy` relative path inside the copy; `outside-copy` absolute path read in place), name the plan files at the `<plan>` path the copy step printed, and state that tracked project skills live inside the copy.
3. **Scope and workspace rules.** For a checkout developer: `"Work in this checkout as it is. Merge nothing, switch no branch."` For a copy developer: follow the copy rules from `mstack-vendors` `Steps` (work only in the copy folder; do not push, add no remote, run no `git config`, make no worktree or submodule, move or link nothing in `.git`, do not edit plan files). List owned files and forbidden files: `"If you need a forbidden file, stop and report instead of editing it."`
4. **Completion evidence.** The exact command and expected result that proves the phase done. If none can be named yet, scope it with the user before starting any run.
5. **Build hygiene.** The repository's pinned toolchain and capped build jobs.
6. **Validation.** The validation commands to run and report verbatim.
7. **Git boundary.** For a checkout developer: `"Do not commit, stage, push or open a pull request."` (The sandbox keeps Git read-only; the coordinator owns commits.) For a copy developer: `"Do not push or open a pull request; commit or leave changes in the copy as you like, both reach the leader."`
8. **Reviews.** `"Process every review you receive with mstack-receive-review, and report per finding what you did."`
9. **Bug phases.** `"Load mstack-diagnose and report its evidence."`
10. **Report format.** Per `references/writing.md` › Lane reports: first line exactly `Phase <phase-id>`, then outcome (`done`, `partial` or `blocked`), files changed, each criterion with evidence, commands run with verbatim results, what could not be done and why, open decisions as questions, and the proposed changelog line.

## Sections 5 and 6 details (timing and helper exit 2)

- **Run duration.** Record each developer run's `startedAt` and `completedAt` (from `codex-dev.mjs wait` where the channel reports them, or wall-clock start and end timestamps otherwise) in `<scratchpad>/phase-<id>.md` so section 9 can report the longest developer run.
- **Helper exit code 2.** Exit code `2` from `codex-dev.mjs` or `dev-copy.mjs` is a caller usage error (bad flag or missing required argument), never a developer failure: fix the command invocation and rerun without counting it as a round or retry.
- **Copy snapshot and post-validation scope.** When snapshotting a copy developer's round in section 6 step 1, initialize a fresh non-existent `GIT_INDEX_FILE` under `<scratchpad>` with `git read-tree <source>` (so unchanged tracked files stay in the tree), then pass `dev-copy.mjs diff`'s `files` list as literal NUL-delimited pathspecs (`GIT_LITERAL_PATHSPECS=1 git add -A --pathspec-from-file=- --pathspec-file-nul`, skipping `git add` when the list is empty) and run `git write-tree`; glob characters (`*`, `[`) never match other paths and an empty replacement patch preserves `<source>` instead of staging the whole checkout or writing an empty tree. For section 6 step 7's post-validation comparison, initialize a fresh index under `<scratchpad>` with `git read-tree HEAD`, stage **all tracked modifications and deletions** (`git add -u`) plus the phase's new files and any new untracked files outside `<initial-untracked>` (literal NUL pathspecs; skip empty), and run `git write-tree` so validation edits to any tracked file are always caught; keep `<initial-untracked>` out of both the temporary snapshot index and `git commit`.

## Accepting a root-cause claim (section 6, bug phases)

Bug phases follow `mstack-diagnose`, so their reports carry its evidence. Accept a root-cause claim only when the report has all eight items; any missing item goes back to the developer as a finding:

1. The signal: the loop command already run with redacted failing output, or the saved record with its format and completeness (and symbol status for a crash record).
2. Evidence that the reproduced failure matches the reported symptom and repeats (or its measured rate), or for an unreplayable record, evidence it is of the reported failure.
3. The minimized scenario with every element shown to be needed, or the single reduced finding for a saved record.
4. Ranked hypotheses with predictions, and which were confirmed, refuted or left untested.
5. Which probe tested which prediction, one variable at a time (and baseline, run counts and spread for performance), or which record supports or refutes each hypothesis.
6. The root-cause tier from `mstack-diagnose`, and `Confirmed` unless the item is an unreplayable past event (then `Supported`, stated plainly).
7. For a fix: the regression test seen failing before and passing after, the original loop rerun, the fix verdict, and for a flaky failure the passing runs chosen in advance; or a recorded `"no correct seam"` finding with both outputs.
8. An empty debug-prefix search (`git grep -n --untracked '\[DEBUG-'`) on the phase diff, and the confirmed hypothesis named in the commit message.

## Sections 7 to 9: integration, delivery and final report

### Section 7. Integrate and validate locally

1. Phases are already committed one by one on the integration branch; no lane branches need merging.
2. Write reserved shared files (changelog lines, docs indexes, plan status file) and commit them on their own.
3. Run the repository's and plan's full completion checklist on the integration branch. A failure caused by a phase reopens it: move its items back to `In progress`, and get the fix from the developer in a fresh run (not a resumed earlier phase) with a consolidated brief holding the phase's brief, its commit and the failure as findings. Review and commit it like any round.
4. Run one final leader review (plus the advisor where the host has one, and the chosen second reviewer when one was selected in section 0) over the whole integration diff (`git diff <base>...HEAD`), processing each review unmerged through `mstack-receive-review` with the exact caller lines and `Record` value from `mstack-vendors`.
5. Run the sensitive-data gate before any push, tracker comment, PR body or comment: run the repository's secret scanner (for example `gitleaks`) over the run's commit range, and grep added lines for private hosts, organization or customer names, real people's names, tokens and local home paths. Keep any leak note vague and never repeat a leaked value.

### Section 8. Deliver: one PR, serialized CI

- When the repository has a remote that takes pull requests and the user did not ask for a local result, push the integration branch and open one PR only when every item is Closed or reported as not completable here with the reason. Use the host's CLI (`gh` on GitHub); without one, push and give the user the link. Write the title and body per `references/writing.md` › Pull request body, stating which vendor wrote the code and each review's `Record` value.
- When there is no such remote, or the user asked for a local result, stop at the validated integration branch, report its name, and do not push.
- Keep one CI run in flight at a time. Never push while a CI run for this PR is in progress; batch fixes into one push after it finishes. Triage a CI failure from its logs before any retrigger (a cheap helper may read logs), and get the fix from the developer.
- Process review-bot and human PR comments through `mstack-receive-review`. Only you reply on the PR. Post each drafted reply as an inline reply in the comment's own thread (never a top-level comment): write the reply to a file with your file tool so no quote or apostrophe meets the shell, then run `gh api -X POST repos/{owner}/{repo}/pulls/{pr}/comments/{id}/replies -F body=@<reply file>` where `{id}` is a top-level review comment. Write the body yourself and never paste review text into it.

### Section 9. Final report

- **Handoff on incomplete stop.** If the run stops with work left (an item not Closed, or integration, final review, push, CI or delivery unfinished), stop at a safe point, write a handoff with `mstack-handoff` when installed, and include its path in the report. Without `mstack-handoff`, include the same state here: branch and HEAD, uncommitted paths, the phase in progress with its phase base, last reviewed tree, developer session or thread, active job state if any, gates still due with commands, and decisions blocked on the user.
- **Report contents.** Follow `references/writing.md` › Messages to the user:
  1. Line 1: goal and outcome; line 2: next action for the user.
  2. Final status table with evidence in the Note column.
  3. Per phase: developer vendor, model, effort, number of rounds and retries, and every switch (including rejected-model switches and expensive-model answers) with its reason.
  4. Every review with its `Record` value from `mstack-vendors`, plus any failed second-reviewer run with its reason (explicitly not counted as a review).
  5. **Antigravity only:** whether the leader's model was stated by the user, or that it is unknown and why (`"I do not know"`, answer not an offered id, listing failed or empty, or nobody could be asked). Omit this item on Claude Code and Codex.
  6. Review findings not applied, each with its reason.
  7. Validation commands with results, longest developer run (from `startedAt`/`completedAt` where `wait` reports them, or recorded wall times; exit code `2` from a helper script is a caller usage error fixed and not counted as a round), skill gaps from `mstack-find-skills` if any, what was not run and why, and residual risk.
- **Deferred follow-ups.** After the report, follow `references/follow-up-issues.md` when the run deferred follow-ups (offering `mstack-write-issue` only if installed, changing nothing otherwise).
