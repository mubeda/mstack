## mstack-best-model-for result

| Request | Vendor | Model | Effort | How to set | Reason | Next step | Capped | Table date | Expensive |
|---|---|---|---|---|---|---|---|---|---|
| tier: standard (developer) | codex | gpt-6.2-sol | low | -m gpt-6.2-sol -c model_reasoning_effort=low | Standard Codex | raise the effort one level to high | no | 2026-11-23 | no |
| tier: most capable (developer) | codex | gpt-6.2-astra | high | -m gpt-6.2-astra -c model_reasoning_effort=high | Most capable Codex | give the model a way to check its own work (highest model and effort) | no | 2026-11-23 | yes |
| tier: standard (developer) | claude | sonnet | low | subagent: model sonnet, effort low; headless: --model claude-sonnet-5-5 --effort low | Standard Claude | raise the effort one level to high | no | 2026-11-23 | no |
| tier: most capable (developer) | claude | opus | high | subagent: model opus, effort high; headless: --model claude-opus-5-5 --effort high | Most capable Claude | move one model up to fable | no | 2026-11-23 | yes |
| task: code review | codex | gpt-6.2-sol | high | -m gpt-6.2-sol -c model_reasoning_effort=high | Code review default | move one model up to gpt-6.2-astra | no | 2026-11-23 | no |
| task: code review | claude | sonnet | high | subagent: model sonnet, effort high; headless: --model claude-sonnet-5-5 --effort high | Code review default | move one model up to opus | no | 2026-11-23 | no |
| tier: cheap (helper) | claude | haiku | low | subagent: model haiku, effort low; headless: --model claude-haiku-5-5 --effort low | Cheap helper subagent | raise the effort one level to high | no | 2026-11-23 | no |

## Model table notes (from mstack-best-model-for model table)

- Capability order (lowest to highest): Claude `haiku` (`claude-haiku-5-5`), `sonnet` (`claude-sonnet-5-5`), `opus` (`claude-opus-5-5`), `fable`; Codex `gpt-6-luna`, `gpt-6.1-terra`, `gpt-6.2-sol`, `gpt-6.2-astra`.
- Efforts each model accepts: Claude `low, high`; Codex `low, high`.
