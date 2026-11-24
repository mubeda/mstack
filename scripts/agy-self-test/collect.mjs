#!/usr/bin/env node
// Collects one self-test batch after the person's Antigravity session has ended: copies the session's transcript and,
// per case, the transcript and record of every subagent below it into <out>/results/transcripts/, read-only (the full
// transcript where the client saved one, else the short one; the run log says which), and
// writes <out>/results/run-log.md. It only reads under the Antigravity data folder, starts no session (its one
// program is `agy --version`), and judges nothing: it lists names, ids and models for a grader.
import { parseArgs } from 'node:util';
import { spawnSync } from 'node:child_process';
import { chmodSync, copyFileSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';

function usage(message) {
  console.error(`collect: ${message}\nusage: node scripts/agy-self-test/collect.mjs --out <batch folder> [--gemini-dir <dir>]`);
  process.exit(2);
}
let o;
try { o = parseArgs({ options: { out: { type: 'string' }, 'gemini-dir': { type: 'string' } } }).values; } catch (e) { usage(e.message); }
if (!o.out) usage('--out is required');
if (o.out.split(/[\\/]/).includes('..')) usage(`--out holds a .. segment, so its spelling and its real path can differ: ${o.out}`);
const out = resolve(o.out);
const json = (path) => { try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return null; } };
// Ids come from files a session wrote and become folder names here, so only plain names are followed.
const plain = (id) => typeof id === 'string' && /^[\w-][\w.-]*$/.test(id);
const expected = json(join(out, 'EXPECTED.json'));
if (!Array.isArray(expected?.cases) || !expected.cases.every((c) => plain(c?.id))) usage(`no readable EXPECTED.json in ${out}`);

const gemini = resolve(o['gemini-dir'] ?? join(homedir(), '.gemini'));
const brain = join(gemini, 'antigravity-cli', 'brain');
const real = (p) => { try { return realpathSync(p); } catch { return null; } };
const within = (p, dir) => p === dir || p.startsWith(dir + sep);
const realGemini = real(gemini) ?? gemini;
if (within(real(out) ?? out, realGemini)) usage(`--out is inside the client's data folder ${gemini}, where the collector never writes`);
// A saved file is read only where its real path stays in the client's data folder: a link must not pull another file in.
const outside = (path) => { const at = real(path); return at && !within(at, realGemini) ? `${path} is outside the client's data folder` : null; };
const transcript = (id) => join(brain, id, '.system_generated', 'logs', 'transcript.jsonl');
// The client saves a short transcript, which can cut a long argument value, and often a full one beside it. A grader
// reads paths and command lines from the arguments, so the full one is the copy whenever it exists and is not empty.
function source(id) {
  const full = join(dirname(transcript(id)), 'transcript_full.jsonl');
  return statSync(full, { throwIfNoEntry: false })?.size ? full : transcript(id);
}
const results = join(out, 'results'), copies = join(results, 'transcripts');
const runLog = join(results, 'run-log.md'), batchRoot = join(results, 'batch-root.txt');
// Every write stays in the real results folder: a link there could point anywhere, the data folder included.
for (const p of [results, copies, runLog, batchRoot]) {
  if (lstatSync(p, { throwIfNoEntry: false })?.isSymbolicLink()) { console.error(`collect: ${p} is a link, and the collector writes only into the real results folder`); process.exit(1); }
}

const agy = spawnSync('agy', ['--version'], { encoding: 'utf8' });
const agyVersion = agy.status === 0 ? agy.stdout.trim().split('\n')[0] : '';

const session = json(join(results, 'session.json'));
const sid = plain(session?.session_id) ? session.session_id : null;
const known = (v) => typeof v === 'string' && v !== '' && v !== 'unknown';
const sessionFound = sid !== null && existsSync(source(sid));

// Copies one saved file read-only; returns why it could not, or null.
function copy(from, to) {
  if (!existsSync(from)) return null;
  const away = outside(from);
  if (away) return away;
  try {
    mkdirSync(dirname(to), { recursive: true });
    copyFileSync(from, to);
    chmodSync(to, 0o444);
    return null;
  } catch (e) { return `cannot copy ${from}: ${e.code ?? e.message}`; }
}

// The models and tool names of one transcript, which file it was read from, or the reason it cannot stand as evidence.
function read(id) {
  const kind = source(id) === transcript(id) ? 'short' : 'full';
  let text, cut = false;
  const away = outside(source(id));
  if (away) return { model: '', tools: '', from: '', reason: away };
  try { text = readFileSync(source(id), 'utf8'); } catch { return { model: '', tools: '', from: '', reason: 'no transcript' }; }
  const models = new Set(), tools = new Set();
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    let step;
    try { step = JSON.parse(line); } catch { return { model: '', tools: '', from: kind, reason: 'transcript unreadable' }; }
    if (kind === 'short' && Array.isArray(step?.truncated_fields) && step.truncated_fields.length) cut = true;
    if (typeof step?.model === 'string' && step.model) models.add(step.model);
    if (Array.isArray(step?.tool_calls)) for (const call of step.tool_calls) tools.add(String(call?.name));
  }
  return { model: [...models].join(', '), tools: [...tools].join(', '), from: cut ? 'short, arguments may be cut' : kind, reason: models.size ? null : 'transcript names no model' };
}

