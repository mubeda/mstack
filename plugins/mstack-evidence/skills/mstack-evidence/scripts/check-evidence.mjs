#!/usr/bin/env node
// Check an evidence document against its sources: every quote is at its place, every count equals its listed items.
//   node check-evidence.mjs [--sources <folder>] <evidence.md>
// A source file is looked for under the document's folder, then under --sources, then under the current folder;
// the first that exists is used, and a quote that does not match there fails (no other file is tried).
// Prints "FAIL  <where>: <what>" per problem, then a pass line. Exits 1 when a check failed, 2 on a usage error.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const KIND = 'evidence';
const PARTS = ['Sources', 'Problems', 'Not grouped', 'What this evidence cannot show'];

const args = process.argv.slice(2);
let sourcesDir = null;
let docPath = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--sources' && args[i + 1]) sourcesDir = args[++i];
  else if (!args[i].startsWith('--') && !docPath) docPath = args[i];
  else { console.error(`unknown option: ${args[i]}`); process.exit(2); }
}
if (!docPath || !existsSync(docPath)) {
  console.error(`usage: node check-${KIND}.mjs [--sources <folder>] <${KIND}.md>`);
  process.exit(2);
}

const problems = [];
const fail = (where, what) => problems.push(`FAIL  ${where}: ${what}`);
const clean = (text) => text.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
const fold = (text) => text.replace(/\s+/g, ' ').trim();
const docDir = dirname(resolve(docPath));

// ---- sources -------------------------------------------------------------------------------------------------------
const sources = new Map();
function source(file) {
  const roots = [docDir, sourcesDir && resolve(sourcesDir), process.cwd()].filter(Boolean);
  const path = roots.map((r) => resolve(r, file)).find((p) => existsSync(p) && statSync(p).isFile());
  if (!path) return null;
  if (!sources.has(path)) sources.set(path, { path, text: clean(readFileSync(path, 'utf8')) });
  return sources.get(path);
}
// CSV with quoted fields, doubled quote marks and line breaks inside a field. Returns records of fields.
function csv(text) {
  const records = [];
  let field = '', record = [], quoted = false, started = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"' && field === '') { quoted = true; started = true; }
    else if (c === ',') { record.push(field); field = ''; started = true; }
    else if (c === '\n') { record.push(field); records.push(record); field = ''; record = []; started = false; }
    else { field += c; started = true; }
  }
  if (started || field !== '') { record.push(field); records.push(record); }
  return records;
}
// A time at the start of a line: hh:mm:ss or mm:ss, in square brackets or not (never half of them). Seconds, and minutes
// after hours, are below 60; the minutes of mm:ss may run to 99. More digits or a colon right after it make it no time.
const TIME = /^(?:\[(\d{1,2}):([0-5]\d)(?::([0-5]\d))?\]|(\d{1,2}):([0-5]\d)(?::([0-5]\d))?(?![\]:\d]))/;
const seconds = (m) => {
  const [a, b, c] = m[1] !== undefined ? [m[1], m[2], m[3]] : [m[4], m[5], m[6]];
  return c === undefined ? Number(a) * 60 + Number(b) : Number(a) * 3600 + Number(b) * 60 + Number(c);
};
// The text a pointer names, or null when that place does not exist. A CSV row gives its fields one by one,
// so a quote has to sit inside one field and cannot be built from two.
function passage(src, loc) {
  if (loc.kind === 'row') {
    src.rows ??= csv(src.text);
    return loc.n < src.rows.length ? src.rows[loc.n] : null;
  }
  const lines = src.text.split('\n');
  if (loc.kind === 'line') return loc.n <= lines.length && !(loc.n === lines.length && lines.at(-1) === '') ? lines[loc.n - 1] : null;
  if (loc.kind === 'item') {
    const blocks = [];
    let block = [];
    for (const l of lines) {
      if (/^\s*$/.test(l) || l.trim() === '---') { if (block.length) blocks.push(block.join('\n')); block = []; } else block.push(l);
    }
    if (block.length) blocks.push(block.join('\n'));
    return loc.n <= blocks.length ? blocks[loc.n - 1] : null;
  }
  const found = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(TIME);
    if (!m || seconds(m) !== loc.n) continue;
    const chunk = [lines[i]];
    while (i + 1 < lines.length && !TIME.test(lines[i + 1])) chunk.push(lines[++i]);
    found.push(chunk.join('\n'));
  }
  return found.length ? found.join('\n') : null;
}

