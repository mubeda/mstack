#!/usr/bin/env node
// Report what the mstack skills need on this machine, for one host. Reads the environment and the disk; writes nothing.
//   node check-setup.mjs --host <claude|codex|antigravity> [--platform <linux|darwin|win32>] [--needs <ids and groups>] [--json]
// Each line: <state>  <tier>  <id>  <detail>, state ok | MISSING | LOGIN | SKIP | WARN.
// WARN is a row the host cannot offer at all (ui-ux-pro-max in Antigravity): it never fails a run without --needs.
// Antigravity has no reviewer, codex-plugin or workflow rows; a --needs group with no row on the host is a usage error.
// --needs is for one calling skill: a comma-separated list of row IDs and of the groups `reviewer` and `codegraph`.
// Only those rows and `node` then block, whatever their tier. Without it, every mandatory row blocks, and so do
// the reviewer rows, which are optional for the user but were mandatory for callers before --needs existed.
// Exit 0 when no blocking item is MISSING or LOGIN (with --needs: when every blocking item is ok), 1 otherwise,
// 2 on a usage error, which includes a name in --needs that is no row and no group, and a --needs with no name in it.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { delimiter as hostDelimiter, join } from 'node:path';

const args = process.argv.slice(2);
let host = '', platform = process.platform, json = false, needs = null;
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--host') host = args[++i] ?? '';
  else if (a.startsWith('--host=')) host = a.slice(7);
  else if (a === '--platform') platform = args[++i] ?? '';
  else if (a.startsWith('--platform=')) platform = a.slice(11);
  else if (a === '--needs') needs = args[++i] ?? '';
  else if (a.startsWith('--needs=')) needs = a.slice(8);
  else if (a === '--json') json = true;
  else { console.error(`unknown option: ${a}`); process.exit(2); }
}
if (!['claude', 'codex', 'antigravity'].includes(host)) {
  console.error('usage: check-setup.mjs --host <claude|codex|antigravity> [--platform <linux|darwin|win32>] [--needs <ids and groups>] [--json]');
  process.exit(2);
}
const supported = ['linux', 'darwin', 'win32'].includes(platform);
const win = platform === 'win32';
const env = process.env;
const home = (win ? env.USERPROFILE : env.HOME) || env.HOME || env.USERPROFILE || '';
if (!home) { console.error('neither HOME nor USERPROFILE is set, so the user folders cannot be found'); process.exit(2); }
const claudeDir = env.CLAUDE_CONFIG_DIR || join(home, '.claude');
const codexDir = env.CODEX_HOME || join(home, '.codex');
// Antigravity keeps skills, plugins and mcp_config.json in ~/.gemini/config. Its skills folder is also the global folder of the
// skills CLI's `antigravity` agent (skills@1.9.0), for which ~/.agents/skills is a workspace folder and no global one.
const agyDir = join(home, '.gemini', 'config');
const hostDir = host === 'claude' ? claudeDir : host === 'codex' ? codexDir : agyDir;

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
function findFiles(root, match, depth = 7, follow = host === 'antigravity') {
  const out = [];
  const walk = (d, n) => {
    let names; try { names = readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of names) {
      const p = join(d, e.name);
      // In Antigravity a plugin folder or a SKILL.md may be a link: follow it to an existing target (the depth ends a loop).
      let st = e;
      if (follow && e.isSymbolicLink()) { try { st = statSync(p); } catch { continue; } }
      if (st.isDirectory() && n > 0) walk(p, n - 1);
      else if (st.isFile() && match(p)) out.push(p);
    }
  };
  walk(root, depth);
  return out;
}

const skillRoots = host === 'antigravity' ? [join(agyDir, 'skills')] : [join(hostDir, 'skills'), join(home, '.agents', 'skills')];
// Antigravity's `agy plugin install` writes the plugin folder itself and no install record, so every plugin folder counts.
const cache = host === 'antigravity' ? join(agyDir, 'plugins') : join(hostDir, 'plugins', 'cache');
const norm = (p) => p.split('\\').join('/');
const cacheSkills = findFiles(cache, (p) => p.endsWith('SKILL.md')).map(norm);

