# Upgrade mstack-web-ui with GoogleChrome/modern-web-guidance

Status: Approved 2026-11-27 (approved in chat by the user)
Size: full    Mode: gated    Type: feature
Source: conversation 2026-11-27; `GoogleChrome/modern-web-guidance` read from local clone at commit `2b4aa13` (Apache-2.0, no `NOTICE` file) on 2026-11-27

## Problem

`mstack-web-ui` (`0.2.2`) covers core accessibility, visual direction, layout, motion, copy, performance, 23 UI components, and React patterns, but lacks guidance on modern Baseline web platform features (such as CSS Anchor Positioning, `:has()`, container size/style queries, `@starting-style`, `interpolate-size`, View Transitions, scroll-driven animations, `light-dark()`, `font-size-adjust`, `field-sizing`, Invoker commands `commandfor`, `<dialog closedby>`, customizable `<select>`, Web Components, and `scheduler.yield()`), lacks an explicit Baseline Widely Available vs fallback policy, and does not cover broader client web platform domains from `GoogleChrome/modern-web-guidance` (modern JS/Temporal, client web security & passkeys, privacy, PWA install/migration, browser Built-in AI, WebMCP, Emscripten WebAssembly, and Manifest V3 Chrome Extensions).

## Goals

1. Distill and weave high-signal modern web guidance from `GoogleChrome/modern-web-guidance` (all 17 guide categories plus Chrome Extensions MV3) into `mstack-web-ui` as offline, rewritten text rules with zero scripts, zero external data files, and zero runtime network fetches.
2. Add an 11th on-demand reference part (`references/platform.md`) for Baseline browser-support policy, modern JS/Temporal, web security & privacy, PWA, Built-in AI, WebMCP, Wasm, and Chrome Extensions MV3, while enriching existing parts in place where their subject already lives.
3. Preserve every `mstack-web-ui` shape invariant (`SKILL.md <= 150` lines, every part `<= 200` lines, total Markdown `<= 1,500` lines, zero `https?://` URLs in rules, single-statement values for press scale, target sizes, five-second limit, and component durations).
4. Credit `GoogleChrome/modern-web-guidance` (`2b4aa13`, Apache-2.0) in `THIRD_PARTY_NOTICES.md` and `README.md`, add comparison evals against the `0.2.2` baseline, update routing/discovery docs, bump versions cleanly, and pass all repo checks and read-only cross-vendor review.

## Non-goals

- Shipping or invoking the upstream `npx modern-web-guidance` CLI or making runtime network requests.
- Vendoring or copying raw upstream guides or code snippets verbatim.
- Wiring the six delivery workflows (`mstack-*-led-review`, `mstack-*-led-dev`) to switch away from `ui-ux-pro-max`.
- Raising the 1,500-line total Markdown cap or 200-line per-part cap in `skill-shape.test.mjs`.

## Settled decisions (from user, 2026-11-27)

- **D1 (Architecture):** Distilled offline rules inside `mstack-web-ui` (keep zero-network, text-only contract; rewrite adapted rules in our own words with Apache-2.0 credit).
- **D2 (Domains):** Include all `GoogleChrome/modern-web-guidance` domains (core HTML/CSS/forms/a11y/UI/performance/security plus modern JS/Temporal, privacy, PWA, Built-in AI, WebMCP, Wasm, and Chrome Extensions MV3).
- **D3 (Structure):** Add an 11th reference part `references/platform.md` and update `plugins/mstack-web-ui/tests/skill-shape.test.mjs` accordingly.

## Requirements

### R1. Add `references/platform.md` as the 11th on-demand part  [Must]
`mstack-web-ui` SHALL add `references/platform.md` (at most 200 lines), list it in `SKILL.md` › `## The parts` with clear read-when triggers, and add a corresponding `Web platform and security` class row in `references/review.md`.

