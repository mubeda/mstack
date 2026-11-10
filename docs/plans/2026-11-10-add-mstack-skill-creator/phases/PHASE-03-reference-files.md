# Phase 3: Reference files

- Goal: All guidance the main file points at is written, one file per host and one per subject, in the repository's writing rules, and passes both checks.
- Round: 2
- Depends on: 1
- Owns: `plugins/mstack-skill-creator/skills/mstack-skill-creator/references/`
- Must not touch: `plugins/mstack-skill-creator/skills/mstack-skill-creator/SKILL.md` (Phase 4), `plugins/mstack-skill-creator/skills/mstack-skill-creator/scripts/` (Phases 1 and 2), `plugins/mstack-skill-creator/skills/mstack-skill-creator/THIRD_PARTY_NOTICES.md` (task 1.1)
- Skills: writing-for-agents (these files are instructions another agent executes word for word)
- Read first: `spec.md` (every requirement these files turn into instructions); `AGENTS.md` (writing rules, and "never write a tool, command or file into a skill that you have not seen this session"); `plugins/mstack-plan/skills/mstack-plan/references/skill-matching.md` (the house style of a reference file, and the install questions that `workflow-steps.md` repeats in its own words)
- Checkpoint: `node plugins/mstack-skill-creator/skills/mstack-skill-creator/scripts/check-skill.mjs plugins/mstack-skill-creator/skills/mstack-skill-creator` prints "skill check passed" and `node scripts/check-marketplace.mjs` passes. The user can read eight files under `references/`.

In this file `S` stands for `plugins/mstack-skill-creator/skills/mstack-skill-creator`. Every task in this phase ends with the same four verification steps, written once here as "the phase checks":

- `node plugins/mstack-skill-creator/skills/mstack-skill-creator/scripts/check-skill.mjs plugins/mstack-skill-creator/skills/mstack-skill-creator`. Expected: "skill check passed".
- `node scripts/check-marketplace.mjs`. Expected: "Marketplace checks passed: 7 Claude plugins, 7 Codex plugins".
- The two prose lint commands from `plan.md` on each file the task wrote. Expected: no output.
- `node plugins/mstack-skill-creator/skills/mstack-skill-creator/scripts/scan-private.mjs plugins/mstack-skill-creator/skills/mstack-skill-creator/references`. Expected: "private-data scan passed".

Rules for every file in this phase. Open with one line that says in which step of the main file it is read. Write example paths with a placeholder prefix (`<skill>/scripts/x.py`), never bare. Name a command, tool or folder only if this plan, the spec or a source read in the task states it, and give the date and source of each host fact. Adapted guidance is rewritten, never pasted.

## Tasks

### Task 3.1: Four host files

