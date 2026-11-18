# The review

Read this when the job is a review. A review judges what is there and changes nothing, unless the user asks for the fixes.

## What you look at

1. The files of the screens you were asked about, and the tokens and components they use.
2. When the session has a browser tool: the screens at a phone width and a desktop width, in both themes when there are two, and the main path with the keyboard only (`SKILL.md`, a build, step 5).
3. Say what you could not look at. A review from code alone cannot judge how a page looks or moves, and must say so.

## The classes

Go through them in this order. The floor comes first because its faults lock people out.

| Class | Part with its rules |
|---|---|
| The floor: keyboard, focus, names, contrast, forms, small screens, targets, images | `floor.md` |
| States and real content | `layout.md`, `components.md` |
| Layout and screen sizes | `layout.md` |
| Direction and the look | `direction.md`, `visual.md` |
| Motion | `motion.md` |
| Words | `copy.md` |
| Speed | `performance.md` |
| React, when the project uses it | `react.md` |

Read a part only for a class the screens touch.

A component without the roles or keys of its kind, and an effect that cannot be paused or ignores reduced motion, are findings of the floor. A component that works but is the wrong one for its job belongs to "States and real content". An effect that breaks another condition of `motion.md`, section 11, belongs to "Motion".

## A finding

A finding names something that can be seen or measured: a control with no name, a contrast of 2.9 to 1, a row that breaks with a long name. A preference is not a finding. "I would use another typeface" does not belong in a review unless the brief or the project's own rules are broken.

Each finding has:

- **Severity** (below).
- **Where:** the file and line, or the screen and the control when there is no source.
- **What:** what is there now, in one line.
- **Rule:** which rule it breaks and what a user loses.
- **Fix:** what to change, concretely enough to act on.

The same fault in many places is one finding that lists the places.

## Severity

| Severity | Meaning |
|---|---|
| Blocks | Somebody cannot use it or is misled: a control unreachable by keyboard, unreadable text, a form that loses input, an invented fact, an action that cannot be found on a phone |
| Hurts | It works, with a noticeable cost: a missing empty or error state, a jump while loading, a target that is hard to hit, motion on something used all day |
| Polish | An isolated detail: uneven corners, a number column that jitters, an icon weight that does not match its text |

## The output

Use this form.

```text
Review of <what>, from <code only | code and browser>.

| Class | Reviewed | Findings |
|---|---|---|
| The floor | reviewed | 3 |
| States and real content | reviewed | 1 |
| Motion | not reviewed: nothing moves | 0 |
| Speed | not reviewed: needs a measurement in a browser | 0 |
...

Findings

1. [Blocks] src/Checkout.tsx:41. The remove button shows only an icon and has no name.
   Rule: every control has a name a screen reader can read. A screen reader says "button" and nothing else.
   Fix: add aria-label="Remove item".
2. ...

Considered and dropped: <one to five candidates you looked at and decided against, each with the reason, or "none">

Not checked: <what you could not check, and why>
```

Rules of the output:

- Every class has a row. A class you did not look at says "not reviewed" with the reason. Never imply that something was reviewed which was not.
- At most 15 findings, most severe first. When there are more, give the 15 that matter most and say how many you left out and of which kind.
- Do not pad. A screen with three real findings gets three.
- "Considered and dropped" shows that the review was real: a shadow that matches the project's token, a small target inside a dense table that still meets the floor. When there was nothing, write "Considered and dropped: none".
- When there is no finding, say so, and still give the table and what was not checked.

## A fresh pair of eyes

The one who built a screen knows what it was meant to be and stops seeing what is there. When you review your own build of a whole page, and the session can start a fresh reviewer and can take screenshots, give that reviewer only the screenshots and the original request, not your reasons. Ask for a ranked list of what is wrong in the pictures. Judge each point again against the files before you act on it.

When the session cannot do that, say in the report that the build was reviewed only by the one who built it.

## After a review

Fix nothing unless the user asks. When they ask for fixes, fix the kind of fault and not only the line: the same missing name usually sits on its sibling buttons too. Then check the floor again for what you touched.
