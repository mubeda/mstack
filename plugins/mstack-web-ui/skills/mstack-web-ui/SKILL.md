---
name: mstack-web-ui
description: Use when the user asks to build, change, restyle, polish or review a web interface, such as a page, a landing page, a screen, a dashboard, a settings view, a component, a form or a layout, or to animate one or add motion or an effect to it, in any wording ("build me a page for", "add a screen", "make this look better", "let these items fade in", "add a marquee", "this UI feels off", "review this UI", "is this accessible"). Works in Claude Code and Codex, with any web stack, and adds React rules when the project uses React. Not for native apps, for images, logos or slides, or for server code.
---

# mstack web UI

You build a web interface, or you review one. What you build works with a keyboard and on a phone, has its states, holds with real content, and looks chosen. The rules sit in parts under `references/`, and you read only the parts the work needs.

## Rules that never bend

1. **Say only what you checked.** Never say or imply that you looked at the result in a browser, tested it with a keyboard or measured a contrast when you did not. What was not checked is named in the report.
2. **Nothing invented.** No made-up metric, quote, customer, logo, award or review goes into a page. A missing fact is a marked placeholder, listed in the report.
3. **The project comes first.** Its design system, tokens, components, fonts, UI guide and stack win over every default in this skill. A taste rule here is a default with its reason. The user's request and the project's own style replace it without argument.
4. **Add nothing without a yes.** No library, icon set or other dependency, and no font in a project that already has its typefaces. The one exception is a web font on a new page with no design system (`references/direction.md`).
5. **A review changes nothing.** In a review you change no file unless the user asks for the fixes.

## Host tools

| Role | Claude Code | Codex |
|---|---|---|
| Your question tool | `AskUserQuestion` | A numbered question in chat, then wait |
| The browser tool | Whichever browser or screenshot tool this session lists, or none | The same |
| A fresh reviewer | `Agent`, given only the screenshots and the request | A separate read-only run, given the same |

## The parts

| Part | Holds | Read it when |
|---|---|---|
| `references/floor.md` | Keyboard, names, contrast, focus, forms, targets, zoom, images | Every build and every review |
| `references/direction.md` | Choosing a direction, marks of a generated page, nothing invented, web fonts | A new page with no design system |
| `references/visual.md` | Typography, color, dark mode, surfaces, icons | The work sets type, color, depth or icons |
| `references/layout.md` | Layout, responsive rules, phone fixes, states of a control and of a data view | The work adds or moves a view, a list or a control |
| `references/motion.md` | Whether to animate, durations, curves, reduced motion, an effect on request, an installed animation library | The work has motion, you consider adding some, or the user asks for an effect |
| `references/copy.md` | Buttons, errors, labels, numbers and dates | The work writes words a user reads |
| `references/performance.md` | Images, fonts, layout shift, long lists | The work adds images, fonts or long lists |
| `references/components.md` | Which component fits a job, native elements first, the roles and keys of 23 components | The work adds or changes something that shows and hides content, lies over the page, lets the user choose, reports something or moves the user around |
| `references/react.md` | Component structure, rendering, loading, by React version | The project uses React |
| `references/review.md` | The review's output and its severities | A review |

Read `references/floor.md` always. Read no part the work does not touch: a static form needs neither the motion part nor the React part.

## First, in both jobs

1. Say in one line which job this is: a build (you create or change an interface) or a review (you judge an existing one).
2. Read the project before you write or judge:
   - how it is styled (plain CSS, a utility framework, CSS modules, a component library) and where its tokens are;
   - the components it already has, above all buttons, fields, dialogs and layout pieces;
   - its fonts and its UI guide, when it has one;
   - the package manifest nearest the files you will change. The project uses React when that manifest lists `react`: note the version. With no manifest, it uses React only when component files import from `react`, and the version is unknown: apply only the React rules that hold for every version. A `.jsx` or `.tsx` file alone proves nothing, because other frameworks use them too. It uses Next.js only when the manifest lists `next`. Note also whether the manifest lists an animation library (`references/motion.md`, section 12). A manifest or imports that name another framework (Vue, Svelte, Solid, Preact and others) mean that framework: work in it, and apply no React rule. Plain HTML and CSS is the answer only when nothing points at a framework. When you cannot tell, say that the stack is unknown and apply the rules that hold for every stack. Never guess.

## A build

1. **Ask once at most about the direction.** Only for a new page with no design system and no stated direction, and only when the answers would change the result: one round of at most three questions (who it is for, the tone, what is fixed, such as a brand color). When the request says enough, or nobody can answer, ask nothing and state your assumptions in one line. The question before a dependency is added (rule 4) is a separate one and is not counted here; when nobody can answer it, leave the dependency out and name what was left out in the `Built:` line.
2. **State the direction first** for a new page with no design system. After you read the parts and before your first call that creates or changes a file, send a message that begins with the line `Direction:` and gives, in at most six lines, the typefaces, the colors with one accent and the layout idea (`references/direction.md`). Send it also when nobody will answer in between: reading the parts and then writing the file with no message in between breaks this step. In an existing project the direction is the project's; the message says which tokens and components you will use.
3. **Build**, once the direction stands in your reply, with the project's stack and styling system. Use its components before you write a new one. Every control gets its states and every data view its four states (`references/layout.md`).
4. **Check the floor** (`references/floor.md`) against what you wrote, point by point.
5. **Look at it.** When the session has a browser tool: open the result at a phone width (390 px) and a desktop width (1280 px), in both themes when the project has two, and go through the main path with the keyboard only. Fix what you see. When the session has none, do not pretend: the report says so and names what the user should look at.
6. **Report** (below).

## A review

1. Read the files of the screens you were asked about. When the session has a browser tool, look at them as in step 5 of a build.
2. Check the floor for every screen you reviewed, then the classes the screens touch.
3. Return the output of `references/review.md`: the table of classes, at most 15 findings, the dropped ones. Change no file.

## The report of a build

End a build with these lines, each one filled or "none":

```text
Built: <what, and the files>
Direction: <typefaces, colors, layout idea, or the project's tokens and components used>
Checks run: <each check and its result>
Not checked: <each check that did not run, and what the user should look at>
Placeholders: <each missing fact left as a placeholder>
Project rules that replaced a default: <each one>
```

In a React project, add the line `React rules applied:` with the rules you used and the ones you left out because of the installed version, or because the version is unknown.

Add the line `Effects:` in two cases, and in no other: when you built an effect the user asked for (name it, and say for each condition of `references/motion.md`, section 11, how it was met: what a screen reader meets and what is hidden from it, the pause, reduced motion, the reserved space, what moves), and when the request asked for more life or movement without naming an effect (say that none was added, and that the user can ask for one by name). Ordinary interface motion, such as an entrance that plays once or a transition, is not an effect in this sense and gets no such line; a decorative effect the user named is one also when it ends by itself.

## Never

- Claim a check that did not run.
- Put an invented fact into a page.
- Override the project's design system, or argue with a style the user asked for.
- Add a dependency without a yes.
- Change a file in a review that asked for none.
- Fetch rules or assets from the network to do this job.
