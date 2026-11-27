# Add `mstack-sharpen-prompt` three-host plugin

Status: Approved 2026-11-27 (approved in chat by the user)
Size: full    Mode: gated    Type: feature
Source: conversation 2026-11-27; `cursor/plugins` (`pstack/skills/sharpen`, `pstack/skills/reframe`, MIT `Copyright (c) 2026 Lauren Tan`, commit `b7b93c3`); `github/awesome-copilot` (`prompt-optimizer`, MIT, commit `93fc8b9`); Anthropic prompt engineering overview (`https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview`, opened 2026-11-27 via `mstack-research`)

## Problem

Users often start an AI task with a rough, under-specified, or weakly framed prompt—describing symptoms instead of the underlying problem class, using vague adjectives ("clean", "robust", "fast") instead of specialist methods, or omitting raw source artifacts and objective verification checks. Existing `mstack` skills do not cover this job: `mstack-brainstorm` runs a multi-turn interview to produce an approved design brief, `mstack-write-specs` writes a formal specification, and `mstack-explain-me-better` simplifies AI *outputs*. There is no read-only, single-turn skill that takes a user's rough prompt, grounds it in actual project files when present, reframes it in accurate domain vocabulary, and sharpens it into a ready-to-send prompt before execution.

## Goals

1. Create a standalone, text-only, 100% offline three-host plugin `plugins/mstack-sharpen-prompt` (`0.1.0`) for Claude Code, Codex CLI, Antigravity, and the skills CLI.
2. Combine problem reframing (problem-class disambiguation, ranked domain vocabulary, cross-field analogies with break points, missed concerns) and prompt sharpening (unasked practitioner craft, rawer source inputs, named methods/tools, objective external checks, empirical prototyping vs user-judgment split) under automatic mode selection (`reframe`, `sharpen`, or `both`).
3. Keep the skill strictly read-only during the rewrite turn, never executing the task or modifying project files, and end with a one-line offer to run the sharpened prompt if the user replies yes.
4. Keep every rule 100% offline with zero external URLs, zero network fetches, zero scripts, and zero required helper skills, crediting `cursor/plugins` (`pstack`, MIT) and `github/awesome-copilot` (`prompt-optimizer`, MIT) in `THIRD_PARTY_NOTICES.md` and `README.md`.
5. Ship automated shape tests (`tests/skill-shape.test.mjs`) and 3 comparison eval suites, wire `mstack-sharpen-prompt` into `mstack-auto`, `mstack-find-skills`, `mstack-setup`, `mstack-skill-creator`, registries (`metadata.version` `0.17.0`), `README.md`, and `AGENTS.md`, pass all repo checks, and complete Phase 8 read-only review.

## Non-goals

- Executing the sharpened prompt, writing code, or modifying files in the rewrite turn (only allowed if the user explicitly replies yes in a later turn).
- Replacing `mstack-brainstorm` (multi-turn discovery interviews), `mstack-write-specs` (formal specs), or `mstack-explain-me-better` (rewriting AI answers).
- Fetching web pages, validating live URLs, or calling `mstack-research` at runtime.
- Using host-specific frontmatter fields such as `disable-model-invocation: true`.

## Settled decisions (from user, 2026-11-27)

- **D1 (Target & workspace):** Add `plugins/mstack-sharpen-prompt` as a three-host plugin (`0.1.0`) in the current branch (`feat/mstack-web-ui-modern-web-guidance`) alongside the uncommitted `mstack-web-ui` `0.3.0` changes.
- **D2 (Triggering & modes):** Portable two-field frontmatter (`name` + `description` starting with `Use when...`) with automatic mode selection: `reframe`, `sharpen`, or `both` together.
- **D3 (Execution boundary):** Strictly read-only output during the rewrite turn, ending with a one-line offer to run the sharpened prompt if the user replies yes.
- **D4 (Offline references):** 100% offline with zero external URLs; name canonical concepts, patterns, and standards by name only and never invent URLs or fake citations.

## Requirements

