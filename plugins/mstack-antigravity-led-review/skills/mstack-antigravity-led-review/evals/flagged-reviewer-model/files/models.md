## mstack-best-model-for result

| Request | Vendor | Model | Effort | How to set | Reason | Next step | Capped | Table date | Expensive |
|---|---|---|---|---|---|---|---|---|---|
| code review | claude | sonnet | medium | --model claude-sonnet-5-5 --effort medium | repeated review task | raise effort to high | no | 2026-11-23 | no |
| code review | codex | gpt-6.2-astra | high | -m gpt-6.2-astra -c model_reasoning_effort=high | deep code review (flagged expensive; next non-flagged model down: gpt-6.2-sol) | raise effort to xhigh | no | 2026-11-23 | yes |
| code review (Limits: max effort: medium) | claude | sonnet | low | --model claude-sonnet-5-5 --effort low | lower effort for cheap-tier lane review | raise effort to medium | yes | 2026-11-23 | no |
| code review (Limits: max effort: medium) | codex | gpt-6.2-astra | medium | -m gpt-6.2-astra -c model_reasoning_effort=medium | lower effort for cheap-tier lane review (flagged expensive; next non-flagged model down: gpt-6.2-sol) | raise effort to high | yes | 2026-11-23 | yes |
| code review (Limits: never: gpt-6.2-astra) | codex | gpt-6.2-sol | high | -m gpt-6.2-sol -c model_reasoning_effort=high | next non-flagged model down | raise effort to xhigh | yes | 2026-11-23 | no |
| code review (Limits: never: gpt-6.2-astra; max effort: medium) | codex | gpt-6.2-sol | medium | -m gpt-6.2-sol -c model_reasoning_effort=medium | next non-flagged model down for cheap-tier lane review | raise effort to high | yes | 2026-11-23 | no |
