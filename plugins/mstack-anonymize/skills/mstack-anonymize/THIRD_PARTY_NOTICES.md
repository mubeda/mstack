# Third-party notices

This skill takes ideas from the open-source projects below. Nothing of their text or code was copied; the rules were written anew, and the script is this project's own. Each project's license file was read on 2026-11-17, together with the skill file the table names. Nothing comes from a project without a license, or from one whose license does not allow it.

| Component | Source | License | Used in |
|---|---|---|---|
| `anon` skill of the `confide` plugin | https://github.com/glebis/claude-skills | MIT | `SKILL.md` and `scripts/anonymize.mjs` (the same value always gets the same typed placeholder; the output of a run holds counts and never values; the cleaning happens on the user's machine; a result still needs a human reader) |
| `anonymize-doc` skill | https://github.com/digital-stoic-org/agent-skills | MIT | `scripts/anonymize.mjs` and `references/what-is-replaced.md` (company data such as amounts stands beside personal data as a kind of its own) |

The rule that the agent never opens the raw file, the column and key names, the header test, the terms file, the pipe for pasted text and the wording about pseudonymisation are this project's own. The Luhn check and the check digits of an IBAN are public algorithms.

## MIT-licensed components

Copyright (c) 2025-2026 Gleb Kalinin (glebis/claude-skills)

Copyright (c) 2026 Digital Stoics (digital-stoic-org/agent-skills)

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
