---
name: mstack-sharpen-prompt
description: Use when the user wants to sharpen, reframe, tighten, or improve a prompt before sending it to an AI, asks "sharpen this prompt", "reframe this problem", "help me ask an AI this better", "what are the right terms for this", or brings a rough prompt that needs better domain framing, rawer inputs, or objective verification before work starts. Works in Claude Code, Codex and Antigravity, in a codebase or outside it. Produces a concise analysis and one ready-to-send prompt without executing the task.
---

# mstack sharpen prompt

Turn a rough user prompt into a sharper, better-framed prompt before any AI executes it. The job is to improve the ask—never to expand its scope, invent missing facts, or start executing the task during the rewrite turn.

## Ground rules

1. **Strictly read-only in the rewrite turn.** Never execute the prompt, edit project files, install packages, or run mutating commands while reframing or sharpening. Only run the sharpened prompt if the user explicitly confirms in a later turn.
2. **Deepen without widening scope.** Keep the user's actual goal intact. Replace vague wording with precise domain terms, rawer artifacts, specialist methods, and objective checks for the same task—do not bolt on extra features or unrelated refactors.
3. **Inspect real context first.** When the prompt refers to a repository, file, stack trace, schema, or error output that is present in the workspace, read the actual files before judging or rewriting. Never guess at code or rely only on a paraphrase when the source is readable.
4. **100% offline—zero invented links.** Never fetch web pages or invent URLs, papers, or benchmarks. Name established domain concepts, standards, and patterns by name only.
5. **No hollow placeholders—and never leak secrets.** Embed the real file paths, symbols, commands, and diagnostic facts you observed, but omit or redact raw credential values (tokens, API keys, passwords, cookies, `Authorization` values) and unnecessary personal data so a shareable prompt never exposes secrets (name `mstack-anonymize` if customer data needs structured pseudonymization). If the user asked for a reusable prompt with no input supplied yet, instruct the target AI to ask for the missing input on the next turn instead of leaving unfilled bracket placeholders.
6. **Separate experiments from user judgment.** Tell the downstream AI to prototype or measure choices that can be decided empirically and recommend from observed results, while surfacing non-experimental product, UX, or preference decisions for the user to choose.
7. **Match the user's language.** Write both the analysis and the rewritten prompt in the language the user wrote in, keeping code identifiers, file paths, commands, and canonical technical terms verbatim.

## When another skill fits instead

- Multi-turn discovery of an undecided product or feature idea into an approved design brief: `mstack-brainstorm`.
- Formal requirements specification or PRD: `mstack-write-specs`.
- Simplifying an AI's confusing *output* into plain language: `mstack-explain-me-better`.

This skill sits right before a prompt goes to an AI: single-turn, read-only, focused on making the *input prompt* stronger.

## Reference parts

Read only the parts the chosen mode needs:

| Part | Holds | Read it when |
|---|---|---|
| `references/reframe.md` | Problem-class disambiguation, ranked domain terms, cross-field analogies with break points, unmentioned concerns | Mode is `reframe` or `both` |
| `references/sharpen.md` | Four sharpening lenses (practitioner craft, rawer inputs, specialist methods, objective checks) and empirical-vs-judgment split | Mode is `sharpen` or `both` |
| `references/prompt-craft.md` | Proportional prompt structure, zero-placeholder rule, positive verifiable phrasing, final output layout | Every run |

## Mode selection

Pick one mode and announce it on the first line of your reply (`Mode: reframe`, `Mode: sharpen`, or `Mode: both`):

- **`Mode: reframe`** — The user explicitly asks to reframe, name, or classify a problem ("reframe this", "what is this called", "give me the right vocabulary"), or the prompt's main weakness is describing symptoms without naming the underlying problem class or domain concepts.
- **`Mode: sharpen`** — The user explicitly asks only to sharpen or tighten a prompt ("sharpen this prompt", "make this prompt tighter"), or the problem framing and terminology are already accurate and the prompt mainly lacks raw inputs, specialist methods, or an objective check.
- **`Mode: both`** — Default when a rough prompt suffers from both fuzzy framing/vocabulary and weak execution rigor or missing verification. Reframe the problem first, then sharpen the reframed ask into one unified prompt.

When the user explicitly asks for a reusable prompt for a named task class—even with no draft or target input yet—proceed directly and produce a self-contained prompt that instructs the target AI to ask for the missing input on the next turn (`references/prompt-craft.md`). Ask one short question for the draft prompt (and any files it relates to) and stop only when the user gave neither a draft to improve nor a stated task class for a reusable prompt.

## Workflow

1. **Read the real artifacts first.** If the prompt mentions files, modules, tests, logs, or a workspace repository, read the relevant files (read-only) until you can see the actual failure modes, types, constraints, and existing commands. Note anything that contradicts the rough prompt's assumption.
2. **Choose and announce the mode.** Write `Mode: reframe`, `Mode: sharpen`, or `Mode: both` on line 1, with a few words stating why.
3. **Analyze with the mode's reference files.**
   - For `reframe` or `both`, follow `references/reframe.md`.
   - For `sharpen` or `both`, follow `references/sharpen.md`.
   - Always follow `references/prompt-craft.md` for the rewritten prompt.
4. **Emit the response in the exact output structure** of `references/prompt-craft.md`:
   - Line 1: `Mode: <reframe|sharpen|both> — <brief reason>`
   - Concise analysis sections for the chosen mode (only what earns its keep; skip fluff).
   - `## Ready-to-send prompt` with **one** self-contained prompt inside a single fenced code block.
   - Final line (always present, verbatim): `Reply "yes" if you want me to run this prompt now.`

## Never

- Execute the prompt, write product code, or edit files in the rewrite turn.
- Widen the task's scope into features or refactors the user did not ask for.
- Invent facts, benchmarks, metrics, file paths, or URLs.
- Pad a clear, narrow prompt with unnecessary taxonomy dumps or boilerplate ceremony.
- Leave unfilled `[INSERT ...]` placeholders when real files or facts are available.
