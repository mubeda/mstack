# Plan review

Read this in Phase 7. Every plan gets a review before the user approves it, from a model of the other vendor when it is available: Codex reviews a plan written in Claude Code, and Claude reviews a plan written in Codex. A plan written in Antigravity has no cross-vendor reviewer in this skill yet: build the prompt, then go straight to item 3 of When the run fails. The author of a plan is a poor reviewer of it, and a model from a different family misses different things. When that reviewer is not available, a fresh same-vendor subagent reviews instead (see When the run fails), and the plan records it as a same-vendor review. The review is never optional, and the user is never asked whether to run it.

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

Use the plan reviewer as rule 8 of SKILL.md's phase 3 settled it: the model and effort of Phase 0, or, when that model is flagged and got no yes, the alternative recorded for the plan-reviewer slot. Never run a flagged reviewer model without its own yes. Rule 8's principle wins over every instruction of this file: wherever this file names a tier's row or a model, read it as the choice settled for that slot under rule 8. Once "When the run fails" replaced the model or the effort, or chose the fallback, that holds for every later round. Write output and errors to the scratch folder, never into the repository.

### Claude Code: Codex reviews

Load the `codex` skill from the skill-codex plugin and follow its rules for closing stdin, keeping stderr out of your context, and timeouts. Its usual questions after a run (whether to continue, whether to resume) do not apply here, because this skill already decides them. The sandbox is always `read-only`.

```bash
codex exec -m <model> --config model_reasoning_effort="<effort>" --sandbox read-only -C <repository root> - \
  < <scratch>/review-prompt-<n>.md 2> <scratch>/plan-review-<n>.err > <scratch>/plan-review-<n>.md
```

Give it at least 600 seconds for `high`, 1200 for `xhigh` and 1800 for `max`. Never pass `--skip-git-repo-check` inside a Git repository.

### Codex: Claude reviews

Claude reviews through the Claude Code client's own headless mode. Run this one command from the repository root, as an approved (escalated) command, because it needs network access and writes under the home folder:

```bash
cd <repository root> && claude -p --safe-mode --model <model> --effort <effort> --output-format json --permission-mode plan --tools "Read,Grep,Glob" --settings '{"advisorModel":"off"}' \
  < <scratch>/review-prompt-<n>.md > <scratch>/plan-review-<n>.json 2> <scratch>/plan-review-<n>.err
```

- Copy the command whole. Claude Code loads the user's own setup (settings, plugins, hooks, a second advisor model) unless these flags are used. The command is for a session that is not itself Claude Code: this skill reaches Claude only from Codex.
- `<model>` is a full model id, never an alias, because in a headless run an alias can run another model. When the user chose the model by an alias, take the id from the "How to set" cell of the `claude` row that names that alias in the block of SKILL.md's Host tools call; when no row names it, treat it as a model error (When the run fails, item 1), whose one question asks for the full id. `<effort>` is one of `low`, `medium`, `high`, `xhigh`, `max`.
- The run gets reading tools only, so it can change no file and run no command. It finds a file only by reading it, so the prompt names every plan file by its path (the reading list).
- Give it at least 600 seconds. Do not go on before the command has completed and you have read its output.
- The review is the `result` field of the JSON in `<scratch>/plan-review-<n>.json`. The run counts only when all four hold: the file parses as JSON, its `is_error` is `false`, the keys of its `modelUsage` are only the model id you asked for, and its `permission_denials` is an empty list. Anything else is a failed run, never a clean review.

The flags were confirmed on 2026-11-23 with Claude Code 2.1.330, started from a clean shell; a run started from Codex was not confirmed.

### When the run fails

An empty output file, a non-zero exit, or a Claude result that fails one of its four checks is never a clean review. Read the last lines of the `.err` file, and for a Claude run the `result` field too.

