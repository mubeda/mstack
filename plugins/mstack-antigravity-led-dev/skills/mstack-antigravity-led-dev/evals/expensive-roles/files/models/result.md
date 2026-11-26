## mstack-best-model-for result

| Request | Vendor | Model | Effort | How to set | Reason | Next step | Capped | Table date | Expensive |
|---|---|---|---|---|---|---|---|---|---|
| tier: standard (developer) | codex | gpt-6.2-astra | medium | -m gpt-6.2-astra -c model_reasoning_effort=medium | Standard Codex | raise the effort one level to high | no | 2026-11-23 | yes |
| tier: most capable (developer) | codex | gpt-6.2-astra | high | -m gpt-6.2-astra -c model_reasoning_effort=high | Most capable Codex | raise the effort one level to xhigh | no | 2026-11-23 | yes |
| tier: standard (developer) | claude | sonnet | medium | subagent: model sonnet, effort medium; headless: --model claude-sonnet-5-5 --effort medium | Standard Claude | raise the effort one level to high | no | 2026-11-23 | no |
| tier: most capable (developer) | claude | opus | high | subagent: model opus, effort high; headless: --model claude-opus-5-5 --effort high | Most capable Claude | move one model up to fable | no | 2026-11-23 | yes |
| task: code review | codex | gpt-6.2-sol | high | -m gpt-6.2-sol -c model_reasoning_effort=high | Code review default | raise the effort one level to xhigh | no | 2026-11-23 | no |
| task: code review | claude | opus | high | subagent: model opus, effort high; headless: --model claude-opus-5-5 --effort high | Code review default | move one model up to fable | no | 2026-11-23 | yes |
| tier: cheap (helper) | antigravity | gemini-3.8-flash-medium | medium | the full model id, chosen when the Antigravity session is started or in its model setting (agy models lists the ids); subagent: invoke_subagent on the tier flash | Cheap helper subagent | first gemini-3.8-flash-high, then gemini-4-hydrogen-medium | no | 2026-11-23 | no |

## Model table notes (from mstack-best-model-for model table)

- Capability order (lowest to highest): Claude `haiku` (`claude-haiku-5-5`), `sonnet` (`claude-sonnet-5-5`), `opus` (`claude-opus-5-5`), `fable`; Codex `gpt-6-luna`, `gpt-6.1-terra`, `gpt-6.2-sol`, `gpt-6.2-astra`.
- Efforts each model accepts: Claude `low, medium, high`; Codex `low, medium, high, xhigh`.
