# Phase 5: Evals and host runs

- Goal: Six eval cases ship with the skill, the skill beats the baseline on them by the spec's thresholds after fixes, and one run on each of Codex, OpenCode and Cursor is recorded.
- Round: 4
- Depends on: 4
- Owns: `plugins/mstack-skill-creator/skills/mstack-skill-creator/evals/`, and, for fixes the evals show, `plugins/mstack-skill-creator/skills/mstack-skill-creator/SKILL.md` and `plugins/mstack-skill-creator/skills/mstack-skill-creator/references/`
- Must not touch: `plugins/mstack-skill-creator/skills/mstack-skill-creator/scripts/vendor/`, any other plugin folder
- Skills: skill-creator (its case-folder templates and grader instructions for eval cases)
- Read first: `plugins/mstack-handoff/skills/mstack-handoff/evals/out-of-context/` (the exact shape of `case.yaml`, `prompt.md`, `graders/NN-*.md` and `place-files.sh` in this repository); `plugins/mstack-skill-creator/skills/mstack-skill-creator/references/testing.md` (the workspace layout and the two commands); `spec.md` › Verification and Success metrics
- Checkpoint: `benchmark.md` in the workspace shows at least 80% of assertions passed with the skill and at least 20 percentage points above the baseline. The user can open the static review page.

In this file `S` stands for `plugins/mstack-skill-creator/skills/mstack-skill-creator`, and `W` for the workspace `<tmp>/mstack-skill-creator-workspace`, outside the repository.

Rules for every case in this phase. A case folder holds `case.yaml` (`schema_version: "1.1"`, `name`, `expected_outcome`, `context.scaffold_script: place-files.sh`), `prompt.md` (the settings block the handoff case uses, then a prompt a real user would write), `graders/NN-<slug>.md` (frontmatter `type: llm`, `focus`, `weight: 1`, then one assertion about the result), `place-files.sh` and `files/`. A skill file inside `files/` is named `SKILL.md.fixture`, and `place-files.sh` renames it. No literal private data is stored: `place-files.sh` builds such strings from parts at run time. Each task ends with the same two checks, "the case checks":

- `node scripts/check-marketplace.mjs`. Expected: "Marketplace checks passed: 7 Claude plugins, 7 Codex plugins".
- `node plugins/mstack-skill-creator/skills/mstack-skill-creator/scripts/scan-private.mjs plugins/mstack-skill-creator/skills/mstack-skill-creator/evals`. Expected: "private-data scan passed".

## Run protocol

Added after the plan review (`reviews/plan-review-1.md`, findings 1 to 4). Every run in tasks 5.7 and 5.8 follows it.

1. Runner. In Claude Code, one `Agent` subagent per run, on the standard tier, with a fresh context. It receives the case prompt, the path of its own copy of the fixture, and, for the "with skill" run only, the path of the skill folder `S` with the instruction to read its `SKILL.md` first. The "without skill" run is told no skill path, and its fixture copy holds none.
2. Answers. A non-interactive run cannot answer a question, so each case prompt ends with a paragraph "Answers to any setup question", which gives the target, the scope, the hosts and the optional steps, and says to go on without asking. Case "match-exists" and the confirmation part of case "local-small-skill" are the exceptions: their prompts give no such answer, so a correct run stops and asks.
3. Isolation. Each run gets its own copy of the fixture, made by `place-files.sh` in a fresh temporary directory, so no run sees another's files.
4. Evidence. Each run writes `transcript.md` in its outputs: one numbered line per action, in order (a question asked, a file read, a file written, a command and its result line). The runner saves the fixture's file list with sizes before the run (`before.txt`) and after it (`after.txt`).
5. Pilot. Run one pair, case "local-small-skill", first. Check that both runs finish, write their transcripts, and can be graded, before starting the rest. At most six runs at a time.
6. Grading contract. `grading.json` holds `expectations` (each with `text`, `passed`, `evidence`) and `summary` (`passed`, `failed`, `total`, `pass_rate`), the fields the smoke test of task 2.1 writes. `eval_metadata.json` (`eval_id`, `eval_name`, `prompt`, `assertions`) sits in the case folder and in each configuration folder. `timing.json` holds `total_tokens`, `duration_ms` and `total_duration_seconds` from the subagent's completion notice.
7. Frozen graders. The graders are final before iteration 1. A grader changed later reruns both configurations of its case.

## Tasks

### Task 5.1: Case "local-small-skill"

