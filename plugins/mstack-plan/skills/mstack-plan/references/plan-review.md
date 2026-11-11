# Plan review

Read this in Phase 7. Every plan gets a review before the user approves it, from a model of the other vendor when it is available: Codex reviews a plan written in Claude Code, and Claude reviews a plan written in Codex. The author of a plan is a poor reviewer of it, and a model from a different family misses different things. When that reviewer is not available, a fresh same-vendor subagent reviews instead (see When the run fails), and the plan records it as a same-vendor review. The review is never optional, and the user is never asked whether to run it.

## Build the prompt

`<scratch>` is a folder outside the repository: the session's scratch folder when the host has one, otherwise `${TMPDIR:-/tmp}/mstack-plan-<slug>`. Create it first, and put a path in double quotes in the commands below when it contains a space. `<n>` is the review round. Write the prompt to `<scratch>/review-prompt-<n>.md`. It has three parts, in this order.

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

## Run the reviewer

Use the model and effort the user chose in Phase 0. Write output and errors to the scratch folder, never into the repository.

### Claude Code: Codex reviews

Load the `codex` skill from the skill-codex plugin and follow its rules for closing stdin, keeping stderr out of your context, and timeouts. Its usual questions after a run (whether to continue, whether to resume) do not apply here, because this skill already decides them. The sandbox is always `read-only`.

```bash
codex exec -m <model> --config model_reasoning_effort="<effort>" --sandbox read-only -C <repository root> - \
  < <scratch>/review-prompt-<n>.md 2> <scratch>/plan-review-<n>.err > <scratch>/plan-review-<n>.md
```

Give it at least 600 seconds for `high`, 1200 for `xhigh` and 1800 for `max`. Never pass `--skip-git-repo-check` inside a Git repository.

### Codex: Claude reviews

Load the `claude-review` skill from the agent-bridges `claude` plugin and resolve `<claude-plugin-root>` the way it says (for a Codex install, the plugin folder under `~/.codex/plugins/cache/agent-bridges/claude/`). The companion's `task` command without `--write` runs Claude in plan mode, which is read-only. It needs network access and writes job state under the home folder, so run it as an approved (escalated) command.

```bash
node "<claude-plugin-root>/scripts/claude-companion.mjs" task --wait --fresh \
  --cwd <repository root> --model <model> --effort <effort> \
  --prompt-file <scratch>/review-prompt-<n>.md \
  </dev/null > <scratch>/plan-review-<n>.md 2> <scratch>/plan-review-<n>.err
```

Its effort accepts `low`, `medium` or `high`. Never pass `--write`.

### When the run fails

An empty output file or a non-zero exit is never a clean review. Read the last lines of the `.err` file.

1. A model or effort error: rerun with the alternative model offered in Phase 0 (or the next lower effort), and log the switch. A login or other error an agent cannot fix: use the fallback in item 3. Nothing here waits for the user.
2. No error but no output: the run was killed. Rerun once with a longer timeout.
3. The reviewer cannot run at all (the CLI or plugin is missing and the user declined to install it or it loads only in a new session, or an error an agent cannot fix): warn the user that the review will be same-vendor, then give a fresh-context, read-only subagent of your own vendor the same prompt (the model and effort `mstack-best-model-for` returns for the tier `most capable` and your own vendor: in Claude Code `Agent` with those as `model` and `effort`; in Codex a separate `codex exec -m <model> --config model_reasoning_effort="<effort>" --sandbox read-only -C <repository root> - < <scratch>/review-prompt-<n>.md` with them, as an approved (escalated) command because it needs network), and mark the review in `progress.md` and the report as "same-vendor review only, because <reason>". Without a subagent tool, review the plan yourself against the same checklist and say so. Never skip the review silently.

## Handle the findings

Process the review with `mstack-receive-review`, without asking the user anything. Save the reviewer's output, unchanged, as `<plan-folder>/reviews/plan-review-<n>.md`, then append a "Handling" section to it with one line per finding: the finding, its outcome (fixed, rejected, deferred or kept for approval) and the reason or evidence.

1. Verify each finding against the code, the spec and the plan's sources before accepting it.
2. An unclear finding goes back to the reviewer once, with a specific question. Resume the reviewer when its tool supports it, otherwise rerun it with the question and the original finding. Still unclear means rejected.
3. An accepted fact (a wrong path, a missing task for a requirement, a false dependency, a missing Expected line, an inconsistency) is fixed in the plan files.
4. An accepted design change (a different approach, a scope change, a trade-off the spec left open) leaves the plan as it is. Log it as "kept for approval" with your recommendation. Phase 8 lists it for the user.
5. A finding that argues against a decision the spec, the questions record or the user made is rejected, quoting that decision.
6. Minor and Nit findings that do not change what gets built may be deferred.
7. After fixes, run `scripts/check-plan.mjs` again. Rerun the review only if the fixes changed the phases, the dependencies or the coverage. After the second round, decide what is still disputed with the same rules and log it.
8. Update the `Plan review` line of `progress.md` with the reviewer, the model, the round and the verdict.

The review is not approval. Only the user's explicit yes to the written plan approves it.
