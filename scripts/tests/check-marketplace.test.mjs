import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, cpSync, existsSync, mkdtempSync, symlinkSync, readFileSync, readdirSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const repo = fileURLToPath(new URL('../../', import.meta.url));
const script = join(repo, 'scripts/check-marketplace.mjs');
const temps = [];
const temp = (prefix) => { const dir = mkdtempSync(join(tmpdir(), prefix)); temps.push(dir); return dir; };
after(() => { for (const dir of temps) rmSync(dir, { recursive: true, force: true }); });

// Output of `agy plugin validate` 1.5.15 on a copy of a plugin, recorded 2026-11-23 (the folder path is shortened).
const logo = `Validating plugin (plugin/.antigravity-plugin/plugin.json)

  · .antigravity-plugin/plugin.json: no logo: the plugin shows a generic icon. Add "logo": "assets/logo.svg" (a .png, .svg, .jpg, .jpeg or .webp file inside the plugin)

  skills 1 · agents 0 · rules 0 · hooks 0 · mcpServers 0 · sidecars 0

✔ Validation passed
`;
const broken = `Validating plugin (plugin/.antigravity-plugin/plugin.json)

  ✗ agents/reader.md: the frontmatter isn't valid YAML: failed to unmarshal frontmatter YAML: yaml: unmarshal errors:
  line 3: cannot unmarshal !!str \`WebSear...\` into []string. The loader skips this agent
  · .antigravity-plugin/plugin.json: no logo: the plugin shows a generic icon. Add "logo": "assets/logo.svg" (a .png, .svg, .jpg, .jpeg or .webp file inside the plugin)

  skills 1 · agents 0 · rules 0 · hooks 0 · mcpServers 0 · sidecars 0

Error: validation failed: 1 error, 0 warnings
`;

const readJson = (root, path) => JSON.parse(readFileSync(join(root, path), 'utf8'));
const writeJson = (root, path, value) => writeFileSync(join(root, path), `${JSON.stringify(value, null, 2)}\n`);
const editAntigravity = (root, name, change) => {
  const path = `plugins/${name}/.antigravity-plugin/plugin.json`;
  const manifest = readJson(root, path);
  change(manifest);
  writeJson(root, path, manifest);
};

// A copy of the repository files the check reads, shipped Antigravity manifests included.
const tree = () => {
  const root = temp('mstack-check-');
  for (const entry of ['plugins', '.claude-plugin', '.agents', 'LICENSE', 'skills.sh.json']) cpSync(join(repo, entry), join(root, entry), { recursive: true });
  return root;
};
const covered = (root) => readdirSync(join(root, 'plugins')).filter((name) => existsSync(join(root, `plugins/${name}/.antigravity-plugin/plugin.json`)));

// `absent`: a PATH with node and git only. `ok` and `error`: a stand-in agy first on PATH that logs its arguments.
const run = (root, { agy = 'absent', agyScript, hosts } = {}) => {
  // A folder of links to node and git only, so a real agy next to them is not on the PATH.
  const bin = temp('mstack-bin-');
  symlinkSync(process.execPath, join(bin, 'node'));
  symlinkSync(spawnSync('which', ['git'], { encoding: 'utf8' }).stdout.trim(), join(bin, 'git'));
  let log;
  let path = bin;
  if (agy !== 'absent') {
    const dir = temp('mstack-agy-');
    log = join(dir, 'log');
    writeFileSync(join(dir, 'logo.txt'), logo);
    writeFileSync(join(dir, 'broken.txt'), broken);
    writeFileSync(join(dir, 'agy'), `#!/bin/sh
PATH=/usr/bin:/bin
echo "$@" >> '${log}'
for last; do :; done
case "$last" in
  *mstack-research) if [ '${agy}' = error ]; then cat '${join(dir, 'broken.txt')}'; exit 1; fi ;;
esac
cat '${join(dir, 'logo.txt')}'
`);
    chmodSync(join(dir, 'agy'), 0o755);
    if (agyScript) writeFileSync(join(dir, 'agy'), agyScript);
    path = `${dir}:${path}`;
  }
  const result = spawnSync(process.execPath, [script], { encoding: 'utf8', env: { PATH: path, MSTACK_CHECK_ROOT: root, ...(hosts && { MSTACK_CHECK_HOSTS: JSON.stringify(hosts) }) } });
  return { ...result, root, log: log && existsSync(log) ? readFileSync(log, 'utf8') : '' };
};
const fails = (result, ...words) => {
  assert.notEqual(result.status, 0, result.stdout);
  for (const word of words) assert(result.stderr.includes(word), `stderr lacks ${word}:\n${result.stderr}`);
  assert(!result.stdout.includes('Marketplace checks passed'));
};