#### Scenario: modern platform task reads `platform.md`
- GIVEN a request involving client HTML sanitization, Built-in AI, WebMCP, Wasm, PWA install, or a Chrome MV3 extension
- WHEN the agent follows `SKILL.md`
- THEN it reads `references/platform.md` and skips unrelated visual/motion parts

### R2. Explicit Baseline Widely Available and fallback policy  [Must]
`references/platform.md` SHALL state that Baseline Widely Available features may be used without fallbacks, while Newly Available or limited-availability features SHALL use feature detection (`@supports`, `CSS.supports()`, or runtime API checks) and a documented fallback unless the user specifies a custom browser-support policy.

#### Scenario: Newly Available CSS/HTML feature requested
- GIVEN a request using CSS Anchor Positioning, `@starting-style`, `field-sizing`, or Invoker commands (`commandfor`) with no custom browser policy
- WHEN the agent builds it
- THEN it adds feature detection and a clean fallback or graceful degradation without breaking unsupported browsers

### R3. Distilled coverage of all platform domains in `references/platform.md`  [Must]
`references/platform.md` SHALL provide concise, rewritten, actionable rules (with zero `https?://` URLs) covering:
1. Browser support & Baseline fallback policy.
2. Modern JavaScript & dates (`structuredClone`, non-mutating array methods `toSorted`/`toReversed`/`toSpliced`/`with`/`findLast` with dense/index caveats, `Object.groupBy`/`Map.groupBy` with `Object.hasOwn`, `Promise.withResolvers`, `AbortSignal.timeout`/`AbortSignal.any`, `Temporal` with polyfill fallback).
3. Web security & privacy (HTTPS/HSTS staged rollout, safe DOM sinks `textContent`/`setHTML()`/`Document.parseHTML()` over `innerHTML`/`setHTMLUnsafe`, Trusted Types, strict CSP nonces/hashes + `frame-ancestors`, `__Host-`/`__Secure-` + `HttpOnly` + `SameSite=Lax` or `Partitioned`, strict `postMessage` origin validation, `wss://`, SRI/CORS/Referrer-Policy, Passkeys, data minimization and anti-fingerprinting).
4. PWA installability & origin migration (`<install>` / `navigator.install()` with manifest + `beforeinstallprompt` fallback, same-site origin migration).
5. Browser Built-in AI (global `LanguageModel`, `Summarizer`, `Translator`, `LanguageDetector` — never deprecated `window.ai.*`; check `availability()`, `session.destroy()`, `AbortController` on prompt/stream, untrusted output via `textContent`, fallback when unavailable).
6. WebMCP (declarative agentic forms `toolname`/`tooldescription`/`toolautosubmit`, imperative `navigator.modelContext` tool registration with clear schemas/`outputSchema`, confirmation guard on destructive/sensitive flows).
7. WebAssembly via Emscripten (omit default flags & `=1`, `-O3`/`-Os`/`-Oz` + `-flto` for release, `-g` + `-sASSERTIONS` for dev, minimize boundary crossings, run heavy compute in Web Workers, avoid dynamic linking when possible).
8. Chrome Extensions MV3 & Web Store (MV3 service-worker state in `chrome.storage`, re-registering dynamic scripts in `runtime.onInstalled`, least-privilege permissions, `chrome.userScripts` availability guard + `configureWorld({ messaging: true })`, CSP-safe execution, `declarativeNetRequest`, user-benefit store listing copy).

#### Scenario: Built-in AI task avoids deprecated namespace and unsafe DOM sink
- GIVEN a request to add an in-browser summarizer or translator with graceful fallback
- WHEN the agent follows `references/platform.md`
- THEN it checks the global `Summarizer`/`Translator` interface (never `window.ai.*`), checks `availability()`, renders output via `textContent`, cleans up sessions, and provides a fallback

