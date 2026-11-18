# Improve mstack-web-ui: component choice, decorative effects, installed animation libraries

Status: Approved 2026-11-18 (approved in chat by the user; three lines amended after the final reviews, marked "Amended", and approved again the same day)
Size: full    Mode: gated    Type: feature
Source: conversation 2026-11-18; four public repositories read from local clones and W3C, MDN and library documentation pages opened on 2026-11-18 (see Constraints)

## Problem

`mstack-web-ui` tells an agent how a control must behave, but not which control to choose. An agent builds tabs from `div` elements where a native element would do, uses a menu role for site navigation, or shows something the user must answer in a toast. The skill also has one sentence on decorative motion ("no loop that never stops"), so when a user asks for a marquee or a moving background the agent has the ban and no rule for doing it well. And it says nothing about a project that already has an animation library, so an agent may write a second way to animate beside it, or leave animations running after a component is gone.

## Goals

1. An agent with the skill picks the component that fits the job, and builds it with the roles and keys people who use a keyboard or a screen reader expect.
2. An effect the user asked for works for everybody: it can be paused, it stops for people who asked for less motion, and a screen reader does not read it.
3. In a project that has an animation library, new motion uses that library the way the project does and cleans up after itself.
4. Nothing of this loads when the work does not need it, and no value of the skill is stated a second time.

## Non-goals

- Ready-made components. The skill ships no component, no snippet library and no script, and installs nothing.
- A 3D part (the user decided against it on 2026-11-18): scenes built with `three` or React Three Fiber are out.
- A catalogue of effects. The skill names no effect as recommended and describes none in detail.
- A part per animation library. The library rules are a few lines that hold for all of them.
- A new class in the review's output form.
- A change to the skill's description or to its row in `mstack-auto`: what the skill is for does not change.

Anti-goals: an endless animation on a page whose user did not ask for one; an effect with no way to pause it; a custom ARIA widget where a native element does the job; a library added without the user's yes; a rule of choice presented as a W3C rule when it is the skill's own.

## Users and scenarios

- A developer asks for a help section with twelve questions and a filter panel. The skill reads the component part, chooses, and builds with the right roles and keys.
- A developer asks for a landing page "with a moving strip of customer names". The skill builds it under the conditions of the effects section and names it in the report.
- A developer asks for a small animation in a project that already uses an animation library. The skill uses that library and adds none.
- A developer asks "review this page". The review also names a wrong component and an effect that breaks the conditions.

## Requirements

### R1. A part on component choice, read on need  [Must]
The skill SHALL have one new part on component choice, listed in the parts table of its main file with when to read it: when the work adds or changes a component that shows and hides content, overlays the page, lets the user choose, reports something, or moves the user around.

#### Scenario: a screen with a choice to make
- GIVEN a request for a help section with twelve questions and their answers
- WHEN the skill builds it
- THEN the session reads the component part before it writes the component

#### Scenario: a page without such a component
- GIVEN a request for a landing page with a heading, a picture and one form
- WHEN the skill builds it
- THEN the session does not read the component part

### R2. What the part says for each component  [Must]
The part SHALL cover these 23 components in five groups: disclosure, accordion, tabs; dialog, alert dialog, popover, tooltip, drawer; radio group, checkbox, switch, select, combobox, listbox, slider; alert, status message (toast); navigation links, menu, breadcrumb, pagination, carousel, tree view. For each it SHALL say what it is for, when another component fits better, the roles and states it carries, and the keys it answers to. The duty itself stays in the floor part (every control works with the keys of its kind and says its state); the new part gives the detail per component and points at the floor part for the duty. For a status message it SHALL point at the floor part's rule (announced politely, never takes the focus) and not repeat it.

#### Scenario: tabs
- GIVEN the part
- WHEN an agent reads the entry for tabs
- THEN it finds the roles `tablist`, `tab` and `tabpanel`, the state `aria-selected`, that the arrow keys move between tabs and Tab leaves the list, and when an accordion fits better

### R3. Rules of choice say where they come from  [Must]
A rule of choice that W3C states SHALL be given as such. A rule of choice that W3C does not state SHALL be marked as the skill's default and SHALL carry its reason, and the project's own pattern SHALL win over it.

#### Scenario: a W3C rule
- GIVEN a request for a site navigation with drop-downs
- WHEN the skill builds it
- THEN it uses a navigation landmark with links and buttons that carry `aria-expanded`, and no `menu` or `menubar` role

#### Scenario: something the user must answer
- GIVEN a request to tell the user that their session ends in one minute, with a button to stay signed in
- WHEN the skill builds it
- THEN it uses an alert dialog, not a toast, because a message that needs an answer must take the focus