test('versions agree', () => {
  const result = run(tree());
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Marketplace checks passed: \d+ Claude plugins, \d+ Codex plugins, 22 Antigravity plugins/);
});

test('agy absent', () => {
  const result = run(tree());
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.split('\n').filter((line) => line === 'Antigravity validator step skipped: agy was not found on PATH').length, 1);
  assert.equal(result.log, '');
});

test('version differs', () => {
  const root = tree();
  editAntigravity(root, 'mstack-diagnose', (m) => { m.version = '9.9.9'; });
  fails(run(root), 'mstack-diagnose', '.antigravity-plugin/plugin.json');
});

test('manifest deleted', () => {
  const root = tree();
  rmSync(join(root, 'plugins/mstack-diagnose/.antigravity-plugin'), { recursive: true });
  fails(run(root), 'mstack-diagnose');
});

test('manifest corrupt', () => {
  const root = tree();
  writeFileSync(join(root, 'plugins/mstack-diagnose/.antigravity-plugin/plugin.json'), '{');
  fails(run(root));
});

test('covered plugin with one manifest', () => {
  const root = tree();
  const name = 'mstack-diagnose';
  rmSync(join(root, `plugins/${name}/.antigravity-plugin`), { recursive: true });
  rmSync(join(root, `plugins/${name}/.codex-plugin`), { recursive: true });
  const registry = '.agents/plugins/marketplace.json';
  const codex = readJson(root, registry);
  codex.plugins = codex.plugins.filter((plugin) => plugin.name !== name);
  writeJson(root, registry, codex);
  fails(run(root), name);
});

test('single-host plugin with a second manifest', () => {
  const root = tree();
  const name = 'mstack-claude-review-workflow';
  const codex = readJson(root, `plugins/${name}/.codex-plugin/plugin.json`);
  mkdirSync(join(root, `plugins/${name}/.antigravity-plugin`));
  writeJson(root, `plugins/${name}/.antigravity-plugin/plugin.json`, { name, version: codex.version, description: 'x', license: 'Apache-2.0' });
  fails(run(root), name, 'single-host');
});

test('single-host plugin on the wrong host', () => {
  const root = tree();
  const name = 'mstack-claude-review-workflow';
  const codex = readJson(root, `plugins/${name}/.codex-plugin/plugin.json`);
  rmSync(join(root, `plugins/${name}/.codex-plugin`), { recursive: true });
  mkdirSync(join(root, `plugins/${name}/.antigravity-plugin`));
  writeJson(root, `plugins/${name}/.antigravity-plugin/plugin.json`, { name, version: codex.version, description: 'x', license: 'Apache-2.0' });
  const registry = '.agents/plugins/marketplace.json';
  const catalog = readJson(root, registry);
  catalog.plugins = catalog.plugins.filter((plugin) => plugin.name !== name);
  writeJson(root, registry, catalog);
  fails(run(root), name, 'single-host');
});

test('covered plugin left with only an Antigravity manifest', () => {
  const root = tree();
  const name = 'mstack-diagnose';
  for (const host of ['claude', 'codex']) rmSync(join(root, `plugins/${name}/.${host}-plugin`), { recursive: true });
  for (const registry of ['.claude-plugin/marketplace.json', '.agents/plugins/marketplace.json']) {
    const catalog = readJson(root, registry);
    catalog.plugins = catalog.plugins.filter((plugin) => plugin.name !== name);
    writeJson(root, registry, catalog);
  }
  fails(run(root), name);
});

test('agy that cannot start', () => {
  const result = run(tree(), { agy: 'ok', agyScript: '#!/nonexistent/interpreter\n' });
  fails(result, 'agy plugin validate failed');
  assert(!result.stdout.includes('skipped'));
});

test('a plugin assigned to one host keeps its own checks', () => {
  const root = tree();
  const name = 'mstack-claude-review-workflow';
  assert(!existsSync(join(root, `plugins/${name}/.antigravity-plugin`)));
  const first = run(root);
  assert.equal(first.status, 0, first.stderr);
  const path = `plugins/${name}/.codex-plugin/plugin.json`;
  const manifest = readJson(root, path);
  manifest.name = 'other';
  writeJson(root, path, manifest);
  const second = run(root);
  fails(second);
  assert(!/Antigravity manifest|\.antigravity-plugin/.test(second.stderr.split('\n').filter((line) => line.includes(name)).join('\n')));
  assert(second.stderr.includes(name) || second.stderr.includes('other'), second.stderr);
});

