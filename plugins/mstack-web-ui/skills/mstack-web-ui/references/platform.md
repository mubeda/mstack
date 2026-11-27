# Web platform, security and capabilities

Read this when the work touches browser support and fallbacks, modern client-side JavaScript or dates, web security, privacy, Passkeys, PWA install or origin migration, browser Built-in AI, WebMCP, WebAssembly, or Chrome Extensions (Manifest V3).

## 1. Browser support and Baseline fallbacks

- **Baseline Widely Available** features are safe to use without fallbacks.
- **Newly Available or limited features** require feature detection (`@supports`, `CSS.supports()`, or a runtime check such as `'prop' in obj`) and a working fallback or graceful degradation unless the user sets a custom browser-support policy (for example a specific Baseline year or browser floor).
- When a user targets a restricted runtime (such as Electron or Tauri) or hesitates over polyfill cost, note the browser-support assumption in the report so it can be recorded in project instructions.
- Do not add a polyfill package without the user's yes (`SKILL.md`, rule 4); prefer lightweight native fallbacks or progressive enhancement.

## 2. Modern JavaScript and dates

- **Deep cloning:** Prefer `structuredClone(value)` over `JSON.parse(JSON.stringify(value))` for in-memory structured state (preserves cyclic references, `Date`, `RegExp`, `Map`, `Set`, `BigInt`, `Error`, typed arrays, and supports `{ transfer: [buffer] }`). Keep JSON serialization when JSON wire normalization is intended; never pass functions, DOM nodes, or symbols to `structuredClone()`, and do not expect it to preserve custom class prototypes or `#private` fields.
- **Non-mutating array updates:** Prefer `toSorted()`, `toReversed()`, `toSpliced()`, `with(index, value)`, `findLast()`, and `findLastIndex()` over copy-then-mutate chains. Keep `[...iterable]` for non-Array iterables (`Set`, `NodeList`, strings); note that copying methods turn sparse holes into `undefined`, and `findLastIndex()` passes the original forward index.
- **Grouping:** Use `Object.groupBy()` for string/symbol keys and `Map.groupBy()` for object or non-string primitive keys. `Object.groupBy()` returns a `null`-prototype object: check keys with `Object.hasOwn(groups, key)` or `groups[key] ?? []`, never `groups.hasOwnProperty()`. Keep `.reduce()` when simultaneously transforming items or computing scalar aggregates.
- **Async coordination:** Use `Promise.withResolvers()` when resolve/reject must be settled outside the executor (wrapping synchronous setup in `try`/`catch` calling `reject(err)`), and keep `new Promise(...)` for self-contained executors. Use `AbortSignal.timeout(ms)` for deadlines and `AbortSignal.any([controller.signal, AbortSignal.timeout(ms)])` for combined user + timeout cancellation, handling both `TimeoutError` and `AbortError`.
- **Dates and timezones:** Prefer `Temporal` (`Temporal.PlainDate`, `Temporal.PlainDateTime`, `Temporal.ZonedDateTime`, `Temporal.Instant`, and calendar-aware APIs) over error-prone `Date` arithmetic for civil dates, timezone conversions, durations, and high-precision timestamp sorting. Feature-detect `'Temporal' in globalThis` and fall back to a polyfill (with user consent) or explicit UTC/ISO + `Intl.DateTimeFormat` when unsupported.

## 3. Web security and privacy

- **Secure contexts and transport:** Serve over HTTPS; stage `Strict-Transport-Security` from a short `max-age` up to one year before enabling `includeSubDomains; preload`. Use `wss:` for non-local WebSocket endpoints.
- **Safe DOM sinks:** Write plain text with `textContent`, never `innerHTML` or `setHTMLUnsafe` with untrusted input. Use the Sanitizer API (`element.setHTML()` or `Document.parseHTML()`, with feature detection and a vetted sanitizer fallback where unsupported) when inserting untrusted HTML, or build nodes with `document.createElement()`. Enforce Trusted Types (`require-trusted-types-for 'script'`) to block DOM XSS sinks where supported.
- **Headers and framing:** Prefer strict CSP with per-request nonces or hashes (never `'unsafe-inline'` scripts). Block unwanted framing with `Content-Security-Policy: frame-ancestors 'none'` plus `X-Frame-Options: DENY` (or `'self'` / `SAMEORIGIN`); omit `X-Frame-Options` only when allowing specific cross-origin `frame-ancestors`. Stage strict policies with `-Report-Only` and `Reporting-Endpoints` on existing production sites.
- **Cookies:** Name single-origin session cookies with `__Host-` (`Secure`, `Path=/`, no `Domain`), or `__Secure-` when subdomains must share them; set `HttpOnly` and `SameSite=Lax` by default. For cross-site embedded iframes use `SameSite=None; Secure; Partitioned` rather than unpartitioned third-party cookies.
- **Window messaging and origins:** Always authorize incoming `message` senders with strict `event.origin` allowlist equality or `Origin.prototype.isSameOrigin()` (checking `origin.opaque` where relevant)—never treat `isSameSite()` as an origin check, because sibling subdomains and other ports are same-site. Pass an explicit target origin instead of `*` for sensitive `postMessage` calls, and validate payload fields before touching the DOM.
- **External subresources:** Pin immutable third-party scripts, stylesheets, and preloads with Subresource Integrity (`integrity`), explicit `crossorigin`, and a conservative `Referrer-Policy` (`strict-origin-when-cross-origin` or `no-referrer`).
- **Passkeys:** Feature-detect with `PublicKeyCredential.getClientCapabilities()` and `parseCreationOptionsFromJSON()`/`parseRequestOptionsFromJSON()` (with fallbacks where absent). Offer conditional create after sign-in, support immediate/autofill sign-in, sync credential changes with the Signal API, and never rely on AAGUID alone as a security boundary.
- **Privacy by default:** Collect only the data the feature needs, audit third-party scripts, set `Referrer-Policy` and `Permissions-Policy`, and avoid browser fingerprinting or parsing reduced User-Agent strings when User-Agent Client Hints or feature detection answer the question.

