# Third-party notices

This skill adapts ideas from the open-source projects below. Nothing of their text or code was copied: every rule, mode rule, and prompt-craft guideline was written anew for `mstack` as a 100% offline, three-host skill. Both repositories were inspected on 2026-11-27 at the commits listed.

| Source | Commit | License | Ideas taken, in this skill's words |
|---|---|---|---|
| https://github.com/cursor/plugins (`pstack/skills/sharpen`, `pstack/skills/reframe`) | `b7b93c3` | MIT (`pstack/LICENSE`) | The complementary split between reframing (inspecting raw files, disambiguating candidate problem classes, ranked domain vocabulary, cross-field analogies with break points, unmentioned concerns) and sharpening (deepening without expanding scope via practitioner craft, rawer inputs, specialist methods, objective external checks, and prototyping empirical decisions while leaving preference/product calls to the user) |
| https://github.com/github/awesome-copilot (`prompt-optimizer`) | `93fc8b9` | MIT | Proportional prompt structure, positive verifiable phrasing, avoiding hollow placeholders (embedding real input or instructing the target AI to request missing input on the next turn), and delivering one copy-pasteable prompt in a single fenced block |

Anthropic's official prompt engineering overview (`https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview`, opened 2026-11-27) was consulted during research for general best-practice verification (clear success criteria, empirical checks, proportional structure); nothing was copied from it.

The automatic three-mode selection (`reframe`, `sharpen`, `both`), the portable two-field frontmatter across Claude Code, Codex and Antigravity, the 100% offline zero-URL design, the read-only boundary with a one-line execution offer, the repo boundary rules, and every word of this skill are this project's own.

## MIT-licensed components

Source: `cursor/plugins` (`pstack`, commit `b7b93c3`):

Copyright (c) 2026 Lauren Tan

Source: `github/awesome-copilot` (`prompt-optimizer`, commit `93fc8b9`):

Copyright GitHub, Inc.

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
