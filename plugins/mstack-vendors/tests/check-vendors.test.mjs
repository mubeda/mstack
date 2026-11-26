// Tests for scripts/check-vendors.mjs. Each test builds a throwaway root with a home folder and a bin folder of
// stand-in clients, and runs the script with only that bin folder on PATH: no real client is started, nothing on the
// real machine is read, and the root is removed when the test ends.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const script = resolve(here, '../skills/mstack-vendors/scripts/check-vendors.mjs');
const companion = join(here, 'fixtures/fake-developer/scripts/codex-companion.mjs');
const realGit = (process.env.PATH || '').split(delimiter).map((d) => join(d, 'git')).find((p) => { try { return statSync(p).isFile(); } catch { return false; } });

const JOBS = ['code review', 'plan review', 'developer'];
const CODEX_IN = 'echo "Logged in using a test account" >&2'; // the real client prints this line on stderr
const CLAUDE_IN = 'echo \'{"loggedIn": true, "authMethod": "test"}\'';
const AGY = String.raw`[ "$1" = models ] || exit 9
printf 'Fetching available models...\ngemini-test-flash-low\tGemini Test Flash (Low)\nclaude-test-model\tClaude Test Model\ngpt-oss-test\tGPT OSS Test\n'`;

function machine(t) {
  const root = mkdtempSync(join(tmpdir(), 'check-vendors-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const home = join(root, 'home'), bin = join(root, 'my bin');
  mkdirSync(home); mkdirSync(bin);
  symlinkSync(process.execPath, join(bin, 'node'));
  if (realGit) symlinkSync(realGit, join(bin, 'git'));
  const m = {
    root, home, bin,
    // A stand-in client: it records its call, then runs the body.
    client(name, body) {
      const p = join(bin, name);
      writeFileSync(p, `#!/bin/sh\necho "${name} $*" >> "${join(root, 'calls.log')}"\n${body}\n`);
      chmodSync(p, 0o755);
      return m;
    },
    file(rel, text = 'x') {
      const p = join(home, rel); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, text); return m;
    },
    // The Codex plugin for Claude Code: an install record, the stand-in companion script and the rescue agent.
    // Returns the environment of a session in which the plugin's hook ran.
    plugin({ agent = true } = {}) {
      const install = join(root, 'plugin');
      mkdirSync(join(install, 'scripts'), { recursive: true });
      copyFileSync(companion, join(install, 'scripts', 'codex-companion.mjs'));
      if (agent) { mkdirSync(join(install, 'agents')); writeFileSync(join(install, 'agents', 'codex-rescue.md'), 'x'); }
      m.file('.claude/plugins/installed_plugins.json', JSON.stringify({ version: 2, plugins: { 'codex@openai-codex': [{ scope: 'user', installPath: install }] } }));
      mkdirSync(join(root, 'data'));
      return { CLAUDE_PLUGIN_DATA: join(root, 'data') };
    },
    calls(name) {
      const log = join(root, 'calls.log');
      return (existsSync(log) ? readFileSync(log, 'utf8').split('\n').filter(Boolean) : []).filter((l) => !name || l.startsWith(`${name} `));
    },
  };
  return m;
}

function run(m, args, env = {}, file = script) {
  const r = spawnSync(process.execPath, [file, ...args], { encoding: 'utf8', cwd: m.root, env: { PATH: m.bin, HOME: m.home, ...env } });
  const lines = r.stdout.split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return { unparsed: l }; } });
  const rows = lines.slice(0, -1);
  return {
    status: r.status, out: `${r.stdout}${r.stderr}`, rows, leader: lines.at(-1)?.leader,
    row: (vendor, job) => rows.find((x) => x.vendor === vendor && x.job === job),
  };
}

