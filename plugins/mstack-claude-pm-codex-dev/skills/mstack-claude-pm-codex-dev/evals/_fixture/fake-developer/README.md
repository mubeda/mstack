# fake-developer

A stand-in for the OpenAI Codex plugin, used only by the test cases of `mstack-claude-pm-codex-dev`. A case session
loads it with `--plugin-dir`; because it is named `codex`, its agent is offered as `codex:codex-rescue`. The agent
forwards each request to `scripts/fake-dev.mjs`, which writes files fixed in advance, logs every request, and records
jobs that `scripts/codex-companion.mjs` (a stub of the real plugin's script) serves to `codex-dev.mjs`.

It reads three environment variables, which the case runner sets:

- `CLAUDE_PLUGIN_DATA`: the folder for `requests.jsonl` and `state/jobs.json`.
- `FAKE_DEV_SCRIPT`: the JSON file of rounds the stand-in plays, one per request.
- `CODEX_COMPANION_SCRIPT`: the path of the stub, so `codex-dev.mjs locate` finds it instead of the real plugin.
