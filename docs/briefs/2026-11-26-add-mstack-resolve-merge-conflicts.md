# Design brief: Add mstack-resolve-merge-conflicts

Status: Approved 2026-11-26 (approved in chat by the user)

## Intent

Developers using Claude Code, Codex CLI or Antigravity regularly stop on Git conflicts during merges, rebases, cherry-picks, or stash pops—or discover conflict markers left inside already-staged files. Today no `mstack` skill handles Git conflict resolution, so `mstack-auto` falls through to `mstack-find-skills` and an online search every time, while unprompted agents tend to read entire conflicted files into context, pick `--ours`/`--theirs` without understanding why each branch changed, hand-edit lockfiles, or leave stray markers behind.

This work creates a native, self-contained `mstack` skill—`mstack-resolve-merge-conflicts`—that combines compact context extraction (adapted from `warpdotdev/common-skills`, MIT) with intent-first history tracing (`mattpocock/skills`, MIT), category-specific resolution rules (`tailcallhq/forgecode`, Apache-2.0), and minimal-diff safety guardrails (`cursor/plugins`, MIT), all backed by a single zero-dependency Node.js CLI and credited in `THIRD_PARTY_NOTICES.md` and `README.md`.

## Goals, non-goals and anti-goals

Goals:
- Ship `mstack-resolve-merge-conflicts` as a three-host `mstack` plugin (Claude Code, Codex CLI, Antigravity) that also installs cleanly via `npx skills add mubeda/mstack`.
- Ship a zero-dependency Node.js 18+ read-only script (`scripts/conflict-context.mjs`) that works identically on Linux, macOS and Windows and extracts compact conflict context (active Git operation, rebase step, incoming/local commit subjects, unmerged paths, stages, conflict categories, compact `ours`/`base`/`theirs` hunks + unified diff, index-stage previews, and staged/worktree marker-only files) without dumping whole files into context.
- Provide deterministic post-resolution verification (`--verify`) confirming zero unmerged paths and zero remaining conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`) before finishing.
- Trace branch intent from commit messages, PRs or issues before resolving non-trivial hunks; preserve both intents whenever compatible; never invent behavior absent from both sides.
- Apply category playbooks in `references/resolution-patterns.md` for deleted-modified/renames (`git log --follow`), generated and lockfile regeneration via package tools, imports, tests, types/structs, configuration, and binary files.
- Resolve clear hunks directly, ask the user only on genuine intent contradictions, ambiguous deleted-modified cases, or binary files; stage resolved files and run project checks/tests; ask before committing, running `git rebase --continue` / `git merge --continue` / `git cherry-pick --continue`, or aborting.
- Wire `mstack-resolve-merge-conflicts` into `mstack-auto` (routing table), `mstack-setup` (optional tier), `mstack-find-skills` (preferred mstack skills table), `mstack-skill-creator` host files, both marketplace registries, `README.md` (plugin table, install sections, and Credits), and `AGENTS.md`.
- Credit all four third-party sources (`warpdotdev/common-skills`, `mattpocock/skills`, `tailcallhq/forgecode`, `cursor/plugins`) with exact copyright lines and license texts in `THIRD_PARTY_NOTICES.md` and in `README.md`'s Credits table.

Non-goals:
- Wiring the six review/dev workflows (`mstack-*-led-review`, `mstack-*-led-dev`) to call `mstack-resolve-merge-conflicts` in v0.1.0 (stays standalone, like `mstack-anonymize` and `mstack-web-ui`).
- A called mode for other skills in v0.1.0.
- Automatic `git commit`, `git rebase --continue`, `git push`, `git tag`, or `git merge/rebase --abort` without explicit user consent.
- Tracking `warpdotdev/common-skills@resolve-merge-conflicts` as an external companion in `mstack-setup` (replaced by this native skill).
- Solving non-Git merge tools or binary content merging (binary conflicts are surfaced for the user to pick a side or regenerate).

Anti-goals (failure even if everything runs):
- Dumping full conflicted files into context by default instead of starting from compact hunk/stage extraction.
- Silently dropping one branch's intended behavior via `--ours`/`--theirs` without checking intent or explaining the tradeoff.
- Leaving any unmerged index entry or conflict marker (`<<<<<<<`, `=======`, `>>>>>>>`) behind when reporting resolution complete.
- Committing, continuing a rebase/merge, pushing, tagging, or running `--abort` without the user's explicit yes.
- Hand-merging lockfiles or generated artifacts instead of regenerating them (or warning when regeneration cannot run).
- Requiring Python 3 or any npm package at runtime.
- Copying verbatim unlicensed text or omitting required MIT/Apache-2.0 attribution.
- Including personal data, home paths, or private repository details in any committed file.

## Constraints

- **License compatibility (verified 2026-11-26 from live GitHub repos):**
  - `warpdotdev/common-skills` (`resolve-merge-conflicts`): MIT, `Copyright (c) 2026 Denver Technologies, Inc.`
  - `mattpocock/skills` (`docs/engineering/resolving-merge-conflicts.md`): MIT, `Copyright (c) 2026 Matt Pocock`
  - `tailcallhq/forgecode` (`.forge/skills/resolve-conflicts/`): Apache-2.0 (no `NOTICE` file)
  - `cursor/plugins` (`cursor-team-kit/skills/fix-merge-conflicts`): MIT, `Copyright (c) 2026 Cursor`
  All four are permissive and compatible with `mstack`'s Apache-2.0 license. Rules must be rewritten in this project's own words and credited in `plugins/mstack-resolve-merge-conflicts/skills/mstack-resolve-merge-conflicts/THIRD_PARTY_NOTICES.md` and `README.md`.
- **Self-contained skill folder (`AGENTS.md`):** Everything the skill uses (`SKILL.md`, `references/`, `scripts/`, `LICENSE`, `THIRD_PARTY_NOTICES.md`) must live inside `plugins/mstack-resolve-merge-conflicts/skills/mstack-resolve-merge-conflicts/`. Any fixture `SKILL.md` in evals must be named `SKILL.md.fixture`.
- **Antigravity limits (`AGENTS.md` & `scripts/check-marketplace.mjs`):** `SKILL.md` body after frontmatter must stay at or below 24,000 bytes; `.antigravity-plugin/plugin.json` must pass `agy plugin validate`. No script or agent starts an Antigravity session.
- **Host tool isolation (`check-skill.mjs`):** Host-specific tool names (`AskUserQuestion`, `ask_question`, etc.) appear only inside `SKILL.md`'s host table.
- **Zero extra runtime (`mstack` convention):** Like `mstack-anonymize` and `mstack-setup`, the script runs on Node.js 18+ and `git` only, with zero npm dependencies and no Python dependency.
- **Versioning & marketplace checks (`AGENTS.md`):** Adding a new plugin raises marketplace `metadata.version` by a minor bump (`0.15.0` → `0.16.0`) in both `.claude-plugin/marketplace.json` and `.agents/plugins/marketplace.json`, sets the new plugin to `0.1.0` across all three manifests and both registries, bumps every modified existing plugin (`mstack-auto`, `mstack-setup`, `mstack-find-skills`, `mstack-skill-creator`), and passes `check-version-bumps.mjs`, `check-marketplace.mjs`, `check-skill.mjs`, `scan-private.mjs`, and unit tests.
- **Public repository (`AGENTS.md`):** No personal names, machine paths, private URLs, or credentials in code, tests, or eval fixtures.

## Approaches considered

1. **Approach A — Compact `SKILL.md` + single read-only Node.js CLI (`scripts/conflict-context.mjs`) + on-demand `references/resolution-patterns.md` (picked).** One zero-dependency Node.js script handles summary/operation detection, compact per-file hunk/stage/diff extraction, staged marker-only scanning, and `--verify`; `SKILL.md` holds the concise 5-step workflow and guardrails; `references/resolution-patterns.md` holds category playbooks loaded only when needed.
2. **Approach B — Multi-script toolkit (separate extractor, deleted-modified backup/index-mutating script, and validator).** Closer to ForgeCode + Warp's file split and auto-backs up deleted-modified files, but splits one cohesive inspection concern across three scripts and mutates Git index/files before the user answers deleted-modified ambiguity.
3. **Approach C — Prompt-only skill using raw `git` commands.** No script to test or maintain, but sacrifices compact hunk/stage extraction (causing agents to read full conflicted files) and loses a deterministic `--verify` gate.

The user picked **Approach A**, because it keeps `SKILL.md` lean, delivers Warp's compact extraction plus marker-only detection and deterministic verification in one cross-platform Node.js script, and keeps all mutating choices under the agent's approval rules.

## Tradeoffs accepted

- **Design red flag — Lists kept in step by hand:** Adding a new plugin requires updating both marketplace registries, `mstack-auto`'s routing table, `mstack-setup` (`check-setup.mjs`, `dependencies.md`, tests, eval fixtures), `mstack-find-skills` (`matching.md`), `mstack-skill-creator` host files, `README.md`, and `AGENTS.md`. Accepted because that is `mstack`'s existing plugin architecture and `scripts/check-marketplace.mjs` + `scripts/check-version-bumps.mjs` enforce the registries, manifests, and routing table automatically.
- **No automatic deleted-modified backup script:** Unlike Approach B, deleted-modified files are inspected from Git index stages (`:1:`, `:2:`, `:3:`) and `git log --follow` without writing temporary backup files to disk. Accepted because Git stages already preserve the exact content non-destructively until the user decides.
- **No workflow integration in v0.1.0:** The six review/dev workflows keep their existing integration wording rather than invoking `mstack-resolve-merge-conflicts`. Accepted to keep scope crisp and avoid bumping all six workflow plugins before the standalone skill is proven.
- **Requires Node.js 18+ and `git`:** On machines without Node.js the extractor script cannot run; the skill reports that clearly rather than silently falling back to dumping full files without warning. Accepted because `node` and `git` are already mandatory in `mstack-setup`.

## Decisions

### Decided by the user

- Create a new native `mstack` skill rather than wiring `warpdotdev/common-skills@resolve-merge-conflicts` as an external companion; verify third-party licenses first, enhance it with ideas from other licensed conflict skills, and credit all sources (message 2, 2026-11-26).
- Name the skill and plugin `mstack-resolve-merge-conflicts` (round 1, 2026-11-26).
- Rewrite the compact conflict-extractor script in zero-dependency Node.js (fixing Warp's relative path, marker-only, and Windows Python issues) while crediting `warpdotdev/common-skills` under MIT (round 1, 2026-11-26).
- Interaction and Git policy: resolve clear hunks directly, pause to ask only on genuine intent contradictions, deleted-modified ambiguity, or binary files; stage resolved files and validate tests/checks; always ask before committing, running `git rebase --continue` / `git merge --continue`, or aborting (round 1, 2026-11-26).
- Discard the earlier uncommitted companion-skill edits and build cleanly on a fresh branch off `main` (round 1, 2026-11-26).
- Include all three complementary enhancements: intent tracing from commit/PR history (`mattpocock/skills`, MIT), category rules for lockfiles/generated/deleted-modified/renames (`tailcallhq/forgecode`, Apache-2.0), and minimal-diff guardrails (`cursor/plugins`, MIT) (round 2, 2026-11-26).
- Keep `mstack-resolve-merge-conflicts` standalone in v0.1.0 (no required other mstack skills; wired into `mstack-auto`, `mstack-setup` optional tier, and `mstack-find-skills`) (round 2, 2026-11-26).
- Target all three mstack hosts (Claude Code, Codex CLI, Antigravity) plus skills CLI support, covering active merge, rebase (including multi-commit), cherry-pick, stash-pop conflicts, and already-staged marker-only files (round 2, 2026-11-26).
- Pick Approach A (compact `SKILL.md` + single read-only `scripts/conflict-context.mjs` + `references/resolution-patterns.md`) (approaches round, 2026-11-26).

### Agent's calls

- Brief saved at `docs/briefs/2026-11-26-add-mstack-resolve-merge-conflicts.md` on branch `add-mstack-resolve-merge-conflicts` (uncommitted), matching existing `docs/briefs/` naming and `AGENTS.md`.
- `mstack-resolve-merge-conflicts` requires no other mstack skill (only `node` and `git`), matching `mstack-anonymize` and `mstack-web-ui`, so `mstack-setup` lists it in the optional tier and no preflight blocks on other skills.
- For multi-commit rebases, after resolving the current stopped commit, staging, and validating, the skill asks the user before running `git rebase --continue`; if the next commit also stops on conflicts, the user's explicit continuation resumes the same loop for the next commit.
- `scripts/conflict-context.mjs` stays strictly read-only (never edits files, never stages, never mutates `.git`), so it is safe to run before any decision and straightforward to test against disposable temp Git repos in `node --test`.
- Issue #28's original proposal (tracking Warp's external skill) is superseded by this native skill; the PR description will explain why the native skill replaces external companion tracking and link #28.

## Open questions

- None that block the spec. Exact heuristics for recognizing generated/lockfile paths, marker-only scanning scope (staged vs modified tracked files, excluding binary files and documentation examples of conflict markers), and JSON/text output schema of `conflict-context.mjs` belong in the spec.

## Left to the spec

- Exact EARS requirements and scenarios for `mstack-resolve-merge-conflicts`: CLI flags, exit codes, text and JSON output schemas, diff3 (`|||||||`) hunk parsing, unified diff generation, marker-only false-positive guards (e.g., ignoring docs/tests that intentionally mention conflict markers unless actually conflicted or modified), and `--verify` behavior.
- Exact category detection list (lockfiles, generated artifacts, binary files, deleted-modified/rename detection via `git log --follow`).
- Exact wording of the `SKILL.md` workflow, host table, intent-tracing commands, user-question escalation format, and final report format.
- Exact unit test matrix (`plugins/mstack-resolve-merge-conflicts/tests/conflict-context.test.mjs`) covering real temporary Git repos (merge, rebase, multi-commit rebase, cherry-pick, stash pop, add/add, deleted-by-us/them, rename/modify, diff3 markers, binary conflict, staged marker-only file, clean repo).
- Exact eval cases and comparison test tasks for `mstack-skill-creator` Phases 5–8.
- Exact updates to `mstack-auto`, `mstack-setup` (including eval `place-files.sh` fixtures and `check-setup.test.mjs`), `mstack-find-skills`, `mstack-skill-creator` host files, both marketplace registries, `README.md`, and `AGENTS.md`.
