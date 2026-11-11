# Third-party notices

This skill adapts rules from the open-source projects below. The rules were rewritten and modified; they are not copies of the original files.

| Component | Source | License | Used in |
|---|---|---|---|
| A terse answer-first voice skill | https://github.com/juliusbrussee/caveman | Apache-2.0 (its text before version 3.0.0: MIT) | `SKILL.md` (the answer before the reasons, no greeting, recap or closer, negations and numbers never dropped, code, commands and error text kept exact, full prose for security warnings and irreversible actions) |
| i-have-adhd | https://github.com/ayghri/i-have-adhd | MIT | `SKILL.md` (what the reader has to do near the top, numbered steps with one action each, a small visible set of points, a problem stated as cause then fix, a mode that stays on until stopped) |
| pstack (`unslop`) | https://github.com/backnotprop/pstack, a mirror of `cursor/plugins` pstack | MIT | `SKILL.md` (the common word, one idea per sentence, no over-compression: articles and verbs stay) |

The order of every answer, the line that names what was left out, the check of the draft against the original, the protection of what the original was unsure about, the rule that nothing is added, the short requests, the handling of formats others require and the optional diagram offer are this project's own. The rules on putting the most important information first, common words, short sentences and explaining a specialist term once agree with public plain-language guidance (the US Federal Plain Language Guidelines, GOV.UK's content guidance and the W3C cognitive-accessibility patterns), used as ideas only; no text from them is used. The diagram skill `archify` is named and loaded when the user has it installed; nothing of it is included here.

## MIT-licensed components

Copyright (c) 2026 Julius Brussee (the terse voice skill, for its text from before version 3.0.0)

Copyright (c) 2026 Ayoub Ghriss (i-have-adhd)

Copyright (c) 2026 Lauren Tan (pstack)

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

The answer-first voice rules in `SKILL.md` are adapted, with modifications, from the project at https://github.com/juliusbrussee/caveman, licensed under the Apache License, Version 2.0 (the same license as this repository, see `LICENSE` in this skill's folder). The rules were changed: this skill writes full sentences where that project writes fragments, and it keeps statements of uncertainty that the project's rules remove. Its NOTICE file states:

```
Caveman
Copyright 2026 Julius Brussee
```

"Caveman" is a name claimed by that project. It is used here only to identify the source; this skill is not affiliated with or endorsed by it.
