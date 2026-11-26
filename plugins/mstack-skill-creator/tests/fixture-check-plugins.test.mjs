import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const fixtureRepo = resolve(here, '../skills/mstack-skill-creator/evals/plugin-target/files/skills-repo');

function setupRepo(mutate = () => {}) {
  const dir = mkdtempSync(join(tmpdir(), 'fixture-check-plugins-'));
  cpSync(fixtureRepo, dir, { recursive: true });
  renameSync(
    join(dir, 'plugins/greet/skills/greet/SKILL.md.fixture'),
    join(dir, 'plugins/greet/skills/greet/SKILL.md'),
  );
  cpSync(join(dir, 'LICENSE'), join(dir, 'plugins/greet/skills/greet/LICENSE'));
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  execFileSync('git', ['-c', 'user.name=eval', '-c', 'user.email=eval@example.com', 'add', '-A'], { cwd: dir });
  execFileSync('git', ['-c', 'user.name=eval', '-c', 'user.email=eval@example.com', 'commit', '-qm', 'init'], { cwd: dir });
  mutate(dir);
  return dir;
}

function addSkillFiles(dir, name) {
  const skillDir = join(dir, `plugins/${name}/skills/${name}`);
  mkdirSync(skillDir, { recursive: true });
  writeFileSync(join(skillDir, 'SKILL.md'), `---\nname: ${name}\ndescription: Use when testing ${name}.\n---\n\n# ${name}\n`);
  cpSync(join(dir, 'LICENSE'), join(skillDir, 'LICENSE'));
  writeFileSync(join(skillDir, 'THIRD_PARTY_NOTICES.md'), '# Third-party notices\n\nNone.\n');
  const readme = readFileSync(join(dir, 'README.md'), 'utf8');
  writeFileSync(join(dir, 'README.md'), `${readme.trimEnd()}\n| ${name} | Test plugin. |\n`);
}

function writeManifest(dir, name, host) {
  const folder = host === 'claude' ? '.claude-plugin' : host === 'codex' ? '.codex-plugin' : '.antigravity-plugin';
  const manifestDir = join(dir, `plugins/${name}/${folder}`);
  mkdirSync(manifestDir, { recursive: true });
  const body = {
    name,
    version: '0.1.0',
    description: `Test plugin ${name}.`,
    license: 'Apache-2.0',
    author: { name: 'example' },
    ...(host === 'codex' ? { skills: './skills/' } : {}),
  };
  writeFileSync(join(manifestDir, 'plugin.json'), `${JSON.stringify(body, null, 2)}\n`);
}

function addRegistryEntry(dir, name, host) {
  const file = host === 'claude' ? '.claude-plugin/marketplace.json' : '.agents/plugins/marketplace.json';
  const p = join(dir, file);
  const data = JSON.parse(readFileSync(p, 'utf8'));
  const entry = host === 'claude'
    ? { name, source: `./plugins/${name}`, version: '0.1.0' }
    : { name, source: { source: 'local', path: `./plugins/${name}` } };
  data.plugins.push(entry);
  writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`);
}

function declareSingleHost(dir, name, label) {
  const p = join(dir, 'AGENTS.md');
  let text = readFileSync(p, 'utf8');
  if (!/^## Single-host plugins\s*$/m.test(text)) {
    text = `${text.trimEnd()}\n\n## Single-host plugins\n`;
  }
  writeFileSync(p, `${text.trimEnd()}\n\n- \`${name}\`: ${label}\n`);
}

function runCheck(dir) {
  return spawnSync(process.execPath, ['scripts/check-plugins.mjs'], { cwd: dir, encoding: 'utf8' });
}

test("today's two-host plugin passes", () => {
  const dir = setupRepo();
  try {
    const r = runCheck(dir);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /plugin checks passed: 1 plugins/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a declared Codex-only plugin with only its Codex manifest and entry passes', () => {
  const dir = setupRepo((d) => {
    declareSingleHost(d, 'codex-only', 'Codex only');
    addSkillFiles(d, 'codex-only');
    writeManifest(d, 'codex-only', 'codex');
    addRegistryEntry(d, 'codex-only', 'codex');
  });
  try {
    const r = runCheck(dir);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /plugin checks passed: 2 plugins/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a declared Antigravity-only plugin with only its Antigravity manifest and no entry passes', () => {
  const dir = setupRepo((d) => {
    declareSingleHost(d, 'agy-only', 'Antigravity only');
    addSkillFiles(d, 'agy-only');
    writeManifest(d, 'agy-only', 'antigravity');
  });
  try {
    const r = runCheck(dir);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /plugin checks passed: 2 plugins/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a declared Codex-only plugin with a Claude manifest fails', () => {
  const dir = setupRepo((d) => {
    declareSingleHost(d, 'codex-only', 'Codex only');
    addSkillFiles(d, 'codex-only');
    writeManifest(d, 'codex-only', 'codex');
    writeManifest(d, 'codex-only', 'claude');
    addRegistryEntry(d, 'codex-only', 'codex');
  });
  try {
    const r = runCheck(dir);
    assert.notEqual(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /FAIL\s+codex-only:/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a declared Antigravity-only plugin with a registry entry fails', () => {
  const dir = setupRepo((d) => {
    declareSingleHost(d, 'agy-only', 'Antigravity only');
    addSkillFiles(d, 'agy-only');
    writeManifest(d, 'agy-only', 'antigravity');
    addRegistryEntry(d, 'agy-only', 'claude');
  });
  try {
    const r = runCheck(dir);
    assert.notEqual(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /FAIL\s+agy-only:/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('an undeclared plugin with one manifest fails', () => {
  const dir = setupRepo((d) => {
    addSkillFiles(d, 'half');
    writeManifest(d, 'half', 'codex');
    addRegistryEntry(d, 'half', 'codex');
  });
  try {
    const r = runCheck(dir);
    assert.notEqual(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /FAIL\s+half:/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
