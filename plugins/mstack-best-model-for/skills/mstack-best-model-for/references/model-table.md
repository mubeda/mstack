# Model table

Last verified: 2026-11-17

Starting points, not measurements. Model names age fast: every answer shows the date above, and when a vendor rejects a model, take the next one down in the capability order.

## Capability order

Used when a limit removes the table's choice (see SKILL.md, "Limits").

- Claude, lowest to highest: `haiku`, `sonnet`, `opus`, `fable`.
- Codex, lowest to highest: `gpt-6-luna`, `gpt-6.1-terra`, `gpt-6.2-sol`, `gpt-6.2-astra`. The previous models `gpt-6-sol`, `gpt-6.1-sol` and `gpt-6-astra` still run but are not part of this order: answer with one only when the user names it, as asked and with the row's effort, and give the 6.2 model of the same name as the next step when it is rejected or falls short. That is the one exception to the rule above and to "When a result falls short", which both walk this order.

## Tiers

The tier names come from plans and the review workflows. Keep them exactly as written.

| Tier | Claude | Effort | Codex | Effort | Reason |
|---|---|---|---|---|---|
| cheap | `haiku` (`sonnet` when the edit needs judgment) | low to medium | `gpt-6-luna` | low to medium | docs, mechanical edits, log reading and searches; a mistake here shows quickly and costs little |
| standard | `sonnet` | medium | `gpt-6.2-sol` | medium | contained, well-specified code |
| most capable | `opus` | medium | `gpt-6.2-astra` | medium | root causes, concurrency, design across packages |

When a range is given, answer with its lower end and name the upper end in Next step.

## Tasks

| Task | Claude | Effort | Codex | Effort | Reason |
|---|---|---|---|---|---|
| general starting point, or unsure | `opus` | medium | `gpt-6.2-sol` | medium | each vendor's recommended default for coding and knowledge work |
| well-scoped coding (bug fix, feature from a spec), repeated review or drafting | `sonnet` | medium, then high | `gpt-6.2-sol` | medium | a tight scope leaves little that a larger model would add |
| quick, fully specified edits | `haiku` or `sonnet` | low to medium | `gpt-6-luna` or `gpt-6.1-terra` | low | the smallest model that meets the bar |
| a helper subagent: file search, log reading, summaries | `haiku` or `sonnet` | medium | `gpt-6-luna` | low | side work for a larger session; its output is easy to check |
| debugging | `opus` | medium, then high | `gpt-6.2-sol` | high | hard reasoning over many files; Codex moves to `gpt-6.2-astra` when stuck |
| code review | `sonnet` | medium | `gpt-6.2-sol` | xhigh | Claude: a repeated agent task; Codex: a choice of this table for the depth a review should have; reasoning is billed as output, so take a lower level for a small diff |
| classification, routing, extraction | `haiku` | medium | `gpt-6-luna` | low | many small calls, where price and speed matter most |
| major refactors, migrations, architecture, leading many subagents, deep research, long unattended runs | `fable` | medium, then high | `gpt-6.2-astra` | low to medium, then higher | the hardest end-to-end work |
| computer use and vision-heavy work | `opus` | medium | `gpt-6.1-terra` | low | many steps that read screenshots and images |

## How to set it

Claude Code:

- Subagent tool: set its `model` parameter to an alias (`haiku`, `sonnet`, `opus`, `fable`) and its `effort` parameter to the level. A subagent started without them runs on the session's model.
- Command line: `claude --model <alias> --effort <level>`; add `-p` for a run that prints its answer and exits.

Codex:

- Command line: `codex exec -m <model> -c model_reasoning_effort=<level> "<prompt>"`.

## Efforts each model accepts

- Claude (`--effort`): `low`, `medium`, `high`, `xhigh`, `max`.
- Codex: `gpt-6.2-sol` and `gpt-6.2-astra` accept `low`, `medium`, `high`, `xhigh` and `max`, and not `none`: use `low` as the lowest. `max` is for a single very hard task after a lower level fell short. `ultra` is a level of the Codex client and not of the model: it hands parts of the work to subagents, so it fits only work that can be divided, and `gpt-6-luna` does not offer it. Fast and Ultrafast are speed tiers, not efforts.

## When a result falls short

Take these steps in order, one per retry:

1. Give the model a way to check its own work: a test, a build or a script.
2. Raise the effort one level on the same model.
3. Move one model up the capability order, starting at a lower effort than the last run used.

## Sources

- Anthropic, "Which Claude model should you build with?": https://claude.dev/blog/which-claude-model-should-you-build-with/
- Claude Code model configuration: https://code.claude.com/docs/en/model-config
- OpenAI reasoning guide: https://developers.openai.com/api/docs/guides/reasoning
- Codex configuration reference: https://developers.openai.com/codex/config-reference
- OpenAI model selection: https://learn.chatgpt.com/docs/model-selection.md
- OpenAI models, with `gpt-6.2-sol` and `gpt-6.2-astra` (read 2026-11-17; the Claude rows were last checked 2026-11-09): https://developers.openai.com/api/docs/models
- Codex models: https://developers.openai.com/codex/models