### R1. Portable, self-contained, text-only skill folder  [Must]
`plugins/mstack-sharpen-prompt/skills/mstack-sharpen-prompt/` SHALL contain only:
- `SKILL.md` (`<= 200` lines, body `<= 24,000` bytes; frontmatter has only `name` and trigger-first `description` `<= 1,024` chars with no step summary).
- `references/reframe.md` (`<= 150` lines), `references/sharpen.md` (`<= 150` lines), and `references/prompt-craft.md` (`<= 150` lines).
- `LICENSE` (byte-identical to root `LICENSE`) and `THIRD_PARTY_NOTICES.md` (crediting `cursor/plugins` `pstack` MIT `b7b93c3` and `github/awesome-copilot` `prompt-optimizer` MIT `93fc8b9`, with full MIT copyright lines and permission notice).
- `evals/` (3 comparison eval suites).
Total Markdown outside `evals/` SHALL be `<= 700` lines, and rule text (`SKILL.md` + `references/*.md`) SHALL contain zero `https?://` URLs.

### R2. Context-first, read-only automatic mode selection  [Must]
Before rewriting, the agent SHALL inspect real project files, code, logs, or referenced artifacts when available (never relying solely on a user's paraphrase when raw files exist), announce the chosen mode in one line (`Mode: reframe`, `Mode: sharpen`, or `Mode: both`), and read only the reference files needed for that mode:
- **`reframe`:** when the user asks to reframe/name/classify a problem or their description has vocabulary or problem-class gaps.
- **`sharpen`:** when the problem framing is clear and the user wants deeper rigor, rawer inputs, specialist methods, and objective verification (or explicitly asks to sharpen/tighten a prompt).
- **`both`:** default when a rough prompt has both framing/vocabulary gaps and execution-rigor gaps (runs reframe first, then sharpens the reframed problem into one prompt).

### R3. Reframe rules (`references/reframe.md`)  [Must]
When reframing, the skill SHALL:
1. Disambiguate candidate problem classes when a rough description fits more than one (listing each candidate with its distinguishing observable sign, then picking the likeliest fit and stating why).
2. Surface 5–10 impact-ranked domain terms (offline by name only, zero URLs): plain meaning, mapping to the user's actual situation/files, canonical concept/pattern/standard name, and the concrete AI ask it unlocks.
3. Offer 2–3 cross-field analogies stating both what transfers and where each analogy breaks.
4. Name unmentioned practitioner concerns, invariants, or failure modes omitted by the original description.

### R4. Sharpen rules (`references/sharpen.md`)  [Must]
When sharpening, the skill SHALL deepen the task without expanding its scope using four lenses before rewriting:
1. Unasked practitioner craft (what a top specialist does automatically on this problem).
2. Rawer source inputs (primary logs, code, failing test output, schema, diff, or trace instead of pre-digested summaries).
3. Concrete specialist methods and tools (replacing vague adjectives like "robust", "clean", or "optimize").
4. Objective external check (a test, reproduction, benchmark, or invariant proving correctness beyond the AI's own claim).
The rewritten prompt SHALL direct the downstream agent to prototype or measure experimentally decidable choices and recommend from observed results, while escalating non-experimental product, UX, or taste calls to the user.

### R5. Prompt craft & execution boundary (`references/prompt-craft.md` & `SKILL.md`)  [Must]
- Output concise mode-appropriate analysis followed by **one** ready-to-send prompt inside a single fenced block.
- Keep prompt structure proportional (plain prose for focused asks; concise labeled sections for multi-part tasks).
- Embed concrete file paths, symbols, or facts from the user's workspace/input instead of hollow `[INSERT X]` placeholders; if the user asked for a reusable prompt with no input yet, instruct the target AI to ask for the missing input on the next turn.
- Stay strictly read-only: modify zero files and run zero task-execution actions in the rewrite turn.
- End every reply with a single-line offer: `Reply "yes" if you want me to run this prompt now.` (and execute only after explicit confirmation in a later turn).
- State clear boundaries vs `mstack-brainstorm`, `mstack-write-specs`, and `mstack-explain-me-better`.

### R6. Automated shape tests & 3 comparison evals  [Must]
- Add `plugins/mstack-sharpen-prompt/tests/skill-shape.test.mjs` enforcing line/byte limits, allowed file types, zero URLs in rule text, exact `LICENSE` parity, MIT attribution in `THIRD_PARTY_NOTICES.md`, and behavioral markers (modes, read-only boundary, one-line offer, empirical vs user-judgment split).
- Add 3 comparison eval suites under `plugins/mstack-sharpen-prompt/skills/mstack-sharpen-prompt/evals/`:
  1. `reframe-and-sharpen-codebase` (vague job-runner prompt in a real code fixture -> `both` mode, reads `worker.js`, stays read-only, zero URLs).
  2. `sharpen-only-clear-framing` (explicit sharpen request on unit tests -> `sharpen` mode, no bloated reframe dump, tight scope, objective check).
  3. `reframe-only-no-repo` (non-code support-policy prompt -> `reframe` mode, problem-class disambiguation, analogies with break points, offline concepts only).
- Run Phase 5 comparison tests (`with-skill` vs `baseline` via `invoke_subagent` `flash`) and grade all 3 suites.

### R7. Three-host packaging, repo wiring, checks & Phase 8 review  [Must]
- Add `.claude-plugin/plugin.json`, `.codex-plugin/plugin.json`, and `.antigravity-plugin/plugin.json` at `0.1.0`.
- Register `mstack-sharpen-prompt` (`0.1.0`) in `.claude-plugin/marketplace.json` and `.agents/plugins/marketplace.json`, raising `metadata.version` to `0.17.0` (minor bump for adding a plugin).
- Wire `mstack-sharpen-prompt` into:
  - `plugins/mstack-auto/skills/mstack-auto/SKILL.md` (already bumped to `0.1.6` on this branch)
  - `plugins/mstack-find-skills/skills/mstack-find-skills/references/matching.md` (already bumped to `0.2.13` on this branch)
  - `plugins/mstack-setup/` (`scripts/check-setup.mjs`, `references/dependencies.md`, `tests/check-setup.test.mjs`, `evals/*/place-files.sh`, bumped patch across 3 manifests + 2 registries)
  - `plugins/mstack-skill-creator/skills/mstack-skill-creator/references/host-{antigravity,claude-code,codex}.md` (bumped patch across 3 manifests + 2 registries)
  - `README.md` (`## What's inside`, install sections, `## Credits`) and `AGENTS.md` (`## Shared skills`)
- Pass `skill-shape.test.mjs`, `check-setup.test.mjs`, `check-marketplace.test.mjs`, `check-version-bumps.test.mjs`, `check-skill.mjs`, `scan-private.mjs`, `check-version-bumps.mjs`, `check-marketplace.mjs`, `agy plugin validate plugins/mstack-sharpen-prompt`, outside-the-diff sweep, and Phase 8 read-only review via `mstack-vendors` + `mstack-receive-review`.

## Plan (implementation sequence)

1. **Tests first (TDD red):** Write `plugins/mstack-sharpen-prompt/tests/skill-shape.test.mjs`; run `node --test` and confirm FAIL.
2. **Author skill files (TDD green):** Create `SKILL.md`, `references/reframe.md`, `references/sharpen.md`, `references/prompt-craft.md`, `LICENSE`, and `THIRD_PARTY_NOTICES.md`; verify `skill-shape.test.mjs`, `check-skill.mjs`, and `scan-private.mjs` pass.
3. **Add 3 eval suites & run Phase 5–6 comparison tests:** Create the 3 eval fixtures/graders, run `with-skill` vs `baseline` subagents (`invoke_subagent` `flash`), grade all 3 suites, and verify clear improvement.
4. **Package & wire across repository:** Add 3 plugin manifests (`0.1.0`), update both marketplace registries (`0.17.0`), update `mstack-auto`, `mstack-find-skills`, `mstack-setup` (+ tests/evals + version bump), `mstack-skill-creator` host files (+ version bump), `README.md`, and `AGENTS.md`; run all unit tests, `check-version-bumps.mjs`, `check-marketplace.mjs`, `agy plugin validate`, `check-skill.mjs`, `scan-private.mjs`, and outside-the-diff sweep.
5. **Phase 8 read-only review & Phase 9 report:** Run read-only review via `mstack-vendors` + `mstack-receive-review`, fix verified findings with tests, re-run all checks, and deliver the Phase 9 report (uncommitted until you ask).
