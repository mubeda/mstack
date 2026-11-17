# The look: type, color, surfaces, icons

Read this when the work sets type, color, depth or icons. Every value here is a default for a project that has none. Where the project has a token, a scale or a component, use that, and say so in the report.

Contrast and target sizes are in `floor.md` and are not repeated here.

## Type

- **Families and weights.** At most two families, one for headings and one for text, or one for both. At most three weights across the page. Hierarchy beyond that comes from size and color. Reason: each extra face or weight is a download and a decision the reader has to decode.
- **Text people read.** At least 16px, with a line height of 1.5 to 1.65 and a line length of 45 to 75 characters (`max-width: 65ch` is a sound default). Not in capitals, not justified.
- **Small text.** Labels, captions and table heads use the text face one step smaller. Running text under 12px strains the eye: keep above it.
- **Headings.** A tracking of -0.02em to -0.04em on large headings and a line height of 1.0 to 1.15, tighter as the size grows. One weight, one style and one color per heading: stress comes from a line break, not from one colored or italic word.
- **Heading length.** Size a heading by how long it is. About 20 characters can take the largest size, up to 50 the normal heading size, and beyond 90 it is a sentence and should be rewritten.
- **A scale.** Sizes come from one scale, for example a ratio of 1.25 from 16px, with one size per kind of element across the page.
- **Wrapping.** `text-wrap: balance` on headings and other short blocks. It works only on blocks of a few lines (six in Chromium), so it is no use on long text. `text-wrap: pretty` on paragraphs, captions and list items. On text of ten lines or more, use neither.
- **Numbers.** `font-variant-numeric: tabular-nums` where digits change or are compared: counters, timers, prices that update, number columns. Not on phone numbers, postal codes or version numbers. In some faces this changes the look of the digit 1, so look at it.
- **Details.** Curly quotes, a real ellipsis character, and a non-breaking space between a number and its unit.

## Color

- **Layers.** A background, a text color, a few neutral steps between them, and one accent. Define every color once as a token (a custom property on `:root`) and use only the tokens, so a theme can change them in one place.
- **Neutrals.** Tint the greys slightly toward the page's main hue instead of using pure grey, and avoid pure black and pure white as surfaces: a slight tint reads as chosen, and pure black on pure white is harsh at text sizes.
- **The accent is a signal, not a fill.** It marks the main action, the current item, a link, the focus mark. As a default it covers under 5% of a screen. When the direction calls for a page that is mostly one color, say so in the direction: then that color is the surface, and the accent is still one small signal.
- **One main action per view.** Exactly one filled button in the accent marks the main action. Every secondary action shares one quieter style.
- **Text on color.** A rule that paints a dark or colored surface sets its text color in the same rule. Grey text on a colored surface usually fails the contrast of `floor.md`.
- **Gradients** of more than three stops, and any gradient across text, are a default to avoid: they are rarely chosen.
- **States.** Hover, pressed and focus raise the contrast of a control against its surroundings. They never lower it.

## Dark mode

Dark mode is a second rendering of the same system, derived token by token. Inverting the light theme gives the wrong result.

- The background is a dark tinted color with a lightness of about 12 to 18%, not black. The text is a light tinted color, not white.
- **Elevation gets lighter.** A raised surface is lighter than the one under it, by about 3% of lightness per level. A card darker than its ground looks like a hole.
- **Shadows mostly go.** On a dark ground a drop shadow reads as a glow. Show an edge with a hairline ring instead.
- **The accent** loses some saturation and gains some lightness, because a saturated color glares on dark. The hue stays the same in both themes.
- Re-check every pair of `floor.md`'s contrast list in the dark theme. Hairlines are the first to disappear.
- Set `color-scheme` on the root for each theme, so scrollbars and native controls follow, and give a native `<select>` its own background and text color.
- Follow the system setting by default (`prefers-color-scheme`), and let an explicit choice of the user override it.
- Do not invert or darken photographs with a filter.

## Surfaces

- **Before a card.** Separate things with space first, then a hairline, then a tinted area, and only then a card. A card is for content that is one thing by itself, such as an item you can open. A border and a shadow together on one element are one too many.
- **Spacing.** Every gap, padding and margin comes from one scale, for example 4, 8, 12, 16, 24, 32, 48, 64, 96 px. Use `gap` between siblings.
- **Nested corners.** When a rounded element sits close inside another, the outer radius is the inner radius plus the padding between them. Above about 24px of padding the two read as separate surfaces, and each takes its own radius.
- **Depth for cards and raised controls.** A soft layered shadow adapts to any background, where a solid border color does not. A sound default in the light theme is three layers: a 1px ring, a small lift and a wider soft one, each black at 4 to 6% opacity. In the dark theme, use a single 1px white ring at about 8% opacity. Dividers, table lines and field borders stay real borders.
- **Images.** Give an image a 1px outline in pure black at 10% opacity in the light theme and pure white at 10% in the dark one, set inward with `outline-offset: -1px` so the image keeps its size. Use pure black or white here: a tinted grey picks up the surface color and looks like dirt on the edge.
- **Optical alignment.** Centering by the numbers can look wrong. A button with an icon and a text looks balanced with about 2px less padding on the icon's side. A play triangle sits slightly right of the geometric center. Fix an uneven icon in its SVG where you can.
- **Layers.** Give the stacking order a named scale (base, raised, dropdown, sticky, dialog, toast, tooltip) and use only its steps, so no element needs a larger number than the last one.

## Icons

- One icon set per interface, with one stroke weight per surface. Do not mix sets, and do not draw an icon by hand.
- Match the stroke to the text beside it, on a 24px grid: 1.5px beside regular text, 2px beside medium or semibold text, 2.5px beside bold text.
- Size an icon in line with text at 1em to 1.25em, and use the set's own grid sizes (16, 20, 24) over odd fractions. Look at every icon at the smallest size it will appear.
- Draw icons with `currentColor`, so one SVG follows every state through CSS.
- Outline for the resting state, filled for the selected or active one.
- In a right-to-left layout, arrows and chevrons that mean direction flip. Logos, checkmarks and media controls do not.
- Names for icon buttons and hiding of decorative icons: `floor.md`, names and structure.
