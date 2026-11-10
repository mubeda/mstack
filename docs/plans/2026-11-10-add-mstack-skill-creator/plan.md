# Build mstack-skill-creator

Status: Approved 2026-11-10 (approved in chat by the user)
Spec: spec.md (Status line: Approved 2026-11-10 (approved in chat by the user), sha256 a3b6f03c5349)
Repository: this repository
Base: main

## Goal

1. A contributor builds a new plugin skill in a repository laid out like mstack, and both repository checks pass on their first run.
2. A user of Claude Code, Codex, OpenCode or Cursor creates or improves a local skill and sees a comparison test against a baseline.
3. One skill folder is found by all four hosts.

## Global constraints

- Plugin name `mstack-skill-creator`, skill folder `plugins/mstack-skill-creator/skills/mstack-skill-creator/`, version `0.1.0`, marketplace `metadata.version` `0.3.0` (spec D17).
- Created skills carry only `name` and `description` unless the user asks for a host-only field (spec R9).
- `name` matches `^[a-z0-9]+(-[a-z0-9]+)*$`, is at most 64 characters and equals the folder name. `description` is at most 1024 characters and starts with `Use when` (spec R10, Constraints).
- Skill folders per host (spec Constraints, host documentation fetched 2026-11-10). Shared folder `.agents/skills/<name>` (project) and `~/.agents/skills/<name>` (user) for Codex, OpenCode and Cursor. `.claude/skills/<name>` and `~/.claude/skills/<name>` for Claude Code, as a link to the shared folder, or a copy where links are not available (spec D14).
- Upstream pin for copied files: `anthropics/skills` commit `b9e19e6f44773509fbdd7001d77ff41a49a486c1`, path `skills/skill-creator/`, license Apache-2.0 (spec D2).
- Nothing is copied from a source without a license. Cursor's built-in `create-skill` is named, never copied (spec R21).
- Non-interactive commands: `claude -p`, `codex exec`, `opencode run`, `cursor-agent -p` (spec Constraints).
- Everything a skill uses is inside its own folder. No second `SKILL.md` anywhere inside a skill folder. Test data that is a skill file is named `SKILL.md.fixture` (AGENTS.md).
- Every `references/<file>` or `scripts/<file>` path written in `SKILL.md` or in a reference file must exist in the skill folder. Example paths in teaching text are written with a leading placeholder such as `<skill>/scripts/x.py`, which the check skips (scripts/check-marketplace.mjs).
- Writing rules for every shipped file: no em or en dashes, no curly quotes, no bold label followed by a colon, sentence-case headings, no emoji, "the user", no personal or company data, no absolute home paths (AGENTS.md).
- No commit, push or pull request unless the user asks (AGENTS.md, spec R23).

## Review focus

1. An example path in a created skill's teaching text is reported as a missing file. Pinned by task 1.2, test "path with a placeholder prefix is skipped".
2. A placeholder home path such as `/home/<name>` is reported as private data, or a real one is missed. Pinned by task 1.3, tests "placeholder path is not a hit" and "real home path is a hit".
3. The copied benchmark tool finds no runs because the workspace folders are not named `eval-<case>` and `run-<n>`. Pinned by task 2.1, the smoke test's assertion on a non-empty `run_summary`.
4. An existing folder at the target location is overwritten without a yes. Pinned by task 5.4, grader 03.
5. A skill is reported as finished after the comparison prompt was handed to the user and no result came back. Pinned by task 5.1, grader 06.

## Out of scope

- Rules, commands, subagents, hooks and other plugin kinds. Formats differ per host.
- Widening the other seven mstack skills to Cursor and OpenCode. Separate spec.
- Cursor or OpenCode manifests and registries in this repository. The skills CLI already reaches both hosts.
- A verbatim copy of any whole skill creator. Repository rules require rewritten guidance.
- A description optimizer on hosts other than Claude Code. It needs `claude -p`.
- Publishing created skills to a public registry.
- Running the new static checker over the other mstack skills from `check-marketplace.mjs`. Not asked for (planning decision P5).

## Sources

