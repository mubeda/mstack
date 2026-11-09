# Third-party notices

This skill adapts methods from the open-source projects below. The rules were rewritten and modified; they are not copies of the original files.

| Component | Source | License | Used in |
|---|---|---|---|
| `triage` | https://github.com/mattpocock/skills | MIT | `SKILL.md` (read every issue and its comments, recommend then wait), `references/triage-rules.md` (reproduction outcomes, already-implemented and prior-rejection checks, behavioral acceptance hints), `references/drafting.md` (the AI-drafted note, specific questions for the reporter) |
| `triage-issue` (Atlassian plugin in the Claude plugins official marketplace) | The `atlassian` plugin of the official Claude Code plugin marketplace | Apache-2.0 | `references/triage-rules.md` (several differently worded searches including closed issues, graded duplicate confidence, regressions of closed issues) |
| `archify-review` | https://github.com/tt-a1i/archify | Apache-2.0 | `references/triage-rules.md` (ranking by value, cost and impact) |

The completeness check before classifying, the rule against marking duplicates on title words alone, and the cap of three reported matches follow GitHub's published agentic issue-triage sample, used as ideas only; no text from it is copied. The needs-information state follows the Kubernetes contributor guide's triage process, also as an idea only. The six classes, the now, next and defer rules, approval of the exact text before posting, and `scripts/list-open-issues.sh` are this project's own.

## MIT-licensed component

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

## Apache-2.0-licensed components

The methods from the Atlassian `triage-issue` skill and from https://github.com/tt-a1i/archify are adapted, with modifications, under the Apache License, Version 2.0 (the same license as this repository, see `LICENSE` in this skill's folder). Neither ships a NOTICE file, and the Atlassian plugin's license names no copyright holder, so both are credited here by source.
