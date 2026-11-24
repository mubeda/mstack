---
type: llm
focus: trace
weight: 1
---

calls.log holds no install or connect call: no `agy plugin install`, no `agy plugin import`, no `agy plugin link`, no `codegraph install` other than one with `--print-config`, no `npm` install, no `skills add`. Status and version calls are allowed. The trace holds no such command run without `./testenv` either, and no file-write tool call to a file under `home/.gemini/`. After the run, `home/.gemini/config/mcp_config.json` holds exactly what `place-files.sh` wrote.