#### Scenario: the project decides otherwise
- GIVEN a project whose design system shows every set of options as a select
- WHEN the skill adds a choice between three options
- THEN it uses the project's select and does not replace it with radio buttons

### R4. Native first, the project's library before both  [Must]
Where the browser has an element or attribute for the job, the skill SHALL use it before a hand-built one: `<details>` for a simple show and hide, `<dialog>` with `showModal()` for a modal, `<select>` for a plain choice from a list, the `popover` attribute for a small overlay that is not modal. Where the project has a component for the job, the skill SHALL use that component before the native element. The sentence of the layout part that prefers native controls today SHALL move into the new part, and the layout part SHALL keep a pointer to it.

#### Scenario: plain HTML
- GIVEN a project of HTML and CSS files with no component library
- WHEN the skill adds a confirmation that blocks the page
- THEN it uses `<dialog>` opened with `showModal()`, and writes no focus trap of its own

#### Scenario: a project with its own dialog
- GIVEN a project that has a `Dialog` component
- WHEN the skill adds a confirmation
- THEN it uses that component

#### Scenario: popover is not a modal
- GIVEN a request for a form the user must finish or cancel before going on
- WHEN the skill builds it
- THEN it does not use the `popover` attribute for it, because a popover never makes the page behind it inert

### R5. One value per subject still holds  [Must]
The new part and the new sections SHALL state no value that another part owns: names, focus and target sizes stay in the floor part, durations, curves and the press scale in the motion part. They SHALL point at the owning part.

#### Scenario: the shape test
- GIVEN the skill after the change
- WHEN its shape test runs
- THEN it finds one press scale, in the motion part, target sizes only in the floor part, no duration in milliseconds in the new part, and the five-second limit for moving content only in the floor part

#### Scenario: a value in the wrong part
- GIVEN the new part with a line that gives a duration in milliseconds
- WHEN the shape test runs
- THEN it fails and names the part

### R6. No decorative effect by default  [Must]
The skill SHALL build no animation that runs without end (a marquee, a moving background, text that keeps animating, particles) unless the user asked for that effect in the request. The existing default against endless loops SHALL stay, with its exception for a loading indicator, reworded so that it also names this one exception.

#### Scenario: nobody asked
- GIVEN a request for a landing page that names no effect
- WHEN the skill builds it
- THEN the page has no animation that repeats without end

#### Scenario: a vague wish
- GIVEN a request to "make the page feel more alive"
- WHEN the skill builds it
- THEN it adds no endless animation, and the report says that it added none and that the user can ask for one by name

### R7. An effect the user asked for meets five conditions  [Must]
When the user asked for an effect, the skill SHALL build it so that: (a) what is only decoration is hidden from screen readers, and content that moves (the names in a marquee) is still available to them once, not moving; (b) and (c) it meets the floor part's rule for moving content (it can be paused and stops under the reduced-motion setting), and the section adds only what that rule leaves open: the pause is a visible control that works with the keyboard and has a readable name, and under reduced motion the content is still shown; (d) it reserves its space, so nothing on the page shifts when it starts or loads; (e) it animates only what the motion part allows, so a moving background is a layer that is moved or faded, never an animated background position. A second copy of content that exists only to close the loop of a marquee is hidden from screen readers. The report SHALL name the effect and say that these conditions were built in.

#### Scenario: a marquee on request
- GIVEN a request for a landing page with a moving strip of six customer names the user supplied
- WHEN the skill builds it
- THEN the strip has a pause button with a readable name, a rule under `prefers-reduced-motion: reduce` shows the names without movement, a screen reader meets each name once, and the report names the strip

#### Scenario: a moving background
- GIVEN a request for an animated gradient behind the first screen
- WHEN the skill builds it
- THEN the background element is hidden from screen readers, it stops under the reduced-motion setting, and a pause control exists

### R8. Plain CSS first for an effect  [Must]
In a project with no animation library, the skill SHALL build a requested effect with CSS, or with the browser's own animation interface when CSS cannot express it, and SHALL add no library. When neither can do the effect, it SHALL say so and ask before adding anything. That question is the yes of the skill's rule "add nothing without a yes"; the limit "ask once at most" of a build is about the direction of a new page and does not count it. When nobody can answer (a run that cannot ask), the skill SHALL leave the effect out and say so in the report.

#### Scenario: no library
- GIVEN a project with no animation library and a request for a marquee
- WHEN the skill builds it
- THEN the package manifest is unchanged