- Repository rules: `AGENTS.md` (public-repository rule, self-contained skill folders, version bumps, checks before a commit, the outside-the-diff sweep, second-opinion review, hand-over report). `CLAUDE.md` points at it.
- Repository docs: `README.md` (the skills table and install sections a new plugin is added to).
- Repository docs: `scripts/check-marketplace.mjs` and `scripts/check-version-bumps.mjs` (the two checks every plugin must pass).
- Repository docs: `plugins/mstack-handoff/` (the newest complete plugin, the model for manifests, notices and eval cases).
- Repository docs: `plugins/mstack-plan/skills/mstack-plan/SKILL.md` (the model for a short main file with phases, gates and a files table).
- External: https://github.com/anthropics/skills/tree/b9e19e6f44773509fbdd7001d77ff41a49a486c1/skills/skill-creator (the three copied files, and the eval method adapted in own words).
- External: https://agentskills.io/specification (name and description rules).
- External: https://cursor.com/docs/context/skills (Cursor folders and frontmatter fields).
- External: https://opencode.ai/docs/skills/ (OpenCode folders and frontmatter fields).
- External: https://github.com/openai/skills/tree/main/skills/.system/skill-creator (Codex creator, Apache-2.0, adapted in own words).
- External: https://github.com/obra/superpowers/blob/main/skills/writing-skills/SKILL.md (failing baseline before writing, MIT, adapted in own words).
- External: https://github.com/vercel-labs/skills (skills CLI, install folders, `find` command).
- External: https://github.com/tripleyak/SkillForge (the existing-skill check before creating, MIT, idea only).

## Stack and commands

- Scripts: Node.js ES modules (`.mjs`), no dependencies. Node v26.12.0 on the planning machine.
- Script tests: `node --test plugins/mstack-skill-creator/tests/`. No test exists before task 1.2, so this was not run at planning time.
- Copied tools: Python 3, standard library only (imports read on 2026-11-10). Python 3.14.8 on the planning machine.
- Repository checks: `node scripts/check-marketplace.mjs` (run 2026-11-10, "Marketplace checks passed: 6 Claude plugins, 6 Codex plugins") and `node scripts/check-version-bumps.mjs` after `git fetch origin main`.
- Plugin validation: `claude plugin validate .` (used in commit 02f1cc2).
- Lint and format for prose, each must print nothing, run on every changed Markdown file `$f`:
  - `perl -CSD -ne 'print "$.: $_" if /[\x{2013}\x{2014}\x{2018}\x{2019}\x{201C}\x{201D}]/' "$f"`
  - `grep -nE '\*\*[^*]+(:\*\*|\*\*:)' "$f"`
- Whitespace: `git diff --check`.

## Phases

| Phase | File | Goal | Round | Depends on | Tier |
|---|---|---|---|---|---|
| 1 | phases/PHASE-01-scaffold-and-checkers.md | The plugin exists, both repository checks pass, and two tested scripts check a skill folder | 1 | none | standard |
| 2 | phases/PHASE-02-copied-eval-tools.md | The benchmark and the review page run from inside the skill folder | 2 | 1 | cheap |
| 3 | phases/PHASE-03-reference-files.md | All guidance is written, per host and per step | 2 | 1 | standard |
| 4 | phases/PHASE-04-main-skill-file.md | The main file gives an agent the phases and gates to follow | 3 | 2, 3 | most capable |
| 5 | phases/PHASE-05-evals-and-host-runs.md | Evidence against the baseline, fixes from it, and one run on each other host | 4 | 4 | standard |

Phases in the same round run in parallel. A phase depends only on phases in earlier rounds.

## File map

`S` stands for `plugins/mstack-skill-creator/skills/mstack-skill-creator`.

