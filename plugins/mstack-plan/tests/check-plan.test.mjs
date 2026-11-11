// Tests for scripts/check-plan.mjs: the Executor line of progress.md accepts the five executors, and a plan written
// before an executor line existed still passes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const skill = resolve(dirname(fileURLToPath(import.meta.url)), '../skills/mstack-plan');
const script = join(skill, 'scripts/check-plan.mjs');
const sample = join(skill, 'evals/_fixture/sample-plan');

function check(executor) {
  const dir = join(mkdtempSync(join(tmpdir(), 'plan-check-')), 'plan');
  cpSync(sample, dir, { recursive: true });
  const progress = join(dir, 'progress.md');
  if (executor !== undefined) {
    const text = readFileSync(progress, 'utf8').replace(/^(Plan status:.*)$/m, `$1\nExecutor: ${executor}`);
    writeFileSync(progress, text);
    assert.match(readFileSync(progress, 'utf8'), new RegExp(`^Executor: ${executor}$`, 'm'));
  } else {
    assert.doesNotMatch(readFileSync(progress, 'utf8'), /^Executor:/m);
  }
  const r = spawnSync(process.execPath, [script, dir], { encoding: 'utf8' });
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
}

test('a plan with no Executor line, as written before the line existed, passes', () => {
  const r = check(undefined);
  assert.equal(r.status, 0, r.out);
});

for (const value of ['none', 'inline', 'mstack-codex-review-workflow', 'mstack-claude-review-workflow', 'mstack-claude-pm-codex-dev']) {
  test(`Executor: ${value} passes`, () => {
    const r = check(value);
    assert.equal(r.status, 0, r.out);
  });
}

test('an unknown executor fails with a line that names all five allowed values', () => {
  const r = check('something-else');
  assert.equal(r.status, 1, r.out);
  const line = r.out.split('\n').find((l) => l.includes('Executor "something-else"'));
  assert.ok(line, r.out);
  for (const value of ['none', 'inline', 'mstack-codex-review-workflow', 'mstack-claude-review-workflow', 'mstack-claude-pm-codex-dev']) {
    assert.ok(line.includes(value), `${value} missing from: ${line}`);
  }
});
