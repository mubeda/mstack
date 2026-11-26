# Model table

Last verified: 2026-11-23

Starting points, not measurements. Model names age fast: every answer shows the date above, and when a vendor rejects a model, take the next one down in the capability order.

## Capability order

Used when a limit removes the table's choice (see SKILL.md, "Limits").

- Claude, lowest to highest: `haiku`, `sonnet`, `opus`, `fable`.
- Codex, lowest to highest: `gpt-6-luna`, `gpt-6.1-terra`, `gpt-6.2-sol`, `gpt-6.2-astra`. The previous models `gpt-6-sol`, `gpt-6.1-sol` and `gpt-6-astra` still run but are not part of this order: answer with one only when the user names it, as asked and with the row's effort, and give the 6.2 model of the same name as the next step when it is rejected or falls short. That is the one exception to the rule above and to "When a result falls short", which both walk this order.
- Antigravity, lowest to highest: `gemini-3.8-flash`, `gemini-4-hydrogen`, `gemini-4-neon`, `gemini-4-carbon`. Each entry is a model family: a model id is the family plus an effort suffix, such as `gemini-4-neon-high`. `gemini-4-argon` is listed and flagged but is not a step: answer with it only when the user names it. This order is the project's own, by price and by Google's descriptions of the models, dated 2026-11-21: Google publishes no ranking.

## Tiers

The tier names come from plans and the review workflows. Keep them exactly as written.

| Tier | Claude | Effort | Claude headless id | Codex | Effort | Antigravity | Effort | Reason |
|---|---|---|---|---|---|---|---|---|
| cheap | `haiku` (`sonnet` when the edit needs judgment) | low to medium | `claude-haiku-5-5` | `gpt-6-luna` | low to medium | `gemini-3.8-flash-medium` | medium | docs, mechanical edits, log reading and searches; a mistake here shows quickly and costs little |
| standard | `sonnet` | medium | `claude-sonnet-5-5` | `gpt-6.2-sol` | medium | `gemini-4-hydrogen-medium` | medium | contained, well-specified code |
| most capable | `opus` | medium | `claude-opus-5-5` | `gpt-6.2-astra` | medium | `gemini-4-neon-high` | high | root causes, concurrency, design across packages |

When a range is given, answer with its lower end and name the upper end in Next step. `Claude headless id` is the full model id of the Claude cell's first model, for a headless run (see "How to set it").

## Tasks

| Task | Claude | Effort | Codex | Effort | Antigravity | Reason |
|---|---|---|---|---|---|---|
| general starting point, or unsure | `opus` | medium | `gpt-6.2-sol` | medium | `gemini-4-neon-high` | Claude and Codex: each vendor's recommended default for coding and knowledge work; Antigravity: the project's own choice |
| well-scoped coding (bug fix, feature from a spec), repeated review or drafting | `sonnet` | medium, then high | `gpt-6.2-sol` | medium | `gemini-4-hydrogen-medium` | a tight scope leaves little that a larger model would add |
| quick, fully specified edits | `haiku` or `sonnet` | low to medium | `gpt-6-luna` or `gpt-6.1-terra` | low | `gemini-3.8-flash-medium` | the smallest model that meets the bar |
| a helper subagent: file search, log reading, summaries | `haiku` or `sonnet` | medium | `gpt-6-luna` | low | `gemini-3.8-flash-medium` | side work for a larger session; its output is easy to check |
| debugging | `opus` | medium, then high | `gpt-6.2-sol` | high | `gemini-4-neon-high` | hard reasoning over many files; Codex moves to `gpt-6.2-astra` when stuck |
| code review | `sonnet` | medium | `gpt-6.2-sol` | xhigh | `gemini-4-neon-high` | Claude: a repeated agent task; Codex: a choice of this table for the depth a review should have; reasoning is billed as output, so take a lower level for a small diff |
| classification, routing, extraction | `haiku` | medium | `gpt-6-luna` | low | `gemini-3.8-flash-medium` | many small calls, where price and speed matter most |
| major refactors, migrations, architecture, leading many subagents, deep research, long unattended runs | `fable` | medium, then high | `gpt-6.2-astra` | low to medium, then higher | `gemini-4-neon-high` | the hardest end-to-end work |
| computer use and vision-heavy work | `opus` | medium | `gpt-6.1-terra` | low | `gemini-4-neon-high` | many steps that read screenshots and images |

The Antigravity cell follows one rule. The general starting point and code review take `gemini-4-neon-high`. Every other row follows the first model of its Claude cell: `haiku` gives the cheap tier's model, `sonnet` the standard tier's, and `opus` or `fable` `gemini-4-neon-high`. The effort of an Antigravity row is the suffix of its id.

## How to set it

Claude Code:

