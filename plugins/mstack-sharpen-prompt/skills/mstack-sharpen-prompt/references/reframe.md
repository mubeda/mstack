# Reframe: problem framing and domain vocabulary

Read this when the mode is `reframe` or `both`. Reframing bridges the gap between how a person describes a symptom and how specialists in that field name, classify, and reason about the underlying problem.

Everything here is 100% offline: name canonical concepts, algorithms, standards, and patterns by name only. Never invent URLs, DOIs, or citation links.

## 1. Ground in real artifacts first

Before classifying the problem, read whatever raw material is available (source files, tests, configs, schemas, logs, draft copy, or policies). A rough description often misdiagnoses the symptom; the real files reveal the true bottleneck or structural flaw. State in one sentence if the files showed something different from the user's description.

## 2. Disambiguate candidate problem classes

When a rough description fits more than one distinct problem class, do not jump silently to the first label that comes to mind:

1. List the 2–3 plausible problem classes and the concrete, observable sign that distinguishes each one.
2. Select the likeliest class (using evidence from the files or prompt) and state in one sentence why it fits best—or what single observation would flip the choice.

When the problem class is already unambiguous from the files and prompt, state it directly in one line and skip the candidate list.

## 3. Impact-ranked domain vocabulary (5–10 terms)

List 5 to 10 high-leverage domain terms ranked from highest impact to lowest. Keep only terms that materially change what the downstream AI will check, design, or avoid. For each term give:

- **Term & canonical concept:** the exact name specialists use (pattern, algorithm, protocol, RFC/standard name, or discipline term—by name only, zero URLs).
- **Plain meaning:** one short sentence in everyday words.
- **How it maps here:** tie it directly to a concrete detail in the user's prompt or files.
- **What to ask the AI:** the specific requirement, constraint, or check that naming this term unlocks.

## 4. Cross-field analogies (2–3)

Offer 2 or 3 analogies from neighboring disciplines that illuminate the structural shape of the problem. For each analogy state:

- **What transfers:** the exact mechanism or design rule that carries over.
- **Where it breaks:** the boundary where the analogy stops fitting, so the downstream AI does not copy an inappropriate constraint.

## 5. Unmentioned concerns

List 2 to 5 concerns, failure modes, edge cases, or invariants that a practitioner in this problem class checks immediately even though the rough prompt did not mention them (for example: crash recovery, concurrency races, idempotency, migration rollback, conflicting stakeholder rules, or measurement bias).

## 6. Feed into the rewrite

Carry only the highest-leverage terms, the chosen problem class, and the concrete unmentioned concerns into the ready-to-send prompt. Do not dump the entire vocabulary glossary into the prompt; weave the exact names cleanly into the prompt's problem statement and requirements.
