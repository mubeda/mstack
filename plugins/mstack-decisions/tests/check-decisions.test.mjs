// Tests for scripts/check-decisions.mjs. Each test builds a throwaway folder with meeting notes and a document and runs the script on it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const script = resolve(dirname(fileURLToPath(import.meta.url)), '../skills/mstack-decisions/scripts/check-decisions.mjs');

const MEETING = [
  '00:01:00 Ana (product lead): we go with option B, the export waits until next quarter',
  '  because the audit needs the invoice list first',
  '00:02:10 Ben: maybe we should drop the mobile view for now',
  '00:03:00 fine, we ship in March then',
  '00:04:00 Ana: Cy from the customer Northwind asked for a download button again',
  '00:05:00 Ben: I will check the invoice export with the billing team',
  '00:05:00 Ana: and I will write to the support lead about it',
  '',
].join('\n');
const DOC = [
  '# Decisions: Portal planning',
  '',
  'Status: Draft',
  'Review: none yet',
  'Source: meeting.txt',
  '',
  '## Decisions',
  '',
  '### 1. Option B: the export waits until next quarter',
  '- Decided by: Ana (product lead)',
  '- Why: the audit needs the invoice list first',
  '- Options set aside: not stated in the notes',
  '> "we go with option B, the export waits until next quarter" @ meeting.txt :: 00:01:00',
  '',
  '## Seems decided, please confirm',
  '',
  '### 1. Drop the mobile view for now',
  '- Question: nobody answered Ben. Is this decided?',
  '> "maybe we should drop the mobile view for now" @ meeting.txt :: 00:02:10',
  '',
  '## Open points',
  '- Who said "we ship in March"? Speaker unclear.',
  '',
  '## Action items',
  '',
  '### 1. Check the invoice export with the billing team',
  '- Owner: Ben',
  '- Date: no date',
  '',
  '## Changes other documents need',
  'None, no document was named.',
  '',
].join('\n');
const Q1 = '> "we go with option B, the export waits until next quarter" @ meeting.txt :: 00:01:00';