### R9. An installed animation library is used the project's way  [Must]
The skill SHALL find out from the project's package manifest whether an animation library is installed (for example `animejs`, `motion`, `framer-motion`, `gsap`). When one is, new motion that needs more than a CSS transition SHALL use it in the way the project's existing code does, SHALL stop and undo its animations when the component or page that started them goes away, SHALL respect the reduced-motion setting through the means that library documents, and SHALL add no second library. Every rule of the motion part still applies. The manifest is the one nearest the files being changed. When the library is listed and no code of the project uses it yet, the skill SHALL use the library's documented basic form and say so in the report. Outside React the same holds in the stack's own terms: what a component or page started stops when it is removed.

#### Scenario: a React project with an animation library
- GIVEN a React project whose manifest lists one animation library and one component that already uses it
- WHEN the skill adds a staggered entrance to a list
- THEN the new code imports that library, undoes its animations on unmount, shows the list without movement under the reduced-motion setting, and the manifest is unchanged

#### Scenario: a transition is enough
- GIVEN the same project
- WHEN the skill adds a hover color change to a button
- THEN it uses a CSS transition and does not import the library for it

#### Scenario: an API the skill is not sure of
- GIVEN a library version the skill does not know
- WHEN it wants to call a function of the library
- THEN it checks first that the installed package exports it, as the React part already asks

### R10. The review job covers both  [Must]
A review SHALL report, inside its existing classes, a component that is wrong for its job or lacks the roles or keys of its kind, and an effect that breaks a condition of R7. The review's output form SHALL not change. A component without the roles or keys of its kind is a finding of the class "The floor"; a component that works but is the wrong one for its job is a finding of the class "States and real content", whose row in the review part gains the new part; an effect that cannot be paused or ignores reduced motion is a finding of the class "The floor", and an effect that breaks another condition is one of the class "Motion".

#### Scenario: tabs without keys
- GIVEN a page with tabs built from `div` elements with click handlers
- WHEN the skill reviews it
- THEN a finding names the missing roles and keys and what to change

#### Scenario: a marquee without pause
- GIVEN a page with a strip that scrolls without end and has no pause control
- WHEN the skill reviews it
- THEN a finding says so and names the control and the reduced-motion rule to add

### R11. Limits and shape  [Must]
After the change the main file SHALL have at most 150 lines, every part at most 200, and the skill at most 1,500 in all. No rule SHALL hold an address. The shape test SHALL know the new part and the new sources: its list of parts gains the new part and its titles and counts say ten parts, its list of sources gains each new source by the name the notices file uses, and the notices check covers them.

#### Scenario: a part that grew too long
- GIVEN a part of 201 lines
- WHEN the shape test runs
- THEN it fails and names the part

### R12. Credits  [Must]
The skill's notices file SHALL name every new source with its commit or the date it was read, its license and what was taken: the W3C ARIA Authoring Practices Guide and the WCAG understanding pages (W3C Software and Document License, with the notice that license asks for), component.gallery (the idea of a part on component choice; no license, nothing copied), magicui (MIT), react-bits (MIT with the Commons Clause; ideas only, no code), anime.js (MIT). It SHALL also list MDN and the documentation of Motion and GSAP as pages that facts were checked against, with nothing adapted from them. Every rule SHALL be in the skill's own words.

#### Scenario: the copy check
- GIVEN the new and changed parts and the local clones of the four repositories
- WHEN the copy check runs over them (the script used for the first version, kept outside the repository, which reports every run of twelve words a part shares with a source file)
- THEN it finds none. The W3C pages are not cloned, so their rules are checked by reading

#### Scenario: the notices
- GIVEN the notices file after the change
- WHEN the shape test runs
- THEN it finds every new source by name, and a read finds the license and the copyright line of each, and the notice the W3C license asks for

### R13. Packaging  [Must]
The change SHALL bump `mstack-web-ui` and the marketplace, name the new sources in the Credits of the README, and keep the sentences about `mstack-web-ui` in `AGENTS.md` true.

#### Scenario: the repository checks
- GIVEN the finished change
- WHEN `check-marketplace.mjs` and `check-version-bumps.mjs` run
- THEN both pass

### R14. Evidence  [Must]
The change SHALL add three eval cases (component choice, an effect on request, an installed animation library), each run once with the new version and once with the version on `main`, and SHALL rerun the three existing cases with the new version. Every condition of a new case SHALL be one the version on `main` could meet.

#### Scenario: the comparison
- GIVEN the six cases
- WHEN the runs are graded
- THEN the report gives, per case, the conditions met by the new version and by the version on `main`, and says for each of the three old cases whether it still meets what it met before

