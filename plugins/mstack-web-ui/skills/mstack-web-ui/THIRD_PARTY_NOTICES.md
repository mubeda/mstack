# Third-party notices

This skill takes ideas from the open-source projects below. Nothing of their text or code was copied: every rule was written anew, and where they disagree this skill states one value of its own choosing. The first eight projects of the table were read from local clones on 2026-11-17, at the commit named. The others were read on 2026-11-18: four from local clones, at the commit named, and the two W3C documents as web pages.

| Source | Commit | License | Ideas taken, in this skill's words |
|---|---|---|---|
| https://github.com/Nutlope/hallmark | `04977e1` | MIT | The marks of a generated page with how to see each and what to do instead; type, color and dark-mode defaults; the states of a control and of a field; asking once and stating the direction; no invented proof |
| https://github.com/emilkowalski/skills | `64eb3de` | MIT | Whether to animate at all, by how often something is used; durations and curves; gestures; the fixes that make a web page behave on a phone; testing a view with worst-case content |
| https://github.com/jakubkrehel/make-interfaces-feel-better | `1a2aa96` | MIT | Text wrapping and tabular numbers; nested corners, layered shadows and image outlines; icon weight; transitions that can be interrupted; a review that says what it did not look at and what it dropped |
| https://github.com/nextlevelbuilder/ui-ux-pro-max-skill | `e59ff37` | MIT | Accessibility and form rules, among them the newer WCAG 2.2 points (focus not covered, an alternative to dragging, the smallest target). Nothing was taken from its side skills |
| https://github.com/Leonxlnx/taste-skill | `f6b7657` | MIT | Limits for image weight and layout shift; rules for buttons, forms and their errors |
| https://github.com/vercel-labs/web-interface-guidelines | `434b7f9` | MIT | Points on names, focus, forms, content that overflows, touch and the system's formatting of numbers and dates |
| https://github.com/vercel-labs/agent-skills (`react-best-practices`, `composition-patterns`) | `1a2c79d` | MIT, as stated in its `README.md` and in the `license:` line of those two skills. The repository has no `LICENSE` file and states no copyright line | The React part: component structure, rendering and loading |
| https://github.com/benjitaylor/skills (`stageshow`) | `299140f` | MIT | The idea of a fresh reviewer who is given only the screenshots. Its rules for illustrations were not used |
| W3C ARIA Authoring Practices Guide, repository `w3c/aria-practices`, https://www.w3.org/WAI/ARIA/apg/ | read 2026-11-18 | W3C Software and Document License (2023) | What the components it has a pattern for are for, with their roles, states and keys (it has none for a drawer, pagination, a popover as such or a status message); that an alert dialog is the pattern for a message that must interrupt; its recommendation that ordinary site navigation uses disclosures and not the menu role; that a listbox holds no links or buttons |
| Understanding WCAG 2.2, repository `w3c/wcag`, https://www.w3.org/WAI/WCAG22/Understanding/ | read 2026-11-18 | W3C Software and Document License (2023) | The conditions under which moving content needs a way to pause it, and what a status message is |
| https://github.com/inbn/component-gallery | `9afa999` | No license stated | The idea of a part that says which component fits a job. Nothing of its text or markup was copied |
| https://github.com/magicuidesign/magicui | `b0b2e49` | MIT | Which decorative effects users ask for, and that motion should be few and intentional |
| https://github.com/DavidHDev/react-bits | `d01aa91` | MIT with the Commons Clause License Condition v1.0 | Which decorative effects users ask for. Ideas only: no code and no text was taken |
| https://github.com/juliangarnier/anime | `01b81be` | MIT | That what a library starts is grouped and reverted together, and that it can read a media query |

The rules of choice in `references/components.md` that are marked as defaults of this skill come from no source. Facts about native elements and about the animation libraries named in `references/motion.md` were checked on 2026-11-18 against MDN and against the documentation of anime.js, Motion and GSAP; nothing was adapted from those pages.

The two jobs, the floor as one list, the rule that the project's design system wins, the rule that only checks that ran are reported, the split into parts that are read on need, the handling of the React version and the wording of every rule are this project's own.

## MIT-licensed components

Copyright (c) 2026 Hallmark contributors (Nutlope/hallmark)

Copyright (c) 2026 Emil Kowalski (emilkowalski/skills)

Copyright (c) 2026 Jakub Krehel (jakubkrehel/make-interfaces-feel-better)

Copyright (c) 2024 Next Level Builder (nextlevelbuilder/ui-ux-pro-max-skill)

Copyright (c) 2026 Leonxlnx (Leonxlnx/taste-skill)

Copyright (c) 2025 Vercel Labs (vercel-labs/web-interface-guidelines)

Copyright (c) 2026 Benji Taylor (benjitaylor/skills)

Copyright (c) Magic UI (magicuidesign/magicui)

Copyright (c) 2025 Julian Garnier (juliangarnier/anime)

vercel-labs/agent-skills states no copyright line; its contributors hold the copyright in its files.

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

## MIT with the Commons Clause

DavidHDev/react-bits is licensed under "MIT + Commons Clause License Condition v1.0", Copyright (c) 2026 David Haz. That license does not allow selling the software itself. This skill holds none of it: only the idea named in the table.

## W3C documents

This document includes material derived from the ARIA Authoring Practices Guide (APG), https://www.w3.org/WAI/ARIA/apg/, and from Understanding WCAG 2.2, https://www.w3.org/WAI/WCAG22/Understanding/. Copyright © 2026 World Wide Web Consortium. https://www.w3.org/copyright/software-license-2023/

The material was rewritten in this skill's words and changed in form on 2026-11-18. W3C did not write or review this skill. The W3C documents are provided under this notice:

License

By obtaining and/or copying this work, you (the licensee) agree that you have read, understood, and will comply with the following terms and conditions.

Permission to copy, modify, and distribute this work, with or without modification, for any purpose and without fee or royalty is hereby granted, provided that you include the following on ALL copies of the work or portions thereof, including modifications:

- The full text of this NOTICE in a location viewable to users of the redistributed or derivative work.
- Any pre-existing intellectual property disclaimers, notices, or terms and conditions. If none exist, the W3C software and document short notice should be included.
- Notice of any changes or modifications, through a copyright statement on the new code or document such as "This software or document includes material copied from or derived from [title and URI of the W3C document]. Copyright © [$year-of-document] World Wide Web Consortium. https://www.w3.org/copyright/software-license-2023/"

Disclaimers

THIS WORK IS PROVIDED "AS IS," AND COPYRIGHT HOLDERS MAKE NO REPRESENTATIONS OR WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO, WARRANTIES OF MERCHANTABILITY OR FITNESS FOR ANY PARTICULAR PURPOSE OR THAT THE USE OF THE SOFTWARE OR DOCUMENT WILL NOT INFRINGE ANY THIRD PARTY PATENTS, COPYRIGHTS, TRADEMARKS OR OTHER RIGHTS.

COPYRIGHT HOLDERS WILL NOT BE LIABLE FOR ANY DIRECT, INDIRECT, SPECIAL OR CONSEQUENTIAL DAMAGES ARISING OUT OF ANY USE OF THE SOFTWARE OR DOCUMENT.

The name and trademarks of copyright holders may NOT be used in advertising or publicity pertaining to the work without specific, written prior permission. Title to copyright in this work will at all times remain with copyright holders.
