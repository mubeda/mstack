// Tests for scripts/check-required-skills.sh (two-part preflight of the dev kind: host part and --developer part).
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const pluginDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const skill = resolve(pluginDir, 'skills', basename(pluginDir));
const scriptPath = join(skill, 'scripts/check-required-skills.sh');
const bash = spawnSync('sh', ['-c', 'command -v bash'], { encoding: 'utf8' }).stdout.trim();
const nodeDir = dirname(process.execPath);
const gitPath = spawnSync('sh', ['-c', 'command -v git'], { encoding: 'utf8' }).stdout.trim();
const gitDir = dirname(gitPath);
const temps = [];
const temp = (prefix) => { const dir = mkdtempSync(join(tmpdir(), prefix)); temps.push(dir); return dir; };
after(() => { for (const dir of temps) rmSync(dir, { recursive: true, force: true }); });

const put = (dir, file = 'SKILL.md', text = 'x') => { mkdirSync(dir, { recursive: true }); writeFileSync(join(dir, file), text); };
const hostSkillDir = { claude: '.claude/skills', codex: '.codex/skills', antigravity: '.gemini/config/skills' };
const hostCore = ['mstack-find-skills', 'mstack-best-model-for', 'mstack-receive-review', 'mstack-research', 'mstack-vendors'];
const devCore = ['ponytail', 'mstack-diagnose', 'mstack-best-model-for', 'mstack-receive-review'];
const installSnippets = {
  claude: {
    plugin: 'claude plugin install',
    cli: '-g -a claude-code -y',
    other: ['codex plugin add', 'agy plugin install', '-a codex', '-a antigravity'],
  },
  codex: {
    plugin: 'codex plugin add',
    cli: '-g -a codex -y',
    other: ['claude plugin install', 'agy plugin install', '-a claude-code', '-a antigravity'],
  },
  antigravity: {
    plugin: 'agy plugin install https://github.com/mubeda/mstack/tree/main/plugins/',
    cli: '-g -a antigravity -y',
    other: ['claude plugin install', 'codex plugin add', '-a claude-code', '-a codex'],
  },
};

function git(cwd, ...args) {
  const r = spawnSync(gitPath, args, {
    cwd,
    encoding: 'utf8',
    env: { PATH: `${gitDir}:/usr/bin:/bin`, GIT_AUTHOR_NAME: 'Test', GIT_AUTHOR_EMAIL: 't@example.com', GIT_COMMITTER_NAME: 'Test', GIT_COMMITTER_EMAIL: 't@example.com' },
  });
  assert.equal(r.status, 0, `git ${args.join(' ')} failed: ${r.stderr}`);
}

