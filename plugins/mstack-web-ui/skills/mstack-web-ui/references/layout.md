# Layout, states and real content

Read this when the work adds or moves a view, a list or a control. The values are defaults for a project that has none.

## Layout

- **Flow first.** Use grid for the page and flexbox inside components. Let the browser lay things out; do not measure boxes in script to position them.
- **Things that must shrink, and things that must not.** A flex or grid child that holds text gets `min-width: 0` (in a grid, a track of `minmax(0, 1fr)`), or long text pushes its neighbors out. An avatar, an icon or a button that must keep its size gets `flex-shrink: 0`.
- **A capped container.** The content has a maximum width and is centered. On a very wide screen the margins grow, and the text lines and the number of columns do not.
- **Spacing comes from the scale** (`visual.md`, surfaces). A heading sits closer to what it heads than to what comes before it: about twice the space above as below.
- **No sideways scroll.** Use `width: 100%`, not `100vw`, which is wider than the page when a scrollbar shows. When something overflows, fix that thing. The 320 px rule is in `floor.md`.
- **Sticky parts.** Two sticky elements at the same edge slide under each other: offset the second by the height of the first.

## Screen sizes

- **Two breakpoints, in `rem`,** so they follow the user's text size: about 60rem, where columns stack and side panels go behind a menu, and about 40rem, where large type steps down. Use `clamp()` for sizes that change smoothly and media queries for layouts that change in steps.
- **Ask for the capability, not the width.** `@media (hover: hover) and (pointer: fine)` for hover styles, `(pointer: coarse)` for larger controls. Never read the user agent or guess touch from the screen width: a tablet has a trackpad and a laptop has a touchscreen.
- **Text in a button, a main navigation link or a tab never wraps,** at any width from 320 to 1920 px. When it would: shorten the label, then set `white-space: nowrap` and let the row around it reflow, then move the links that no longer fit behind a menu.
- **Tables on a phone** keep in view the column that names the row and the column that acts on it: restack each row as a labeled block, or pin the first column. Ten columns on a phone need a new design, not smaller text.
- **Other languages.** Leave room for text that is 30 to 40% longer, and use logical properties (`margin-inline-start`, `padding-block`) so a right-to-left layout works.

## Phones

Most of these are one declaration, and none shows in a desktop browser's phone preview. Say in the report which ones you could only check in code.

| What goes wrong | Fix |
|---|---|
| A hover style stays stuck after a tap | Put hover styles inside `@media (hover: hover) and (pointer: fine)`, and give the control an `:active` style for touch |
| The layout is too tall and a bottom button hides under the browser's bar | `100dvh` for an app shell, `100svh` for a first screen that should not shift while scrolling. Not `100vh` |
| The page zooms when a field takes the focus | Field text at the size `floor.md` gives for small screens. Do not switch off zoom |
| A tap feels late | Feedback on press, not on release (`:active`), and `touch-action: manipulation` on controls |
| The page behind a modal sheet or dialog scrolls | Lock the page's own scrolling while it is open (for example `overflow: hidden` on the root element) and undo that when it closes. `overscroll-behavior: contain` on the inner scroll area is an addition: it only stops a scroll that reaches the end of that area from moving the page |
| Content sits under the notch or the home bar | `viewport-fit=cover` in the viewport tag, and `env(safe-area-inset-*)` as padding on fixed bars |
| A long press selects a button's label | `user-select: none` on controls only. Text that is content stays selectable |
| The browser's bar has the wrong color | A `theme-color` for each color scheme, matching the top of the page |

## The states of a control

A control that lacks one of the states it can be in is not finished.

| State | What it needs |
|---|---|
| Rest | The base style |
| Hover | One change that raises contrast: a color step or a border step. Only where a pointer can hover |
| Focus | The focus mark of `floor.md`, at once |
| Pressed | Feedback the moment the press starts (`motion.md` gives the press effect) |
| Disabled | Three signs together: lower opacity (about half), a `not-allowed` cursor, and the `disabled` attribute, or `aria-disabled="true"` when the control must stay focusable. `aria-disabled` only announces the state: the code must also stop every way to activate the control (click, Enter, Space, submit). When a user is likely to try a disabled control, it explains why it cannot be used |
| Loading | Progress shown inside the control. The label stays readable and the width does not jump |
| Error | The error color on the border, the message beside the control, `aria-invalid`. Not color alone |
| Success | The result itself, after the server answered. No success state where no request was made |

For a text field: the border keeps its width in every state, so nothing shifts. The state shows in the border color, the background or the outline. Reserve the line under the field for its hint, and let an error replace the hint there instead of adding a second line. A field is as tall as the button beside it.

Which control to use, and when a native one is enough: `components.md`.

**Undo before confirm.** An action that can be reversed runs at once and offers Undo for a few seconds. An action that cannot (deleting an account) asks first, and names what will be lost.

## The states of a data view

Every view that shows data from somewhere handles four cases. Decide each one; do not leave it to chance.

- **Nothing there.** Say what is empty and what the user can do about it, with one action. Not a bare "No results".
- **Loading.** A placeholder in the shape of the content where the shape is known (a list, a table, cards). A spinner only inside a button. Show nothing for the first fraction of a second, so a fast answer does not flash.
- **Failed.** Say what failed and offer a way on: retry, go back, edit. Keep what the user typed.
- **More than expected.** Long text, large numbers, many items. See the next section.

## Real content

Sample data is chosen, usually without noticing, to make a design look good: names that fit on one line, every optional field filled. Before you call a view finished, put realistic worst cases through it, at the view's real width, at 320 px, and at twice the text size.

Use values a real user could have, not nonsense:

- a long name with a hyphen and accented letters, and a very short one;
- a long e-mail address or URL with no place to break;
- a number of twelve digits, an amount with decimals, zero, and exactly one ("1 member", not "1 members");
- a missing optional field, a missing picture;
- no items, one item, and a thousand items.

What breaks, and the usual fix:

| What you see | Fix |
|---|---|
| Long text pushes a button or menu out of the row | `min-width: 0` on the text, `flex-shrink: 0` on the control |
| An avatar or icon squeezed into an oval | `flex-shrink: 0` on it |
| An address or URL runs past the edge | `overflow-wrap: anywhere` on that element. Not `word-break: break-all`, which breaks ordinary words |
| A badge wraps to two lines | `white-space: nowrap` and `flex-shrink: 0` on the badge, and decide what gives way instead |
| A dash or an empty line where an optional value is missing | Leave the line out, or keep its height on purpose |
| "1 members" | Plural forms from the platform (`Intl.PluralRules`) |
| A raw number such as 1284 or `NaN` | Format with the platform (`Intl.NumberFormat`), and handle a missing value |
| A broken picture | A fallback, such as initials, and `object-fit: cover` |
| Scrolling a thousand rows stutters | Show pages, or render only the visible rows (`performance.md`) |

**Cut, wrap or clamp, decided per field:**

- Wrap what the user needs in full to tell items apart: a name, a title.
- Cut at the end what is secondary and starts with its meaning: a role, a preview. Give a way to read the whole value.
- Cut in the middle what differs at its end: file names, paths, addresses with a long shared ending.
- Clamp to two or three lines a preview in a card, so cards keep their height.
- Never cut a number, an amount or a date.
