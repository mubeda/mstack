# The floor

Everything you build meets every point here, and a review checks them for every screen it looked at. These are not taste. A page that breaks one is broken for somebody: a person who uses a keyboard, a screen reader, a phone, a zoomed page or a slow connection.

Go through the nine groups in order after you wrote the code, and again when you look at the result.

## 1. Keyboard

- Every control can be reached and used with the keyboard. Tab moves from one control to the next, and to a composite widget as a whole (a menu bar, a tab list, a radio group); inside such a widget the arrow keys move. A menu that a button opens is reached through that button: opening it puts the focus on an item. Each control answers to the keys its kind has: Enter and Space on a button, Escape to close a menu, a popover or a dialog. The keys per component are in `components.md`.
- The tab order is the reading order. Use no `tabindex` above 0.
- A modal dialog keeps the focus inside while it is open, and the page behind it cannot be used. When it closes, the focus goes back to where it was before, which is usually the control that opened it; when that element is gone or disabled, put the focus on the nearest thing that makes sense. The native `<dialog>` opened with `showModal()` does the first two and tries the third. A dialog a script opens by itself, such as a timed warning, returns the focus to wherever the user was. Mark the page behind a hand-built modal `inert`. A dialog that is not modal leaves the page usable.
- Give keyboard users a way past repeated navigation: a "skip to content" link as the first focusable element.
- Anything that works by dragging, swiping or another gesture also works with a click and with the keyboard.
- A custom Enter shortcut in a text field keeps the visible submit button, and does not fire while an input method is composing text.

## 2. Focus

- Every control shows a focus mark, at once and without an animation. A solid outline of 2px with a 2px offset is a sound default; inside a field, set the outline inward so it does not touch its neighbor.
- The mark has a contrast of at least 3 to 1 against the control and against the page.
- Use `:focus-visible`, so the mark shows for the keyboard and not on every click.
- Never remove an outline without putting a mark of the same strength in its place.
- A sticky header, a footer bar or an overlay never covers the control that has the focus. `scroll-padding-top` on the scroll container, at the height of the sticky header, solves the common case.

## 3. Names and structure

- An action is a `<button>`. Navigation is an `<a>` with an address, so it opens in a new tab and can be copied. A `<div>` or a `<span>` with a click handler is neither.
- Every control has a name a screen reader can read. A button that shows only an icon gets an `aria-label`. A decorative icon beside visible text is hidden with `aria-hidden="true"`.
- A control that has a state says it: `aria-expanded` on what opens a menu, `aria-pressed` on a toggle, `aria-current="page"` on the current link.
- Every image that carries meaning has an `alt` that says what it shows. A decorative image has `alt=""`.
- Use the element that already means the thing (`<button>`, `<a>`, `<label>`, `<table>`, `<nav>`, `<main>`, `<search>` for search and filter forms) before any ARIA role. Do not use more than one `banner`, `main` or `contentinfo` landmark per page; never set `aria-hidden="true"` on a focusable element or its ancestor, and never place `role="presentation"` or `role="none"` on a focusable element itself (non-focusable presentational wrappers whose interactive descendants retain their roles are allowed).
- Headings go down one level at a time, with one `<h1>` per page (a modal dialog may carry its own `<h1>`).
- `<html lang>` names the language the page is written in, and `lang` marks any inline passage in another language.
- Scrollable code blocks (`<pre><code>`) get `tabindex="0"`, `role="region"` and an accessible name so keyboard users can scroll them.
- CSS generated content that conveys meaning supplies alternative text (`content: "…" / "label"`), and decorative generated content hides itself (`content: "…" / ""`), with fallbacks where unsupported.
- Inside Shadow DOM, ARIA `id` references (`aria-labelledby`, `aria-describedby`, `aria-controls`) cannot cross a shadow boundary: keep the reference and its target in the same tree.
- A routine update the user did not cause by moving the focus and need not answer (a toast, a saved line, a new count, a validation message) is announced through a polite live region. An urgent one (a failed save, a lost connection) is an alert and is announced at once. Neither takes the focus. A message the user must answer is different: it takes the focus, as an alert dialog (`components.md`).

## 4. Contrast and color