// ---- pointers and quotes -------------------------------------------------------------------------------------------
// "<file> :: <locator>" -> { file, loc, key } or { error }.
function pointer(text) {
  const at = text.indexOf(' :: ');
  if (at < 1) return { error: `malformed pointer "${text}" (expected "<file> :: <locator>")` };
  const file = text.slice(0, at).trim();
  const raw = text.slice(at + 4).trim();
  let loc = null;
  const num = raw.match(/^(row|line|item) (\S+)$/);
  const time = raw.match(new RegExp(`${TIME.source}$`));
  if (num) {
    if (!/^[1-9]\d*$/.test(num[2])) return { error: `malformed pointer "${text}": bad number "${num[2]}"` };
    loc = { kind: num[1], n: Number(num[2]) };
  } else if (time) loc = { kind: 'time', n: seconds(time) };
  else return { error: `unsupported locator "${raw}" in "${text}" (use row <n>, line <n>, item <n> or a time)` };
  return { file, loc, text };
}
// The passage of a pointer, with failures reported. Returns null when it cannot be read.
// It also sets p.key, the identity of the item: the file that was really read, and the place.
function locate(where, p) {
  const src = source(p.file);
  if (!src) { fail(where, `${p.file} cannot be read`); return null; }
  p.key = `${src.path}|${p.loc.kind}|${p.loc.n}`;
  const text = passage(src, p.loc);
  if (text === null) { fail(where, `${p.text} does not exist in the source`); return null; }
  return text;
}
const GAP = /\[\.\.\.\]|\[role: [^[\]]*\]/g;
// Every index at which piece starts in text.
function starts(text, piece) {
  const out = [];
  if (piece === '') { for (let i = 0; i <= text.length; i++) out.push(i); return out; }
  for (let i = text.indexOf(piece); i !== -1; i = text.indexOf(piece, i + 1)) out.push(i);
  return out;
}
// True when the quote is in the passage: pieces in order, a cut spans anything, a role gap spans 1 to 80 characters.
// It walks the pieces once and keeps every place the text so far can end, so it needs no backtracking.
function matches(quote, text) {
  const q = fold(quote);
  const t = fold(text);
  const gaps = q.match(GAP) ?? [];
  const pieces = q.split(GAP);
  let ends = starts(t, pieces[0]).map((i) => i + pieces[0].length);
  for (let k = 1; k < pieces.length && ends.length; k++) {
    const cut = gaps[k - 1] === '[...]';
    const next = [];
    // ends and the starts below both rise, so the window of ends that can fit only moves forward.
    let lo = 0;
    for (const at of starts(t, pieces[k])) {
      let ok = cut && ends[0] <= at;
      if (!cut) {
        // A role gap of 1 to 80 code points is at most 160 UTF-16 units.
        while (lo < ends.length && at - ends[lo] > 160) lo++;
        for (let j = lo; !ok && j < ends.length && ends[j] < at; j++) ok = [...t.slice(ends[j], at)].length <= 80;
      }
      if (ok) next.push(at + pieces[k].length);
    }
    ends = next;
  }
  return ends.length > 0;
}
let quotesOk = 0, countsOk = 0;
// The locator kind each source file is counted by: two kinds could name one item twice.
const countedBy = new Map();
function checkQuote(where, line) {
  const end = line.lastIndexOf('" @ ');
  if (end < 3) { fail(where, `malformed quote line (expected > "<quote>" @ <file> :: <locator>): ${line.slice(0, 60)}`); return; }
  const quote = line.slice(3, end);
  const p = pointer(line.slice(end + 4));
  if (p.error) { fail(where, p.error); return; }
  const outside = [...fold(quote).replace(GAP, '')].length;
  if (outside < 20) { fail(where, `the quote at ${p.text} has ${outside} characters outside gaps; it needs at least 20`); return; }
  const text = locate(where, p);
  if (text === null) return;
  if ([].concat(text).some((t) => matches(quote, t))) quotesOk++;
  else fail(where, `quote not found at ${p.text}: "${quote.slice(0, 60)}"`);
}
function checkCount(where, countLine, itemsLine) {
  const c = countLine.match(/^- Count: (0|[1-9]\d*) items$/);
  if (!c) { fail(where, `malformed Count line: ${countLine}`); return; }
  if (itemsLine === undefined || !itemsLine.startsWith('- Items:')) { fail(where, 'a Count line without an Items line right after it'); return; }
  const list = itemsLine.slice('- Items:'.length).trim();
  if (list === '') { fail(where, 'an Items line with nothing after the colon (write "none" for no item)'); return; }
  const pointers = list === 'none' ? [] : list.split('; ').map((t) => pointer(t.trim()));
  let ok = true;
  const seen = new Set();
  for (const p of pointers) {
    if (p.error) { fail(where, p.error); ok = false; continue; }
    if (locate(where, p) === null) { ok = false; continue; }
    if (seen.has(p.key)) { fail(where, `${p.text} is listed twice`); ok = false; }
    seen.add(p.key);
    const file = p.key.slice(0, p.key.indexOf('|'));
    if (!countedBy.has(file)) countedBy.set(file, p.loc.kind);
    else if (countedBy.get(file) !== p.loc.kind) { fail(where, `${p.file} is counted by two kinds of locator (${countedBy.get(file)} and ${p.loc.kind}); use one kind per file in Items lists`); ok = false; }
  }
  if (Number(c[1]) !== pointers.length) { fail(where, `Count says ${c[1]} and Items lists ${pointers.length}`); ok = false; }
  if (ok) countsOk++;
}

