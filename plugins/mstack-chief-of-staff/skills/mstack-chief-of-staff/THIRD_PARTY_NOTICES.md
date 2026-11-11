# Third-party notices

This skill adapts a method from the open-source project below. The rules were rewritten and modified; they are not copies of the original files.

| Component | Source | License | Used in |
|---|---|---|---|
| `chief-of-staff` | https://github.com/mattpocock/skills | MIT | `SKILL.md` (the goal owner's two tracks, subagents with fresh context briefed through pointers, a wiki shared with other agents where one exists, environment fixes and no one-off workarounds, procedures run through other skills), `references/wiki.md` (an index of every page, sources cited and never copied, ingest, query and lint, dated claims with a commit for code, superseded claims kept) |

The idea of an agent-kept wiki with ingest, query and lint operations is widely described; no text from any description of it is used. The rules that a goal or work item is done only with recorded evidence, and that a session starts by reading its state from files, follow published guidance from Anthropic and OpenAI on long-running agents, used as ideas only. The goal page, the fixed claim format and its superseded mark, `scripts/lint-wiki.mjs`, the order of environment fixes, the table of mstack routes and the missing-route rule are this project's own.

## MIT-licensed components

Copyright (c) 2026 Matt Pocock (mattpocock/skills)

The component above is licensed under the MIT License:

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