- Satisfies: R1, R4, R5, R9, R10, R13, R14, R16, R23
- Depends on: 4.1
- Files: create `S/evals/local-small-skill/case.yaml`; create `S/evals/local-small-skill/prompt.md`; create `S/evals/local-small-skill/place-files.sh`; create `S/evals/local-small-skill/files/`; create `S/evals/local-small-skill/graders/`
- Interfaces: consumes the phase names and gates of task 4.1; produces a case that tasks 5.7 and 5.8 run
- Skills: none beyond the phase's
- Read first: `spec.md` › R4, R9, R10, R13, R14 (the scenarios the graders restate)
- Tier: standard
- TDD: exempt (test data; it is the test, and its baseline run in task 5.7 shows it can fail)
- Done when: `bash plugins/mstack-skill-creator/skills/mstack-skill-creator/evals/local-small-skill/place-files.sh` run in an empty temporary directory exits 0 and leaves a git repository there, and the case checks pass

Steps

1. [ ] Write `files/` and `place-files.sh`: a small git repository `notes-app` with a README and a changelog in a fixed format, no registries. The prompt asks for a skill that writes changelog entries in that format, for this repository, for Claude Code and Codex, says the user has ten minutes, and declines the optional steps.
2. [ ] Write the prompt in two parts: the request, then the answers paragraph of the run protocol for everything except the target, so that a correct run asks only to confirm the target. Write six graders: 01 the transcript shows the target question before any file was written, and `after.txt` shows no new file when the run stopped there; 02 the created skill is at `.agents/skills/<name>/SKILL.md` and reachable at `.claude/skills/<name>`; 03 its frontmatter has exactly `name` and `description`, and the name equals the folder; 04 its description starts with "Use when" and lists no steps; 05 the reply shows the static check's pass line; 06 the reply shows the results of a run with the skill and a run without it, or says "untested", and never calls an untested skill finished; and nothing was committed, so the new files are untracked. Expected: six grader files under `graders/`.
3. [ ] Run `place-files.sh` in an empty temporary directory. Expected: exit 0, and `git -C notes-app status` works.
4. [ ] Run the case checks. Expected: as stated at the top of this file.

### Task 5.2: Case "plugin-target"

- Satisfies: R1, R6, R7, R17, R20
- Depends on: 4.1
- Files: create `S/evals/plugin-target/case.yaml`; create `S/evals/plugin-target/prompt.md`; create `S/evals/plugin-target/place-files.sh`; create `S/evals/plugin-target/files/`; create `S/evals/plugin-target/graders/`
- Interfaces: consumes the phase names and gates of task 4.1; produces a case that task 5.7 runs
- Skills: none beyond the phase's
- Read first: `scripts/check-marketplace.mjs` (the assertions a small fixture check restates: manifests, registry entries, license copy, notices file, versions equal)
- Tier: standard
- TDD: exempt (test data; its baseline run in task 5.7 shows it can fail)
- Done when: in a temporary directory, `place-files.sh` exits 0 and `node skills-repo/scripts/check-plugins.mjs` exits 0 on the untouched fixture, and the case checks pass

Steps

1. [ ] Write the fixture repository `skills-repo`, committed once by `place-files.sh` so it has a base commit: a Claude Code registry and a Codex registry, one existing plugin `greet` with both manifests, a license copy, a notices file and a skill file stored as `SKILL.md.fixture`, an `AGENTS.md` that states the packaging rules and names the check, a README with a skills table, and `scripts/check-plugins.mjs`, at most 80 lines, that asserts those rules, checks that a new or changed plugin's version is higher than at the base commit (`git show HEAD:<path>`), and prints "plugin checks passed: <n> plugins".
2. [ ] Write the prompt: add a plugin skill that formats commit messages by the repository's convention, with all optional questions answered in the prompt and no reviewer of another vendor available.
3. [ ] Write six graders: 01 the plugin target was proposed and confirmed; 02 the first run of `node scripts/check-plugins.mjs` in the transcript, after the skill's files were written, passed and reported 2 plugins; 06 `node scripts/check-plugins.mjs` passes on the final state; 03 both registries, both manifests, the license copy, the notices file and the README row exist for the new plugin, with equal versions; 04 the report lists every workflow step with its outcome, names each step that used a built-in fallback, and records the review as same-vendor; 05 the created skill names no path outside its own folder. Expected: six grader files under `graders/`.
4. [ ] Run `place-files.sh` in an empty temporary directory, then `node skills-repo/scripts/check-plugins.mjs`. Expected: "plugin checks passed: 1 plugins".
5. [ ] Run the case checks. Expected: as stated at the top of this file.

### Task 5.3: Case "improve-existing"

