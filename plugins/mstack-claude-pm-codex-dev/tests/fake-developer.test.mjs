// Tests for the stand-in developer in evals/_fixture/fake-developer: it writes each round's files, records the request
// and a job the stub companion script serves, and codex-dev.mjs reads those jobs like real ones.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const skill = resolve(dirname(fileURLToPath(import.meta.url)), '../skills/mstack-claude-pm-codex-dev');
const fixture = join(skill, 'evals/_fixture/fake-developer');
const fakeDev = join(fixture, 'scripts/fake-dev.mjs');
const codexDev = join(skill, 'scripts/codex-dev.mjs');

function setup(rounds) {
  const root = mkdtempSync(join(tmpdir(), 'fake-dev-'));
  const work = join(root, 'work'), data = join(root, 'data'), script = join(root, 'rounds.json');
  spawnSync('mkdir', ['-p', work, data]);
  writeFileSync(script, JSON.stringify(rounds));
  const env = { PATH: process.env.PATH, CLAUDE_PLUGIN_DATA: data, FAKE_DEV_SCRIPT: script, CODEX_COMPANION_SCRIPT: join(fixture, 'scripts/codex-companion.mjs') };
  const call = (prompt) => spawnSync(process.execPath, [fakeDev, prompt], { cwd: work, env, encoding: 'utf8' });
  const dev = (...args) => { const r = spawnSync(process.execPath, [codexDev, ...args], { cwd: work, env, encoding: 'utf8' }); return { status: r.status, json: JSON.parse(r.stdout || 'null') }; };
  const requests = () => (existsSync(join(data, 'requests.jsonl')) ? readFileSync(join(data, 'requests.jsonl'), 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);
  return { work, call, dev, requests };
}

const two = [
  { files: [{ path: 'a.txt', content: 'one\n' }], report: 'Phase 1\nOutcome: done\n', status: 'completed' },
  { files: [{ path: 'b.txt', content: 'two\n' }], report: 'Phase 1\nOutcome: fixed\n', status: 'completed' },
];

test('a fresh call writes round one, records the request and a completed job, and prints its ID', () => {
  const s = setup(two);
  const prompt = '--background --fresh --model m --effort medium Read the file /x/brief.md in full and do exactly what it says.';
  const r = s.call(prompt);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(readFileSync(join(s.work, 'a.txt'), 'utf8'), 'one\n');
  const id = r.stdout.match(/started in the background as (\S+)\./)?.[1];
  assert.ok(id, r.stdout);
  assert.deepEqual(s.requests(), [{ request: prompt, cwd: s.work }]);
  const res = s.dev('result', id, '--phase', '1');
  assert.equal(res.status, 0, JSON.stringify(res.json));
  assert.match(res.json.output, /Outcome: done/);
});

test('a resumed call writes round two on the same thread, and both requests are kept in order', () => {
  const s = setup(two);
  const first = s.call('--background --fresh --model m --effort medium go').stdout.match(/as (\S+)\./)[1];
  const second = s.call('--background --resume --effort high go again').stdout.match(/as (\S+)\./)[1];
  assert.equal(readFileSync(join(s.work, 'b.txt'), 'utf8'), 'two\n');
  const t1 = s.dev('result', first, '--phase', '1').json.threadId;
  const t2 = s.dev('result', second, '--phase', '1').json.threadId;
  assert.ok(t1);
  assert.equal(t2, t1);
  assert.deepEqual(s.requests().map((q) => q.request), ['--background --fresh --model m --effort medium go', '--background --resume --effort high go again']);
});

test('a fresh call after a first one starts a new thread', () => {
  const s = setup(two);
  const first = s.call('--background --fresh go').stdout.match(/as (\S+)\./)[1];
  const second = s.call('--background --fresh go').stdout.match(/as (\S+)\./)[1];
  assert.notEqual(s.dev('result', second, '--phase', '1').json.threadId, s.dev('result', first, '--phase', '1').json.threadId);
});

test('an empty launchReply prints nothing, and the job is still listed', () => {
  const s = setup([{ files: [], report: 'Phase 1\n', status: 'completed', launchReply: '' }]);
  const r = s.call('--background --fresh go');
  assert.equal(r.status, 0);
  assert.equal(r.stdout, '');
  assert.equal(s.dev('jobs').json.jobs.length, 1);
});

test('a round with status failed makes wait exit 1', () => {
  const s = setup([{ files: [], report: '', status: 'failed' }]);
  const id = s.call('--background --fresh go').stdout.match(/as (\S+)\./)[1];
  const w = s.dev('wait', id);
  assert.equal(w.status, 1);
  assert.equal(w.json.state, 'failed');
});

test('a call after the last round exits 1 and records nothing', () => {
  const s = setup([two[0]]);
  s.call('--background --fresh go');
  const r = s.call('--background --resume go');
  assert.equal(r.status, 1);
  assert.equal(s.requests().length, 1);
  assert.equal(s.dev('jobs').json.jobs.length, 1);
});
