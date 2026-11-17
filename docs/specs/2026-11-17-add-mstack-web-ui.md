# Add mstack-web-ui, a skill for building and reviewing web interfaces

Status: Approved 2026-11-17 (approved in chat by the user)
Size: full    Mode: gated    Type: feature
Source: conversation 2026-11-17; eight public repositories read from local clones on 2026-11-17 (see Constraints)

## Problem

An agent that builds a web interface without guidance produces the same page every time: a default font, a purple gradient, cards in a grid, no empty or error state, motion on everything, and controls that fail with a keyboard or on a phone. Public skills address this, but each covers a part. One is strong on motion, another on polish details, another on accessibility, another on not looking generated. Several need scripts, an asset kit, a browser of their own or a database, most aim at marketing pages only, and loaded together they repeat and contradict each other. mstack has no skill of its own for this: its delivery workflows name a third-party skill that gives design lookups and no critique.

## Goals

1. An agent with this skill builds an interface that a reviewer cannot fault on the basics: it works with a keyboard and on a phone, every control and data view has its states, and it holds with real content.
2. A new page with no design system gets a direction that was chosen and stated, not the default look.
3. The same rules serve a second job: reviewing an existing interface and returning findings a developer can act on.
4. The skill carries the best rules of each class of advice and nothing else: no script, no data file, no asset kit, no network fetch.
5. It fits the project it works in: the project's design system, components and stack win over every default of the skill.

## Non-goals

- A design tool. The skill writes and reviews code; it makes no mock-ups, images, logos or slides.
- A database of styles, palettes or font pairings, and a script that searches one.
- A linter or a browser checker of its own. The skill uses the browser tool the session has, when it has one.
- Native apps. Rules for iOS, Android and React Native are out.
- Frameworks other than React as a part of their own. The core rules apply to every stack; only React has an added part in this version.
- Replacing `ui-ux-pro-max` in the three delivery workflows. They keep it; switching them is a later change.
- A called mode. No other mstack skill calls or requires this one in this version.
- Faux product screens for marketing pages (the subject of one source, `stageshow`).
- A run of the description optimizer of Anthropic's skill creator.

Anti-goals: a claim that an interface was looked at in a browser when it was not; an invented metric, testimonial, customer or logo in a page; a library, font or dependency added without the user's yes; a rule of the skill overriding the project's design system; text copied from a source; a taste rule stated as a ban without its reason.

## Users and scenarios

- A developer asks for a landing page from a short brief. There is no design system. The skill asks at most once, states a direction, builds, checks and reports.
- A developer asks for a settings screen in an existing app. The skill reads the app's tokens and components first and stays inside them.
- A developer asks "review this page". The skill returns ranked findings and changes nothing.

## Requirements

### R1. Two jobs  [Must]
The skill SHALL do one of two jobs, decided from the request: build (create or change an interface) or review (judge an existing one). It SHALL say in one line which job it does. In a review it SHALL change no file unless the user asks for the fixes.

#### Scenario: a review request
- GIVEN the request "review the checkout page"
- WHEN the skill runs
- THEN it returns findings, and `git status` shows no changed file

#### Scenario: a build request
- GIVEN the request "add a settings screen"
- WHEN the skill runs
- THEN it writes the screen and ends with the report of R13

### R2. The project comes first  [Must]
Before it writes, the skill SHALL read what the project already has: its styling system, design tokens, components, fonts and the repository's UI guide. It SHALL use them, and they win over every default of the skill. It SHALL add no library, icon set or other dependency without the user's yes, and no font to a project that already has its typefaces. A new page with no design system may load a web font from a free font service without asking: the direction (R4) and the report (R13) name the font and where it loads from, and the report says that such a link sends each visitor's address to that service and that hosting the font files with the site avoids it.

#### Scenario: an app with tokens and a button component
- GIVEN an app whose stylesheet defines color and spacing tokens and which has a `Button` component
- WHEN the skill adds a screen
- THEN the screen uses those tokens and that component, defines no second button style, and adds no entry to the package manifest

