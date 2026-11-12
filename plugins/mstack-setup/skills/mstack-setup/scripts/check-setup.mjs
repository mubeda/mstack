#!/usr/bin/env node
// Report what the mstack skills need on this machine, for one host. Reads the environment and the disk; writes nothing.
//   node check-setup.mjs --host <claude|codex> [--platform <linux|darwin|win32>] [--json]
// Each line: <state>  <tier>  <id>  <detail>, state ok | MISSING | LOGIN | SKIP.
// Exit 0 when no mandatory item is MISSING or LOGIN, 1 when one is, 2 on a usage error.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { delimiter as hostDelimiter, dirname, join } from 'node:path';

const args = process.argv.slice(2);
let host = '', platform = process.platform, json = false;
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--host') host = args[++i] ?? '';
  else if (a.startsWith('--host=')) host = a.slice(7);
  else if (a === '--platform') platform = args[++i] ?? '';
  else if (a.startsWith('--platform=')) platform = a.slice(11);
  else if (a === '--json') json = true;
  else { console.error(`unknown option: ${a}`); process.exit(2); }
}
if (host !== 'claude' && host !== 'codex') {
  console.error('usage: check-setup.mjs --host <claude|codex> [--platform <linux|darwin|win32>] [--json]');
  process.exit(2);
}
const supported = ['linux', 'darwin', 'win32'].includes(platform);
const win = platform === 'win32';
const env = process.env;
const home = (win ? env.USERPROFILE : env.HOME) || env.HOME || env.USERPROFILE || '';
if (!home) { console.error('neither HOME nor USERPROFILE is set, so the user folders cannot be found'); process.exit(2); }
const claudeDir = env.CLAUDE_CONFIG_DIR || join(home, '.claude');
const codexDir = env.CODEX_HOME || join(home, '.codex');
const hostDir = host === 'claude' ? claudeDir : codexDir;

// Find an executable by scanning PATH, adding each PATHEXT extension on Windows.
function which(name) {
  // On the real platform use its own separator; a simulated win32 run on POSIX keeps ':' so tests can build PATH.
  const sep = win && process.platform === 'win32' ? ';' : hostDelimiter;
  const exts = win ? (env.PATHEXT || '.COM;.EXE;.BAT;.CMD').split(';').filter(Boolean) : [''];
  for (const dir of (env.PATH || '').split(sep).filter(Boolean)) {
    for (const ext of exts) {
      for (const cand of win ? [name + ext, name + ext.toLowerCase()] : [name]) {
        const p = join(dir, cand);
        try { if (statSync(p).isFile()) return p; } catch { /* not here */ }
      }
    }
  }
  return null;
}

// Every SKILL.md path under a folder, at most `depth` levels down.
function findFiles(root, match, depth = 7) {
  const out = [];
  const walk = (d, n) => {
    let names; try { names = readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of names) {
      const p = join(d, e.name);
      if (e.isDirectory() && n > 0) walk(p, n - 1);
      else if (e.isFile() && match(p)) out.push(p);
    }
  };
  walk(root, depth);
  return out;
}

const skillRoots = [join(hostDir, 'skills'), join(home, '.agents', 'skills')];
const cache = join(hostDir, 'plugins', 'cache');
const norm = (p) => p.split('\\').join('/');
const cacheSkills = findFiles(cache, (p) => p.endsWith('SKILL.md')).map(norm);

