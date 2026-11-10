// Tests for scripts/check-setup.mjs. Each test builds a throwaway home folder and a bin folder of stubs,
// and runs the script with only those on PATH, so nothing on the real machine is read or changed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const script = resolve(dirname(fileURLToPath(import.meta.url)), '../skills/mstack-setup/scripts/check-setup.mjs');

function machine() {
  const root = mkdtempSync(join(tmpdir(), 'check-setup-'));
  const home = join(root, 'home'), bin = join(root, 'bin');
  mkdirSync(home, { recursive: true }); mkdirSync(bin, { recursive: true });
  const m = {
    root, home, bin,
    stub(name, code = 0) {
      const p = join(bin, name);
      writeFileSync(p, `#!/bin/sh\nexit ${code}\n`); chmodSync(p, 0o755); return m;
    },
    file(rel, text = 'x') {
      const p = join(home, rel); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, text); return m;
    },
    skill(rel) { return m.file(join(rel, 'SKILL.md'), '---\nname: x\ndescription: Use when testing.\n---\n'); },
  };
  return m;
}

function run(m, args, env = {}) {
  const r = spawnSync(process.execPath, [script, ...args, '--json'], {
    encoding: 'utf8',
    env: { PATH: m.bin, HOME: m.home, USERPROFILE: m.home, ...env },
  });
  let json = null;
  try { json = JSON.parse(r.stdout); } catch { /* left null; the test reports stdout */ }
  const state = (id) => json?.items.find((i) => i.id === id)?.state;
  return { status: r.status, out: `${r.stdout}${r.stderr}`, json, state };
}

const MANDATORY_CLAUDE = ['node', 'git', 'codegraph-cli', 'codegraph-connected', 'ponytail', 'reviewer-plugin',
  'reviewer-cli', 'mstack-find-skills', 'mstack-best-model-for', 'mstack-setup'];

function completeClaude(m, base = '.claude') {
  m.stub('node').stub('git').stub('codegraph').stub('codex');
  const cache = `${base}/plugins/cache`;
  m.skill(`${cache}/ponytail/ponytail/5.3.3/skills/ponytail`);
  m.file(`${cache}/skill-codex/skill-codex/1.3.1/skills/codex/SKILL.md`, 'Run codex exec.');
  for (const s of ['mstack-find-skills', 'mstack-best-model-for', 'mstack-setup']) m.skill(`${cache}/mstack/${s}/0.1.0/skills/${s}`);
  m.file(`${base}/plugins/installed_plugins.json`, JSON.stringify({ version: 2, plugins: { 'ponytail@ponytail': [{}], 'skill-codex@skill-codex': [{}] } }));
  const cfg = base === '.claude' ? '.claude.json' : `${base}/.claude.json`;
  m.file(cfg, JSON.stringify({ mcpServers: { codegraph: { command: 'codegraph', args: ['serve', '--mcp'] } } }));
  return m;
}

function listing(dir) {
  const out = [];
  const walk = (d) => { for (const n of readdirSync(d)) { const p = join(d, n); const s = statSync(p); out.push(`${p}:${s.size}:${s.mtimeMs}`); if (s.isDirectory()) walk(p); } };
  walk(dir); return out.sort().join('\n');
}

test('(a) empty machine: mandatory items missing, reviewer login skipped', () => {
  const m = machine();
  const r = run(m, ['--host', 'claude']);
  assert.equal(r.status, 1, r.out);
  for (const id of MANDATORY_CLAUDE) assert.equal(r.state(id), 'MISSING', `${id}: ${r.out}`);
  assert.equal(r.state('reviewer-login'), 'SKIP');
});

test('(b) complete Claude Code machine: every mandatory item ok', () => {
  const m = completeClaude(machine());
  const r = run(m, ['--host', 'claude', '--platform', 'linux']);
  assert.equal(r.status, 0, r.out);
  for (const id of [...MANDATORY_CLAUDE, 'reviewer-login']) assert.equal(r.state(id), 'ok', `${id}: ${r.out}`);
});

test('(c) codegraph on PATH but not connected', () => {
  const m = machine().stub('codegraph');
  const r = run(m, ['--host', 'claude']);
  assert.equal(r.state('codegraph-cli'), 'ok', r.out);
  assert.equal(r.state('codegraph-connected'), 'MISSING');
});

test('(d) Codex host: claude-review with its companion, codegraph in config.toml', () => {
  const m = machine().stub('codegraph').stub('claude');
  const codexHome = join(m.root, 'codex-home');
  const pl = join(codexHome, 'plugins/cache/agent-bridges/claude/0.2.1');
  mkdirSync(join(pl, 'skills/claude-review'), { recursive: true }); mkdirSync(join(pl, 'scripts'), { recursive: true });
  writeFileSync(join(pl, 'skills/claude-review/SKILL.md'), 'x'); writeFileSync(join(pl, 'scripts/claude-companion.mjs'), 'x');
  writeFileSync(join(codexHome, 'config.toml'), '[mcp_servers.codegraph]\ncommand = "codegraph"\n\n[plugins."claude@agent-bridges"]\nenabled = true\n');
  const r = run(m, ['--host', 'codex'], { CODEX_HOME: codexHome });
  assert.equal(r.state('reviewer-plugin'), 'ok', r.out);
  assert.equal(r.state('codegraph-connected'), 'ok');
  assert.equal(r.state('reviewer-cli'), 'ok');
});

