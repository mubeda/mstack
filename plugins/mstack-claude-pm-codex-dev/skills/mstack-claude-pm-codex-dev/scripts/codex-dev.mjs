#!/usr/bin/env node
// The developer channel's helper for mstack-claude-pm-codex-dev. It is the only place that calls the OpenAI Codex
// plugin's scripts/codex-companion.mjs, whose status and result commands are undocumented: the fields read here are
// pinned by tests/codex-dev.test.mjs.
//
// Usage: node codex-dev.mjs locate
//        node codex-dev.mjs jobs [--cwd <dir>]
//        node codex-dev.mjs wait <job-id> [--cwd <dir>] [--timeout-ms <n>]   (prints state, threadId, summary, startedAt, completedAt)
//        node codex-dev.mjs result <job-id> --phase <phase-id> [--thread <thread-id>] [--cwd <dir>]
//        node codex-dev.mjs snapshot [--cwd <dir>]
//
// locate prints the companion script's path (plain text); the other commands print one line of JSON.
// Exit codes: 0 success; 1 failure (see each command); 2 usage error; 3 wait ran out of time with the job running.
// CODEX_COMPANION_SCRIPT, when set, replaces the located script: test cases point it at a stand-in.
// jobs, wait and result need CLAUDE_PLUGIN_DATA, which the Codex plugin's session-start hook exports to the session's
// shell; the plugin finds its job records through it, so the environment is passed through unchanged.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const USAGE = 'usage: codex-dev.mjs locate | jobs [--cwd <dir>] | wait <job-id> [--cwd <dir>] [--timeout-ms <n>] | result <job-id> --phase <id> [--thread <id>] [--cwd <dir>] | snapshot [--cwd <dir>]';
const ALLOWED = { locate: [], jobs: ['--cwd'], wait: ['--cwd', '--timeout-ms'], result: ['--cwd', '--phase', '--thread'], snapshot: ['--cwd'] };
const NEEDS_JOB = new Set(['wait', 'result']);

function usage(msg) { if (msg) console.error(msg); console.error(USAGE); process.exit(2); }
// Writes all of the text before the process exits: console.log followed by process.exit cuts piped output at 64 KiB.
function print(text) {
  const buf = Buffer.from(`${text}\n`);
  for (let off = 0; off < buf.length;) {
    try { off += writeSync(1, buf, off); } catch (e) { if (e.code !== 'EAGAIN') throw e; }
  }
}
function emit(obj, code) { print(JSON.stringify(obj)); process.exit(code); }

const [cmd, ...rest] = process.argv.slice(2);
if (!ALLOWED[cmd]) usage(cmd ? `unknown command: ${cmd}` : undefined);
let jobId;
const opts = {};
for (let i = 0; i < rest.length; i++) {
  const a = rest[i];
  if (a.startsWith('--')) {
    if (!ALLOWED[cmd].includes(a)) usage(`unknown option for ${cmd}: ${a}`);
    if (rest[i + 1] === undefined) usage(`${a} needs a value`);
    opts[a.slice(2)] = rest[++i];
  } else if (NEEDS_JOB.has(cmd) && jobId === undefined) jobId = a;
  else usage(`unexpected argument: ${a}`);
}
if (NEEDS_JOB.has(cmd) && !jobId) usage(`${cmd} needs a job ID`);
if (cmd === 'result' && !opts.phase) usage('result needs --phase <phase-id>');
const cwd = resolve(opts.cwd ?? process.cwd());

function locate() {
  if (process.env.CODEX_COMPANION_SCRIPT) return { path: process.env.CODEX_COMPANION_SCRIPT };
  const home = process.env.HOME || process.env.USERPROFILE || homedir();
  const config = process.env.CLAUDE_CONFIG_DIR || join(home, '.claude');
  const record = join(config, 'plugins', 'installed_plugins.json');
  let plugins;
  try { plugins = JSON.parse(readFileSync(record, 'utf8')).plugins ?? {}; } catch { return { missing: `MISSING  Codex plugin for Claude Code: no readable install record at ${record}` }; }
  const keys = Object.keys(plugins).filter((k) => k.startsWith('codex@')).sort((a, b) => (b === 'codex@openai-codex') - (a === 'codex@openai-codex'));
  if (!keys.length) return { missing: 'MISSING  Codex plugin for Claude Code: not in the install record (claude plugin install codex@openai-codex)' };
  for (const k of keys) {
    for (const entry of [].concat(plugins[k])) {
      const script = entry?.installPath && join(entry.installPath, 'scripts', 'codex-companion.mjs');
      if (script && existsSync(script)) return { path: script };
    }
  }
  return { missing: 'MISSING  Codex plugin for Claude Code: installed, but scripts/codex-companion.mjs is absent; reinstall it' };
}

// Runs the companion script with node (never through a shell) and returns its parsed JSON, or a reason it has none.
function companion(args, timeoutMs) {
  const located = locate();
  if (located.missing) { console.error(located.missing); process.exit(1); }
  const r = spawnSync(process.execPath, [located.path, ...args], { cwd, encoding: 'utf8', env: process.env, timeout: timeoutMs, killSignal: 'SIGKILL', maxBuffer: 256 * 1024 * 1024 });
  if (r.error?.code === 'ETIMEDOUT') return { timedOut: true };
  try { return { json: JSON.parse(r.stdout), status: r.status }; } catch { return { notJson: true, status: r.status, text: `${r.stdout}${r.stderr}`.trim() }; }
}

