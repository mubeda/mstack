import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { delimiter, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.env.MSTACK_CHECK_ROOT ?? fileURLToPath(new URL('../', import.meta.url));
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const json = (path) => JSON.parse(read(path));
const claudeCatalog = json('.claude-plugin/marketplace.json');
const codexCatalog = json('.agents/plugins/marketplace.json');
const claude = claudeCatalog.plugins;
const codex = codexCatalog.plugins;
// A Codex-only reader gets the release version from the Codex registry, so both registries carry the same one.
// Two missing versions are equal, so every version is checked for its form before copies are compared.
const isVersion = (value) => typeof value === 'string' && /^\d+\.\d+\.\d+$/.test(value);
assert(isVersion(claudeCatalog.metadata?.version), 'Claude registry has no valid metadata.version');
assert.equal(codexCatalog.metadata?.version, claudeCatalog.metadata.version,
  'Codex registry metadata.version differs from the Claude registry');
const names = (entries) => entries.map((entry) => entry.name).sort();
const folders = readdirSync(resolve(root, 'plugins'), { withFileTypes: true })
  .filter((file) => file.isDirectory()).map((file) => file.name);
const hasManifest = (name, host) => existsSync(resolve(root, 'plugins', name, `.${host}-plugin/plugin.json`));
const kinds = {
  review: ['mstack-claude-led-review', 'mstack-codex-led-review', 'mstack-antigravity-led-review'],
  dev: ['mstack-claude-led-dev', 'mstack-codex-led-dev', 'mstack-antigravity-led-dev'],
};
const oldWorkflows = ['mstack-codex-review-workflow', 'mstack-claude-review-workflow', 'mstack-claude-pm-codex-dev'];
const allSixRequired = false;
const newWorkflows = Object.values(kinds).flat();
const leaderOf = (name) => name.split('-')[1];
const hostTitle = { claude: 'Claude Code', codex: 'Codex', antigravity: 'Antigravity' };
// Plugins another spec assigns to one host, by name: each carries exactly that host's manifest. Every other plugin carries all
// three. A plugin with only an Antigravity manifest is accepted only when this table names it ('antigravity').
// MSTACK_CHECK_HOSTS (a JSON object of the same shape) adds rows for the tests.
const singleHost = {
  'mstack-codex-review-workflow': 'claude',
  'mstack-claude-review-workflow': 'codex',
  'mstack-claude-pm-codex-dev': 'claude',
  ...Object.fromEntries(newWorkflows.map((name) => [name, leaderOf(name)])),
  ...JSON.parse(process.env.MSTACK_CHECK_HOSTS ?? '{}'),
};
const agyPlugins = folders.filter((name) => hasManifest(name, 'antigravity'));

if (allSixRequired) {
  for (const name of newWorkflows) {
    assert(folders.includes(name), `${name}: workflow plugin missing`);
  }
}

for (const entries of [claude, codex]) {
  assert.equal(new Set(names(entries)).size, entries.length, 'Duplicate plugin names');
}
assert.deepEqual(names(claude), folders.filter((name) => hasManifest(name, 'claude')).sort(),
  'Claude registry and plugins with a .claude-plugin manifest differ');
assert.deepEqual(names(codex), folders.filter((name) => hasManifest(name, 'codex')).sort(),
  'Codex registry and plugins with a .codex-plugin manifest differ');

for (const name of folders) {
  const manifests = ['claude', 'codex', 'antigravity'].filter((host) => hasManifest(name, host));
  if (newWorkflows.includes(name)) {
    const leader = leaderOf(name);
    assert.equal(manifests.join(), leader, `${name}: a workflow led from ${leader} has only the .${leader}-plugin manifest (found: ${manifests.join(', ') || 'none'})`);
  } else if (singleHost[name]) {
    assert.equal(manifests.join(), singleHost[name], `${name}: a single-host plugin has exactly one manifest, the ${singleHost[name]} one (found: ${manifests.join(', ') || 'none'})`);
  } else {
    assert.equal(manifests.length, 3, `${name}: needs .claude-plugin, .codex-plugin and .antigravity-plugin manifests`);
  }
  const source = `./plugins/${name}`;
  const cc = claude.find((plugin) => plugin.name === name);
  const cx = codex.find((plugin) => plugin.name === name);
  const versions = [];
  const labels = [];
  if (cc) {
    assert.equal(cc.source, source, `${name}: source must be its plugins/ folder`);
    const ccManifest = json(`${source}/.claude-plugin/plugin.json`);
    assert.equal(ccManifest.name, name);
    assert(isVersion(cc.version), `${name}: Claude registry entry has no valid version`);
    assert.equal(ccManifest.version, cc.version, `${name}: Claude manifest version differs`);
    versions.push(cc.version);
    labels.push(`${cc.version} (.claude-plugin/plugin.json)`);
  }
  if (cx) {
    assert.equal(cx.source.source, 'local');
    assert.equal(cx.source.path, source, `${name}: Codex source must be its plugins/ folder`);
    const cxManifest = json(`${source}/.codex-plugin/plugin.json`);
    assert.equal(cxManifest.name, name);
    assert.equal(cxManifest.skills, './skills/');
    assert(isVersion(cx.version), `${name}: Codex registry entry has no valid version`);
    assert.equal(cx.version, cxManifest.version, `${name}: Codex registry version differs from its manifest`);
    versions.push(cxManifest.version);
    labels.push(`${cxManifest.version} (.codex-plugin/plugin.json)`);
  }
  if (agyPlugins.includes(name)) {
    const agyManifest = json(`${source}/.antigravity-plugin/plugin.json`);
    assert.equal(agyManifest.name, name, `${name}: .antigravity-plugin/plugin.json name differs from its folder`);
    for (const field of ['description', 'license']) {
      assert(typeof agyManifest[field] === 'string' && agyManifest[field].trim(), `${name}: .antigravity-plugin/plugin.json has no ${field}`);
    }
    assert(isVersion(agyManifest.version), `${name}: .antigravity-plugin/plugin.json has no valid version`);
    versions.push(agyManifest.version);
    labels.push(`${agyManifest.version} (.antigravity-plugin/plugin.json)`);
  }
  assert(versions.length && new Set(versions).size === 1, `${name}: manifest versions differ or are missing: ${labels.join(', ')}`);
  const skillRoot = resolve(root, source, 'skills');
  for (const skill of readdirSync(skillRoot, { withFileTypes: true }).filter((file) => file.isDirectory())) {
    const skillPath = resolve(skillRoot, skill.name);
    const content = readFileSync(resolve(skillPath, 'SKILL.md'), 'utf8');
    assert(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/.test(content), `${skill.name}: SKILL.md has no frontmatter (a first line --- and a closing ---)`);
    assert.match(content, new RegExp(`^---\\r?\\nname: ${skill.name}\\r?\\n`));
    assert.match(content, /\ndescription:\s*\S+/);
    const referencePath = resolve(skillPath, 'references');
    const hostFile = resolve(skillPath, 'host.md');
    const resources = [
      ...(existsSync(hostFile) ? [readFileSync(hostFile, 'utf8')] : []),
      ...(existsSync(referencePath)
        ? readdirSync(referencePath).filter((name) => name.endsWith('.md'))
          .map((name) => readFileSync(resolve(referencePath, name), 'utf8'))
        : []),
    ].join('\n');
    // Paths under another folder (`<other-skill-dir>/scripts/x.py`) belong to that folder, not this skill.
    for (const [, dir, file] of `${content}\n${resources}`.matchAll(/(?<![\w/>.-])(references|scripts)\/([\w.-]+\.\w+)\b/g)) {
      assert(existsSync(resolve(skillPath, dir, file)), `${skill.name}: missing ${dir}/${file}`);
    }
  }
}

// Group members by text; a strictly largest group is the reference and every member outside it is named.
// With no strictly largest group, every member is named.
const odd = (members, textOf) => {
  if (members.length < 2) return [];
  const groups = new Map();
  for (const member of members) {
    const text = textOf(member);
    const list = groups.get(text) ?? [];
    list.push(member);
    groups.set(text, list);
  }
  if (groups.size === 1) return [];
  const sorted = [...groups.values()].sort((a, b) => b.length - a.length);
  if (sorted[0].length > sorted[1].length) return sorted.slice(1).flat();
  return [...members];
};
const readOrNull = (path) => (existsSync(resolve(root, path)) ? read(path) : null);

// Within each workflow kind, SKILL.md below frontmatter and every frontmatter line other than name and description match.
const skillParts = (name) => {
  const text = read(`plugins/${name}/skills/${name}/SKILL.md`);
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  assert(match, `${name}: SKILL.md has no frontmatter (a first line --- and a closing ---)`);
  const other = [];
  let skip = false;
  for (const line of match[1].split(/\r?\n/)) {
    if (/^(name|description):/.test(line)) { skip = true; continue; }
    if (skip && (/^[ \t]/.test(line) || line === '')) continue;
    skip = false;
    other.push(line);
  }
  return `${other.join('\n')}\n---\n${match[2]}`;
};
for (const [kind, list] of Object.entries(kinds)) {
  const present = list.filter((name) => folders.includes(name));
  const normalized = new Map(present.map((name) => [name, skillParts(name)]));
  const bad = odd(present, (name) => normalized.get(name));
  assert.equal(bad.length, 0, bad.map((name) => `${kind} kind: SKILL.md of ${name} differs below the name and description; edit every copy (${present.join(', ')})`).join('\n'));
}

// Workflows ship identical notices and reference files (new workflows across both kinds, old workflows among themselves).
const checkShared = (members) => {
  if (members.length < 2) return;
  const noticeText = (name) => readOrNull(`plugins/${name}/skills/${name}/THIRD_PARTY_NOTICES.md`);
  const badNotices = odd(members, noticeText);
  assert.equal(badNotices.length, 0, badNotices.map((name) => (
    noticeText(name) === null
      ? `workflows: THIRD_PARTY_NOTICES.md is missing in ${name}`
      : `workflows: THIRD_PARTY_NOTICES.md of ${name} differs`
  )).join('\n'));
  const refNames = [...new Set(members.flatMap((name) => {
    const dir = resolve(root, `plugins/${name}/skills/${name}/references`);
    return existsSync(dir) ? readdirSync(dir) : [];
  }))].sort();
  for (const file of refNames) {
    const textOf = (name) => readOrNull(`plugins/${name}/skills/${name}/references/${file}`);
    const bad = odd(members, textOf);
    assert.equal(bad.length, 0, bad.map((name) => (
      textOf(name) === null
        ? `workflows: references/${file} is missing in ${name}`
        : `workflows: references/${file} of ${name} differs; edit every copy (${members.join(', ')})`
    )).join('\n'));
  }
};
const presentNew = newWorkflows.filter((name) => folders.includes(name));
const presentOld = oldWorkflows.filter((name) => folders.includes(name));
const presentWorkflows = [...presentOld, ...presentNew];
checkShared(presentNew);
checkShared(presentOld);

// Each new workflow names its leader host in skills/<name>/host.md (outside references/).
for (const name of presentNew) {
  const hostPath = `plugins/${name}/skills/${name}/host.md`;
  assert(existsSync(resolve(root, hostPath)), `${name}: host.md is missing; a workflow names its host in skills/${name}/host.md`);
  const expected = `# Host: ${hostTitle[leaderOf(name)]}`;
  const firstLine = read(hostPath).split(/\r?\n/)[0];
  assert.equal(firstLine, expected, `${name}: host.md must start with "${expected}"`);
}

// mstack-plan writes plans in the format the workflows read, so plan-format.md ships identically in mstack-plan and every workflow.
// The review rules live only in mstack-receive-review, which all load.
for (const name of presentWorkflows) {
  const path = (n) => `plugins/${n}/skills/${n}/references/plan-format.md`;
  assert(existsSync(resolve(root, path(name))), `${name}: references/plan-format.md is missing; copy mstack-plan's`);
  assert.equal(read(path(name)), read(path('mstack-plan')), `plan-format.md differs between mstack-plan and ${name}; edit every copy`);
}

// The skills that read code ship the same codegraph steps; each install copies only its own folder.
for (const name of ['mstack-write-specs', 'mstack-diagnose', 'mstack-backlog-triage', ...presentWorkflows]) {
  const path = (n) => `plugins/${n}/skills/${n}/references/codegraph.md`;
  assert(existsSync(resolve(root, path(name))), `${name}: references/codegraph.md is missing; copy mstack-plan's`);
  assert.equal(read(path(name)), read(path('mstack-plan')), `${name}: references/codegraph.md differs from mstack-plan's copy`);
}

// The product documents have one format file: mstack-product-plan, mstack-epic, mstack-evidence and mstack-decisions each
// write one kind of document in it, and mstack-write-specs reads them.
// mstack-product-plan and mstack-epic also share their interview and review rules. Each install copies only its own folder, so the copies must match.
for (const [file, names] of [
  ['product-format.md', ['mstack-epic', 'mstack-write-specs', 'mstack-evidence', 'mstack-decisions']],
  ['product-interview.md', ['mstack-epic']],
  ['product-review.md', ['mstack-epic']],
]) {
  const path = (n) => `plugins/${n}/skills/${n}/references/${file}`;
  for (const name of names) {
    assert(existsSync(resolve(root, path(name))), `${name}: references/${file} is missing; copy mstack-product-plan's`);
    assert.equal(read(path(name)), read(path('mstack-product-plan')), `${file} differs between mstack-product-plan and ${name}; edit every copy`);
  }
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

// Every workflow that carries a fixture plan folder must pass the plan linter (and mstack-claude-pm-codex-dev's evals require it).
for (const name of presentWorkflows) {
  const fixturePlan = resolve(root, `plugins/${name}/skills/${name}/evals/_fixture/plan`);
  if (!existsSync(fixturePlan)) {
    assert.notEqual(name, 'mstack-claude-pm-codex-dev', `${name}: evals/_fixture/plan is missing`);
    continue;
  }
  const fixtureLint = spawnSync(process.execPath, [resolve(planSkill, 'scripts/check-plan.mjs'), fixturePlan], { encoding: 'utf8' });
  assert.equal(fixtureLint.status, 0, `${name}: check-plan.mjs rejects evals/_fixture/plan:\n${fixtureLint.stdout}${fixtureLint.stderr}`);
}
// mstack-auto routes a prompt to the fitting skill from its own table, so the table has one row per plugin:
// a skill added without a row would never be chosen, and a row for a removed skill would route to nothing.
const routing = 'plugins/mstack-auto/skills/mstack-auto/SKILL.md';
const table = `\n${read(routing)}`.split(/\n## Routing table[ \t]*\r?\n/)[1]?.split(/\n## /)[0];
assert(table, `${routing}: no "## Routing table" section; mstack-auto's routing table must sit under that heading`);
const rows = table.split('\n').map((line) => line.trim()).filter((line) => line.startsWith('|'));
assert.equal(rows[0]?.split('|')[2]?.trim(), 'Skill', `${routing}: the second column of mstack-auto's routing table must be headed "Skill"`);
const routed = rows.slice(2).map((row) => {
  const skills = row.split('|')[2].match(/`[^`]+`/g) ?? [];
  assert.equal(skills.length, 1, `mstack-auto's routing table: the Skill cell must hold exactly one name in backticks: ${row}`);
  return skills[0].slice(1, -1);
});
assert(routed.length, `${routing}: mstack-auto's routing table has no rows`);
assert.equal(new Set(routed).size, routed.length, `mstack-auto's routing table names a skill twice: ${routed.sort().join(', ')}`);
const routable = [...new Set([...names(claude), ...names(codex), ...agyPlugins])].filter((name) => name !== 'mstack-auto');
for (const name of routable) {
  assert(routed.includes(name), `${name}: no row in mstack-auto's routing table (${routing})`);
}
for (const name of routed) {
  assert(routable.includes(name), `${name}: mstack-auto's routing table has a row for a skill no registry has`);
}

// Antigravity loads only the first 24,000 bytes of a skill's body (the text after its frontmatter); `agy plugin validate` only warns.
const bodyLimit = 24000;
for (const name of agyPlugins) {
  const skillsDir = resolve(root, 'plugins', name, 'skills');
  for (const skill of readdirSync(skillsDir, { withFileTypes: true }).filter((file) => statSync(resolve(skillsDir, file.name)).isDirectory())) { // statSync follows a linked folder
    const path = `plugins/${name}/skills/${skill.name}/SKILL.md`;
    const text = read(path);
    const size = Buffer.byteLength(text.slice(text.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/)?.[0].length ?? 0));
    assert(size <= bodyLimit, `${path}: the body is ${size} bytes; Antigravity loads only the first ${bodyLimit}`);
  }
}

// An agent's `tools` must be a YAML list (Antigravity's validator rejects the one-line string form), and the
// mstack-research readers keep search and reading tools only, so a tool added to one is caught here.
// An agent is agents/<name>.md or agents/<name>/agent.md.
const pinned = {
  'plugins/mstack-research/agents/reader.md': ['Glob', 'Grep', 'Read', 'WebFetch', 'WebSearch'],
  'plugins/mstack-research/agents/antigravity-reader/agent.md': ['read_file', 'search_web'],
};
const agentFiles = new Set(Object.keys(pinned));
// The block-list syntax is Antigravity's rule, so only a plugin with an Antigravity manifest has its agent files read; the pinned readers always are.
for (const name of agyPlugins) {
  const dir = resolve(root, 'plugins', name, 'agents');
  if (!existsSync(dir)) continue;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = entry.isDirectory() ? `${entry.name}/agent.md` : entry.name.endsWith('.md') ? entry.name : null;
    if (file && existsSync(resolve(dir, file))) agentFiles.add(`plugins/${name}/agents/${file}`);
  }
}
for (const path of agentFiles) {
  const allowed = pinned[path];
  assert(!allowed || existsSync(resolve(root, path)), `${path}: the file is missing; the reader must exist with its pinned tools`);
  const lines = read(path).match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1].split(/\r?\n/) ?? [];
  const keyLine = /^(["']?)tools\1:(.*)$/;
  const at = lines.findIndex((line) => keyLine.test(line));
  assert(at >= 0 || !allowed, `${path}: no tools key; the reader's tools must be listed`);
  if (at < 0) continue;
  assert(!lines[at].match(keyLine)[2].trim(), `${path}: tools must be a YAML list (a "tools:" line, then "  - <name>" lines), not a one-line string`);
  // The list runs to the next key: blank and comment lines inside it do not end it, and any other line that is not an entry fails.
  const tools = [];
  for (const line of lines.slice(at + 1)) {
    if (!line.trim() || /^\s*#/.test(line)) continue;
    const item = line.match(/^\s*-\s+(.*?)\s*(?:\s#.*)?$/);
    if (item) { tools.push(item[1].replace(/^(['"])(.*)\1$/, '$2')); continue; }
    if (/^["']?[\w-]+["']?:/.test(line)) break;
    assert.fail(`${path}: tools must hold list entries only, but a line reads "${line}"`);
  }
  assert(tools.length, `${path}: tools must be a YAML list (a "tools:" line, then "  - <name>" lines), not a one-line string`);
  if (allowed) {
    for (const tool of tools.filter((tool) => !allowed.includes(tool))) assert.fail(`${path}: tool ${tool} is not allowed; the reader has search and reading tools only`);
    for (const tool of allowed.filter((tool) => !tools.includes(tool))) assert.fail(`${path}: tool ${tool} is missing from the reader's tools`);
  }
}

// Antigravity's own validator, where it is installed. Version 1.5.15 exits non-zero on an error and 0 on a notice such as a missing logo.
// "Not found" means no file named agy in a PATH folder; an agy that exists but cannot start fails the check.
// shortcut: a Windows agy.exe or agy.cmd is not looked for, add the PATHEXT names when the checks run there.
const agyFound = (process.env.PATH ?? '').split(delimiter).some((dir) => dir && existsSync(join(dir, 'agy')));
let validated = agyFound ? 0 : -1;
if (!agyFound) console.log('Antigravity validator step skipped: agy was not found on PATH');
for (const name of agyFound ? agyPlugins : []) {
  const run = spawnSync('agy', ['plugin', 'validate', resolve(root, 'plugins', name)], { encoding: 'utf8' });
  assert(!run.error && run.status === 0, `${name}: agy plugin validate failed:\n${run.stdout}${run.stderr}${run.error ?? ''}`);
  validated++;
}
if (validated >= 0) console.log(`Antigravity validator passed: ${validated} plugins`);

console.log(`Marketplace checks passed: ${claude.length} Claude plugins, ${codex.length} Codex plugins, ${agyPlugins.length} Antigravity plugins`);