- Subagent tool: set its `model` parameter to an alias (`haiku`, `sonnet`, `opus`, `fable`) and its `effort` parameter to the level. A subagent started without them runs on the session's model.
- Command line: `claude --model <alias> --effort <level>`.
- Headless run (`claude -p`, which prints its answer and exits): `--model <full id> --effort <level>`, never the alias. Claude Code loads the user's own setup in a `claude -p` run (CLAUDE.md, skills, hooks, MCP servers) unless `--safe-mode` is used. `--safe-mode` does not switch off the advisor of the user's settings, which can start a second model, so a run that must not see the user's setup adds both `--safe-mode` and `--settings '{"advisorModel":"off"}'`. The caller supplies the rest of the command. A `claude -p` run takes the full id: an alias can run another model there (seen 2026-11-23 for `haiku`). The subagent tool of Claude Code keeps the alias. The full ids are in the `Claude headless id` column of the tiers table: `claude-haiku-5-5` for `haiku`, `claude-sonnet-5-5` for `sonnet`, `claude-opus-5-5` for `opus`. No full id was confirmed for `fable`: name its alias only.

Codex:

- Command line: `codex exec -m <model> -c model_reasoning_effort=<level> "<prompt>"`.

Antigravity:

- Cell text for the result block: `the full model id, chosen when the Antigravity session is started or in its model setting (agy models lists the ids); subagent: invoke_subagent on the tier <tier>`. Copy it exactly and put the one tier of the row in place of `<tier>`: `flash` for the cheap and standard tiers, `pro` for most capable. Never write both tiers, and never write a `|` inside a cell: it would split the cell in two.
- Choose the full model id when you start the Antigravity session or in its model setting (`agy models` lists the ids); the effort is the id's suffix, never a second setting.
- Subagent tool: `invoke_subagent` with model `flash` for the cheap and standard tiers and `pro` for most capable; a subagent takes a tier only, never an id or an effort. A task row takes the subagent tier of the tier that has its model.

## Efforts each model accepts

- Claude (`--effort`): `low`, `medium`, `high`, `xhigh`, `max`.
- Codex: `gpt-6.2-sol` and `gpt-6.2-astra` accept `low`, `medium`, `high`, `xhigh` and `max`, and not `none`: use `low` as the lowest. `max` is for a single very hard task after a lower level fell short. `ultra` is a level of the Codex client and not of the model: it hands parts of the work to subagents, so it fits only work that can be divided, and `gpt-6-luna` does not offer it. Fast and Ultrafast are speed tiers, not efforts.
- Antigravity `gemini-3.8-flash`: `low`, `medium`, `high`
- Antigravity `gemini-4-hydrogen`: `low`, `medium`, `high`, `xhigh`
- Antigravity `gemini-4-neon`: `low`, `medium`, `high`, `xhigh`
- Antigravity `gemini-4-carbon`: `low`, `medium`, `high`
- Antigravity `gemini-4-argon`: `low`, `medium`, `high`

The Antigravity lines hold exactly what `agy models` listed.

## Expensive models

- Claude: `fable`.
- Codex: `gpt-6.2-astra`.
- Antigravity: `gemini-4-carbon` and `gemini-4-argon`, at every effort.

These are the top-priced models of each vendor, prices per 1M tokens read 2026-11-21; the two Gemini flags hold for the prices from 2026-12-01, and until 2026-11-30 Neon costs more. Every other model is not expensive.

## When a result falls short

Take these steps in order, one per retry:

1. Give the model a way to check its own work: a test, a build or a script.
2. Raise the effort one level on the same model.
3. Move one model up the capability order, starting at a lower effort than the last run used (Antigravity: see below).

For Antigravity, step 2 is the same family at the next listed effort above the row's own, the adjacent one in `low`, `medium`, `high`, `xhigh`, which gives a new id. Step 3 is the next family up in the order Flash, Hydrogen, Neon, Carbon, at the row's own effort, or at the nearest lower effort that family lists. `gemini-4-argon` is never a step. A row's Next step names step 2 and then step 3. Worked examples:

- `gemini-4-hydrogen-medium`: first `gemini-4-hydrogen-high`, then `gemini-4-neon-medium`.
- `gemini-4-neon-medium`: first `gemini-4-neon-high`, then `gemini-4-carbon-medium`.
- `gemini-4-neon-xhigh`: no first choice (xhigh is the highest effort Neon lists), then `gemini-4-carbon-high` (Carbon lists no `xhigh`, so its nearest lower effort).
- `gemini-4-carbon-medium`: first `gemini-4-carbon-high`, no second choice (Carbon is the last family).
- `gemini-4-argon-high`, named by the user: Argon is no step in the order and `high` is its highest listed effort, so neither choice exists. Next step says so. How to set gives the session setting and `subagent: no tier holds this model`.

## Sources

- Anthropic, "Which Claude model should you build with?": https://claude.dev/blog/which-claude-model-should-you-build-with/
- Claude Code model configuration: https://code.claude.com/docs/en/model-config
- OpenAI reasoning guide: https://developers.openai.com/api/docs/guides/reasoning
- Codex configuration reference: https://developers.openai.com/codex/config-reference
- OpenAI model selection: https://learn.chatgpt.com/docs/model-selection.md
- OpenAI models, with `gpt-6.2-sol` and `gpt-6.2-astra` (read 2026-11-17; the Claude rows were last checked 2026-11-09): https://developers.openai.com/api/docs/models
- Codex models: https://developers.openai.com/codex/models
- `agy models`, agy 1.5.15, 2026-11-23
- The vendors' pricing pages, opened 2026-11-21
