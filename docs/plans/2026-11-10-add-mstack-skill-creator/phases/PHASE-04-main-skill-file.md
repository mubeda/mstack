# Phase 4: Main skill file

- Goal: The main file gives an agent on any of the four hosts the phases and gates to create or improve a skill, and points at every reference file and script by name.
- Round: 3
- Depends on: 2, 3
- Owns: `plugins/mstack-skill-creator/skills/mstack-skill-creator/SKILL.md`
- Must not touch: `plugins/mstack-skill-creator/skills/mstack-skill-creator/references/`, `plugins/mstack-skill-creator/skills/mstack-skill-creator/scripts/`
- Skills: writing-for-agents (the file is the instruction set another agent follows)
- Read first: `spec.md` (the requirements the phases enforce); every file under `plugins/mstack-skill-creator/skills/mstack-skill-creator/references/` (the main file points at them and must not repeat them); `plugins/mstack-plan/skills/mstack-plan/SKILL.md` (the model: host table, files table, ground rules, numbered phases)
- Checkpoint: `node plugins/mstack-skill-creator/skills/mstack-skill-creator/scripts/check-skill.mjs plugins/mstack-skill-creator/skills/mstack-skill-creator` prints "skill check passed" with no WARN line. The user can read the skill from top to bottom in a few minutes.

In this file `S` stands for `plugins/mstack-skill-creator/skills/mstack-skill-creator`.

## Tasks

### Task 4.1: Write the main file

- Satisfies: R1 (scenario "no confirmation"), R2, R4, R5, R6, R7, R8, R16, R19, R22, R23 (scenario "finished skill")
- Depends on: 2.1, 3.1, 3.2, 3.3, 3.4, 3.5
- Files: modify `S/SKILL.md`
- Interfaces: consumes the eight reference files by name, `scripts/check-skill.mjs` and `scripts/scan-private.mjs` with the commands of tasks 1.2 and 1.3, and the two commands of task 2.1; produces the phase names and gates that the eval graders of Phase 5 check
- Skills: none beyond the phase's
- Read first: `plugins/mstack-write-specs/skills/mstack-write-specs/SKILL.md` (a phases table with a gate column, the form to reuse)
- Tier: most capable
- TDD: exempt (documentation; its failing-first evidence is the baseline run of each eval case in task 5.7)
- Done when: `node plugins/mstack-skill-creator/skills/mstack-skill-creator/scripts/check-skill.mjs plugins/mstack-skill-creator/skills/mstack-skill-creator` exits 0 and prints "skill check passed" with no WARN line, and `wc -l` on the file prints at most 250

Structure of the file, in this order.

| Section | Content |
|---|---|
| Frontmatter | `name: mstack-skill-creator`, and a description that starts with "Use when", lists the triggers (create a skill, write a `SKILL.md`, improve or test a skill, turn a workflow into a skill, package a skill as a plugin), names the four hosts, and ends with what it produces |
| Opening | Two or three sentences: what the skill creator produces, and that it never commits or publishes |
| Host table | Roles in rows (question tool, subagent tool, loading a skill, the skill folder, the fresh-session command, the cross-vendor reviewer), the four hosts in columns, each cell pointing at the host file for detail. Host tool names appear only here |
| Files in this skill | A table of the eight reference files and two scripts and the copied tools, each with the phase that reads it |
| Ground rules | Confirm the target before writing; evidence before "finished"; self-contained folders; copy nothing unlicensed; no private data in a public repository; no commit, push or publish without a request; use an installed mstack skill before the built-in fallback |
| Phases | The table below, then one short numbered subsection per phase |
| The report | What the final message holds, per target |

Phases and gates.

| Phase | Work | Gate |
|---|---|---|
| 0. Start | Detect the target (`references/plugin-packaging.md`), ask create or improve, the scope and hosts for a local target, and the optional steps in one question (`references/workflow-steps.md`) | The user confirmed the target. Nothing is written before this |
| 1. Existing-skill check | `references/workflow-steps.md` | The user chose use, improve or create |
| 2. Understand | The interview, and research, spec and plan through the mstack skills or the built-in fallbacks. Always for a plugin target, only when accepted for a local target | The purpose, triggers, inputs, outputs and one realistic test task are agreed |
| 3. Write | The skill folder, by `references/writing-rules.md` and the host file. For an improvement, copy the current version first | The files exist at the confirmed location, and no existing folder was overwritten without a yes |
| 4. Check | `scripts/check-skill.mjs`, then for a public repository `scripts/scan-private.mjs` and a read for names of people and companies | Both print their pass line, or every remaining line is listed for the user |
| 5. Comparison test | `references/testing.md` | Both runs have results, or the skill is reported as untested |
| 6. Benchmark and review page | Plugin target, or accepted | The page exists, or the report says why not |
| 7. Review | Plugin target, or accepted. `references/plugin-packaging.md` | Every finding is fixed, rejected with a reason, or listed |
| 8. Package | Plugin target only. `references/plugin-packaging.md` | The repository's checks pass, or their failing output is in the report |
| 9. Report | The outcome of every step, what was not run and why, the next step offered and not taken | The report is sent, and nothing was committed |

Steps

1. [ ] Write the frontmatter, the opening, the host table and the files table.
2. [ ] Write the ground rules and the phases table with its ten subsections, each at most ten lines, each naming the reference file it follows instead of repeating it.
3. [ ] Write "The report" for both targets, including the lines "untested" and "not ready to commit" and when each applies.
4. [ ] Run `node plugins/mstack-skill-creator/skills/mstack-skill-creator/scripts/check-skill.mjs plugins/mstack-skill-creator/skills/mstack-skill-creator`. Expected: "skill check passed", no WARN line.
5. [ ] Run `wc -l plugins/mstack-skill-creator/skills/mstack-skill-creator/SKILL.md`. Expected: 250 or fewer.
6. [ ] Run `node scripts/check-marketplace.mjs`. Expected: "Marketplace checks passed: 7 Claude plugins, 7 Codex plugins".
7. [ ] Run the two prose lint commands from `plan.md` on the file. Expected: no output.
8. [ ] Read the file once as an agent on OpenCode would, with no subagent tool and no mstack skill supported. Fix every step such a reader could not follow from the file and the reference it names.