// Builds a throwaway machine with a Git checkout at cwd and isolated HOME/PATH.
function machine(o = {}) {
  const root = temp('dev-req-');
  const home = join(root, 'home'), bin = join(root, 'bin'), cwd = join(root, 'work');
  mkdirSync(home, { recursive: true });
  mkdirSync(bin, { recursive: true });
  mkdirSync(cwd, { recursive: true });
  git(cwd, 'init', '-q');
  writeFileSync(join(cwd, 'README.md'), 'init\n');
  git(cwd, 'add', 'README.md');
  git(cwd, 'commit', '-q', '-m', 'init');

  let pathEnv;
  if (o.noPython) {
    // Clean bin with only the POSIX utilities the script needs plus node and git, and no python/python3.
    const needed = ['node', 'git', 'bash', 'find', 'grep', 'awk', 'dirname', 'basename', 'env'];
    for (const cmd of needed) {
      const found = cmd === 'node' ? process.execPath : spawnSync('sh', ['-c', `command -v ${cmd}`], { encoding: 'utf8' }).stdout.trim();
      if (found) symlinkSync(found, join(bin, cmd));
    }
    pathEnv = bin;
  } else {
    if (o.withPython) {
      writeFileSync(join(bin, 'python3'), '#!/bin/sh\nexit 0\n');
      chmodSync(join(bin, 'python3'), 0o755);
    }
    if (o.withGh) {
      writeFileSync(join(bin, 'gh'), '#!/bin/sh\nexit 0\n');
      chmodSync(join(bin, 'gh'), 0o755);
    }
    pathEnv = [bin, nodeDir, gitDir].filter((v, i, a) => v && a.indexOf(v) === i).join(':');
  }

  for (const [name, body] of Object.entries(o.stubs ?? {})) {
    writeFileSync(join(bin, name), `#!/bin/sh\n${body}\n`);
    chmodSync(join(bin, name), 0o755);
  }

  // Place host skills (plus optional ponytail / mstack-diagnose).
  for (const [h, list] of Object.entries(o.hostSkills ?? {})) {
    for (const s of list) put(join(home, hostSkillDir[h], s));
  }
  // Place project-level untracked and tracked files.
  for (const rel of o.untracked ?? []) put(join(cwd, dirname(rel)), basename(rel));
  if (o.tracked?.length) {
    for (const rel of o.tracked) put(join(cwd, dirname(rel)), basename(rel));
    git(cwd, 'add', ...o.tracked);
    git(cwd, 'commit', '-q', '-m', 'track skills');
  }
  // Optional Claude plugin cache entry.
  if (o.claudeCache) {
    const { skill: s, recorded } = o.claudeCache;
    put(join(home, '.claude', 'plugins', 'cache', 'mstack', s, '0.1.0', 'skills', s));
    const plugins = recorded ? { [`${s}@mstack`]: [{ scope: 'user' }] } : {};
    put(join(home, '.claude', 'plugins'), 'installed_plugins.json', JSON.stringify({ version: 2, plugins }));
  }
  // Optional Codex plugin cache entry.
  if (o.codexCache) {
    const { skill: s, config } = o.codexCache;
    put(join(home, '.codex', 'plugins', 'cache', 'mstack', s, '0.1.0', 'skills', s));
    if (config !== undefined) put(join(home, '.codex'), 'config.toml', `[plugins."${s}@mstack"]\n${config}\n`);
  }

  const env = { HOME: home, PATH: pathEnv };
  return { root, home, bin, cwd, env };
}

function runCheck(m, args) {
  const r = spawnSync(bash, [scriptPath, ...args], { encoding: 'utf8', cwd: m.cwd, env: m.env });
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
}

const allOutputs = [];
function record(r) { allOutputs.push(r.out); return r; }

// Host-part tests (include ponytail and mstack-diagnose in default host setup so Task 2.3 regression coverage passes in Red).
test('claude: every host-part item present: exit 0', () => {
  const m = machine({ hostSkills: { claude: [...hostCore, 'ponytail', 'mstack-diagnose'] } });
  const r = record(runCheck(m, ['--host', 'claude']));
  assert.equal(r.status, 0, r.out);
  assert.doesNotMatch(r.out, /MISSING/, r.out);
  for (const s of hostCore) assert.match(r.out, new RegExp(`ok {7}${s}`), r.out);
});

test('codex: every host-part item present: exit 0', () => {
  const m = machine({ hostSkills: { codex: [...hostCore, 'ponytail', 'mstack-diagnose'] } });
  const r = record(runCheck(m, ['--host', 'codex']));
  assert.equal(r.status, 0, r.out);
  assert.doesNotMatch(r.out, /MISSING/, r.out);
  for (const s of hostCore) assert.match(r.out, new RegExp(`ok {7}${s}`), r.out);
});

test('antigravity: every host-part item present: exit 0', () => {
  const m = machine({ hostSkills: { antigravity: [...hostCore, 'ponytail', 'mstack-diagnose'] } });
  const r = record(runCheck(m, ['--host', 'antigravity']));
  assert.equal(r.status, 0, r.out);
  assert.doesNotMatch(r.out, /MISSING/, r.out);
  for (const s of hostCore) assert.match(r.out, new RegExp(`ok {7}${s}`), r.out);
});

test('claude: mstack-vendors missing is MISSING with this host\'s install line and mstack-setup', () => {
  const m = machine({ hostSkills: { claude: [...hostCore.filter((s) => s !== 'mstack-vendors'), 'ponytail', 'mstack-diagnose'] } });
  const r = record(runCheck(m, ['--host', 'claude']));
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /MISSING {2}mstack-vendors/, r.out);
  assert.ok(r.out.includes(`${installSnippets.claude.plugin} mstack-vendors@mstack`), r.out);
  assert.ok(r.out.includes(installSnippets.claude.cli), r.out);
  assert.match(r.out, /mstack-setup/, r.out);
  for (const other of installSnippets.claude.other) assert.ok(!r.out.includes(other), r.out);
});

