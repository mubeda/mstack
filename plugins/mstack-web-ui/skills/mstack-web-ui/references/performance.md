# Speed

Read this when the work adds images, fonts or long lists, optimizes interaction latency (INP) or main-thread work, adjusts loading priority, or adds navigation prefetch/prerender. A page that loads slowly or jumps while loading feels broken whatever it looks like. The limits are defaults: say in the report when the project's own budget replaces one.

## Images

- Reserve every image's size (`floor.md`, images and media).
- The picture that fills the first screen loads first: no `loading="lazy"` on it, and `fetchpriority="high"`. Every image further down gets `loading="lazy"`.
- Serve a size that fits where the image is shown, through `srcset` with widths, at about twice the shown width for sharp screens and not more. For decorative CSS backgrounds or pseudo-elements, use `image-set()` for resolution and format selection. An image far larger than its box is the most common waste.
- Use a modern format (AVIF or WebP) where the project's pipeline has one, and defer off-screen `<video>` and `<audio>` with `loading="lazy"` (falling back to `preload="none"` or Intersection Observer where unsupported).
- As a default budget, the picture of the first screen stays under about 400 KiB and any other photograph under about 250 KiB.
- A photograph set as a CSS background cannot load lazily. Use an `<img>` for content pictures.
- Short looping clips are a muted, inline video with a still frame as its poster, not an animated GIF.

## Fonts

- Only the families and weights the page uses, within the limits of `visual.md`.
- `font-display: swap`, so text shows at once in a fallback, and a fallback of the same kind, so the swap moves little.
- Preload the one or two font files the first screen needs. Add a `preconnect` for the font host when the files come from another origin.

## No jumping

- Nothing that loads late may push content: images, banners, embeds and counters have their space reserved.
- Aim for a layout shift score under 0.1.
- Insert new content below what the user is reading, or on their action, never above it by itself.
- Animate `transform` and `opacity`, not layout sizes (except the scoped intrinsic-size disclosure exception in `motion.md`).

## Long lists and heavy views

- A list of more than about 50 items is shown in pages, or renders only the rows in view. `content-visibility: auto` paired with `contain-intrinsic-size` lets the browser skip off-screen rendering without a library (while keeping scrollbars stable).
- Do not read layout (`getBoundingClientRect`, `offsetHeight`) inside a scroll or pointer handler, and do not mix reads and writes: read first, then write. Defer post-scroll work to the `scrollend` event (with a debounced fallback where unsupported).
- Protect Interaction to Next Paint (INP) by slicing main-thread work: keep synchronous work under 50 ms, yield mid-range tasks (50 to 250 ms) with `scheduler.yield()` (falling back to `setTimeout`), and move heavy work over 250 ms to a Web Worker.
- A text field stays cheap per key: no heavy work on every keystroke, and no request without a short wait.

## Scripts and navigation

- Load scripts deferred, deprioritize background fetches with `fetchpriority="low"`, and load what a view needs when the view is opened, not everything at the start.
- A page that is mostly content works before its scripts arrive: keep initial content in HTML (streaming out-of-order HTML where supported) so the browser discovers the LCP element early.
- For fast multi-page navigations, use the Speculation Rules API (`<script type="speculationrules">`) with conservative eagerness to prefetch or prerender likely next pages (progressive enhancement).
- Add no script for what CSS or HTML does: hover states, sticky headers, smooth scrolling, a `<details>` disclosure, a `<dialog>`, or a `[popover]`.

## What to report

You cannot measure load time by reading code. Say what you checked (image sizes and attributes, font files, reserved space) and what needs a measurement in a browser. A number you did not measure is not in the report.