- Text has a contrast of at least 4.5 to 1 against its background. Large text (24px and up, or 19px and up in bold) needs at least 3 to 1.
- The edges of a control, icons that carry meaning and the focus mark need at least 3 to 1. A text field's border is a control edge.
- Check both themes when the project has two. Check text on an image or a tinted surface against the real background behind it, not against the token.
- Meaning is never carried by color alone. An error has a word or an icon beside its red; a status has a label; a link inside text differs from the text by more than its color.

## 5. Forms

- Every field has a visible `<label>` tied to it, above or beside the field. A placeholder is not a label. Use it only to show a format.
- Use the right field: `type="email"`, `type="tel"`, `type="url"`, `inputmode="numeric"` for a count, and `autocomplete` with the right value, so the phone shows the right keyboard and the browser can fill the field.
- Never block paste, and never switch off a password manager on a sign-in field.
- Mark a required field with a word or a sign and with the `required` attribute, not with color.
- Validate when the user leaves a field or on submit, not on every key: prefer `:user-invalid` and `:user-valid` so errors appear only after interaction. After a field was marked wrong, re-check it while the user types, so the error goes as soon as it is fixed.
- Give secondary buttons inside a form explicit `type="button"` so they do not submit it, group related controls with `<fieldset>` and a first-child `<legend>`, and never auto-submit a form on `<select>`, radio or checkbox change alone.
- An error stands next to its field, says the cause and what to type, is tied to the field with `aria-describedby`, and the field gets `aria-invalid="true"`.
- After a failed submit, move the focus to the first field that failed, or to a summary that links to each failed field. Keep everything the user typed.
- The submit button stays enabled until the request starts. While the request runs, it shows that, keeps its width and cannot be pressed twice.
- A form that has unsaved changes warns before the user leaves it.
- Show success only after the server answered. A form that posts nowhere yet says so (see `direction.md`, nothing invented).

## 6. Small screens and zoom

- Nothing scrolls sideways at a width of 320 px. Fix the content that overflows; do not hide the overflow.
- Never switch off zoom: no `user-scalable=no` and no `maximum-scale=1` in the viewport tag.
- The page still works when the user sets the text to twice its size or raises the operating system text scale: use relative units (`rem`, `env(preferred-text-scale)` where supported) so boxes grow with their text and nothing is cut.
- For collapsed content that users should still reach with browser find-in-page, prefer `hidden="until-found"` (handling `beforematch` to update open state) over `display: none`.
- Text in a field is at least 16px, or a phone enlarges the whole page on focus.

## 7. Targets

- A control that a finger can reach has a target of at least 44 by 44 px, with at least 8px between two targets.
- In a dense interface used with a mouse, a target may be smaller, and never below 24 by 24 px.
- A small control keeps its look and gets a larger target from an invisible area around it:

  ```css
  .icon-button { position: relative; }
  .icon-button::before { content: ""; position: absolute; inset: -12px; }
  ```

  Two such areas must not overlap.
- A checkbox or a radio button and its label are one target, with no dead zone between them.
- Nothing that matters is reachable only by hover. What a hover shows is also shown on focus and reachable by touch.

## 8. Images and media

- Every image has its size reserved, with `width` and `height` attributes or an `aspect-ratio`, so the page does not jump when it loads.
- Moving content that starts by itself and runs longer than five seconds can be paused, and stops under the reduced-motion setting.
- A video with sound that carries meaning has captions, shown in time with it. A transcript alone is enough only for a recording that is sound without pictures.

## 9. Motion

- Everything that moves has a rule under `@media (prefers-reduced-motion: reduce)` that removes the movement while keeping the element visible in its final state. A fade may stay. Motion that a script drives is switched off by the script, on the same setting, because a CSS rule cannot stop it.
- Nothing flashes more than three times in any one-second period (WCAG 2.3.1), regardless of the user's motion preference: never place flashing content inside `prefers-reduced-motion: no-preference` either.
- No rule animates every property at once: write the properties out, never `transition: all`.
- Content that the page shows when it loads is never hidden first so that a script can reveal it: an entrance effect starts from visible content, so a script that fails leaves the page readable. This is not about what opens on the user's action (a closed dialog, a menu, an inactive tab panel), and it does not ask an app that renders in the browser to be rebuilt.

The rest of the motion rules are in `motion.md`. This part holds only what nobody may skip.

## When a point cannot be met

Say so in the report, with the reason and what would fix it. Never drop a point silently, and never report it as met because the code looks right: a contrast is measured or computed from the two colors, a tab order is walked.