function assertAvailable(r, vendor, job, channel) {
  assert.deepEqual(r.row(vendor, job), { vendor, job, state: 'available', reason: '', channel }, r.out);
}
function assertNot(r, vendor, job, reason) {
  const row = r.row(vendor, job);
  assert.equal(row?.state, 'not available', r.out);
  assert.equal(row.channel, '', r.out);
  assert.ok(row.reason, `an empty reason: ${r.out}`);
  if (reason) assert.match(row.reason, reason, r.out);
}
// In Antigravity mstack-setup only shows the client's install command; on the other hosts it runs it.
const SETUP = { 'claude-code': 'mstack-setup installs it', codex: 'mstack-setup installs it', antigravity: 'mstack-setup shows the command that installs it, for the user to run' };
function assertNoneAvailable(r, vendors, host) {
  assert.equal(r.status, 0, r.out);
  assert.deepEqual(r.rows.map((x) => `${x.vendor}/${x.job}`), vendors.flatMap((v) => JOBS.map((j) => `${v}/${j}`)), r.out);
  for (const v of vendors) for (const j of JOBS) assertNot(r, v, j, new RegExp(`^not installed: the ${v} command-line tool; ${SETUP[host]}$`));
}

// --- R3

test('review yes, developer no: Claude Code with a signed-in codex and no Codex plugin', (t) => {
  const m = machine(t).client('codex', CODEX_IN);
  const r = run(m, ['--host', 'claude-code']);
  assert.equal(r.status, 0, r.out);
  assertAvailable(r, 'codex', 'code review', join(m.bin, 'codex'));
  assertAvailable(r, 'codex', 'plan review', join(m.bin, 'codex'));
  assertNot(r, 'codex', 'developer', /^channel missing: the OpenAI Codex plugin is not installed; mstack-setup installs it$/);
});

test('signed out: codex installed but signed out is not available for any job, and the call exits 0', (t) => {
  const m = machine(t).client('codex', 'echo "Not logged in" >&2; exit 1');
  const r = run(m, ['--host', 'claude-code'], m.plugin());
  assert.equal(r.status, 0, r.out);
  for (const j of JOBS) assertNot(r, 'codex', j, /^not signed in: run codex login$/);
});

test('signed out: claude in Codex is not available for any job', (t) => {
  const m = machine(t).client('claude', 'echo \'{"loggedIn": false}\'; exit 1');
  const r = run(m, ['--host', 'codex']);
  assert.equal(r.status, 0, r.out);
  for (const j of JOBS) assertNot(r, 'claude', j, /^not signed in: run claude auth login$/);
});

test('nothing else installed: Claude Code', (t) => assertNoneAvailable(run(machine(t), ['--host', 'claude-code']), ['codex'], 'claude-code'));
test('nothing else installed: Codex', (t) => assertNoneAvailable(run(machine(t), ['--host', 'codex']), ['claude'], 'codex'));
test('nothing else installed: Antigravity', (t) => assertNoneAvailable(run(machine(t), ['--host', 'antigravity']), ['claude', 'codex'], 'antigravity'));

// --- Ready

test('ready: Claude Code with codex and the Codex plugin', (t) => {
  const m = machine(t).client('codex', CODEX_IN);
  const r = run(m, ['--host', 'claude-code'], m.plugin());
  assert.equal(r.status, 0, r.out);
  assert.equal(r.rows.length, 3, r.out);
  for (const j of JOBS) assertAvailable(r, 'codex', j, join(m.bin, 'codex'));
});

test('ready: Codex with claude', (t) => {
  const m = machine(t).client('claude', CLAUDE_IN);
  const r = run(m, ['--host', 'codex']);
  assert.equal(r.status, 0, r.out);
  assert.equal(r.rows.length, 3, r.out);
  for (const j of JOBS) assertAvailable(r, 'claude', j, join(m.bin, 'claude'));
});

test('ready: Antigravity with claude and codex', (t) => {
  const m = machine(t).client('claude', CLAUDE_IN).client('codex', CODEX_IN);
  const r = run(m, ['--host', 'antigravity']);
  assert.equal(r.status, 0, r.out);
  assert.deepEqual(r.rows.map((x) => `${x.vendor}/${x.job}/${x.state}`), ['claude', 'codex'].flatMap((v) => JOBS.map((j) => `${v}/${j}/available`)), r.out);
});