// The subagent records in one conversation's own subagents/ folder, in the order they were started, and why the folder
// cannot be read (a missing folder means no subagents).
function records(id) {
  const dir = join(brain, id, '.system_generated', 'subagents');
  let found = [];
  try { found = readdirSync(dir); } catch (e) { if (e.code !== 'ENOENT') return Object.assign([], { reason: `cannot read ${dir}: ${e.code ?? e.message}` }); }
  return found.filter((n) => n.endsWith('.json')).map((n) => {
    const file = join(dir, n), away = outside(file), record = away ? null : json(file);
    return { file, id: plain(record?.conversationId) ? record.conversationId : n.slice(0, -5), record, reason: away };
  }).filter((r) => plain(r.id)).sort((a, b) => (a.record?.spawnStepIndex ?? 0) - (b.record?.spawnStepIndex ?? 0) || a.id.localeCompare(b.id));
}

// Copies every subagent below one conversation; returns the first reason one of them cannot stand as evidence, or null.
const nested = [];
function below(parent, caseId, seen) {
  const list = records(parent);
  let reason = list.reason ?? null;
  for (const r of list) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    const name = `subagent-${seen.size}`;
    const record = copy(r.file, join(copies, caseId, `${name}.json`)), text = copy(source(r.id), join(copies, caseId, `${name}.jsonl`));
    const t = read(r.id);
    nested.push([caseId, name, r.record?.conversationId ?? '', r.record?.spawnStepIndex ?? '', r.record?.subagentDescriptor?.typeName ?? '', r.record?.subagentDescriptor?.role ?? '', t.model, t.tools, t.from]);
    const deeper = below(r.id, caseId, seen);
    reason ??= record ?? text ?? (t.reason && `${name}: ${t.reason}`) ?? deeper;
  }
  return reason;
}

mkdirSync(results, { recursive: true });
rmSync(copies, { recursive: true, force: true }); // an earlier run's copies are read-only
// The first collection knows the path the session used; a later one may run on an archived copy.
if (!existsSync(batchRoot)) writeFileSync(batchRoot, `${out}\n`);
const sessionCopy = sessionFound ? copy(source(sid), join(copies, 'session.jsonl')) : null;
const top = sessionFound ? records(sid) : [];
const rows = expected.cases.map((c) => {
  if (!sessionFound) return [c.id, '', '', '', 'not run: no session transcript', ''];
  if (sessionCopy) return [c.id, '', '', '', `not run: session transcript: ${sessionCopy}`, ''];
  const meta = json(join(results, c.id, 'meta.json'));
  // A record that is not valid JSON matches no case; one outside the data folder matches by its file name and is reported.
  const r = c.self ? null : top.find((x) => x.record?.subagentDescriptor?.role === c.id) ?? top.find((x) => (x.record || x.reason) && x.id === meta?.subagent_id);
  const id = c.self ? sid : r?.id;
  let t = { model: '', tools: '', from: '', reason: 'no subagent record' }, why = null;
  if (id) {
    why = r?.reason ?? copy(source(id), join(copies, c.id, 'session.jsonl'));
    t = read(id);
    const deeper = below(id, c.id, new Set());
    why ??= t.reason ?? deeper;
  } else why = top.reason ?? t.reason;
  // A reply counts only as a plain file of its own, never through a link.
  const reason = !lstatSync(join(results, c.id, 'reply.md'), { throwIfNoEntry: false })?.isFile() ? 'no reply saved' : !meta ? 'no meta.json' : why;
  return [c.id, id ?? '', t.model, t.tools, reason ? `not run: ${reason}` : 'complete', t.from];
});

const table = (head, lines) => [head, head.map(() => '---'), ...lines].map((cells) => `| ${cells.map((v) => String(v).replaceAll('|', '\\|')).join(' | ')} |`).join('\n');
writeFileSync(runLog, `# Self-test run log

- Batch: ${expected.batch ?? 'unknown'}
- Date: ${new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)} (the local day of this collection)
- Session: ${sid ?? 'unknown'}
- Session transcript: ${sessionFound ? sessionCopy ?? read(sid).from : 'not found'}
- Model: ${known(session?.model) ? session.model : 'unknown'}
- Client version: ${known(session?.client_version) ? session.client_version : agyVersion ? `${agyVersion} (from agy --version)` : 'unknown'}
- Mode: ${known(session?.mode) ? session.mode : 'unknown'}

${table(['Case', 'Subagent', 'Model', 'Tools', 'State', 'Transcript'], rows)}

## Subagents below each case

${table(['Case', 'Subagent', 'conversationId', 'spawnStepIndex', 'typeName', 'role', 'Model', 'Tools', 'Transcript'], nested)}
`);

const complete = rows.filter((r) => r[4] === 'complete').length;
console.log(`collected: ${complete} complete, ${rows.length - complete} not run`);
if (!sessionFound) {
  console.error(`session transcript not found: ${sid ? transcript(sid) : join(results, 'session.json')}`);
  process.exit(1);
}
if (sessionCopy) {
  console.error(`session transcript not copied: ${sessionCopy}`);
  process.exit(1);
}