| Path or external change | Action | Phase | Verification |
|---|---|---|---|
| `plugins/mstack-skill-creator/.claude-plugin/plugin.json` | create | 1 | `node scripts/check-marketplace.mjs` |
| `plugins/mstack-skill-creator/.codex-plugin/plugin.json` | create | 1 | `node scripts/check-marketplace.mjs` |
| `S/LICENSE` | create | 1 | `cmp LICENSE S/LICENSE` |
| `S/THIRD_PARTY_NOTICES.md` | create | 1 | `node scripts/check-marketplace.mjs` |
| `S/SKILL.md` | create (minimal) | 1 | `node scripts/check-marketplace.mjs` |
| `.claude-plugin/marketplace.json` | modify | 1 | `node scripts/check-marketplace.mjs` |
| `.agents/plugins/marketplace.json` | modify | 1 | `node scripts/check-marketplace.mjs` |
| `README.md` | modify | 1 | prose lint |
| `S/scripts/check-skill.mjs` | create | 1 | `node --test plugins/mstack-skill-creator/tests/` |
| `S/scripts/scan-private.mjs` | create | 1 | `node --test plugins/mstack-skill-creator/tests/` |
| `plugins/mstack-skill-creator/tests/check-skill.test.mjs` | create | 1 | `node --test plugins/mstack-skill-creator/tests/` |
| `plugins/mstack-skill-creator/tests/scan-private.test.mjs` | create | 1 | `node --test plugins/mstack-skill-creator/tests/` |
| `S/scripts/vendor/anthropic-skill-creator/aggregate_benchmark.py` | create (copied) | 2 | `git hash-object` equals the upstream blob |
| `S/scripts/vendor/anthropic-skill-creator/generate_review.py` | create (copied) | 2 | `git hash-object` equals the upstream blob |
| `S/scripts/vendor/anthropic-skill-creator/viewer.html` | create (copied) | 2 | `git hash-object` equals the upstream blob |
| `S/scripts/vendor/anthropic-skill-creator/LICENSE.txt` | create (copied) | 2 | `git hash-object` equals the upstream blob |
| `plugins/mstack-skill-creator/tests/vendor-smoke.test.mjs` | create | 2 | `node --test plugins/mstack-skill-creator/tests/` |
| `S/references/host-claude-code.md` | create | 3 | `node S/scripts/check-skill.mjs S` |
| `S/references/host-codex.md` | create | 3 | `node S/scripts/check-skill.mjs S` |
| `S/references/host-opencode.md` | create | 3 | `node S/scripts/check-skill.mjs S` |
| `S/references/host-cursor.md` | create | 3 | `node S/scripts/check-skill.mjs S` |
| `S/references/writing-rules.md` | create | 3 | `node S/scripts/check-skill.mjs S` |
| `S/references/testing.md` | create | 3 | `node S/scripts/check-skill.mjs S` |
| `S/references/plugin-packaging.md` | create | 3 | `node S/scripts/check-skill.mjs S` |
| `S/references/workflow-steps.md` | create | 3 | `node S/scripts/check-skill.mjs S` |
| `S/SKILL.md` | rewrite (full) | 4 | `node S/scripts/check-skill.mjs S` |
| `S/evals/<case>/` for six cases | create | 5 | the eval run of task 5.7 |

`S/SKILL.md` appears twice on purpose: Phase 1 creates the minimal file the checks need, and Phase 4, two rounds later, replaces it. Phase 5 may also edit `S/SKILL.md` and `S/references/*.md` to fix what the evals show, after Phases 3 and 4 are Closed.

Shared files reserved for the executor: `progress.md`.
Parallel conflicts: none. In round 2, Phase 2 owns `S/scripts/vendor/` and `tests/vendor-smoke.test.mjs`, and Phase 3 owns `S/references/`. `S/THIRD_PARTY_NOTICES.md` is written whole in task 1.1 so that neither phase touches it.

## Traceability

| Requirement | Tasks |
|---|---|
| R1 | 3.4, 4.1, 5.1, 5.2 |
| R2 | 3.5, 4.1, 5.4 |
| R3 | 3.5 |
| R4 | 3.3, 4.1, 5.1 |
| R5 | 3.5, 4.1, 5.1 |
| R6 | 3.4, 4.1, 5.2 |
| R7 | 3.5, 4.1, 5.2 |
| R8 | 3.5, 4.1 |
| R9 | 1.2, 3.2, 5.1 |
| R10 | 1.2, 3.2, 5.1 |
| R11 | 3.1, 3.2 |
| R12 | 1.2, 3.2 |
| R13 | 3.1, 5.1, 5.4, 5.8 |
| R14 | 3.1, 3.3, 5.1, 5.8 |
| R15 | 3.3, 5.3 |
| R16 | 1.2, 1.4, 4.1, 5.1 |
| R17 | 1.2, 3.2, 5.2 |
| R18 | 2.1, 3.3, 5.7 |
| R19 | 3.4, 4.1 |
| R20 | 1.1, 3.4, 5.2 |
| R21 | 1.1, 2.1, 3.2, 5.5 |
| R22 | 1.3, 1.4, 4.1, 5.6 |
| R23 | 4.1, 5.1 |
| R24 | 3.1, 5.9 |

## End-to-end verification

1. `node --test plugins/mstack-skill-creator/tests/` exits 0 with every test passing.
2. `node scripts/check-marketplace.mjs` prints "Marketplace checks passed: 7 Claude plugins, 7 Codex plugins".
3. `git fetch origin main && node scripts/check-version-bumps.mjs` exits 0.
4. `claude plugin validate .` exits 0.
5. `node plugins/mstack-skill-creator/skills/mstack-skill-creator/scripts/check-skill.mjs plugins/mstack-skill-creator/skills/mstack-skill-creator` prints "skill check passed".
6. `node plugins/mstack-skill-creator/skills/mstack-skill-creator/scripts/scan-private.mjs plugins/mstack-skill-creator` exits 0 with no hit.
7. The benchmark of task 5.7 shows at least 80% of assertions passed with the skill and at least 20 percentage points above the baseline (spec Success metrics).
8. The log of task 5.8 shows, for each of Codex, OpenCode and Cursor, that the host listed or used a created local skill, or names the host as not tested with the reason.
9. The prose lint commands print nothing for every Markdown file under `plugins/mstack-skill-creator/` and for `README.md`.

