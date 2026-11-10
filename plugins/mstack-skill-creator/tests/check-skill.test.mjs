// Tests for scripts/check-skill.mjs. Each test builds a skill folder in a temporary directory.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const script = resolve(dirname(fileURLToPath(import.meta.url)), '../skills/mstack-skill-creator/scripts/check-skill.mjs');
const GOOD = 'Use when the user wants a changelog entry written. Produces one entry.';
const skillFile = (fm, body = '# Demo\n\nText.\n') => `---\n${fm}\n---\n\n${body}`;

function run(files, folder = 'demo-skill') {
  const dir = join(mkdtempSync(join(tmpdir(), 'check-skill-')), folder);
  mkdirSync(dir, { recursive: true });
  for (const [name, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, name)), { recursive: true });
    writeFileSync(join(dir, name), text);
  }
  const r = spawnSync(process.execPath, [script, dir], { encoding: 'utf8' });
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
}
const ok = (fm, body) => ({ 'SKILL.md': skillFile(fm, body) });

test('a clean skill passes', () => {
  const r = run(ok(`name: demo-skill\ndescription: ${GOOD}`));
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /skill check passed/);
});
test('missing SKILL.md fails', () => {
  const r = run({ 'README.md': 'x' });
  assert.equal(r.status, 1); assert.match(r.out, /FAIL .*SKILL\.md/);
});
test('unclosed frontmatter fails', () => {
  const r = run({ 'SKILL.md': `---\nname: demo-skill\ndescription: ${GOOD}\n# no end\n` });
  assert.equal(r.status, 1); assert.match(r.out, /FAIL .*frontmatter/);
});
test('name with an uppercase letter fails', () => {
  const r = run(ok(`name: Demo-skill\ndescription: ${GOOD}`), 'Demo-skill');
  assert.equal(r.status, 1); assert.match(r.out, /FAIL .*name/);
});
test('name of 65 characters fails', () => {
  const n = 'a'.repeat(65);
  const r = run(ok(`name: ${n}\ndescription: ${GOOD}`), n);
  assert.equal(r.status, 1); assert.match(r.out, /FAIL .*64/);
});
test('name different from the folder fails', () => {
  const r = run(ok(`name: other-skill\ndescription: ${GOOD}`));
  assert.equal(r.status, 1); assert.match(r.out, /FAIL .*folder/);
});
test('missing description fails', () => {
  const r = run(ok('name: demo-skill'));
  assert.equal(r.status, 1); assert.match(r.out, /FAIL .*description/);
});
test('description of 1025 characters fails', () => {
  const r = run(ok(`name: demo-skill\ndescription: Use when ${'x'.repeat(1016)}`));
  assert.equal(r.status, 1); assert.match(r.out, /FAIL .*1024/);
});
test('description that does not start with Use when fails', () => {
  const r = run(ok('name: demo-skill\ndescription: Writes changelog entries.'));
  assert.equal(r.status, 1); assert.match(r.out, /FAIL .*Use when/);
});
test('an extra frontmatter field warns and passes', () => {
  const r = run(ok(`name: demo-skill\ndescription: ${GOOD}\npaths: "*.md"`));
  assert.equal(r.status, 0, r.out); assert.match(r.out, /WARN .*paths/);
});
test('a named reference file that is missing fails', () => {
  const r = run(ok(`name: demo-skill\ndescription: ${GOOD}`, 'Read references/x.md first.\n'));
  assert.equal(r.status, 1); assert.match(r.out, /FAIL .*references\/x\.md/);
});
test('path with a placeholder prefix is skipped', () => {
  const r = run(ok(`name: demo-skill\ndescription: ${GOOD}`, 'For example `<skill>/scripts/x.py`.\n'));
  assert.equal(r.status, 0, r.out);
});
test('a nested SKILL.md fails', () => {
  const r = run({ ...ok(`name: demo-skill\ndescription: ${GOOD}`), 'evals/case/SKILL.md': 'x' });
  assert.equal(r.status, 1); assert.match(r.out, /FAIL .*nested/);
});
test('a host tool name outside a table row fails, inside a row passes', () => {
  const fm = `name: demo-skill\ndescription: ${GOOD}`;
  const bad = run(ok(fm, 'Ask with AskUserQuestion.\n'));
  assert.equal(bad.status, 1); assert.match(bad.out, /FAIL .*host tool/);
  const good = run(ok(fm, '| Role | Claude Code |\n|---|---|\n| question tool | `AskUserQuestion` |\n'));
  assert.equal(good.status, 0, good.out);
});

// Added by task 1.4, after the plan review.
test('a missing nested scripts file fails', () => {
  const r = run(ok(`name: demo-skill\ndescription: ${GOOD}`, 'Run scripts/vendor/tool/run.py first.\n'));
  assert.equal(r.status, 1); assert.match(r.out, /FAIL .*scripts\/vendor\/tool\/run\.py/);
});
test('a missing ./scripts file fails', () => {
  const r = run(ok(`name: demo-skill\ndescription: ${GOOD}`, 'Run ./scripts/run.py first.\n'));
  assert.equal(r.status, 1); assert.match(r.out, /FAIL .*scripts\/run\.py/);
});
test('an existing nested file passes', () => {
  const r = run({ ...ok(`name: demo-skill\ndescription: ${GOOD}`, 'Run scripts/vendor/tool/run.py first.\n'), 'scripts/vendor/tool/run.py': 'print(1)\n' });
  assert.equal(r.status, 0, r.out);
});
test('a parent-folder link fails', () => {
  const r = run(ok(`name: demo-skill\ndescription: ${GOOD}`, 'See [the guide](../other/guide.md).\n'));
  assert.equal(r.status, 1); assert.match(r.out, /FAIL .*outside the skill folder/);
});
test('501 lines warn and pass', () => {
  const r = run(ok(`name: demo-skill\ndescription: ${GOOD}`, 'line\n'.repeat(501)));
  assert.equal(r.status, 0, r.out); assert.match(r.out, /WARN .*lines/);
});
test('a 64-character name and a 1024-character description pass', () => {
  const n = 'a'.repeat(64);
  const d = `Use when ${'x'.repeat(1015)}`;
  assert.equal(d.length, 1024);
  const r = run(ok(`name: ${n}\ndescription: ${d}`), n);
  assert.equal(r.status, 0, r.out);
});

// Added after the branch review.
test('a plain description with ": " fails, because YAML rejects it', () => {
  const r = run(ok('name: demo-skill\ndescription: Use when asked: produces a note.'));
  assert.equal(r.status, 1); assert.match(r.out, /FAIL .*YAML/);
});
test('a folded block description is read and passes', () => {
  const r = run(ok('name: demo-skill\ndescription: >-\n  Use when the user wants a note.\n  Produces one note.'));
  assert.equal(r.status, 0, r.out);
});
test('a quoted description with ": " passes', () => {
  const r = run(ok('name: demo-skill\ndescription: "Use when asked: produces a note."'));
  assert.equal(r.status, 0, r.out);
});
test('a path that climbs out through a subfolder fails even when the target exists', () => {
  const r = run(ok(`name: demo-skill\ndescription: ${GOOD}`, 'Read `scripts/../../shared.md`.\n'));
  assert.equal(r.status, 1); assert.match(r.out, /FAIL .*outside the skill folder/);
});
