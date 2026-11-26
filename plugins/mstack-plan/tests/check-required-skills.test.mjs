// Tests for scripts/check-required-skills.sh: the five shared skills are hard requirements on every host,
// no reviewer or client check is printed, and each host recommends its own two workflows.
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const script = resolve(dirname(fileURLToPath(import.meta.url)), '../skills/mstack-plan/scripts/check-required-skills.sh');
const bash = spawnSync('sh', ['-c', 'command -v bash'], { encoding: 'utf8' }).stdout.trim();
const temps = [];
const temp = (prefix) => { const dir = mkdtempSync(join(tmpdir(), prefix)); temps.push(dir); return dir; };
after(() => { for (const dir of temps) rmSync(dir, { recursive: true, force: true }); });

const skillDir = { claude: '.claude/skills', codex: '.codex/skills', antigravity: '.gemini/config/skills' };
const shared = ['mstack-find-skills', 'mstack-best-model-for', 'mstack-receive-review', 'mstack-research', 'mstack-vendors'];
const hosts = ['claude', 'codex', 'antigravity'];
const workflowsByHost = {
  claude: ['mstack-claude-led-review', 'mstack-claude-led-dev'],
  codex: ['mstack-codex-led-review', 'mstack-codex-led-dev'],
  antigravity: ['mstack-antigravity-led-review', 'mstack-antigravity-led-dev'],
};

function run(host, skills) {
  const root = temp('plan-req-');
  const home = join(root, 'home'), bin = join(root, 'bin');
  mkdirSync(bin, { recursive: true });
  for (const t of ['node', 'git']) { writeFileSync(join(bin, t), '#!/bin/sh\nexit 0\n'); chmodSync(join(bin, t), 0o755); }
  for (const s of skills) { mkdirSync(join(home, skillDir[host], s), { recursive: true }); writeFileSync(join(home, skillDir[host], s, 'SKILL.md'), 'x'); }
  mkdirSync(home, { recursive: true });
  // A bin folder of its own plus the system folders for the shell's own tools (find, grep, dirname).
  const r = spawnSync(bash, [script, '--host', host], { encoding: 'utf8', cwd: root, env: { HOME: home, PATH: `${bin}:/usr/bin:/bin` } });
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
}

for (const host of hosts) {
  test(`${host}: missing shared skills are reported and fail the check`, () => {
    const r = run(host, []);
    assert.equal(r.status, 1, r.out);
    assert.match(r.out, /MISSING {2}mstack-find-skills/);
    assert.match(r.out, /MISSING {2}mstack-best-model-for/);
  });
  test(`${host}: installed shared skills are not reported missing`, () => {
    const r = run(host, shared);
    assert.equal(r.status, 0, r.out);
    for (const s of shared) {
      assert.doesNotMatch(r.out, new RegExp(`MISSING {2}${s}`), r.out);
      assert.match(r.out, new RegExp(`ok {7}${s}`), r.out);
    }
  });
  test(`${host}: a missing mstack-receive-review is reported and fails the check`, () => {
    const r = run(host, shared.filter((s) => s !== 'mstack-receive-review'));
    assert.equal(r.status, 1, r.out);
    assert.match(r.out, /MISSING {2}mstack-receive-review/);
  });
  test(`${host}: a missing mstack-research is reported and fails the check`, () => {
    const r = run(host, shared.filter((s) => s !== 'mstack-research'));
    assert.equal(r.status, 1, r.out);
    assert.match(r.out, /MISSING {2}mstack-research/);
  });
  test(`${host}: a missing mstack-vendors is reported and fails the check`, () => {
    const r = run(host, shared.filter((s) => s !== 'mstack-vendors'));
    assert.equal(r.status, 1, r.out);
    assert.match(r.out, /MISSING {2}mstack-vendors/);
  });
  test(`${host}: no reviewer line is printed`, () => {
    const r = run(host, shared);
    assert.equal(r.status, 0, r.out);
    assert.doesNotMatch(r.out, /codex skill|codex CLI|claude-review|claude CLI|same-vendor fallback/i, r.out);
  });
  test(`${host}: the recommended workflows are this host's two`, () => {
    const r = run(host, shared);
    assert.equal(r.status, 0, r.out);
    for (const wf of workflowsByHost[host]) assert.match(r.out, new RegExp(`\\b${wf}\\b`), r.out);
    for (const otherHost of hosts.filter((h) => h !== host)) {
      for (const wf of workflowsByHost[otherHost]) assert.doesNotMatch(r.out, new RegExp(`\\b${wf}\\b`), r.out);
    }
    assert.doesNotMatch(r.out, /\bmstack-[a-z-]+-workflow\b|\bmstack-claude-pm-/i, r.out);
  });
}