- Satisfies: R11 (which hosts ignore a host-only field), R13 (where each host loads a skill), R14 (the non-interactive command per host), R24 (the host's own creator)
- Depends on: 1.2
- Files: create `S/references/host-claude-code.md`; create `S/references/host-codex.md`; create `S/references/host-opencode.md`; create `S/references/host-cursor.md`
- Interfaces: consumes the command of task 1.2; produces four files with the same seven headings in the same order, so the main file can say "read the file for your host, section X": "Tools", "Where skills load from", "Frontmatter fields", "Fresh-session command", "Native skill creator", "Cross-vendor reviewer", "mstack skills supported here"
- Skills: none beyond the phase's
- Read first: https://cursor.com/docs/context/skills (Cursor folders and fields); https://opencode.ai/docs/skills/ (OpenCode folders and fields); https://code.claude.com/docs/en/skills (Claude Code folders and fields); https://developers.openai.com/codex/skills (Codex folders, `agents/openai.yaml`); `plugins/mstack-plan/skills/mstack-plan/SKILL.md` › Host tools (the Claude Code and Codex tool names already used in this repository)
- Tier: standard
- TDD: exempt (documentation; its behavior is pinned by the eval cases of Phase 5 and the host runs of task 5.8)
- Done when: `node plugins/mstack-skill-creator/skills/mstack-skill-creator/scripts/check-skill.mjs plugins/mstack-skill-creator/skills/mstack-skill-creator` exits 0 and prints "skill check passed", and each of the four files has the seven headings

Steps

1. [ ] Fetch the four documentation pages and note, per host, the skill folders, the frontmatter fields and the date read.
2. [ ] Run `claude --help`, `codex exec --help`, `opencode run --help` and `cursor-agent --help`. Expected: each prints its usage. Note the exact flags for a single non-interactive prompt in a given working directory.
3. [ ] Write the four files. "Tools" names the question tool, the subagent tool and how a skill is loaded on that host, or says the host has none. "Where skills load from" gives the project and user folders from `plan.md` › Global constraints. "Frontmatter fields" lists the host-only fields and what the other hosts do with them. "Fresh-session command" gives the command for the comparison test, with and without the skill. "Native skill creator" names it and its host-only tools, or says there is none (OpenCode), or that it is named and never copied (Cursor). "Cross-vendor reviewer" names the reviewer by role and what to do when it is missing. "mstack skills supported here" lists the seven skills with yes or no, dated 2026-11-10.
4. [ ] Run the phase checks. Expected: as stated at the top of this file.

### Task 3.2: Writing rules

- Satisfies: R9, R10 (scenario "step summary rejected", which the agent judges), R11, R12 (scenario "instruction-only skill"), R17 (scenario "dependency on another skill"), R21 (scenario "unlicensed source")
- Depends on: 1.2
- Files: create `S/references/writing-rules.md`
- Interfaces: consumes the rules of `check-skill.mjs` from task 1.2; produces the sections "Frontmatter", "The description", "Size and layout", "The host table", "Self-contained folders", "Third-party material", "Before you finish"
- Skills: none beyond the phase's
- Read first: https://agentskills.io/specification (name and description limits); https://github.com/obra/superpowers/blob/main/skills/writing-skills/SKILL.md (why a step summary in a description makes agents skip the body; adapt, do not copy); `plugins/mstack-write-specs/skills/mstack-write-specs/SKILL.md` (a host table to use as the template, widened to four columns)
- Tier: standard
- TDD: exempt (documentation; its behavior is pinned by eval cases 5.1 and 5.5)
- Done when: `node plugins/mstack-skill-creator/skills/mstack-skill-creator/scripts/check-skill.mjs plugins/mstack-skill-creator/skills/mstack-skill-creator` exits 0 and prints "skill check passed", and the file has the seven sections

Steps

1. [ ] Write "Frontmatter" (two fields by default; a host-only field only on request, with the sentence to tell the user which hosts ignore it) and "The description" (starts with "Use when", triggers and phrases first, one closing clause on the result, no step summary, at most 1024 characters, with one good and one bad example, and the instruction to read the finished description and rewrite it when it lists steps).
2. [ ] Write "Size and layout" (a short main file that maps phases to reference files, references one level deep, a script for anything deterministic) and "The host table" (the four-column template, when to include it, and the rule that no host tool is named outside it).
3. [ ] Write "Self-contained folders" (everything inside the folder, other skills by name with what to do when absent, no nested skill file, example paths with a placeholder prefix) and "Third-party material" (copy nothing without a license and say why; for a licensed source, the credit file inside the folder and what each license requires; rewrite adapted rules).
4. [ ] Write "Before you finish", a checklist of ten lines at most that restates the rules a script cannot check.
5. [ ] Run the phase checks. Expected: as stated at the top of this file.

### Task 3.3: Testing

- Satisfies: R4 (scenario "comparison test not run"), R14 (both scenarios), R15 (scenario "regression"), R18 (scenario "the tools cannot run")
- Depends on: 1.2
- Files: create `S/references/testing.md`
- Interfaces: consumes the folder layout stated in task 2.1's Interfaces line and `plan.md` › Decisions P8; produces the sections "The comparison test", "Choosing the method", "The baseline", "Eval cases", "Grading", "Benchmark and review page", "When a step cannot run"
- Skills: none beyond the phase's
- Read first: https://github.com/anthropics/skills/blob/b9e19e6f44773509fbdd7001d77ff41a49a486c1/skills/skill-creator/SKILL.md (the paired-run method and the workspace layout; adapt, do not copy); `plugins/mstack-handoff/skills/mstack-handoff/evals/out-of-context/` (the case-folder layout this repository ships: `case.yaml`, `prompt.md`, `graders/`, `place-files.sh`, `files/`)
- Tier: standard
- TDD: exempt (documentation; its behavior is pinned by eval cases 5.1 and 5.3 and by the smoke test of task 2.1)
- Done when: `node plugins/mstack-skill-creator/skills/mstack-skill-creator/scripts/check-skill.mjs plugins/mstack-skill-creator/skills/mstack-skill-creator` exits 0 and prints "skill check passed", and the file has the seven sections

Steps

1. [ ] Write "The comparison test" (one realistic task at least, run in a fresh context with the skill and against the baseline, outputs saved per run) and "Choosing the method" (the subagent tool; otherwise the fresh-session command of the host file; otherwise a prompt handed to the user, which counts only when the user returns the result, and until then the skill is reported as untested).
2. [ ] Write "The baseline" (no skill for a new skill; for an improvement, a copy of the current version taken before any edit, kept outside the skill folder) and what to tell the user when the baseline does as well as the skill.
3. [ ] Write "Eval cases" (the case-folder layout, assertions worded about the result, a skill file used as test data is named `SKILL.md.fixture`; a plugin skill ships its cases, a local skill keeps them only when the benchmark step ran) and "Grading" (each assertion gets `text`, `passed`, `evidence`; prefer a script for anything a script can decide).
4. [ ] Write "Benchmark and review page" with the workspace layout `iteration-<n>/eval-<case>/<configuration>/run-1/`, the two commands from task 2.1's Interfaces line with the path `scripts/vendor/anthropic-skill-creator/` written relative to the skill folder, the rule that time and tokens are reported only where the host returns them, and "When a step cannot run" (no Python: grade inline, say the page was not produced and why, continue).
5. [ ] Run the phase checks. Expected: as stated at the top of this file.

### Task 3.4: Plugin packaging

- Satisfies: R1 (scenario "plugin repository"), R6 (scenario "a step is skipped"), R19 (both scenarios), R20 (both scenarios)
- Depends on: 1.2
- Files: create `S/references/plugin-packaging.md`
- Interfaces: consumes nothing from other tasks; produces the sections "Recognizing a plugin target", "Reading the repository's rules", "Files a plugin needs", "Versions", "The repository's checks", "Cross-vendor review", "The report"
- Skills: none beyond the phase's
- Read first: `AGENTS.md` (the rules a plugin target states for itself, used as the worked example, never as a hard-coded list); `scripts/check-marketplace.mjs` (what a repository check can demand); `plugins/mstack-plan/skills/mstack-plan/references/receiving-review.md` (how findings are verified, restated in own words)
- Tier: standard
- TDD: exempt (documentation; its behavior is pinned by eval case 5.2)
- Done when: `node plugins/mstack-skill-creator/skills/mstack-skill-creator/scripts/check-skill.mjs plugins/mstack-skill-creator/skills/mstack-skill-creator` exits 0 and prints "skill check passed", and the file has the seven sections

Steps

1. [ ] Write "Recognizing a plugin target" (a Claude Code registry and a Codex registry that list plugin folders; propose the plugin target and wait for the user's answer) and "Reading the repository's rules" (the agent instructions, the README's section on adding a skill, the check scripts; where the repository names no check, the report says packaging was not verified by a check).
2. [ ] Write "Files a plugin needs" as a table of what to look for (manifests per host, registry entries, license copy, notices file, README entry), each row saying "as this repository's rules and newest plugin show", and "Versions" (every copy of a version changes together, and the marketplace's own version when the repository has one).
3. [ ] Write "The repository's checks" (run them, fix, run again, quote the result lines; when one still fails, show the output and do not report the skill as ready to commit).
4. [ ] Write "Cross-vendor review" (read-only, another vendor's model through the reviewer named in the host file; verify every finding against the files before acting; reject a wrong finding with the reason; with no other vendor, warn, use a fresh read-only context of the same vendor, record it as same-vendor) and "The report" (every workflow step with its outcome or "not run" and the reason; never commit, push or open a pull request without a request).
5. [ ] Run the phase checks. Expected: as stated at the top of this file.

### Task 3.5: Workflow steps

- Satisfies: R2 (both scenarios), R3 (scenario "declined"), R5 (scenario "one question"), R7 (both scenarios), R8 (both scenarios)
- Depends on: 1.2
- Files: create `S/references/workflow-steps.md`
- Interfaces: consumes the heading "mstack skills supported here" of the host files from task 3.1 by name only; produces the sections "Steps and the skills that cover them", "When a skill is missing", "Built-in fallbacks", "Optional steps for a local target", "Existing-skill check", "Public search"
- Skills: none beyond the phase's
- Read first: `spec.md` › Decisions D23 (the fixed step-to-skill table); `plugins/mstack-plan/skills/mstack-plan/references/skill-matching.md` › 1 and 5 (where installed skills live, and the install questions); `README.md` (the real install commands for an mstack skill, per route)
- Tier: standard
- TDD: exempt (documentation; its behavior is pinned by eval cases 5.1, 5.2 and 5.4)
- Done when: `node plugins/mstack-skill-creator/skills/mstack-skill-creator/scripts/check-skill.mjs plugins/mstack-skill-creator/skills/mstack-skill-creator` exits 0 and prints "skill check passed", and the file has the six sections

Steps

1. [ ] Write "Steps and the skills that cover them" as the table of spec D23 (research, spec, plan, build with reviews, interrupted session, failing script, skill idea from a tracker), with the rule to use the installed skill when the host file says it is supported there.
2. [ ] Write "When a skill is missing" (offer the install; ask the route, and for the skills CLI the scope, the method and the agents; give the commands from the README; install nothing without a yes; on Cursor and OpenCode offer only the skills CLI) and "Built-in fallbacks", one short paragraph per step that says what the skill creator does itself and that the report names the fallback.
3. [ ] Write "Optional steps for a local target" (one question at the start that lists web research, a written spec and plan, a cross-vendor review, and the benchmark and review page; run only what was accepted; do not ask again).
4. [ ] Write "Existing-skill check" (the folders to read per host, from the host files; compare by description; report what was found and where it looked; offer use, improve or create; never claim that no such skill exists anywhere) and "Public search" (`npx --yes skills find "<words>"`, only after a yes, list results with their install counts, no network request when declined).
5. [ ] Run the phase checks. Expected: as stated at the top of this file.
