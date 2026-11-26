# Third-party notices

This skill adapts workflow ideas and resolution patterns from the four open-source projects below. All rules in `SKILL.md` and `references/resolution-patterns.md` are rewritten in this project's own words, and `scripts/conflict-context.mjs` is a zero-dependency Node.js implementation inspired by the compact context-extraction design of `warpdotdev/common-skills`.

| Project | Source | License | What was adapted |
|---|---|---|---|
| `warpdotdev/common-skills` (`resolve-merge-conflicts`) | https://github.com/warpdotdev/common-skills | MIT | Compact summary, per-file hunk/diff3/diff extraction, and index-stage preview workflow |
| `mattpocock/skills` (`resolving-merge-conflicts`) | https://github.com/mattpocock/skills | MIT | Intent-first resolution from commit/PR/issue history, preserving compatible intents, never inventing behavior or aborting unprompted |
| `tailcallhq/forgecode` (`resolve-conflicts`) | https://github.com/tailcallhq/forgecode | Apache-2.0 | Category resolution playbooks (deleted-modified and rename checks, lockfile/generated regeneration, imports/tests/types/config, escalating contradicting logic) |
| `cursor/plugins` (`cursor-team-kit/skills/fix-merge-conflicts`) | https://github.com/cursor/plugins | MIT | Minimal-diff correctness-first guardrails, no broad refactors, no push/tag during conflict resolution, concise summary format |

---

## warpdotdev/common-skills (MIT)

```text
MIT License

Copyright (c) 2026 Denver Technologies, Inc.

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

## mattpocock/skills (MIT)

```text
MIT License

Copyright (c) 2026 Matt Pocock

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

## cursor/plugins — cursor-team-kit (MIT)

```text
MIT License

Copyright (c) 2026 Cursor

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

## tailcallhq/forgecode (Apache-2.0)

Adapted with modifications from `tailcallhq/forgecode` (https://github.com/tailcallhq/forgecode) under the Apache License, Version 2.0 (identical to `LICENSE` in this skill folder). That repository ships no `NOTICE` file.