test('codex: mstack-vendors missing is MISSING with this host\'s install line and mstack-setup', () => {
  const m = machine({ hostSkills: { codex: [...hostCore.filter((s) => s !== 'mstack-vendors'), 'ponytail', 'mstack-diagnose'] } });
  const r = record(runCheck(m, ['--host', 'codex']));
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /MISSING {2}mstack-vendors/, r.out);
  assert.ok(r.out.includes(`${installSnippets.codex.plugin} mstack-vendors@mstack`), r.out);
  assert.ok(r.out.includes(installSnippets.codex.cli), r.out);
  assert.match(r.out, /mstack-setup/, r.out);
  for (const other of installSnippets.codex.other) assert.ok(!r.out.includes(other), r.out);
});

test('antigravity: mstack-vendors missing is MISSING with this host\'s install line and mstack-setup', () => {
  const m = machine({ hostSkills: { antigravity: [...hostCore.filter((s) => s !== 'mstack-vendors'), 'ponytail', 'mstack-diagnose'] } });
  const r = record(runCheck(m, ['--host', 'antigravity']));
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /MISSING {2}mstack-vendors/, r.out);
  assert.ok(r.out.includes(`${installSnippets.antigravity.plugin}mstack-vendors`), r.out);
  assert.ok(r.out.includes(installSnippets.antigravity.cli), r.out);
  assert.match(r.out, /mstack-setup/, r.out);
  for (const other of installSnippets.antigravity.other) assert.ok(!r.out.includes(other), r.out);
});

test('antigravity host: ponytail found prints one note and exits 0', () => {
  const m = machine({ hostSkills: { antigravity: [...hostCore, 'ponytail', 'mstack-diagnose'] } });
  const r = record(runCheck(m, ['--host', 'antigravity']));
  assert.equal(r.status, 0, r.out);
  const hits = r.out.match(/note {5}ponytail: its hooks do not run in Antigravity/g) ?? [];
  assert.equal(hits.length, 1, r.out);
});

test('host part does not require ponytail or mstack-diagnose on the host side', () => {
  for (const host of ['claude', 'codex', 'antigravity']) {
    const m = machine({ hostSkills: { [host]: hostCore } });
    const r = record(runCheck(m, ['--host', host]));
    assert.equal(r.status, 0, `${host}:\n${r.out}`);
    assert.doesNotMatch(r.out, /mstack-diagnose|ponytail/, `${host}:\n${r.out}`);
  }
});

test('antigravity host, codex developer: one ponytail note across both parts', () => {
  const m = machine({ hostSkills: { antigravity: [...hostCore, 'ponytail'], codex: devCore } });
  const p1 = record(runCheck(m, ['--host', 'antigravity']));
  const p2 = record(runCheck(m, ['--host', 'antigravity', '--developer', 'codex']));
  assert.equal(p1.status, 0, p1.out);
  assert.equal(p2.status, 0, p2.out);
  const combined = `${p1.out}\n${p2.out}`;
  const hits = combined.match(/hooks do not run in Antigravity/g) ?? [];
  assert.equal(hits.length, 1, combined);
});

test('claude host, codex developer: no ponytail note', () => {
  const m = machine({ hostSkills: { claude: [...hostCore, 'ponytail'], codex: devCore } });
  const p1 = record(runCheck(m, ['--host', 'claude']));
  const p2 = record(runCheck(m, ['--host', 'claude', '--developer', 'codex']));
  assert.equal(p1.status, 0, p1.out);
  assert.equal(p2.status, 0, p2.out);
  assert.doesNotMatch(`${p1.out}\n${p2.out}`, /hooks do not run in Antigravity/);
});

test('codex host, claude developer: mstack-diagnose missing on the Claude side is MISSING with its install lines, exit 1', () => {
  const m = machine({ hostSkills: { claude: devCore.filter((s) => s !== 'mstack-diagnose') } });
  const r = record(runCheck(m, ['--host', 'codex', '--developer', 'claude']));
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /MISSING {2}mstack-diagnose/, r.out);
  assert.ok(r.out.includes('claude plugin install mstack-diagnose@mstack'), r.out);
  assert.ok(r.out.includes('-g -a claude-code -y'), r.out);
  assert.match(r.out, /mstack-setup/, r.out);
});