for (const [title, change] of [
  ['name differs', (m) => { m.name = 'other'; }],
  ['description missing', (m) => { delete m.description; }],
  ['license missing', (m) => { delete m.license; }],
]) {
  test(title, () => {
    const root = tree();
    editAntigravity(root, 'mstack-diagnose', change);
    fails(run(root), 'mstack-diagnose');
  });
}

test('validator error', () => {
  const result = run(tree(), { agy: 'error' });
  fails(result, 'mstack-research', 'frontmatter isn\'t valid YAML');
});

test('no logo', () => {
  const result = run(tree(), { agy: 'ok' });
  assert.equal(result.status, 0, result.stderr + result.stdout);
  assert.match(result.stdout, /Antigravity validator passed: 22 plugins/);
});

test('validator runs per plugin', () => {
  const result = run(tree(), { agy: 'ok' });
  const root = result.root;
  const expected = covered(root).map((name) => `plugin validate ${join(root, 'plugins', name)}`).sort();
  assert.equal(expected.length, 22);
  assert.deepEqual(result.log.split('\n').filter((line) => line.startsWith('plugin validate ')).sort(), expected);
});

// A plugin for Antigravity only: one manifest, one skill, the root LICENSE and a notices file.
const agyOnly = (root, row) => {
  const name = 'mstack-agy-only';
  const skill = `plugins/${name}/skills/${name}`;
  mkdirSync(join(root, skill), { recursive: true });
  mkdirSync(join(root, `plugins/${name}/.antigravity-plugin`));
  writeJson(root, `plugins/${name}/.antigravity-plugin/plugin.json`, { name, version: '0.1.0', description: 'Test only.', license: 'Apache-2.0' });
  writeFileSync(join(root, skill, 'SKILL.md'), `---\nname: ${name}\ndescription: Test only.\n---\nBody\n`);
  writeFileSync(join(root, skill, 'LICENSE'), readFileSync(join(root, 'LICENSE')));
  writeFileSync(join(root, skill, 'THIRD_PARTY_NOTICES.md'), 'None.\n');
  if (row) {
    const path = join(root, 'plugins/mstack-auto/skills/mstack-auto/SKILL.md');
    const lines = readFileSync(path, 'utf8').split('\n');
    const at = lines.findIndex((line) => line.startsWith('|') && line.includes('`mstack-setup`'));
    lines.splice(at + 1, 0, `| Test only | \`${name}\` | Antigravity only | | |`);
    writeFileSync(path, lines.join('\n'));
  }
};

test('routing row', () => {
  const root = tree();
  agyOnly(root, true);
  const result = run(root, { hosts: { 'mstack-agy-only': 'antigravity' } });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /23 Antigravity plugins/);
});

test('routing row missing', () => {
  const root = tree();
  agyOnly(root, false);
  fails(run(root, { hosts: { 'mstack-agy-only': 'antigravity' } }), 'mstack-agy-only');
});

// The reader agent of mstack-research is restricted to search and reading tools, written as a YAML list.
const setTools = (root, tools) => {
  const path = join(root, 'plugins/mstack-research/agents/reader.md');
  const text = readFileSync(path, 'utf8').replace(/^tools:[^\n]*\n(  - [^\n]*\n)*/m, tools);
  writeFileSync(path, text);
};
const readerList = ['WebSearch', 'WebFetch', 'Read', 'Grep', 'Glob'];
const asList = (names) => `tools:\n${names.map((tool) => `  - ${tool}\n`).join('')}`;

test('reader with an extra tool', () => {
  const root = tree();
  setTools(root, asList([...readerList, 'Write']));
  fails(run(root), 'reader.md', 'Write');
});

test('reader with a missing tool', () => {
  const root = tree();
  setTools(root, asList(readerList.slice(1)));
  fails(run(root), 'reader.md', 'WebSearch');
});

test('reader with tools as a one-line string', () => {
  const root = tree();
  setTools(root, `tools: ${readerList.join(', ')}\n`);
  fails(run(root), 'reader.md', 'YAML list');
});

test('reader with the right list', () => {
  const root = tree();
  setTools(root, asList([...readerList].reverse()));
  const result = run(root);
  assert.equal(result.status, 0, result.stderr);
});
