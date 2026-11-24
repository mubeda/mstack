---
type: llm
focus: trace
weight: 1
---

One message of the run to the user (the final reply or an earlier one) says that mstack-best-model-for is not installed and that the run works without subagents, and gives every install command for it, in this order: `claude plugin marketplace add mubeda/mstack` and then `claude plugin install mstack-best-model-for@mstack` for Claude Code; `codex plugin marketplace add mubeda/mstack` and then `codex plugin add mstack-best-model-for@mstack` for Codex; `agy plugin install https://github.com/mubeda/mstack/tree/main/plugins/mstack-best-model-for` for Antigravity; and the skills CLI command `npx skills add mubeda/mstack --skill mstack-best-model-for` with `claude-code`, `codex` and `antigravity` as its agents. It names mstack-setup. A reply that leaves out one host's command, or a marketplace add, does not pass.
