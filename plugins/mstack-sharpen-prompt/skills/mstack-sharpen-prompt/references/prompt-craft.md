# Prompt craft and output layout

Read this on every run before writing the final response and the ready-to-send prompt.

## 1. Structure proportional to complexity

Match the rewritten prompt's structure to the size of the task:

- **Focused ask** (one file, one bug, one test suite, one focused question): concise, direct prose with a short bulleted list for constraints and verification. Skip heavy headings or roleplay preambles.
- **Multi-part ask** (architecture change, multi-file refactor, system design, cross-team policy): clear labeled sections (`Context`, `Goal`, `Requirements`, `Verification`, `Decisions to confirm`) so the downstream AI can check off every constraint cleanly.

Lead with the concrete goal and ground-truth context, then constraints/methods, then objective verification.

## 2. Grounding and zero hollow placeholders

- **Embed real details—never secrets.** When the user's workspace or message gives real file paths, function names, test commands, schemas, header names, status codes, or error classes, put those exact diagnostic details into the rewritten prompt. Never replace real context with `[INSERT FILE]` or `<paste code here>`. At the same time, never copy raw credential values (Bearer tokens, API keys, `Authorization` header values, cookies, passwords, private keys) or unnecessary personal data into the analysis or ready-to-send prompt: keep only the diagnostic facts (e.g., header name and `401` status) and omit or redact the secret value.
- **Reusable prompts with no input yet.** When the user explicitly asks for a reusable prompt template and has not supplied the target input, still avoid raw bracket placeholders inside instructions. Instead, write a self-contained prompt that instructs the target AI to ask the user for the needed input on the next turn before proceeding.
- **No invented facts.** Never fabricate metrics, file paths, command names, error logs, or URLs. If an important piece of context is missing and not in the workspace, note it briefly in the analysis and instruct the target AI to inspect or ask for it first.

## 3. Positive, verifiable phrasing

- State what the AI *should* produce and verify rather than stacking vague prohibitions ("don't miss edge cases", "don't write buggy code").
- Keep hard safety boundaries explicit when they matter (for example: "do not modify public API signatures", "do not commit or push", "preserve existing file format").
- Include one concrete verification step or acceptance condition that fails before the work and passes after, whenever the task has a verifiable outcome.

## 4. Exact response layout

Return the response in this order, with no extra preamble or closing filler:

1. **Line 1:** `Mode: <reframe|sharpen|both> — <brief reason>`
2. **Analysis section(s):**
   - In `reframe` mode: Problem class (with disambiguation if needed), Ranked domain terms, Cross-field analogies (transfers + where each breaks), Unmentioned concerns.
   - In `sharpen` mode: Four-lens diagnostic (Practitioner craft, Rawer inputs, Named methods, Objective check).
   - In `both` mode: concise Reframe findings (problem class, top domain terms, analogies, unmentioned concerns) followed by concise Sharpen findings (four lenses), without repeating points across both.
3. **`## Ready-to-send prompt`:** exactly **one** self-contained prompt inside a single fenced code block, ready to copy-paste or run directly. Choose an outer fence longer than the longest backtick run inside the prompt (for example four backticks when the prompt contains a three-backtick code sample), or a non-colliding tilde fence (`~~~`), so nested code blocks never terminate the outer fence early.
4. **Final line (verbatim):** `Reply "yes" if you want me to run this prompt now.`
