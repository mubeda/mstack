# Motion

Read this when the work has motion, or when you think of adding some. The first decision is whether to animate at all, and often the right amount is none.

What nobody may skip (reduced motion, no rule that animates every property) is in `floor.md`.

## 1. Should it move at all?

Decide by how often a user meets it.

| How often | Decision |
|---|---|
| Many times a day, or triggered by the keyboard: a command menu, a shortcut, moving through a list | No animation |
| Often: hover feedback, switching tabs, toggling | None, or a change of color or opacity of at most 150 ms |
| Now and then: a dialog, a drawer, a toast, a dropdown | A short animation, as below |
| Rarely or once: a first load, a success moment, an empty state | Room for something more, once |

Reason: an animation that is pleasant once is a delay the hundredth time. An action started from the keyboard must feel instant.

## 2. What is it for?

Name the purpose before you write it. When the only purpose is that it looks good, and the user will see it often, leave it out.

- **Feedback:** the interface shows that it noticed a press.
- **Where things are:** a panel comes from the side it will leave to; a menu grows from the control that opened it.
- **A change of state:** one thing turning into another, where a sudden swap would be confusing.
- **Softening a jump:** something appearing or leaving without a jolt.
- **Explaining:** showing how a feature works, on a page that is about that.

## 3. What may move

- Animate `transform` and `opacity`. Colors may change too. Never animate `width`, `height`, `top`, `left`, `margin` or `padding`: they make the browser lay the page out again on every frame.
- Name the properties in the transition. Do not transition every property.
- Nothing appears from nothing. Something that enters starts at about 95% of its size with an opacity of 0, not at zero size. For content the page shows when it loads, that start is the first keyframe of the animation and never the base style, so the content is visible without it (`floor.md`, motion).
- A menu or popover grows from the control that opened it: set `transform-origin` to that side. A dialog in the middle of the screen keeps the center.
- A blur of a few pixels during a cross-fade can hide an awkward overlap of two states. Keep any animated blur small: it is costly, above all in Safari.
- `will-change` only on one element, only for `transform` or `opacity`, and only after you saw a stutter on the first frame.

## 4. How long, and which curve

| What | Duration |
|---|---|
| Press feedback | 100 to 160 ms |
| A tooltip, a small popover | 125 to 200 ms |
| A dropdown, a select | 150 to 250 ms |
| A dialog, a drawer, a sheet | 200 to 500 ms |

- Changes in the interface stay under 300 ms. Dialogs, drawers, sheets and toasts are the larger surfaces that may take more, as the table says.
- **Leaving is quicker and quieter than entering:** about two thirds of the entering time, with a small movement, because the user's attention is already elsewhere.
- **Curves.** Entering and leaving use an ease-out curve, which starts fast and so feels like an answer. Something moving across the screen uses ease-in-out. Constant motion, such as a progress bar, is linear. Avoid ease-in for interface changes: it starts slowly and feels late.
- The built-in curves are mild. A stronger ease-out that reads as decided is `cubic-bezier(0.23, 1, 0.32, 1)`. Use the project's curve tokens when it has them.
- No bounce or overshoot on a change of state. A spring with a little bounce belongs to something the user dragged and let go.
- Match the motion to the product: a tool for work is crisp, a playful product may be softer.

## 5. Press, hover, tooltips

- **Press.** A pressable control shrinks slightly while it is pressed: `transform: scale(0.97)` on `:active`, with a transition in the press range above. It answers when the press starts, not when it ends. Give a control a way to opt out where the effect would distract.
- **Hover** is one change, and only where a pointer can hover (`layout.md`, screen sizes).
- **Tooltips** wait about a second before the first one shows, so they do not fire by accident, and show at once on keyboard focus. While one is open, the next one in the same group shows at once and without animation.
- **The focus mark never animates.**

## 6. Several things at once

- **One entrance per view at most,** and only for a view that is not seen all day. Content is visible without it: an entrance starts from a visible page, never from hidden content that waits for a script.
- **Stagger.** When a group enters, each item follows the one before by 30 to 80 ms, and larger blocks by up to 100 ms. The whole sequence stays under half a second and never blocks input.
- **Direction means something.** What moves forward comes from the right and leaves the way it came; going back mirrors it.
- **What leaves gives up its space at once,** so its neighbors close the gap while it fades, instead of jumping at the end.
- No parallax, no custom cursor, no scroll-jacking, and no loop that never stops, except a loading indicator.

## 7. It can be interrupted

A user changes their mind in the middle of a movement. Anything they can reverse (a hover, a toggle, opening and closing) uses a CSS transition, which turns around from where it is. A keyframe animation starts again from the beginning, so keep keyframes for sequences that run once. Never wait for the end of an animation to set the final state.

## 8. Gestures

- While the user drags, the element follows the finger exactly, with no easing. Easing comes after the release.
- A quick flick is enough to dismiss: decide by speed as well as by distance.
- At a boundary, resist more and more instead of stopping dead.
- Capture the pointer when a drag starts, and ignore further fingers.
- Every gesture has a click and a keyboard way to do the same thing (`floor.md`).

## 9. Reduced motion

Under `prefers-reduced-motion: reduce`, remove movement and scaling, and keep a short fade or a change of color where it helps to see what changed. Anything that moves by itself stops. This is a setting people choose because motion makes them ill, so test it: turn it on and go through the view.

## 10. Check it

When you can run the page, slow the animation down (five times longer, or the browser's animation tools) and watch one run: do two states overlap, does it grow from the right point, do the properties move together. When you cannot run it, say so in the report.