test('(d2) Codex host: claude-review without the companion script is missing', () => {
  const m = machine();
  const codexHome = join(m.root, 'codex-home');
  mkdirSync(join(codexHome, 'skills/claude-review'), { recursive: true });
  writeFileSync(join(codexHome, 'skills/claude-review/SKILL.md'), 'x');
  const r = run(m, ['--host', 'codex'], { CODEX_HOME: codexHome });
  assert.equal(r.state('reviewer-plugin'), 'MISSING', r.out);
});

test('(e) Claude host without codex on PATH', () => {
  const m = machine();
  const r = run(m, ['--host', 'claude']);
  assert.equal(r.state('reviewer-cli'), 'MISSING', r.out);
  assert.equal(r.state('reviewer-login'), 'SKIP');
});

test('(f) codex not logged in', () => {
  const m = completeClaude(machine()).stub('codex', 1);
  const r = run(m, ['--host', 'claude', '--platform', 'linux']);
  assert.equal(r.state('reviewer-login'), 'LOGIN', r.out);
  assert.equal(r.status, 1);
});

test('(g) Windows: executables through PATHEXT, home from USERPROFILE', () => {
  const m = machine();
  writeFileSync(join(m.bin, 'codegraph.cmd'), '@echo off\r\n');
  const winHome = join(m.root, 'winhome');
  mkdirSync(join(winHome, '.agents/skills/mstack-setup'), { recursive: true });
  writeFileSync(join(winHome, '.agents/skills/mstack-setup/SKILL.md'), 'x');
  const r = run(m, ['--host', 'claude', '--platform', 'win32'], { PATHEXT: '.CMD;.EXE', USERPROFILE: winHome });
  assert.equal(r.state('codegraph-cli'), 'ok', r.out);
  assert.equal(r.state('mstack-setup'), 'ok');
  assert.equal(r.json.platform, 'win32');
});

test('(h) unknown platform: still reports, marked unsupported', () => {
  const m = machine();
  const r = run(m, ['--host', 'claude', '--platform', 'freebsd']);
  assert.equal(r.json.supported, false, r.out);
  assert.ok(r.json.items.length > 10);
});

test('(i) a skill only under ~/.agents/skills counts as installed', () => {
  const m = machine().skill('.agents/skills/mstack-find-skills');
  const r = run(m, ['--host', 'claude']);
  assert.equal(r.state('mstack-find-skills'), 'ok', r.out);
});

test('(i2) a standalone ponytail skill without the plugin is not the plugin', () => {
  const m = machine().skill('.agents/skills/ponytail');
  const r = run(m, ['--host', 'claude']);
  assert.equal(r.state('ponytail'), 'MISSING', r.out);
  assert.match(r.json.items.find((i) => i.id === 'ponytail').detail, /without the plugin/);
});

test('(i3) a plugin left in the cache without an install record is not installed', () => {
  const m = machine();
  m.skill('.claude/plugins/cache/ponytail/ponytail/5.3.3/skills/ponytail');
  const r = run(m, ['--host', 'claude']);
  assert.equal(r.state('ponytail'), 'MISSING', r.out);
});

test('(j) no file under the home folder changes', () => {
  const m = completeClaude(machine());
  const before = listing(m.home);
  run(m, ['--host', 'claude']); run(m, ['--host', 'codex']);
  assert.equal(listing(m.home), before);
});

test('(k) unknown host is a usage error', () => {
  const m = machine();
  const r = spawnSync(process.execPath, [script, '--host', 'other'], { encoding: 'utf8', env: { PATH: m.bin, HOME: m.home } });
  assert.equal(r.status, 2, `${r.stdout}${r.stderr}`);
});

test('(k2) no home folder is a usage error', () => {
  const m = machine();
  const r = spawnSync(process.execPath, [script, '--host', 'claude'], { encoding: 'utf8', env: { PATH: m.bin } });
  assert.equal(r.status, 2, `${r.stdout}${r.stderr}`);
});

test('(l) macOS: same result as Linux, home from HOME', () => {
  const m = completeClaude(machine());
  const r = run(m, ['--host', 'claude', '--platform', 'darwin'], { USERPROFILE: join(m.root, 'elsewhere') });
  assert.equal(r.status, 0, r.out);
  for (const id of [...MANDATORY_CLAUDE, 'reviewer-login']) assert.equal(r.state(id), 'ok', `${id}: ${r.out}`);
});

test('(m) CLAUDE_CONFIG_DIR replaces ~/.claude', () => {
  const m = machine();
  completeClaude(m, 'cfg');
  const r = run(m, ['--host', 'claude', '--platform', 'linux'], { CLAUDE_CONFIG_DIR: join(m.home, 'cfg') });
  assert.equal(r.status, 0, r.out);
  assert.equal(r.state('ponytail'), 'ok');
  assert.equal(r.state('codegraph-connected'), 'ok');
  const plain = run(m, ['--host', 'claude', '--platform', 'linux']);
  assert.equal(plain.state('ponytail'), 'MISSING', plain.out);
});