### R3. Ask once at most  [Must]
For a new page with no design system and no stated direction, the skill SHALL ask one round of at most three questions (who it is for, the tone, anything fixed such as a brand color), and only when the answers would change the result. Otherwise it SHALL state its assumptions and go on. It SHALL NOT ask more than one round before it builds.

#### Scenario: a brief that says enough
- GIVEN a brief that names the product, the audience and the tone
- WHEN the skill runs
- THEN it asks nothing and builds

### R4. A stated direction  [Must]
For a new page with no design system, the skill SHALL choose and state a direction before any code, in at most six lines: the typefaces, the colors with one accent, and the layout idea. It SHALL avoid the patterns its reference names as marks of a generated page, each given with how to see it and what to do instead, unless the project already uses one or the user asks for it.

#### Scenario: a landing page from a brief
- GIVEN a brief for a landing page and no design system
- WHEN the skill builds it
- THEN the reply states the direction before the code, and the page shows none of the named patterns the brief did not ask for

### R5. Only the parts the work needs  [Must]
The rules SHALL be split into parts by class. The skill SHALL read the part with the rules that hold for every change, and of the others only those the work touches: the motion part only when the change has motion, the React part only when the project uses React.

#### Scenario: a static form
- GIVEN a change that adds a form with no animation in a project without React
- WHEN the skill runs
- THEN it reads neither the motion part nor the React part

### R6. The floor  [Must]
Every interface the skill builds SHALL meet these, and a review SHALL check them for every screen it reviewed (R12 names what it did not review):
- every control can be reached and used with a keyboard, and shows a visible focus mark;
- every control and every image has a name a screen reader can read, and actions are buttons and navigation is links;
- text has a contrast of at least 4.5 to 1 against its background, and large text and the edges of controls at least 3 to 1;
- every form field has a visible label, and an error stands next to its field and says the cause and the fix;
- nothing scrolls sideways at a width of 320 px, and zoom is never switched off;
- a control that is touched has a target of at least 44 by 44 px, or 24 by 24 px for a dense desktop interface;
- meaning is never carried by color alone;
- every image has its size reserved, so the page does not jump when it loads;
- motion honors the reduced-motion setting, and no rule animates every property at once.

#### Scenario: a button made of an icon
- GIVEN a design with a button that shows only an icon
- WHEN the skill builds it
- THEN the element is a button, has a readable name, a visible focus mark and a target of the required size

### R7. States and real content  [Must]
Every control the skill builds SHALL have the states it can be in (rest, hover, focus, pressed, disabled, loading, where they apply). Every view that shows data SHALL handle no data, loading, an error and content longer than expected: a long name, a long number, a list of many items.

#### Scenario: a list of members
- GIVEN a screen that lists members
- WHEN the skill builds it
- THEN the code has an empty state and an error state, and a name of 80 characters neither breaks the row nor pushes its neighbor out of view

### R8. Motion with restraint  [Must]
The skill SHALL add motion only with a purpose it can name, and none to an action a user repeats many times a day or triggers with the keyboard. Motion it adds SHALL be short (interface changes under 300 ms, with larger surfaces such as dialogs and drawers allowed more), SHALL move and fade and not change layout sizes, and SHALL be interruptible.

#### Scenario: a menu opened many times a day
- GIVEN a command menu opened by a key
- WHEN the skill builds it
- THEN the menu opens without an animation

### R9. Nothing invented  [Must]
The skill SHALL NOT put an invented metric, testimonial, customer name, logo, award or review into a page. Where the brief gives no fact, it SHALL leave a clearly marked placeholder and list it in the report.

#### Scenario: a brief without customers
- GIVEN a landing page brief that names no customer
- WHEN the skill builds the page
- THEN the page holds no customer logo and no quote attributed to a person, and the report lists the facts that are missing

### R10. Words in the interface  [Should]
A button SHALL say what it does with a verb and its object. An error SHALL say what went wrong and what to do. A label SHALL be the plain word. The skill SHALL write no filler text.

