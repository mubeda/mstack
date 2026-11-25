// Tests for the three stand-ins under evals/_fixture/bin/: fake-dev.mjs, fake-review.mjs, and agy.
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const pluginDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const skill = resolve(pluginDir, 'skills', basename(pluginDir));
const srcBin = join(skill, 'evals/_fixture/bin');
const temps = [];
const temp = (prefix) => { const dir = mkdtempSync(join(tmpdir(), prefix)); temps.push(dir); return dir; };
after(() => { for (const dir of temps) rmSync(dir, { recursive: true, force: true }); });

function setup({ rounds, standInFiles = {} } = {}) {
  const root = temp('dev-standin-');
  const bin = join(root, 'bin');
  const standIn = join(root, 'stand-in');
  const work = join(root, 'work');
  const promptFile = join(root, 'brief.md');
  mkdirSync(bin, { recursive: true });
  mkdirSync(standIn, { recursive: true });
  mkdirSync(work, { recursive: true });
  writeFileSync(promptFile, 'Phase 1\nDo the task.\n');
  for (const name of ['fake-dev.mjs', 'fake-review.mjs', 'agy']) {
    const src = join(srcBin, name);
    if (existsSync(src)) {
      const dst = join(bin, name);
      copyFileSync(src, dst);
      chmodSync(dst, 0o755);
    }
  }
  if (rounds !== undefined) writeFileSync(join(standIn, 'rounds.json'), JSON.stringify(rounds, null, 2));
  for (const [k, v] of Object.entries(standInFiles)) writeFileSync(join(standIn, k), v);
  const requests = () => {
    const f = join(standIn, 'requests.jsonl');
    if (!existsSync(f)) return [];
    return readFileSync(f, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
  };
  const callsLog = () => {
    const f = join(standIn, 'calls.log');
    if (!existsSync(f)) return [];
    return readFileSync(f, 'utf8').trim().split('\n').filter(Boolean);
  };
  return { root, bin, standIn, work, promptFile, requests, callsLog };
}

test('a claude developer plays round one in its folder, prints one JSON object with a session_id and modelUsage and logs vendor, model, effort and session', () => {
  const s = setup({
    rounds: [{ files: [{ path: 'src/a.txt', content: 'hello\n' }], report: 'Phase 1\nOutcome: done\n', status: 'completed' }],
  });
  const r = spawnSync(process.execPath, [join(s.bin, 'fake-dev.mjs'), '--vendor', 'claude', '--model', 'claude-sonnet-5-5', '--effort', 'medium', '--prompt-file', s.promptFile], { cwd: s.work, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(readFileSync(join(s.work, 'src/a.txt'), 'utf8'), 'hello\n');
  const json = JSON.parse(r.stdout);
  assert.equal(json.result, 'Phase 1\nOutcome: done\n');
  assert.equal(json.is_error, false);
  assert.ok(typeof json.session_id === 'string' && json.session_id.length > 0);
  assert.deepEqual(Object.keys(json.modelUsage), ['claude-sonnet-5-5']);
  const reqs = s.requests();
  assert.equal(reqs.length, 1);
  assert.equal(reqs[0].vendor, 'claude');
  assert.equal(reqs[0].model, 'claude-sonnet-5-5');
  assert.equal(reqs[0].effort, 'medium');
  assert.equal(reqs[0].session, json.session_id);
  assert.equal(reqs[0].resume, null);
  assert.equal(reqs[0].cwd, s.work);
  assert.deepEqual(reqs[0].listing, []);
  assert.equal(reqs[0].prompt, s.promptFile);
});

test('a codex developer prints a thread line and the report', () => {
  const s = setup({
    rounds: [{ files: [{ path: 'f.py', content: 'x = 1\n' }], report: 'Phase 1\nOutcome: done\n', status: 'completed' }],
  });
  const r = spawnSync(process.execPath, [join(s.bin, 'fake-dev.mjs'), '--vendor', 'codex', '--model', 'gpt-6.2-sol', '--effort', 'low', '--prompt-file', s.promptFile], { cwd: s.work, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(readFileSync(join(s.work, 'f.py'), 'utf8'), 'x = 1\n');
  const lines = r.stdout.trim().split('\n');
  assert.match(lines[0], /^thread: \S+$/);
  assert.equal(lines[1], 'Phase 1');
  const reqs = s.requests();
  assert.equal(reqs.length, 1);
  assert.equal(reqs[0].session, lines[0].slice('thread: '.length));
});

test('a resumed round keeps the id, logs it as resume and logs the files it found', () => {
  const s = setup({
    rounds: [
      { files: [{ path: 'a.txt', content: 'one\n' }], report: 'Phase 1\nRound 1\n', status: 'completed' },
      { files: [{ path: 'b.txt', content: 'two\n' }], report: 'Phase 1\nRound 2\n', status: 'completed' },
    ],
  });
  const r1 = spawnSync(process.execPath, [join(s.bin, 'fake-dev.mjs'), '--vendor', 'claude', '--model', 'claude-sonnet-5-5', '--effort', 'medium', '--prompt-file', s.promptFile], { cwd: s.work, encoding: 'utf8' });
  assert.equal(r1.status, 0, r1.stderr);
  const id1 = JSON.parse(r1.stdout).session_id;
  const r2 = spawnSync(process.execPath, [join(s.bin, 'fake-dev.mjs'), '--vendor', 'claude', '--model', 'claude-sonnet-5-5', '--effort', 'high', '--resume', id1, '--prompt-file', s.promptFile], { cwd: s.work, encoding: 'utf8' });
  assert.equal(r2.status, 0, r2.stderr);
  assert.equal(JSON.parse(r2.stdout).session_id, id1);
  const reqs = s.requests();
  assert.equal(reqs.length, 2);
  assert.equal(reqs[1].session, id1);
  assert.equal(reqs[1].resume, id1);
  assert.ok(reqs[1].listing.includes('a.txt'), JSON.stringify(reqs[1].listing));
  assert.equal(readFileSync(join(s.work, 'b.txt'), 'utf8'), 'two\n');
});

test('a round with its own thread prints that thread', () => {
  const s = setup({
    rounds: [
      { files: [], report: 'Phase 1\nRound 1\n', status: 'completed' },
      { files: [], report: 'Phase 1\nRound 2\n', status: 'completed', thread: 'thread-hijacked' },
    ],
  });
  const r1 = spawnSync(process.execPath, [join(s.bin, 'fake-dev.mjs'), '--vendor', 'codex', '--model', 'gpt-6.2-sol', '--effort', 'medium', '--prompt-file', s.promptFile], { cwd: s.work, encoding: 'utf8' });
  const id1 = r1.stdout.split('\n')[0].slice('thread: '.length);
  const r2 = spawnSync(process.execPath, [join(s.bin, 'fake-dev.mjs'), '--vendor', 'codex', '--model', 'gpt-6.2-sol', '--effort', 'high', '--resume', id1, '--prompt-file', s.promptFile], { cwd: s.work, encoding: 'utf8' });
  assert.equal(r2.status, 0, r2.stderr);
  assert.equal(r2.stdout.split('\n')[0], 'thread: thread-hijacked');
  const reqs = s.requests();
  assert.equal(reqs[1].resume, id1);
  assert.equal(reqs[1].session, 'thread-hijacked');
});

test('a failed round exits 1', () => {
  const s = setup({
    rounds: [
      { files: [], report: 'error: selected model is not available', status: 'failed' },
      { files: [], report: 'model not supported', status: 'failed' },
    ],
  });
  const rc = spawnSync(process.execPath, [join(s.bin, 'fake-dev.mjs'), '--vendor', 'claude', '--model', 'bad-model', '--effort', 'medium', '--prompt-file', s.promptFile], { cwd: s.work, encoding: 'utf8' });
  assert.equal(rc.status, 1);
  assert.match(rc.stderr, /selected model is not available/);
  assert.equal(JSON.parse(rc.stdout).is_error, true);

  const rx = spawnSync(process.execPath, [join(s.bin, 'fake-dev.mjs'), '--vendor', 'codex', '--model', 'bad-model', '--effort', 'medium', '--prompt-file', s.promptFile], { cwd: s.work, encoding: 'utf8' });
  assert.equal(rx.status, 1);
  assert.match(rx.stderr, /model not supported/);
});

test('a call after the last round exits 1 and logs nothing', () => {
  const s = setup({
    rounds: [{ files: [], report: 'Phase 1\nDone\n', status: 'completed' }],
  });
  const r1 = spawnSync(process.execPath, [join(s.bin, 'fake-dev.mjs'), '--vendor', 'codex', '--model', 'gpt-6.2-sol', '--effort', 'low', '--prompt-file', s.promptFile], { cwd: s.work, encoding: 'utf8' });
  assert.equal(r1.status, 0, r1.stderr);
  const r2 = spawnSync(process.execPath, [join(s.bin, 'fake-dev.mjs'), '--vendor', 'codex', '--model', 'gpt-6.2-sol', '--effort', 'low', '--prompt-file', s.promptFile], { cwd: s.work, encoding: 'utf8' });
  assert.equal(r2.status, 1);
  assert.equal(s.requests().length, 1);
});

test('reviewer logs start with its model and effort and end, prints JSON with result and modelUsage for claude and plain findings for codex', () => {
  const s = setup({
    standInFiles: {
      'review-claude.md': 'No findings.\n',
      'review-codex.md': 'Finding 1: bug in add()\n',
    },
  });
  const rc = spawnSync(process.execPath, [join(s.bin, 'fake-review.mjs'), '--vendor', 'claude', '--model', 'claude-sonnet-5-5', '--effort', 'high', '--prompt-file', s.promptFile], { cwd: s.work, encoding: 'utf8' });
  assert.equal(rc.status, 0, rc.stderr);
  const json = JSON.parse(rc.stdout);
  assert.equal(json.result, 'No findings.\n');
  assert.equal(json.is_error, false);
  assert.deepEqual(Object.keys(json.modelUsage), ['claude-sonnet-5-5']);

  const rx = spawnSync(process.execPath, [join(s.bin, 'fake-review.mjs'), '--vendor', 'codex', '--model', 'gpt-6.2-sol', '--effort', 'high', '--prompt-file', s.promptFile], { cwd: s.work, encoding: 'utf8' });
  assert.equal(rx.status, 0, rx.stderr);
  assert.equal(rx.stdout, 'Finding 1: bug in add()\n');

  const log = s.callsLog();
  assert.equal(log.length, 4, log.join('\n'));
  assert.match(log[0], /^start claude claude-sonnet-5-5 high \d+$/);
  assert.match(log[1], /^end claude \d+$/);
  assert.match(log[2], /^start codex gpt-6\.2-sol high \d+$/);
  assert.match(log[3], /^end codex \d+$/);
});

test('a failing reviewer exits 1 with empty output', () => {
  const s = setup({ standInFiles: { 'fail-claude': '' } });
  const r = spawnSync(process.execPath, [join(s.bin, 'fake-review.mjs'), '--vendor', 'claude', '--model', 'claude-sonnet-5-5', '--effort', 'high', '--prompt-file', s.promptFile], { cwd: s.work, encoding: 'utf8' });
  assert.equal(r.status, 1);
  assert.equal(r.stdout, '');
  assert.equal(r.stderr, '');
});

test('an empty reviewer exits 0 with only a stderr line', () => {
  const s = setup({ standInFiles: { 'empty-codex': '' } });
  const r = spawnSync(process.execPath, [join(s.bin, 'fake-review.mjs'), '--vendor', 'codex', '--model', 'gpt-6.2-sol', '--effort', 'high', '--prompt-file', s.promptFile], { cwd: s.work, encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.equal(r.stdout, '');
  assert.ok(r.stderr.trim().length > 0);
});

test('the agy stand-in prints the listing for models, exits 1 with models-fail, and refuses every other subcommand', () => {
  const s = setup({ standInFiles: { 'models.txt': 'gemini-4-flash\ngemini-4-pro\nclaude-sonnet-5-5\n' } });
  const ok = spawnSync(join(s.bin, 'agy'), ['models'], { cwd: s.work, encoding: 'utf8' });
  assert.equal(ok.status, 0, ok.stderr);
  assert.equal(ok.stdout, 'gemini-4-flash\ngemini-4-pro\nclaude-sonnet-5-5\n');

  const bad = spawnSync(join(s.bin, 'agy'), ['--version'], { cwd: s.work, encoding: 'utf8' });
  assert.equal(bad.status, 2);
  assert.match(bad.stderr, /stand-in agy: only models/);

  writeFileSync(join(s.standIn, 'models-fail'), '');
  const fail = spawnSync(join(s.bin, 'agy'), ['models'], { cwd: s.work, encoding: 'utf8' });
  assert.equal(fail.status, 1);
});

test('both stand-ins reject a missing prompt file and fake-dev refuses writes outside cwd (including via symlinks)', () => {
  const s = setup({
    rounds: [
      { files: [{ path: '../escaped.txt', content: 'nope\n' }], report: 'Phase 1\n', status: 'completed' },
      { files: [{ path: 'link/escaped2.txt', content: 'nope\n' }], report: 'Phase 1\n', status: 'completed' },
    ],
    standInFiles: { 'review-codex.md': 'No findings.\n' },
  });
  const missing = join(s.root, 'does-not-exist.md');
  const devMissing = spawnSync(process.execPath, [join(s.bin, 'fake-dev.mjs'), '--vendor', 'codex', '--model', 'gpt-6.2-sol', '--effort', 'low', '--prompt-file', missing], { cwd: s.work, encoding: 'utf8' });
  assert.equal(devMissing.status, 2, devMissing.stderr);
  assert.equal(s.requests().length, 0);

  const revMissing = spawnSync(process.execPath, [join(s.bin, 'fake-review.mjs'), '--vendor', 'codex', '--model', 'gpt-6.2-sol', '--effort', 'high', '--prompt-file', missing], { cwd: s.work, encoding: 'utf8' });
  assert.equal(revMissing.status, 2, revMissing.stderr);
  assert.equal(s.callsLog().length, 0);

  const dotDot = spawnSync(process.execPath, [join(s.bin, 'fake-dev.mjs'), '--vendor', 'codex', '--model', 'gpt-6.2-sol', '--effort', 'low', '--prompt-file', s.promptFile], { cwd: s.work, encoding: 'utf8' });
  assert.equal(dotDot.status, 2, dotDot.stderr);
  assert.equal(existsSync(join(s.root, 'escaped.txt')), false);

  const outside = join(s.root, 'outside');
  mkdirSync(outside, { recursive: true });
  symlinkSync(outside, join(s.work, 'link'));
  writeFileSync(join(s.standIn, 'rounds.json'), JSON.stringify([
    { files: [{ path: 'link/escaped2.txt', content: 'nope\n' }], report: 'Phase 1\n', status: 'completed' },
  ]));
  const symEsc = spawnSync(process.execPath, [join(s.bin, 'fake-dev.mjs'), '--vendor', 'codex', '--model', 'gpt-6.2-sol', '--effort', 'low', '--prompt-file', s.promptFile], { cwd: s.work, encoding: 'utf8' });
  assert.equal(symEsc.status, 2, symEsc.stderr);
  assert.equal(existsSync(join(outside, 'escaped2.txt')), false);

  // Dangling destination symlink pointing outside cwd must also be rejected before writing
  symlinkSync(join(outside, 'dangling-target.txt'), join(s.work, 'dangling.txt'));
  writeFileSync(join(s.standIn, 'rounds.json'), JSON.stringify([
    { files: [{ path: 'dangling.txt', content: 'nope\n' }], report: 'Phase 1\n', status: 'completed' },
  ]));
  const dangEsc = spawnSync(process.execPath, [join(s.bin, 'fake-dev.mjs'), '--vendor', 'codex', '--model', 'gpt-6.2-sol', '--effort', 'low', '--prompt-file', s.promptFile], { cwd: s.work, encoding: 'utf8' });
  assert.equal(dangEsc.status, 2, dangEsc.stderr);
  assert.equal(existsSync(join(outside, 'dangling-target.txt')), false);
});
