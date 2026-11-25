# Resuming a plan folder

Read this in section 0 of SKILL.md when the plan folder already holds `plan.md` and `progress.md`, before any other step. "Rule 8" is rule 8 of SKILL.md's phase 3, with `references/expensive-choices.md`; "the model call of Host tools" is in SKILL.md.

When the folder already holds a plan (`plan.md` and `progress.md`), read both and resume instead. Before a Draft plan continues:

1. **Update `Written by:` in `progress.md`.** In Claude Code this session's vendor is `claude`, in Codex it is `codex`, and in Antigravity it is `unknown`. When `Written by:` holds a comma-separated list of known vendors (`claude`, `codex`, `antigravity`, `other`) and this session has a known vendor, add this session's vendor to that list if it is not already there (for example `Written by: claude, codex`). When `Written by:` is missing, already holds `unknown`, or this session runs in Antigravity, set or keep the bare value `Written by: unknown` (never write a vendor beside `unknown`, such as `unknown, codex`) and append one line to `## Log`: `- <yyyy-mm-dd> Ruling: continued by <claude|codex|an Antigravity session>; earlier writers unknown.`
2. **Check expensive stages and helper slots.** Make the model call of Host tools (it covers tiers, helper slots and the `code review` task for Phase 7, and no longer fills a reviewer slot here) and check every stage and helper slot the plan's files record against rule 8 of phase 3: each flagged tier or model that has no Decisions line of rule 8 gets its question now, whatever phase comes next. A Decisions line counts only when it names every model the current block flags for that stage or slot; for the ones it does not name, ask once.

Then the Draft continues from its first unfinished phase of this skill. An Approved plan stays as it is unless the user asks for a change, and that change sets it back to Draft. A plan whose tasks are already In progress or Closed is being executed, so change only tasks that are still Open and log why.

## Migrating an older `execute-plan.md`

This check applies **only** when the folder's `execute-plan.md` holds an old review-step failure bullet (a bullet beginning `An empty output or a non-zero exit` or `An empty output, a non-zero exit`). A current start file written with `mstack-vendors` has no such bullet: leave it completely untouched and log nothing.

When `execute-plan.md` holds that failure bullet AND still carries the earlier auto-switching wording (telling the inline executor to switch to another reviewer model when the chosen one is rejected, or missing `a reviewer model that was rejected` in rule 3):

1. Read `references/old-start-file.md`.
2. Replace **only** those two passages of `execute-plan.md` — rule 3 of "Rules for the whole run" and that whole failure bullet — with the verbatim text of `references/old-start-file.md`, filling `<fallback reviewer: claude>` and `<fallback reviewer: codex>` from the old file. Keep `- Plan reviewed by:` and any recorded reviewer model unchanged, and change nothing else in `execute-plan.md`.
3. A value copied from the old file is no consent: before the edit writes a flagged fallback model into that instruction (also in an Approved plan), ask that slot's question of rule 8 once, and after a no write the alternative.
4. Append one log entry to `progress.md` recording the migration of those two passages in `execute-plan.md`. This edit does not set an Approved plan back to Draft.

When `execute-plan.md` already holds the two passages of `references/old-start-file.md` verbatim (or has no such failure bullet), leave `execute-plan.md` untouched and add no migration entry to `progress.md`.
