import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const json = (path) => JSON.parse(read(path));
const claude = json('.claude-plugin/marketplace.json').plugins;
const codex = json('.agents/plugins/marketplace.json').plugins;
const names = (entries) => entries.map((entry) => entry.name).sort();
const folders = readdirSync(resolve(root, 'plugins'), { withFileTypes: true })
  .filter((file) => file.isDirectory()).map((file) => file.name);
const hasManifest = (name, host) => existsSync(resolve(root, 'plugins', name, `.${host}-plugin/plugin.json`));

for (const entries of [claude, codex]) {
  assert.equal(new Set(names(entries)).size, entries.length, 'Duplicate plugin names');
}
assert.deepEqual(names(claude), folders.filter((name) => hasManifest(name, 'claude')).sort(),
  'Claude registry and plugins with a .claude-plugin manifest differ');
assert.deepEqual(names(codex), folders.filter((name) => hasManifest(name, 'codex')).sort(),
  'Codex registry and plugins with a .codex-plugin manifest differ');

for (const name of folders) {
  assert(hasManifest(name, 'claude') || hasManifest(name, 'codex'), `${name}: no plugin manifest`);
  const source = `./plugins/${name}`;
  const cc = claude.find((plugin) => plugin.name === name);
  const cx = codex.find((plugin) => plugin.name === name);
  const versions = [];
  if (cc) {
    assert.equal(cc.source, source, `${name}: source must be its plugins/ folder`);
    const ccManifest = json(`${source}/.claude-plugin/plugin.json`);
    assert.equal(ccManifest.name, name);
    assert.equal(ccManifest.version, cc.version, `${name}: Claude manifest version differs`);
    versions.push(cc.version);
  }
  if (cx) {
    assert.equal(cx.source.source, 'local');
    assert.equal(cx.source.path, source, `${name}: Codex source must be its plugins/ folder`);
    const cxManifest = json(`${source}/.codex-plugin/plugin.json`);
    assert.equal(cxManifest.name, name);
    assert.equal(cxManifest.skills, './skills/');
    versions.push(cxManifest.version);
  }
  assert.equal(new Set(versions).size, 1, `${name}: Claude and Codex versions differ`);
  const skillRoot = resolve(root, source, 'skills');
  for (const skill of readdirSync(skillRoot, { withFileTypes: true }).filter((file) => file.isDirectory())) {
    const skillPath = resolve(skillRoot, skill.name);
    const content = readFileSync(resolve(skillPath, 'SKILL.md'), 'utf8');
    assert.match(content, new RegExp(`^---\\r?\\nname: ${skill.name}\\r?\\n`));
    assert.match(content, /\ndescription:\s*\S+/);
    const referencePath = resolve(skillPath, 'references');
    const resources = existsSync(referencePath)
      ? readdirSync(referencePath).filter((name) => name.endsWith('.md'))
        .map((name) => readFileSync(resolve(referencePath, name), 'utf8')).join('\n')
      : '';
    // Paths under another folder (`<other-skill-dir>/scripts/x.py`) belong to that folder, not this skill.
    for (const [, dir, file] of `${content}\n${resources}`.matchAll(/(?<![\w/>.-])(references|scripts)\/([\w.-]+\.\w+)\b/g)) {
      assert(existsSync(resolve(skillPath, dir, file)), `${skill.name}: missing ${dir}/${file}`);
    }
  }
}

// The three workflows ship the same reference files and notices; each install copies only its own plugin folder.
const shared = ['mstack-codex-review-workflow', 'mstack-claude-review-workflow', 'mstack-claude-pm-codex-dev'];
const sharedFiles = ['skills/<skill>/THIRD_PARTY_NOTICES.md', ...readdirSync(resolve(root, 'plugins', shared[0], 'skills', shared[0], 'references'))
  .map((file) => `skills/<skill>/references/${file}`)];
for (const file of sharedFiles) {
  const first = read(`plugins/${shared[0]}/${file.replace('<skill>', shared[0])}`);
  for (const name of shared.slice(1)) {
    const path = `plugins/${name}/${file.replace('<skill>', name)}`;
    assert(existsSync(resolve(root, path)), `${file} is missing in ${name}; copy ${shared[0]}'s`);
    assert.equal(read(path), first, `${file} differs between ${shared[0]} and ${name}; edit every copy (${shared.join(', ')})`);
  }
}