// A skill in the plugin cache counts only when the host records its plugin as installed.
function runCache(host, { record, where = 'mstack' }) {
  const root = temp('plan-req-');
  const home = join(root, 'home'), bin = join(root, 'bin');
  mkdirSync(bin, { recursive: true });
  for (const t of ['node', 'git']) { writeFileSync(join(bin, t), '#!/bin/sh\nexit 0\n'); chmodSync(join(bin, t), 0o755); }
  const dir = join(home, host === 'claude' ? '.claude' : '.codex');
  const put = (p, text = 'x') => { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, text); };
  for (const s of shared) {
    put(where === 'mstack' ? join(dir, 'plugins', 'cache', 'mstack', s, '0.1.0', 'skills', s, 'SKILL.md') : join(dir, 'plugins', 'cache', 'temp_git_1', 'plugins', s, 'skills', s, 'SKILL.md'));
  }
  if (host === 'claude') put(join(dir, 'plugins', 'installed_plugins.json'), JSON.stringify({ version: 2, plugins: record ? Object.fromEntries(shared.map((n) => [`${n}@mstack`, [{}]])) : {} }));
  else put(join(dir, 'config.toml'), record ? shared.map((n) => `[plugins."${n}@mstack"]\n${record}\n`).join('\n') : '');
  const r = spawnSync(bash, [script, '--host', host], { encoding: 'utf8', cwd: root, env: { HOME: home, PATH: `${bin}:/usr/bin:/bin` } });
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
}

for (const host of ['claude', 'codex']) {
  test(`${host}: a skill only in a leftover cache clone is MISSING`, () => {
    const r = runCache(host, { record: host === 'claude' ? true : 'enabled = true', where: 'temp' });
    assert.match(r.out, /MISSING {2}mstack-find-skills/, r.out);
  });
  test(`${host}: a cached skill with no install record is MISSING`, () => {
    const r = runCache(host, { record: null });
    assert.match(r.out, /MISSING {2}mstack-find-skills/, r.out);
  });
  test(`${host}: a cached skill of a recorded plugin is not MISSING`, () => {
    const r = runCache(host, { record: host === 'claude' ? true : 'enabled = true' });
    assert.equal(r.status, 0, r.out);
    assert.doesNotMatch(r.out, /MISSING {2}mstack-(find-skills|best-model-for|receive-review|research|vendors)/, r.out);
  });
}
test('codex: a cached skill whose plugin is switched off is MISSING', () => {
  const r = runCache('codex', { record: 'enabled = false' });
  assert.match(r.out, /MISSING {2}mstack-find-skills/, r.out);
});

// Antigravity keeps no install record: a plugin folder under the user's or the workspace's plugins is the install.
function runAt(host, base, { stubs = {} } = {}) { // base(root, home) = the folder that holds <plugin>/skills/<name>/SKILL.md
  const root = temp('plan-req-');
  const home = join(root, 'home'), bin = join(root, 'bin');
  mkdirSync(bin, { recursive: true }); mkdirSync(home, { recursive: true });
  for (const [t, body] of Object.entries({ node: 'exit 0', git: 'exit 0', ...stubs })) { writeFileSync(join(bin, t), `#!/bin/sh\n${body}\n`); chmodSync(join(bin, t), 0o755); }
  if (base) for (const s of shared) { const d = join(base(root, home), 'mstack-x', 'skills', s); mkdirSync(d, { recursive: true }); writeFileSync(join(d, 'SKILL.md'), 'x'); }
  const r = spawnSync(bash, [script, ...(host ? ['--host', host] : [])], { encoding: 'utf8', cwd: root, env: { HOME: home, PATH: `${bin}:/usr/bin:/bin` } });
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
}
const allOk = (r) => { for (const s of shared) assert.match(r.out, new RegExp(`ok {7}${s}`), r.out); };

test('antigravity: a skill in an installed plugin folder counts', () => {
  const r = runAt('antigravity', (root, home) => join(home, '.gemini', 'config', 'plugins'));
  assert.equal(r.status, 0, r.out);
  allOk(r);
});
test('antigravity: a skill in the workspace plugin folder counts', () => {
  const r = runAt('antigravity', (root) => join(root, '.agents', 'plugins'));
  assert.equal(r.status, 0, r.out);
  allOk(r);
});
test('usage names antigravity', () => {
  const r = runAt(null, null);
  assert.equal(r.status, 2, r.out);
  assert.match(r.out, /claude\|codex\|antigravity/);
});

// A host argument that is missing, unknown or given twice is a usage error, never a silent choice of host.
function runArgs(args, stubs = {}) {
  const root = temp('plan-req-');
  const home = join(root, 'home'), bin = join(root, 'bin');
  mkdirSync(bin, { recursive: true }); mkdirSync(home, { recursive: true });
  for (const [t, body] of Object.entries({ node: 'exit 0', git: 'exit 0', ...stubs })) { writeFileSync(join(bin, t), `#!/bin/sh\n${body}\n`); chmodSync(join(bin, t), 0o755); }
  const r = spawnSync(bash, [script, ...args], { encoding: 'utf8', cwd: root, env: { HOME: home, PATH: `${bin}:/usr/bin:/bin` } });
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
}
for (const args of [['--host'], ['--host', 'cursor'], ['--host=cursor'], ['--host', 'codex', '--host=antigravity'], ['--host', 'codex', '--host=antigravity', '--host'], ['claude', 'codex']]) {
  test(`usage error for: ${args.join(' ')}`, () => {
    const r = runArgs(args);
    assert.equal(r.status, 2, r.out);
    assert.match(r.out, /claude\|codex\|antigravity/, r.out);
    assert.doesNotMatch(r.out, /^(ok|MISSING|WARN|note) /m, r.out);
  });
}
test('--host=codex is accepted', () => {
  const r = runArgs(['--host=codex']);
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /MISSING {2}mstack-find-skills/, r.out);
});