#### Scenario: a form that fails
- GIVEN a sign-up form whose address field holds no @
- WHEN the skill writes its error
- THEN the error names the field's problem and what to type, and the submit button reads as a verb with its object, not "Submit" or "Continue"

### R11. Checked where it can be seen  [Must]
When the session has a browser tool, the skill SHALL look at what it built before it reports: at a phone width and a desktop width, in both themes when the project has two, and with the keyboard through the main path. When the session has none, the report SHALL say that nothing was checked in a browser. The skill SHALL never say or imply that a check ran which did not.

#### Scenario: no browser tool
- GIVEN a session without a browser tool
- WHEN the skill finishes a build
- THEN the report says that the interface was not looked at in a browser, and names what the user should look at

### R12. The review  [Must]
A review SHALL return: a table of the classes with "reviewed" or "not reviewed" for each; at most 15 findings, most severe first, each with its severity, its place (file and line), the rule it breaks, and the fix; and a line with the findings it considered and dropped. A finding SHALL name something that can be seen or measured, never a preference.

#### Scenario: a page with planted flaws
- GIVEN a page with an icon button without a name, an image without its size, text with a contrast of 2.5 to 1 and a list without an empty state
- WHEN the skill reviews it
- THEN each of the four is a finding with its file and line, and the table shows which classes were not reviewed

### R13. The report  [Must]
A build SHALL end with a report: what was built, the direction (R4) when one was chosen, which checks ran and their result, what was not checked, the placeholders left (R9), and every default of the skill that the project's own rules replaced.

#### Scenario: a finished build
- GIVEN a build in a session without a browser tool, with one placeholder left
- WHEN the skill reports
- THEN the report has the lines built, checks run, not checked and placeholders, and "not checked" names the browser look

### R14. Every stack, and React when it is there  [Must]
The rules of the skill SHALL be written for HTML and CSS and name no library as required. The skill SHALL work in the project's stack and styling system. It SHALL find out whether the project uses React from the project's files (a package manifest that lists `react`, or component files) and never guess. When it does, the skill SHALL also read and apply its React part: the rules for component structure, rendering and re-rendering, and loading that bear on an interface, with the rules for Next.js applied only when the manifest lists `next`. It SHALL read the installed React version from the package manifest nearest the changed files, and apply a rule that needs a newer version only when that version is there. When the project does not use React, no React rule is applied or mentioned.

#### Scenario: a React project
- GIVEN a project whose `package.json` lists `react`
- WHEN the skill builds a component
- THEN it reads the React part and the report names the React rules it applied

#### Scenario: React 18
- GIVEN a project whose `package.json` lists `react` at version 18
- WHEN the skill builds a component
- THEN it uses no API that came with React 19, and the report says which rules it left out for that reason

#### Scenario: a plain HTML project
- GIVEN a project with HTML and CSS files and no package manifest
- WHEN the skill builds a page
- THEN it does not read the React part and writes no React code

### R15. Text only  [Must]
The skill SHALL be instructions and reference text. It SHALL ship no script, no data file and no asset, SHALL fetch nothing from the network to do its job, and SHALL keep everything it uses in its own folder.

#### Scenario: the folder's content
- GIVEN the finished skill folder
- WHEN its files are listed
- THEN it holds only Markdown files, the `LICENSE` and the eval cases, and no file of the skill names an address to fetch rules from

### R16. Defaults with reasons  [Must]
A rule of taste (a typeface to avoid, a color to avoid, a layout to avoid) SHALL be worded as a default with its reason, never as a ban. The user's request and the project's design system replace it without argument.

#### Scenario: a brand that is violet
- GIVEN a brief that says the brand color is violet
- WHEN the skill builds the page
- THEN it uses violet and says nothing against it

### R17. Sources credited  [Must]
Every rule adapted from a source SHALL be rewritten in the skill's own words. The skill's `THIRD_PARTY_NOTICES.md` SHALL name each source with its repository, the copyright line and the license text its license requires. For a source without a copyright line it SHALL say where the source states its license.

