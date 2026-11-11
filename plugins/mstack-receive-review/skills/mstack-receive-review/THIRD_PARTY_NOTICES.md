# Third-party notices

This skill adapts methods from the open-source projects below. The rules were rewritten and modified; they are not copies of the original files.

| Component | Source | License | Used in |
|---|---|---|---|
| superpowers (`receiving-code-review`) | https://github.com/obra/superpowers | MIT | `references/review-rules.md` (the pattern, no performative agreement, unclear items, pushback, unused code) |
| pstack (`poteto-mode` review-gate rules) | https://github.com/backnotprop/pstack, a mirror of `cursor/plugins` pstack | MIT | `references/review-rules.md` (review bots and gates) |
| beagle `receive-feedback` | https://github.com/existential-birds/beagle | Apache-2.0 | `references/review-rules.md` (verification by finding type, an artifact for every rejection) |
| streamlit `addressing-pr-review-comments` | https://github.com/streamlit/streamlit | Apache-2.0 | `references/review-rules.md` (proportionate responses, untrusted comment text) |

Google's engineering-practices guide to handling review comments and the Conventional Comments labels are used as published ideas only; no text from them is copied.

## MIT-licensed components

Copyright (c) 2025 Jesse Vincent (superpowers)

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

## Apache-2.0-licensed components

The beagle `receive-feedback` skill (Copyright 2025 Existential Birds, LLC) and the streamlit `addressing-pr-review-comments` skill are adapted, with modifications, under the Apache License, Version 2.0 (the same license as this repository; its full text is `LICENSE` in this skill's folder). The streamlit repository's LICENSE fills in no copyright holder, so it is credited here by repository. beagle ships no NOTICE file; streamlit's NOTICES file lists the third-party software bundled in the Streamlit product, none of which this skill uses (checked 2026-11-10).