### R4. Enrich existing parts in place without breaking single-statement invariants  [Must]
Existing reference parts SHALL incorporate directly related modern web guidance in their owning part while keeping every part `<= 200` lines and preserving every invariant in `skill-shape.test.mjs`:
- `references/floor.md`: `<search>` landmark, scrollable `<pre><code>` (`tabindex="0"`, `role="region"`), `:user-valid`/`:user-invalid` post-interaction validation, `hidden="until-found"`, OS text scale (`rem` / `env(preferred-text-scale)`), WCAG 2.3.1 three-flashes limit (regardless of reduced-motion preference), Shadow DOM ARIA `id` boundary rule, CSS generated content alt text (`content: "..." / ""`).
- `references/visual.md`: `light-dark()` with `color-scheme`, `color-mix()`, `contrast-color()` (with fallback), `font-size-adjust` for stable fallbacks/mixed fonts, `text-box`/`text-box-trim` optical alignment, `scrollbar-color`/`scrollbar-width` adapting to `prefers-contrast`, CSS `mask-*` cutouts/fades.
- `references/layout.md`: `:has()` (never nested, no pseudo-elements), container size & style queries (`@container`), CSS `subgrid`, CSS Anchor Positioning (`anchor-name`, `position-anchor`, `position-try-fallbacks`, fallback), `overflow: clip`, `field-sizing: content` (with fallback), `@layer`/`@scope`.
- `references/motion.md`: `@starting-style` + `transition-behavior: allow-discrete`, `interpolate-size: allow-keywords`/`calc-size()`, `linear()` easing, scroll-driven animations (`scroll()`/`view()` with progressive enhancement), same-document & cross-document View Transitions (`startViewTransition`, `@view-transition`, `view-transition-class`), `sibling-index()`/`sibling-count()` staggers.
- `references/components.md`: preserve all 23 component entries and zero durations; add `commandfor`/`command`, `<dialog closedby="any">`, `popover="hint"`/interest invokers, customizable `<select>` (`appearance: base-select`), `<input type="checkbox" switch>`, `moveBefore()` state-preserving DOM moves, and concise Web Components orientation (framework components first, kebab-case, `super()` first, `mode: 'open'`, `ElementInternals`, Declarative Shadow DOM, `::part()`).
- `references/performance.md`: CWV targets & heuristics (LCP discovery + `fetchpriority="high"`/`"low"`, `image-set()`, INP task slicing `< 50ms` sync / `50–250ms` `scheduler.yield()` / `> 250ms` Web Worker, `scrollend`, `content-visibility: auto` + `contain-intrinsic-size`, Speculation Rules API, lazy `<video>`/`<audio>` with fallback, out-of-order HTML streaming).
- `references/copy.md`: add `Intl.DurationFormat` alongside `Intl.NumberFormat`/`DateTimeFormat`/`PluralRules`.
- `references/react.md`: framework adaptation for modern HTML/CSS platform features in JSX/SSR (passing new HTML attributes cleanly, SSR guards on `window`/`HTMLElement`, `useId()` for per-instance IDs/`anchor-name`, keeping `:root`/`@starting-style` unscoped, `showModal()`/`moveBefore()` via refs on non-VDOM nodes).

#### Scenario: shape invariants stay green
- GIVEN all 11 parts updated
- WHEN `node --test plugins/mstack-web-ui/tests/skill-shape.test.mjs` runs
- THEN every size limit (`SKILL.md <= 150`, each part `<= 200`, total Markdown `<= 1,500`), zero-URL check, and single-statement check passes

### R5. Updated `SKILL.md` description, routing, and discovery  [Must]
`SKILL.md` (trigger-first, no step summary, `<= 150` lines), `plugins/mstack-auto/skills/mstack-auto/SKILL.md`, and `plugins/mstack-find-skills/skills/mstack-find-skills/references/matching.md` SHALL reflect the upgraded web-platform and Chrome-extension scope of `mstack-web-ui` in their own words.

#### Scenario: routing a web-platform or Chrome extension prompt
- GIVEN a user prompt asking to add a WebMCP tool, sanitize HTML with Trusted Types, or build a Manifest V3 Chrome extension
- WHEN `mstack-auto` matches the routing table
- THEN it routes to `mstack-web-ui`