test('every channel is the absolute path of the client, in a folder with a space', (t) => {
  const m = machine(t).client('claude', CLAUDE_IN).client('codex', CODEX_IN);
  // A relative PATH entry still gives an absolute channel.
  const r = run(m, ['--host', 'antigravity'], { PATH: 'my bin' });
  assert.equal(r.rows.length, 6, r.out);
  for (const row of r.rows) assert.equal(row.channel, join(m.root, 'my bin', row.vendor), r.out);
});

test('a codex developer in Antigravity needs only the signed-in codex client', (t) => {
  const m = machine(t).client('codex', CODEX_IN);
  const r = run(m, ['--host', 'antigravity']);
  assertAvailable(r, 'codex', 'developer', join(m.bin, 'codex'));
});

test('each sign-in check runs once per call', (t) => {
  const m = machine(t).client('claude', CLAUDE_IN).client('codex', CODEX_IN);
  run(m, ['--host', 'antigravity']);
  assert.deepEqual(m.calls().sort(), ['claude auth status', 'codex login status']);
});

// --- Fail closed

test('a client that is no executable file is not installed', async (t) => {
  await t.test('a file without the executable bit', (t2) => {
    const m = machine(t2).client('codex', CODEX_IN);
    chmodSync(join(m.bin, 'codex'), 0o644);
    assertNoneAvailable(run(m, ['--host', 'claude-code'], m.plugin()), ['codex'], 'claude-code');
  });
  await t.test('a folder with the client\'s name', (t2) => {
    const m = machine(t2);
    mkdirSync(join(m.bin, 'claude'));
    assertNoneAvailable(run(m, ['--host', 'codex']), ['claude'], 'codex');
  });
});

test('a sign-in check that gives no readable answer is not available, and its reason does not say to sign in', async (t) => {
  const cases = [
    ['codex', 'claude-code', 'exit 0', 'codex exits 0 and prints nothing', /^sign-in not confirmed: codex login status exited 0 with an answer that could not be read$/],
    ['codex', 'claude-code', 'kill -9 $$', 'codex is ended by a signal', /^sign-in not confirmed: codex login status was ended by SIGKILL$/],
    ['codex', 'claude-code', 'echo "Not logged in" >&2', 'codex exits 0 and says Not logged in', /^sign-in not confirmed: codex login status exited 0 with an answer that could not be read$/],
    ['codex', 'claude-code', 'echo "WARNING: the configuration is old"', 'codex exits 0 with a warning only', /^sign-in not confirmed: codex login status exited 0 with an answer that could not be read$/],
    ['codex', 'claude-code', 'echo "Not logged in. Logged in last on Monday"', 'codex exits 0 with both sentences', /^sign-in not confirmed: codex login status exited 0/],
    ['claude', 'codex', 'exit 0', 'claude exits 0 and prints nothing', /^sign-in not confirmed: claude auth status exited 0 with an answer that could not be read$/],
    ['claude', 'codex', 'echo "Signed in"', 'claude exits 0 with an answer that is not JSON', /^sign-in not confirmed: claude auth status exited 0/],
    ['claude', 'codex', 'echo \'{"authMethod": "test"}\'', 'claude exits 0 without a loggedIn field', /^sign-in not confirmed: claude auth status exited 0/],
    ['claude', 'codex', 'echo \'{"loggedIn": false}\'', 'claude exits 0 and says loggedIn false: signed out', /^not signed in: run claude auth login$/],
  ];
  for (const [vendor, host, body, name, reason] of cases) {
    await t.test(name, (t2) => {
      const m = machine(t2).client(vendor, body);
      const r = run(m, ['--host', host]);
      assert.equal(r.status, 0, r.out);
      for (const j of JOBS) assertNot(r, vendor, j, reason);
    });
  }
});