1. An effort error: rerun once with the next lower effort, without asking, and log it; with no lower level, or when that one is rejected too, use the fallback in item 3. A model error: ask the user once for another model, offering the alternative of Phase 0, rerun once with the answer and log the change; the user's choice of a model is not consent to another one. Offer only choices that are not flagged or that the user approved for this slot, and never a choice the user declined for it. A flagged model the user names in the answer gets that slot's question of rule 8 first (it names the flagged model and an alternative that is not flagged) and runs only after a yes, recorded in `plan.md` › Decisions in rule 8's form. When that model is rejected too, or the user names none, use the fallback in item 3. A login or other error an agent cannot fix: use the fallback in item 3. Apart from that one question, nothing here waits for the user.
2. No error but no output: the run was killed. Rerun once with a longer timeout.
3. The reviewer cannot run at all (the CLI or plugin is missing and the user declined to install it or it loads only in a new session, an error an agent cannot fix, or the plan was written in Antigravity): warn the user that the review will be same-vendor, then give a fresh-context, read-only subagent of your own vendor the same prompt (the fallback reviewer for your own vendor: the model and effort `mstack-best-model-for` returns for the tier `most capable`, or, when that model is flagged as expensive, the one that rule 8 of SKILL.md's phase 3 settled for that slot, so nothing is asked here: in Claude Code `Agent` with those as `model` and `effort`; in Codex a separate `codex exec -m <model> --config model_reasoning_effort="<effort>" --sandbox read-only -C <repository root> - < <scratch>/review-prompt-<n>.md` with them, as an approved (escalated) command because it needs network; in Antigravity `invoke_subagent` on the subagent tier of the fallback reviewer for `antigravity` as rule 8 settled it: the tier that the `most capable` row names under "How to set", or, when that row is flagged and got no yes, the tier of the alternative recorded for that slot), and mark the review in `progress.md` and the report as "same-vendor review only, because <reason>". A review is called cross-vendor only when the reviewer's vendor differs from the vendor of the model that wrote the plan. In Antigravity the session's model can be of any vendor and a subagent's model is not shown, so a review by a subagent there is always recorded as same-vendor. Without a subagent tool, review the plan yourself against the same checklist and say so. That review runs on the model the user started this session with, which is the user's own choice and no slot of this plan, so nothing is asked; record it as "the session's own model". Never skip the review silently.

## Handle the findings

Process the review with `mstack-receive-review`, without asking the user anything. Save the reviewer's output, unchanged (also when it names a tier or model the user declined: it is the reviewer's text, not yours), as `<plan-folder>/reviews/plan-review-<n>.md` (for a Claude run the text of the `result` field, not the JSON around it), then append a "Handling" section to it with one line per finding: the finding, its outcome (fixed, rejected, deferred or kept for approval) and the reason or evidence.

1. Verify each finding against the code, the spec and the plan's sources before accepting it.
2. An unclear finding goes back to the reviewer once, with a specific question. Resume the reviewer when its tool supports it, otherwise rerun it with the question and the original finding. Still unclear means rejected.
3. An accepted fact (a wrong path, a missing task for a requirement, a false dependency, a missing Expected line, an inconsistency) is fixed in the plan files. A phase or a task that a fix adds, splits or moves to a flagged tier passes rule 8 of SKILL.md's phase 3 first: its own question, before its tier is recorded.
4. An accepted design change (a different approach, a scope change, a trade-off the spec left open) leaves the plan as it is. Log it as "kept for approval" with your recommendation. Phase 8 lists it for the user.
5. A finding that argues against a decision the spec, the questions record or the user made is rejected, quoting that decision.
6. Minor and Nit findings that do not change what gets built may be deferred.
7. After fixes, run `scripts/check-plan.mjs` again. Rerun the review only if the fixes changed the phases, the dependencies or the coverage. After the second round, decide what is still disputed with the same rules and log it.
8. Update the `Plan review` line of `progress.md` with the reviewer, the model, the round and the verdict, and set the `Plan reviewed by` line of `execute-plan.md` to the reviewer, model and effort that actually ran (for a Claude reviewer the full model id; for an Antigravity subagent its tier, and the line then has no effort part).

The review is not approval. Only the user's explicit yes to the written plan approves it.
