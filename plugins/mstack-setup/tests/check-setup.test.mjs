// Tests for scripts/check-setup.mjs. Each test builds a throwaway home folder and a bin folder of stubs,
// and runs the script with only those on PATH, so nothing on the real machine is read or changed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
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
  'reviewer-cli', 'mstack-find-skills', 'mstack-best-model-for', 'mstack-receive-review', 'mstack-research', 'mstack-setup'];

function completeClaude(m, base = '.claude') {
  m.stub('node').stub('git').stub('codegraph').stub('codex');
  const cache = `${base}/plugins/cache`;
  m.skill(`${cache}/ponytail/ponytail/5.3.3/skills/ponytail`);
  m.file(`${cache}/skill-codex/skill-codex/1.3.1/skills/codex/SKILL.md`, 'Run codex exec.');
  for (const s of ['mstack-find-skills', 'mstack-best-model-for', 'mstack-receive-review', 'mstack-research', 'mstack-setup']) m.skill(`${cache}/mstack/${s}/0.1.0/skills/${s}`);
  m.file(`${base}/plugins/installed_plugins.json`, JSON.stringify({ version: 2, plugins: { 'ponytail@ponytail': [{}], 'skill-codex@skill-codex': [{}],
    'mstack-find-skills@mstack': [{}], 'mstack-best-model-for@mstack': [{}], 'mstack-receive-review@mstack': [{}], 'mstack-research@mstack': [{}], 'mstack-setup@mstack': [{}] } }));
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

test('(d) Codex host: the reviewer is the claude client, codegraph in config.toml', () => {
  const m = machine().stub('codegraph').stub('claude');
  const codexHome = join(m.root, 'codex-home');
  mkdirSync(codexHome, { recursive: true });
  writeFileSync(join(codexHome, 'config.toml'), '[mcp_servers.codegraph]\ncommand = "codegraph"\n');
  const r = run(m, ['--host', 'codex'], { CODEX_HOME: codexHome });
  assert.equal(r.state('codegraph-connected'), 'ok', r.out);
  assert.equal(r.state('reviewer-cli'), 'ok');
  assert.equal(r.state('reviewer-login'), 'ok');
  assert.equal(r.state('reviewer-plugin'), undefined, 'Codex has no reviewer plugin row');
});

test('(d2) Codex host: the reviewer group is the client and its login, and no plugin row exists', () => {
  const m = machine().stub('node').stub('claude', 1);
  const r = run(m, ['--host', 'codex', '--needs', 'reviewer']);
  assert.equal(r.status, 1, r.out);
  assert.deepEqual(r.json.items.filter((i) => i.blocking).map((i) => i.id), ['node', 'reviewer-cli', 'reviewer-login']);
  assert.equal(r.state('reviewer-login'), 'LOGIN');
  assert.equal(run(m.stub('claude'), ['--host', 'codex', '--needs', 'reviewer']).status, 0);
  assert.equal(run(m, ['--host', 'codex', '--needs', 'reviewer-plugin']).status, 2);
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
  run(m, ['--host', 'claude']); run(m, ['--host', 'codex']); run(m, ['--host', 'antigravity']);
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

// The Codex plugin (Codex as developer in mstack-claude-pm-codex-dev) and the two newer mstack skills.
test('claude: the Codex plugin in the install record is an ok optional codex-plugin row', () => {
  const m = machine().file('.claude/plugins/installed_plugins.json', JSON.stringify({ version: 2, plugins: { 'codex@openai-codex': [{}] } }));
  const r = run(m, ['--host', 'claude']);
  const row = r.json.items.find((i) => i.id === 'codex-plugin');
  assert.deepEqual([row?.state, row?.tier], ['ok', 'optional'], r.out);
});

test('claude: without the Codex plugin the codex-plugin row is MISSING and optional', () => {
  const m = machine().file('.claude/plugins/installed_plugins.json', JSON.stringify({ version: 2, plugins: {} }));
  const r = run(m, ['--host', 'claude']);
  const row = r.json.items.find((i) => i.id === 'codex-plugin');
  assert.deepEqual([row?.state, row?.tier], ['MISSING', 'optional'], r.out);
});

test('codex: no codex-plugin row and no mstack-claude-pm-codex-dev row', () => {
  const r = run(machine(), ['--host', 'codex']);
  assert.equal(r.json.items.some((i) => i.id === 'codex-plugin' || i.id === 'mstack-claude-pm-codex-dev'), false, r.out);
});

test('claude: a missing mstack-claude-pm-codex-dev is an optional MISSING row', () => {
  const r = run(machine(), ['--host', 'claude']);
  const row = r.json.items.find((i) => i.id === 'mstack-claude-pm-codex-dev');
  assert.deepEqual([row?.state, row?.tier], ['MISSING', 'optional'], r.out);
});

for (const host of ['claude', 'codex']) {
  test(`${host}: mstack-brainstorm is an optional row`, () => {
    const r = run(machine(), ['--host', host]);
    assert.equal(r.json.items.find((i) => i.id === 'mstack-brainstorm')?.tier, 'optional', r.out);
  });
  test(`${host}: mstack-chief-of-staff is an optional row`, () => {
    const r = run(machine(), ['--host', host]);
    assert.equal(r.json.items.find((i) => i.id === 'mstack-chief-of-staff')?.tier, 'optional', r.out);
  });
  test(`${host}: mstack-explain-me-better is an optional row`, () => {
    const r = run(machine(), ['--host', host]);
    assert.equal(r.json.items.find((i) => i.id === 'mstack-explain-me-better')?.tier, 'optional', r.out);
  });
  for (const skill of ['mstack-product-plan', 'mstack-epic', 'mstack-evidence', 'mstack-decisions', 'mstack-auto', 'mstack-write-issue', 'mstack-anonymize', 'mstack-web-ui']) {
    test(`${host}: ${skill} is an optional row`, () => {
      const r = run(machine(), ['--host', host]);
      assert.equal(r.json.items.find((i) => i.id === skill)?.tier, 'optional', r.out);
    });
  }
  test(`${host}: archify is an optional row, MISSING without it and ok with it, and never fails the run alone`, () => {
    const complete = host === 'claude' ? completeClaude(machine()) : null;
    const bare = run(machine(), ['--host', host]);
    const row = bare.json.items.find((i) => i.id === 'archify');
    assert.deepEqual([row?.tier, row?.state], ['optional', 'MISSING'], bare.out);
    const m = machine();
    m.skill('.agents/skills/archify');
    const withIt = run(m, ['--host', host]);
    assert.equal(withIt.json.items.find((i) => i.id === 'archify')?.state, 'ok', withIt.out);
    if (complete) {
      const r = run(complete, ['--host', host]);
      assert.equal(r.json.items.find((i) => i.id === 'archify')?.state, 'MISSING', r.out);
      assert.equal(r.status, 0, r.out);
    }
  });
}

// A skill in the plugin cache counts only when the host records its plugin (a cache folder alone can be a leftover).
test('claude: a skill only in a leftover cache clone is MISSING', () => {
  const m = machine().skill('.claude/plugins/cache/temp_git_1/plugins/mstack-find-skills/skills/mstack-find-skills')
    .file('.claude/plugins/installed_plugins.json', JSON.stringify({ version: 2, plugins: {} }));
  assert.equal(run(m, ['--host', 'claude']).state('mstack-find-skills'), 'MISSING');
});
test('claude: a cached skill of a recorded plugin is ok', () => {
  const m = machine().skill('.claude/plugins/cache/mstack/mstack-find-skills/0.1.0/skills/mstack-find-skills')
    .file('.claude/plugins/installed_plugins.json', JSON.stringify({ version: 2, plugins: { 'mstack-find-skills@mstack': [{}] } }));
  assert.equal(run(m, ['--host', 'claude']).state('mstack-find-skills'), 'ok');
});
test('codex: a cached skill whose plugin is switched off is MISSING, and ok when it is on', () => {
  const off = machine().skill('.codex/plugins/cache/mstack/mstack-find-skills/0.1.0/skills/mstack-find-skills')
    .file('.codex/config.toml', '[plugins."mstack-find-skills@mstack"]\nenabled = false\n');
  assert.equal(run(off, ['--host', 'codex']).state('mstack-find-skills'), 'MISSING');
  const on = machine().skill('.codex/plugins/cache/mstack/mstack-find-skills/0.1.0/skills/mstack-find-skills')
    .file('.codex/config.toml', '[plugins."mstack-find-skills@mstack"]\nenabled = true\n');
  assert.equal(run(on, ['--host', 'codex']).state('mstack-find-skills'), 'ok');
});

// ---- --needs: the rows one calling skill needs (issue 23) ----
const blocking = (r) => r.json.items.filter((i) => i.blocking).map((i) => i.id);

test('needs: without --needs every mandatory row and every reviewer row blocks, and only those', () => {
  const r = run(completeClaude(machine()), ['--host', 'claude']);
  assert.deepEqual(blocking(r), r.json.items.filter((i) => i.tier === 'mandatory' || i.id.startsWith('reviewer-')).map((i) => i.id));
});

test('needs: a caller that needs no reviewer is not stopped by a reviewer that is not logged in', () => {
  const m = completeClaude(machine()).stub('codex', 1);
  assert.equal(run(m, ['--host', 'claude']).status, 1);
  const r = run(m, ['--host', 'claude', '--needs', 'git,mstack-find-skills']);
  assert.equal(r.status, 0, r.out);
  assert.equal(r.state('reviewer-login'), 'LOGIN');
  assert.deepEqual(blocking(r), ['node', 'git', 'mstack-find-skills']);
});

test('needs: a caller that needs the reviewer is stopped when it is not logged in, or when its tool is missing', () => {
  const m = completeClaude(machine()).stub('codex', 1);
  const r = run(m, ['--host', 'claude', '--needs', 'reviewer']);
  assert.equal(r.status, 1, r.out);
  assert.deepEqual(blocking(r), ['node', 'reviewer-plugin', 'reviewer-cli', 'reviewer-login']);
  const bare = machine().stub('node');
  assert.equal(run(bare, ['--host', 'claude', '--needs', 'reviewer-login']).status, 1);
});

test('needs: the codegraph group, and an optional row that a caller needs blocks it', () => {
  const m = completeClaude(machine());
  const r = run(m, ['--host', 'claude', '--needs', 'codegraph, mstack-diagnose']);
  assert.equal(r.status, 1, r.out);
  assert.deepEqual(blocking(r), ['node', 'codegraph-cli', 'codegraph-connected', 'mstack-diagnose']);
  assert.equal(r.state('mstack-diagnose'), 'MISSING');
});

test('needs: a name that is no row and no group is a usage error, never a pass', () => {
  const r = run(completeClaude(machine()), ['--host', 'claude', '--needs', 'git,reviewer-logon']);
  assert.equal(r.status, 2, r.out);
  assert.match(r.out, /reviewer-logon/);
});

test('needs: a name every object inherits, such as constructor, is no group', () => {
  for (const name of ['constructor', 'toString', 'hasOwnProperty']) {
    assert.equal(run(completeClaude(machine()), ['--host', 'claude', '--needs', name]).status, 2, name);
  }
});

test('the three reviewer rows are optional, and still block a caller that sends no --needs', () => {
  const r = run(completeClaude(machine()).stub('codex', 1), ['--host', 'claude']);
  for (const id of ['reviewer-plugin', 'reviewer-cli', 'reviewer-login']) {
    const row = r.json.items.find((i) => i.id === id);
    assert.deepEqual([row.tier, row.blocking], ['optional', true], id);
  }
  assert.equal(r.status, 1, r.out);
  assert.ok(r.json.items.filter((i) => i.tier === 'mandatory').every((i) => i.state === 'ok'), r.out);
});

// Antigravity: skills in ~/.gemini/config/skills, in plugins/<plugin>/skills/<name>, never in ~/.agents/skills (the skills CLI's global folder
// for the agent is ~/.gemini/config/skills; .agents/skills is its workspace folder); the code index connects through mcp_config.json.
const MSTACK_ALL = ['mstack-find-skills', 'mstack-best-model-for', 'mstack-receive-review', 'mstack-research', 'mstack-setup',
  'mstack-plan', 'mstack-write-specs', 'mstack-brainstorm', 'mstack-diagnose', 'mstack-backlog-triage', 'mstack-handoff', 'mstack-skill-creator',
  'mstack-chief-of-staff', 'mstack-explain-me-better', 'mstack-product-plan', 'mstack-epic', 'mstack-evidence', 'mstack-decisions',
  'mstack-auto', 'mstack-write-issue', 'mstack-anonymize', 'mstack-web-ui'];
const agy = (m) => {
  m.file('.gemini/config/skills/.keep').file('.gemini/config/plugins/.keep');
  writeFileSync(join(m.bin, 'agy'), `#!/bin/sh\necho "$@" >> "${m.root}/agy-calls.log"\n`); chmodSync(join(m.bin, 'agy'), 0o755);
  return m;
};
const ANTI = ['--host', 'antigravity'];
const item = (r, id) => r.json.items.find((i) => i.id === id);
function completeAnti(m) {
  agy(m).stub('node').stub('git').stub('codegraph');
  m.file('.gemini/config/mcp_config.json', JSON.stringify({ mcpServers: { codegraph: { command: 'codegraph', args: ['serve', '--mcp'] } } }));
  m.skill('.gemini/config/skills/ponytail');
  for (const s of MSTACK_ALL) m.skill(`.gemini/config/plugins/${s}/skills/${s}`);
  return m;
}

test('antigravity: index installed, not connected, no mstack skill', () => {
  const m = agy(machine()).stub('node').stub('git').stub('codegraph').file('.gemini/config/mcp_config.json', '');
  const r = run(m, ANTI);
  assert.equal(r.status, 1, r.out);
  assert.equal(r.state('codegraph-cli'), 'ok');
  assert.equal(r.state('codegraph-connected'), 'MISSING');
  for (const id of MSTACK_ALL) assert.equal(r.state(id), 'MISSING', id);
});

test('antigravity: codegraph connected through mcp_config.json', () => {
  const r = run(completeAnti(machine()), ANTI);
  assert.equal(r.state('codegraph-connected'), 'ok', r.out);
  assert.match(item(r, 'codegraph-connected').detail, /Antigravity/);
});

test('antigravity: a broken or codegraph-less mcp_config.json is not connected', () => {
  for (const text of ['{ nope', '{"mcpServers":{}}']) {
    const m = completeAnti(machine()).file('.gemini/config/mcp_config.json', text);
    assert.equal(run(m, ANTI).state('codegraph-connected'), 'MISSING', text);
  }
});

test('antigravity: ponytail skills in the skills folder are ok, with the hooks note', () => {
  const r = run(completeAnti(machine()), ANTI);
  assert.equal(r.state('ponytail'), 'ok', r.out);
  assert.match(item(r, 'ponytail').detail, /hooks do not run in Antigravity/);
});

test('antigravity: ponytail inside an installed plugin is ok', () => {
  const m = agy(machine()).skill('.gemini/config/plugins/ponytail/skills/ponytail');
  assert.equal(run(m, ANTI).state('ponytail'), 'ok');
});

test('antigravity: ponytail missing is a mandatory MISSING row and fails the run', () => {
  const m = completeAnti(machine());
  rmSync(join(m.home, '.gemini/config/skills/ponytail'), { recursive: true });
  const r = run(m, ANTI);
  assert.deepEqual([item(r, 'ponytail').tier, r.state('ponytail'), r.status], ['mandatory', 'MISSING', 1], r.out);
});

test('antigravity: an mstack skill in a plugin folder is ok', () => {
  const m = agy(machine()).skill('.gemini/config/plugins/mstack-research/skills/mstack-research');
  assert.equal(run(m, ANTI).state('mstack-research'), 'ok');
});

test('antigravity: a skill in the skills CLI global folder is ok, and one under ~/.agents/skills is not', () => {
  const m = agy(machine()).skill('.gemini/config/skills/mstack-plan').skill('.agents/skills/ponytail').skill('.agents/skills/archify');
  const r = run(m, ANTI);
  assert.equal(r.state('mstack-plan'), 'ok', r.out);
  assert.equal(r.state('ponytail'), 'MISSING', r.out);
  assert.equal(r.state('archify'), 'MISSING', r.out);
});

test('antigravity: codegraph connected through the older settings file, and the detail names the file', () => {
  const entry = JSON.stringify({ mcpServers: { codegraph: { command: 'codegraph', args: ['serve', '--mcp'] } } });
  const old = agy(machine()).stub('codegraph').file('.gemini/antigravity/mcp_config.json', entry);
  const r = run(old, ANTI);
  assert.equal(r.state('codegraph-connected'), 'ok', r.out);
  assert.match(item(r, 'codegraph-connected').detail, /\.gemini\/antigravity\/mcp_config\.json/);
  const r2 = run(completeAnti(machine()), ANTI);
  assert.match(item(r2, 'codegraph-connected').detail, /\.gemini\/config\/mcp_config\.json/);
});

test('antigravity: an entry that is no object with a command is not connected', () => {
  for (const v of ['true', '[]', '{}', '{"command":""}', '"codegraph"', '["codegraph"]']) {
    const m = completeAnti(machine()).file('.gemini/config/mcp_config.json', `{"mcpServers":{"codegraph":${v}}}`);
    const r = run(m, [...ANTI, '--needs', 'codegraph']);
    assert.equal(r.state('codegraph-connected'), 'MISSING', v);
    assert.equal(r.status, 1, v);
  }
});

test('antigravity: a linked plugin folder and a linked SKILL.md count, a folder named SKILL.md does not', () => {
  const m = agy(machine());
  const real = join(m.root, 'elsewhere/mstack-plan');
  mkdirSync(join(real, 'skills/mstack-plan'), { recursive: true }); writeFileSync(join(real, 'skills/mstack-plan/SKILL.md'), 'x');
  symlinkSync(real, join(m.home, '.gemini/config/plugins/mstack-plan'));
  mkdirSync(join(m.home, '.gemini/config/plugins/mstack-epic/skills/mstack-epic'), { recursive: true });
  symlinkSync(join(real, 'skills/mstack-plan/SKILL.md'), join(m.home, '.gemini/config/plugins/mstack-epic/skills/mstack-epic/SKILL.md'));
  symlinkSync(join(m.root, 'nowhere'), join(m.home, '.gemini/config/plugins/mstack-auto'));
  mkdirSync(join(m.home, '.gemini/config/skills/mstack-diagnose/SKILL.md'), { recursive: true });
  mkdirSync(join(m.home, '.gemini/config/plugins/mstack-handoff/skills/mstack-handoff/SKILL.md'), { recursive: true });
  const r = run(m, ANTI);
  assert.deepEqual(['mstack-plan', 'mstack-epic', 'mstack-auto', 'mstack-diagnose', 'mstack-handoff'].map((id) => r.state(id)), ['ok', 'ok', 'MISSING', 'MISSING', 'MISSING'], r.out);
});

test('antigravity: a plugin skill counts only directly under <plugin>/skills/<name>, not deeper in the plugin', () => {
  const P = '.gemini/config/plugins';
  const m = agy(machine()).skill(`${P}/mstack-plan/skills/mstack-plan`)
    .skill(`${P}/mstack-epic/examples/skills/mstack-epic`).skill(`${P}/vendor/1.0.0/skills/mstack-auto`).skill(`${P}/skills/mstack-diagnose`);
  const r = run(m, ANTI);
  assert.deepEqual(['mstack-plan', 'mstack-epic', 'mstack-auto', 'mstack-diagnose'].map((id) => r.state(id)), ['ok', 'MISSING', 'MISSING', 'MISSING'], r.out);
  assert.equal(run(m, [...ANTI, '--needs', 'mstack-epic']).status, 1);
});

test('needs: a value with no name in it is a usage error, on every host', () => {
  for (const host of ['claude', 'codex', 'antigravity']) for (const v of ['', ' , ', ',']) {
    assert.equal(run(machine().stub('node'), ['--host', host, '--needs', v]).status, 2, `${host} "${v}"`);
  }
});

test('antigravity: the 22 mstack rows keep today\'s tiers', () => {
  const r = run(machine(), ANTI);
  for (const id of MSTACK_ALL) assert.equal(item(r, id)?.tier, MSTACK_ALL.indexOf(id) < 5 ? 'mandatory' : 'optional', id);
});

test('antigravity: ui-ux-pro-max is one WARN row and a complete setup still exits 0', () => {
  const r = run(completeAnti(machine()), ANTI);
  assert.deepEqual([r.state('ui-ux-pro-max'), item(r, 'ui-ux-pro-max').tier], ['WARN', 'optional'], r.out);
  assert.equal(r.json.items.filter((i) => i.state === 'WARN').length, 1, r.out);
  assert.equal(r.json.items.filter((i) => i.id === 'ui-ux-pro-max').length, 1, r.out);
  assert.equal(item(r, 'ui-ux-pro-max').detail, 'UI design skill: not available in Antigravity');
  assert.equal(r.status, 0, r.out);
  const m = completeAnti(machine()).skill('.gemini/config/skills/ui-ux-pro-max');
  assert.equal(run(m, ANTI).state('ui-ux-pro-max'), 'ok');
});

test('antigravity: a caller that needs ui-ux-pro-max is blocked by its WARN row', () => {
  const r = run(completeAnti(machine()), [...ANTI, '--needs', 'ui-ux-pro-max']);
  assert.equal(r.status, 1, r.out);
});

test('antigravity: no reviewer, codex-plugin or workflow row', () => {
  const r = run(completeAnti(machine()), ANTI);
  const bad = r.json.items.map((i) => i.id).filter((id) => /^reviewer-|^codex-plugin$|review-workflow$|pm-codex-dev$/.test(id));
  assert.deepEqual(bad, []);
  for (const id of ['archify', 'gh', 'python3']) assert.equal(item(r, id)?.tier, 'optional', id);
});

test('antigravity: --needs reviewer exits 2 with the message', () => {
  const r = run(completeAnti(machine()), [...ANTI, '--needs', 'reviewer']);
  assert.equal(r.status, 2);
  assert.match(r.out, /--needs names no row and no group of this host: reviewer/);
});

test('antigravity: --needs codegraph still works', () => {
  assert.equal(run(completeAnti(machine()), [...ANTI, '--needs', 'codegraph']).status, 0);
});

test('antigravity: the status runs no agy command', () => {
  const m = completeAnti(machine());
  run(m, ANTI);
  assert.equal(existsSync(join(m.root, 'agy-calls.log')), false);
});

test('claude: a missing ui-ux-pro-max is MISSING, not WARN', () => {
  assert.equal(run(machine(), ['--host', 'claude']).state('ui-ux-pro-max'), 'MISSING');
});