test('a sign-in check that gives no answer in time is not confirmed', (t) => {
  // The stand-in outlives the short limit this test sets; the limit of a real run is 15 seconds.
  const m = machine(t).client('codex', 'exec node -e "setTimeout(() => {}, 20000)"');
  const r = run(m, ['--host', 'claude-code'], { MSTACK_VENDORS_TIMEOUT_MS: '400' });
  assert.equal(r.status, 0, r.out);
  for (const j of JOBS) assertNot(r, 'codex', j, /^sign-in not confirmed: codex login status gave no answer within 0\.4 seconds$/);
});

// --- No Antigravity target

test('no host lists antigravity as a vendor', (t) => {
  const m = machine(t).client('claude', CLAUDE_IN).client('codex', CODEX_IN).client('agy', AGY);
  const expected = { 'claude-code': ['codex'], codex: ['claude'], antigravity: ['claude', 'codex'] };
  for (const [host, vendors] of Object.entries(expected)) {
    const r = run(m, ['--host', host]);
    assert.deepEqual(r.rows.map((x) => `${x.vendor}/${x.job}`), vendors.flatMap((v) => JOBS.map((j) => `${v}/${j}`)), `${host}: ${r.out}`);
  }
});

test('the rows are made without any agy call', (t) => {
  const m = machine(t).client('claude', CLAUDE_IN).client('codex', CODEX_IN).client('agy', AGY);
  const r = run(m, ['--host', 'antigravity']);
  assert.equal(r.rows.length, 6, r.out);
  assert.deepEqual(m.calls('agy'), []);
  // With a leader model the one agy call is the listing, and the rows are the same.
  const withLeader = run(m, ['--host', 'antigravity', '--leader-model', 'gemini-test-flash-low']);
  assert.deepEqual(withLeader.rows, r.rows, withLeader.out);
  assert.deepEqual(m.calls('agy'), ['agy models']);
});

// --- The Codex plugin route

const HOOK = /^channel missing: the Codex plugin's session hook has not run or its rescue agent is missing; start a new Claude Code session with the plugin enabled$/;

test('the Codex plugin without its session hook: the codex developer is not available', (t) => {
  const m = machine(t).client('codex', CODEX_IN);
  m.plugin();
  const r = run(m, ['--host', 'claude-code']); // no CLAUDE_PLUGIN_DATA
  assertNot(r, 'codex', 'developer', HOOK);
  assertAvailable(r, 'codex', 'code review', join(m.bin, 'codex'));
});

test('the Codex plugin without its rescue agent: the codex developer is not available', (t) => {
  const m = machine(t).client('codex', CODEX_IN);
  const r = run(m, ['--host', 'claude-code'], m.plugin({ agent: false }));
  assertNot(r, 'codex', 'developer', HOOK);
  assertAvailable(r, 'codex', 'plan review', join(m.bin, 'codex'));
});

test('a locate exit other than 0 or 1 leaves the codex developer not available', (t) => {
  const m = machine(t).client('codex', CODEX_IN);
  // The script starts the codex-dev.mjs next to it, so a copy beside a stand-in helper shows an exit the real one never gives.
  const dir = join(m.root, 'scripts');
  mkdirSync(dir);
  copyFileSync(script, join(dir, 'check-vendors.mjs'));
  const env = m.plugin();
  // It prints the path of a companion script that is there, so only its exit code tells the run apart from a good one.
  writeFileSync(join(dir, 'codex-dev.mjs'), `console.log(${JSON.stringify(join(m.root, 'plugin', 'scripts', 'codex-companion.mjs'))}); process.exit(7);\n`);
  const r = run(m, ['--host', 'claude-code'], env, join(dir, 'check-vendors.mjs'));
  assert.equal(r.status, 0, r.out);
  assertNot(r, 'codex', 'developer', /^channel missing: the Codex plugin could not be located \(codex-dev\.mjs locate exited 7\); run it to see why$/);
  assertAvailable(r, 'codex', 'code review', join(m.bin, 'codex'));
});

