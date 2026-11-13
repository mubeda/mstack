// Tests for scripts/check-evidence.mjs. Each test builds a throwaway folder with sources and a document and runs the script on it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const script = resolve(dirname(fileURLToPath(import.meta.url)), '../skills/mstack-evidence/scripts/check-evidence.mjs');

// An invented address, split so the repository's private-data scan does not read it as a real one.
const MAIL = 'jo.park@' + 'example.invalid';
const TICKETS = [
  'id,customer,date,text',
  'T1,acme,2026-10-01,"I had to ask three times for the same invoice, again"',
  'T2,birch,2026-10-02,"Where do I find last month\'s invoice? I looked everywhere."',
  'T3,acme,2026-10-03,"The ""download"" page shows nothing',
  'for March and April [sic] at all."',
  'T4,cedar,2026-10-04,Please add dark mode to the dashboard soon',
  `T5,dune,2026-10-05,"My colleague Jo Park (${MAIL}) could not find the invoice for our audit"`,
  '',
].join('\n');
const NOTES = [
  'Interview one',
  'The finance lead said: every month I spend an hour hunting for invoices.',
  'It is the worst part of closing the books.',
  '',
  '   ',
  'Interview two',
  'We never know where the invoice is.',
  '---',
  'Interview three',
  'Nothing to add about invoices this time around.',
  '',
].join('\n');
const MEETING = [
  '00:01:10 Ana: we looked at the tickets together today',
  '[00:02:30] Ben: the invoice page is hard to find for everyone',
  '  and nobody knows the menu path',
  '03:00 Ana: agreed, let us write it down properly',
  '03:00 Ben: yes, and send it to the whole team',
  '',
].join('\n');
const DOC = [
  '# Evidence: Invoices',
  '',
  'Status: Draft',
  'Review: none yet',
  'Source: tickets.csv, notes.md',
  '',
  '## Sources',
  '- tickets.csv: 5 items (support tickets)',
  '- notes.md: 3 items (interviews)',
  '',
  '## Problems',
  '',
  '### 1. Customers cannot find their invoices',
  '- Who has it: finance contacts',
  '- Count: 3 items',
  '- Items: tickets.csv :: row 1; tickets.csv :: row 2; notes.md :: item 1',
  '- Distinct people: 2 customers and 1 interview',
  '- Strength: medium, 2 customers and two kinds of source',
  '> "I had to ask three times for the same invoice, again" @ tickets.csv :: row 1',
  '> "every month I spend an hour hunting for invoices" @ notes.md :: item 1',
  '',
  '## Not grouped',
  '- Count: 1 items',
  '- Items: tickets.csv :: row 4',
  '',
  '## What this evidence cannot show',
  '- Only people who wrote to support.',
  '',
].join('\n');
const QUOTE1 = '> "I had to ask three times for the same invoice, again" @ tickets.csv :: row 1';

function run(doc, { files = {}, args = [], cwd } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'evidence-'));
  const all = { 'tickets.csv': TICKETS, 'notes.md': NOTES, 'meeting.txt': MEETING, ...files };
  for (const [name, text] of Object.entries(all)) {
    if (text === null) continue;
    mkdirSync(dirname(join(dir, name)), { recursive: true });
    writeFileSync(join(dir, name), text);
  }
  if (doc !== null) writeFileSync(join(dir, 'evidence.md'), doc);
  const r = spawnSync(process.execPath, [script, ...args, ...(doc === null ? [] : [join(dir, 'evidence.md')])], { encoding: 'utf8', cwd: cwd ?? dir });
  return { code: r.status, out: r.stdout + r.stderr, dir };
}
const withQuote = (line) => DOC.replace(QUOTE1, line);
const passes = (name, doc, opts) => test(`passes: ${name}`, () => { const r = run(doc, opts); assert.equal(r.code, 0, r.out); assert.match(r.out, /evidence check passed/); });
const fails = (name, doc, pattern, opts) => test(`fails: ${name}`, () => { const r = run(doc, opts); assert.equal(r.code, 1, r.out); assert.match(r.out, pattern, r.out); });