#### Scenario: a sentence of a source
- GIVEN any sentence of twelve words or more from a source's rule files
- WHEN it is searched in the skill folder
- THEN it is not found, and the notices file names all eight sources

### R18. A plugin like the others  [Must]
The skill SHALL ship as the plugin `mstack-web-ui` for Claude Code and Codex, with both manifests, an entry in both registries, a row in the routing table of `mstack-auto`, and its name in every list of the mstack skills (the optional list of `mstack-setup`, the matching table of `mstack-find-skills`, the counts in `mstack-skill-creator`, `README.md`, `AGENTS.md`). Every changed plugin and the marketplace get a higher version.

#### Scenario: the repository's checks
- GIVEN the finished change
- WHEN `node scripts/check-marketplace.mjs` and `node scripts/check-version-bumps.mjs` run
- THEN both pass, with one more plugin in each registry than before

### R19. Evidence  [Must]
The skill is finished only after three tasks ran in fresh sessions with and without it, and the results were shown: a landing page from a brief that names its audience and tone (so R3's question does not end the turn), a settings screen added to a small existing React app, and a review of a page with planted flaws. The conditions the runs are graded on SHALL be ones a session without the skill could meet (a readable name on an icon button, an empty state, no sideways scroll at 320 px), never the skill's own forms. Neither kind of session SHALL have another interface or design skill loaded. The review page SHALL show a screenshot of each built page from both kinds of session, so the user can judge which is better.

#### Scenario: the comparison
- GIVEN the three tasks run with and without the skill
- WHEN the results are shown
- THEN the user sees the count of met conditions per task for both, and two screenshots per built page

### R20. Nothing expanded, nothing parked  [Must]
The change SHALL touch no skill beyond those R18 names, and SHALL leave no requirement of this spec for later without saying so in the report.

#### Scenario: the changed files
- GIVEN the finished change
- WHEN `git diff --stat origin/main` is read
- THEN every changed path belongs to `mstack-web-ui`, to a list R18 names, or to this spec

### R21. One rule per subject  [Must]
Where two sources give different values for the same thing, the skill SHALL state one, with its reason. No two parts of the skill SHALL give different values for the same thing. The choices made are listed for the user when the skill is reported.

#### Scenario: the press effect
- GIVEN that one source scales a pressed button to 0.96 and another to 0.97
- WHEN the skill's text is searched for the press scale
- THEN it gives one value, in one place

### R22. When it loads, and its size  [Must]
The skill's description SHALL make it load for requests to build, restyle, polish or review a web page, a screen, a component, a form or a layout, in any wording, and SHALL say that it is not for native apps, for images and logos, or for server code. The main file SHALL be at most 150 lines and each part at most 200, and the whole skill at most 1,500 lines, so that it stays a selection.

#### Scenario: a native app
- GIVEN the request "polish this SwiftUI screen"
- WHEN the session decides which skill fits
- THEN this skill's description does not claim it

## Constraints

Sources, read from local clones on 2026-11-17. Text is adapted from none of them word for word. Each source's copyright line was read from its clone and goes into the skill's `THIRD_PARTY_NOTICES.md`, the only place for attribution.

| Source | Commit | License as stated | Used for |
|---|---|---|---|
| `Nutlope/hallmark` | `04977e1` | MIT, `LICENSE` | marks of a generated page, typography, color and dark mode, states, working process |
| `emilkowalski/skills` | `64eb3de` | MIT, `LICENSE` | motion, gestures, phone fixes, worst-case content |
| `jakubkrehel/make-interfaces-feel-better` | `1a2aa96` | MIT, `LICENSE` | polish details, surfaces, icons, the review format |
| `nextlevelbuilder/ui-ux-pro-max-skill` | `e59ff37` | MIT, `LICENSE` | accessibility, forms. Nothing from its side skill `ui-styling`, which ships an Apache 2.0 file under an MIT header |
| `Leonxlnx/taste-skill` | `f6b7657` | MIT, `LICENSE` | performance limits, interface copy |
| `vercel-labs/web-interface-guidelines` | `434b7f9` | MIT, `LICENSE` | accessibility, focus, forms, content handling |
| `vercel-labs/agent-skills` | `1a2c79d` | No `LICENSE` file and no copyright line. `README.md` says "MIT"; the headers of `react-best-practices`, `composition-patterns` and `react-view-transitions` say `license: MIT` | the React part. Treated as MIT by the user's decision |
| `benjitaylor/skills` (`stageshow`) | `299140f` | MIT, `stageshow/LICENSE` | the idea of a reviewer who sees only the screenshots. Its illustration rules are not used |

- The readers did not read every file of `taste-skill` and `hallmark`, and no script code. A rule enters the skill only from a file that was read.
- `AGENTS.md` binds the change: nothing tied to one person or company, attribution only in `THIRD_PARTY_NOTICES.md`, a `LICENSE` identical to the root one in the skill folder, both registries, the routing row, version bumps.

## Decisions

D1. The name is `mstack-web-ui`, a plugin in mstack. Decided by: user.
D2. Own text, with ideas rewritten and credited; nothing copied or installed. Decided by: user.
D3. The two repositories without a `LICENSE` file at their root are treated as MIT. Decided by: user. (`stageshow` has a `LICENSE` in its own folder, found afterwards.)
D4. The skill ships on its own; the delivery workflows keep `ui-ux-pro-max`. Decided by: user.
D5. It covers marketing pages and app screens. Decided by: user.
D6. Two jobs: build and review. Decided by: user.
D7. Text only: no scripts, no data files. Decided by: user.
D8. Taste rules are defaults with reasons, not bans; the project's design system wins. Decided by: user.
D9. The core is stack-neutral. When React is detected, a React part from the Vercel skills applies. Decided by: user (changed from "React left out").
D10. Three test tasks: a landing page, a settings screen in an existing app, a review of a page with planted flaws. Decided by: user.
D11. The hosts are Claude Code and Codex, as for the other mstack plugins. Decided by: agent's call.
D12. The settings-screen test task uses a small React app, so that the React part is tested. Decided by: agent's call.
D14. `vercel-labs/web-interface-guidelines` joins the sources: it is the rule list that one of the named Vercel skills downloads, and it has an MIT `LICENSE` file. Decided by: agent's call.
D15. The skill never fetches rules from the network, unlike that Vercel skill. Decided by: agent's call (remote text would steer the agent).
D16. The hit-target sizes are 44 by 44 px for touch and 24 by 24 px as the lowest for a dense desktop interface, the two values the sources give. Decided by: agent's call.
D17. No called mode and no description optimizer run. Decided by: agent's call, as for the last skill.
D18. Where sources disagree, the agent picks the value and lists each choice in the report (R21). Known so far: the press scale, the stagger between items, and the case of headings and buttons (sentence case, because two of three sources use it and the project's own style wins anyway). Decided by: agent's call.
D19. The size limits of R22. Decided by: agent's call.
D21. A new page with no design system may load a web font from a free font service without asking, named in the direction and the report with the note on visitors' addresses. A project that has its typefaces gets no new font. Decided by: user.
D22. The React part holds the interface rules (component structure, rendering and re-rendering) and the highest-impact loading and bundle rules, about 150 lines. Decided by: user.
D20. The existing-skill check was not run in its usual form: the user named the sources, and no installed skill is an mstack skill for this job. No search for further public skills ran. Decided by: agent's call.

## Open questions

None.

## Interview record

- Round 0 (setup): name, how to use the sources, the repositories without a `LICENSE`, the workflows. Answered D1 to D4.
- Round 2: web fonts on a new page, and how much of the React rules. Answered D21 and D22.
- Round 1: page kinds, jobs, text only, defaults not bans, stack, test tasks. Answered yes to all, D5 to D10; D9 changed by a later message to add the React part.
