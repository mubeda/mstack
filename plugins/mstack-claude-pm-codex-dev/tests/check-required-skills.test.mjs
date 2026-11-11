// Tests for scripts/check-required-skills.sh: the Claude-side skills, the Codex plugin for Claude Code, the codex
// CLI login and the Codex-side skills, each looked up where its host reads it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const skill = resolve(dirname(fileURLToPath(import.meta.url)), '../skills/mstack-claude-pm-codex-dev');
const bash = spawnSync('sh', ['-c', 'command -v bash'], { encoding: 'utf8' }).stdout.trim();

const put = (dir, file = 'SKILL.md', text = 'x') => { mkdirSync(dir, { recursive: true }); writeFileSync(join(dir, file), text); };

// Builds a throwaway machine. Options switch single items off or move them.
function machine(o = {}) {
  const root = mkdtempSync(join(tmpdir(), 'pm-req-'));
  const home = join(root, 'home'), bin = join(root, 'bin'), cwd = join(root, 'work');
  const claude = join(home, '.claude'), codex = o.codexHome ?? join(home, '.codex');
  mkdirSync(bin, { recursive: true }); mkdirSync(cwd, { recursive: true });
  writeFileSync(join(bin, 'codex'), `#!/bin/sh\n[ "$1 $2" = "login status" ] && exit ${o.codexLoggedOut ? 1 : 0}\nexit 0\n`);
  writeFileSync(join(bin, 'gh'), '#!/bin/sh\nexit 0\n');
  for (const t of ['codex', 'gh']) chmodSync(join(bin, t), 0o755);

  for (const s of ['mstack-find-skills', 'mstack-best-model-for']) put(join(claude, 'skills', s));
  const record = {};
  if (!o.noCodexPlugin) {
    const install = join(claude, 'plugins', 'cache', 'openai-codex', 'codex', '1.0.6');
    put(join(install, 'scripts'), 'codex-companion.mjs', '');
    record['codex@openai-codex'] = [{ scope: 'user', installPath: install }];
  }
  if (!o.noSkillCodex) put(join(claude, 'plugins', 'cache', 'skill-codex', 'skill-codex', '1.0.0', 'skills', 'codex'), 'SKILL.md', 'codex exec');
  put(join(claude, 'plugins'), 'installed_plugins.json', JSON.stringify({ version: 2, plugins: record }));

  const codexSide = ['mstack-diagnose', ...(o.noCodexModel ? [] : ['mstack-best-model-for']), ...(o.ponytail === 'codex' || o.ponytail === undefined ? ['ponytail'] : []), ...(o.uiux ? ['ui-ux-pro-max'] : [])];
  for (const s of codexSide) put(join(codex, 'skills', s));
  if (o.ponytail === 'claude') put(join(claude, 'skills', 'ponytail'));
  if (o.ponytail === 'cache') {
    put(join(codex, 'plugins', 'cache', 'ponytail-mp', 'ponytail', '1.0.0', 'skills', 'ponytail'));
    if (o.record !== undefined) put(codex, 'config.toml', `[plugins."ponytail@ponytail-mp"]\n${o.record}\n\n[other]\nenabled = false\n`);
  }
  const env = { HOME: home, CLAUDE_CONFIG_DIR: claude, PATH: `${bin}:${dirname(process.execPath)}:/usr/bin:/bin` };
  if (o.codexHome) env.CODEX_HOME = codex;
  return { env, cwd };
}

function check(o = {}, args = []) {
  const m = machine(o);
  const r = spawnSync(bash, [join(skill, 'scripts/check-required-skills.sh'), ...args], { encoding: 'utf8', cwd: m.cwd, env: m.env });
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
}

test('every item present: exit 0, no MISSING line, items in order', () => {
  const r = check();
  assert.equal(r.status, 0, r.out);
  assert.doesNotMatch(r.out, /MISSING/);
  const labels = r.out.trim().split('\n').map((l) => l.replace(/^\S+\s+/, '').replace(/ is missing.*$/, ''));
  assert.deepEqual(labels, ['node on PATH', 'mstack-find-skills (Claude side)', 'mstack-best-model-for (Claude side)', 'Codex plugin for Claude Code', 'codex CLI logged in', 'ponytail (Codex side)', 'mstack-diagnose (Codex side)', 'mstack-best-model-for (Codex side)', 'codex skill (skill-codex plugin)']);
});

test('no Codex plugin in the install record: exit 1', () => {
  const r = check({ noCodexPlugin: true });
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /^MISSING {2}Codex plugin for Claude Code/m);
});

test('ponytail only on the Claude side: exit 1', () => {
  const r = check({ ponytail: 'claude' });
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /^MISSING {2}ponytail \(Codex side\)/m);
});

test('ponytail only in Codex\'s plugin cache, with no record in config.toml: exit 1', () => {
  const r = check({ ponytail: 'cache' });
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /^MISSING {2}ponytail \(Codex side\)/m);
});

test('ponytail in the cache with a record that says enabled = false: exit 1', () => {
  const r = check({ ponytail: 'cache', record: 'enabled = false' });
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /^MISSING {2}ponytail \(Codex side\)/m);
});

test('ponytail in the cache with a record that says enabled = true: exit 0', () => {
  const r = check({ ponytail: 'cache', record: 'enabled = true' });
  assert.equal(r.status, 0, r.out);
});

test('CODEX_HOME pointing at a second folder that holds the skills: exit 0', () => {
  const codexHome = join(mkdtempSync(join(tmpdir(), 'pm-codexhome-')), 'codex');
  const r = check({ codexHome });
  assert.equal(r.status, 0, r.out);
});

test('codex login status fails: exit 1', () => {
  const r = check({ codexLoggedOut: true });
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /^MISSING {2}codex CLI logged in/m);
});

test('no skill-codex codex skill: exit 0 with a WARN line', () => {
  const r = check({ noSkillCodex: true });
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /^WARN {5}codex skill \(skill-codex plugin\)/m);
});

test('no ui-ux-pro-max and no flag: exit 0', () => {
  const r = check({});
  assert.equal(r.status, 0, r.out);
  assert.doesNotMatch(r.out, /gh CLI|ui-ux-pro-max/);
});

test('--web-ui without ui-ux-pro-max on the Codex side: exit 1', () => {
  const r = check({}, ['--web-ui']);
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /^MISSING {2}ui-ux-pro-max \(Codex side\)/m);
});

test('--github checks the gh login', () => {
  const r = check({}, ['--github']);
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /^ok {7}gh CLI logged in/m);
});

test('an unknown option exits 2', () => {
  const r = check({}, ['--bogus']);
  assert.equal(r.status, 2, r.out);
});

test('mstack-best-model-for only on the Claude side: exit 1, because mstack-diagnose needs it on the Codex side', () => {
  const r = check({ noCodexModel: true });
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /^MISSING {2}mstack-best-model-for \(Codex side\)/m);
});