function needPluginData() {
  if (process.env.CLAUDE_PLUGIN_DATA) return;
  console.error('The Codex plugin\'s session hook has not run in this session (CLAUDE_PLUGIN_DATA is not set), so its jobs cannot be found. A new session is needed: start Claude Code again with the Codex plugin enabled.');
  process.exit(1);
}

const alive = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };
const active = (s) => s === 'queued' || s === 'running';

if (cmd === 'locate') {
  const located = locate();
  if (located.missing) { console.log(located.missing); process.exit(1); }
  console.log(located.path);
  process.exit(0);
}

if (cmd === 'snapshot') {
  // A tree of the working tree built through a temporary index, so untracked files are in, ignored files are out,
  // and the real index is untouched.
  const dir = mkdtempSync(join(tmpdir(), 'codex-dev-index-'));
  const env = { ...process.env, GIT_INDEX_FILE: join(dir, 'index') };
  const git = (...a) => spawnSync('git', a, { cwd, env, encoding: 'utf8' });
  // The outcome is decided inside the try and acted on after it, because process.exit would skip the cleanup.
  let tree, error;
  try {
    const head = spawnSync('git', ['rev-parse', '--verify', '-q', 'HEAD'], { cwd, encoding: 'utf8' });
    for (const step of [head.status === 0 ? ['read-tree', 'HEAD'] : ['read-tree', '--empty'], ['add', '-A'], ['write-tree']]) {
      const r = git(...step);
      if (r.status !== 0) { error = `git ${step.join(' ')} failed: ${r.stderr.trim()}`; break; }
      tree = r.stdout.trim();
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
  if (error) { console.error(error); process.exit(1); }
  print(tree);
  process.exit(0);
}

needPluginData();

if (cmd === 'jobs') {
  const r = companion(['status', '--all', '--json']);
  if (!r.json || r.status !== 0) { console.error(`The Codex plugin's status call failed: ${r.text ?? 'no JSON answer'}`); process.exit(1); }
  const seen = new Map();
  for (const j of [...(r.json.running ?? []), r.json.latestFinished, ...(r.json.recent ?? [])]) if (j?.id && !seen.has(j.id)) seen.set(j.id, j);
  const jobs = [...seen.values()]
    .sort((a, b) => String(b.startedAt ?? b.createdAt ?? '').localeCompare(String(a.startedAt ?? a.createdAt ?? '')))
    .map((j) => ({ id: j.id, state: j.status, startedAt: j.startedAt ?? j.createdAt ?? null, threadId: j.threadId ?? null, summary: j.summary ?? '' }));
  emit({ jobs }, 0);
}

if (cmd === 'wait') {
  const total = opts['timeout-ms'] === undefined ? 540000 : Number(opts['timeout-ms']);
  if (!Number.isFinite(total) || total < 0) usage('--timeout-ms needs a number of milliseconds');
  const deadline = Date.now() + total;
  const out = (state, j, code) => emit({ state, threadId: j?.threadId ?? null, summary: j?.summary ?? '', startedAt: j?.startedAt ?? null, completedAt: j?.completedAt ?? null }, code);
  let last;
  for (;;) {
    const left = deadline - Date.now();
    if (left <= 0) out('running', last, 3);
    const ask = Math.min(240000, left);
    const r = companion(['status', jobId, '--wait', '--timeout-ms', String(ask), '--json'], left + 500);
    if (r.timedOut) out('running', last, 3);
    const j = r.json?.job;
    if (!j) out('unknown', undefined, 1);
    last = j;
    if (j.status === 'completed') out('completed', j, 0);
    if (!active(j.status)) out(['failed', 'cancelled'].includes(j.status) ? j.status : 'unknown', j, 1);
    if (j.status === 'running' && Number.isInteger(j.pid) && !alive(j.pid)) {
      // The worker may have finished between the status answer and this check, so ask once more before "gone".
      const again = companion(['status', jobId, '--json'], 30000).json?.job;
      if (again?.status === 'completed') out('completed', again, 0);
      if (again && !active(again.status)) out(['failed', 'cancelled'].includes(again.status) ? again.status : 'unknown', again, 1);
      out('gone', again ?? j, 1);
    }
    await new Promise((res) => setTimeout(res, Math.min(500, Math.max(0, deadline - Date.now()))));
  }
}

if (cmd === 'result') {
  const r = companion(['result', jobId, '--json']);
  const stored = r.json?.storedJob ?? r.json?.job;
  if (!stored) emit({ ok: false, reason: 'failed', threadId: null, touchedFiles: [], output: r.text ?? '' }, 1);
  const output = stored.result?.rawOutput ?? stored.rendered ?? '';
  const threadId = stored.threadId ?? stored.result?.threadId ?? null;
  const base = { threadId, touchedFiles: stored.result?.touchedFiles ?? [], output };
  const fail = (reason) => emit({ ok: false, reason, ...base }, 1);
  if (stored.status !== 'completed') fail('failed');
  if (!output.trim()) fail('empty');
  const first = output.split('\n').find((l) => l.trim() !== '')?.trim();
  if (first !== `Phase ${opts.phase}`) fail('no phase id');
  if (opts.thread !== undefined && threadId !== opts.thread) fail('wrong thread');
  emit({ ok: true, reason: '', ...base }, 0);
}