test('codex: claude developer with mstack-diagnose only untracked in .claude/skills is ok outside-copy with its path', () => {
  const m = machine({
    hostSkills: { claude: devCore.filter((s) => s !== 'mstack-diagnose') },
    untracked: ['.claude/skills/mstack-diagnose/SKILL.md'],
  });
  const r = record(runCheck(m, ['--host', 'codex', '--developer', 'claude']));
  assert.equal(r.status, 0, r.out);
  const expectedPath = join(m.cwd, '.claude/skills/mstack-diagnose/SKILL.md');
  assert.match(r.out, /^ok\s+mstack-diagnose outside-copy /m, r.out);
  assert.ok(r.out.includes(expectedPath), r.out);
  assert.doesNotMatch(r.out, /mstack-diagnose in-copy/, r.out);
});

test('codex: claude developer with mstack-diagnose installed only for the user is ok outside-copy with the absolute path of its SKILL.md', () => {
  const m = machine({ hostSkills: { claude: devCore } });
  const r = record(runCheck(m, ['--host', 'codex', '--developer', 'claude']));
  assert.equal(r.status, 0, r.out);
  const expectedPath = join(m.home, '.claude/skills/mstack-diagnose/SKILL.md');
  assert.match(r.out, /^ok\s+mstack-diagnose outside-copy \//m, r.out);
  assert.ok(r.out.includes(expectedPath), r.out);
});

test('codex: claude developer with mstack-diagnose tracked in .claude/skills is ok in-copy', () => {
  const m = machine({
    hostSkills: { claude: devCore.filter((s) => s !== 'mstack-diagnose') },
    tracked: ['.claude/skills/mstack-diagnose/SKILL.md'],
  });
  const r = record(runCheck(m, ['--host', 'codex', '--developer', 'claude']));
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /^ok\s+mstack-diagnose in-copy \.claude\/skills\/mstack-diagnose\/SKILL\.md$/m, r.out);
});

test('codex: claude developer with mstack-diagnose nowhere is MISSING', () => {
  const m = machine({ hostSkills: { claude: devCore.filter((s) => s !== 'mstack-diagnose'), codex: ['mstack-diagnose'] } });
  const r = record(runCheck(m, ['--host', 'codex', '--developer', 'claude']));
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /^MISSING {2}mstack-diagnose/m, r.out);
});

test('claude: codex developer with mstack-diagnose untracked in .agents/skills is ok', () => {
  const m = machine({
    hostSkills: { codex: devCore.filter((s) => s !== 'mstack-diagnose') },
    untracked: ['.agents/skills/mstack-diagnose/SKILL.md'],
  });
  const r = record(runCheck(m, ['--host', 'claude', '--developer', 'codex']));
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /^ok {7}mstack-diagnose/m, r.out);
});

test('claude: codex developer without ui-ux-pro-max is MISSING', () => {
  const m = machine({ hostSkills: { codex: devCore }, withPython: true });
  const r = record(runCheck(m, ['--host', 'claude', '--developer', 'codex', '--web-ui']));
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /^MISSING {2}ui-ux-pro-max/m, r.out);
  assert.doesNotMatch(r.out, /^WARN/m, r.out);
});

test('antigravity: claude developer without ui-ux-pro-max is MISSING', () => {
  const m = machine({ hostSkills: { claude: devCore }, withPython: true });
  const r = record(runCheck(m, ['--host', 'antigravity', '--developer', 'claude', '--web-ui']));
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /^MISSING {2}ui-ux-pro-max/m, r.out);
  assert.doesNotMatch(r.out, /^WARN/m, r.out);
});

test('claude: codex developer with --web-ui and no Python 3 is MISSING', () => {
  const m = machine({ hostSkills: { codex: [...devCore, 'ui-ux-pro-max'] }, noPython: true });
  const r = record(runCheck(m, ['--host', 'claude', '--developer', 'codex', '--web-ui']));
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /^MISSING {2}Python 3 on PATH/m, r.out);
});

