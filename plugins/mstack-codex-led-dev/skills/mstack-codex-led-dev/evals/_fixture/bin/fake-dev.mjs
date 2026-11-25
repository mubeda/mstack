#!/usr/bin/env node
// Stand-in developer for the dev workflows' eval cases.
// Reads stand-in/rounds.json beside its own bin/ folder, writes the next round's files into cwd, appends one JSON line
// to stand-in/requests.jsonl, and prints the vendor's result shape (JSON for claude, "thread: <id>\n<report>" for codex).
import { appendFileSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const USAGE = 'usage: fake-dev.mjs --vendor <claude|codex> --model <m> --effort <e> [--resume <id>] --prompt-file <file>';
let opts;
try {
  opts = parseArgs({
    args: process.argv.slice(2),
    options: {
      vendor: { type: 'string' },
      model: { type: 'string' },
      effort: { type: 'string' },
      resume: { type: 'string' },
      'prompt-file': { type: 'string' },
    },
    strict: true,
    allowPositionals: false,
  }).values;
} catch (e) {
  console.error(`fake-dev: ${e.message}\n${USAGE}`);
  process.exit(2);
}

if (!['claude', 'codex'].includes(opts.vendor ?? '') || !opts.model || !opts.effort || !opts['prompt-file']) {
  console.error(`fake-dev: missing or invalid option\n${USAGE}`);
  process.exit(2);
}

try {
  const st = statSync(opts['prompt-file']);
  if (!st.isFile()) throw new Error('not a regular file');
  readFileSync(opts['prompt-file'], 'utf8');
} catch (e) {
  console.error(`fake-dev: unreadable --prompt-file ${opts['prompt-file']}: ${e.message}`);
  process.exit(2);
}

const standIn = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'stand-in');
const roundsFile = join(standIn, 'rounds.json');
const requestsFile = join(standIn, 'requests.jsonl');
const rounds = JSON.parse(readFileSync(roundsFile, 'utf8'));
const existing = existsSync(requestsFile) ? readFileSync(requestsFile, 'utf8').trim().split('\n').filter(Boolean).length : 0;
const round = rounds[existing];
if (!round) {
  console.error(`fake-dev: no round ${existing + 1} in ${roundsFile}`);
  process.exit(1);
}

function listFiles(root) {
  const out = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === '.git') continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else out.push(relative(root, full).split(sep).join('/'));
    }
  };
  walk(root);
  return out.sort();
}

const cwd = process.cwd();
const realCwd = realpathSync(cwd);
const withinCwd = (target) => {
  const p = resolve(realCwd, target);
  const rel = relative(realCwd, p);
  if (!rel || rel === '.' || rel.startsWith('..') || rel.startsWith(sep)) return null;
  // Walk every component from realCwd down to target with lstat (catches existing AND dangling symlinks).
  let cur = realCwd;
  for (const part of rel.split(sep)) {
    cur = join(cur, part);
    const st = lstatSync(cur, { throwIfNoEntry: false });
    if (st?.isSymbolicLink()) return null;
  }
  return p;
};
const listing = listFiles(cwd);
const resume = opts.resume ?? null;
const session = round.thread ?? (resume ?? `${opts.vendor === 'claude' ? 'session' : 'thread'}-${existing + 1}`);

const resolvedWrites = [];
for (const f of round.files ?? []) {
  const p = withinCwd(f.path);
  if (!p) {
    console.error(`fake-dev: path escapes workspace: ${f.path}`);
    process.exit(2);
  }
  resolvedWrites.push([p, f.content]);
}
for (const [p, content] of resolvedWrites) {
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content);
}

mkdirSync(standIn, { recursive: true });
appendFileSync(
  requestsFile,
  `${JSON.stringify({
    vendor: opts.vendor,
    model: opts.model,
    effort: opts.effort,
    session,
    resume,
    cwd,
    listing,
    prompt: opts['prompt-file'],
  })}\n`,
);

const report = round.report ?? '';
const failed = round.status === 'failed';

if (opts.vendor === 'claude') {
  const usageKey = round.modelUsageKey ?? opts.model;
  const payload = failed
    ? { result: report, session_id: session, is_error: true, modelUsage: round.modelUsageKey ? { [usageKey]: { inputTokens: 100, outputTokens: 50 } } : {} }
    : { result: report, session_id: session, is_error: false, modelUsage: { [usageKey]: { inputTokens: 100, outputTokens: 50 } } };
  process.stdout.write(`${JSON.stringify(payload)}\n`);
  if (failed) {
    if (report) process.stderr.write(`${report}${report.endsWith('\n') ? '' : '\n'}`);
    process.exit(1);
  }
} else {
  if (failed) {
    if (report) process.stderr.write(`${report}${report.endsWith('\n') ? '' : '\n'}`);
    process.exit(1);
  }
  const body = report ? `${report}${report.endsWith('\n') ? '' : '\n'}` : '';
  process.stdout.write(`thread: ${session}\n${body}`);
}
