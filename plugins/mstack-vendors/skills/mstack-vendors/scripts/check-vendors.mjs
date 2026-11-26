#!/usr/bin/env node
// Which other vendors can be called from one host, per job, and the leader's vendor. Reads the environment and the
// disk and asks each client for its sign-in; writes nothing and starts no session.
//   node check-vendors.mjs --host <claude-code|codex|antigravity> [--workspace <dir>] [--leader-model <id>] [--leader-only]
// Output, one JSON object per line: first the rows {"vendor","job","state","reason","channel"}, vendors in the order
// claude, codex, jobs in the order code review, plan review, developer; then, last, {"leader": ...}.
// Rows per host: claude-code lists codex; codex lists claude; antigravity lists claude and codex. No host lists
// antigravity, and the Antigravity client and its sign-in are never checked.
// A row says whether the vendor can be reached from this host, not whether it may do the job: the rows are the same
// whoever the leader and the writers are, and the skill leaves out the leader's vendor and the writers itself.
// state is `available` or `not available`; reason is empty when available; channel is the absolute path of the
// vendor's client when available, else empty.
// Exit 0 whenever it ran, also when nothing is available; 2 on a usage error (no or unknown --host, an unknown option,
// an option without a value, with an empty value or followed by another option, a --workspace that is not a folder, a
// --leader-only with a value, and a workspace path that holds one of the characters " $ ` \ |, which the caller's shell
// commands cannot hold safely; on Windows \ is the path separator and is allowed).
// --workspace defaults to the current folder.
// --leader-only prints only the leader line: no vendor client is looked for or started, no sign-in is asked, and the
// workspace is not checked (the leader never reads it). It is
// for the run inside Antigravity's sandbox after the run outside it was not approved.
//
// The checks of a row, in this order; the first that fails gives the reason. Whatever cannot be read counts as failed.
//   1. Client: an executable file `claude` or `codex` on PATH.
//        not installed: the <name> command-line tool; mstack-setup installs it
//      (on host antigravity, where mstack-setup only shows that command: ...; mstack-setup shows the command that
//      installs it, for the user to run)
//   2. Sign-in, asked once per vendor and call. codex: `codex login status` exits 0 and its output (both streams) holds
//      "logged in" in any case and not "not logged in". claude: `claude auth status` exits 0 and prints JSON with
//      "loggedIn": true. A non-zero exit, or claude's JSON with "loggedIn": false, is signed out; a signed-out vendor
//      is not available for any job.
//        not signed in: run codex login | not signed in: run claude auth login
//      A check that did not complete (it could not start, gave no answer within 15 seconds or was ended by a signal),
//      or that exits 0 with any other answer, says nothing about the sign-in, so its reason gives no instruction:
//        sign-in not confirmed: <the command> <what happened>
//   3. A codex developer on host claude-code only (the OpenAI Codex plugin carries it). Reasons start `channel missing: `.
//      a. `codex-dev.mjs locate` exits 0 and names a file. Exit 1 is the first reason; anything else the second.
//           the OpenAI Codex plugin is not installed; mstack-setup installs it
//           the Codex plugin could not be located (codex-dev.mjs locate <what happened>); run it to see why
//      b. The folder that holds the located scripts/ also holds agents/codex-rescue.md, and `codex-dev.mjs jobs` exits 0
//         with a list of jobs (it does so only when the plugin's session hook ran and the plugin answers).
//           the Codex plugin's session hook has not run or its rescue agent is missing; start a new Claude Code session with the plugin enabled
//      c. No Codex configuration file this script can name turns the network on for workspace-write. The plugin sets
//         the sandbox and passes no network setting, so the files decide. Read, in this order: <codex home>/config.toml
//         (CODEX_HOME, else ~/.codex), /etc/codex/config.toml, and .codex/config.toml in the workspace folder and in
//         each parent up to the folder that holds .git (without one, the workspace folder only; a project file counts
//         whether or not Codex trusts the project). A missing file passes. On is `network_access = true` under
//         [sandbox_workspace_write] or [profiles.<name>.sandbox_workspace_write], or as the dotted key
//         `sandbox_workspace_write.network_access`, with or without `profiles.<name>.` before it. A line that names
//         either word in any other form, and inside those tables any line that is not a one-line key with a plain
//         value, cannot be read with certainty and fails. A profile file and cloud-managed defaults cannot be seen
//         from here and are not checked.
//           <file>:<line> turns network access on for workspace-write, so a Codex developer could push
//           <file>:<line> cannot be read with certainty, so it is not known whether network access is off for workspace-write
//           <file> cannot be read, so it is not known whether network access is off for workspace-write
//   Every other job needs only 1 and 2: a codex review on any host, a codex developer on host antigravity, and claude
//   for all three jobs.
//
// The leader line: claude on host claude-code and codex on host codex; the host decides, so --leader-model is not read
// and no listing is asked for. On host antigravity the id is looked up in one `agy models` call (a listing; it starts
// no session), and only a model record of that listing, a line `<id><TAB><name>`, names a vendor: a listed id starting
// `gemini-` is antigravity, one starting `claude-` is claude, any other listed id is `other`. Everything else (an
// alias, a typo with a known prefix, a banner line, a listing that fails, no --leader-model) is `unknown`.
//
// MSTACK_VENDORS_TIMEOUT_MS replaces the 15 seconds every client call may take; only this script's tests set it.
import { spawnSync } from 'node:child_process';
import { accessSync, constants, existsSync, readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { delimiter, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const USAGE = 'usage: check-vendors.mjs --host <claude-code|codex|antigravity> [--workspace <dir>] [--leader-model <id>] [--leader-only]\n'
  + 'A row says whether the vendor can be reached from this host, not whether it may do the job.';
function usage(msg) { if (msg) console.error(msg); console.error(USAGE); process.exit(2); }

const opts = { host: undefined, workspace: undefined, 'leader-model': undefined };
const args = process.argv.slice(2);
let leaderOnly = false;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--leader-only') { leaderOnly = true; continue; }
  const eq = args[i].indexOf('=');
  const name = args[i].startsWith('--') ? args[i].slice(2, eq < 0 ? undefined : eq) : '';
  if (!Object.hasOwn(opts, name)) usage(`unknown option: ${args[i]}`);
  const value = eq < 0 ? args[++i] : args[i].slice(eq + 1);
  if (!value || value.startsWith('--')) usage(`--${name} needs a value`);
  opts[name] = value;
}
const VENDORS = { __proto__: null, 'claude-code': ['codex'], codex: ['claude'], antigravity: ['claude', 'codex'] };
const host = opts.host;
if (!VENDORS[host]) usage();
const workspace = resolve(opts.workspace ?? process.cwd());
const win = process.platform === 'win32';
// The leader line never reads the workspace, so --leader-only does not check it.
if (!leaderOnly) try { if (!statSync(workspace).isDirectory()) throw new Error(); } catch { usage(`--workspace is not a folder: ${workspace}`); }
// shortcut: on Windows every path holds \, so only the other four are refused there; upgrade when the caller's commands get
// a Windows form.
if (!leaderOnly && (win ? /["$`|]/ : /["$`\\|]/).test(workspace)) usage(`--workspace ${workspace}: a path with one of the characters " $ \` \\ | is not supported`);

const env = process.env;
const TIMEOUT = Number(env.MSTACK_VENDORS_TIMEOUT_MS) > 0 ? Number(env.MSTACK_VENDORS_TIMEOUT_MS) : 15000;

// Find an executable by scanning PATH, adding each PATHEXT extension on Windows. Returns an absolute path.
function which(name) {
  const exts = win ? (env.PATHEXT || '.COM;.EXE;.BAT;.CMD').split(';').filter(Boolean) : [''];
  for (const dir of (env.PATH || '').split(delimiter).filter(Boolean)) {
    for (const ext of exts) {
      for (const cand of win ? [name + ext, name + ext.toLowerCase()] : [name]) {
        const p = resolve(dir, cand);
        try { if (statSync(p).isFile() && (win || !accessSync(p, constants.X_OK))) return p; } catch { /* not here, or not executable */ }
      }
    }
  }
  return null;
}

// Runs a client with an argument list and a time limit. A timeout or a kill leaves status null.
function ask(path, cmdArgs) {
  // A .cmd shim on Windows only starts through the shell.
  const shell = win && /\.(cmd|bat)$/i.test(path);
  return spawnSync(path, cmdArgs, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: TIMEOUT, killSignal: 'SIGKILL', shell });
}

// `said` reads an answer that came with exit 0: true signed in, false signed out, undefined when it says neither.
const SIGN_IN = {
  // codex prints its answer on stderr. Exit 0 with "not logged in" contradicts itself, so it confirms nothing.
  codex: { args: ['login', 'status'], said: (r) => { const t = `${r.stdout}${r.stderr}`.toLowerCase(); return t.includes('logged in') && !t.includes('not logged in') ? true : undefined; }, fix: 'run codex login' },
  claude: { args: ['auth', 'status'], said: (r) => { try { const v = JSON.parse(r.stdout).loggedIn; return typeof v === 'boolean' ? v : undefined; } catch { return undefined; } }, fix: 'run claude auth login' },
};
// The reason a vendor's sign-in is not confirmed, or '' when it is.
function signInGap(vendor, path) {
  const { args: cmdArgs, said, fix } = SIGN_IN[vendor];
  const r = ask(path, cmdArgs);
  const unknown = (why) => `sign-in not confirmed: ${vendor} ${cmdArgs.join(' ')} ${why}`;
  if (r.error) return unknown(r.error.code === 'ETIMEDOUT' ? `gave no answer within ${TIMEOUT / 1000} seconds` : `could not start (${r.error.code ?? r.error.message})`);
  if (r.signal) return unknown(`was ended by ${r.signal}`);
  if (r.status !== 0 || said(r) === false) return `not signed in: ${fix}`;
  return said(r) ? '' : unknown('exited 0 with an answer that could not be read');
}

const NAME = String.raw`(?:[A-Za-z0-9_-]+|"[^"\\]*")`;
const TEXT = String.raw`"[^"\\]*"`;
const END = String.raw`\s*(?:#.*)?$`;
const TABLE = new RegExp(String.raw`^\s*\[\s*(?:profiles\.${NAME}\.)?sandbox_workspace_write\s*\]${END}`);
const KEY = new RegExp(String.raw`^\s*((?:profiles\.${NAME}\.)?sandbox_workspace_write\.)?network_access\s*=\s*(true|false)${END}`);
const PLAIN = new RegExp(String.raw`^\s*[A-Za-z0-9_-]+\s*=\s*(?:true|false|-?\d+|${TEXT}|\[\s*(?:${TEXT}\s*,?\s*)*\])${END}`);

// What one Codex configuration says about the network of workspace-write: '' when it leaves it off, else the reason.
// No TOML parser: each line is matched whole against the few forms listed in the header, and a line that could bear
// on the setting in any other form fails the check. Inside a sandbox table every line must be a one-line key, so no
// value that goes on over several lines can hide a table header.
function networkGap(file) {
  let text;
  try { text = readFileSync(file, 'utf8'); } catch (e) {
    // ENOTDIR: a parent of the path is a file, so there is no such configuration.
    return e.code === 'ENOENT' || e.code === 'ENOTDIR' ? '' : `${file} cannot be read, so it is not known whether network access is off for workspace-write`;
  }
  const on = (i) => `${file}:${i + 1} turns network access on for workspace-write, so a Codex developer could push`;
  const unsure = (i) => `${file}:${i + 1} cannot be read with certainty, so it is not known whether network access is off for workspace-write`;
  let inTable = false;
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*(#.*)?$/.test(line)) continue;
    const named = line.includes('sandbox_workspace_write') || line.includes('network_access');
    if (TABLE.test(line)) { inTable = true; continue; }
    if (/^\s*\[/.test(line)) { if (named) return unsure(i); inTable = false; continue; }
    const key = KEY.exec(line);
    if (key && (key[1] || inTable)) { if (key[2] === 'true') return on(i); continue; }
    // A bare network_access outside the sandbox tables belongs to another table.
    if (key) continue;
    if (named || (inTable && !PLAIN.test(line))) return unsure(i);
  }
  return '';
}

// The Codex configuration files this script can name. Codex reads a project file from the project root down.
// shortcut: a profile file and cloud-managed defaults are not read (their place is not known from here); upgrade when
// the Codex plugin can be started with its own network setting, which would win over every file.
function codexConfigs() {
  const files = [join(env.CODEX_HOME || join(env.HOME || env.USERPROFILE || homedir(), '.codex'), 'config.toml'), '/etc/codex/config.toml'];
  const up = [];
  let root = false;
  for (let dir = workspace; ; dir = dirname(dir)) {
    up.push(join(dir, '.codex', 'config.toml'));
    if (existsSync(join(dir, '.git'))) { root = true; break; }
    if (dirname(dir) === dir) break;
  }
  return [...new Set([...files, ...(root ? up : up.slice(0, 1))])];
}

// Check 3: the reason a Codex developer cannot run through the Codex plugin of Claude Code, or '' when it can.
function codexPluginGap() {
  const helper = join(dirname(fileURLToPath(import.meta.url)), 'codex-dev.mjs');
  const dev = (...a) => spawnSync(process.execPath, [helper, ...a], { encoding: 'utf8', env, timeout: TIMEOUT, killSignal: 'SIGKILL' });
  const located = dev('locate');
  if (located.status === 1) return 'the OpenAI Codex plugin is not installed; mstack-setup installs it';
  const companion = located.stdout?.trim() ?? '';
  let found = false;
  try { found = Boolean(companion) && statSync(companion).isFile(); } catch { /* not a file */ }
  if (located.status !== 0 || !found) {
    const what = located.status === null ? 'gave no answer' : located.status !== 0 ? `exited ${located.status}` : 'named no file';
    return `the Codex plugin could not be located (codex-dev.mjs locate ${what}); run it to see why`;
  }
  const hook = 'the Codex plugin\'s session hook has not run or its rescue agent is missing; start a new Claude Code session with the plugin enabled';
  try { if (!statSync(join(dirname(dirname(companion)), 'agents', 'codex-rescue.md')).isFile()) return hook; } catch { return hook; }
  const jobs = dev('jobs', '--cwd', workspace);
  try { if (jobs.status !== 0 || !Array.isArray(JSON.parse(jobs.stdout).jobs)) return hook; } catch { return hook; }
  for (const file of codexConfigs()) { const gap = networkGap(file); if (gap) return gap; }
  return '';
}

// The host decides the leader's vendor in Claude Code and Codex; in Antigravity only a model record of the listing does.
function leader() {
  if (host !== 'antigravity') return host === 'codex' ? 'codex' : 'claude';
  const id = opts['leader-model'];
  const agy = id && which('agy');
  if (!agy) return 'unknown';
  const r = ask(agy, ['models']);
  const listed = r.status === 0 && r.stdout.split(/\r?\n/).some((l) => l.includes('\t') && l.split('\t')[0].trim() === id);
  return !listed ? 'unknown' : id.startsWith('gemini-') ? 'antigravity' : id.startsWith('claude-') ? 'claude' : 'other';
}

if (leaderOnly) { console.log(JSON.stringify({ leader: leader() })); process.exit(0); }

for (const vendor of VENDORS[host]) {
  const path = which(vendor);
  const base = !path ? `not installed: the ${vendor} command-line tool; ${host === 'antigravity' ? 'mstack-setup shows the command that installs it, for the user to run' : 'mstack-setup installs it'}`
    : signInGap(vendor, path);
  for (const job of ['code review', 'plan review', 'developer']) {
    let reason = base;
    if (!reason && vendor === 'codex' && job === 'developer' && host === 'claude-code') {
      const gap = codexPluginGap();
      if (gap) reason = `channel missing: ${gap}`;
    }
    console.log(JSON.stringify({ vendor, job, state: reason ? 'not available' : 'available', reason, channel: reason ? '' : path }));
  }
}
console.log(JSON.stringify({ leader: leader() }));
