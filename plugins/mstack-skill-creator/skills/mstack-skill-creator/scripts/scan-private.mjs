#!/usr/bin/env node
// Scan every text file below a folder for data that must not reach a public repository:
// home paths, private hosts, credential shapes and email addresses. Names of people and
// companies cannot be found by a pattern; SKILL.md tells the agent to read for those.
//   node scan-private.mjs <folder>
// Prints "HIT  <file>:<line>: <kind>" per finding, never the matched value. Exits 0 with no hit,
// 1 with any hit, 2 on a usage error. Uses no dependency.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.argv[2];
if (!root) { console.error('usage: node scan-private.mjs <folder>'); process.exit(2); }
const hits = [];

// A placeholder in angle brackets, such as /home/<name>/, is an example and never a hit.
const patterns = [
  ['home path', /(?:\/home\/|\/Users\/|[A-Za-z]:\\Users\\)(?!<)[A-Za-z][\w.-]*/],
  ['private host', /\b(?:10\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])|192\.168)\.\d{1,3}\.\d{1,3}\b/],
  ['private host', /\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:internal|corp|lan|local)\b/i],
  ['credential', /\bgh[pousr]_[A-Za-z0-9]{20,}|\bgithub_pat_[A-Za-z0-9_]{20,}/],
  ['credential', /\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{20,}|\bAKIA[0-9A-Z]{16}\b|\bxox[abprs]-[A-Za-z0-9-]{10,}|\bAIza[0-9A-Za-z_-]{35}\b/],
  ['credential', /-----BEGIN [A-Z ]*PRIVATE KEY-----|\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\./],
  ['credential', /\b(?:password|passwd|secret|token|api[_-]?key)["']?\s*[:=]\s*["']?[^\s"'`<]{6,}/i],
  ['credential', /:\/\/[^\s/:@]+:[^\s/@]+@/],
];
const EMAIL = /\b[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+)\b/g;
const SAFE_EMAIL = /^(?:example\.(?:com|org|net)|users\.noreply\.github\.com)$/i;

function scanFile(path) {
  const buf = readFileSync(path);
  if (buf.includes(0)) return; // binary
  buf.toString('utf8').split(/\r?\n/).forEach((line, i) => {
    const at = `${relative(root, path) || path}:${i + 1}`;
    const kinds = new Set();
    for (const [kind, re] of patterns) if (re.test(line)) kinds.add(kind);
    for (const m of line.matchAll(EMAIL)) if (!SAFE_EMAIL.test(m[1]) && !/^noreply@/i.test(m[0])) kinds.add('email address');
    for (const kind of kinds) hits.push(`${at}: ${kind}`);
  });
}
function walk(d) {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    if (e.name === '.git' || e.name === 'node_modules') continue;
    const p = join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.isFile()) scanFile(p);
  }
}
statSync(root).isDirectory() ? walk(root) : scanFile(root);
for (const h of hits) console.log(`HIT  ${h}`);
if (hits.length) process.exit(1);
console.log(`private-data scan passed: ${root}`);