### R6. Attribution and license compliance  [Must]
`plugins/mstack-web-ui/skills/mstack-web-ui/THIRD_PARTY_NOTICES.md` SHALL add `https://github.com/GoogleChrome/modern-web-guidance` at commit `2b4aa13` (`Apache-2.0`, read 2026-11-27, no `NOTICE` file, pointing to `LICENSE`), and `README.md` › `## Credits` SHALL credit `GoogleChrome/modern-web-guidance` (`Apache-2.0`) for `mstack-web-ui`. `LICENSE` stays identical to the root `LICENSE`.

### R7. Updated shape tests and 2 new comparison eval fixtures  [Must]
`plugins/mstack-web-ui/tests/skill-shape.test.mjs` SHALL enforce all 11 parts (`PARTS` + `'platform'`), all 15 sources (`SOURCES` + `'GoogleChrome/modern-web-guidance'`), and key `platform.md` invariants. Two new eval suites (`modern-platform-and-fallbacks` and `built-in-ai-and-security`) SHALL be added under `plugins/mstack-web-ui/skills/mstack-web-ui/evals/` and run in Phase 5 comparison tests against the `0.2.2` baseline snapshot.

### R8. Packaging, version bumps, checks, and cross-vendor review  [Must]
Bump `mstack-web-ui` `0.2.2` -> `0.3.0`, `mstack-auto` `0.1.5` -> `0.1.6`, `mstack-find-skills` `0.2.12` -> `0.2.13`, and marketplace `metadata.version` `0.16.0` -> `0.16.1` across all manifests and both registries; update `README.md` and `AGENTS.md`; pass `skill-shape.test.mjs`, `check-skill.mjs`, `scan-private.mjs`, `agy plugin validate`, `check-version-bumps.mjs`, `check-marketplace.mjs`, comparison tests, and Phase 8 read-only review via `mstack-vendors` + `mstack-receive-review`.

## Plan (implementation sequence)

1. **Tests first (TDD red):** Update `plugins/mstack-web-ui/tests/skill-shape.test.mjs` for 11 parts (`platform`), 15 sources (`GoogleChrome/modern-web-guidance`), and `platform.md` assertions; run and confirm FAIL.
2. **Author `references/platform.md` and enrich existing parts + `SKILL.md` + `THIRD_PARTY_NOTICES.md`:** Write `references/platform.md` (`<= 200` lines), enrich `floor.md`, `visual.md`, `layout.md`, `motion.md`, `components.md`, `performance.md`, `copy.md`, `react.md`, `review.md`, `SKILL.md`, and `THIRD_PARTY_NOTICES.md`; verify `skill-shape.test.mjs`, `check-skill.mjs`, and `scan-private.mjs` all pass.
3. **Add 2 new eval fixtures & run Phase 5–6 comparison tests:** Create `evals/modern-platform-and-fallbacks/` and `evals/built-in-ai-and-security/`, run `with-new-skill` vs `0.2.2-baseline` subagents (`invoke_subagent` `flash`), grade both runs, and verify measurable improvement.
4. **Package, wire, and sweep:** Bump `mstack-web-ui` (`0.3.0`), `mstack-auto` (`0.1.6`), `mstack-find-skills` (`0.2.13`), and marketplace (`0.16.1`); update `mstack-auto`, `mstack-find-skills`, `README.md`, and `AGENTS.md`; run `check-version-bumps.mjs`, `check-marketplace.mjs`, `agy plugin validate`, `check-skill.mjs`, `scan-private.mjs`, and the outside-the-diff sweep.
5. **Phase 8 read-only review (`mstack-vendors` + `mstack-receive-review`):** Review the complete branch diff against `main`, fix verified findings with tests, re-verify all checks, and deliver the Phase 9 report (without committing until you ask).
