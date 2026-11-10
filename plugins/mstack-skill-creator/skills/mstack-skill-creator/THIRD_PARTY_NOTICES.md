# Third-party notices

This skill copies three files unchanged from one open-source project and adapts methods from others. Adapted rules were rewritten in this project's own words; they are not copies of the original files.

| Component | Source | License | Used in |
|---|---|---|---|
| Anthropic `skill-creator`, files `scripts/aggregate_benchmark.py`, `eval-viewer/generate_review.py`, `eval-viewer/viewer.html` and `LICENSE.txt`, copied unchanged at commit `b9e19e6f44773509fbdd7001d77ff41a49a486c1` | https://github.com/anthropics/skills/tree/b9e19e6f44773509fbdd7001d77ff41a49a486c1/skills/skill-creator | Apache-2.0 | `scripts/vendor/anthropic-skill-creator/` (the benchmark and the review page) |
| Anthropic `skill-creator`, method | https://github.com/anthropics/skills | Apache-2.0 | `references/testing.md` (paired runs with and without the skill, the workspace layout, grading fields), `references/writing-rules.md` (progressive disclosure) |
| OpenAI Codex `skill-creator` | https://github.com/openai/skills/tree/main/skills/.system/skill-creator | Apache-2.0 | `references/writing-rules.md` (frontmatter limits, references one level deep), `references/host-codex.md` (`agents/openai.yaml`) |
| superpowers `writing-skills` | https://github.com/obra/superpowers | MIT | `references/testing.md` (a failing baseline before the skill is trusted), `references/writing-rules.md` (a description lists triggers and never summarizes the steps) |
| SkillForge | https://github.com/tripleyak/SkillForge | MIT | `references/workflow-steps.md` (check for an existing skill before creating one), idea only |

Cursor's built-in `create-skill` skill is named in `references/host-cursor.md` as that host's own creator. Nothing is copied from it, because it carries no license.

The step-to-skill table, the description rule shared by four hosts, `scripts/check-skill.mjs` and `scripts/scan-private.mjs` are this project's own.

## Apache-2.0 components

The Apache License 2.0 text is in `LICENSE` beside this file, and the copied files keep their own copy in `scripts/vendor/anthropic-skill-creator/LICENSE.txt`. The copied files were not modified.

## MIT-licensed components

Copyright (c) 2025 Jesse Vincent (superpowers)

Copyright (c) 2025 (SkillForge, tripleyak/SkillForge)

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
