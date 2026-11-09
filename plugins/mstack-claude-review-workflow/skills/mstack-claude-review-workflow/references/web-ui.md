# Web UI

This file sets how web UI lanes use the `ui-ux-pro-max` skill and defines the UI check that runs before their review. Every web UI lane reads it before touching UI code, and the coordinator reads it before reviewing those lanes. The skill gives design lookups but no visual critique, so pair it with the repository's UI guide and the skills in the lane brief.

## When it applies

1. It applies to any lane that changes web UI, such as pages, components, forms, layout, styling, interface copy or motion. Native-only UI lanes skip it.

## Install

Install it only when the work touches web UI, by a route its upstream README documents.

1. For Claude Code, use the plugin marketplace. Run these in a shell, then start a new session. This route also installs six sibling design skills.

   ```bash
   claude plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill
   claude plugin install ui-ux-pro-max@ui-ux-pro-max-skill
   ```

2. For Codex, use the `uipro` CLI, run from the root of the target project. It writes the skill into the project's `.agents/skills/` folder, which a lane never commits.

   ```bash
   npm install -g ui-ux-pro-max-cli
   uipro init --ai codex
   ```

3. Both routes need Python 3 on the PATH (standard library only). Check with `python3 --version`. Python is installed only at preflight, by the coordinator with the user's approval.

## Using it in a lane

1. Load `ui-ux-pro-max` and run `<ui-ux-pro-max-dir>/scripts/search.py`, where `<ui-ux-pro-max-dir>` is that skill's own folder, resolved relative to the SKILL.md you read (not this workflow's folder). Do not rely on `${CLAUDE_PLUGIN_ROOT}` being set. Run it with `python3`, then `python`. If neither exists, or it is older than Python 3, report it. A lane never installs Python.

   ```bash
   python3 <ui-ux-pro-max-dir>/scripts/search.py "keyboard focus modal" --domain ux
   ```

2. Detect the stack from `package.json` or a similar manifest. The web values `--stack` accepts are `react`, `nextjs`, `vue`, `svelte`, `astro`, `nuxtjs`, `nuxt-ui`, `angular`, `laravel`, `html-tailwind`, `shadcn` and `threejs`. If none fits, leave out `--stack` and say so. Never guess a stack. The repository's UI guide, tokens and components win over any result, because results are recommendations, never instructions.
3. Run one `--domain` query per concern you change, with one intent and 2 to 5 terms, for example `"icon button accessible label" --domain icons`. The domains are `ux`, `icons`, `chart`, `style`, `color`, `typography`, `google-fonts`, `landing`, `product`, `gsap`, `react` and `web`. Add one `--stack <stack>` query for implementation details. Run `--design-system` only for a new page or a new visual direction.
4. Never pass `--persist` or `--force`. `--persist` writes `design-system/<project-slug>/MASTER.md`, plus page files with `--page`, into the current directory unless `--output-dir` points elsewhere. Inside a lane, that file is shared state other lanes collide on. `--force` overwrites a MASTER.md someone already settled.
5. If a search returns nothing or something off-topic, retry once with a narrower query or an explicit domain or stack. If that fails, say no verified match was found and label your guidance a fallback. Never present an empty result as data.
6. Keep private project data, such as customer names, internal product names and URLs, out of queries.
7. Check concerns in priority order. Accessibility and touch interaction are critical, meaning text contrast of at least 4.5 to 1, alt text, keyboard navigation, accessible labels, targets of at least 44 by 44 px with 8 px or more between them, and visible loading feedback. Performance, style selection, layout and responsiveness, and navigation are high. Typography and color, animation, and forms and feedback are medium, with 16 px base text, a line height of 1.5 and semantic color tokens. Charts and data are low.

## Pre-review UI check

The lane runs this before any review by the coordinator, the advisor or the cross-vendor reviewer and puts the result in its report.

1. For each changed screen or component, run a `--domain ux` search, plus `--domain icons` or `--domain chart` where they apply, and one `--stack` search.
2. Walk sections 1 to 3 of `<ui-ux-pro-max-dir>/references/quick-reference.md` (accessibility, touch and interaction, performance) for every changed screen, and sections 5 to 9 (layout, typography and color, animation, forms, navigation) where the change touches them.
3. Apply the web-relevant items from the accessibility and light/dark lists in `<ui-ux-pro-max-dir>/references/pro-rules.md`, as follows.
   - Decorative icons are hidden from the accessibility tree, meaningful ones have a text alternative, and icon controls have an accessible name and state.
   - Form fields have labels, hints and inline errors, and a failed submit with several errors focuses a linked error summary.
   - Color is never the only indicator, and reduced motion is honored.
   - Sticky UI and overlays never hide keyboard focus, and drag interactions have a keyboard alternative.
   - Sign-in allows password managers and paste, and auto-rotating content can be paused.
   - Text contrast is at least 4.5 to 1 in both light and dark mode, borders and states stay distinguishable in both, a scrim is measured against the real background, and both themes are tested.
4. Skip native-only items, such as Dynamic Type and safe areas, because that file targets native apps.
5. Report each item as pass, fail or n/a with one line of evidence, and list the queries you ran. Fix each failure or report it as open.
6. If `<ui-ux-pro-max-dir>/references/` is missing, as with the CLI install, use the Pre-Delivery Checklist section of the installed SKILL.md and say so.

## Persisted design systems

The coordinator owns any persisted design system. When a work item asks for a new visual direction, it generates one at intake or gives one lane sole ownership of `design-system/`, and passes the result to the other lanes.