### R15. The report names effects  [Must]
The report of a build SHALL carry the line `Effects:` in two cases and only then, the way it carries the React line only in a React project: when an effect was built (the line names it and says the conditions of R7 were built in), and when the request asked for more life or movement without naming an effect (the line says none was added and that the user can ask for one by name). Every other line of the report SHALL stay as it is.

#### Scenario: no effect in play
- GIVEN a request for a settings screen
- WHEN the skill reports
- THEN the report has no `Effects:` line

## Constraints and assumptions

- Sources read on 2026-11-18 from local clones: `juliangarnier/anime` at `01b81be` (MIT, Copyright (c) 2025 Julian Garnier), `DavidHDev/react-bits` at `d01aa91` (MIT + Commons Clause License Condition v1.0, Copyright (c) 2026 David Haz), `magicuidesign/magicui` at `b0b2e49` (MIT, Copyright (c) Magic UI), `inbn/component-gallery` at `9afa999` (no license file, no license field in its package manifest, no license statement on its About page).
- `pmndrs/drei` (MIT) was read and is not used.
- W3C pages opened on 2026-11-18: twenty pattern pages of the ARIA Authoring Practices Guide, its example "disclosure navigation", and the WCAG 2.2 understanding pages for 2.2.2, 2.3.3 and 4.1.3. The guide's footer names the W3C "permissive license"; the license page is titled "Software and Document license - 2023 version". That every pattern page falls under it rests on the footer sentence alone.
- Amended. W3C states a rule of choice for alert against alert dialog, recommends disclosures over the menu role for ordinary site navigation, and states that a listbox holds no links, buttons or checkboxes (found in the final review). It states none for tabs against accordion, dialog against popover, or select against combobox, listbox and radio group.
- WCAG 2.2.2 applies to moving content that starts by itself, lasts more than five seconds and is shown beside other content; its text has no exception for decoration. That a decorative background falls under it is a reading of the text (agent's call: the stricter reading, and the floor part already asks for a pause).
- Browser facts from MDN pages opened on 2026-11-18: `popover="auto"` closes on a click outside and on Esc, a second one closes the first, and a popover is never modal; `<dialog>` opened with `showModal()` makes the rest of the page inert and closes on Esc; `<details>` elements that share a `name` open one at a time. Not found on those pages, and so not claimed by the skill: that focus returns to the opener when a `<dialog>` closes, and that page search finds text in a closed `<details>`.
- Library facts from documentation pages opened on 2026-11-18: anime.js 4 reverts a scope with `revert()` and takes media queries in `createScope`; Motion has `useReducedMotion` and `MotionConfig reducedMotion`; GSAP has `gsap.matchMedia()` and, in React, `useGSAP`, which reverts on unmount. The skill names the principle and at most these documented means as examples, never as the only way.
- The existing limits of the skill hold: main file at most 150 lines, a part at most 200, the skill at most 1,500. Today it has 824 lines with its notices.
- MDN and the documentation of Motion and GSAP are used for facts only; no text is adapted from them (agent's call: they are listed in the notices as pages facts were checked against, without a license line).

## Decisions

D1. One new part for component choice; effects and the library rule become sections of the motion part. Alternatives considered: everything into the layout and motion parts (the layout part would reach about 190 of 200 lines and load on every layout task); two new parts (motion rules in two parts invite a second statement of one value). Decided by: user, approach A.
D2. The skill gives its own rules of choice where W3C gives none, marked as its own, with reasons. Alternative: list components without rules of choice (does not help choose). Decided by: user.
D3. Native elements before hand-built ones, the project's components before both. Decided by: user.
D4. The 23 components of R2 (the question said 22; the list it showed has 23). Decided by: user.
D5. A visible pause control for every effect that starts by itself and runs longer than five seconds, decoration included. Alternative: no pause for pure decoration (WCAG 2.2.2 has no such exception). Decided by: user.
D6. Effects only when the user asks by name; the default against endless loops stays. Alternative: the skill may choose one effect on a marketing page (more of the generic look). Decided by: user.
D7. CSS first for an effect; no library without a yes. Decided by: user.
D8. The review covers both subjects inside its existing classes. Alternative: a new class (changes the output form and its grader). Decided by: user.
D9. No 3D part. Decided by: user.
D10. The new part is named `components.md`. Decided by: agent's call (a file name).
D11. `mstack-web-ui` goes to 0.2.0 and the marketplace gets a patch bump, because a part is added and no plugin is. Decided by: agent's call, from the version rule in `AGENTS.md`.
D12. The baseline of the comparison is the skill as it is on `main`, not a session without the skill. Decided by: agent's call, from `mstack-skill-creator`'s rule for an improvement; the test question named it and the user accepted the four test groups.
D13. The report of a build gets one conditional line, `Effects:` (R15). Component choices get no report line. Decided by: agent's call (R7 needs the effect named; a line per component would be noise).
D15. The floor part's sentence that a native `<dialog>` gives the focus back to its opener stays as it is in this spec. The plan checks it against the HTML standard and softens it only if the standard does not say so. Decided by: agent's call (the MDN page read on 2026-11-18 does not state it either way).
D14. Amended. The description of the skill gains wording for requests to animate or to add motion or an effect; its routing row stays. Reason: with the old description a small motion request did not load the skill in two of three test sessions, and with the new one it loaded in three of three. Decided by: user, on the agent's advice after the comparison (2026-11-18). This replaces the non-goal "a change to the skill's description".

## Risks

- The component part restates a floor rule in other words. -> R5, the shape test, and a read of the new part against the floor part before the review.
- The rules of choice read as bans. -> Each is a default with its reason, and R3's third scenario keeps the project's pattern above them.
- The effects section makes agents add effects. -> R6 and its two scenarios; the effect case has a twin condition that a page without a request has none.
- A library's API changes. -> The skill names principles; R9's third scenario makes the agent check the installed package.

## Verification

- R1: the traces of the component case and of the rerun landing-page case show whether the part was read.
- R2, R3, R4: read against the part; the component case grades roles, keys and native elements in the built files.
- R5, R11: the shape test, for the values it can see (press scale, target sizes, milliseconds in the new part, the five-second limit). Names, focus and curves are checked by reading the new part against the floor and motion parts.
- R6: the rerun landing-page case (no endless animation) and a read of the reworded sentence in the motion part.
- R7, R8: the effect case, graded on the built page and its manifest.
- R9: the library case, graded on the built files and the manifest.
- R10: read against the review part. No case runs it (agent's call: a fourth new case for the review was not asked for; the existing review case is rerun to show the form did not change).
- R12: the copy check over the clones; the W3C pages are not cloned, so their rules are checked by reading.
- R13: the two repository checks and the whole test suite.
- R15: Amended. The line is checked from the reply of the effect case by the one who runs the comparison, outside the graders, because the version on `main` has no such line and every grader must be one it could meet (R14); the rerun settings-screen case shows that it is absent.
- R14: the comparison table in the final report.
- Not covered by a scenario: a project with two animation libraries (the skill uses the one the touched code already uses and says so); an effect asked for inside an app screen that is used all day (the motion part's rule on frequency still applies, and the skill says so before building).

## Appendix: interview record

- 2026-11-18 Q: which of four proposals to take / Recommended: component choice, decorative effects, a few lines on installed libraries; no 3D part / Decision: as recommended.
- 2026-11-18 Q: how much process / Recommended: light / Decision: full (spec, plan with review, final review).
- 2026-11-18 Q: effects by default or on request / Recommended: only on request / Decision: only on request.
- 2026-11-18 Q: which test tasks / Decision: component choice, effect on request, installed library, and a rerun of the three existing cases.
- 2026-11-18 Q: own rules of choice where W3C gives none / Recommended: yes, marked and with reasons / Decision: yes.
- 2026-11-18 Q: native elements first / Recommended: yes, project library before both / Decision: yes.
- 2026-11-18 Q: which components / Recommended: the list of R2 in five groups, 23 by count (announced as 22) / Decision: yes.
- 2026-11-18 Q: a pause control for decoration too / Recommended: yes / Decision: yes.
- 2026-11-18 Q: CSS first, no library without a yes / Recommended: yes / Decision: yes.
- 2026-11-18 Q: review covers both, in existing classes / Recommended: yes / Decision: yes.
- 2026-11-18 Q: structure / Recommended: A, one new part plus sections in the motion part / Decision: A.
- 2026-11-18 Evidence: clone of `inbn/component-gallery`, its package manifest and About page / Decision: no license, ideas only.
- 2026-11-18 Evidence: `LICENSE.md` of `DavidHDev/react-bits` / Decision: Commons Clause, ideas only, no code.
- 2026-11-18 Evidence: W3C pattern pages and WCAG understanding pages / Decision: which rules of choice W3C states, and the conditions of 2.2.2.
- 2026-11-18 Evidence: MDN pages for `popover`, `<dialog>`, `<details>`, `inert` / Decision: the native-first rules of R4, and two claims left out.
- 2026-11-18 Evidence: `references/motion.md` section 6 and `references/floor.md` group 8 of the skill on `main` / Decision: R6 rewords the existing sentence; R7 (c) points at the floor rule.
