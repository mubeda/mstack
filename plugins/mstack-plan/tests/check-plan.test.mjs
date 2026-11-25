// Tests for scripts/check-plan.mjs: approval lines, writer records, the eight executors, start files and placeholders.
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

const sixWorkflows = [
  'mstack-claude-led-review',
  'mstack-codex-led-review',
  'mstack-antigravity-led-review',
  'mstack-claude-led-dev',
  'mstack-codex-led-dev',
  'mstack-antigravity-led-dev',
];
const allExecutors = [
  'none',
  'inline',
  ...sixWorkflows,
];

function lint(edit) {
  const root = mkdtempSync(join(tmpdir(), 'plan-check-'));
  const dir = join(root, 'plan');
  try {
    cpSync(sample, dir, { recursive: true });
    if (edit) edit(dir);
    const r = spawnSync(process.execPath, [script, dir], { encoding: 'utf8' });
    return { status: r.status, out: `${r.stdout}${r.stderr}` };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function taskLines(dir, from, to) {
  const path = join(dir, 'phases', 'PHASE-01-greet.md');
  const before = readFileSync(path, 'utf8');
  const after = before.replace(from, to);
  assert.notEqual(after, before, `line not found in PHASE-01-greet.md: ${from}`);
  writeFileSync(path, after);
}

function setWrittenBy(dir, value) {
  const path = join(dir, 'progress.md');
  const text = readFileSync(path, 'utf8').replace(/^Written by:[^\n]*\n/m, '');
  const updated = value === undefined
    ? text
    : text.replace(/^(Plan status:.*)$/m, `$1\nWritten by: ${value}`);
  writeFileSync(path, updated);
}

function check(executor) {
  return lint((dir) => {
    const progress = join(dir, 'progress.md');
    if (executor !== undefined) {
      const text = readFileSync(progress, 'utf8').replace(/^(Plan status:.*)$/m, `$1\nExecutor: ${executor}`);
      writeFileSync(progress, text);
      assert.match(readFileSync(progress, 'utf8'), new RegExp(`^Executor: ${executor}$`, 'm'));
    } else {
      assert.doesNotMatch(readFileSync(progress, 'utf8'), /^Executor:/m);
    }
  });
}

test('a plan with no Executor line, as written before the line existed, passes', () => {
  const r = check(undefined);
  assert.equal(r.status, 0, r.out);
});

for (const value of allExecutors) {
  test(`Executor: ${value} passes`, () => {
    const r = check(value);
    assert.equal(r.status, 0, r.out);
  });
}

test('an unknown executor fails with a line that lists exactly the eight allowed values', () => {
  const r = check('something-else');
  assert.equal(r.status, 1, r.out);
  const line = r.out.split('\n').find((l) => l.includes('Executor "something-else"'));
  assert.ok(line, r.out);
  for (const value of allExecutors) {
    assert.ok(line.includes(value), `${value} missing from: ${line}`);
  }
  const listPart = line.split('must be ')[1] ?? '';
  const seps = listPart.match(/, | or /g) ?? [];
  assert.equal(seps.length, 7, `expected exactly 7 separators for 8 values, got ${seps.length} in: ${line}`);
});

test('a plan folder without receiving-review.md passes, because mstack-receive-review holds the review rules', () => {
  const r = lint((dir) => rmSync(join(dir, 'receiving-review.md'), { force: true }));
  assert.equal(r.status, 0, r.out);
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

// Approval line tests (R13).
const approvalShapeMsg = 'phases/PHASE-01-greet.md task 1.1: Approved models line must be "- Approved models: <model>[, <model>] (user, <yyyy-mm-dd>)"';

test('R13: an approval line after the Tier line passes', () => {
  const r = lint((dir) => taskLines(dir, '- Tier: cheap', '- Tier: cheap\n- Approved models: example-model-a (user, 2026-11-22)'));
  assert.equal(r.status, 0, r.out);
});

test('two approved models pass', () => {
  const r = lint((dir) => taskLines(dir, '- Tier: cheap', '- Tier: cheap\n- Approved models: example-model-a, example-model-b (user, 2026-11-22)'));
  assert.equal(r.status, 0, r.out);
});

test('an approval line without the user and date fails', () => {
  const r = lint((dir) => taskLines(dir, '- Tier: cheap', '- Tier: cheap\n- Approved models: example-model-a'));
  assert.equal(r.status, 1, r.out);
  assert.ok(r.out.includes(approvalShapeMsg), r.out);
});

test('an approval line with an impossible date fails', () => {
  const r = lint((dir) => taskLines(dir, '- Tier: cheap', '- Tier: cheap\n- Approved models: example-model-a (user, 2026-13-01)'));
  assert.equal(r.status, 1, r.out);
  assert.ok(r.out.includes(approvalShapeMsg), r.out);
});

test('an approval line by someone other than the user fails', () => {
  const r = lint((dir) => taskLines(dir, '- Tier: cheap', '- Tier: cheap\n- Approved models: example-model-a (agent, 2026-11-22)'));
  assert.equal(r.status, 1, r.out);
  assert.ok(r.out.includes(approvalShapeMsg), r.out);
});

test('an approval line with no model fails', () => {
  const r = lint((dir) => taskLines(dir, '- Tier: cheap', '- Tier: cheap\n- Approved models: (user, 2026-11-22)'));
  assert.equal(r.status, 1, r.out);
  assert.ok(r.out.includes(approvalShapeMsg), r.out);
});

test('an approval line away from the Tier line fails', () => {
  const r = lint((dir) => taskLines(dir, '- TDD: red-green', '- TDD: red-green\n- Approved models: example-model-a (user, 2026-11-22)'));
  assert.equal(r.status, 1, r.out);
  assert.ok(r.out.includes('phases/PHASE-01-greet.md task 1.1: Approved models line must come directly after the Tier line'), r.out);
});

test('two approval lines in one task fail', () => {
  const r = lint((dir) => taskLines(dir, '- Tier: cheap', '- Tier: cheap\n- Approved models: example-model-a (user, 2026-11-22)\n- Approved models: example-model-b (user, 2026-11-22)'));
  assert.equal(r.status, 1, r.out);
  assert.ok(r.out.includes('phases/PHASE-01-greet.md task 1.1: more than one Approved models line'), r.out);
});

// Writer records (D14).
test('no Written by line passes', () => {
  const r = lint((dir) => setWrittenBy(dir, undefined));
  assert.equal(r.status, 0, r.out);
});

test('Written by: claude, codex passes', () => {
  const r = lint((dir) => setWrittenBy(dir, 'claude, codex'));
  assert.equal(r.status, 0, r.out);
});

test('Written by: unknown passes', () => {
  const r = lint((dir) => setWrittenBy(dir, 'unknown'));
  assert.equal(r.status, 0, r.out);
});

for (const bad of ['gemini', 'claude, claude', 'unknown, codex']) {
  test(`Written by: ${bad} fails`, () => {
    const r = lint((dir) => setWrittenBy(dir, bad));
    assert.equal(r.status, 1, r.out);
    assert.ok(r.out.includes(`progress.md: Written by "${bad}" must be unknown or a comma-separated list of claude, codex, antigravity, other, each once`), r.out);
  });
}

test('a Closed line with Executed by: antigravity passes', () => {
  const r = lint((dir) => {
    const path = join(dir, 'progress.md');
    writeFileSync(path, `${readFileSync(path, 'utf8')}\n## Log\n- 2026-11-22 10:00 1.1 Closed. Executed by: antigravity. Evidence: \`python3 -m unittest\` exit 0.\n`);
  });
  assert.equal(r.status, 0, r.out);
});

test('a Closed line with Executed by: someone fails', () => {
  const r = lint((dir) => {
    const path = join(dir, 'progress.md');
    writeFileSync(path, `${readFileSync(path, 'utf8')}\n## Log\n- 2026-11-22 10:00 1.1 Closed. Executed by: someone. Evidence: \`python3 -m unittest\` exit 0.\n`);
  });
  assert.equal(r.status, 1, r.out);
  assert.ok(r.out.includes('progress.md: log line "'), r.out);
  assert.ok(r.out.includes('Executed by "someone" must be unknown or a comma-separated list of claude, codex, antigravity, other, each once'), r.out);
});

// Start file workflow names.
test('a start file that names inline and the six workflows passes', () => {
  const r = lint((dir) => {
    writeFileSync(join(dir, 'execute-plan.md'), `# Execute plan\n\n- Recommended mode: Inline\n\nInline or ${sixWorkflows.join(', ')}.\n`);
  });
  assert.equal(r.status, 0, r.out);
});

test('a start file that names five of the six fails', () => {
  const r = lint((dir) => {
    writeFileSync(join(dir, 'execute-plan.md'), `# Execute plan\n\n- Recommended mode: Inline\n\nInline or ${sixWorkflows.slice(0, 5).join(', ')}.\n`);
  });
  assert.equal(r.status, 1, r.out);
  assert.ok(r.out.includes(`execute-plan.md: does not name the workflows (${sixWorkflows.join(', ')})`), r.out);
});

test('a start file with a misspelled workflow name fails', () => {
  const r = lint((dir) => {
    writeFileSync(join(dir, 'execute-plan.md'), `# Execute plan\n\n- Recommended mode: Inline\n\nInline or ${sixWorkflows.slice(0, 4).join(', ')}, mstack-codex-led-development, mstack-antigravity-led-dev.\n`);
  });
  assert.equal(r.status, 1, r.out);
  assert.ok(r.out.includes(`execute-plan.md: does not name the workflows (${sixWorkflows.join(', ')})`), r.out);
});

test('an approval line with an invalid calendar day fails', () => {
  const r = lint((dir) => taskLines(dir, '- Tier: cheap', '- Tier: cheap\n- Approved models: example-model-a (user, 2026-02-31)'));
  assert.equal(r.status, 1, r.out);
  assert.ok(r.out.includes(approvalShapeMsg), r.out);
});

test('an approval line with a placeholder model fails', () => {
  const r = lint((dir) => taskLines(dir, '- Tier: cheap', '- Tier: cheap\n- Approved models: <model> (user, 2026-11-22)'));
  assert.equal(r.status, 1, r.out);
  assert.ok(r.out.includes(approvalShapeMsg), r.out);
});

test('a tilde-fenced approval example in a task passes', () => {
  const r = lint((dir) => taskLines(
    dir,
    '4. [ ] Run `python3 -m unittest`. Expected: PASS, 1 test.',
    '4. [ ] Run `python3 -m unittest`. Expected: PASS, 1 test.\n~~~markdown\n- Approved models: example-model-a (user, 2026-11-22)\n~~~',
  ));
  assert.equal(r.status, 0, r.out);
});

test('two Written by lines fail', () => {
  const r = lint((dir) => {
    const path = join(dir, 'progress.md');
    writeFileSync(path, readFileSync(path, 'utf8').replace(/^(Plan status:.*)$/m, '$1\nWritten by: claude\nWritten by: codex'));
  });
  assert.equal(r.status, 1, r.out);
  assert.ok(r.out.includes('progress.md: more than one Written by line'), r.out);
});

test('a Closed line with two Executed by fields fails', () => {
  const r = lint((dir) => {
    const path = join(dir, 'progress.md');
    writeFileSync(path, `${readFileSync(path, 'utf8')}\n## Log\n- 2026-11-22 10:00 1.1 Closed. Executed by: claude. Executed by: someone. Evidence: \`python3 -m unittest\` exit 0.\n`);
  });
  assert.equal(r.status, 1, r.out);
  assert.ok(r.out.includes('more than one Executed by'), r.out);
});

test('a Closed line with a dotted Executed by vendor fails', () => {
  const r = lint((dir) => {
    const path = join(dir, 'progress.md');
    writeFileSync(path, `${readFileSync(path, 'utf8')}\n## Log\n- 2026-11-22 10:00 1.1 Closed. Executed by: claude.foo. Evidence: \`python3 -m unittest\` exit 0.\n`);
  });
  assert.equal(r.status, 1, r.out);
  assert.ok(r.out.includes('Executed by "claude.foo" must be unknown or a comma-separated list of claude, codex, antigravity, other, each once'), r.out);
});

test('a legacy Closed line mentioning Executed by inside Evidence passes', () => {
  const r = lint((dir) => {
    const path = join(dir, 'progress.md');
    writeFileSync(path, `${readFileSync(path, 'utf8')}\n## Log\n- 2026-11-22 10:00 1.1 Closed. Evidence: report said Executed by: test runner.\n`);
  });
  assert.equal(r.status, 0, r.out);
});

test('two Executor lines fail even when the first is valid', () => {
  const r = lint((dir) => {
    const path = join(dir, 'progress.md');
    const before = readFileSync(path, 'utf8');
    const after = before.replace(/^(Plan status:.*)$/m, '$1\nExecutor: inline\nExecutor: mstack-old-review-workflow');
    assert.notEqual(after, before);
    writeFileSync(path, after);
  });
  assert.equal(r.status, 1, r.out);
  assert.ok(r.out.includes('progress.md: more than one Executor line'), r.out);
  assert.ok(r.out.includes('Executor "mstack-old-review-workflow"'), r.out);
});

test('an unknown workflow name in a task Owner cell fails', () => {
  const r = lint((dir) => {
    const path = join(dir, 'progress.md');
    const before = readFileSync(path, 'utf8');
    const after = before.replace(/\|\s*1\.1\s*\|([^|]*)\|([^|]*)\|\s*Open\s*\|\s*\|/, '| 1.1 |$1|$2| Open | mstack-old-review-workflow |');
    assert.notEqual(after, before);
    writeFileSync(path, after);
  });
  assert.equal(r.status, 1, r.out);
  assert.ok(r.out.includes('progress.md: task 1.1 Owner'), r.out);
});

test('a start file that names an unknown workflow alongside the six fails', () => {
  const r = lint((dir) => {
    writeFileSync(join(dir, 'execute-plan.md'), `# Execute plan\n\n- Recommended mode: Inline\n\nInline or ${sixWorkflows.join(', ')}, plus mstack-old-review-workflow and mstack-legacy-pm-dev.\n`);
  });
  assert.equal(r.status, 1, r.out);
  assert.ok(r.out.includes('execute-plan.md: unknown workflow'), r.out);
});

test('an unknown workflow name in a task Note cell fails', () => {
  const r = lint((dir) => {
    const path = join(dir, 'progress.md');
    const before = readFileSync(path, 'utf8');
    const after = before.replace(/\|\s*1\.1\s*\|([^|]*)\|([^|]*)\|\s*Open\s*\|\s*\|\s*\|/, '| 1.1 |$1|$2| Open | | handoff from mstack-old-review-workflow |');
    assert.notEqual(after, before);
    writeFileSync(path, after);
  });
  assert.equal(r.status, 1, r.out);
  assert.ok(r.out.includes('progress.md: unknown workflow (mstack-old-review-workflow)'), r.out);
});

test('an unknown workflow name in the progress log fails', () => {
  const r = lint((dir) => {
    const path = join(dir, 'progress.md');
    writeFileSync(path, `${readFileSync(path, 'utf8')}\n## Log\n- 2026-11-22 10:00 1.1 In progress. Owner: mstack-old-review-workflow.\n`);
  });
  assert.equal(r.status, 1, r.out);
  assert.ok(r.out.includes('progress.md: unknown workflow (mstack-old-review-workflow)'), r.out);
});

test('a suffixed workflow name fails in Owner and in execute-plan.md', () => {
  const r1 = lint((dir) => {
    const path = join(dir, 'progress.md');
    const before = readFileSync(path, 'utf8');
    const after = before.replace(/\|\s*1\.1\s*\|([^|]*)\|([^|]*)\|\s*Open\s*\|\s*\|/, '| 1.1 |$1|$2| Open | mstack-claude-led-dev-v2 |');
    assert.notEqual(after, before);
    writeFileSync(path, after);
  });
  assert.equal(r1.status, 1, r1.out);
  assert.ok(r1.out.includes('mstack-claude-led-dev-v2'), r1.out);

  const r2 = lint((dir) => {
    writeFileSync(join(dir, 'execute-plan.md'), `# Execute plan\n\n- Recommended mode: Inline\n\nInline or ${sixWorkflows.join(', ')}, plus mstack-claude-led-dev-v2.\n`);
  });
  assert.equal(r2.status, 1, r2.out);
  assert.ok(r2.out.includes('execute-plan.md: unknown workflow (mstack-claude-led-dev-v2)'), r2.out);
});