- Satisfies: R15
- Depends on: 4.1
- Files: create `S/evals/improve-existing/case.yaml`; create `S/evals/improve-existing/prompt.md`; create `S/evals/improve-existing/place-files.sh`; create `S/evals/improve-existing/files/`; create `S/evals/improve-existing/graders/`
- Interfaces: consumes the phase names and gates of task 4.1; produces a case that task 5.7 runs
- Skills: none beyond the phase's
- Read first: `spec.md` › R15 (the scenario the graders restate)
- Tier: standard
- TDD: exempt (test data; its baseline run in task 5.7 shows it can fail)
- Done when: `place-files.sh` run in an empty temporary directory exits 0 and leaves `.agents/skills/release-notes/SKILL.md`, and the case checks pass

Steps

1. [ ] Write the fixture: a repository with an existing local skill `release-notes` whose description is a step summary and whose body misses the repository's version format. The prompt asks to improve it so that it uses the format in the README.
2. [ ] Write four graders: 01 a copy of the old version exists outside the skill folder and was made before the first edit; 02 the comparison test used that copy as the baseline, and the reply says so; 03 the new description starts with "Use when" and lists no steps; 04 the reply states whether the new version did better, the same or worse than the old one on the test task.
3. [ ] Run `place-files.sh` in an empty temporary directory. Expected: exit 0, and the skill file exists under its real name.
4. [ ] Run the case checks. Expected: as stated at the top of this file.

### Task 5.4: Case "match-exists"

- Satisfies: R2, R13 (scenario "existing folder")
- Depends on: 4.1
- Files: create `S/evals/match-exists/case.yaml`; create `S/evals/match-exists/prompt.md`; create `S/evals/match-exists/place-files.sh`; create `S/evals/match-exists/files/`; create `S/evals/match-exists/graders/`
- Interfaces: consumes the phase names and gates of task 4.1; produces a case that task 5.7 runs
- Skills: none beyond the phase's
- Read first: `spec.md` › R2 and R13 (the scenarios the graders restate)
- Tier: standard
- TDD: exempt (test data; its baseline run in task 5.7 shows it can fail)
- Done when: `place-files.sh` run in an empty temporary directory exits 0 and leaves `.agents/skills/sql-review/SKILL.md`, and the case checks pass

Steps

1. [ ] Write the fixture: a repository that already holds a local skill `sql-review` that reviews SQL migrations. The prompt asks for "a skill called sql-review that checks our migration files", and does not mention the existing one.
2. [ ] Write three graders: 01 the reply names the existing `sql-review` skill and says where it was found; 02 the reply asks whether to use it, improve it or create a new one, and waits; 03 the existing folder's files are byte-identical to the fixture, so nothing was overwritten without a yes.
3. [ ] Run `place-files.sh` in an empty temporary directory. Expected: exit 0, and the skill file exists under its real name.
4. [ ] Run the case checks. Expected: as stated at the top of this file.

### Task 5.5: Case "unlicensed-source"

- Satisfies: R21
- Depends on: 4.1
- Files: create `S/evals/unlicensed-source/case.yaml`; create `S/evals/unlicensed-source/prompt.md`; create `S/evals/unlicensed-source/place-files.sh`; create `S/evals/unlicensed-source/files/`; create `S/evals/unlicensed-source/graders/`
- Interfaces: consumes the phase names and gates of task 4.1; produces a case that task 5.7 runs
- Skills: none beyond the phase's
- Read first: `spec.md` › R21 (the scenario the graders restate)
- Tier: standard
- TDD: exempt (test data; its baseline run in task 5.7 shows it can fail)
- Done when: `place-files.sh` run in an empty temporary directory exits 0 and leaves `vendor-skill/SKILL.md` with no license file beside it, and the case checks pass

Steps

1. [ ] Write the fixture: a repository and, beside it, a folder `vendor-skill` holding a skill about API error handling with three distinctive sentences and no license file anywhere. The prompt asks to "make our own version of that skill, just copy the good parts".
2. [ ] Write three graders: 01 none of the three distinctive sentences appears in the created skill; 02 the reply says nothing was copied because the source has no license; 03 a created skill still exists and covers the same job in different words.
3. [ ] Run `place-files.sh` in an empty temporary directory. Expected: exit 0, and `ls vendor-skill` shows no license file.
4. [ ] Run the case checks. Expected: as stated at the top of this file.

### Task 5.6: Case "private-data"

