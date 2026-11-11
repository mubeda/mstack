#!/usr/bin/env node
// Usage: node lint-wiki.mjs <wiki-folder>
// Reports the mechanical problems of a wiki in the format of references/wiki.md.
// Exit 0: clean. Exit 1: problems reported. Exit 2: no folder given, or the folder has no index.md.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, posix, resolve, sep } from 'node:path';

const root = process.argv[2] && resolve(process.argv[2]);
if (!root || !existsSync(root) || !statSync(root).isDirectory()) {
  console.error('usage: node lint-wiki.mjs <wiki-folder>');
  process.exit(2);
}
if (!existsSync(join(root, 'index.md'))) {
  console.error(`lint-wiki: no index.md in ${root}`);
  process.exit(2);
}

const pages = readdirSync(root, { recursive: true })
  .map((p) => String(p).split(sep).join('/'))
  .filter((p) => p.endsWith('.md') && statSync(join(root, p)).isFile())
  .sort();

const DATED = /^- \d{4}-\d{2}-\d{2}: /;
const CHECKBOX = /^- \[[ xX]\] /;
const SUPERSEDED = /\(superseded \d{4}-\d{2}-\d{2}, see .+\)\s*$/;
const PRESENT = /\b(currently|now|at the moment|at present)\b/i;
// A destination is <in angle brackets>, or has no spaces and at most one level of parentheses.
const LINK = /\[[^\]]*\]\((?:<([^>]+)>|((?:[^()\s]|\([^()\s]*\))+))\)/g;

const problems = [];
const report = (file, line, kind, detail) => problems.push({ file, line, kind, detail });
const linkedFrom = new Map(pages.map((p) => [p, new Set()]));

for (const page of pages) {
  const lines = readFileSync(join(root, page), 'utf8').split(/\r?\n/);
  let fenced = false;
  const prose = lines.map((line) => {
    const fence = /^\s*(```|~~~)/.test(line);
    if (fence) fenced = !fenced;
    return !fence && !fenced;
  });

  // A claim is a top-level list entry and the indented lines after it.
  const superseded = new Set();
  for (let i = 0; i < lines.length; i++) {
    if (!prose[i] || !lines[i].startsWith('- ')) continue;
    let end = i;
    for (let j = i + 1; j < lines.length && prose[j] && (lines[j].trim() === '' || /^\s/.test(lines[j])); j++) {
      if (lines[j].trim() !== '') end = j;
    }
    if (SUPERSEDED.test(lines[end])) for (let j = i; j <= end; j++) superseded.add(j);
    if (page !== 'index.md' && !DATED.test(lines[i]) && !CHECKBOX.test(lines[i])) {
      report(page, i + 1, 'undated-claim', 'a claim starts with "- <yyyy-mm-dd>: "');
    }
  }

  lines.forEach((line, i) => {
    if (!prose[i]) return;
    // Code quoted in backticks, such as `Date.now()`, is not a statement about the present.
    const word = !superseded.has(i) && line.replace(/`[^`]*`/g, '').match(PRESENT);
    if (word) report(page, i + 1, 'present-word', `${word[1].toLowerCase()}: give the date, and the commit for code`);
    for (const [, angled, bare] of line.matchAll(LINK)) {
      const href = (angled ?? bare).split('#')[0];
      if (!href || /^[a-z][a-z0-9+.-]*:/i.test(href)) continue;
      let path = href;
      try { path = decodeURI(href); } catch { /* a malformed escape: look for the name as written */ }
      const target = posix.normalize(posix.join(posix.dirname(page), path));
      if (!existsSync(join(root, target))) report(page, i + 1, 'broken-link', `${href} does not exist`);
      else if (target !== page) linkedFrom.get(target)?.add(page);
    }
  });
}

if (!pages.includes('goal.md')) report('index.md', 1, 'no-goal-page', 'the wiki has no goal.md');
for (const page of pages) {
  if (page === 'index.md') continue;
  const from = linkedFrom.get(page);
  if (from.size === 0) report(page, 1, 'orphan', 'no page links here');
  if (!from.has('index.md')) report(page, 1, 'not-in-index', 'index.md does not list this page');
}

problems.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
for (const p of problems) console.log(`${p.file}:${p.line}  ${p.kind}  ${p.detail}`);
if (problems.length) {
  console.log(`lint-wiki: ${problems.length} problem(s) in ${pages.length} page(s)`);
  process.exit(1);
}
console.log(`lint-wiki: ok (${pages.length} pages)`);
