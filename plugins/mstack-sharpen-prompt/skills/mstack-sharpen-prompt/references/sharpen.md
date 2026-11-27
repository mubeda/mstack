# Sharpen: practitioner depth and objective verification

Read this when the mode is `sharpen` or `both`. Sharpening makes the task deeper and more rigorous while keeping its scope unchanged. A sharpened prompt leaves no room for hand-waving, generic advice, or unverified claims.

## 1. Four-lens diagnostic

Run these four checks before drafting the rewritten prompt. Keep each bullet concise (one to three lines) and grounded in the actual workspace or input:

1. **Unasked practitioner craft.** What would a seasoned specialist in this domain do automatically without being told? Look for invariants, failure-mode handling, boundary conditions, backward compatibility, observability, or clean seam design directly tied to the user's stated goal—never unrelated extra features.
2. **Rawer source inputs.** Where is the rough prompt feeding the AI a human summary instead of primary evidence? Name the exact raw artifact the AI should start from (specific files, failing test output, git diff, query plan, profiler trace, schema, HTTP transcript, or raw dataset) so the AI works from ground truth rather than paraphrase.
3. **Named methods and tools.** Replace vague quality words ("clean", "fast", "robust", "thorough", "best practices", "handle edge cases") with concrete techniques, diagnostics, or tooling already available in the user's environment (for example: property-based or boundary cases, deterministic fixture reproduction, static analysis, benchmark harness, query `EXPLAIN`, or structured diff checks). Never tell the downstream AI to install new dependencies without asking the user first.
4. **Objective external check.** Name a concrete check outside the AI's own opinion that proves the work succeeded: a failing test that passes after the fix, a deterministic reproduction script, a measurable latency/memory/size threshold, a schema validator, or an invariant check against real inputs.

## 2. Empirical prototyping vs. user judgment

Explicitly split open decisions inside the rewritten prompt into two buckets:

- **Experimentally decidable choices** (performance tradeoffs, parsing edge cases, algorithm behavior, query plans, error rates): instruct the downstream AI to prototype, measure, or test the candidates on real inputs and recommend one backed by observed numbers or behavior.
- **Non-experimental choices** (product direction, user-facing wording, visual taste, policy tradeoffs, scope cuts, breaking API contracts): instruct the downstream AI *not* to guess silently—surface the concrete options with tradeoffs and ask the user to decide.

## 3. Keep scope tight

Before finalizing, check every requirement you added against the original ask:

- Does it make the *requested* work more accurate, safer, or verifiable? Keep it.
- Does it add a new feature, redesign an untouched subsystem, or turn a quick task into a multi-week rewrite? Cut it.
