// Tests for the shape of the mstack-web-ui skill: its size limits, its parts, what kinds of file it may hold,
// its notices, and that a subject has one value. The skill is text, so these read files and run nothing.
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const skill = resolve(here, '../skills/mstack-web-ui');
const root = resolve(here, '../../..');
const PARTS = ['floor', 'direction', 'visual', 'layout', 'motion', 'copy', 'performance', 'react', 'review', 'components', 'platform'];
// The components of the part on component choice: each is the bold start of exactly one entry there.
const COMPONENTS = ['Disclosure', 'Accordion', 'Tabs', 'Dialog', 'Alert dialog', 'Popover', 'Tooltip', 'Drawer',
  'Radio group', 'Checkbox', 'Switch', 'Select', 'Combobox', 'Listbox', 'Slider', 'Alert', 'Status message',
  'Navigation links', 'Menu', 'Breadcrumb', 'Pagination', 'Carousel', 'Tree view'];
const SOURCES = ['Nutlope/hallmark', 'emilkowalski/skills', 'jakubkrehel/make-interfaces-feel-better',
  'nextlevelbuilder/ui-ux-pro-max-skill', 'Leonxlnx/taste-skill', 'vercel-labs/web-interface-guidelines',
  'vercel-labs/agent-skills', 'benjitaylor/skills', 'w3c/aria-practices', 'w3c/wcag', 'inbn/component-gallery',
  'magicuidesign/magicui', 'DavidHDev/react-bits', 'juliangarnier/anime', 'GoogleChrome/modern-web-guidance'];

const read = (rel) => readFileSync(join(skill, rel), 'utf8');
const lines = (rel) => read(rel).replace(/\n$/, '').split('\n').length;
// Every file of the skill outside evals/, as paths relative to the skill folder.
function files() {
  const out = [];
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) { if (relative(skill, p) !== 'evals') walk(p); } else out.push(relative(skill, p));
    }
  };
  walk(skill);
  return out.sort();
}
const ruleText = () => ['SKILL.md', ...PARTS.map((p) => `references/${p}.md`)].map(read).join('\n');

test('(a) SKILL.md has at most 150 lines', () => {
  assert.ok(lines('SKILL.md') <= 150, `${lines('SKILL.md')} lines`);
});

test('(b) each of the eleven parts exists and has at most 200 lines', () => {
  for (const p of PARTS) {
    const rel = `references/${p}.md`;
    assert.ok(existsSync(join(skill, rel)), `${rel} is missing`);
    assert.ok(lines(rel) <= 200, `${rel}: ${lines(rel)} lines`);
  }
});

test('(c) the Markdown of the skill has at most 1,500 lines together', () => {
  const md = files().filter((f) => f.endsWith('.md'));
  assert.ok(md.includes('SKILL.md'), 'SKILL.md is missing');
  const total = md.reduce((n, f) => n + lines(f), 0);
  assert.ok(total <= 1500, `${total} lines`);
});

test('(d) SKILL.md names each part, and references/ holds no other file', () => {
  const main = read('SKILL.md');
  for (const p of PARTS) assert.ok(main.includes(`references/${p}.md`), `SKILL.md does not name references/${p}.md`);
  assert.deepEqual(readdirSync(join(skill, 'references')).sort(), PARTS.map((p) => `${p}.md`).sort());
});

test('(e) outside evals/ the skill holds only Markdown files and the license', () => {
  const all = files();
  assert.ok(all.includes('SKILL.md'), 'SKILL.md is missing');
  assert.deepEqual(all.filter((f) => !f.endsWith('.md') && f !== 'LICENSE'), []);
});

test('(f) the rules name no address to fetch anything from', () => {
  assert.deepEqual(ruleText().match(/https?:\/\/\S+/g) ?? [], []);
});

test('(g) the notices name all fifteen sources', () => {
  const notices = read('THIRD_PARTY_NOTICES.md');
  for (const s of SOURCES) assert.ok(notices.includes(s), `${s} is not named`);
});

test('(h) the press scale is stated once, in the motion part, and the target sizes only in the floor part', () => {
  const partFiles = ['SKILL.md', ...PARTS.map((p) => `references/${p}.md`)];
  // Only lines about pressing count: an entrance may start from another scale.
  // A line about pressing, or the block of an :active rule whose declaration stands on a later line.
  const scales = partFiles.flatMap((f) => [
    ...read(f).split('\n').filter((l) => /press|:active/i.test(l)).flatMap((l) => l.match(/scale\(0\.\d+\)/g) ?? []),
    ...[...read(f).matchAll(/:active[^{}\n]*\{\s*\n[^}]*?(scale\(0\.\d+\))/g)].map((m) => m[1]),
  ].map((m) => `${f}: ${m}`));
  assert.equal(scales.length, 1, `press scales: ${scales.join('; ') || 'none'}`);
  assert.match(scales[0], /^references\/motion\.md: /);
  // Only lines about a target count: a picture may have any size.
  const sizes = partFiles.flatMap((f) => read(f).split('\n').filter((l) => /target/i.test(l))
    .flatMap((l) => l.match(/\b\d+\s*(?:px)?\s*(?:by|x|×)\s*\d+\s*px/gi) ?? []).map((m) => `${f}: ${m}`));
  assert.deepEqual(sizes.sort(), ['references/floor.md: 24 by 24 px', 'references/floor.md: 44 by 44 px']);
});

