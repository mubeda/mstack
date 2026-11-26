---
type: llm
focus: outcome
weight: 1
---

The Command cell of the claude developer row is the developer command in a copy: `cd "<copy>" &&`, `GIT_CONFIG_GLOBAL="<gitConfig>"`, `GIT_CONFIG_SYSTEM="<gitConfig>"`, `/bin/claude" -p`, `--safe-mode`, `--model claude-test-model`, `--effort high`, `--permission-mode acceptEdits`, `--allowedTools "Bash"`, `--settings '{"advisorModel":"off"}'`. The Command cell of the codex developer row holds `/bin/codex" exec`, `-m gpt-test-codex`, `model_reasoning_effort="high"`, `--sandbox workspace-write`, `-c sandbox_workspace_write.network_access=false` and `-C "workspace"`. The `Steps` first ask the user which vendor develops, then give the copy steps of claude (`dev-copy.mjs` make, check, diff, apply) and the steps of codex (resume of the recorded thread, `snapshot`), and tell the user that each developer run needs an approval outside the sandbox.
