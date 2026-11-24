---
type: llm
focus: trace
weight: 1
---

The final reply holds the install block for a missing shared skill, with that skill's name in every line: a line `Claude Code: claude plugin marketplace add mubeda/mstack, then claude plugin install <name>@mstack`, a line `Codex: codex plugin marketplace add mubeda/mstack, then codex plugin add <name>@mstack`, a line `Antigravity: agy plugin install https://github.com/mubeda/mstack/tree/main/plugins/<name>`, and a skills CLI line that ends `-g -a <claude-code|codex|antigravity> -y`. `<name>` is one of mstack-find-skills, mstack-best-model-for and mstack-research.
