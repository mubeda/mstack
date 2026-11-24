import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { renameSync, chmodSync, cpSync, existsSync, mkdtempSync, symlinkSync, readFileSync, readdirSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
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

const reviewWorkflows = ['mstack-claude-led-review', 'mstack-codex-led-review', 'mstack-antigravity-led-review'];
const devWorkflows = ['mstack-claude-led-dev', 'mstack-codex-led-dev', 'mstack-antigravity-led-dev'];
const newWorkflows = [...reviewWorkflows, ...devWorkflows];
const hostTitle = { claude: 'Claude Code', codex: 'Codex', antigravity: 'Antigravity' };
const leaderOf = (name) => name.split('-')[1];
const reviewBody = '# Review workflow\n\nFollow the shared review workflow steps.\n';
const devBody = '# Dev workflow\n\nFollow the shared dev workflow steps.\n';
const edit = (root, rel, fn) => {
  const path = join(root, rel);
  writeFileSync(path, fn(readFileSync(path, 'utf8')));
};

// A copy of the repository files the check reads, shipped Antigravity manifests included.
// Strips any real new workflows so every test starts from a tree whose only workflows are the old three.
const tree = () => {
  const root = temp('mstack-check-');
  for (const entry of ['plugins', '.claude-plugin', '.agents', 'LICENSE', 'skills.sh.json']) cpSync(join(repo, entry), join(root, entry), { recursive: true });
  for (const name of newWorkflows) rmSync(join(root, 'plugins', name), { recursive: true, force: true });
  for (const registry of ['.claude-plugin/marketplace.json', '.agents/plugins/marketplace.json']) {
    const catalog = readJson(root, registry);
    catalog.plugins = catalog.plugins.filter((plugin) => !newWorkflows.includes(plugin.name));
    writeJson(root, registry, catalog);
  }
  edit(root, 'plugins/mstack-auto/skills/mstack-auto/SKILL.md', (text) => text.split('\n')
    .filter((line) => !(line.startsWith('|') && newWorkflows.some((name) => (line.split('|')[2] ?? '').includes(`\`${name}\``))))
    .join('\n'));
  return root;
};
const covered = (root) => readdirSync(join(root, 'plugins')).filter((name) => existsSync(join(root, `plugins/${name}/.antigravity-plugin/plugin.json`)));

const addWorkflow = (root, name) => {
  const isDev = name.endsWith('-dev');
  const leader = leaderOf(name);
  const host = hostTitle[leader];
  const sourceName = isDev ? 'mstack-claude-pm-codex-dev' : 'mstack-codex-review-workflow';
  const srcSkill = `plugins/${sourceName}/skills/${sourceName}`;
  const dstSkill = `plugins/${name}/skills/${name}`;
  const body = isDev ? devBody : reviewBody;
  mkdirSync(join(root, dstSkill), { recursive: true });
  writeFileSync(join(root, dstSkill, 'SKILL.md'), `---\nname: ${name}\ndescription: Use when testing. Runs in ${host} only.\n---\n${body}`);
  cpSync(join(root, srcSkill, 'LICENSE'), join(root, dstSkill, 'LICENSE'));
  cpSync(join(root, srcSkill, 'THIRD_PARTY_NOTICES.md'), join(root, dstSkill, 'THIRD_PARTY_NOTICES.md'));
  cpSync(join(root, srcSkill, 'references'), join(root, dstSkill, 'references'), { recursive: true });
  if (isDev) cpSync(join(root, srcSkill, 'evals/_fixture/plan'), join(root, dstSkill, 'evals/_fixture/plan'), { recursive: true });
  writeFileSync(join(root, dstSkill, 'host.md'), `# Host: ${host}\n`);

  const srcManifest = readJson(root, `plugins/${sourceName}/.claude-plugin/plugin.json`);
  const manifest = {
    name,
    version: '0.1.0',
    description: srcManifest.description,
    license: srcManifest.license,
    author: srcManifest.author,
    ...(leader === 'codex' && { skills: './skills/' }),
  };
  mkdirSync(join(root, `plugins/${name}/.${leader}-plugin`), { recursive: true });
  writeJson(root, `plugins/${name}/.${leader}-plugin/plugin.json`, manifest);

  let entry;
  if (leader === 'claude') {
    const catalog = readJson(root, '.claude-plugin/marketplace.json');
    const proto = catalog.plugins.find((p) => p.name === 'mstack-codex-review-workflow');
    entry = { ...proto, name, version: '0.1.0', source: `./plugins/${name}` };
    catalog.plugins.push(entry);
    writeJson(root, '.claude-plugin/marketplace.json', catalog);
    assert.equal(typeof entry.source, 'string');
    assert.equal(entry.source, `./plugins/${name}`);
  } else if (leader === 'codex') {
    const catalog = readJson(root, '.agents/plugins/marketplace.json');
    const proto = catalog.plugins.find((p) => p.name === 'mstack-claude-review-workflow');
    entry = { ...proto, name, version: '0.1.0', source: { source: 'local', path: `./plugins/${name}` } };
    catalog.plugins.push(entry);
    writeJson(root, '.agents/plugins/marketplace.json', catalog);
    assert.equal(entry.source?.source, 'local');
    assert.equal(entry.source?.path, `./plugins/${name}`);
  }
  if (entry) {
    assert.equal(manifest.name, entry.name);
    assert.equal(manifest.version, entry.version);
  }
  assert(Buffer.byteLength(body) <= 24000, `${name}: fixture SKILL.md body exceeds 24000 bytes`);
  for (const registry of ['.claude-plugin/marketplace.json', '.agents/plugins/marketplace.json']) {
    const names = readJson(root, registry).plugins.map((p) => p.name);
    assert.equal(new Set(names).size, names.length, `${registry}: duplicate plugin names in fixture`);
  }

  edit(root, 'plugins/mstack-auto/skills/mstack-auto/SKILL.md', (text) => {
    const lines = text.split('\n');
    const at = lines.findIndex((line) => line.startsWith('|') && line.includes('`mstack-setup`'));
    assert(at >= 0, 'mstack-setup row not found in routing table');
    lines.splice(at + 1, 0, `| Test only | \`${name}\` | ${host} only | | |`);
    return lines.join('\n');
  });
  return root;
};
const six = (root) => { for (const name of newWorkflows) addWorkflow(root, name); return root; };

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
  const root = tree();
  const count = covered(root).length;
  const result = run(root);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, new RegExp(`Marketplace checks passed: \\d+ Claude plugins, \\d+ Codex plugins, ${count} Antigravity plugins`));
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
  const root = tree();
  const count = covered(root).length;
  const result = run(root, { agy: 'ok' });
  assert.equal(result.status, 0, result.stderr + result.stdout);
  assert.match(result.stdout, new RegExp(`Antigravity validator passed: ${count} plugins`));
});