## 4. PWA installability and origin migration

- Provide a valid web app manifest (`id`, `name`, `short_name`, `start_url`, `display`, icons) over HTTPS, with a stable, explicit, same-origin `id` required by current-document `navigator.install()`.
- Where supported, prefer the declarative `<install>` element or `navigator.install()` (invoked from transient user activation) with explicit error/success handling, falling back to `beforeinstallprompt` (where available) or clear manual browser-install guidance.
- When migrating an installed web app to a new origin, verify same-site status, configure the destination manifest, authorize migration from the old origin, and provide a manual reinstallation fallback for browsers without automated migration.

## 5. Browser Built-in AI

- Access Built-in AI only through the standard global interfaces (`LanguageModel`, `Summarizer`, `Translator`, `LanguageDetector`), never the deprecated `window.ai.*` namespace.
- Always feature-detect the global interface, check `availability()` before creating a session, handle downloadable model progress cleanly, and provide a server or graceful non-AI fallback when the browser or hardware does not support on-device models.
- Always call `session.destroy()` when done to release memory; pass a fresh `AbortController` signal to both `create()` and generation or streaming calls so users can cancel during model setup as well as generation without starting work after stop; wrap `create()`, prompting, streaming loops, and `JSON.parse()` in `try`/`catch` with clear UI error feedback.
- Treat all model output as untrusted data: render with `textContent`, never `innerHTML`, and delegate cross-origin iframe access using only the API-specific permission token the embedded feature uses (`allow="language-model"`, `allow="summarizer"`, `allow="translator"`, or `allow="language-detector"`, with matching `Permissions-Policy` directives).

## 6. WebMCP (agentic web interfaces)

- **Declarative agentic forms:** Expose suitable HTML forms to agents with `toolname`, `tooldescription`, and optional `toolautosubmit`, handling submissions cleanly in JavaScript and styling active/submitted states in CSS. Avoid exposing destructive, payment, or sensitive authentication forms for unattended auto-submission.
- **Imperative JavaScript tools:** Feature-detect `document.modelContext` first (retaining `navigator.modelContext` only as an older-browser fallback), `await` registration of focused tools with unambiguous names, clear parameter descriptions, explicit schemas, and declared `outputSchema`, and pass a registration `AbortSignal` (or unregister on component/view unmount) for cleanup. Keep user confirmation in place for irreversible actions.

## 7. WebAssembly (C/C++ with Emscripten)

- Omit flags already enabled by default and omit `=1` on boolean `-s` flags (write `-sSTRICT`, not `-sSTRICT=1`); prefer standard compiler flags (`-O3`, `-Os`, `-Oz`, `-flto` for release; `-g` and `-sASSERTIONS` for dev) and response files for long export lists.
- Compile `.c`/`.cpp` files separately and link into an ES module; minimize frequent small JS-to-Wasm boundary crossings by batching work across linear memory.
- Run heavy Wasm workloads in a Web Worker to avoid blocking the main thread, watch stack limits on recursive code, and avoid dynamic linking unless strictly necessary.

## 8. Chrome Extensions (Manifest V3)

- **Manifest V3 only:** Treat the background service worker as ephemeral—never store durable state in memory globals; persist state in `chrome.storage`. Distinguish volatile registrations cleared on extension update (such as dynamic user scripts and session rules, re-registered in `runtime.onInstalled`) from persistent dynamic `declarativeNetRequest` rules: read existing IDs with `getDynamicRules()` and reconcile `removeRuleIds` and `addRules` in one `updateDynamicRules()` call so duplicate IDs do not reject the batch.
- **Permissions and execution:** Request least-privilege permissions (`activeTab`, optional permissions) and use `declarativeNetRequest` instead of blocking `webRequest`. Never execute remote code or `eval` (follow strict extension CSP).
- **User scripts:** Always guard `chrome.userScripts` with an availability check (`isUserScriptsAvailable()`) before property access, show clear setup UI when disabled, persist script configs in `chrome.storage`, use `configureWorld({ messaging: true })` with `runtime.onUserScriptMessage` for messaging, keep each `js` entry to one of `code` or `file`, and never start a script `id` with `_`.
- **UI surfaces and store listing:** Follow `floor.md` and `components.md` inside popups, side panels, and DevTools panels. In Chrome Web Store copy, describe user benefits rather than implementation details, and keep permissions, privacy disclosures, and screenshots aligned with manifest changes.