// ---- the document --------------------------------------------------------------------------------------------------
const raw = clean(readFileSync(docPath, 'utf8')).split('\n');
// Blank out fenced blocks, so an example in the document is never read as content.
// A fence opens with three or more backticks or tildes and closes with at least as many of the same character.
let fence = null;
const lines = raw.map((l) => {
  const m = l.match(/^\s*(`{3,}|~{3,})/);
  if (!fence && m) { fence = m[1]; return ''; }
  if (fence && m && m[1][0] === fence[0] && m[1].length >= fence.length && l.trim() === m[1]) { fence = null; return ''; }
  return fence ? '' : l;
});

const parts = new Map();
// Lines before the first part are checked like any other, so a quote cannot hide there.
const preamble = [];
let part = null, entry = null;
lines.forEach((l, i) => {
  if (l.startsWith('## ')) {
    const name = l.slice(3).trim();
    if (parts.has(name)) fail(`line ${i + 1}`, `repeated part "${name}"`);
    part = { name, lines: [], entries: [], none: false };
    parts.set(name, part);
    entry = null;
  } else if (l.startsWith('### ')) {
    const m = l.match(/^### ([1-9]\d*)\. \S/);
    if (!m) fail(`line ${i + 1}`, `malformed entry heading (expected "### <n>. <text>"): ${l}`);
    entry = { name: `${part?.name ?? 'document'} ${m ? m[1] : '?'}`, lines: [] };
    part?.entries.push(entry);
  } else if (!part) preamble.push(l);
  else {
    (entry ?? part).lines.push(l);
    if (!entry && /^None\b/.test(l.trim())) part.none = true;
  }
});
for (const name of PARTS) if (!parts.has(name)) fail('document', `missing part "## ${name}"`);

// Quote and count lines of one block of lines. Returns how many quote lines and counts it held.
function checkLines(where, block) {
  let quotes = 0, counts = 0, noQuote = false;
  for (let i = 0; i < block.length; i++) {
    const l = block[i];
    if (l.startsWith('> "')) { quotes++; checkQuote(where, l); }
    else if (l.trimStart().startsWith('>')) fail(where, `malformed quote line (expected > "<quote>" @ <file> :: <locator>, with straight quote marks): ${l.slice(0, 60)}`);
    else if (l.startsWith('- Count:')) { counts++; checkCount(where, l, block[i + 1]); if (block[i + 1]?.startsWith('- Items:')) i++; }
    else if (l.startsWith('- Items:')) fail(where, 'an Items line without a Count line right before it');
    else if (l.startsWith('- Quotes:')) { if (/^- Quotes: none, \S/.test(l)) noQuote = true; else fail(where, `malformed Quotes line (expected "- Quotes: none, <reason>"): ${l}`); }
  }
  return { quotes, counts, noQuote };
}
checkLines('before the first part', preamble);
for (const p of parts.values()) {
  const own = checkLines(p.name, p.lines);
  const perEntry = p.entries.map((e) => ({ e, ...checkLines(e.name.replace(/^Problems /, 'problem '), e.lines) }));
  if (p.name === 'Problems') {
    if (p.none && p.entries.length) fail('Problems', 'a None line and entries together');
    if (p.none && p.lines.filter((l) => l.trim() !== '').length > 1) fail('Problems', 'a None line with other lines under it');
    if (!p.none && p.lines.some((l) => /^\s*([-*+]|\d+[.)])\s/.test(l))) fail(p.name, 'a list line outside a numbered entry');
    if (!p.none && !p.entries.length) fail('Problems', 'neither an entry nor a line that starts with None');
    for (const r of perEntry) {
      const where = r.e.name.replace(/^Problems /, 'problem ');
      if (r.counts !== 1) fail(where, `expected exactly one Count, found ${r.counts}`);
      if (!r.quotes && !r.noQuote) fail(where, 'no quote line and no "- Quotes: none, <reason>" line');
    }
  }
  if (p.name === 'Not grouped' && own.counts !== 1) fail('Not grouped', `expected exactly one Count, found ${own.counts}`);
}
if (!problems.length && quotesOk + countsOk === 0) fail('document', 'nothing was verified');

for (const p of problems) console.log(p);
if (problems.length) process.exit(1);
console.log(`${KIND} check passed: ${quotesOk} quotes, ${countsOk} counts`);
