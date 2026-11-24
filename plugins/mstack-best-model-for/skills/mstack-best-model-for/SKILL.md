---
name: mstack-best-model-for
description: Use when the user asks which model or effort to use for a task, for Claude, Codex or Antigravity, such as "which model for this subagent", "what effort should the review run at", "is the cheapest model enough for this", "best Codex model for debugging", "which Gemini model for a review in Antigravity", or when another mstack skill needs a model and effort for a tier (cheap, standard, most capable) or a task before it starts a subagent, a lane or a reviewer. Works in Claude Code, Codex and Antigravity. Returns a model, an effort, how to set both, a reason and a next step, per vendor.
---

# mstack-best-model-for

Answers which model and effort fit a task, for Claude, Codex or Antigravity, one vendor or several at once, from one table: `references/model-table.md`. Every other mstack skill that starts a subagent, a lane or a reviewer takes its model choices from here, so a change to the table reaches all of them.

| Role | Claude Code | Codex | Antigravity |
|---|---|---|---|
| Question tool | AskUserQuestion | a numbered question in chat, then wait | ask_question |

## Two modes

- **User mode**: the user invoked the skill. If the task or the vendor is missing, ask for both in one question with your question tool and wait. Do nothing else until the answer arrives. Ask nothing when the message gives both, for example by naming the host the model runs in ("in Antigravity"). The vendor is one of the values under "Vendors".
- **Called mode**: another skill loaded this one and said which skill is calling. Ask nothing, ever. Answer every request in the message and give the result block as this skill's last output. The block ends this skill, not the calling skill's work: in the same message as the block, go on with the calling skill's next step (its next tool call or its next question). A called run never ends its turn on the block. A request with no vendor gets a row for Claude and one for Codex.

A called message gives, per request: a vendor (one of the values under "Vendors"), a tier (`cheap`, `standard`, `most capable`) or a task description, and optional limits `never: <models>` and `max effort: <level>`.

## Vendors

| Vendor in the request | Rows in the answer |
|---|---|
| `claude`, `codex` or `antigravity` | one row, for that vendor |
| `both`, or no vendor | two rows: `claude` and `codex`, never a third |
| `all` | three rows: `claude`, `codex` and `antigravity` |
| any other value | one row with that value as Vendor and `no model fits` (see "Limits") |

`both` keeps its two rows because callers written before Antigravity was added read exactly two.

## Pick the row

Read `references/model-table.md` before you answer. Then, for each request:

1. A model the user names keeps its identity: one row per named model, with the effort its id carries, and never another model in its place. When the name carries no effort, take the effort of the row that fits the task. Write in Reason which model the table would have chosen. Only the spelling follows the block's rules: the Claude Model cell shows the alias, and a headless full id goes in How to set. A limit wins over a name: a named model that `never` excludes gets `no model fits`, with the named model and the limit in Reason, and no other model in its place.
2. A tier named by the caller picks that tier's row. Tier names are exact: never map `standard` to a task row.
3. Otherwise take the task row that fits the description best.
4. Otherwise take "general starting point, or unsure", and write in Reason that it is the default because no row fits.

An Antigravity cell holds a model id that ends in its effort (`<family>-<effort>`): write the whole id in Model and its suffix in Effort. Model and Effort always agree: when a limit changes the effort, rewrite the id's suffix too.

Where a cell gives two models, take the first and name the second in Reason. Where it gives an effort range, take the lower end and name the higher one in Next step.

Never answer with the model you are running on because it is the session's model. The table decides.

## Limits

Apply the caller's limits to the row's choice, in this order:

1. `never`: an entry that is a family name (for example the Antigravity family without its effort suffix) excludes every id of that family, and an entry that is a full id excludes only that id. If the chosen model is excluded, walk the vendor's capability order in `references/model-table.md` downward from it and take the first model not excluded. If none is below it, walk upward. If every model is excluded, the answer is `no model fits`.
2. `max effort`: if the effort is above the limit, lower it to the limit. Levels rise as `low`, `medium`, `high`, `xhigh`, `max`. For Antigravity the effort is the suffix of the model id, so lowering it replaces the suffix inside the same family and gives another id. Check every Antigravity candidate against the family's line under "Efforts each model accepts", also when its effort equals the limit: take the effort only when the line lists it, otherwise the family's nearest lower listed effort. When the family lists none at or below the limit, walk the capability order down to the first family that does, and take its highest listed effort at or below the limit. When no family does, the answer is `no model fits`. Never return an id that those lines do not hold.
3. Check the final candidate against both limits, also after an effort change or a family change: an id that `never` excludes is never returned, and a candidate that fails either limit goes back through steps 1 and 2 until one passes both or none is left.
4. Mark Capped `yes` when any step changed the table's choice, else `no`.

For `no model fits`, write `no model fits` in the Model column, leave Effort and How to set empty, put the limits in Reason, and name in Next step the limit that prevented a fit: "relax a `never` limit" when `never` excluded every candidate, "raise `max effort`" when the cap or the effort lines left none. Return no model for that request.

A vendor the table does not hold also gets `no model fits`: leave Effort and How to set empty, write "vendor <name> is not in the table" in Reason and "ask for claude, codex, antigravity, both or all" in Next step. Never answer it with another vendor's model, in the block or beside it.

## Result block

In both modes, this block is the last thing this skill writes (in called mode the calling skill's work goes on after it, see Two modes). Fill Next step in every row with the one action from "When a result falls short" in the table file that fits this row (usually: raise the effort one level, or move one model up). An Antigravity row is the exception: its Next step names two choices in order. The first is the same family at the next listed effort above the row's own, the adjacent one in `low`, `medium`, `high`, `xhigh` (`medium` gives `high`, never `xhigh`). The second is the next family up in the capability order, at the row's own effort, or at the nearest lower effort that family lists. When the row already has the family's highest listed effort, leave out the first choice. When the family is the last in the capability order, leave out the second. Write in Next step which choice is left out and why, and for a named model that is no step in the order (a family the table lists but does not step through), name only the first choice. Never leave Next step empty.

```text
## mstack-best-model-for result

| Request | Vendor | Model | Effort | How to set | Reason | Next step | Capped | Table date | Expensive |
|---|---|---|---|---|---|---|---|---|---|
| <tier or task, as asked> | claude | <model> | <effort> | <the setting from "How to set it"> | <one line> | <one action> | yes/no | <Last verified date> | yes/no |
```

Write one block for all requests: one header, then every row of every request, never one block per request. Keep the rows in the order of the requests, and the rows of one request together, in the order the vendors were named. Write the header line exactly as shown. Callers read the first nine columns by their place, so `Expensive` stays the tenth and last, and no column changes its name or order.

Expensive is `yes` when the row's model, or for a Gemini id its family without the effort suffix, is listed under "Expensive models" in the table file. It is `no` for every other model and for `no model fits`.

How to set gives the exact setting for that vendor:

- Claude: for a subagent the `model` and `effort` parameters with the alias, and for a headless run the full model id from the table's `Claude headless id` column, never the alias. Model always holds the alias alone; name the full id in How to set, in every Claude row that has one.
- Codex: the `-m` and `-c model_reasoning_effort=` flags.
- Antigravity: the cell text given under "Antigravity" in "How to set it" in the table file, copied exactly, with the one tier that section gives for the row. For a named model that no tier holds, give the first part of that text and write `subagent: no tier holds this model` instead of the second.

In user mode, add one line after the block on what the Capped and Next step columns mean when either is not obvious.

Every answer shows the table date. When the date is more than three months old, say in one line that model names may have changed and the user should check the sources listed in the table file.
