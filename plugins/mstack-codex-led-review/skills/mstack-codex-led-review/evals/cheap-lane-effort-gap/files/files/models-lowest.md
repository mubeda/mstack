## mstack-best-model-for result

| Request | Vendor | Model | Effort | How to set | Reason | Next step | Capped | Table date | Expensive |
|---|---|---|---|---|---|---|---|---|---|
| code review | claude | sonnet | low | --model claude-sonnet-5-5 --effort low | lowest supported effort | raise effort to medium | no | 2026-11-23 | no |
| code review | codex | gpt-6.2-sol | low | -m gpt-6.2-sol -c model_reasoning_effort=low | lowest supported effort | raise effort to medium | no | 2026-11-23 | no |
| cheap | claude | haiku | low | model haiku, effort low (headless: claude-haiku-5-5) | mechanical edits | raise effort to medium | no | 2026-11-23 | no |
| standard | claude | sonnet | medium | model sonnet, effort medium (headless: claude-sonnet-5-5) | contained code | raise effort to high | no | 2026-11-23 | no |
| most capable | claude | opus | medium | model opus, effort medium (headless: claude-opus-5-5) | root causes | raise effort to high | no | 2026-11-23 | no |
| cheap | codex | gpt-6-luna | low | -m gpt-6-luna -c model_reasoning_effort=low | mechanical edits | raise effort to medium | no | 2026-11-23 | no |
| standard | codex | gpt-6.2-sol | medium | -m gpt-6.2-sol -c model_reasoning_effort=medium | contained code | raise effort to high | no | 2026-11-23 | no |
| most capable | codex | gpt-6.2-astra | medium | -m gpt-6.2-astra -c model_reasoning_effort=medium | root causes | raise effort to high | no | 2026-11-23 | yes |
