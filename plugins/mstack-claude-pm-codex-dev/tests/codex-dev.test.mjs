// Tests for scripts/codex-dev.mjs: locating the Codex plugin's script, listing and waiting on developer jobs,
// checking a result, and snapshotting the working tree. The jobs come from the stub in evals/_fixture/fake-developer.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const skill = resolve(dirname(fileURLToPath(import.meta.url)), '../skills/mstack-claude-pm-codex-dev');
const script = join(skill, 'scripts/codex-dev.mjs');
const stub = join(skill, 'evals/_fixture/fake-developer/scripts/codex-companion.mjs');

function run(args, env, cwd) {
  const r = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', cwd: cwd ?? tmpdir(), env: { PATH: process.env.PATH, ...env } });
  return { status: r.status, out: r.stdout, err: r.stderr, json: (() => { try { return JSON.parse(r.stdout); } catch { return undefined; } })() };
}

// A plugin data folder whose jobs.json holds the given jobs, and the environment that points codex-dev.mjs at the stub.
function withJobs(jobs) {
  const data = mkdtempSync(join(tmpdir(), 'cxd-data-'));
  if (jobs !== undefined) {
    mkdirSync(join(data, 'state'), { recursive: true });
    writeFileSync(join(data, 'state', 'jobs.json'), typeof jobs === 'string' ? jobs : JSON.stringify({ jobs }));
  }
  return { CLAUDE_PLUGIN_DATA: data, CODEX_COMPANION_SCRIPT: stub };
}

const job = (id, status, extra = {}) => ({ id, status, startedAt: extra.startedAt ?? '2026-11-10T10:00:00.000Z', threadId: 'thread-a', summary: `job ${id}`, jobClass: 'task', ...extra });

// --- locate

function configDir(record, scriptPresent = true) {
  const root = mkdtempSync(join(tmpdir(), 'cxd-cfg-'));
  const install = join(root, 'cache', 'codex');
  mkdirSync(join(install, 'scripts'), { recursive: true });
  if (scriptPresent) writeFileSync(join(install, 'scripts', 'codex-companion.mjs'), '');
  mkdirSync(join(root, 'plugins'), { recursive: true });
  const plugins = record ? { 'codex@openai-codex': [{ scope: 'user', installPath: install }] } : { 'other@x': [{ scope: 'user', installPath: root }] };
  writeFileSync(join(root, 'plugins', 'installed_plugins.json'), JSON.stringify({ version: 2, plugins }));
  return { root, path: join(install, 'scripts', 'codex-companion.mjs') };
}

test('locate prints the script of the codex@openai-codex install record', () => {
  const c = configDir(true);
  const r = run(['locate'], { CLAUDE_CONFIG_DIR: c.root, HOME: c.root });
  assert.equal(r.status, 0, r.err);
  assert.equal(r.out.trim(), c.path);
});

test('locate exits 1 with MISSING when no Codex plugin is installed', () => {
  const c = configDir(false);
  const r = run(['locate'], { CLAUDE_CONFIG_DIR: c.root, HOME: c.root });
  assert.equal(r.status, 1);
  assert.match(r.out + r.err, /^MISSING/m);
});

test('locate exits 1 with MISSING when the script file is absent', () => {
  const c = configDir(true, false);
  const r = run(['locate'], { CLAUDE_CONFIG_DIR: c.root, HOME: c.root });
  assert.equal(r.status, 1);
  assert.match(r.out + r.err, /^MISSING/m);
});

test('locate prints CODEX_COMPANION_SCRIPT when it is set', () => {
  const c = configDir(false);
  const r = run(['locate'], { CLAUDE_CONFIG_DIR: c.root, HOME: c.root, CODEX_COMPANION_SCRIPT: stub });
  assert.equal(r.status, 0, r.err);
  assert.equal(r.out.trim(), stub);
});

// --- jobs

test('jobs lists running and finished jobs, newest first', () => {
  const env = withJobs([job('old', 'completed', { startedAt: '2026-11-10T09:00:00.000Z' }), job('new', 'running', { startedAt: '2026-11-10T11:00:00.000Z' }), job('mid', 'failed')]);
  const r = run(['jobs'], env);
  assert.equal(r.status, 0, r.err);
  assert.deepEqual(r.json.jobs.map((j) => j.id), ['new', 'mid', 'old']);
  assert.deepEqual(Object.keys(r.json.jobs[0]).sort(), ['id', 'startedAt', 'state', 'summary', 'threadId']);
  assert.equal(r.json.jobs[0].state, 'running');
});

