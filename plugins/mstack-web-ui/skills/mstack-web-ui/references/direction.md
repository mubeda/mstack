# Direction

Read this for a new page with no design system. In an existing project the direction is the project's, and this part gives way to it.

A page built without a decision looks like every other generated page, because every model reaches for the same first answers. The cure is not a rule book. It is to decide, say what you decided, and then build that.

## Choose and state

1. Take from the request: who the page is for, what a visitor comes to do, the tone, and what is fixed (a brand color, a logo, a typeface, existing pages it must sit beside).
2. List what is real: the name, the claim, the numbers, places, dates and pictures the request gives. Everything else is absent, and stays absent (see "Nothing invented").
3. Decide three things and write them down before any code, in at most six lines:
   - **Typefaces:** one for headings and one for text, or one family for both, and why they fit the tone.
   - **Colors:** the background, the text color, and one accent, with what the accent is used for.
   - **Layout idea:** what the first screen shows and how the page is built around the one thing a visitor should remember.
4. Build what you stated. When the build forces a change, change the statement too: the report carries the final one.

Aim for one idea per screen, set large. A first screen holds a heading of about seven words, one sentence, and one or two actions, and all of it is visible without scrolling in a window 1280 px wide and 800 px high.

## Marks of a generated page

Each of these is a default, not a ban. It reads as unchosen because it is the first answer of every model. Keep one when the project already uses it or the user asks for it, without argument. Otherwise decide something else.

| Mark | How to see it | What to do instead |
|---|---|---|
| The first-answer typeface | Inter, Roboto, Open Sans, Poppins, Lato or the system font as the heading face of a new page | A heading face chosen for the tone, named in the direction. The system font is a fine choice for an app screen, when it is chosen |
| The purple gradient | A purple-to-blue or purple-to-pink gradient behind the hero, on a button or in a heading's text | One anchor hue and solid colors. Depth from contrast and scale |
| Glow and blobs | Blurred colored shapes behind text, a halo around a card, a colored glow as a shadow on a dark page | A plain or lightly textured surface |
| Three equal cards | Three columns of the same size, each an icon in a rounded tile above a heading and two lines | Vary width and weight by what matters most. Put the icon in line with its heading, or drop it |
| The template page | Hero, three features, a call to action, a footer, in that order, whatever the product | Build the page from what this visitor comes to do: the menu, the price list, the schedule, the product doing its job |
| A card inside a card | A bordered box inside a bordered box | One layer of containment. Use space, then a hairline, then a tinted area, before a card |
| The small label above every heading | A short line in capitals or a pill before each heading, announcing the section | Let the heading say it. A label belongs where it labels something: a field, a table column, a figure |
| Tracked capitals on small text | Navigation, tags and captions in letter-spaced capitals | The text face, a step smaller, in sentence case |
| Emoji as icons | An emoji in front of a feature or in a button | One icon set, or no icon |
| Template punctuation | Facts joined by middle dots, an arrow glued to a link's text, a colored dot before a label that is no live status | Words, and a real control |
| Everything centered | Heading, sentence, button and picture all on one centered axis, section after section | Give the page a main axis and break it on purpose in one place |
| A drawn fake product | A browser frame or app window made of styled boxes, standing in for a screenshot | A real screenshot when the product can be reached, or a marked placeholder that says what picture belongs there |
| Words that say nothing | "Seamless", "robust", "empower", "unlock", "next-generation", "world-class"; a placeholder person named Jane Doe; a company named Acme | The plain fact, in the user's words (`copy.md`) |

When the tone calls for one of these, for example a playful product that wants emoji, say so in the direction and use it on purpose.

## Nothing invented

A page states facts about a real product to real visitors. A made-up fact is a lie the user then ships.

- Never write a metric, a number of users, a testimonial, a customer name, a logo wall, an award, a rating, a case study or a press quote that the request did not give.
- Never show a success message for something that did not happen: a form that posts nowhere yet says nothing after submit, or says plainly that it is not connected.
- Never draw a logo for a company that exists, and never take one from memory.
- Where a fact is missing, leave a placeholder that cannot be mistaken for content, in the page's markup and visible in the page:

  ```html
  <p data-placeholder>[Placeholder: one customer quote with the name of who said it]</p>
  ```

- List every placeholder in the report, with what belongs there. One line at the end of the report names the single piece of material that would improve the page most.

Example content inside an app screen you were asked to mock up, such as rows in a table, is not a claim about the product. Make it plainly sample data, and say in the report that it is.

## Web fonts

- A new page with no design system may load a web font from a free font service, such as Google Fonts or Fontshare, without asking first.
- Name the font and where it loads from in the direction and in the report.
- Say in the report that a link to a font service sends each visitor's address to that service, and that hosting the font files with the site avoids it. For a site with visitors in the European Union this can matter.
- Load only the weights you use, within the limits of `visual.md`, with `font-display: swap` and a fallback of the same kind (a sans-serif falls back to `system-ui`, a serif to a serif).
- A project that already has its typefaces gets no new font. Suggest one in the report when you think it would help, and leave the decision to the user.
- Never name a paid typeface as if it were available.
