# Testing

Read this in Phase 5 (the comparison test) and Phase 6 (the benchmark and review page). A skill is finished only when a run with it beat, or at least matched, a run without it on a realistic task, and the user saw the evidence.

## The comparison test

1. Agree on at least one realistic task in Phase 2: a prompt a real user would type, with the files it needs. A small local skill needs one task. A plugin skill needs two or three, including one where the skill must not do something (refuse, ask, stop).
2. Run the task twice in fresh contexts: once with the skill installed, once against the baseline. Fresh means the run sees only the task and its files, never this conversation.
3. Save each run's reply and the files it produced in its own run folder, then compare them against what a good result looks like.
4. Tell the user what the skill changed. When the baseline did as well as the skill, say so and ask whether the skill is needed. Never report an improvement the runs do not show.

## Choosing the method

Use the first method the host allows, and say which one you used.

1. The subagent tool, one subagent per run, all started together. Give each the task, the input files and where to save outputs; give only the "with skill" run the skill's path.
2. The fresh-session command in the host file, run in a throwaway copy of the test repository, one copy with the skill installed and one without.
3. Hand the user the prompt and the two setups, and ask them to run each in a new session and paste back the replies.

Method 3 counts only after the user returns the results. Until then, report the skill as untested, never as finished.

Withholding the skill's path does not isolate the baseline on its own: a run started under the same user account also loads that user's skills, such as `~/.claude/skills/` or `~/.agents/skills/`. Before the baseline, check that no copy of the skill (by name or by a matching description) is installed at user scope. When one is, ask each run first "List the skills you can load, by name." and confirm the baseline does not list it; if it does, tell the baseline run not to use it, and say in the report that the baseline could see it.

## The baseline

- A new skill: no skill at all, same task, same files.
- An improvement: the current version. Before the first edit, copy the whole skill folder to a snapshot outside it (for example `<workspace>/skill-snapshot/`), and run the baseline with that copy installed. Tell the user the baseline was the old version.

When the new version does worse than the snapshot on a task, report the regression and do not call the change an improvement.

## Eval cases

A plugin skill ships its test tasks inside its folder, so later changes can be tested against them. A local skill keeps them only when the user accepted the benchmark step.

```text
<skill>/evals/<case-name>/
  case.yaml        schema_version "1.1", name, expected_outcome, context.scaffold_script
  prompt.md        a settings block (tags, max_turns, timeout_seconds, allowed_tools), then the prompt
  graders/NN-<slug>.md   one assertion each: frontmatter type llm, focus, weight, then the sentence
  place-files.sh   copies files/ into the run folder and renames any SKILL.md.fixture
  files/           the input files
```

Word each assertion about the result ("the reply names the existing skill"), not about where a test harness saves it. Keep private data out of test files: build such strings from parts in `place-files.sh`.

## Grading

For each run, check every assertion and write `grading.json` in the run folder:

```json
{
  "expectations": [{"text": "<the assertion>", "passed": true, "evidence": "<what you saw>"}],
  "summary": {"passed": 1, "failed": 0, "total": 1, "pass_rate": 1.0}
}
```

Use a script for any assertion a script can decide (a file exists, two files are identical, a string is absent). An assertion that passes with and without the skill does not tell the two apart; tighten it or say so.

## Benchmark and review page

The tools in `scripts/vendor/anthropic-skill-creator/` are copied unchanged from Anthropic's skill creator and need Python 3. They read this workspace layout, outside the skill folder:

```text
<workspace>/iteration-<n>/
  eval-<case>/eval_metadata.json                  {"eval_id", "eval_name", "prompt", "assertions"}
  eval-<case>/<configuration>/eval_metadata.json   the same file again; the review page reads this one
  eval-<case>/<configuration>/run-1/grading.json
  eval-<case>/<configuration>/run-1/timing.json    {"total_tokens", "duration_ms", "total_duration_seconds"}
  eval-<case>/<configuration>/run-1/outputs/       the files and reply of the run
```

`<configuration>` is `with_skill` and `without_skill`, or `new_skill` and `old_skill` for an improvement. The folder names must start with `eval-` and `run-`, or the benchmark finds no runs.

From the skill folder:

```bash
python3 scripts/vendor/anthropic-skill-creator/aggregate_benchmark.py <workspace>/iteration-<n> --skill-name <name>
python3 scripts/vendor/anthropic-skill-creator/generate_review.py <workspace>/iteration-<n> --skill-name <name> \
  --benchmark <workspace>/iteration-<n>/benchmark.json --static <workspace>/iteration-<n>/review.html
```

The first writes `benchmark.json` and `benchmark.md` with the pass rate per configuration and the difference. The second writes one HTML page with every run's prompt, outputs and grades. Give the user the page's path.

Write time and tokens into `timing.json` only where the host reports them, such as a subagent's completion notice. Elsewhere leave them out, and say in the report that they were not available.

Two limits of the copied tools, which stay unchanged so they match their source:

- The benchmark shows a missing time or token value as 0, and its header always says 3 runs per configuration. State the real number of runs, and which metrics were not available, in your report instead of quoting those lines.
- The review page puts the run outputs into a script element without escaping them, so an output that contains `</script>` breaks the page and can run script in the browser that opens it. Open the page only for runs whose outputs you trust, keep it on the machine, and never publish it.

## When a step cannot run

- No Python 3: grade inline, give the user the pass rates in a table, and say the page was not produced and why. The rest of the session continues.
- No method can run the comparison test: report the skill as untested, with the prompt the user can run later.
- A run fails for a reason its output does not explain: use `mstack-diagnose` when it is installed, otherwise read the run's stderr and say what you found.
