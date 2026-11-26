# Expensive stages and slots

Read this in phase 3, after rule 7 has set the tiers and before any tier or model is recorded, and again whenever a stage or slot appears or changes (the outline, a review finding in phase 7, a resume); read "Before the round" before the first lookup. This file is the rest of rule 8 of SKILL.md's phase 3, and the principle stated there stands above every instruction here. "The Host tools call" is the model call of SKILL.md's Host tools section.

## Before the round

A lookup that runs before rule 8's round uses a model that is not flagged: when the `cheap` row of this host says Expensive `yes`, make the second call below first and use the first model it returns that is not flagged; the cheap-helper slot still gets its question in the round, and after a no later lookups keep that alternative.

One second called-mode call follows only when a row of that block says Expensive `yes`. It holds one request per such row, and its answer for a row is that row's alternative (phase 3, rule 8):

```text
Called by: mstack-plan
Vendor: <the row's vendor>, Tier: <the row's tier>, never: <the row's model>        (one line per row that says yes)
```

## The rule

Nobody gets an expensive model without having said yes to it, so each of these needs the user's consent on its own. A tier is flagged when any row for it in the block of the Host tools call says Expensive `yes`, for any vendor, because the executing session may run on another host. A model is flagged when a row of that block names it and says `yes`.
- A **stage** is each phase whose Tier is flagged and each task whose Tier is flagged. A task inside a flagged phase is a stage of its own.
- A **model slot** is each flagged model the plan's files would name: the cheap helper and the standard helper of each vendor. (The plan reviewer's model is chosen at phase 7, where any flagged offered default gets a question of its own unless the user typed it; a fallback review asks nothing about its model.)

After the tiers are set and before you show the outline, ask about every stage and every slot with your question tool: one numbered round, one question per stage and one per slot. Never put two stages or slots into one question, and never offer one answer for all of them. Each question names its stage or slot, the flagged model of each vendor, and the alternative: for a stage the next tier down, for a slot the model the second call of Host tools returned. The alternative must itself not be flagged: walk down past a flagged tier to the next one that is not, and when the second call returns a model whose row says Expensive `yes`, call again with that model added to `never:` until a row says `no`. Never record a flagged alternative without a yes of its own. When no tier or model that is not flagged exists (for example a flagged `cheap` tier), say so in the question; after a no or no answer, record no tier or model for that stage or slot, write the Decisions line with "no approved model" in place of "<alternative> recorded", and stop there with one line that tells the user what to decide. That stop ends the run: the Decisions line is the last thing you write (in your reply, when `plan.md` does not exist yet), no plan file is written or offered for approval, and phases 5 and 6 run only after the user decided, because a task without a tier fails the plan check. Write each question out in full, never as "the same options as above". No answer covers another question. Then, per question:
- **The user can answer.** Ask, end your turn and wait. Record the flagged choice only after a yes to that question. A default, a preselected option, your own recommendation or silence is never a yes.
- **The user already answered it** in the conversation, before you asked: take that answer and do not ask again.
- **A no,** or **a session that cannot answer** (the user or the prompt says so; then ask nothing): record the alternative. The flagged tier or model then appears nowhere for that stage or slot.
- **The user named the tier or the model for that stage or slot** in the conversation: record it without a question, as the user's choice.

Record every outcome as a line of `plan.md` › Decisions, in the form that fits:

```text
- P<n>. <stage or slot> on <tier or model> (flagged: <models>). Approved models: <models>. Decided by: user, one question, <yyyy-mm-dd>.
- P<n>. <stage or slot> on <tier or model> (flagged: <models>). Approved models: <models>. Decided by: user, named in the conversation, <yyyy-mm-dd>.
- P<n>. <stage or slot>: the expensive choice was declined by the user, <yyyy-mm-dd>; <alternative> recorded.
- P<n>. <stage or slot>: the expensive choice was not answered, <yyyy-mm-dd>; <alternative> recorded.
```

One line per stage and per slot. The last two forms name no declined tier or model. After a no or no answer, write nothing else about the declined choice either: no extra Decisions line, no note in a phase or task, and no sentence in your reply that says which tier or model the stage or slot would have had. This covers what you write yourself: `plan.md`, the phase and task files, the start file and your reply. A reviewer's output saved under `reviews/` is the reviewer's text and stays unchanged, also when it names a declined choice. A task that keeps a flagged tier (the first two forms) also gets the line `- Approved models: <models> (user, <yyyy-mm-dd>)` directly after its `- Tier:` line.

This rule runs again for every stage or slot that appears or changes after that round. A task that is split, a phase or task that is added (by the user at the outline, or by a review finding in phase 7), and a task moved to a flagged tier each get a question of their own before the tier or model is recorded. An approval covers exactly the stage or slot it named: the parts of a split task do not inherit it.

A block without an `Expensive` column comes from an older `mstack-best-model-for`: print the install block of `references/required-skills.md` for it under the line "mstack-plan needs a newer mstack-best-model-for", and stop. A Draft plan written by an earlier version of this skill may record a flagged tier or model without such a Decisions line: the resume check of `references/resume.md` asks that stage's or slot's question once before anything else, because an old value is no consent. An Approved plan stays as it is.