test('a Codex configuration that turns the network on: the codex developer in Claude Code is not available', async (t) => {
  const m = machine(t).client('codex', CODEX_IN);
  const env = m.plugin();
  const cfg = join(m.home, '.codex', 'config.toml');
  const on = [
    ['the table form', '[sandbox_workspace_write]\nnetwork_access = true\n', 2],
    ['the dotted form', 'model = "x"\n\nsandbox_workspace_write.network_access = true\n', 3],
    ['a profile table', '[profiles.dev.sandbox_workspace_write]\nwritable_roots = ["/a # b", "/c"] # two\nnetwork_access=true # on\n', 3],
    ['a quoted profile name', '[profiles."my dev".sandbox_workspace_write]\nnetwork_access = true\n', 2],
    ['a dotted key in a profile', '[profiles.dev]\nsandbox_workspace_write.network_access = true\n', 2],
    ['a dotted key with the profile', 'profiles.dev.sandbox_workspace_write.network_access = true\n', 1],
    ['after a string that holds a #', '[sandbox_workspace_write]\nnote = "a # b"\nnetwork_access = true\n', 3],
  ];
  for (const [name, text, line] of on) {
    await t.test(name, () => {
      m.file('.codex/config.toml', text);
      const r = run(m, ['--host', 'claude-code'], env);
      assert.equal(r.row('codex', 'developer')?.reason, `channel missing: ${cfg}:${line} turns network access on for workspace-write, so a Codex developer could push`, r.out);
      assertNot(r, 'codex', 'developer');
      assertAvailable(r, 'codex', 'code review', join(m.bin, 'codex'));
      assertAvailable(r, 'codex', 'plan review', join(m.bin, 'codex'));
    });
  }
  // A line the scan cannot read with certainty: the row is not available, and the reason says the setting cannot be read.
  const unsure = [
    ['an inline table', 'sandbox_workspace_write = { network_access = true }\n', 1],
    ['a # in a string before the setting', 'x = "a # b"; sandbox_workspace_write.network_access = true\n', 1],
    ['a quoted key', '[sandbox_workspace_write]\n"network_access" = true\n', 2],
    ['a quoted table name', '["sandbox_workspace_write"]\nnetwork_access = true\n', 1],
    ['a value that is no true or false', '[sandbox_workspace_write]\nnetwork_access = "true"\n', 2],
    ['a value that goes on over several lines in the table', '[sandbox_workspace_write]\nwritable_roots = [\n"/a",\n]\nnetwork_access = false\n', 2],
    ['a multi-line string in the table', '[sandbox_workspace_write]\nnote = """\n[other]\n"""\nnetwork_access = true\n', 2],
    ['the setting named in a string elsewhere', '[other]\nnote = "network_access = true"\n', 2],
  ];
  for (const [name, text, line] of unsure) {
    await t.test(`cannot be read: ${name}`, () => {
      m.file('.codex/config.toml', text);
      const r = run(m, ['--host', 'claude-code'], env);
      assert.equal(r.row('codex', 'developer')?.reason, `channel missing: ${cfg}:${line} cannot be read with certainty, so it is not known whether network access is off for workspace-write`, r.out);
      assertNot(r, 'codex', 'developer');
      assertAvailable(r, 'codex', 'code review', join(m.bin, 'codex'));
    });
  }
  await t.test('the file of CODEX_HOME is the one read', () => {
    m.file('.codex/config.toml', '');
    const other = join(m.root, 'codex-home');
    mkdirSync(other);
    writeFileSync(join(other, 'config.toml'), '[sandbox_workspace_write]\nnetwork_access = true\n');
    const r = run(m, ['--host', 'claude-code'], { ...env, CODEX_HOME: other });
    assertNot(r, 'codex', 'developer', /codex-home.config\.toml:2 turns network access on/);
  });
  await t.test('a configuration that keeps it off passes', () => {
    m.file('.codex/config.toml', 'model = "x # y"\n  # sandbox_workspace_write.network_access = true\n[sandbox_workspace_write] # the sandbox\n# network_access = true\nwritable_roots = ["/a", "/b"]\nexclude_slash_tmp = false\nnetwork_access = false # off\n\n[other]\nnetwork_access = true\n[profiles.dev]\nsandbox_workspace_write.network_access = false\n');
    const r = run(m, ['--host', 'claude-code'], env);
    assertAvailable(r, 'codex', 'developer', join(m.bin, 'codex'));
  });
});

