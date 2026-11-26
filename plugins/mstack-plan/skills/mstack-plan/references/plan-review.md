# Plan review

Read this in Phase 7. Every plan is reviewed before approval by the reviewers `mstack-vendors` offers, or by its fallback review when it offers none. `mstack-vendors` decides who can review, how each review is recorded, and the exact command and steps to run. This skill writes no vendor command, no client flag and no model of its own. The review is never optional, and the user is never asked whether to run it.

## Build the prompt

`<scratch>` is a folder outside the repository: the session's scratch folder when the host has one, otherwise `${TMPDIR:-/tmp}/mstack-plan-<slug>`. Create it first, and put a path in double quotes in commands when it contains a space. `<n>` is the review round. Write the prompt to `<scratch>/review-prompt-<n>.md` using parts 1 to 3 below. When the `mstack-vendors` result block's `Steps` ask you to start `<prompt file>` with `mstack-vendors/references/review-prompt.md`, keep its read-only review rules but state explicitly right before part 3 that part 3 below replaces its generic code-review answer schema, so the reviewer receives one consistent plan-review output format rather than two conflicting schemas.

### 1. Reading list

State the repository root once, then list every path relative to it. Check that each path exists, and keep a missing one with the note "missing, probably a stale reference".

1. The plan: `plan.md`, every phase file, `progress.md`, `execute-plan.md`.
2. The source of truth: `spec.md`, and the repository rules (AGENTS.md, CLAUDE.md, CONTRIBUTING).
3. The code the plan touches: every existing path in the file map and in the tasks' Files, and the files their Interfaces name. This is usually the longest group, and it is what lets the reviewer check the plan's claims about the code.
4. The docs and sources in `plan.md` › Sources that the plan relies on.

### 2. Instructions

```text
You are reviewing an implementation plan, read-only. Do not edit, create or delete any file.
Read every file in the reading list before judging. Cite file:line for every claim about
the code, and keep verified facts apart from opinions. The spec is the binding authority:
a decision the spec or the user made is not a defect, even if you would have chosen
differently; note it as out of scope instead.

Check, in this order:
1. Coverage. Map every requirement and scenario in the spec to the tasks that satisfy it.
   List requirements with no task, and tasks that serve no requirement.
2. Fidelity to the code. Every path, name and signature the plan claims exists does exist,
   and the build and test commands are the repository's real ones.
3. Correctness. Walk the critical path. Check error, empty and limit cases, and that each
   task's tests would fail without its change (red before green).
4. Dependencies and parallelism. Re-derive the task and phase dependencies from the
   Interfaces and Files. Report missing edges, false edges, and two phases in one round
   that touch the same file, build output, fixture or shared type.
5. Task size. Each task fits one fresh agent session, ends in a result that can be checked
   on its own, and is worth its own review. Report tasks that are too big, too trivial, or
   split by layer instead of by behavior.
6. Self-containment. An agent that reads only one phase file and the plan header can do
   each task: steps are concrete, every command has an Expected line, every task has a
   Done when, and nothing says "TBD", "handle edge cases" or "as appropriate".
7. Skills. Each task's skills fit the work, and a task that clearly needs a skill has one
   or a recorded gap.
8. Consistency. IDs, titles, phase numbers, rounds and names agree across plan.md, the
   phase files and progress.md.
9. Predicted failures. Name the places where execution is most likely to block or fail.
```

Add up to three bullets for this plan's riskiest points, under the heading "Look hard at".

### 3. Output format

```text
Verdict: Approve | Approve with changes | Needs rework, and two or three sentences why.
Coverage: requirement -> tasks, with gaps marked.
Findings, most severe first:
| # | Severity (Blocker, Major, Minor, Nit) | Location (file:line) | Issue | Evidence | Fix |
What the plan got right (so a revision does not break it).
Open questions the plan cannot answer.
```

## Ask `mstack-vendors` and run the review

### 1. Discover the offered reviewers

Before calling `mstack-vendors`, ensure you have the `code review` answers from `mstack-best-model-for` (from SKILL.md › Host tools; call it now if you resumed directly into Phase 7). Build the `Models` line for `claude` and `codex` without this host's own vendor (`codex` alone in Claude Code, `claude` alone in Codex, both `claude` and `codex` in Antigravity), always converting any Claude alias to its full headless id from `Claude headless id` / `How to set`.

Load `mstack-vendors` with the whole literal called message below — never a summary — and keep it verbatim in the conversation:

```text
Called by: mstack-plan
Host: <claude-code | codex | antigravity>
Workspace: <repository root>

Job: plan review
Writers: <the Written by vendors from progress.md, or unknown when missing or unknown>
Models: <vendor>=<model id> <effort>[; <vendor>=<model id> <effort>]
```

