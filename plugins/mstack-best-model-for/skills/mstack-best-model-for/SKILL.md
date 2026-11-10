---
name: mstack-best-model-for
description: Use when the user asks which model or effort to use for a task, for Claude or Codex, such as "which model for this subagent", "what effort should the review run at", "is haiku enough for this", "best Codex model for debugging", or when another mstack skill needs a model and effort for a tier (cheap, standard, most capable) or a task before it starts a subagent, a lane or a reviewer. Works in Claude Code and Codex. Returns a model, an effort, how to set both, a reason and a next step, per vendor.
---

# mstack-best-model-for

Answers which model and effort fit a task, for Claude, Codex or both, from one table: `references/model-table.md`. Every other mstack skill takes its model choices from here, so a change to the table reaches all of them.

| Role | Claude Code | Codex |
|---|---|---|
| Question tool | AskUserQuestion | a numbered question in chat, then wait |

## Two modes

- **User mode**: the user invoked the skill. If the task or the vendor is missing, ask for both in one question with your question tool and wait. Do nothing else until the answer arrives. Vendor `both` is a valid answer.
- **Called mode**: another skill loaded this one and said which skill is calling. Ask nothing, ever. Answer every request in the message and end with the result block. A request with no vendor gets a row for each vendor.

A called message gives, per request: a vendor (`claude`, `codex` or `both`), a tier (`cheap`, `standard`, `most capable`) or a task description, and optional limits `never: <models>` and `max effort: <level>`.

## Pick the row

Read `references/model-table.md` before you answer. Then, for each request:

1. A tier named by the caller picks that tier's row. Tier names are exact: never map `standard` to a task row.
2. Otherwise take the task row that fits the description best.
3. Otherwise take "general starting point, or unsure", and write in Reason that it is the default because no row fits.

Where a cell gives two models, take the first and name the second in Reason. Where it gives an effort range, take the lower end and name the higher one in Next step.

Never answer with the model you are running on because it is the session's model. The table decides.

## Limits

Apply the caller's limits to the row's choice, in this order:

1. `never`: if the chosen model is in the list, walk the vendor's capability order in `references/model-table.md` downward from it and take the first model not in the list. If none is below it, walk upward. If every model is excluded, the answer is `no model fits`.
2. `max effort`: if the effort is above the limit, lower it to the limit. Levels rise as `low`, `medium`, `high`, `xhigh`, `max`.
3. Mark Capped `yes` when either step changed the table's choice, else `no`.

For `no model fits`, write `no model fits` in the Model column, leave Effort and How to set empty, and put the limits in Reason. Return no model for that request.

## Result block

In both modes, end with this block. Fill Next step in every row with the one action from "When a result falls short" in the table file that fits this row (usually: raise the effort one level, or move one model up).

```text
## mstack-best-model-for result

| Request | Vendor | Model | Effort | How to set | Reason | Next step | Capped | Table date |
|---|---|---|---|---|---|---|---|---|
| <tier or task, as asked> | claude | <model> | <effort> | <the setting from "How to set it"> | <one line> | <one action> | yes/no | <Last verified date> |
```

How to set gives the exact setting for that vendor: for a Claude subagent the `model` and `effort` parameters, for Codex the `-m` and `-c model_reasoning_effort=` flags. In user mode, add one line after the block on what the Capped and Next step columns mean when either is not obvious.

Every answer shows the table date. When the date is more than three months old, say in one line that model names may have changed and the user should check the sources listed in the table file.