// mstack-plan writes plans in the format the three workflows read, so plan-format.md ships identically in all four plugins.
// The review rules live only in mstack-receive-review, which all four load.
for (const file of ['plan-format.md']) {
  const path = (name) => `plugins/${name}/skills/${name}/references/${file}`;
  for (const name of shared) {
    assert.equal(read(path(name)), read(path('mstack-plan')), `${file} differs between mstack-plan and ${name}; edit all four copies`);
  }
}

// The seven skills that read code ship the same codegraph steps; each install copies only its own folder.
for (const name of ['mstack-write-specs', 'mstack-diagnose', 'mstack-backlog-triage', ...shared]) {
  const path = (n) => `plugins/${n}/skills/${n}/references/codegraph.md`;
  assert(existsSync(resolve(root, path(name))), `${name}: references/codegraph.md is missing; copy mstack-plan's`);
  assert.equal(read(path(name)), read(path('mstack-plan')), `${name}: references/codegraph.md differs from mstack-plan's copy`);
}

// The skills CLI (npx skills) installs only a skill's own folder, so each one carries its license and notices,
// and no other SKILL.md may sit inside it (an eval fixture's would install as a second skill).
assert.deepEqual(json('skills.sh.json').paths, ['./plugins'], 'skills.sh.json must point the skills CLI at ./plugins');
const license = read('LICENSE');
const nestedSkills = (dir) => readdirSync(dir, { withFileTypes: true, recursive: true })
  .filter((entry) => entry.isFile() && entry.name === 'SKILL.md' && resolve(entry.parentPath ?? entry.path) !== dir);
for (const name of folders) {
  const skillsDir = resolve(root, 'plugins', name, 'skills');
  for (const skill of readdirSync(skillsDir)) {
    const dir = resolve(skillsDir, skill);
    assert.equal(read(`plugins/${name}/skills/${skill}/LICENSE`), license, `${skill}: LICENSE missing or differs from the root LICENSE`);
    assert(existsSync(resolve(dir, 'THIRD_PARTY_NOTICES.md')), `${skill}: THIRD_PARTY_NOTICES.md must sit in the skill folder`);
    assert.deepEqual(nestedSkills(dir).map((entry) => entry.parentPath ?? entry.path), [], `${skill}: nested SKILL.md files; name fixture copies SKILL.md.fixture`);
  }
  assert(!existsSync(resolve(root, 'plugins', name, 'THIRD_PARTY_NOTICES.md')), `${name}: move THIRD_PARTY_NOTICES.md into the skill folder`);
}

// The plan linter must accept its own sample plan, so a format change that breaks one breaks the other.
const planSkill = resolve(root, 'plugins/mstack-plan/skills/mstack-plan');
const lint = spawnSync(process.execPath, [resolve(planSkill, 'scripts/check-plan.mjs'), resolve(planSkill, 'evals/_fixture/sample-plan')], { encoding: 'utf8' });
assert.equal(lint.status, 0, `check-plan.mjs rejects evals/_fixture/sample-plan:\n${lint.stdout}${lint.stderr}`);

// The review rules have one home: no plugin ships a copy of them.
for (const name of readdirSync(resolve(root, 'plugins'))) {
  const copy = `plugins/${name}/skills/${name}/references/receiving-review.md`;
  assert(!existsSync(resolve(root, copy)), `${copy} exists; the review rules live only in mstack-receive-review`);
}

// mstack-claude-pm-codex-dev's test cases run a plan folder too, so it must pass the linter.
const pmPlan = resolve(root, 'plugins/mstack-claude-pm-codex-dev/skills/mstack-claude-pm-codex-dev/evals/_fixture/plan');
const pmLint = spawnSync(process.execPath, [resolve(planSkill, 'scripts/check-plan.mjs'), pmPlan], { encoding: 'utf8' });
assert.equal(pmLint.status, 0, `check-plan.mjs rejects mstack-claude-pm-codex-dev's evals/_fixture/plan:\n${pmLint.stdout}${pmLint.stderr}`);
console.log(`Marketplace checks passed: ${claude.length} Claude plugins, ${codex.length} Codex plugins`);
