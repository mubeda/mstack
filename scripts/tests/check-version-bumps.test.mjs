import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../check-version-bumps.mjs', import.meta.url));
const identity = ['-c', 'user.name=test', '-c', 'user.email=test@example.invalid'];
const dirs = [];
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }); });

const git = (dir, ...args) => execFileSync('git', [...identity, ...args], { cwd: dir, stdio: 'ignore' });
const put = (dir, path, text) => {
  mkdirSync(dirname(join(dir, path)), { recursive: true });
  writeFileSync(join(dir, path), text);
};
const manifest = (dir, host, version) => put(dir, `plugins/mstack-agy-only/.${host}-plugin/plugin.json`, JSON.stringify({ version }));
const skill = 'plugins/mstack-agy-only/skills/mstack-agy-only/SKILL.md';

// A repository whose main holds an Antigravity-only plugin at 0.1.0; the branch only bumps the catalog.
function repo() {
  const dir = mkdtempSync(join(tmpdir(), 'mstack-bumps-'));
  dirs.push(dir);
  git(dir, 'init', '-b', 'main');
  put(dir, '.claude-plugin/marketplace.json', JSON.stringify({ metadata: { version: '0.1.0' }, plugins: [] }));
  manifest(dir, 'antigravity', '0.1.0');
  put(dir, skill, 'one\n');
  git(dir, 'add', '-A');
  git(dir, 'commit', '-m', 'base');
  git(dir, 'checkout', '-b', 'feat');
  put(dir, '.claude-plugin/marketplace.json', JSON.stringify({ metadata: { version: '0.1.1' }, plugins: [] }));
  return dir;
}

function run(dir, failShow = false) {
  const env = { ...process.env, MSTACK_CHECK_ROOT: dir };
  delete env.CI;
  if (failShow) { // stand-in git: reading a plugin file from the base fails like a broken object would
    const real = execFileSync('which', ['git'], { encoding: 'utf8' }).trim();
    const bin = mkdtempSync(join(tmpdir(), 'mstack-bumps-bin-'));
    dirs.push(bin);
    writeFileSync(join(bin, 'git'), `#!/bin/sh\ncase "$*" in show*plugins/*) echo 'fatal: bad object' >&2; exit 128;; esac\nexec "${real}" "$@"\n`);
    chmodSync(join(bin, 'git'), 0o755);
    env.PATH = `${bin}:${process.env.PATH}`;
  }
  return spawnSync('node', [script, 'main'], { cwd: dir, env, encoding: 'utf8' });
}

test('changed without a bump', () => {
  const dir = repo();
  put(dir, skill, 'two\n');
  const result = run(dir);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /mstack-agy-only: files changed but version 0\.1\.0 is not higher than main's 0\.1\.0/);
});

test('bumped plugin passes', () => {
  const dir = repo();
  put(dir, skill, 'two\n');
  manifest(dir, 'antigravity', '0.1.1');
  const result = run(dir);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /1 changed plugin\(s\)/);
});

test('removed plugin is skipped', () => {
  const dir = repo();
  rmSync(join(dir, 'plugins/mstack-agy-only'), { recursive: true });
  const result = run(dir);
  assert.equal(result.status, 0, result.stderr);
});

test('host set changed without a bump', () => {
  const dir = repo();
  for (const host of ['claude', 'codex']) manifest(dir, host, '0.1.0');
  put(dir, skill, 'two\n');
  const result = run(dir);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /mstack-agy-only/);
});

test('host set changed with a bump', () => {
  const dir = repo();
  for (const host of ['claude', 'codex', 'antigravity']) manifest(dir, host, '0.1.1');
  put(dir, skill, 'two\n');
  const result = run(dir);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /1 changed plugin\(s\)/);
});

test('git failing on an existing base manifest is an error, not a waived bump', () => {
  const dir = repo();
  put(dir, skill, 'two\n');
  const result = run(dir, true);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /mstack-agy-only/);
});
