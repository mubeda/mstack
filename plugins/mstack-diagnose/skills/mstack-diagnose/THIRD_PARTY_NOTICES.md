# Third-party notices

This skill adapts methods from the open-source projects below. The rules were rewritten and modified; they are not copies of the original files. The command lines were checked against each tool's own documentation or run on a real machine, and those tools are not bundled.

| Component | Source | License | Used in |
|---|---|---|---|
| pstack (`poteto-mode` playbooks, `why`, `figure-it-out`, `blast-radius`, `benchmark-checklist`, `swarm`, and the principles they route to) | https://github.com/backnotprop/pstack, a mirror of `cursor/plugins` pstack | MIT | `SKILL.md` (phases, evidence tiers, fix verdicts, root-cause rules), `references/performance.md`, `references/regression.md` |
| `diagnosing-bugs` | https://github.com/mattpocock/skills | MIT | `SKILL.md` (the gated phases), `references/intake.md`, `references/flaky.md` |
| Omarchy `diagnose-crash` | https://github.com/omacom/omarchy | MIT | `SKILL.md` (ground rules), `references/crash-linux.md` and the other crash references |
| superpowers `systematic-debugging` | https://github.com/obra/superpowers | MIT | `SKILL.md` (boundary logging, comparison with working code, the stop after three failed fixes) |
| `gem-debugger` agent | https://github.com/github/awesome-copilot | MIT | `SKILL.md` (probe order and the stopping rule) |
| `postmortem-writing` | https://github.com/wshobson/agents | MIT | `references/incident.md` (blameless postmortem, evidence for every why) |
| `memory-leak-debugging` | https://github.com/ChromeDevTools/chrome-devtools-mcp | Apache-2.0 | `references/hang-leak.md` (three-snapshot leak protocol) |
| engineering `incident-response` and `debug` | https://github.com/anthropics/knowledge-work-plugins | Apache-2.0 | `references/incident.md` (severity levels, incident order, timeline sources) |

## MIT-licensed components

Copyright (c) 2026 Lauren Tan (pstack)

Copyright (c) 2026 Matt Pocock (mattpocock/skills)

Copyright (c) David Heinemeier Hansson (Omarchy)

Copyright (c) 2025 Jesse Vincent (superpowers)

Copyright GitHub, Inc. (awesome-copilot)

Copyright (c) 2024 Seth Hobson (wshobson/agents)

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

The methods from https://github.com/ChromeDevTools/chrome-devtools-mcp and https://github.com/anthropics/knowledge-work-plugins are adapted, with modifications, under the Apache License, Version 2.0 (the same license as this repository, see `LICENSE` in this skill's folder). Neither project ships a NOTICE file, and neither LICENSE file names a copyright holder, so they are credited here by repository.