test('validator runs per plugin', () => {
  const result = run(tree(), { agy: 'ok' });
  const root = result.root;
  const expected = covered(root).map((name) => `plugin validate ${join(root, 'plugins', name)}`).sort();
  assert(expected.length > 0);
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
  const before = covered(root).length;
  agyOnly(root, true);
  const result = run(root, { hosts: { 'mstack-agy-only': 'antigravity' } });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, new RegExp(`${before + 1} Antigravity plugins`));
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

// Small trees for the Antigravity reader tests: links to the real files, except mstack-research's agents folder, which is a copy.
const lightTree = (...whole) => {
  const root = temp('mstack-light-');
  mkdirSync(join(root, 'plugins'));
  for (const entry of ['.claude-plugin', '.agents', 'LICENSE', 'skills.sh.json']) symlinkSync(join(repo, entry), join(root, entry));
  for (const name of readdirSync(join(repo, 'plugins'))) {
    mkdirSync(join(root, 'plugins', name));
    for (const child of readdirSync(join(repo, 'plugins', name), { withFileTypes: true })) {
      if (whole.includes(name)) cpSync(join(repo, 'plugins', name, child.name), join(root, 'plugins', name, child.name), { recursive: true });
      else if (name === 'mstack-research' && child.name === 'agents') cpSync(join(repo, 'plugins', name, 'agents'), join(root, 'plugins', name, 'agents'), { recursive: true });
      else symlinkSync(join(repo, 'plugins', name, child.name), join(root, 'plugins', name, child.name));
    }
  }
  return root;
};
const setAgyTools = (root, tools) => {
  const path = join(root, 'plugins/mstack-research/agents/antigravity-reader/agent.md');
  writeFileSync(path, readFileSync(path, 'utf8').replace(/^tools:[^\n]*\n(  - [^\n]*\n)*/m, tools));
};
const agyReaderList = ['search_web', 'read_file'];

test('antigravity reader with an extra tool', () => {
  const root = lightTree();
  setAgyTools(root, asList([...agyReaderList, 'run_command']));
  fails(run(root), 'antigravity-reader/agent.md', 'run_command');
});

test('antigravity reader with a missing tool', () => {
  const root = lightTree();
  setAgyTools(root, asList(['search_web']));
  fails(run(root), 'antigravity-reader/agent.md', 'read_file');
});

test('antigravity reader with tools as a one-line string', () => {
  const root = lightTree();
  setAgyTools(root, `tools: ${agyReaderList.join(', ')}\n`);
  fails(run(root), 'antigravity-reader/agent.md', 'YAML list');
});

test('antigravity reader with the right list', () => {
  const root = lightTree();
  setAgyTools(root, asList([...agyReaderList].reverse()));
  const result = run(root);
  assert.equal(result.status, 0, result.stderr);
});

// Both pinned readers: the whole list under `tools:` counts, and the file has to exist with a tools key.
for (const [label, file, key, good, extra] of [
  ['reader', 'plugins/mstack-research/agents/reader.md', 'reader.md', readerList, 'Write'],
  ['antigravity reader', 'plugins/mstack-research/agents/antigravity-reader/agent.md', 'antigravity-reader/agent.md', agyReaderList, 'write_file'],
]) {
  const withTools = (root, body) => {
    const path = join(root, file);
    writeFileSync(path, readFileSync(path, 'utf8').replace(/^tools:[^\n]*\n((  - |\s*\n|\s*#)[^\n]*\n)*/m, body));
  };
  test(`${label}: extra tool after a blank line`, () => {
    const root = lightTree();
    withTools(root, `${asList(good)}\n  - ${extra}\n`);
    fails(run(root), key, extra);
  });
  test(`${label}: extra tool after a comment line`, () => {
    const root = lightTree();
    withTools(root, `${asList(good)}  # more\n  - ${extra}\n`);
    fails(run(root), key, extra);
  });
  test(`${label}: no tools key`, () => {
    const root = lightTree();
    withTools(root, '');
    fails(run(root), key, 'no tools key');
  });
  test(`${label}: file missing`, () => {
    const root = lightTree();
    rmSync(join(root, file));
    fails(run(root), key, 'missing');
  });
  test(`${label}: continuation line under a tool`, () => {
    const root = lightTree();
    withTools(root, `tools:\n${good.map((tool, i) => `  - ${tool}\n${i ? '' : '    suffix\n'}`).join('')}`);
    fails(run(root), key, 'suffix');
  });
  test(`${label}: quoted tools key with a scalar`, () => {
    const root = lightTree();
    withTools(root, `"tools": ${good.join(', ')}\n`);
    fails(run(root), key, 'YAML list');
  });
  test(`${label}: quoted tools key with an extra tool`, () => {
    const root = lightTree();
    withTools(root, `'tools':\n${[...good, extra].map((tool) => `  - ${tool}\n`).join('')}`);
    fails(run(root), key, extra);
  });
  test(`${label}: right list with blank and comment lines`, () => {
    const root = lightTree();
    withTools(root, `tools:\n  - ${good[0]}\n\n  # note\n${good.slice(1).map((tool) => `  - ${tool}\n`).join('')}`);
    const result = run(root);
    assert.equal(result.status, 0, result.stderr);
  });
}

// Antigravity loads only the first 24,000 bytes of a skill's body, so a plugin with an Antigravity manifest keeps every body within that.
const setBody = (root, plugin, bytes) => {
  const path = join(root, `plugins/${plugin}/skills/${plugin}/SKILL.md`);
  const text = readFileSync(path, 'utf8');
  writeFileSync(path, `${text.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/)[0]}${'a'.repeat(bytes)}`);
};

test('skill body of 24001 bytes', () => {
  const root = lightTree('mstack-handoff');
  setBody(root, 'mstack-handoff', 24001);
  fails(run(root), 'mstack-handoff/SKILL.md', '24001', '24000');
});

test('skill body of 24000 bytes', () => {
  const root = lightTree('mstack-handoff');
  setBody(root, 'mstack-handoff', 24000);
  const result = run(root);
  assert.equal(result.status, 0, result.stderr);
});

test('skill body over the limit in a plugin without an Antigravity manifest', () => {
  const root = lightTree('mstack-claude-review-workflow');
  assert(!existsSync(join(root, 'plugins/mstack-claude-review-workflow/.antigravity-plugin')));
  setBody(root, 'mstack-claude-review-workflow', 30000);
  const result = run(root);
  assert.equal(result.status, 0, result.stderr);
});

test('linked skill folder with a body of 24001 bytes', () => {
  const root = lightTree('mstack-handoff');
  const plugin = join(root, 'plugins/mstack-handoff');
  renameSync(join(plugin, 'skills/mstack-handoff'), join(plugin, 'linked-skill'));
  symlinkSync(join(plugin, 'linked-skill'), join(plugin, 'skills/mstack-handoff'));
  setBody(root, 'mstack-handoff', 24001);
  fails(run(root), 'mstack-handoff/SKILL.md', '24001');
});

// The block-list rule is Antigravity's, so it applies only to plugins that have an Antigravity manifest.
const addAgent = (root, plugin) => {
  mkdirSync(join(root, `plugins/${plugin}/agents`));
  writeFileSync(join(root, `plugins/${plugin}/agents/helper.md`), '---\nname: helper\ndescription: Test only.\ntools: Read, Grep\n---\nBody\n');
};

test('agent with comma-separated tools in a single-host plugin', () => {
  const root = lightTree('mstack-claude-review-workflow');
  addAgent(root, 'mstack-claude-review-workflow');
  const result = run(root);
  assert.equal(result.status, 0, result.stderr);
});

test('agent with comma-separated tools in a plugin with an Antigravity manifest', () => {
  const root = lightTree('mstack-handoff');
  addAgent(root, 'mstack-handoff');
  fails(run(root), 'mstack-handoff/agents/helper.md', 'YAML list');
});

test('six workflows pass', () => {
  const result = run(six(tree()));
  assert.equal(result.status, 0, result.stderr);
  assert(result.stdout.includes('Marketplace checks passed'), result.stdout);
});

test('a Codex workflow with a second manifest fails', () => {
  const root = six(tree());
  const name = 'mstack-codex-led-dev';
  mkdirSync(join(root, `plugins/${name}/.claude-plugin`), { recursive: true });
  writeJson(root, `plugins/${name}/.claude-plugin/plugin.json`, { name, version: '0.1.0', description: 'Test.', license: 'Apache-2.0' });
  const catalog = readJson(root, '.claude-plugin/marketplace.json');
  const proto = catalog.plugins.find((p) => p.name === 'mstack-codex-review-workflow');
  catalog.plugins.push({ ...proto, name, version: '0.1.0', source: `./plugins/${name}` });
  writeJson(root, '.claude-plugin/marketplace.json', catalog);
  fails(run(root), name, '.codex-plugin');
});

test("a workflow with another host's manifest instead of its own fails", () => {
  const root = tree();
  const name = 'mstack-codex-led-dev';
  addWorkflow(root, name);
  rmSync(join(root, `plugins/${name}/.codex-plugin`), { recursive: true });
  const codexCatalog = readJson(root, '.agents/plugins/marketplace.json');
  codexCatalog.plugins = codexCatalog.plugins.filter((p) => p.name !== name);
  writeJson(root, '.agents/plugins/marketplace.json', codexCatalog);
  mkdirSync(join(root, `plugins/${name}/.claude-plugin`), { recursive: true });
  writeJson(root, `plugins/${name}/.claude-plugin/plugin.json`, { name, version: '0.1.0', description: 'Test.', license: 'Apache-2.0' });
  const claudeCatalog = readJson(root, '.claude-plugin/marketplace.json');
  const proto = claudeCatalog.plugins.find((p) => p.name === 'mstack-codex-review-workflow');
  claudeCatalog.plugins.push({ ...proto, name, version: '0.1.0', source: `./plugins/${name}` });
  writeJson(root, '.claude-plugin/marketplace.json', claudeCatalog);
  fails(run(root), name, '.codex-plugin');
});

test('an Antigravity workflow passes without a registry entry', () => {
  const root = tree();
  addWorkflow(root, 'mstack-antigravity-led-review');
  const result = run(root);
  assert.equal(result.status, 0, result.stderr);
});

test('a review copy drifts and is named', () => {
  const root = six(tree());
  edit(root, 'plugins/mstack-claude-led-review/skills/mstack-claude-led-review/SKILL.md', (text) => `${text}\nDrift.\n`);
  const result = run(root);
  fails(result, 'review kind', 'mstack-claude-led-review');
  assert(!result.stderr.includes('SKILL.md of mstack-codex-led-review'), result.stderr);
  assert(!result.stderr.includes('SKILL.md of mstack-antigravity-led-review'), result.stderr);
});

test('a dev copy edited alone is named', () => {
  const root = six(tree());
  edit(root, 'plugins/mstack-antigravity-led-dev/skills/mstack-antigravity-led-dev/SKILL.md', (text) => text.replace('shared', 'changed'));
  const result = run(root);
  fails(result, 'dev kind: SKILL.md of mstack-antigravity-led-dev differs');
  assert(!result.stderr.includes('SKILL.md of mstack-claude-led-dev'), result.stderr);
  assert(!result.stderr.includes('SKILL.md of mstack-codex-led-dev'), result.stderr);
});

test('a SKILL.md without a closing frontmatter line fails', () => {
  const root = six(tree());
  edit(root, 'plugins/mstack-codex-led-review/skills/mstack-codex-led-review/SKILL.md', (text) => text.replace(/\n---\n/, '\n'));
  fails(run(root), 'mstack-codex-led-review', 'frontmatter');
});

test('a SKILL.md without an opening frontmatter line fails', () => {
  const root = six(tree());
  edit(root, 'plugins/mstack-codex-led-review/skills/mstack-codex-led-review/SKILL.md', (text) => text.replace(/^---\n/, ''));
  fails(run(root), 'mstack-codex-led-review: SKILL.md has no frontmatter');
});

test('tied workflow copies name every member', () => {
  const root = six(tree());
  edit(root, 'plugins/mstack-claude-led-review/skills/mstack-claude-led-review/SKILL.md', (text) => `${text}\nOne.\n`);
  edit(root, 'plugins/mstack-codex-led-review/skills/mstack-codex-led-review/SKILL.md', (text) => `${text}\nTwo.\n`);
  fails(
    run(root),
    'review kind: SKILL.md of mstack-claude-led-review differs',
    'review kind: SKILL.md of mstack-codex-led-review differs',
    'review kind: SKILL.md of mstack-antigravity-led-review differs',
  );
});

test('a shared reference file drifts', () => {
  const root = six(tree());
  edit(root, 'plugins/mstack-codex-led-dev/skills/mstack-codex-led-dev/references/external-facts.md', (text) => `${text}\nDrift.\n`);
  const result = run(root);
  fails(result, 'workflows: references/external-facts.md of mstack-codex-led-dev differs');
  assert(!result.stderr.includes('references/external-facts.md of mstack-claude-led-dev'), result.stderr);
});

test('a reference file missing in one workflow fails', () => {
  const root = six(tree());
  rmSync(join(root, 'plugins/mstack-codex-led-review/skills/mstack-codex-led-review/references/grilling.md'));
  fails(run(root), 'workflows: references/grilling.md is missing in mstack-codex-led-review');
});

test('an extra reference file in one workflow fails', () => {
  const root = six(tree());
  writeFileSync(join(root, 'plugins/mstack-claude-led-dev/skills/mstack-claude-led-dev/references/extra.md'), 'Extra.\n');
  fails(run(root), 'workflows: references/extra.md of mstack-claude-led-dev differs');
});

test('the notices drift', () => {
  const root = six(tree());
  edit(root, 'plugins/mstack-antigravity-led-review/skills/mstack-antigravity-led-review/THIRD_PARTY_NOTICES.md', (text) => `${text}\nDrift.\n`);
  fails(run(root), 'workflows: THIRD_PARTY_NOTICES.md of mstack-antigravity-led-review differs');
});

test('plan-format drifts in the new workflows', () => {
  const root = six(tree());
  for (const name of newWorkflows) edit(root, `plugins/${name}/skills/${name}/references/plan-format.md`, (text) => `${text}\nDrift.\n`);
  const result = run(root);
  fails(result, 'plan-format.md');
  assert(newWorkflows.some((name) => result.stderr.includes(name)), result.stderr);
});

test('codegraph drifts in the new workflows', () => {
  const root = six(tree());
  for (const name of newWorkflows) edit(root, `plugins/${name}/skills/${name}/references/codegraph.md`, (text) => `${text}\nDrift.\n`);
  const result = run(root);
  fails(result, 'codegraph.md');
  assert(newWorkflows.some((name) => result.stderr.includes(name)), result.stderr);
});

test('host file missing', () => {
  const root = six(tree());
  rmSync(join(root, 'plugins/mstack-codex-led-review/skills/mstack-codex-led-review/host.md'));
  fails(run(root), 'mstack-codex-led-review', 'host.md');
});

test('host file names another host', () => {
  const root = six(tree());
  writeFileSync(join(root, 'plugins/mstack-claude-led-dev/skills/mstack-claude-led-dev/host.md'), '# Host: Codex\n');
  fails(run(root), 'mstack-claude-led-dev', 'host.md');
});

test('dangling reference link in host.md fails', () => {
  const root = six(tree());
  writeFileSync(join(root, 'plugins/mstack-claude-led-dev/skills/mstack-claude-led-dev/host.md'), '# Host: Claude Code\n\nSee references/no-such-file.md.\n');
  fails(run(root), 'mstack-claude-led-dev', 'references/no-such-file.md');
});

test('old and new coexist', () => {
  const root = tree();
  addWorkflow(root, 'mstack-claude-led-review');
  addWorkflow(root, 'mstack-codex-led-review');
  const result = run(root);
  assert.equal(result.status, 0, result.stderr);
});

test('old workflows are still compared', () => {
  const root = tree();
  edit(root, 'plugins/mstack-claude-review-workflow/skills/mstack-claude-review-workflow/references/writing.md', (text) => `${text}\nDrift.\n`);
  fails(run(root), 'workflows: references/writing.md of mstack-claude-review-workflow differs');
});

test('deleting mstack-claude-pm-codex-dev fixture plan fails', () => {
  const root = tree();
  rmSync(join(root, 'plugins/mstack-claude-pm-codex-dev/skills/mstack-claude-pm-codex-dev/evals/_fixture/plan'), { recursive: true });
  fails(run(root), 'mstack-claude-pm-codex-dev', 'evals/_fixture/plan');
});

test("a workflow's fixture plan is linted", () => {
  const root = six(tree());
  edit(root, 'plugins/mstack-codex-led-dev/skills/mstack-codex-led-dev/evals/_fixture/plan/progress.md', (text) => text.replace(/^Spec:[^\n]*\n/m, ''));
  fails(run(root), 'mstack-codex-led-dev', 'evals/_fixture/plan');
});
