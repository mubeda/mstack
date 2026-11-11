// Tests for scripts/lint-wiki.mjs. Each test builds a throwaway wiki folder and runs the script on it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const script = resolve(dirname(fileURLToPath(import.meta.url)), '../skills/mstack-chief-of-staff/scripts/lint-wiki.mjs');

const INDEX = '# Index\n\n- [Goal](goal.md): the goal and its status\n- [Export flag](export-flag.md): how the export ships\n';
const GOAL = [
  '# Goal: ship the export',
  '',
  '## Done when',
  '',
  '- [ ] The load test passes',
  '- [x] The export has a test (`npm test`, 2026-11-02, 14 passing)',
  '',
  '## Status',
  '',
  '- 2026-11-01: The user handed over the goal. See the [tracker](https://example.com/issues/1) and [the decision](export-flag.md#claims).',
  '',
].join('\n');
const FLAG = [
  '# Export flag',
  '',
  '- 2026-11-03: The export ships behind a flag for now. shop@abc1234',
  '  - Detail lines are not claims.',
  '  (superseded 2026-11-10, see the 2026-11-10 claim)',
  '- 2026-11-10: The export ships without the flag. shop@def5678',
  '',
  '```text',
  '- not a claim, and currently ignored',
  '```',
  '',
].join('\n');
const clean = () => ({ 'index.md': INDEX, 'goal.md': GOAL, 'export-flag.md': FLAG });

function lint(files, ...extra) {
  const dir = mkdtempSync(join(tmpdir(), 'lint-wiki-'));
  for (const [name, text] of Object.entries(files ?? {})) {
    mkdirSync(dirname(join(dir, name)), { recursive: true });
    writeFileSync(join(dir, name), text);
  }
  const args = files === null ? extra : [dir, ...extra];
  const r = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
  return { code: r.status, out: r.stdout + r.stderr };
}

test('a clean wiki passes, with a page linked only from the index', () => {
  const r = lint(clean());
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /lint-wiki: ok \(3 pages\)/);
});

test('an orphan page is reported, and also as not in the index', () => {
  const r = lint({ ...clean(), 'lost.md': '# Lost\n\n- 2026-11-01: Nobody links here.\n' });
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /lost\.md:1 {2}orphan/);
  assert.match(r.out, /lost\.md:1 {2}not-in-index/);
});

test('a page linked from another page but not from the index is not-in-index only', () => {
  const files = clean();
  files['goal.md'] += '- 2026-11-02: See [notes](notes.md).\n';
  files['notes.md'] = '# Notes\n\n- 2026-11-02: A note.\n';
  const r = lint(files);
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /notes\.md:1 {2}not-in-index/);
  assert.doesNotMatch(r.out, /orphan/);
});

test('a broken link is reported with its line', () => {
  const files = clean();
  files['goal.md'] += '- 2026-11-02: See [gone](gone.md).\n';
  const r = lint(files);
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /goal\.md:11 {2}broken-link {2}gone\.md/);
});

test('a top-level entry without a date is an undated claim', () => {
  const files = clean();
  files['export-flag.md'] += '- The export is fast.\n';
  const r = lint(files);
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /export-flag\.md:11 {2}undated-claim/);
});

test('each present expression is reported, one of them in the index', () => {
  const files = clean();
  files['index.md'] += '- [Goal again](goal.md): what we do now\n';
  files['export-flag.md'] += '- 2026-11-11: The flag is Currently off.\n- 2026-11-11: At the moment it is off.\n- 2026-11-11: It is off at present.\n';
  const r = lint(files);
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /index\.md:5 {2}present-word {2}now/);
  assert.match(r.out, /export-flag\.md:11 {2}present-word {2}currently/i);
  assert.match(r.out, /export-flag\.md:12 {2}present-word {2}at the moment/i);
  assert.match(r.out, /export-flag\.md:13 {2}present-word {2}at present/);
  assert.match(r.out, /lint-wiki: 4 problem\(s\) in 3 page\(s\)/);
});

test('an undated, an incomplete and a mid-claim superseded mark do not hide a present word', () => {
  const files = clean();
  files['export-flag.md'] += [
    '- 2026-11-11: It works now (superseded later)',
    '- 2026-11-11: It works now (superseded 2026-11-12',
    '- 2026-11-11: It works now (superseded 2026-11-12, see the next claim) and more text',
    '',
  ].join('\n');
  const r = lint(files);
  assert.equal(r.code, 1, r.out);
  for (const line of [11, 12, 13]) assert.match(r.out, new RegExp(`export-flag\\.md:${line} {2}present-word`));
});

test('a present word inside backticks is code, not a claim about the present', () => {
  const files = clean();
  files['export-flag.md'] += '- 2026-11-11: As of shop@abc1234, the export stamps rows with `Date.now()`.\n';
  const r = lint(files);
  assert.equal(r.code, 0, r.out);
});

test('links in angle brackets and with parentheses resolve, and a missing one is reported', () => {
  const files = clean();
  files['index.md'] += '- [Notes](<release notes.md>): notes\n- [V2](release(v2).md): the second release\n';
  files['release notes.md'] = '# Notes\n\n- 2026-11-02: A note.\n';
  files['release(v2).md'] = '# V2\n\n- 2026-11-02: A note.\n';
  assert.equal(lint(files).code, 0, lint(files).out);
  files['goal.md'] += '- 2026-11-02: See [gone](<missing page.md>).\n';
  const r = lint(files);
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /goal\.md:11 {2}broken-link {2}missing page\.md/);
});

test('a malformed percent escape is a broken link, not a crash', () => {
  const files = clean();
  files['goal.md'] += '- 2026-11-02: See [half](50%.md).\n';
  const r = lint(files);
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /goal\.md:11 {2}broken-link {2}50%\.md/);
  assert.match(r.out, /lint-wiki: 1 problem/);
});

test('a superseded mark that ends in a link still exempts the claim', () => {
  const files = clean();
  files['export-flag.md'] += '- 2026-11-01: It works now (superseded 2026-11-02, see [the goal](goal.md))\n';
  assert.equal(lint(files).code, 0, lint(files).out);
});

test('a wiki without a goal page says so', () => {
  const files = clean();
  delete files['goal.md'];
  files['index.md'] = '# Index\n\n- [Export flag](export-flag.md): how the export ships\n';
  const r = lint(files);
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /index\.md:1 {2}no-goal-page/);
});

test('a folder without an index exits 2 and reports nothing else', () => {
  const r = lint({ 'notes.md': '- undated and currently wrong\n' });
  assert.equal(r.code, 2, r.out);
  assert.match(r.out, /lint-wiki: no index\.md in /);
  assert.doesNotMatch(r.out, /undated-claim|present-word/);
});

test('no argument and a missing folder exit 2', () => {
  assert.equal(lint(null).code, 2);
  assert.equal(lint(null, join(tmpdir(), 'lint-wiki-does-not-exist')).code, 2);
});
