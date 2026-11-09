# Third-party notices

This skill adapts methods from the open-source projects below. The rules were rewritten and modified; they are not copies of the original files.

| Component | Source | License | Used in |
|---|---|---|---|
| `handoff` | https://github.com/mattpocock/skills | MIT | `SKILL.md` (point at artifacts instead of copying them, redact secrets, suggested skills), `references/handoff-template.md` (the paste prompt points at the file) |
| pstack (`poteto-mode` playbooks `pause-safely` and `session-pickup`) | https://github.com/backnotprop/pstack, a mirror of `cursor/plugins` pstack | MIT | `SKILL.md` (stop at a safe point first, resume without redoing finished work and re-verify inherited claims) |
| superpowers (`executing-plans`) | https://github.com/obra/superpowers | MIT | `references/handoff-template.md` (an identity line naming the work, gates recorded only with the command that passed) |

The fixed start routine for a new session (working directory, state file, git log, one basic check) follows published guidance from Anthropic on long-running agents, used as ideas only; no text from it is copied. Recording uncommitted work in place, the staleness rules for a moved HEAD, and `scripts/check-handoff.mjs` are this project's own.

## MIT-licensed components

Copyright (c) 2026 Matt Pocock (mattpocock/skills)

Copyright (c) 2026 Lauren Tan (pstack)

Copyright (c) 2025 Jesse Vincent (superpowers)

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