- Satisfies: R22
- Depends on: 4.1
- Files: create `S/evals/private-data/case.yaml`; create `S/evals/private-data/prompt.md`; create `S/evals/private-data/place-files.sh`; create `S/evals/private-data/files/`; create `S/evals/private-data/graders/`
- Interfaces: consumes the phase names and gates of task 4.1; produces a case that task 5.7 runs
- Skills: none beyond the phase's
- Read first: `spec.md` › R22 and D21 (the scenario, and "unknown means public")
- Tier: standard
- TDD: exempt (test data; its baseline run in task 5.7 shows it can fail)
- Done when: `place-files.sh` run in an empty temporary directory exits 0, and the case checks pass, which proves the case stores no literal private data

Steps

1. [ ] Write the fixture: a repository whose README says it is open source, with a deploy script. `place-files.sh` builds, from parts, a notes file that holds an absolute home path and an invented company name. The prompt asks for a skill that documents the deploy steps "exactly as in my notes file".
2. [ ] Write three graders: 01 the created skill contains neither the home path nor the company name; 02 the reply lists what the scan found; 03 the skill is not called finished while a hit remains.
3. [ ] Run `place-files.sh` in an empty temporary directory. Expected: exit 0, and the notes file holds the built strings.
4. [ ] Run the case checks. Expected: as stated at the top of this file. A hit here means a literal string was stored, so move it into the build step.

### Task 5.7: Run, grade, benchmark and fix

- Satisfies: R18 (the benchmark and the page are produced for this plugin), R4 (evidence before "finished", applied to this skill itself)
- Depends on: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.9
- Files: modify `S/SKILL.md`; modify `S/references/*.md`; create, outside the repository, `W/iteration-<n>/`
- Interfaces: consumes the six cases, and the two commands of task 2.1; produces `W/iteration-<n>/benchmark.json`, `benchmark.md` and `review.html`
- Skills: mstack-diagnose (when a run fails for a reason the transcript does not explain)
- Read first: `plugins/mstack-skill-creator/skills/mstack-skill-creator/references/testing.md` (the layout `iteration-<n>/eval-<case>/<configuration>/run-1/` and the commands)
- Tier: most capable
- TDD: exempt (a measurement run; the baseline runs are its failing-first evidence)
- Done when: `python3 plugins/mstack-skill-creator/skills/mstack-skill-creator/scripts/vendor/anthropic-skill-creator/aggregate_benchmark.py <W>/iteration-<n> --skill-name mstack-skill-creator` exits 0, and `benchmark.md` shows a pass rate with the skill of at least 80% and at least 20 percentage points above `without_skill`

Steps

1. [ ] Follow the run protocol. Run the pilot pair first and check its transcripts and grading. Then, for each other case, run `place-files.sh` into two fresh temporary directories and start the two runs, at most six at a time. Save each run's outputs and final reply under `W/iteration-1/eval-<case>/<configuration>/run-1/outputs/`, and write `eval_metadata.json` and `timing.json`. Expected: twelve `outputs/` folders, none empty.
2. [ ] Grade every run against its case's graders, writing `grading.json` with `text`, `passed` and `evidence` for each assertion. Use a script for assertions a script can decide (file exists, byte-identical, a string is absent). Expected: twelve `grading.json` files, each with one entry per grader of its case.
3. [ ] Run the aggregate command of the Done when line on `W/iteration-1`. Expected: exit 0, and `benchmark.md` lists `with_skill` and `without_skill`.
4. [ ] Run `python3 plugins/mstack-skill-creator/skills/mstack-skill-creator/scripts/vendor/anthropic-skill-creator/generate_review.py <W>/iteration-1 --skill-name mstack-skill-creator --benchmark <W>/iteration-1/benchmark.json --static <W>/iteration-1/review.html`. Expected: exit 0, and the file exists.
5. [ ] Read the benchmark. An assertion that passes in both configurations does not discriminate, so tighten it or note it. For each assertion that fails with the skill, find the instruction that caused it and fix that instruction in `S/SKILL.md` or the reference file, never the grader, unless the grader is wrong, in which case say so in the log.
6. [ ] If anything was fixed, rerun all six cases in both configurations as `W/iteration-2` and repeat steps 2 to 4, so the final numbers come from one population and one version of the skill. Stop after iteration 2. When the threshold is still unmet, log it, leave the task In progress, and report it.
7. [ ] Run `node --test plugins/mstack-skill-creator/tests/`, `node plugins/mstack-skill-creator/skills/mstack-skill-creator/scripts/check-skill.mjs plugins/mstack-skill-creator/skills/mstack-skill-creator` and `node scripts/check-marketplace.mjs`. Expected: every test passing, "skill check passed", and "Marketplace checks passed: 7 Claude plugins, 7 Codex plugins".
8. [ ] Log the pass rates of both configurations, the path of `review.html`, and every assertion still failing.

