# Third-party notices

This skill adapts methods from the open-source projects below. The rules were rewritten and modified; they are not copies of the original files.

| Component | Source | License | Used in |
|---|---|---|---|
| `grilling`, `grill-me`, `to-spec`, `to-tickets` | https://github.com/mattpocock/skills | MIT | `SKILL.md` (the interview, the no-spec-needed exit, the hand-off), `references/spec-template.md` (the interview record) |
| superpowers (`brainstorming`, `writing-plans`) | https://github.com/obra/superpowers | MIT | `SKILL.md` (approaches, approval rules, process calls), `references/quality-check.md` (the independent read) |
| pstack (`poteto-mode` playbooks, `architect`, `technical-writing`) | https://github.com/backnotprop/pstack, a mirror of `cursor/plugins` pstack | MIT | `SKILL.md` (prototypes for look-and-feel questions, no building before approval), `references/requirements.md` |
| spec-kit | https://github.com/github/spec-kit | MIT | `references/coverage.md`, `references/quality-check.md`, the `[NEEDS CLARIFICATION]` marker |
| OpenSpec | https://github.com/Fission-AI/OpenSpec | MIT | `references/requirements.md` (SHALL and a scenario per requirement), `references/spec-template.md` (decisions, risks, open questions, delta sections) |
| `write-spec` (product-management plugin) | https://github.com/anthropics/knowledge-work-plugins | Apache-2.0 | `references/spec-template.md` (problem, goals, non-goals, priorities, success metrics), `references/requirements.md` (vague words) |

The EARS notation (Mavin et al., 2009) and the phase and quick-mode ideas from Kiro are used as published ideas only; no text from them is copied.

## MIT-licensed components

Copyright (c) 2026 Matt Pocock (mattpocock/skills)

Copyright (c) 2025 Jesse Vincent (superpowers)

Copyright (c) 2026 Lauren Tan (pstack)

Copyright GitHub, Inc. (spec-kit)

Copyright (c) 2024 OpenSpec Contributors (OpenSpec)

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

## Apache-2.0-licensed component

The `write-spec` method from https://github.com/anthropics/knowledge-work-plugins is adapted, with modifications, under the Apache License, Version 2.0 (the same license as this repository, see `LICENSE` in this skill's folder). That project ships no NOTICE file and its LICENSE names no copyright holder, so it is credited here by repository.
