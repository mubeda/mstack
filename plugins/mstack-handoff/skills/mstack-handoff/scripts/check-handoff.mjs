#!/usr/bin/env node
// Check a handoff file written from references/handoff-template.md.
//   node check-handoff.mjs <handoff-file>            when writing: the file must match the repository now
//   node check-handoff.mjs <handoff-file> --resume   when resuming: check the file, then report what changed
//   node check-handoff.mjs --fingerprint <repo>      print the working-tree fingerprint for the identity line
// The fingerprint hashes `git diff --binary HEAD` plus every untracked, non-ignored file, so it changes when
// uncommitted content changes even if `git status` looks the same. On a detached HEAD the identity line says
// "Branch: (detached)". Exits 1 on any problem, 2 on a usage error or when --fingerprint cannot read the repository,
// 0 otherwise.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const git = (cwd, ...a) => { const r = spawnSync('git', ['-C', cwd, ...a], { encoding: 'utf8', maxBuffer: 1 << 30 }); r.stdout ??= ''; return r; };
// Throws when git cannot answer, so a wrong path or a repository without commits never yields a fingerprint.
function fingerprint(repo) {
  const hash = createHash('sha256');
  const diff = spawnSync('git', ['-C', repo, 'diff', '--binary', 'HEAD'], { maxBuffer: 1 << 30 });
  const untracked = git(repo, 'ls-files', '-o', '--exclude-standard', '-z');
  if (diff.status !== 0 || untracked.status !== 0) {
    throw new Error(`git cannot read ${repo} (not a repository, no commit yet, or git is missing): ${String(diff.stderr || diff.error?.message || untracked.stderr || '').trim().split('\n')[0]}`);
  }
  hash.update(diff.stdout);
  for (const path of untracked.stdout.split('\0').filter(Boolean).sort()) {
    hash.update(`\0${path}\0`);
    try { hash.update(readFileSync(resolve(repo, path))); } catch { hash.update('unreadable'); }
  }
  return hash.digest('hex').slice(0, 16);
}
if (args[0] === '--fingerprint') {
  if (!args[1]) { console.error('usage: node check-handoff.mjs --fingerprint <repo>'); process.exit(2); }
  try { console.log(fingerprint(args[1])); } catch (e) { console.error(e.message); process.exit(2); }
  process.exit(0);
}
const file = args.find((a) => !a.startsWith('--'));
const resume = args.includes('--resume');
if (!file) { console.error('usage: node check-handoff.mjs <handoff-file> [--resume] | --fingerprint <repo>'); process.exit(2); }
const problems = [];
const fail = (msg) => problems.push(msg);
if (!existsSync(file)) { console.log(`FAIL  ${file} does not exist`); process.exit(1); }
const text = readFileSync(file, 'utf8');
if (!text.trim()) { console.log(`FAIL  ${file} is empty`); process.exit(1); }