function run(doc, { files = {} } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'decisions-'));
  for (const [name, text] of Object.entries({ 'meeting.txt': MEETING, ...files })) if (text !== null) writeFileSync(join(dir, name), text);
  if (doc !== null) writeFileSync(join(dir, 'decisions.md'), doc);
  const r = spawnSync(process.execPath, [script, ...(doc === null ? [] : [join(dir, 'decisions.md')])], { encoding: 'utf8', cwd: dir });
  return { code: r.status, out: r.stdout + r.stderr };
}
const passes = (name, doc, opts) => test(`passes: ${name}`, () => { const r = run(doc, opts); assert.equal(r.code, 0, r.out); assert.match(r.out, /decisions check passed/); });
const fails = (name, doc, pattern, opts) => test(`fails: ${name}`, () => { const r = run(doc, opts); assert.equal(r.code, 1, r.out); assert.match(r.out, pattern, r.out); });
const NO_DECISIONS = DOC.replace(/### 1\. Option B[\s\S]*?(?=## Seems decided)/, 'None, nothing was decided.\n\n').replace(/### 1\. Drop the mobile[\s\S]*?(?=## Open points)/, 'None, nothing was left half decided.\n\n');

passes('a correct document', DOC);
passes('a meeting with no decision and one action item', NO_DECISIONS);
passes('an action item with no owner named and no date', DOC.replace('- Owner: Ben', '- Owner: no owner named'));
passes('a role gap', DOC.replace('## Open points\n', '## Open points\n> "[role: a customer contact] from the customer [role: a customer] asked for a download button again" @ meeting.txt :: 00:04:00\n'));
passes('a quote that runs into a continuation line', DOC.replace(Q1, '> "the export waits until next quarter because the audit needs the invoice list first" @ meeting.txt :: 00:01:00'));
passes('two lines with the same time', DOC.replace(Q1, '> "and I will write to the support lead about it" @ meeting.txt :: 00:05:00'));
passes('a quote line under Open points that matches', DOC.replace('## Open points\n', '## Open points\n> "fine, we ship in March then" @ meeting.txt :: 00:03:00\n'));
passes('no action item', DOC.replace(/### 1\. Check the invoice export[\s\S]*?(?=## Changes)/, 'None, no action was taken on.\n\n'));

fails('one changed word', DOC.replace('we go with option B', 'we go with option C'), /not found at meeting\.txt :: 00:01:00/);
fails('a decision with no quote line', DOC.replace(Q1 + '\n', ''), /Decisions 1.*no quote/);
fails('an entry under Seems decided with no quote line', DOC.replace('> "maybe we should drop the mobile view for now" @ meeting.txt :: 00:02:10\n', ''), /Seems decided.*1.*no quote/);
fails('a quote at the wrong time', DOC.replace(Q1, '> "we go with option B, the export waits until next quarter" @ meeting.txt :: 00:02:10'), /not found/);
fails('a quote line under Open points that does not match', DOC.replace('## Open points\n', '## Open points\n> "fine, we ship in April then, all agreed" @ meeting.txt :: 00:03:00\n'), /not found/);
fails('an action item with no Owner line', DOC.replace('- Owner: Ben\n', ''), /Action items 1.*Owner/);
fails('an action item with no Date line', DOC.replace('- Date: no date\n', ''), /Action items 1.*Date/);
fails('an Owner line with nothing after it', DOC.replace('- Owner: Ben', '- Owner:'), /Action items 1.*Owner/);
fails('None together with an entry', DOC.replace('## Decisions\n', '## Decisions\nNone, nothing decided.\n'), /None.*and.*entr/);
fails('a decisions part with nothing in it', DOC.replace(/### 1\. Option B[\s\S]*?(?=## Seems decided)/, ''), /Decisions.*neither/);
fails('an unnumbered entry heading', DOC.replace('### 1. Option B', '### Option B'), /malformed entry heading/);
fails('an unsupported locator', DOC.replace(Q1, '> "we go with option B, the export waits until next quarter" @ meeting.txt :: minute 1'), /unsupported locator/);
fails('a missing source file', DOC, /meeting\.txt cannot be read/, { files: { 'meeting.txt': null } });
fails('a missing part', DOC.replace('## Open points\n- Who said "we ship in March"? Speaker unclear.\n\n', ''), /missing part.*Open points/);
fails('a repeated part', DOC + '\n## Decisions\nNone, again.\n', /repeated part.*Decisions/);
// Holes found by review.
fails('two Owner lines', DOC.replace('- Owner: Ben', '- Owner: Ben\n- Owner: Cy'), /Action items 1.*exactly one "- Owner/);
fails('an owner line and an empty one', DOC.replace('- Owner: Ben', '- Owner: Ben\n- Owner:'), /Action items 1.*Owner/);
fails('a count that differs from its items', DOC.replace('## Open points\n', '## Open points\n- Count: 2 items\n- Items: meeting.txt :: 00:03:00\n'), /Count says 2.*1/);
fails('a quote above the first part is checked too', DOC.replace('Status: Draft', '> "abcdefghijklmnopqrstuvwxyz" @ absent.txt :: line 1\n\nStatus: Draft'), /absent\.txt cannot be read/);
fails('a time with 60 seconds', DOC.replace(Q1, '> "we go with option B, the export waits until next quarter" @ meeting.txt :: 00:01:60'), /unsupported locator/);
fails('a blank CSV record does not shift the rows', DOC.replace(Q1, '> "abcdefghijklmnopqrstuvwxyz" @ blank.csv :: row 1'), /not found at blank\.csv :: row 1/, { files: { 'blank.csv': 'text\n\nabcdefghijklmnopqrstuvwxyz\n' } });
fails('the same place twice under another spelling of the file', DOC.replace('## Open points\n', '## Open points\n- Count: 2 items\n- Items: meeting.txt :: 00:03:00; ./meeting.txt :: 00:03:00\n'), /listed twice/);
test('many cuts against a repetitive source end quickly', () => {
  const started = Date.now();
  const r = run(DOC.replace(Q1, `> "${'a[...]'.repeat(20)}b" @ rep.txt :: line 1`), { files: { 'rep.txt': 'a'.repeat(40) + '\n' } });
  assert.equal(r.code, 1, r.out);
  assert.ok(Date.now() - started < 5000, 'the check took too long');
});
// Holes found by the second review.
fails('a quote that runs across two CSV fields', DOC.replace(Q1, '> "The invoice export will wait until next quarter" @ f.csv :: row 1'), /not found at f\.csv :: row 1/, { files: { 'f.csv': 'a,b\nThe invoice export will,wait until next quarter\n' } });
fails('one place under two kinds of locator', DOC.replace('## Open points\n', '## Open points\n- Count: 2 items\n- Items: meeting.txt :: 00:03:00; meeting.txt :: line 4\n'), /two kinds of locator/);
fails('a quote line with curly quote marks', DOC.replace(Q1, Q1 + '\n> “This is a claim that nobody ever made” @ meeting.txt :: 00:01:00'), /malformed quote line/);
fails('an action beside a None line', DOC.replace(/### 1\. Check the invoice export[\s\S]*?(?=## Changes)/, 'None, no other actions.\n- Follow up with the team.\n\n'), /Action items.*None.*other/);
fails('an action outside a numbered entry', DOC.replace('## Action items\n', '## Action items\n- Follow up with the team.\n'), /Action items.*outside/);
test('a role gap against a long repetitive source ends quickly', () => {
  const started = Date.now();
  const r = run(DOC.replace(Q1, '> "aaaaaaaaaa[role: person]aaaaaaaaaa" @ rep.txt :: line 1'), { files: { 'rep.txt': 'a'.repeat(100000) + '\n' } });
  assert.equal(r.code, 0, r.out);
  assert.ok(Date.now() - started < 5000, 'the check took too long');
});
fails('a time that is the start of a longer number', DOC.replace(Q1, '> "hello there everyone in the room" @ t.txt :: 00:12'), /does not exist/, { files: { 't.txt': '00:12:99 hello there everyone in the room\n' } });
fails('a pointer to a folder', DOC.replace(Q1, '> "abcdefghijklmnopqrstuvwxyz" @ . :: line 1'), /cannot be read/);
fails('an indented line with curly quote marks', DOC.replace(Q1, Q1 + '\n  > “This is a claim that nobody ever made” @ meeting.txt :: 00:01:00'), /malformed quote line/);
fails('a decision written as a list line outside an entry', DOC.replace('## Decisions\n', '## Decisions\n- We also decided to drop the old portal.\n'), /Decisions.*outside/);
fails('a half decision written as a list line outside an entry', DOC.replace('## Seems decided, please confirm\n', '## Seems decided, please confirm\n- Probably we drop the old portal.\n'), /Seems decided.*outside/);
test('no document path is a usage error', () => { assert.equal(run(null).code, 2); });