passes('a correct document', DOC);
test('the pass line counts what was verified', () => { assert.match(run(DOC).out, /2 quotes, 2 counts/); });
passes('a role gap', withQuote('> "My colleague [role: a colleague] could not find the invoice for our audit" @ tickets.csv :: row 5'));
passes('a cut whose pieces are in order', withQuote('> "I had to ask three times [...] invoice, again" @ tickets.csv :: row 1'));
passes('a quote with a quote mark inside, across a line break in a CSV field', withQuote('> "The "download" page shows nothing for March and April" @ tickets.csv :: row 3'));
passes('a literal bracket that is in the source', withQuote('> "for March and April [sic] at all." @ tickets.csv :: row 3'));
passes('a line locator', withQuote('> "every month I spend an hour hunting for invoices" @ notes.md :: line 2'));
passes('an item locator after a white-space line', withQuote('> "We never know where the invoice is." @ notes.md :: item 2'));
passes('an item locator after a --- line', withQuote('> "Nothing to add about invoices this time around." @ notes.md :: item 3'));
passes('a time locator', withQuote('> "we looked at the tickets together today" @ meeting.txt :: 00:01:10'));
passes('a time in square brackets, with a continuation line', withQuote('> "hard to find for everyone and nobody knows the menu path" @ meeting.txt :: 00:02:30'));
passes('a short time form, and two lines with the same time', withQuote('> "yes, and send it to the whole team" @ meeting.txt :: 03:00'));
passes('a source with a byte-order mark and CRLF line ends', DOC, { files: { 'tickets.csv': '﻿' + TICKETS.replace(/\n/g, '\r\n') } });
passes('the same item under two problems', DOC.replace('## Not grouped', ['### 2. Customers ask support for invoices again and again', '- Count: 1 items', '- Items: tickets.csv :: row 1', '- Quotes: none, the first problem quotes this ticket', '', '## Not grouped'].join('\n')));
passes('a problem that says it has no quote', DOC.replace(QUOTE1 + '\n', '').replace('> "every month I spend an hour hunting for invoices" @ notes.md :: item 1', '- Quotes: none, these items are ratings without text'));
passes('no problem at all', DOC.replace(/### 1[\s\S]*?(?=## Not grouped)/, 'None, the items name no problem.\n\n').replace('- Count: 1 items\n- Items: tickets.csv :: row 4', '- Count: 0 items\n- Items: none'));
passes('exactly 20 characters outside gaps', withQuote('> "I had to ask three t[...]" @ tickets.csv :: row 1'));
passes('a role gap of exactly 80 characters', withQuote('> "I had to ask [role: someone] three times for the same invoice, again" @ tickets.csv :: row 1'), { files: { 'tickets.csv': TICKETS.replace('I had to ask three times', 'I had to ask ' + 'x'.repeat(80) + ' three times') } });
passes('a quote inside a fenced block is ignored', DOC.replace('## Not grouped', '```text\n> "this is not a quote of anything real" @ tickets.csv :: row 1\n```\n\n## Not grouped'));
passes('a source found under --sources', DOC, { files: { 'tickets.csv': null, 'src/tickets.csv': TICKETS, 'notes.md': null, 'src/notes.md': NOTES }, args: ['--sources', 'src'] });

fails('one changed word', withQuote('> "I had to ask four times for the same invoice, again" @ tickets.csv :: row 1'), /FAIL .*not found at tickets\.csv :: row 1/);
fails('a different case', withQuote('> "i had to ask three times for the same invoice, again" @ tickets.csv :: row 1'), /not found/);
fails('the wrong row', withQuote('> "I had to ask three times for the same invoice, again" @ tickets.csv :: row 2'), /not found at tickets\.csv :: row 2/);
fails('pieces out of order', withQuote('> "the same invoice, again [...] I had to ask three times" @ tickets.csv :: row 1'), /not found/);
fails('a piece from another row', withQuote('> "I had to ask three times [...] I looked everywhere." @ tickets.csv :: row 1'), /not found/);
fails('19 characters outside gaps', withQuote('> "I had to ask three [...]" @ tickets.csv :: row 1'), /at least 20/);
fails('a role gap that would need 81 characters', withQuote('> "I had to ask [role: someone] three times for the same invoice, again" @ tickets.csv :: row 1'), /not found/, { files: { 'tickets.csv': TICKETS.replace('I had to ask three times', 'I had to ask ' + 'x'.repeat(81) + ' three times') } });
fails('a quote line without a pointer', withQuote('> "I had to ask three times for the same invoice, again"'), /malformed quote line/);
fails('a pointer without a locator', withQuote('> "I had to ask three times for the same invoice, again" @ tickets.csv'), /malformed pointer/);
fails('a count that differs from its items', DOC.replace('- Count: 3 items', '- Count: 4 items'), /Count says 4.*3/);
fails('a Count without Items', DOC.replace('- Items: tickets.csv :: row 1; tickets.csv :: row 2; notes.md :: item 1\n', ''), /Count.*without.*Items/);
fails('an Items without Count', DOC.replace('- Count: 3 items\n', ''), /Items.*without.*Count/);
fails('a malformed Count line', DOC.replace('- Count: 3 items', '- Count: three'), /malformed Count/);
fails('a problem with neither a quote nor a no-quote line', DOC.replace(QUOTE1 + '\n', '').replace('> "every month I spend an hour hunting for invoices" @ notes.md :: item 1\n', ''), /problem 1.*no quote/);
fails('the same item twice in one Items line', DOC.replace('tickets.csv :: row 2; notes.md', 'tickets.csv :: row 1; notes.md'), /listed twice/);
fails('the same item twice under another spelling of the file', DOC.replace('tickets.csv :: row 2; notes.md', './tickets.csv :: row 1; notes.md'), /listed twice/);
fails('a pointer to a missing file', DOC.replace('notes.md :: item 1\n- Distinct', 'gone.md :: item 1\n- Distinct'), /gone\.md.*cannot be read/);
fails('a row past the end', DOC.replace('- Items: tickets.csv :: row 4', '- Items: tickets.csv :: row 9'), /row 9.*does not exist/);
fails('row 0', DOC.replace('- Items: tickets.csv :: row 4', '- Items: tickets.csv :: row 0'), /malformed pointer|bad number/);
fails('row x', DOC.replace('- Items: tickets.csv :: row 4', '- Items: tickets.csv :: row x'), /malformed pointer|bad number/);
fails('an unsupported locator', withQuote('> "I had to ask three times for the same invoice, again" @ tickets.csv :: page 3'), /unsupported locator/);
fails('a time no line starts with', withQuote('> "we looked at the tickets together today" @ meeting.txt :: 00:09:00'), /does not exist/);
fails('a missing part', DOC.replace('## Not grouped\n- Count: 1 items\n- Items: tickets.csv :: row 4\n\n', ''), /missing part.*Not grouped/);
fails('a repeated part', DOC + '\n## Sources\n- again\n', /repeated part.*Sources/);
fails('an unnumbered entry heading', DOC.replace('### 1. Customers', '### Customers'), /malformed entry heading/);
fails('None together with an entry', DOC.replace('## Problems\n', '## Problems\nNone, nothing found.\n'), /None.*and.*entr/);
fails('a Problems part with nothing in it', DOC.replace(/### 1[\s\S]*?(?=## Not grouped)/, ''), /Problems.*neither/);
// Holes found by review: each of these once passed and must fail (or once failed and must pass).
const SMALL = (items, quote) => DOC.replace(/## Problems[\s\S]*?(?=## What this evidence)/, ['## Problems', '', '### 1. A problem', `- Count: ${items.split('; ').length} items`, `- Items: ${items}`, quote, '', '## Not grouped', '- Count: 0 items', '- Items: none', '', ''].join('\n'));
fails('a blank CSV record does not shift the rows', SMALL('blank.csv :: row 1', '> "abcdefghijklmnopqrstuvwxyz" @ blank.csv :: row 1'), /not found at blank\.csv :: row 1/, { files: { 'blank.csv': 'text\n\nabcdefghijklmnopqrstuvwxyz\n' } });
passes('the row after a blank CSV record', SMALL('blank.csv :: row 2', '> "abcdefghijklmnopqrstuvwxyz" @ blank.csv :: row 2'), { files: { 'blank.csv': 'text\n\nabcdefghijklmnopqrstuvwxyz\n' } });
fails('one item under two spellings that --sources makes the same file', SMALL('s.txt :: line 1; src/s.txt :: line 1', '> "one single line of source text" @ s.txt :: line 1'), /listed twice/, { files: { 'src/s.txt': 'one single line of source text\n' }, args: ['--sources', 'src'] });
fails('a quote above the first part is checked too', DOC.replace('Status: Draft', '> "abcdefghijklmnopqrstuvwxyz" @ absent.txt :: line 1\n\nStatus: Draft'), /absent\.txt cannot be read/);
test('many cuts against a repetitive source end quickly', () => {
  const started = Date.now();
  const r = run(SMALL('rep.txt :: line 1', `> "${'a[...]'.repeat(20)}b" @ rep.txt :: line 1`), { files: { 'rep.txt': 'a'.repeat(40) + '\n' } });
  assert.equal(r.code, 1, r.out);
  assert.ok(Date.now() - started < 5000, 'the check took too long');
});
passes('a very long exact quote', SMALL('long.txt :: line 1', `> "${'x'.repeat(100000)}" @ long.txt :: line 1`), { files: { 'long.txt': 'x'.repeat(100000) + '\n' } });
passes('a tilde fence is ignored', DOC.replace('## Not grouped', '~~~text\n> "this is not a quote of anything real" @ absent.txt :: line 1\n~~~\n\n## Not grouped'));
passes('a four-backtick fence that holds three backticks is ignored', DOC.replace('## Not grouped', '````text\n```\n> "this is not a quote of anything real" @ absent.txt :: line 1\n```\n````\n\n## Not grouped'));
fails('a time with 60 minutes or seconds', withQuote('> "agreed, let us write it down properly" @ meeting.txt :: 00:60'), /unsupported locator/);
fails('a time with one square bracket', withQuote('> "we looked at the tickets together today" @ meeting.txt :: [00:01:10'), /unsupported locator/);
fails('a count of 0 with a bare Items line', DOC.replace('- Count: 1 items\n- Items: tickets.csv :: row 4', '- Count: 0 items\n- Items:'), /nothing after the colon/);
test('a mismatch is not rescued by a file of the same name in the current folder', () => {
  const other = mkdtempSync(join(tmpdir(), 'evidence-cwd-'));
  writeFileSync(join(other, 'tickets.csv'), TICKETS.replace('three times', 'four times'));
  const r = run(withQuote('> "I had to ask four times for the same invoice, again" @ tickets.csv :: row 1'), { cwd: other });
  assert.equal(r.code, 1, r.out);
});
// Holes found by the second review.
fails('a quote that runs across two CSV fields', SMALL('f.csv :: row 1', '> "The invoice export will wait until next quarter" @ f.csv :: row 1'), /not found at f\.csv :: row 1/, { files: { 'f.csv': 'a,b\nThe invoice export will,wait until next quarter\n' } });
fails('one item under two kinds of locator', SMALL('one.csv :: row 1; one.csv :: line 2', '> "abcdefghijklmnopqrstuvwxyz" @ one.csv :: row 1'), /two kinds of locator/, { files: { 'one.csv': 'text\nabcdefghijklmnopqrstuvwxyz\n' } });
fails('a quote line with curly quote marks', DOC.replace(QUOTE1, QUOTE1 + '\n> “This is a claim that nobody ever made” @ tickets.csv :: row 1'), /malformed quote line/);
fails('None with more lines under it', DOC.replace(/### 1[\s\S]*?(?=## Not grouped)/, 'None, the items name no problem.\n- A problem that nobody counted.\n\n'), /Problems.*None.*other/);
test('a role gap against a long repetitive source ends quickly', () => {
  const started = Date.now();
  const r = run(SMALL('rep.txt :: line 1', '> "aaaaaaaaaa[role: person]aaaaaaaaaa" @ rep.txt :: line 1'), { files: { 'rep.txt': 'a'.repeat(100000) + '\n' } });
  assert.equal(r.code, 0, r.out);
  assert.ok(Date.now() - started < 5000, 'the check took too long');
});
fails('a time that is the start of a longer number', SMALL('t.txt :: 00:12', '> "hello there everyone in the room" @ t.txt :: 00:12'), /does not exist/, { files: { 't.txt': '00:12:99 hello there everyone in the room\n' } });
fails('a pointer to a folder', SMALL('dir :: line 1', '> "abcdefghijklmnopqrstuvwxyz" @ dir :: line 1'), /dir cannot be read/, { files: { 'dir/x.txt': 'x\n' } });
fails('an indented line with curly quote marks', DOC.replace(QUOTE1, QUOTE1 + '\n  > “This is a claim that nobody ever made” @ tickets.csv :: row 1'), /malformed quote line/);
fails('a problem written as a list line outside an entry', DOC.replace('## Problems\n', '## Problems\n- Nobody can log in at all, says everyone.\n'), /Problems.*outside/);
test('no document path is a usage error', () => { assert.equal(run(null).code, 2); });