function hasSkill(name) {
  // In Antigravity a folder named SKILL.md is no skill; the other hosts keep the plain existence check.
  const there = (p) => { if (host !== 'antigravity') return existsSync(p); try { return statSync(p).isFile(); } catch { return false; } };
  if (skillRoots.some((r) => there(join(r, name, 'SKILL.md')))) return true;
  // A cache folder alone proves nothing (leftover clones and old versions stay there): the host must record the plugin.
  return cacheSkills.some((p) => p.endsWith(`/skills/${name}/SKILL.md`) && (host === 'antigravity' || recorded(p)));
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
// A plugin is installed when the host records it: Claude Code in plugins/installed_plugins.json, Codex in config.toml.
// That record is what the host's own plugin list reads; a cache folder alone is not taken as proof.
function pluginInstalled(name) {
  if (host === 'claude') {
    try { return Object.keys(JSON.parse(readFileSync(join(claudeDir, 'plugins', 'installed_plugins.json'), 'utf8')).plugins ?? {}).some((k) => k.startsWith(`${name}@`)); } catch { return false; }
  }
  try { return new RegExp(`^\\s*\\[plugins\\."${name}@`, 'm').test(readFileSync(join(codexDir, 'config.toml'), 'utf8')); } catch { return false; }
}
function codegraphConnected() {
  if (host === 'antigravity') {
    // The entry the installer writes is an object with a command (`codegraph install --print-config antigravity`, codegraph 1.6.3).
    // It writes ~/.gemini/config/mcp_config.json, or the older ~/.gemini/antigravity/mcp_config.json on a machine not yet moved over.
    for (const dir of ['config', 'antigravity']) {
      try {
        const e = JSON.parse(readFileSync(join(home, '.gemini', dir, 'mcp_config.json'), 'utf8')).mcpServers?.codegraph;
        if (e && typeof e === 'object' && !Array.isArray(e) && typeof e.command === 'string' && e.command) return `~/.gemini/${dir}/mcp_config.json`;
      } catch { /* missing, empty or unparsable: not connected through this file */ }
    }
    return false;
  }
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
const connected = cg && codegraphConnected();
add('codegraph-connected', 'mandatory', connected, !cg ? 'needs codegraph-cli first' : typeof connected === 'string' ? `codegraph server in Antigravity settings file ${connected}`
  : `codegraph server in the ${{ claude: 'Claude Code', codex: 'Codex', antigravity: 'Antigravity' }[host]} configuration`);
// ponytail counts only as the plugin, because its hooks come with the plugin and not with the skill folder.
// In Antigravity the skills are what loads, and its hooks do not run, so the skills alone are the row.
const ponytailPlugin = pluginInstalled('ponytail') && cacheSkills.some((p) => p.endsWith('/skills/ponytail/SKILL.md'));
if (host === 'antigravity') add('ponytail', 'mandatory', hasSkill('ponytail'), 'ponytail skills (its hooks do not run in Antigravity)');
else add('ponytail', 'mandatory', ponytailPlugin, ponytailPlugin || !hasSkill('ponytail')
  ? (host === 'codex' ? 'ponytail plugin (its hooks need a trust step in Codex)' : 'ponytail plugin')
  : 'ponytail skill found without the plugin, so its hooks are missing');
if (host !== 'antigravity') {
  // In Codex the reviewer is the claude client itself (reviewer-cli and reviewer-login), so there is no plugin row.
  if (host === 'claude') add('reviewer-plugin', 'optional', hasCodexSkill(), 'skill-codex plugin (Codex reviews)');
  const cliName = host === 'claude' ? 'codex' : 'claude';
  const cli = which(cliName);
  add('reviewer-cli', 'optional', cli, `${cliName} command-line tool`);
  if (!cli) add('reviewer-login', 'optional', false, `needs ${cliName} first`, 'SKIP');
  else {
    const ok = loggedIn(cli, host === 'claude' ? ['login', 'status'] : ['auth', 'status']);
    add('reviewer-login', 'optional', ok, `${cliName} logged in`, ok ? 'ok' : 'LOGIN');
  }
}
for (const s of ['mstack-find-skills', 'mstack-best-model-for', 'mstack-receive-review', 'mstack-research', 'mstack-setup']) add(s, 'mandatory', hasSkill(s), 'mstack skill');
const uiOk = hasSkill('ui-ux-pro-max');
add('ui-ux-pro-max', 'optional', uiOk, host === 'antigravity' && !uiOk ? 'UI design skill: not available in Antigravity' : 'UI design skill', host === 'antigravity' && !uiOk ? 'WARN' : undefined);
add('archify', 'optional', hasSkill('archify'), 'diagram skill (mstack-explain-me-better offers diagrams with it)');
add('gh', 'optional', which('gh'), 'GitHub command-line tool');
add('python3', 'optional', which('python3') || (win && (which('python') || which('py'))), 'Python 3');
const workflow = host === 'claude' ? 'mstack-codex-review-workflow' : 'mstack-claude-review-workflow';
const workflows = host === 'antigravity' ? [] : [workflow];
if (host === 'claude') add('codex-plugin', 'optional', pluginInstalled('codex'), 'OpenAI Codex plugin (Codex as developer in mstack-claude-pm-codex-dev)');
const pmWorkflow = host === 'claude' ? ['mstack-claude-pm-codex-dev'] : [];
for (const s of ['mstack-plan', 'mstack-write-specs', 'mstack-brainstorm', 'mstack-diagnose', 'mstack-backlog-triage', 'mstack-handoff', 'mstack-skill-creator', 'mstack-chief-of-staff', 'mstack-explain-me-better', 'mstack-product-plan', 'mstack-epic', 'mstack-evidence', 'mstack-decisions', 'mstack-auto', 'mstack-write-issue', 'mstack-anonymize', 'mstack-web-ui', ...workflows, ...pmWorkflow]) {
  add(s, 'optional', hasSkill(s), 'mstack skill');
}

// Which rows block: every mandatory one and the reviewer rows, or with --needs the rows the calling skill named, and node.
const GROUPS = { __proto__: null, reviewer: ['reviewer-plugin', 'reviewer-cli', 'reviewer-login'], codegraph: ['codegraph-cli', 'codegraph-connected'] };
let needed = null;
if (needs !== null) {
  const names = needs.split(',').map((n) => n.trim()).filter(Boolean);
  const known = (n) => GROUPS[n]?.some((g) => items.some((i) => i.id === g)) || items.some((i) => i.id === n);
  if (!names.length) { console.error('--needs holds no name: give row IDs or groups, separated by commas'); process.exit(2); }
  const unknown = names.filter((n) => !known(n));
  if (unknown.length) { console.error(`--needs names no row and no group of this host: ${unknown.join(', ')}`); process.exit(2); }
  needed = new Set(['node', ...names.flatMap((n) => GROUPS[n] ?? [n])]);
}
for (const i of items) i.blocking = needed ? needed.has(i.id) : i.tier === 'mandatory' || GROUPS.reviewer.includes(i.id);
const failed = items.some((i) => i.blocking && (needed ? i.state !== 'ok' : i.state === 'MISSING' || i.state === 'LOGIN'));
if (json) console.log(JSON.stringify({ host, platform, supported, items }, null, 2));
else {
  if (!supported) console.log(`platform ${platform} is not covered: status only, no install commands`);
  for (const i of items) console.log(`${i.state.padEnd(8)} ${i.tier.padEnd(9)} ${i.id.padEnd(30)} ${i.detail}`);
}
process.exit(failed ? 1 : 0);
