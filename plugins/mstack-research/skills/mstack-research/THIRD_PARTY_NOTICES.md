# Third-party notices

This skill adapts methods from the open-source projects below. The rules were rewritten and modified; they are not copies of the original files. Each project's license file was read on 2026-11-15, together with the parts of its files that the table names. Nothing comes from Claude's own deep-research skill, which this skill only loads, or from a project without a license.

| Component | Source | License | Used in |
|---|---|---|---|
| `deep-research` skill | https://github.com/XiaomiMiMo/MiMo-Code | MIT | `SKILL.md` (depths with fixed limits, one brief form for every reader, one writer for the answer, the gap check before a single follow-up round, the critic's read in deep mode), `references/reader-brief.md` (the fixed template and the return form) |
| `research` skill | https://github.com/mattpocock/skills | MIT | `SKILL.md` (a reader with a fresh context, primary sources only, each claim traced to the source that owns it, a file in the repository's own notes folder on request) |
| `deep-research` skill | https://github.com/daymade/claude-code-skills | MIT | `SKILL.md` (pages that repeat one origin count once, a claim the answer depends on is checked at its original, what was not found is listed) |
| `deep-research` skill | https://github.com/samber/cc-skills | MIT | `SKILL.md` (the three confidence levels, two independent sources for a claim the answer depends on, conflicts shown and never resolved silently, the date a page was opened) |
| `open_deep_research` prompts | https://github.com/langchain-ai/open_deep_research | MIT | `SKILL.md` and `references/reader-brief.md` (one reader by default, a limit on tool calls, broad queries before narrow ones, the stop rule, a brief that stands alone) |
| "Deep researcher" agent template of the `claude-api` skill | https://github.com/anthropics/skills | Apache-2.0 | `SKILL.md` (replace a secondary page with the primary source behind it, name a claim with no stronger source, say which of two conflicting sources is more credible) |

The package procedure (`references/package-check.md`), the rules for text addressed to an AI agent, the rules for queries, and the behavior when search did not run are this project's own.

## MIT-licensed components

Copyright (c) 2026 MiMo Code, Xiaomi Corporation, and Copyright (c) 2025 opencode (MiMo-Code)

Copyright (c) 2026 Matt Pocock (mattpocock/skills)

Copyright (c) 2025 daymade (daymade/claude-code-skills)

Copyright (c) 2026 Samuel Berthe (samber/cc-skills)

Copyright (c) 2025 LangChain (langchain-ai/open_deep_research)

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

## Apache-2.0-licensed components

The method from the `claude-api` skill of https://github.com/anthropics/skills is adapted, with modifications, under the Apache License, Version 2.0 (the same license as this repository, see `LICENSE` in this skill's folder). That skill's `LICENSE.txt` carries the notice "Copyright 2026 Anthropic, PBC." and the skill ships no NOTICE file.
