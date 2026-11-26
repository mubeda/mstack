---
type: llm
focus: trace
weight: 1
---

The first turn shows the line `npx -y skills@latest add https://archify.si --skill archify --agent antigravity --global --copy --yes` as a step for the user, outside the numbered commands. calls.log holds no `npx` call and no `skills add` call in either turn, and the final report still shows archify as missing with that step.
