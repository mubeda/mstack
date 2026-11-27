// Tests for scripts/check-setup.mjs. Each test builds a throwaway home folder and a bin folder of stubs,
// and runs the script with only those on PATH, so nothing on the real machine is read or changed.
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const script = resolve(dirname(fileURLToPath(import.meta.url)), '../skills/mstack-setup/scripts/check-setup.mjs');

// Every throwaway machine is removed when the file's tests are done, so a run leaves nothing in the temporary directory.
const roots = [];
after(() => { for (const r of roots) rmSync(r, { recursive: true, force: true }); });

// What a signed-in client prints for its status command: codex a sentence, claude JSON. A stand-in prints it on every call.
const SAYS = { codex: 'echo "Logged in using ChatGPT"\n', claude: 'echo \'{"loggedIn": true}\'\n' };

function machine() {
  const root = mkdtempSync(join(tmpdir(), 'check-setup-'));
  roots.push(root);
  const home = join(root, 'home'), bin = join(root, 'bin');
  mkdirSync(home, { recursive: true }); mkdirSync(bin, { recursive: true });
  const m = {
    root, home, bin,
    stub(name, code = 0) {
      const p = join(bin, name);
      writeFileSync(p, `#!/bin/sh\n${SAYS[name] ?? ''}exit ${code}\n`); chmodSync(p, 0o755); return m;
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

const MANDATORY_CLAUDE = ['node', 'git', 'codegraph-cli', 'codegraph-connected', 'ponytail',
  'codex-cli', 'mstack-find-skills', 'mstack-best-model-for', 'mstack-receive-review', 'mstack-research', 'mstack-setup', 'mstack-vendors'];

function completeClaude(m, base = '.claude') {
  m.stub('node').stub('git').stub('codegraph').stub('codex');
  const cache = `${base}/plugins/cache`;
  m.skill(`${cache}/ponytail/ponytail/5.3.3/skills/ponytail`);
  const mstackMand = ['mstack-find-skills', 'mstack-best-model-for', 'mstack-receive-review', 'mstack-research', 'mstack-setup', 'mstack-vendors'];
  for (const s of mstackMand) m.skill(`${cache}/mstack/${s}/0.1.0/skills/${s}`);
  m.file(`${base}/plugins/installed_plugins.json`, JSON.stringify({
    version: 2,
    plugins: { 'ponytail@ponytail': [{}], ...Object.fromEntries(mstackMand.map((s) => [`${s}@mstack`, [{}]])) },
  }));
  const cfg = base === '.claude' ? '.claude.json' : `${base}/.claude.json`;
  m.file(cfg, JSON.stringify({ mcpServers: { codegraph: { command: 'codegraph', args: ['serve', '--mcp'] } } }));
  return m;
}

function listing(dir) {
  const out = [];
  const walk = (d) => { for (const n of readdirSync(d)) { const p = join(d, n); const s = statSync(p); out.push(`${p}:${s.size}:${s.mtimeMs}`); if (s.isDirectory()) walk(p); } };
  walk(dir); return out.sort().join('\n');
}

test('(a) empty machine: mandatory items missing, codex login skipped', () => {
  const m = machine();
  const r = run(m, ['--host', 'claude']);
  assert.equal(r.status, 1, r.out);
  for (const id of MANDATORY_CLAUDE) assert.equal(r.state(id), 'MISSING', `${id}: ${r.out}`);
  assert.equal(r.state('codex-login'), 'SKIP');
});

test('(b) complete Claude Code machine: every mandatory item ok', () => {
  const m = completeClaude(machine());
  const r = run(m, ['--host', 'claude', '--platform', 'linux']);
  assert.equal(r.status, 0, r.out);
  for (const id of [...MANDATORY_CLAUDE, 'codex-login']) assert.equal(r.state(id), 'ok', `${id}: ${r.out}`);
});

test('(c) codegraph on PATH but not connected', () => {
  const m = machine().stub('codegraph');
  const r = run(m, ['--host', 'claude']);
  assert.equal(r.state('codegraph-cli'), 'ok', r.out);
  assert.equal(r.state('codegraph-connected'), 'MISSING');
});

test('(d) Codex host: the claude client and its sign-in are the vendor rows, codegraph in config.toml', () => {
  const m = machine().stub('codegraph').stub('claude');
  const codexHome = join(m.root, 'codex-home');
  mkdirSync(codexHome, { recursive: true });
  writeFileSync(join(codexHome, 'config.toml'), '[mcp_servers.codegraph]\ncommand = "codegraph"\n');
  const r = run(m, ['--host', 'codex'], { CODEX_HOME: codexHome });
  assert.equal(r.state('codegraph-connected'), 'ok', r.out);
  assert.equal(r.state('claude-cli'), 'ok');
  assert.equal(r.state('claude-login'), 'ok');
});

test('(d2) Codex host: the reviewer group is the client and its login, and no plugin row exists', () => {
  const m = machine().stub('node').stub('claude', 1);
  // No ready channel: the rows are reported and block nothing, and the caller runs its fallback review.
  const r = run(m, ['--host', 'codex', '--needs', 'reviewer']);
  assert.equal(r.status, 0, r.out);
  assert.deepEqual(r.json.items.filter((i) => i.blocking).map((i) => i.id), ['node']);
  assert.equal(r.state('claude-login'), 'LOGIN');
  const ready = run(m.stub('claude'), ['--host', 'codex', '--needs', 'reviewer']);
  assert.deepEqual([ready.status, ready.json.items.filter((i) => i.blocking).map((i) => i.id)], [0, ['node', 'claude-cli', 'claude-login']], ready.out);
  assert.equal(run(m, ['--host', 'codex', '--needs', 'codex-plugin']).status, 2);
});

test('(e) Claude host without codex on PATH', () => {
  const m = machine();
  const r = run(m, ['--host', 'claude']);
  assert.equal(r.state('codex-cli'), 'MISSING', r.out);
  assert.equal(r.state('codex-login'), 'SKIP');
});

test('(f) codex not logged in', () => {
  const m = completeClaude(machine()).stub('codex', 1);
  const r = run(m, ['--host', 'claude', '--platform', 'linux']);
  assert.equal(r.state('codex-login'), 'LOGIN', r.out);
  assert.equal(r.status, 0, 'a signed-out client of another vendor never fails a run without --needs');
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
  for (const id of [...MANDATORY_CLAUDE, 'codex-login']) assert.equal(r.state(id), 'ok', `${id}: ${r.out}`);
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

// The Codex plugin (Codex as the developer in mstack-claude-led-dev) and the newer mstack skills.
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

test('codex: no codex-plugin row', () => {
  const r = run(machine(), ['--host', 'codex']);
  assert.equal(r.json.items.some((i) => i.id === 'codex-plugin'), false, r.out);
});

test('claude: a missing mstack-claude-led-dev is an optional MISSING row', () => {
  const r = run(machine(), ['--host', 'claude']);
  const row = r.json.items.find((i) => i.id === 'mstack-claude-led-dev');
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
  for (const skill of ['mstack-product-plan', 'mstack-epic', 'mstack-evidence', 'mstack-decisions', 'mstack-auto', 'mstack-write-issue', 'mstack-anonymize', 'mstack-web-ui', 'mstack-resolve-merge-conflicts', 'mstack-sharpen-prompt']) {
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
const ALL_VENDOR = ['claude-cli', 'claude-login', 'codex-cli', 'codex-login'];
const blocking = (r) => r.json.items.filter((i) => i.blocking).map((i) => i.id);

test('needs: without --needs every mandatory row blocks, and only those', () => {
  const r = run(completeClaude(machine()), ['--host', 'claude']);
  assert.deepEqual(blocking(r), r.json.items.filter((i) => i.tier === 'mandatory').map((i) => i.id));
});

test('needs: a caller that needs no reviewer is not stopped by a reviewer that is not logged in', () => {
  const m = completeClaude(machine()).stub('codex', 1);
  assert.equal(run(m, ['--host', 'claude']).status, 0);
  const r = run(m, ['--host', 'claude', '--needs', 'git,mstack-find-skills']);
  assert.equal(r.status, 0, r.out);
  assert.equal(r.state('codex-login'), 'LOGIN');
  assert.deepEqual(blocking(r), ['node', 'git', 'mstack-find-skills']);
});

test('needs: a caller that needs the reviewer is not stopped when the reviewer is not logged in, but one that names the row is', () => {
  const m = completeClaude(machine()).stub('codex', 1);
  const r = run(m, ['--host', 'claude', '--needs', 'reviewer']);
  assert.equal(r.status, 0, r.out);
  assert.deepEqual(blocking(r), ['node']);
  assert.equal(r.state('codex-login'), 'LOGIN');
  const bare = machine().stub('node');
  assert.equal(run(bare, ['--host', 'claude', '--needs', 'codex-login']).status, 1);
});

test('needs: the codegraph group, and an optional row that a caller needs blocks it', () => {
  const m = completeClaude(machine());
  const r = run(m, ['--host', 'claude', '--needs', 'codegraph, mstack-diagnose']);
  assert.equal(r.status, 1, r.out);
  assert.deepEqual(blocking(r), ['node', 'codegraph-cli', 'codegraph-connected', 'mstack-diagnose']);
  assert.equal(r.state('mstack-diagnose'), 'MISSING');
});

test('needs: a name that is no row and no group is a usage error, never a pass', () => {
  const r = run(completeClaude(machine()), ['--host', 'claude', '--needs', 'git,codex-logon']);
  assert.equal(r.status, 2, r.out);
  assert.match(r.out, /codex-logon/);
});

test('needs: a name every object inherits, such as constructor, is no group', () => {
  for (const name of ['constructor', 'toString', 'hasOwnProperty']) {
    assert.equal(run(completeClaude(machine()), ['--host', 'claude', '--needs', name]).status, 2, name);
  }
});

test('the vendor rows are optional, and block nothing for a caller that sends no --needs', () => {
  const r = run(completeClaude(machine()).stub('codex', 1), ['--host', 'claude']);
  for (const id of ['codex-cli', 'codex-login']) {
    const row = r.json.items.find((i) => i.id === id);
    assert.deepEqual([row.tier, row.blocking], ['optional', false], id);
  }
  assert.equal(r.status, 0, r.out);
});

// Antigravity: skills in ~/.gemini/config/skills, in plugins/<plugin>/skills/<name>, never in ~/.agents/skills (the skills CLI's global folder
// for the agent is ~/.gemini/config/skills; .agents/skills is its workspace folder); the code index connects through mcp_config.json.
const MSTACK_ALL = ['mstack-find-skills', 'mstack-best-model-for', 'mstack-receive-review', 'mstack-research', 'mstack-setup', 'mstack-vendors',
  'mstack-plan', 'mstack-write-specs', 'mstack-brainstorm', 'mstack-diagnose', 'mstack-backlog-triage', 'mstack-handoff', 'mstack-skill-creator',
  'mstack-chief-of-staff', 'mstack-explain-me-better', 'mstack-product-plan', 'mstack-epic', 'mstack-evidence', 'mstack-decisions',
  'mstack-auto', 'mstack-write-issue', 'mstack-anonymize', 'mstack-web-ui', 'mstack-resolve-merge-conflicts', 'mstack-sharpen-prompt', 'mstack-antigravity-led-review', 'mstack-antigravity-led-dev'];
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

test('antigravity: the 27 mstack rows keep today\'s tiers', () => {
  const r = run(machine(), ANTI);
  const mstackRows = r.json.items.filter((i) => i.id.startsWith('mstack-'));
  assert.equal(new Set(mstackRows.map((i) => i.id)).size, 27, r.out);
  assert.equal(mstackRows.length, 27, r.out);
  for (const id of MSTACK_ALL) assert.equal(item(r, id)?.tier, MSTACK_ALL.indexOf(id) < 6 ? 'mandatory' : 'optional', id);
  for (const host of ['claude', 'codex', 'antigravity']) {
    const hr = run(machine(), ['--host', host]);
    for (const id of ['mstack-resolve-merge-conflicts', 'mstack-sharpen-prompt']) {
      const rows = hr.json.items.filter((i) => i.id === id);
      assert.equal(rows.length, 1, `${host}/${id}: ${hr.out}`);
      assert.deepEqual([rows[0].tier, rows[0].blocking], ['optional', false], `${host}/${id}: ${hr.out}`);
    }
  }
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

test('antigravity: no codex-plugin row', () => {
  const r = run(completeAnti(machine()), ANTI);
  for (const id of ALL_VENDOR) assert.equal(item(r, id)?.tier, 'optional', id);
  assert.equal(r.json.items.some((i) => i.id === 'codex-plugin'), false, r.out);
  for (const id of ['archify', 'gh', 'python3']) assert.equal(item(r, id)?.tier, 'optional', id);
});

test('antigravity: --needs reviewer names the group of the four vendor rows, and with no ready channel none of them blocks', () => {
  const r = run(completeAnti(machine()), [...ANTI, '--needs', 'reviewer']);
  assert.equal(r.status, 0, r.out);
  assert.deepEqual(blocking(r), ['node']);
  assert.deepEqual(states(r, ALL_VENDOR), ['MISSING', 'SKIP', 'MISSING', 'SKIP']);
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

// ---- Vendor rows: the client and the sign-in of each of claude and codex that is not the host's own ----
// logStub: a client stand-in that appends its arguments to <root>/<name>-calls.log and exits with `code`.
function logStub(m, name, code = 0) {
  writeFileSync(join(m.bin, name), `#!/bin/sh\necho "$@" >> "${m.root}/${name}-calls.log"\n${SAYS[name] ?? ''}exit ${code}\n`); chmodSync(join(m.bin, name), 0o755);
  return m;
}
const calls = (m, name) => { try { return readFileSync(join(m.root, `${name}-calls.log`), 'utf8').trim().split('\n'); } catch { return null; } };
const vendorIds = (r) => r.json.items.map((i) => i.id).filter((id) => ALL_VENDOR.includes(id));
const states = (r, ids) => ids.map((id) => r.state(id));

test('claude: codex ready: codex-cli and codex-login are ok', () => {
  const r = run(logStub(machine(), 'codex'), ['--host', 'claude']);
  assert.deepEqual(states(r, ['codex-cli', 'codex-login']), ['ok', 'ok'], r.out);
  assert.deepEqual([item(r, 'codex-cli').tier, item(r, 'codex-login').tier], ['optional', 'optional']);
  assert.equal(item(r, 'codex-login').detail, 'codex signed in: the codex channel is ready');
});

test('claude: no codex: codex-cli is MISSING and codex-login is SKIP', () => {
  const r = run(machine(), ['--host', 'claude']);
  assert.deepEqual(states(r, ['codex-cli', 'codex-login']), ['MISSING', 'SKIP'], r.out);
  assert.equal(item(r, 'codex-login').detail, 'needs codex first');
});

test('codex: claude ready: claude rows ok; a failing claude auth status is LOGIN', () => {
  const m = logStub(machine(), 'claude');
  assert.deepEqual(states(run(m, ['--host', 'codex']), ['claude-cli', 'claude-login']), ['ok', 'ok']);
  assert.deepEqual(calls(m, 'claude'), ['auth status']);
  const out = run(logStub(machine(), 'claude', 1), ['--host', 'codex']);
  assert.deepEqual(states(out, ['claude-cli', 'claude-login']), ['ok', 'LOGIN'], out.out);
  assert.equal(item(out, 'claude-login').detail, 'not signed in: run claude auth login');
});

test('antigravity: codex signed in and claude signed out: the codex rows are ok, and claude-login is LOGIN and says run claude auth login', () => {
  const m = logStub(logStub(agy(machine()), 'codex'), 'claude', 1);
  const r = run(m, ANTI);
  assert.deepEqual(states(r, ALL_VENDOR), ['ok', 'LOGIN', 'ok', 'ok'], r.out);
  assert.match(item(r, 'claude-login').detail, /run claude auth login/);
  assert.deepEqual([calls(m, 'codex'), calls(m, 'claude')], [['login status'], ['auth status']]);
  const signedOut = run(logStub(agy(machine()), 'codex', 1), ANTI);
  assert.equal(item(signedOut, 'codex-login').detail, 'not signed in: run codex login');
});

test('claude and codex hosts: the vendor rows are those of the one other vendor', () => {
  const m = () => logStub(logStub(agy(machine()), 'codex'), 'claude');
  assert.deepEqual(vendorIds(run(m(), ['--host', 'claude'])), ['codex-cli', 'codex-login']);
  assert.deepEqual(vendorIds(run(m(), ['--host', 'codex'])), ['claude-cli', 'claude-login']);
  assert.deepEqual(vendorIds(run(m(), ANTI)), ALL_VENDOR);
});

test('no host has a row whose ID or detail names a bridge, a companion script or the Antigravity sign-in', () => {
  for (const host of ['claude', 'codex', 'antigravity']) {
    const r = run(logStub(logStub(agy(machine()), 'codex'), 'claude'), ['--host', host]);
    for (const i of r.json.items) {
      assert.doesNotMatch(`${i.id} ${i.detail}`, /bridge|companion|\bagy\b|antigravity[- ](cli|login|client|sign)|(sign|logg?ed?)[- ]?in (to|in) antigravity/i, `${host} ${i.id}`);
    }
  }
});

test('the skill-codex plugin and a claude plugin of another marketplace are not rows', () => {
  const m = machine().file('.claude/plugins/cache/skill-codex/skill-codex/1.3.1/skills/codex/SKILL.md', 'Run codex exec.')
    .file('.claude/plugins/installed_plugins.json', JSON.stringify({ version: 2, plugins: { 'skill-codex@skill-codex': [{}] } }))
    .skill('.codex/plugins/cache/other/claude/1.0.0/skills/review').file('.codex/config.toml', '[plugins."claude@other"]\nenabled = true\n');
  for (const host of ['claude', 'codex', 'antigravity']) {
    const r = run(m, ['--host', host]);
    const ids = r.json.items.map((i) => i.id);
    assert.deepEqual(ids.filter((id) => /plugin|skill-codex|^review$|^reviewer/.test(id)), host === 'claude' ? ['codex-plugin'] : [], host);
    assert.ok(r.json.items.every((i) => !/skill-codex/.test(i.detail)), host);
  }
});

test('antigravity: needs reviewer: codex ready and no claude meets the need, and the claude rows block nothing', () => {
  const r = run(logStub(agy(machine()), 'codex').stub('node'), [...ANTI, '--needs', 'reviewer']);
  assert.equal(r.status, 0, r.out);
  assert.deepEqual(blocking(r), ['node', 'codex-cli', 'codex-login']);
  assert.deepEqual([item(r, 'claude-cli').state, item(r, 'claude-cli').tier, item(r, 'claude-cli').blocking, item(r, 'claude-login').blocking], ['MISSING', 'optional', false, false]);
});

test('antigravity: needs reviewer: claude ready and no codex meets the need', () => {
  const r = run(logStub(agy(machine()), 'claude').stub('node'), [...ANTI, '--needs', 'reviewer']);
  assert.equal(r.status, 0, r.out);
  assert.deepEqual(blocking(r), ['node', 'claude-cli', 'claude-login']);
});

test('antigravity: needs reviewer: with both ready the first ready channel blocks', () => {
  const r = run(logStub(logStub(agy(machine()), 'codex'), 'claude').stub('node'), [...ANTI, '--needs', 'reviewer']);
  assert.deepEqual([r.status, blocking(r)], [0, ['node', 'claude-cli', 'claude-login']], r.out);
});

test('no detail of any row says that a vendor can review', () => {
  for (const host of ['claude', 'codex', 'antigravity']) {
    const r = run(logStub(logStub(agy(machine()), 'codex'), 'claude'), ['--host', host]);
    for (const i of r.json.items) assert.doesNotMatch(i.detail, /can review (this|the|your)/i, `${host} ${i.id}`);
    for (const id of vendorIds(r).filter((v) => v.endsWith('-cli'))) {
      const v = id.slice(0, -4);
      assert.equal(item(r, id).detail, `${v} command-line tool: the channel to ${v}; mstack-vendors answers whether it can review a given piece of work`);
    }
  }
});

// One client installed is enough (the user's rule of 2026-11-24): a caller that names `reviewer` falls back to a review by
// its own vendor when no channel is ready, so the group never stops it. Only a row named by its ID blocks.
test('needs reviewer: no ready channel blocks nothing, and the vendor rows are still reported', () => {
  const r = run(logStub(agy(machine()), 'codex', 1).stub('node'), [...ANTI, '--needs', 'reviewer']);
  assert.deepEqual([r.status, blocking(r)], [0, ['node']], r.out);
  assert.deepEqual(states(r, ALL_VENDOR), ['MISSING', 'SKIP', 'ok', 'LOGIN']);
  const c = run(machine().stub('node'), ['--host', 'claude', '--needs', 'reviewer']);
  assert.deepEqual([c.status, blocking(c)], [0, ['node']], c.out);
  assert.deepEqual([c.state('codex-cli'), c.state('codex-login')], ['MISSING', 'SKIP']);
  // A pairing-specific need names the rows, and they block.
  assert.equal(run(machine().stub('node'), ['--host', 'claude', '--needs', 'codex-cli,codex-login']).status, 1);
});

// One client installed is enough (the user's rule of 2026-11-24): another vendor's client is never needed without --needs.
function completeCodex(m) {
  m.stub('node').stub('git').stub('codegraph');
  const names = ['mstack-find-skills', 'mstack-best-model-for', 'mstack-receive-review', 'mstack-research', 'mstack-setup', 'mstack-vendors'];
  m.skill('.codex/plugins/cache/ponytail/ponytail/5.3.3/skills/ponytail');
  for (const n of names) m.skill(`.codex/plugins/cache/mstack/${n}/0.1.0/skills/${n}`);
  m.file('.codex/config.toml', ['[mcp_servers.codegraph]', 'command = "codegraph"', '[plugins."ponytail@ponytail"]', 'enabled = true',
    ...names.flatMap((n) => [`[plugins."${n}@mstack"]`, 'enabled = true'])].join('\n') + '\n');
  return m;
}
for (const [host, build] of [['claude', (m) => { completeClaude(m); rmSync(join(m.bin, 'codex')); return m; }], ['codex', completeCodex], ['antigravity', completeAnti]]) {
  test(`${host}: only this host's things and no other vendor's client: without --needs the run exits 0 and no vendor row blocks`, () => {
    const r = run(build(machine()), ['--host', host]);
    assert.ok(r.json.items.filter((i) => i.tier === 'mandatory').every((i) => i.state === 'ok'), r.out);
    assert.equal(r.status, 0, r.out);
    assert.ok(vendorIds(r).length >= 2, r.out);
    for (const id of vendorIds(r)) assert.deepEqual([item(r, id).blocking, item(r, id).state === 'ok'], [false, false], id);
  });
}

test('antigravity: without --needs, no ready channel does not fail the run', () => {
  const r = run(logStub(completeAnti(machine()), 'codex', 1), ANTI);
  assert.equal(r.status, 0, r.out);
  assert.deepEqual(states(r, ALL_VENDOR), ['MISSING', 'SKIP', 'ok', 'LOGIN']);
  for (const id of ALL_VENDOR) assert.equal(item(r, id).blocking, false, id);
});

test('needs reviewer,codex-login: the explicit row blocks beside the group\'s rule', () => {
  const r = run(logStub(logStub(agy(machine()), 'claude'), 'codex', 1).stub('node'), [...ANTI, '--needs', 'reviewer,codex-login']);
  assert.deepEqual([r.status, blocking(r)], [1, ['node', 'claude-cli', 'claude-login', 'codex-login']], r.out);
});

test('an old reviewer row ID in --needs is a usage error', () => {
  for (const host of ['claude', 'codex', 'antigravity']) for (const id of ['plugin', 'cli', 'login']) {
    const r = run(logStub(logStub(agy(machine()), 'codex'), 'claude').stub('node'), ['--host', host, '--needs', `reviewer-${id}`]);
    assert.equal(r.status, 2, `${host} ${id}`);
    assert.match(r.out, /--needs names no row and no group of this host/);
  }
});

test('the status installs nothing and sends no prompt', () => {
  for (const host of ['claude', 'codex', 'antigravity']) {
    const m = logStub(logStub(agy(machine()), 'codex', 1), 'claude', 1);
    const before = listing(m.home);
    run(m, ['--host', host]); run(m, ['--host', host, '--needs', 'reviewer']);
    for (const l of calls(m, 'claude') ?? []) assert.equal(l, 'auth status', host);
    for (const l of calls(m, 'codex') ?? []) assert.equal(l, 'login status', host);
    assert.equal(existsSync(join(m.root, 'agy-calls.log')), false, host);
    assert.equal(listing(m.home), before, host);
  }
});

// ---- A client that cannot run is no client (which), and a sign-in check that did not complete is no "signed out" ----
test('a client file without execute permission is not found, and a usable one later on PATH is', () => {
  const m = machine().stub('node');
  writeFileSync(join(m.bin, 'claude'), '#!/bin/sh\nexit 0\n'); chmodSync(join(m.bin, 'claude'), 0o644);
  const r = run(m, ['--host', 'codex', '--needs', 'claude-cli']);
  assert.deepEqual([r.state('claude-cli'), r.state('claude-login'), r.status], ['MISSING', 'SKIP', 1], r.out);
  const later = join(m.root, 'bin2'); mkdirSync(later);
  writeFileSync(join(later, 'claude'), `#!/bin/sh\n${SAYS.claude}exit 0\n`); chmodSync(join(later, 'claude'), 0o755);
  const r2 = run(m, ['--host', 'codex', '--needs', 'reviewer'], { PATH: `${m.bin}:${later}` });
  assert.deepEqual([r2.state('claude-cli'), r2.state('claude-login'), r2.status], ['ok', 'ok', 0], r2.out);
});

test('windows: a PATHEXT match needs no execute permission', () => {
  const m = machine();
  writeFileSync(join(m.bin, 'codex.cmd'), '@echo off\r\n'); chmodSync(join(m.bin, 'codex.cmd'), 0o644);
  assert.equal(run(m, ['--host', 'claude', '--platform', 'win32'], { PATHEXT: '.CMD;.EXE' }).state('codex-cli'), 'ok');
});

test('a sign-in check that could not complete is LOGIN with its reason and no instruction to log in', () => {
  const m = machine().stub('node');
  // a client that kills itself: the check ends by a signal, not by an exit code
  writeFileSync(join(m.bin, 'codex'), '#!/bin/sh\nkill -9 $$\n'); chmodSync(join(m.bin, 'codex'), 0o755);
  const r = run(m, ['--host', 'claude', '--needs', 'codex-login']);
  assert.deepEqual([r.state('codex-login'), item(r, 'codex-login').blocking, r.status], ['LOGIN', true, 1], r.out);
  assert.match(item(r, 'codex-login').detail, /^sign-in could not be checked: .*SIGKILL/);
  assert.doesNotMatch(item(r, 'codex-login').detail, /run codex login/);
  // an executable whose interpreter line names a program that does not exist: the command cannot start
  writeFileSync(join(m.bin, 'codex'), '#!/nonexistent/interpreter\n'); chmodSync(join(m.bin, 'codex'), 0o755);
  const r2 = run(m, ['--host', 'claude', '--needs', 'codex-login']);
  assert.deepEqual([r2.state('codex-cli'), r2.state('codex-login'), r2.status], ['ok', 'LOGIN', 1], r2.out);
  assert.equal(item(r2, 'codex-login').detail, 'sign-in could not be checked: the command could not start (ENOENT)');
  const out = run(machine().stub('codex', 1), ['--host', 'claude']);
  assert.equal(item(out, 'codex-login').detail, 'not signed in: run codex login');
});

// ---- --vendors not-checked: the Antigravity run inside the sandbox after the run outside it was refused ----
test('--vendors not-checked: no client is probed, the four rows read not checked, and the reviewer group blocks on none of them', () => {
  const m = logStub(logStub(completeAnti(machine()), 'codex'), 'claude');
  const r = run(m, [...ANTI, '--vendors', 'not-checked', '--needs', 'reviewer']);
  assert.equal(r.status, 0, r.out);
  assert.deepEqual(blocking(r), ['node']);
  for (const id of ALL_VENDOR) assert.deepEqual([r.state(id), item(r, id).detail, item(r, id).tier], ['not checked', 'the run outside the sandbox was not approved', 'optional'], id);
  assert.deepEqual([calls(m, 'claude'), calls(m, 'codex')], [null, null]);
  const plain = run(m, [...ANTI, '--vendors=not-checked']);
  assert.equal(plain.status, 0, plain.out);
  for (const id of ALL_VENDOR) assert.deepEqual([plain.state(id), item(plain, id).blocking], ['not checked', false], id);
  assert.equal(run(m, [...ANTI, '--vendors', 'not-checked', '--needs', 'codex-cli']).status, 1);
  assert.equal(run(m, [...ANTI, '--vendors', 'not-checked', '--needs', 'codegraph']).status, 0);
});

test('--vendors takes only not-checked', () => {
  for (const v of ['', 'checked', 'off']) assert.equal(run(machine().stub('node'), [...ANTI, '--vendors', v]).status, 2, v);
});

// ---- The sign-in answer is read, not only the exit code (the same rule as mstack-vendors' status script) ----
const client = (m, name, body) => { writeFileSync(join(m.bin, name), `#!/bin/sh\n${body}\n`); chmodSync(join(m.bin, name), 0o755); return m; };
const login = (host, name, body, needs = `${name}-login`) => { const r = run(client(machine().stub('node'), name, body), ['--host', host, '--needs', needs]); return [r.state(`${name}-login`), item(r, `${name}-login`).detail, r.status]; };

test('codex: signed in only when login status exits 0 and says logged in, on either stream and in any case', () => {
  assert.deepEqual(login('claude', 'codex', 'echo "Logged in using ChatGPT"'), ['ok', 'codex signed in: the codex channel is ready', 0]);
  assert.deepEqual(login('claude', 'codex', 'echo "LOGGED IN with an API key" >&2'), ['ok', 'codex signed in: the codex channel is ready', 0]);
  const unread = 'sign-in could not be checked: codex login status exited 0 with an answer that could not be read';
  for (const body of ['exit 0', 'echo "Not logged in"', 'echo "ok"']) assert.deepEqual(login('claude', 'codex', body), ['LOGIN', unread, 1], body);
  assert.deepEqual(login('claude', 'codex', 'echo "Logged in using ChatGPT"; exit 1'), ['LOGIN', 'not signed in: run codex login', 1]);
});

test('claude: signed in only when auth status exits 0 and prints JSON with loggedIn true', () => {
  assert.deepEqual(login('codex', 'claude', `echo '{ "loggedIn": true, "authMethod": "x" }'`), ['ok', 'claude signed in: the claude channel is ready', 0]);
  const out = ['LOGIN', 'not signed in: run claude auth login', 1];
  assert.deepEqual(login('codex', 'claude', `echo '{"loggedIn": false}'`), out);
  assert.deepEqual(login('codex', 'claude', `echo '{"loggedIn": true}'; exit 1`), out);
  const unread = 'sign-in could not be checked: claude auth status exited 0 with an answer that could not be read';
  for (const body of ['exit 0', 'echo "Logged in"', `echo '{"loggedIn": "yes"}'`, `echo '{"loggedIn": true}' >&2`]) assert.deepEqual(login('codex', 'claude', body), ['LOGIN', unread, 1], body);
});

// ---- Task 5.2: per-host workflow pairs, mandatory mstack-vendors, R18 one-client setup, codex-plugin detail, no bridge ----
const HOST_WORKFLOWS = {
  claude: ['mstack-claude-led-review', 'mstack-claude-led-dev'],
  codex: ['mstack-codex-led-review', 'mstack-codex-led-dev'],
  antigravity: ['mstack-antigravity-led-review', 'mstack-antigravity-led-dev'],
};
const ALL_SIX_WORKFLOWS = Object.values(HOST_WORKFLOWS).flat();

for (const host of ['claude', 'codex', 'antigravity']) {
  test(`${host}: the two ${host}-led workflows are optional rows`, () => {
    const r = run(machine(), ['--host', host]);
    const own = HOST_WORKFLOWS[host];
    const other = ALL_SIX_WORKFLOWS.filter((id) => !own.includes(id));
    for (const id of own) {
      const row = item(r, id);
      assert.ok(row, `missing ${id}`);
      assert.equal(row.tier, 'optional', id);
      assert.equal(row.detail, 'mstack workflow', id);
    }
    for (const id of other) {
      assert.equal(item(r, id), undefined, `${host} should not include ${id}`);
    }
  });

  test(`${host}: mstack-vendors is a mandatory row`, () => {
    const r = run(machine(), ['--host', host]);
    const row = item(r, 'mstack-vendors');
    assert.ok(row, 'missing mstack-vendors');
    assert.equal(row.tier, 'mandatory');
    assert.equal(row.detail, 'mstack skill');
  });

  test(`${host}: one-client machine with mandatory skills present and other vendor client absent passes setup`, () => {
    const m = host === 'claude'
      ? (() => { const x = completeClaude(machine()); rmSync(join(x.bin, 'codex')); return x; })()
      : host === 'codex'
        ? completeCodex(machine())
        : completeAnti(machine());
    const r = run(m, ['--host', host]);
    assert.equal(r.status, 0, r.out);
    assert.equal(r.state('mstack-vendors'), 'ok', r.out);
    const otherCli = host === 'codex' ? 'claude-cli' : 'codex-cli';
    assert.equal(r.state(otherCli), 'MISSING');
    assert.equal(item(r, otherCli).blocking, false);
    assert.equal(run(m, ['--host', host, '--needs', otherCli]).status, 1);
  });

  test(`${host}: no row names a bridge`, () => {
    const m = host === 'claude' ? completeClaude(machine()) : host === 'codex' ? completeCodex(machine()) : completeAnti(machine());
    const r = run(m, ['--host', host]);
    for (const row of r.json.items) {
      assert.doesNotMatch(`${row.id} ${row.detail}`, /bridge|companion/i, `${host} ${row.id}`);
    }
  });
}

test('R18 setup in Codex: without mstack-vendors the setup is incomplete', () => {
  const m = completeCodex(machine());
  rmSync(join(m.home, '.codex/plugins/cache/mstack/mstack-vendors'), { recursive: true, force: true });
  const r = run(m, ['--host', 'codex']);
  assert.equal(r.status, 1, r.out);
  assert.ok(item(r, 'mstack-codex-led-review'), 'missing mstack-codex-led-review');
  assert.ok(item(r, 'mstack-codex-led-dev'), 'missing mstack-codex-led-dev');
  const v = item(r, 'mstack-vendors');
  assert.deepEqual([v?.state, v?.tier, v?.blocking], ['MISSING', 'mandatory', true], r.out);
});

test('claude: codex-plugin names mstack-claude-led-dev', () => {
  const r = run(machine(), ['--host', 'claude']);
  assert.equal(item(r, 'codex-plugin')?.detail, 'OpenAI Codex plugin (Codex as the developer in mstack-claude-led-dev)');
});