function hasSkill(name) {
  if (skillRoots.some((r) => existsSync(join(r, name, 'SKILL.md')))) return true;
  // A cache folder alone proves nothing (leftover clones and old versions stay there): the host must record the plugin.
  return cacheSkills.some((p) => p.endsWith(`/skills/${name}/SKILL.md`) && recorded(p));
}
// True when the cache path sits under <cache>/<marketplace>/<plugin>/ and the host records "<plugin>@<marketplace>".
function recorded(path) {
  const [market, plugin] = path.slice(norm(cache).length).replace(/^\/+/, '').split('/');
  return Boolean(market && plugin) && pluginRecorded(`${plugin}@${market}`);
}
function pluginRecorded(key) {
  if (host === 'claude') {
    try { return Object.hasOwn(JSON.parse(readFileSync(join(claudeDir, 'plugins', 'installed_plugins.json'), 'utf8')).plugins ?? {}, key); } catch { return false; }
  }
  let text;
  try { text = readFileSync(join(codexDir, 'config.toml'), 'utf8'); } catch { return false; }
  // The plugin's table, up to the next table header; switched off when it says enabled = false.
  const at = text.split(/\r?\n/).findIndex((l) => l.trim() === `[plugins."${key}"]`);
  if (at < 0) return false;
  const rest = text.split(/\r?\n/).slice(at + 1);
  const end = rest.findIndex((l) => /^\s*\[/.test(l));
  return !(end < 0 ? rest : rest.slice(0, end)).some((l) => /^\s*enabled\s*=\s*false/.test(l));
}
// skill-codex ships a skill folder named `codex`; match its plugin path, or a standalone copy that runs `codex exec`.
function hasCodexSkill() {
  if (pluginInstalled('skill-codex') && cacheSkills.some((p) => p.includes('skill-codex') && p.endsWith('/skills/codex/SKILL.md'))) return true;
  return skillRoots.some((r) => {
    try { return readFileSync(join(r, 'codex', 'SKILL.md'), 'utf8').includes('codex exec'); } catch { return false; }
  });
}
// The agent-bridges `claude` plugin ships `claude-review` next to the companion script it runs.
function hasClaudeReview() {
  return pluginInstalled('claude') && cacheSkills.filter((p) => p.endsWith('/skills/claude-review/SKILL.md'))
    .some((p) => existsSync(join(dirname(dirname(dirname(p))), 'scripts', 'claude-companion.mjs')));
}
// A plugin is installed when the host records it: Claude Code in plugins/installed_plugins.json, Codex in config.toml.
// That record is what the host's own plugin list reads; a cache folder alone is not taken as proof.
function pluginInstalled(name) {
  if (host === 'claude') {
    try { return Object.keys(JSON.parse(readFileSync(join(claudeDir, 'plugins', 'installed_plugins.json'), 'utf8')).plugins ?? {}).some((k) => k.startsWith(`${name}@`)); } catch { return false; }
  }
  try { return new RegExp(`^\\s*\\[plugins\\."${name}@`, 'm').test(readFileSync(join(codexDir, 'config.toml'), 'utf8')); } catch { return false; }
}
function codegraphConnected() {
  if (host === 'claude') {
    const cfg = env.CLAUDE_CONFIG_DIR ? join(claudeDir, '.claude.json') : join(home, '.claude.json');
    try { return Boolean(JSON.parse(readFileSync(cfg, 'utf8')).mcpServers?.codegraph); } catch { return false; }
  }
  try { return /^\s*\[mcp_servers\.codegraph\]/m.test(readFileSync(join(codexDir, 'config.toml'), 'utf8')); } catch { return false; }
}
function loggedIn(path, cmdArgs) {
  // A .cmd shim on real Windows only starts through the shell.
  const shell = process.platform === 'win32' && /\.(cmd|bat)$/i.test(path);
  const r = spawnSync(path, cmdArgs, { stdio: 'ignore', timeout: 15000, shell });
  return r.status === 0;
}

const items = [];
const add = (id, tier, ok, detail, state) => items.push({ id, tier, state: state ?? (ok ? 'ok' : 'MISSING'), detail });

add('node', 'mandatory', which('node'), 'Node.js, runs the skills\' scripts');
add('git', 'mandatory', which('git'), 'Git');
const cg = which('codegraph');
add('codegraph-cli', 'mandatory', cg, 'codegraph command-line tool (code index)');
add('codegraph-connected', 'mandatory', cg && codegraphConnected(), cg ? `codegraph server in the ${host === 'claude' ? 'Claude Code' : 'Codex'} configuration` : 'needs codegraph-cli first');
// ponytail counts only as the plugin, because its hooks come with the plugin and not with the skill folder.
const ponytailPlugin = pluginInstalled('ponytail') && cacheSkills.some((p) => p.endsWith('/skills/ponytail/SKILL.md'));
add('ponytail', 'mandatory', ponytailPlugin, ponytailPlugin || !hasSkill('ponytail')
  ? (host === 'codex' ? 'ponytail plugin (its hooks need a trust step in Codex)' : 'ponytail plugin')
  : 'ponytail skill found without the plugin, so its hooks are missing');
if (host === 'claude') add('reviewer-plugin', 'mandatory', hasCodexSkill(), 'skill-codex plugin (Codex reviews)');
else add('reviewer-plugin', 'mandatory', hasClaudeReview(), 'agent-bridges claude plugin with its companion script (Claude reviews)');
const cliName = host === 'claude' ? 'codex' : 'claude';
const cli = which(cliName);
add('reviewer-cli', 'mandatory', cli, `${cliName} command-line tool`);
if (!cli) add('reviewer-login', 'mandatory', false, `needs ${cliName} first`, 'SKIP');
else {
  const ok = loggedIn(cli, host === 'claude' ? ['login', 'status'] : ['auth', 'status']);
  add('reviewer-login', 'mandatory', ok, `${cliName} logged in`, ok ? 'ok' : 'LOGIN');
}
for (const s of ['mstack-find-skills', 'mstack-best-model-for', 'mstack-receive-review', 'mstack-setup']) add(s, 'mandatory', hasSkill(s), 'mstack skill');
add('ui-ux-pro-max', 'optional', hasSkill('ui-ux-pro-max'), 'UI design skill');
add('archify', 'optional', hasSkill('archify'), 'diagram skill (mstack-explain-me-better offers diagrams with it)');
add('gh', 'optional', which('gh'), 'GitHub command-line tool');
add('python3', 'optional', which('python3') || (win && (which('python') || which('py'))), 'Python 3');
const workflow = host === 'claude' ? 'mstack-codex-review-workflow' : 'mstack-claude-review-workflow';
if (host === 'claude') add('codex-plugin', 'optional', pluginInstalled('codex'), 'OpenAI Codex plugin (Codex as developer in mstack-claude-pm-codex-dev)');
const pmWorkflow = host === 'claude' ? ['mstack-claude-pm-codex-dev'] : [];
for (const s of ['mstack-plan', 'mstack-write-specs', 'mstack-brainstorm', 'mstack-diagnose', 'mstack-backlog-triage', 'mstack-handoff', 'mstack-skill-creator', 'mstack-chief-of-staff', 'mstack-explain-me-better', 'mstack-product-plan', 'mstack-epic', workflow, ...pmWorkflow]) {
  add(s, 'optional', hasSkill(s), 'mstack skill');
}

const failed = items.some((i) => i.tier === 'mandatory' && (i.state === 'MISSING' || i.state === 'LOGIN'));
if (json) console.log(JSON.stringify({ host, platform, supported, items }, null, 2));
else {
  if (!supported) console.log(`platform ${platform} is not covered: status only, no install commands`);
  for (const i of items) console.log(`${i.state.padEnd(8)} ${i.tier.padEnd(9)} ${i.id.padEnd(30)} ${i.detail}`);
}
process.exit(failed ? 1 : 0);