test('a project Codex configuration counts: the workspace folder and each parent up to the repository root', async (t) => {
  const m = machine(t).client('codex', CODEX_IN);
  const env = m.plugin();
  const ON = '[sandbox_workspace_write]\nnetwork_access = true\n';
  const repo = join(m.root, 'repo'), workspace = join(repo, 'sub', 'deeper');
  mkdirSync(join(repo, '.git'), { recursive: true });
  mkdirSync(workspace, { recursive: true });
  const put = (dir, text) => { mkdirSync(join(dir, '.codex'), { recursive: true }); writeFileSync(join(dir, '.codex', 'config.toml'), text); return join(dir, '.codex', 'config.toml'); };
  const dev = (ws) => run(m, ['--host', 'claude-code', '--workspace', ws], env);
  await t.test('a file above the repository root is not read', () => {
    put(m.root, ON);
    assertAvailable(dev(workspace), 'codex', 'developer', join(m.bin, 'codex'));
  });
  await t.test('without a repository only the workspace folder\'s own file is read', () => {
    const plain = join(m.root, 'plain', 'inner');
    mkdirSync(plain, { recursive: true });
    put(join(m.root, 'plain'), ON);
    assertAvailable(dev(plain), 'codex', 'developer', join(m.bin, 'codex'));
    const file = put(plain, ON);
    assert.equal(dev(plain).row('codex', 'developer')?.reason, `channel missing: ${file}:2 turns network access on for workspace-write, so a Codex developer could push`);
  });
  for (const [name, dir] of [['the repository root', repo], ['a folder between', join(repo, 'sub')], ['the workspace folder', workspace]]) {
    await t.test(`${name} turns the network on`, () => {
      const file = put(dir, ON);
      const r = dev(workspace);
      assert.equal(r.row('codex', 'developer')?.reason, `channel missing: ${file}:2 turns network access on for workspace-write, so a Codex developer could push`, r.out);
      assertAvailable(r, 'codex', 'code review', join(m.bin, 'codex'));
      put(dir, 'model = "x"\n');
      assertAvailable(dev(workspace), 'codex', 'developer', join(m.bin, 'codex'));
    });
  }
  await t.test('a project file that cannot be read with certainty', () => {
    const file = put(repo, 'sandbox_workspace_write = { network_access = false }\n');
    assert.equal(dev(workspace).row('codex', 'developer')?.reason, `channel missing: ${file}:1 cannot be read with certainty, so it is not known whether network access is off for workspace-write`);
  });
  await t.test('a project file that is a folder', () => {
    rmSync(join(repo, '.codex'), { recursive: true });
    mkdirSync(join(repo, '.codex', 'config.toml'), { recursive: true });
    assertNot(dev(workspace), 'codex', 'developer', /^channel missing: .*repo..codex.config\.toml cannot be read, so it is not known/);
  });
});

test('an unreadable Codex configuration: the codex developer in Claude Code is not available', (t) => {
  const m = machine(t).client('codex', CODEX_IN);
  mkdirSync(join(m.home, '.codex', 'config.toml'), { recursive: true }); // a folder: reading it fails, also for root
  const r = run(m, ['--host', 'claude-code'], m.plugin());
  assertNot(r, 'codex', 'developer', /^channel missing: .*config\.toml cannot be read/);
  assertAvailable(r, 'codex', 'code review', join(m.bin, 'codex'));
});