## Risks

- The main file grows too long to be followed -> task 4.1 caps it at 250 lines and moves detail into the reference files.
- Example paths in the teaching text fail the marketplace check -> the global constraint on placeholder prefixes, and both checks run in every Phase 3 task.
- The copied tool's folder names differ from the layout the mstack evals used before -> `references/testing.md` teaches the copied tool's layout, and the smoke test pins it (Review focus 3).
- `opencode run` or `cursor-agent -p` does not load a skill from the shared folder in non-interactive mode -> task 5.8 records the result, and the host file is corrected to the hand-the-prompt method for that host.
- Eval runs cost many tokens -> six cases, one run each per configuration, at most two iterations (task 5.7).

## Decisions

- P1. One pull request for the whole plugin. Alternatives: scripts first, then the skill, which lost because the scripts have no use alone. Decided by: user.
- P2. The executor may run one short test on OpenCode and one on Cursor with the accounts logged in on the machine. Alternatives: mark both hosts as not tested. Decided by: user.
- P3. Exactly three upstream files are copied, plus the upstream license file: `aggregate_benchmark.py`, `generate_review.py`, `viewer.html`. Alternatives: also the optimizer scripts, which lost because they need `claude -p`. Decided by: agent's call, not rejected by the user. Evidence: both scripts import only the standard library, and `generate_review.py` loads `viewer.html` from its own folder.
- P4. No script for the comparison test. Each host file gives the exact command. Decided by: agent's call, not rejected by the user.
- P5. `scripts/check-marketplace.mjs` is not changed. Decided by: agent's call, not rejected by the user.
- P6. Script tests use `node --test` and live at the plugin root in `tests/`, outside the skill folder, so installs do not carry them. Alternatives: inside the skill folder, which lost because every install would ship test files. Decided by: agent's call.
- P7. Tests build their fixture skill folders in a temporary directory at run time. Alternatives: fixture files in the repository, which lost because each would need the `SKILL.md.fixture` name and a rename step. Decided by: agent's call.
- P8. The eval workspace uses the copied tool's layout, `iteration-<n>/eval-<case>/<configuration>/run-1/`. Alternatives: the case-named folders of the newer, unpublished creator version, which the pinned tool does not read. Decided by: agent's call. Evidence: `aggregate_benchmark.py` at the pin globs `eval-*` and `run-*`.
- P9. `THIRD_PARTY_NOTICES.md` is written whole in task 1.1, because the sources are known now. Alternatives: each later task appends its credit, which lost because two parallel phases would edit one file. Decided by: agent's call.
- P10. Reference files and the main file are exempt from red-green, because they are instructions. Their failing-first evidence is the baseline run of each eval case in Phase 5. Decided by: agent's call.
- P12. Plan review round 1 (Codex gpt-6-astra, high) arrived after Phases 1 to 4 were Closed. Its accepted findings became task 1.4 and task 5.9 and a run protocol in Phase 5; handling in `reviews/plan-review-1.md`. Decided by: agent's call, by the review-handling rules.
- P11. No specialist skill was searched for online. The installed skills cover the work. Decided by: agent's call.

## Appendix: questions record

- 2026-11-10 Q: where the plan goes / Recommended: `docs/plans/2026-11-10-add-mstack-skill-creator/` / Decision: accepted.
- 2026-11-10 Q: external sources / Recommended: only what the spec cites plus the research notes / Decision: accepted.
- 2026-11-10 Q: reviewer model and effort / Recommended: `gpt-6.1-sol`, high / Decision: `gpt-6-astra`, high.
- 2026-11-10 Q: the missing `codex` skill / Recommended: run `codex exec` directly / Decision: install the skill-codex plugin, done 2026-11-10, loads in a new session.
- 2026-11-10 Q: one pull request / Recommended: yes / Decision: accepted.
- 2026-11-10 Q: host runs on OpenCode and Cursor with the local accounts / Recommended: yes / Decision: accepted.
- 2026-11-10 Q: outline of 5 phases and 18 tasks (the outline message said 17, a miscount) / Recommended: approve / Decision: not answered; the plan was written from the outline and waits for approval as a whole.
- 2026-11-10 Evidence: `gh api` tree of `anthropics/skills` at the pin / Decision: the upstream folder holds 8 scripts, the viewer and its generator; three are copied.
- 2026-11-10 Evidence: `scripts/check-marketplace.mjs` regex for named files / Decision: a path under `scripts/vendor/` is not matched, so the copied files need no exception.
- 2026-11-10 Evidence: `git ls-files`, no test runner and no package manifest in the repository / Decision: `node --test`.