test('jobs prints an empty list when no jobs file exists yet', () => {
  const r = run(['jobs'], withJobs(undefined));
  assert.equal(r.status, 0, r.err);
  assert.deepEqual(r.json, { jobs: [] });
});

test('jobs exits 1 when the plugin script answers with something that is not JSON', () => {
  const r = run(['jobs'], withJobs('this is not json'));
  assert.equal(r.status, 1);
});

// --- wait

test('wait exits 0 after two running answers and one completed', () => {
  const r = run(['wait', 'j1', '--timeout-ms', '20000'], withJobs([job('j1', 'running', { answers: ['running', 'running', 'completed'] })]));
  assert.equal(r.status, 0, r.out + r.err);
  assert.equal(r.json.state, 'completed');
  assert.equal(r.json.threadId, 'thread-a');
});

test('wait reports the job\'s start and end times, so the longest run can be reported', () => {
  const r = run(['wait', 'j1'], withJobs([job('j1', 'completed', { startedAt: '2026-11-10T10:00:00.000Z', completedAt: '2026-11-10T10:07:30.000Z' })]));
  assert.equal(r.status, 0, r.out + r.err);
  assert.equal(r.json.startedAt, '2026-11-10T10:00:00.000Z');
  assert.equal(r.json.completedAt, '2026-11-10T10:07:30.000Z');
});

test('wait exits 1 with state failed', () => {
  const r = run(['wait', 'j1'], withJobs([job('j1', 'failed')]));
  assert.equal(r.status, 1);
  assert.equal(r.json.state, 'failed');
});

test('wait exits 3 with state running when the time is up, within 2 seconds', () => {
  const start = Date.now();
  const r = run(['wait', 'j1', '--timeout-ms', '300'], withJobs([job('j1', 'running', { blocking: true, pid: process.pid })]));
  assert.ok(Date.now() - start < 2000, `took ${Date.now() - start} ms`);
  assert.equal(r.status, 3, r.out + r.err);
  assert.equal(r.json.state, 'running');
});

test('wait exits 1 with state gone when the worker process does not exist', () => {
  const r = run(['wait', 'j1'], withJobs([job('j1', 'running', { pid: 999999 })]));
  assert.equal(r.status, 1);
  assert.equal(r.json.state, 'gone');
});

test('wait exits 1 with state unknown for a job the plugin does not know', () => {
  const r = run(['wait', 'nope'], withJobs([job('j1', 'completed')]));
  assert.equal(r.status, 1);
  assert.equal(r.json.state, 'unknown');
});

// --- result

const done = (output, extra = {}) => withJobs([job('j1', 'completed', { output, touchedFiles: ['a.txt'], ...extra })]);

test('result exits 0 when the first non-empty line is the phase ID', () => {
  const r = run(['result', 'j1', '--phase', '1'], done('\nPhase 1\nOutcome: done\n'));
  assert.equal(r.status, 0, r.out);
  assert.equal(r.json.ok, true);
  assert.deepEqual(r.json.touchedFiles, ['a.txt']);
  assert.match(r.json.output, /Outcome: done/);
});

for (const [name, output, reason] of [
  ['an empty output', '', 'empty'],
  ['an output without the phase line', 'Outcome: done\n', 'no phase id'],
  ['a first line naming Phase 10', 'Phase 10\nOutcome: done\n', 'no phase id'],
  ['an output that only quotes Phase 1 further down', 'Outcome: done\nThe brief said Phase 1\n', 'no phase id'],
]) {
  test(`result exits 1 with reason "${reason}" on ${name}`, () => {
    const r = run(['result', 'j1', '--phase', '1'], done(output));
    assert.equal(r.status, 1, r.out);
    assert.equal(r.json.ok, false);
    assert.equal(r.json.reason, reason);
  });
}

test('result exits 1 with reason failed on a failed job', () => {
  const r = run(['result', 'j1', '--phase', '1'], withJobs([job('j1', 'failed', { output: 'Phase 1\n' })]));
  assert.equal(r.status, 1);
  assert.equal(r.json.reason, 'failed');
});