### Task 5.8: One run on each other host

- Satisfies: R13 (scenario "all four hosts, project scope"), R14 (scenario "no subagent tool")
- Depends on: 5.7
- Files: modify `S/references/host-codex.md`; modify `S/references/host-opencode.md`; modify `S/references/host-cursor.md` (only where a run contradicts the file)
- Interfaces: consumes the case "local-small-skill" and the fresh-session commands in the three host files; produces three log lines in `progress.md` with the command, the result and the date
- Skills: none beyond the phase's
- Read first: `plan.md` › Decisions P2 (the user allowed these runs on the logged-in accounts); the "Fresh-session command" section of each host file
- Tier: standard
- TDD: exempt (a pure command run on three hosts)
- Done when: the log holds, for each of Claude Code, Codex, OpenCode and Cursor, an observable result: a fresh session of that host names the skill the creator wrote, or the line "not tested" with the reason

Steps

1. [ ] For each host, run `place-files.sh` of "local-small-skill" into a fresh temporary directory and copy the skill folder `S` to `.agents/skills/mstack-skill-creator` inside the fixture repository. Expected: `.agents/skills/mstack-skill-creator/SKILL.md` exists in each of the three fixtures.
2. [ ] Preflight. Run the host's fresh-session command from its host file with the prompt "List the skills you can load in this repository, by name." Expected: the output names `mstack-skill-creator`. This confirms or refutes the spec's assumption that the host loads the shared folder in non-interactive mode.
3. [ ] Run the fresh-session command with the case's prompt, changed to ask for all four hosts, with a time limit of 15 minutes. Expected: a created skill at `.agents/skills/<name>/SKILL.md` inside the fixture, on which `check-skill.mjs` prints "skill check passed".
4. [ ] In one fixture copy that holds the created skill, run the fresh-session command of each of the four hosts with the prompt "List the skills you can load in this repository, by name." Expected: each output names the created skill. Claude Code finds it through the `.claude/skills/<name>` link.
5. [ ] When a host is not logged in, a command is missing, or step 2 shows the skill was not loaded, record the host as "not tested" or "loads only interactively" with the output's deciding line, and correct that host file's "Fresh-session command" section to the hand-the-prompt method.
6. [ ] Run `node plugins/mstack-skill-creator/skills/mstack-skill-creator/scripts/check-skill.mjs plugins/mstack-skill-creator/skills/mstack-skill-creator` and `node scripts/check-marketplace.mjs`. Expected: "skill check passed" and "Marketplace checks passed: 7 Claude plugins, 7 Codex plugins".

### Task 5.9: Edge cases and the host's own creator

- Satisfies: R24 (scenario "none installed"), R4 (the interview stays required when the optional steps are declined)
- Depends on: 4.1
- Files: modify `S/SKILL.md`
- Interfaces: consumes the "Native skill creator" section of each host file; produces a section "When the request does not fit" in `SKILL.md`
- Skills: writing-for-agents (the section is instructions another agent follows)
- Read first: `spec.md` › Verification, the list of input classes no scenario covers; `reviews/plan-review-1.md` (finding 7)
- Tier: standard
- TDD: exempt (documentation; cases 5.1 to 5.6 run after it)
- Done when: `node plugins/mstack-skill-creator/skills/mstack-skill-creator/scripts/check-skill.mjs plugins/mstack-skill-creator/skills/mstack-skill-creator` prints "skill check passed", and `SKILL.md` has the section with one line for each of the six input classes

Steps

1. [ ] In Phase 0 of `SKILL.md`, add: when the host file names a native skill creator that is installed, name it and offer its host-only tools for the steps they cover; when none is installed, make no offer.
2. [ ] In Phase 2, say that the interview runs for every target, even when the optional steps are declined.
3. [ ] Add the section "When the request does not fit", one line each: a request for a rule, command or hook (out of scope, say what this skill can do instead); an invalid or too long name (propose a valid one and ask); a target folder that cannot be written (report the error, write nothing elsewhere without asking); a host that is none of the four (the portable path, and which parts are untested); no network (report the network steps as not run, and continue the local ones); an interrupted session (continue from the files already written, and offer `mstack-handoff` when it is installed). Expected: six lines in the section.
4. [ ] Run `node plugins/mstack-skill-creator/skills/mstack-skill-creator/scripts/check-skill.mjs plugins/mstack-skill-creator/skills/mstack-skill-creator`, `wc -l` on `SKILL.md` and `node scripts/check-marketplace.mjs`. Expected: "skill check passed", at most 250 lines, and "Marketplace checks passed: 7 Claude plugins, 7 Codex plugins".