// --- The leader

test('leader on Claude Code and Codex comes from the host', (t) => {
  const m = machine(t).client('agy', AGY);
  for (const extra of [[], ['--leader-model', 'gemini-test-flash-low'], ['--leader-model', 'gpt-oss-test']]) {
    assert.equal(run(m, ['--host', 'claude-code', ...extra]).leader, 'claude');
    assert.equal(run(m, ['--host', 'codex', ...extra]).leader, 'codex');
  }
  assert.deepEqual(m.calls('agy'), []);
});

test('Antigravity leader: a listed gemini- id is antigravity and a listed claude- id is claude', (t) => {
  const m = machine(t).client('agy', AGY);
  assert.equal(run(m, ['--host', 'antigravity', '--leader-model', 'gemini-test-flash-low']).leader, 'antigravity');
  assert.equal(run(m, ['--host', 'antigravity', '--leader-model=claude-test-model']).leader, 'claude');
  assert.deepEqual(m.calls('agy'), ['agy models', 'agy models']);
});

test('Antigravity leader: a prefix alone names no vendor', async (t) => {
  await t.test('a mistyped id the listing does not hold is unknown', (t2) => {
    const m = machine(t2).client('agy', AGY);
    for (const id of ['claude-tset-model', 'gemini-test-flash', 'claude-', 'gemini-']) assert.equal(run(m, ['--host', 'antigravity', '--leader-model', id]).leader, 'unknown', id);
  });
  await t.test('a listing that fails is unknown, also for a prefixed id', (t2) => {
    const m = machine(t2).client('agy', `${AGY}\nexit 1`);
    for (const id of ['claude-test-model', 'gemini-test-flash-low']) assert.equal(run(m, ['--host', 'antigravity', '--leader-model', id]).leader, 'unknown', id);
  });
  await t.test('a line without a tab is no model record', (t2) => {
    const m = machine(t2).client('agy', 'echo "Fetching available models..."; echo "claude-test-model"; echo "gpt-oss-test"');
    for (const id of ['claude-test-model', 'gpt-oss-test', 'Fetching available models...']) assert.equal(run(m, ['--host', 'antigravity', '--leader-model', id]).leader, 'unknown', id);
  });
});

test('Antigravity leader: a listed id with neither prefix is other', (t) => {
  const m = machine(t).client('agy', AGY);
  const r = run(m, ['--host', 'antigravity', '--leader-model', 'gpt-oss-test']);
  assert.equal(r.status, 0, r.out);
  assert.equal(r.leader, 'other', r.out);
  assert.deepEqual(m.calls('agy'), ['agy models']);
});

test('Antigravity leader: a non-prefixed id the listing does not hold is unknown, never other', (t) => {
  const m = machine(t).client('agy', AGY);
  // Words and whole lines of the listing that are no id: an id is the text before the tab of a model record.
  for (const id of ['opus', 'gpt-oss-tset', 'gpt-oss', 'GPT', 'Fetching', 'Fetching available models...', 'GPT OSS Test']) {
    assert.equal(run(m, ['--host', 'antigravity', '--leader-model', id]).leader, 'unknown', id);
  }
  for (const l of m.calls('agy')) assert.equal(l, 'agy models');
});

test('Antigravity leader: no --leader-model, or a listing that fails, is unknown', async (t) => {
  await t.test('no --leader-model', (t2) => {
    const m = machine(t2).client('agy', AGY);
    const r = run(m, ['--host', 'antigravity']);
    assert.equal(r.leader, 'unknown', r.out);
    assert.deepEqual(m.calls('agy'), []);
  });
  await t.test('the listing exits non-zero', (t2) => {
    const m = machine(t2).client('agy', `${AGY}\nexit 1`);
    assert.equal(run(m, ['--host', 'antigravity', '--leader-model', 'gpt-oss-test']).leader, 'unknown');
  });
  await t.test('no agy on PATH', (t2) => {
    assert.equal(run(machine(t2), ['--host', 'antigravity', '--leader-model', 'gpt-oss-test']).leader, 'unknown');
  });
});