test('result exits 1 with reason wrong thread when --thread differs, and 0 when it matches', () => {
  const env = done('Phase 1\n');
  const wrong = run(['result', 'j1', '--phase', '1', '--thread', 'thread-b'], env);
  assert.equal(wrong.status, 1);
  assert.equal(wrong.json.reason, 'wrong thread');
  const right = run(['result', 'j1', '--phase', '1', '--thread', 'thread-a'], env);
  assert.equal(right.status, 0, right.out);
});

// --- the plugin data folder

for (const args of [['jobs'], ['wait', 'j1'], ['result', 'j1', '--phase', '1']]) {
  test(`${args[0]} exits 1 with the new-session line when CLAUDE_PLUGIN_DATA is not set`, () => {
    const r = run(args, { CODEX_COMPANION_SCRIPT: stub });
    assert.equal(r.status, 1);
    assert.match(r.out + r.err, /session hook has not run.*new session/i);
  });
}

test('an unknown option exits 2 with a usage line', () => {
  const r = run(['jobs', '--bogus'], withJobs([]));
  assert.equal(r.status, 2);
  assert.match(r.out + r.err, /usage/i);
});

// --- snapshot

const git = (cwd, ...a) => spawnSync('git', a, { cwd, encoding: 'utf8' }).stdout.trim();

test('snapshot builds a tree with untracked files and without ignored ones, and leaves the index alone', () => {
  const repo = mkdtempSync(join(tmpdir(), 'cxd-repo-'));
  git(repo, 'init', '-q');
  writeFileSync(join(repo, 'tracked.txt'), 'one\n');
  writeFileSync(join(repo, '.gitignore'), 'ignored.txt\n');
  git(repo, 'add', '-A');
  git(repo, '-c', 'user.name=t', '-c', 'user.email=t' + '@t.invalid', 'commit', '-qm', 'base');
  writeFileSync(join(repo, 'tracked.txt'), 'two\n');
  writeFileSync(join(repo, 'new.txt'), 'new\n');
  writeFileSync(join(repo, 'ignored.txt'), 'secret\n');

  const before = git(repo, 'status', '--porcelain');
  const s1 = run(['snapshot'], {}, repo);
  assert.equal(s1.status, 0, s1.err);
  const tree1 = s1.out.trim();
  assert.match(tree1, /^[0-9a-f]{40,64}$/);
  assert.equal(git(repo, 'status', '--porcelain'), before);
  assert.deepEqual(git(repo, 'diff', '--name-only', 'HEAD', tree1).split('\n').sort(), ['new.txt', 'tracked.txt']);

  writeFileSync(join(repo, 'new.txt'), 'newer\n');
  const tree2 = run(['snapshot', '--cwd', repo], {}).out.trim();
  assert.equal(git(repo, 'diff', '--name-only', tree1, tree2), 'new.txt');

  git(repo, 'add', '-A');
  assert.equal(git(repo, 'write-tree'), tree2);
  writeFileSync(join(repo, 'tracked.txt'), 'three\n');
  git(repo, 'add', '-A');
  assert.notEqual(git(repo, 'write-tree'), tree2);
});

// --- findings of the code review

test('result returns a report larger than a pipe buffer as whole JSON', () => {
  const big = `Phase 1\n${'x'.repeat(300000)}\n`;
  const r = run(['result', 'j1', '--phase', '1'], done(big));
  assert.equal(r.status, 0, r.err);
  assert.equal(r.json?.output.length, big.length);
});

test('snapshot leaves no temporary index folder behind', () => {
  const repo = mkdtempSync(join(tmpdir(), 'cxd-repo-'));
  const tmp = mkdtempSync(join(tmpdir(), 'cxd-tmp-'));
  git(repo, 'init', '-q');
  writeFileSync(join(repo, 'a.txt'), 'a\n');
  const r = run(['snapshot'], { TMPDIR: tmp }, repo);
  assert.equal(r.status, 0, r.err);
  assert.deepEqual(readdirSync(tmp), []);
});

test('wait asks once more before reporting gone, so a job that just finished is completed', () => {
  const r = run(['wait', 'j1'], withJobs([job('j1', 'running', { pid: 999999, answers: ['running', 'completed'] })]));
  assert.equal(r.status, 0, r.out + r.err);
  assert.equal(r.json.state, 'completed');
});