test('the developer part runs no client', () => {
  const logDir = temp('dev-noclient-');
  const log = join(logDir, 'called.log');
  const stubs = {
    codex: `echo "codex $*" >> "${log}"; exit 1`,
    claude: `echo "claude $*" >> "${log}"; exit 1`,
    agy: `echo "agy $*" >> "${log}"; exit 1`,
  };
  const m = machine({ hostSkills: { codex: devCore, claude: devCore }, stubs });
  const r1 = record(runCheck(m, ['--host', 'claude', '--developer', 'codex']));
  const r2 = record(runCheck(m, ['--host', 'codex', '--developer', 'claude']));
  assert.equal(r1.status, 0, r1.out);
  assert.equal(r2.status, 0, r2.out);
  assert.throws(() => readFileSync(log, 'utf8'), { code: 'ENOENT' });
});

test('the developer part prints no host-part line', () => {
  const m = machine({ hostSkills: { codex: devCore, claude: devCore } });
  const r1 = record(runCheck(m, ['--host', 'claude', '--developer', 'codex']));
  const r2 = record(runCheck(m, ['--host', 'codex', '--developer', 'claude']));
  for (const r of [r1, r2]) {
    assert.equal(r.status, 0, r.out);
    assert.doesNotMatch(r.out, /node on PATH|git on PATH|mstack-find-skills|mstack-research|mstack-vendors|gh CLI/, r.out);
  }
});

test('no part names, checks or installs a bridge', () => {
  const src = readFileSync(scriptPath, 'utf8');
  assert.doesNotMatch(src, /agent-bridges|bridge/i);
  for (const out of allOutputs) assert.doesNotMatch(out, /agent-bridges|bridge/i);
});

test('--developer antigravity exits 2', () => {
  const m = machine();
  const r = record(runCheck(m, ['--host', 'claude', '--developer', 'antigravity']));
  assert.equal(r.status, 2, r.out);
});

test('--developer equal to the host\'s vendor exits 2', () => {
  const m = machine();
  assert.equal(record(runCheck(m, ['--host', 'claude', '--developer', 'claude'])).status, 2);
  assert.equal(record(runCheck(m, ['--host', 'codex', '--developer', 'codex'])).status, 2);
});

test('--web-ui without --developer exits 2', () => {
  const m = machine({ hostSkills: { claude: hostCore } });
  const r = record(runCheck(m, ['--host', 'claude', '--web-ui']));
  assert.equal(r.status, 2, r.out);
});

test('an unknown option exits 2', () => {
  const m = machine();
  const r = record(runCheck(m, ['--host', 'claude', '--bogus']));
  assert.equal(r.status, 2, r.out);
});

test('no --host exits 2', () => {
  const m = machine();
  const r = record(runCheck(m, []));
  assert.equal(r.status, 2, r.out);
});

test('host part --github checks gh CLI logged in', () => {
  const m = machine({ hostSkills: { claude: hostCore }, withGh: true });
  const r = record(runCheck(m, ['--host=claude', '--github']));
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /^ok {7}gh CLI logged in/m, r.out);
});

