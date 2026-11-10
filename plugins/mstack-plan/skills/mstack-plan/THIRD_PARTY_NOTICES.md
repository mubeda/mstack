# Third-party notices

This skill adapts methods from the open-source projects below. The rules were rewritten and modified; they are not copies of the original files.

| Component | Source | License | Used in |
|---|---|---|---|
| superpowers (`writing-plans`, `executing-plans`, `subagent-driven-development`, `verification-before-completion`, `receiving-code-review`) | https://github.com/obra/superpowers | MIT | `SKILL.md` (task size, proportion, self-check), `references/plan-format.md` (global constraints, review focus, interfaces, expected lines, the shared progress log and resume rules), `references/execute-plan-template.md` (the inline-or-subagent choice, the stop conditions, rulings), `references/receiving-review.md` |
| pstack (`poteto-mode` playbooks `multi-phase-plan`, `orchestrate`, `feature`; principles on verifiable units and context size; its review-gate rules) | https://github.com/backnotprop/pstack, a mirror of `cursor/plugins` pstack | MIT | `SKILL.md` (no plan for a trivial change, plans checked by a script, evidence for every unit), `scripts/check-plan.mjs`, `references/receiving-review.md` (bots and gates) |
| `grilling`, `grill-me`, `to-tickets` | https://github.com/mattpocock/skills | MIT | `SKILL.md` (question rounds, the outline check, vertical slices, expand-migrate-contract) |
| spec-kit (`tasks` template) | https://github.com/github/spec-kit | MIT | `SKILL.md` (phase order: foundation, then one phase per user story, then polish), `references/plan-format.md` (checkpoints per phase) |

The wave model for parallel rounds (Kiro) is used as a published idea only; no text from it is copied. The skill-vetting rules moved to `mstack-find-skills`, which carries their credit.

## MIT-licensed components

Copyright (c) 2025 Jesse Vincent (superpowers)

Copyright (c) 2026 Lauren Tan (pstack)

Copyright (c) 2026 Matt Pocock (mattpocock/skills)

Copyright GitHub, Inc. (spec-kit)

Each of the components above is licensed under the MIT License:

```
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
