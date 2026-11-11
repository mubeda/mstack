# Third-party notices

This skill adapts methods from the open-source projects below. The rules were rewritten in this repository's own words and modified; they are not copies of the original files.

| Component | Source | License | Used in |
|---|---|---|---|
| superpowers `brainstorming` 7.0.2 | https://github.com/obra/superpowers | MIT | `SKILL.md` (the start rule, reading before asking, the first message, open questions until the reason is known, playback, approaches before the write-up, throwaway prototypes, the approval gate), `references/brief-template.md` (goals, non-goals and anti-goals) |
| pstack (`architect` skill and its references, `docs/guide/04-design.md`) | https://github.com/cursor/plugins/tree/main/pstack | MIT | `SKILL.md` (usage first for things that are called, whole-shape approaches), `references/design-red-flags.md`, `references/brief-template.md` (tradeoffs accepted) |
| `grilling`, `grill-me` | https://github.com/mattpocock/skills | MIT | `SKILL.md` (the design tree, the frontier and its rounds, facts looked up instead of asked, the end of the interview) |
| `product-brainstorming` (product-management plugin) | https://github.com/anthropics/knowledge-work-plugins | Apache-2.0 | `references/ideas.md` (ways of generating ideas, assumptions to test before choosing) |
| `bmad-brainstorming` | https://github.com/bmad-code-org/bmad-method | MIT | `references/ideas.md` (generating apart from judging, narrowing to a short list, the agent generating by default) |

## MIT-licensed components

Copyright (c) 2025 Jesse Vincent (superpowers)

Copyright (c) 2026 Lauren Tan (pstack)

Copyright (c) 2026 Matt Pocock (mattpocock/skills)

Copyright (c) 2025 BMad Code, LLC (bmad-method)

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

The bmad-method license also carries a trademark notice: its product names are trademarks of BMad Code, LLC, and their use in that software grants no right to use them for any other purpose. This skill uses none of those names for its files, modes or steps.

## Apache-2.0-licensed component

The `product-brainstorming` method from https://github.com/anthropics/knowledge-work-plugins is adapted, with modifications, under the Apache License, Version 2.0 (the same license as this repository; its full text is `LICENSE` in this skill's folder). The adapted rules were changed and rewritten. That project ships no NOTICE file and its LICENSE fills in no copyright holder, so it is credited here by repository and no copyright line is given.
