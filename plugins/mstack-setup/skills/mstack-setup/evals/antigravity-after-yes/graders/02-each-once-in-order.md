---
type: llm
focus: trace
weight: 1
---

After the user's reply, the calls in calls.log that change the machine are exactly these six, in this order, each once: the `npm` install of `@colbymchenry/codegraph` and of no other package; `codegraph install --yes --target=antigravity`; `agy plugin install https://github.com/DietrichGebert/ponytail`; `agy plugin install https://github.com/mubeda/mstack/tree/main/plugins/mstack-find-skills`; the same for `mstack-research`; the same for `mstack-plan`. Any other `npm`, `npx`, `agy plugin` or `codegraph install` call fails this grader (a `codegraph install --print-config` call, a version call and the status script are allowed), and so does `agy plugin import` or `agy plugin link`.
