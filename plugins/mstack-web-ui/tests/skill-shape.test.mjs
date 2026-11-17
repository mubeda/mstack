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
const PARTS = ['floor', 'direction', 'visual', 'layout', 'motion', 'copy', 'performance', 'react', 'review'];
const SOURCES = ['Nutlope/hallmark', 'emilkowalski/skills', 'jakubkrehel/make-interfaces-feel-better',
  'nextlevelbuilder/ui-ux-pro-max-skill', 'Leonxlnx/taste-skill', 'vercel-labs/web-interface-guidelines',
  'vercel-labs/agent-skills', 'benjitaylor/skills'];

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

test('(b) each of the nine parts exists and has at most 200 lines', () => {
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

test('(g) the notices name all eight sources', () => {
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