Send no `Leader model` line. In Antigravity this skill sends no `Leader model` line and does not ask for it.

### 2. Pick reviewers and refresh when needed

Write the whole `mstack-vendors` result block into the conversation first (before any pick question, reviewer command or fallback command runs), then read it before acting.

- **When `Recommend:` names one or more reviewers:** ask the user once with your question tool which offered reviewers should review and on which model and effort, showing the offered vendors, their models, their efforts and their Record values (`Recommend:` is the default; never offer `antigravity`). End your turn and wait for the reply (unless the user already answered the pick in their prompt, or explicitly said they cannot answer).
  - If an offered default model the user accepted without typing its name is flagged as expensive in `mstack-best-model-for`, ask a question of its own naming the flagged model and the next non-flagged model down (rule 8 of SKILL.md's phase 3). A model the user explicitly typed in their pick answer draws no expensive-model question. A session that cannot answer runs the recommendation on non-flagged models.
  - Whenever the user's chosen reviewer subset OR any chosen model or effort differs from the discovery block's `Recommend:` and `Models:` (for example picking only one of two offered reviewers on its same model, typing another model, or declining a flagged default), send ONE more literal message to `mstack-vendors` with `Models:` holding ONLY the chosen reviewer(s) and their final model and effort (full headless id for `claude`), and use ONLY that second result block to run the review. Never edit a Command cell from the first block yourself.
- **When `Recommend:` says `a fallback review`:** ask no reviewer pick question and no model question. Show the warning to the user and run the fallback review strictly by the block's `Steps`.

### 3. Execute the final block's commands and `Steps`

Copy each recommended reviewer's Command cell from the final block unchanged, filling ONLY the run-time placeholders that command names (`<prompt file>` = `<scratch>/review-prompt-<n>.md` from "Build the prompt", and `<scratch file>` = a new file per reviewer in `<scratch>`). Follow every numbered line of the block's `Steps` in order:

- With two reviewers, run them one after the other (the second starts only after the first completed, each with its own approval where the host asks and each run's exit code and output kept apart).
- Wait for each command to finish and read its output before reporting or moving on. Never leave a reviewer command behind as a background job.
- Check every completion condition the `Steps` name (exit code, non-empty findings or clean statement, JSON parsing, `is_error`, empty `permission_denials`, and `modelUsage` matching the requested model).
- Follow the `Steps` on any failure (one repair where the `Steps` allow one, and the fallback review + warning when no reviewer's run counts). For a fallback review whose `Steps` tell you to read the `.err` header, derive `Reviewer vendor:` from that header exactly as the `Steps` say.

## Handle the findings

Hand every review that counts to `mstack-receive-review`, one review at a time and unmerged, with the exact three caller lines the block's `Steps` give (`Review:`, `Writers:`, `Reviewer vendor:`), followed by the reviewer's output unchanged. Never merge two reviewers' outputs before handing them to `mstack-receive-review`, and never upgrade a review's record to `cross-vendor` when `mstack-receive-review`'s rules give another value.

Save each reviewer's output unchanged under a heading naming its vendor (also when it names a tier or model the user declined: it is the reviewer's text, not yours) in `<plan-folder>/reviews/plan-review-<n>.md`, then append a `## Handling` section with one line per finding: source, finding, outcome (fixed, rejected, deferred or kept for approval), reason or evidence, and `record: <value>`.

1. Verify each finding against the code, the spec and the plan's sources before accepting it.
2. An unclear finding goes back to the reviewer once, with a specific question. Still unclear means rejected.
3. An accepted fact (a wrong path, a missing task for a requirement, a false dependency, a missing Expected line, an inconsistency) is fixed in the plan files. A phase or a task that a fix adds, splits or moves to a flagged tier passes rule 8 of SKILL.md's phase 3 first: its own question, before its tier is recorded.
4. An accepted design change (a different approach, a scope change, a trade-off the spec left open) leaves the plan as it is. Log it as "kept for approval" with your recommendation. Phase 8 lists it for the user.
5. A finding that argues against a decision the spec, the questions record or the user made is rejected, quoting that decision.
6. Minor and Nit findings that do not change what gets built may be deferred.
7. After fixes, run `scripts/check-plan.mjs` again. Rerun the review only if the fixes changed the phases, the dependencies or the coverage. After the second round, decide what is still disputed with the same rules and log it.
8. Update the `Plan review` line of `progress.md` with every reviewer that ran, its model, its Record value (from the block's Record column, or from `mstack-receive-review` when the `Steps` derive `Reviewer vendor` from `.err`), the round and the verdict, and replace `pending (Phase 7 plan review)` on the `Plan reviewed by` line of `execute-plan.md` with every reviewer, model, effort and Record value that actually ran.

The review is not approval. Only the user's explicit yes to the written plan approves it.