test('developer plugin cache requires install record for both claude and codex', () => {
  const unrecClaude = machine({ hostSkills: { claude: devCore.filter((s) => s !== 'mstack-diagnose') }, claudeCache: { skill: 'mstack-diagnose', recorded: false } });
  assert.equal(runCheck(unrecClaude, ['--host', 'codex', '--developer', 'claude']).status, 1);
  const recClaude = machine({ hostSkills: { claude: devCore.filter((s) => s !== 'mstack-diagnose') }, claudeCache: { skill: 'mstack-diagnose', recorded: true } });
  const rc = runCheck(recClaude, ['--host', 'codex', '--developer', 'claude']);
  assert.equal(rc.status, 0, rc.out);
  assert.match(rc.out, /^ok\s+mstack-diagnose outside-copy \//m, rc.out);

  const disabledCodex = machine({ hostSkills: { codex: devCore.filter((s) => s !== 'mstack-diagnose') }, codexCache: { skill: 'mstack-diagnose', config: 'enabled = false' } });
  assert.equal(runCheck(disabledCodex, ['--host', 'claude', '--developer', 'codex']).status, 1);
  const enabledCodex = machine({ hostSkills: { codex: devCore.filter((s) => s !== 'mstack-diagnose') }, codexCache: { skill: 'mstack-diagnose', config: 'enabled = true' } });
  assert.equal(runCheck(enabledCodex, ['--host', 'claude', '--developer', 'codex']).status, 0);
});

test('claude plugin cache resolves active installPath when two cached versions exist', () => {
  for (const activeVer of ['0.1.0', '0.2.0']) {
    const staleVer = activeVer === '0.1.0' ? '0.2.0' : '0.1.0';
    const m = machine({ hostSkills: { claude: devCore.filter((s) => s !== 'mstack-diagnose') } });
    const v1 = join(m.home, '.claude', 'plugins', 'cache', 'mstack', 'mstack-diagnose', '0.1.0');
    const v2 = join(m.home, '.claude', 'plugins', 'cache', 'mstack', 'mstack-diagnose', '0.2.0');
    const active = activeVer === '0.1.0' ? v1 : v2;
    put(join(v1, 'skills', 'mstack-diagnose'));
    put(join(v2, 'skills', 'mstack-diagnose'));
    put(join(m.home, '.claude', 'plugins'), 'installed_plugins.json', JSON.stringify({
      version: 2,
      plugins: { 'mstack-diagnose@mstack': [{ scope: 'user', installPath: active }] },
    }));
    const r = record(runCheck(m, ['--host', 'codex', '--developer', 'claude']));
    assert.equal(r.status, 0, r.out);
    const expected = join(active, 'skills', 'mstack-diagnose', 'SKILL.md');
    assert.ok(r.out.includes(`outside-copy ${expected}`), `expected active ${activeVer} path, got:\n${r.out}`);
    assert.ok(!r.out.includes(`/${staleVer}/`), `returned stale ${staleVer} path:\n${r.out}`);
  }
});

test('claude plugin cache ignores foreign project records, sibling-prefix paths, and ambiguous multi-version fallback', () => {
  const m = machine({ hostSkills: { claude: devCore.filter((s) => s !== 'mstack-diagnose') } });
  const v1 = join(m.home, '.claude', 'plugins', 'cache', 'mstack', 'mstack-diagnose', '0.1.0');
  const v2 = join(m.home, '.claude', 'plugins', 'cache', 'mstack', 'mstack-diagnose', '0.2.0');
  put(join(v1, 'skills', 'mstack-diagnose'));
  put(join(v2, 'skills', 'mstack-diagnose'));
  // Sibling prefix directory (e.g. repo -> repo-other): m.cwd is repo, projectPath is a prefix of repo if not boundary-checked
  const siblingPrefix = m.cwd.slice(0, -1);
  put(join(m.home, '.claude', 'plugins'), 'installed_plugins.json', JSON.stringify({
    version: 2,
    plugins: {
      'mstack-diagnose@mstack': [
        { scope: 'project', projectPath: join(m.root, 'other-project'), installPath: v1 },
        { scope: 'project', projectPath: siblingPrefix, installPath: v2 },
      ],
    },
  }));
  const foreign = record(runCheck(m, ['--host', 'codex', '--developer', 'claude']));
  assert.equal(foreign.status, 1, `should ignore foreign/sibling project records:\n${foreign.out}`);

  // Ambiguous multi-version cache without installPath is refused
  put(join(m.home, '.claude', 'plugins'), 'installed_plugins.json', JSON.stringify({
    version: 2,
    plugins: { 'mstack-diagnose@mstack': [{ scope: 'user' }] },
  }));
  const ambig = record(runCheck(m, ['--host', 'codex', '--developer', 'claude']));
  assert.equal(ambig.status, 1, `should refuse ambiguous multi-version cache without installPath:\n${ambig.out}`);

  // Two equally applicable explicit installPath records at the same scope refuse ambiguously in either order
  for (const order of [[v1, v2], [v2, v1]]) {
    put(join(m.home, '.claude', 'plugins'), 'installed_plugins.json', JSON.stringify({
      version: 2,
      plugins: {
        'mstack-diagnose@mstack': [
          { scope: 'user', installPath: order[0] },
          { scope: 'user', installPath: order[1] },
        ],
      },
    }));
    const dup = record(runCheck(m, ['--host', 'codex', '--developer', 'claude']));
    assert.equal(dup.status, 1, `should refuse two equally applicable explicit installPaths (${order.join(', ')}):\n${dup.out}`);
  }
});

test('missing third-party dependency prints remediation naming mstack-setup', () => {
  const m = machine({ hostSkills: { claude: devCore.filter((s) => s !== 'ponytail') } });
  const r = record(runCheck(m, ['--host', 'codex', '--developer', 'claude']));
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /MISSING {2}ponytail/, r.out);
  assert.match(r.out, /mstack-setup/, r.out);
});
