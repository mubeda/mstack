// Tests for scripts/check-plan.mjs: the Executor line of progress.md accepts the five executors, and a plan written
// before an executor line existed still passes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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

test('a plan folder without receiving-review.md passes, because mstack-receive-review holds the review rules', () => {
  const dir = join(mkdtempSync(join(tmpdir(), 'plan-check-')), 'plan');
  cpSync(sample, dir, { recursive: true });
  rmSync(join(dir, 'receiving-review.md'), { force: true });
  const r = spawnSync(process.execPath, [script, dir], { encoding: 'utf8' });
  assert.equal(r.status, 0, `${r.stdout}${r.stderr}`);
});

// A start file with a planning-time placeholder left in it fails, for every host label and helper slot.
function checkStartFile(extra) {
  const dir = join(mkdtempSync(join(tmpdir(), 'plan-check-')), 'plan');
  cpSync(sample, dir, { recursive: true });
  const file = join(dir, 'execute-plan.md');
  writeFileSync(file, `${readFileSync(file, 'utf8')}\n${extra}\n`);
  const r = spawnSync(process.execPath, [script, dir], { encoding: 'utf8' });
  rmSync(dirname(dir), { recursive: true, force: true });
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
}
for (const left of ['<Claude Code | Codex | Antigravity>', '<Codex | Claude | a same-vendor subagent>', '<cheap helper: antigravity>', '<standard helper: antigravity>', '<fallback reviewer: antigravity>', '<cheap helper: codex>']) {
  test(`an unfilled ${left} in execute-plan.md fails`, () => {
    const r = checkStartFile(`- Left over: ${left}`);
    assert.equal(r.status, 1, r.out);
    assert.match(r.out, /unfilled placeholder/);
  });
}
test('a start file that says none (planned in Codex) for an Antigravity slot passes', () => {
  const r = checkStartFile('on none (planned in Codex) for a cheap helper');
  assert.equal(r.status, 0, r.out);
});

// The host-choice labels and the helper and reviewer slots belong to the start file: a plan may quote them elsewhere.
test('a phase file that quotes a host choice passes; the same text left in execute-plan.md fails', () => {
  const quote = 'The line says <Claude Code | Codex | Antigravity> and <cheap helper: antigravity>.';
  const dir = join(mkdtempSync(join(tmpdir(), 'plan-check-')), 'plan');
  cpSync(sample, dir, { recursive: true });
  const phase = join(dir, 'phases', 'PHASE-01-greet.md');
  writeFileSync(phase, `${readFileSync(phase, 'utf8')}\n${quote}\n`);
  const inPhase = spawnSync(process.execPath, [script, dir], { encoding: 'utf8' });
  rmSync(dirname(dir), { recursive: true, force: true });
  assert.equal(inPhase.status, 0, `${inPhase.stdout}${inPhase.stderr}`);
  const inStart = checkStartFile(quote);
  assert.equal(inStart.status, 1, inStart.out);
  assert.match(inStart.out, /execute-plan\.md: unfilled placeholder/);
});
test('a general planning placeholder left in a phase file still fails', () => {
  const dir = join(mkdtempSync(join(tmpdir(), 'plan-check-')), 'plan');
  cpSync(sample, dir, { recursive: true });
  const phase = join(dir, 'phases', 'PHASE-01-greet.md');
  writeFileSync(phase, `${readFileSync(phase, 'utf8')}\nSee <yyyy-mm-dd> and <review model>.\n`);
  const r = spawnSync(process.execPath, [script, dir], { encoding: 'utf8' });
  rmSync(dirname(dir), { recursive: true, force: true });
  assert.equal(r.status, 1, `${r.stdout}${r.stderr}`);
  assert.match(`${r.stdout}${r.stderr}`, /PHASE-01-greet\.md: unfilled placeholder/);
});

// Antigravity loads only the first 24,000 bytes of a skill's body, so SKILL.md stays below that and its long parts
// live in reference files that the Files table names.
test('the body of SKILL.md is at most 24,000 bytes', () => {
  const text = readFileSync(join(skill, 'SKILL.md'), 'utf8');
  const body = text.slice(text.indexOf('\n---', 3) + 4);
  assert.ok(Buffer.byteLength(body) <= 24000, `body is ${Buffer.byteLength(body)} bytes`);
});
for (const file of ['references/expensive-choices.md', 'references/resume.md', 'references/research.md', 'references/required-skills.md']) {
  test(`${file} exists and is named in the Files table`, () => {
    assert.ok(readFileSync(join(skill, file), 'utf8').length > 0);
    const text = readFileSync(join(skill, 'SKILL.md'), 'utf8');
    const table = text.slice(text.indexOf('## Files in this skill'), text.indexOf('## Ground rules'));
    assert.match(table, new RegExp(`^\\| \`${file.replace(/[.]/g, '\\.')}\` \\|`, 'm'));
  });
}