// --- Usage

test('usage errors exit 2', (t) => {
  const m = machine(t).file('a-file');
  const bad = [[], ['--host'], ['--host', 'claude'], ['--host', 'claude-code', '--frobnicate'], ['--host', 'codex', 'stray'],
    ['--host', 'codex', '--workspace', join(m.home, 'a-file')], ['--host', 'codex', '--workspace', join(m.home, 'absent')],
    // an option without a value, an empty value, an option in value position
    ['--host', 'codex', '--leader-model'], ['--host', 'codex', '--leader-model', '--bogus'], ['--host', 'codex', '--leader-model', '--workspace', m.home],
    ['--host', 'codex', '--workspace='], ['--host', 'codex', '--workspace', ''], ['--host', 'codex', '--leader-model='], ['--host=', '--workspace', m.home], ['--host', '--workspace'],
    ['--host', 'codex', '--leader-only=yes'], ['--leader-only']];
  for (const args of bad) {
    const r = run(m, args);
    assert.equal(r.status, 2, `${args.join(' ')}: ${r.out}`);
    assert.equal(r.rows.length, 0, r.out);
  }
  assert.equal(run(m, ['--host', 'codex', '--workspace', m.home]).status, 0);
});

// --- Leader only (the run inside Antigravity's sandbox after the run outside it was refused)

test('--leader-only prints only the leader line and starts no vendor client', async (t) => {
  for (const [host, extra, leader] of [['claude-code', [], 'claude'], ['codex', [], 'codex'], ['antigravity', ['--leader-model', 'gemini-test-flash-low'], 'antigravity']]) {
    await t.test(host, (t2) => {
      const m = machine(t2).client('claude', CLAUDE_IN).client('codex', CODEX_IN).client('agy', AGY);
      const r = run(m, ['--host', host, '--leader-only', ...extra], m.plugin());
      assert.equal(r.status, 0, r.out);
      assert.deepEqual(r.rows, [], r.out);
      assert.equal(r.leader, leader, r.out);
      assert.deepEqual([...m.calls('claude'), ...m.calls('codex')], [], 'a vendor client was started');
      assert.deepEqual(m.calls('agy'), host === 'antigravity' ? ['agy models'] : []);
    });
  }
});

// --- Paths that a shell command cannot hold safely

test('a workspace path with " $ ` \\ or | is refused with exit 2, and no client is started', (t) => {
  const m = machine(t).client('codex', CODEX_IN);
  for (const ch of ['"', '$', '`', '\\', '|']) {
    const dir = join(m.root, `ws${ch}x`);
    mkdirSync(dir);
    const r = run(m, ['--host', 'claude-code', '--workspace', dir]);
    assert.equal(r.status, 2, `${ch}: ${r.out}`);
    assert.equal(r.rows.length, 0, r.out);
    assert.match(r.out, /a path with one of the characters " \$ ` \\ \| is not supported/, ch);
  }
  assert.deepEqual(m.calls('codex'), []);
  // The default workspace is the current folder, and the same rule holds for it.
  const cwd = join(m.root, 'cur$dir');
  mkdirSync(cwd);
  const r = spawnSync(process.execPath, [script, '--host', 'codex'], { encoding: 'utf8', cwd, env: { PATH: m.bin, HOME: m.home } });
  assert.equal(r.status, 2, r.stderr);
  assert.match(r.stderr, /is not supported/);
  // The leader line never reads the workspace, so --leader-only still answers.
  const lead = run(m, ['--host', 'codex', '--leader-only', '--workspace', join(m.root, 'ws$x')]);
  assert.deepEqual([lead.status, lead.rows, lead.leader], [0, [], 'codex'], lead.out);
});