test('(i) the license is the root license', () => {
  assert.ok(readFileSync(join(skill, 'LICENSE')).equals(readFileSync(join(root, 'LICENSE'))));
});

test('(j) the component part gives no duration, and the five-second limit is stated in the floor part only', () => {
  assert.deepEqual(read('references/components.md').match(/\d+\s*ms\b/g) ?? [], [], 'references/components.md gives a duration');
  // The whole quantity: "0.5s" and "1.5 seconds" are other values.
  const limit = /(?<![\d.,\w-])(?:five|5)[ -]?(?:seconds?|s)\b|(?<![\d.,])5[,.]?000\s*(?:ms|milliseconds?)\b/gi;
  for (const [text, n] of [['twenty-five seconds', 0], ['0.5s', 0], ['1.5 seconds', 0], ['five seconds', 1], ['5,000 ms', 1], ['5000 milliseconds', 1]]) {
    assert.equal((text.match(limit) ?? []).length, n, `the pattern on "${text}"`);
  }
  assert.equal((read('references/floor.md').match(limit) ?? []).length, 1, 'the floor part states the limit once');
  for (const f of ['SKILL.md', ...PARTS.filter((p) => p !== 'floor').map((p) => `references/${p}.md`)]) {
    const hit = read(f).split('\n').find((l) => l.match(limit));
    assert.equal(hit, undefined, `${f} restates the limit: ${hit}`);
  }
});

test('(l) the component part has exactly one entry for each of the 23 components', () => {
  const starts = (read('references/components.md').match(/^- \*\*[^*]+\*\*/gm) ?? [])
    .map((m) => m.replace(/^- \*\*|\*\*$/g, '').replace(/[.:]$/, ''));
  for (const c of COMPONENTS) assert.equal(starts.filter((s) => s === c).length, 1, `entries for "${c}"`);
  assert.equal(starts.length, COMPONENTS.length, `entries: ${starts.join(', ')}`);
});

test('(k) the motion part has its sections on a requested effect and on an animation library, and the report has its Effects line', () => {
  const heads = read('references/motion.md').split('\n').filter((l) => l.startsWith('## '));
  assert.ok(heads.some((h) => h.includes('asked for')), 'no section on an effect the user asked for');
  assert.ok(heads.some((h) => h.includes('animation library')), 'no section on an animation library');
  // In the section on the report, with or without backticks.
  const report = read('SKILL.md').split(/^## /m).find((s) => s.startsWith('The report of a build')) ?? '';
  assert.match(report, /Add the line `?Effects:`?/, 'the report section does not tell to add the Effects line');
});

test('(m) the platform part covers Baseline fallbacks, JS, security, PWA, Built-in AI, WebMCP, Wasm, and Chrome Extensions MV3, and review.md lists it', () => {
  const plat = read('references/platform.md');
  for (const needle of ['Baseline', 'structuredClone', 'setHTML', 'Trusted Types', 'Passkey', 'navigator.install', 'LanguageModel', 'WebMCP', 'WebAssembly', 'Manifest V3']) {
    assert.ok(plat.includes(needle), `references/platform.md missing "${needle}"`);
  }
  // Baseline Newly Available / limited features must require feature detection and a fallback.
  assert.match(plat, /Newly Available[^\n]*feature detection[^\n]*fallback/i, 'references/platform.md must require feature detection and fallback for Newly Available features');
  // Deprecated window.ai.* must appear only as prohibited, never recommended.
  assert.match(plat, /never[^\n]*`?window\.ai(?:\.\*)?`?/i, 'references/platform.md must prohibit window.ai');
  // postMessage sender authorization must not equate isSameSite() with origin validation.
  assert.doesNotMatch(plat, /isSameOrigin\(\)\s*\/\s*isSameSite\(\)/, 'references/platform.md must not equate isSameSite() with origin validation');
  // WebMCP must prefer document.modelContext (with navigator.modelContext only as legacy fallback).
  assert.match(plat, /document\.modelContext/, 'references/platform.md must feature-detect document.modelContext for WebMCP');
  // Built-in AI cancellation must cover create() as well as generation/streaming, not exclude create().
  assert.doesNotMatch(plat, /\(not `?create\(\)`?\)/i, 'references/platform.md must allow AbortController cancellation during create()');
  // Built-in AI iframe delegation must cover API-specific tokens (not only language-model).
  assert.match(plat, /summarizer/i, 'references/platform.md must name API-specific Built-in AI permission tokens');
  // PWA manifest recipe must include explicit id for navigator.install().
  assert.match(plat, /manifest[^\n]*`id`/i, 'references/platform.md must require an explicit manifest id for navigator.install()');
  assert.ok(read('references/review.md').includes('platform.md'), 'references/review.md does not reference platform.md');
});