// Structure: title, identity line, then the sections in template order with "Start here" first.
if (!/^# Handoff: \S/m.test(text)) fail('missing the "# Handoff: <description>" title');
const id = text.match(/^Repository: (.+?) \| Branch: (.+?) \| HEAD: ([0-9a-f]{40}) \| Tree: ([0-9a-f]{16}) \| Written: (\S.*)$/m);
if (!id) fail('missing or malformed identity line "Repository: <path> | Branch: <name> | HEAD: <40-hex SHA> | Tree: <16-hex fingerprint> | Written: <time>"');
const order = ['Start here', 'Goal', 'State', 'Scope', 'Gates', 'Decisions', 'Gotchas', 'Suggested skills', 'If the state changed'];
const found = [...text.matchAll(/^## (.+?)\s*$/gm)].map((m) => m[1]);
for (const h of order) if (!found.includes(h)) fail(`missing section "## ${h}"`);
const seen = found.filter((h) => order.includes(h));
if (seen.join('|') !== order.filter((h) => found.includes(h)).join('|')) fail(`sections out of order: ${seen.join(', ')}`);
if (found[0] !== 'Start here') fail('"## Start here" must be the first section');

// Every section has content: text, or "None" with its reason.
const section = (name) => text.split(new RegExp(`^## ${name}\\s*$`, 'm'))[1]?.split(/^## /m)[0] ?? '';
for (const h of order) if (found.includes(h) && !section(h).trim()) fail(`section "## ${h}" is empty; write its content, or "None" and the reason`);

// Gates: a green gate carries its command, the SHA it ran at, and its result line, and it ran at the identity HEAD.
// On resume a gate at another SHA is reported as due instead of failing, because earlier versions allowed it.
const dueOnResume = [];
for (const line of section('Gates').split('\n').filter((l) => /^\s*[-*]\s*\**Green\**\s*:/i.test(l))) {
  const at = line.match(/\bat ([0-9a-f]{7,40})\b/);
  if (!/`[^`]+`/.test(line) || !at || !/result:/i.test(line)) {
    fail(`green gate without a command, "at <SHA>" and "result:": ${line.trim().slice(0, 90)}`);
  } else if (id && !id[3].startsWith(at[1]) && resume) {
    dueOnResume.push(`gate    DUE: ran at ${at[1]}, not at the recorded HEAD ${id[3].slice(0, 12)}: ${line.trim().slice(0, 90)}`);
  } else if (id && !id[3].startsWith(at[1])) {
    fail(`green gate ran at ${at[1]}, not at the identity HEAD ${id[3].slice(0, 12)}; run it again or list it as due: ${line.trim().slice(0, 90)}`);
  }
}

// Template placeholders left behind, inside code spans too, because the template's commands carry them.
// The list comes from the template itself, so a placeholder added there is checked here.
let placeholders = ['<command>', '<branch>', '<full SHA>', '<path>', '<this file>', '<repository root>'];
try {
  const template = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '..', 'references', 'handoff-template.md'), 'utf8');
  const block = template.split(/^````markdown\s*$/m)[1]?.split(/^````\s*$/m)[0] ?? '';
  placeholders = [...new Set([...placeholders, ...(block.match(/<[^<>\n]+>/g) ?? [])])];
} catch { fail('cannot read references/handoff-template.md next to this script, so only the basic placeholders were checked'); }
const left = placeholders.filter((p) => text.includes(p));
if (left.length) fail(`unfilled placeholder${left.length > 1 ? 's' : ''}: ${left.join(', ')} (if one is real content, such as an HTML tag or a usage string, reword it)`);

// Secrets: common token shapes and key=value assignments. Name secrets, never paste their values.
// After a colon the value must hold a digit, so prose such as "password: stored in the vault" passes. A value that
// starts with $ or < names a variable or a placeholder, not a secret. The keyword may end a longer name (DB_PASSWORD).
const secrets = [
  [/\bgh[pousr]_[A-Za-z0-9]{20,}/, 'GitHub token'], [/\bgithub_pat_[A-Za-z0-9_]{20,}/, 'GitHub token'],
  [/\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{20,}/, 'API key'], [/\bAKIA[0-9A-Z]{16}\b/, 'AWS access key'],
  [/\bxox[abprs]-[A-Za-z0-9-]{10,}/, 'Slack token'], [/\bAIza[0-9A-Za-z_-]{35}\b/, 'Google API key'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'private key'], [/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\./, 'JWT'],
  [/(?<![A-Za-z0-9])(?:password|passwd|secret|token|api[_-]?key)\s*=\s*["']?(?![$<])[^\s"'`]{6,}/i, 'credential assignment'],
  [/(?<![A-Za-z0-9])(?:password|passwd|secret|token|api[_-]?key)["']?\s*:\s*["']?(?![$<])(?=[^\s"'`]*\d)[^\s"'`]{6,}/i, 'credential assignment'],
  [/:\/\/[^\s/:@]+:[^\s/@]+@/, 'URL with embedded credentials'],
];
text.split('\n').forEach((line, i) => {
  for (const [re, what] of secrets) if (re.test(line)) fail(`line ${i + 1} looks like a ${what}; refer to secrets by name only`);
});

// Live checks: the identity line matches the repository, and the file cannot be committed by accident.
// On resume, report what changed instead of failing, so the file's own "If the state changed" rules apply.
if (id) {
  const [, repo, branch, head, tree] = id;
  let now = null;
  if (!existsSync(repo)) fail(`repository path ${repo} does not exist`);
  else {
    try {
      now = { tree: fingerprint(repo), branch: git(repo, 'branch', '--show-current').stdout.trim() || '(detached)', head: git(repo, 'rev-parse', 'HEAD').stdout.trim() };
    } catch (e) { fail(e.message); }
  }
  if (now && resume) {
    console.log(`branch  ${now.branch === branch ? 'same' : `CHANGED ${branch} -> ${now.branch}`}`);
    const ancestor = now.head !== head && git(repo, 'merge-base', '--is-ancestor', head, now.head).status === 0;
    console.log(`HEAD    ${now.head === head ? 'same' : `CHANGED ${head.slice(0, 12)} -> ${now.head.slice(0, 12)} (${ancestor ? 'moved forward' : 'not a descendant: history was rewritten'})`}`);
    console.log(`tree    ${now.tree === tree ? 'same' : 'CHANGED: the uncommitted work differs, so every gate is due'}`);
    for (const d of dueOnResume) console.log(d);
  } else if (now) {
    if (now.branch !== branch) fail(`identity branch ${branch} differs from the repository's current branch ${now.branch}`);
    if (now.head !== head) fail(`identity HEAD ${head.slice(0, 12)} differs from the repository's HEAD ${now.head.slice(0, 12)}`);
    if (now.tree !== tree) fail('identity Tree fingerprint differs from the working tree now; the uncommitted work changed after you took it, so take it again and re-check the gates');
    const rel = relative(repo, resolve(file));
    if (!rel.startsWith('..') && !isAbsolute(rel) && git(repo, 'check-ignore', '-q', rel).status !== 0) {
      fail(`${rel} is inside the repository and not ignored, so it could be committed; write it outside the repository`);
    }
  }
}

for (const p of problems) console.log(`FAIL  ${p}`);
if (problems.length) process.exit(1);
console.log(`handoff check passed: ${file}`);
