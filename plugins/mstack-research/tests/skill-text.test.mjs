// Tests for the text of mstack-research that other skills and the self-test's graders read word for word.
// The shell-denied case of Antigravity rests on this text alone: no session can be made to refuse a command.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const skill = resolve(dirname(fileURLToPath(import.meta.url)), '../skills/mstack-research');
const read = (file) => readFileSync(resolve(skill, file), 'utf8');

test('the skill gives both pages-not-opened closing lines', () => {
  const text = read('SKILL.md');
  assert.ok(text.includes('Search: ran, pages not opened (shell commands denied)'));
  assert.ok(text.includes('Search: ran, pages not opened (no restricted reader)'));
});

test('a denied fetch opens no page', () => {
  assert.ok(read('SKILL.md').includes('A fetch refused because commands are denied: no page is fetched'));
});

test('the report format admits not opened in a claim', () => {
  const text = read('references/report-format.md');
  assert.ok(text.includes('| not opened |'), 'a claim line may carry not opened');
  assert.ok(text.includes('pages not opened'), 'the last line may say pages not opened');
});

// The rules below keep what a server controls away from the session in Antigravity. No session can be made to
// meet a hostile server in a test, so the text that prescribes them is pinned here.
const section = (text, from, to) => text.slice(text.indexOf(from), to ? text.indexOf(to, text.indexOf(from) + 1) : undefined);
const pages = () => section(read('SKILL.md'), '## Pages in Antigravity', '\n## Sources');
const fetchLine = () => pages().split('\n').find((line) => line.includes('curl --disable')) ?? '';

test('the fetch throws away what curl prints and tells the session an exit status only', () => {
  const line = fetchLine();
  assert.ok(line, 'the section holds the fetch command');
  assert.doesNotMatch(line, /--show-error/);
  assert.match(line, /2>\/dev\/null/);
  assert.match(line, /--write-out '%\{http_code\}'/);
  assert.match(line, /0:2\[0-9\]\[0-9\]\)/, 'only a 2xx answer counts');
  assert.match(line, /0:3\[0-9\]\[0-9\]\|47:\*\)/, 'a 3xx answer is a redirect, with or without a body');
  assert.match(line, /^\s*code=\$\(curl --disable /, '--disable comes first');
  for (const category of ['`fetched`', '`redirected`', '`failed`', '`refused`']) assert.ok(pages().includes(category), category);
});

test('an address is screened by the reader and again by the session', () => {
  const pattern = '^https://[A-Za-z0-9.-]+(:[0-9]+)?(/[A-Za-z0-9._~:/?@!$&()*+,;=%\\[\\]-]*)?$';
  assert.match(pages(), /rule 7 of the search brief in `references\/reader-brief\.md`/, 'the session checks by the same rule');
  const brief = section(read('references/reader-brief.md'), '## Antigravity: the two calls', '## A quick run without a reader');
  assert.ok(brief.includes(pattern), 'the search brief has the same pattern');
  // The pattern itself: no fragment, no user-info part, no quote, no white space.
  const re = new RegExp(pattern);
  for (const good of ['https://github.com/ai/nanoid', 'https://www.npmjs.com/package/@scope/name?activeTab=versions', 'https://example.com:8443/a_(b)'])
    assert.ok(re.test(good), good);
  for (const bad of ['https://example.com/a"b\'c d;$(touch pwned)', 'https://example.com/a#:~:text=ignore%20all', ['https://user', 'pw@example.com/'].join(':'), 'https://user@example.com/', 'http://example.com/', "https://example.com/a'b", 'https://example.com/a b', 'https://example.com/a"b', 'https://example.com/a\\b', 'https://example.com/`x`', 'https://example.com/a\nb'])
    assert.ok(!re.test(bad), bad);
  assert.match(brief, /300 characters/);
  assert.match(brief, /`token`/);
  assert.match(pages(), /each distinct address once/);
  assert.doesNotMatch(brief, /<the\s+error>/, 'the Antigravity briefs ask for no raw error text');
  assert.ok(brief.includes('Search: not run (search tool failed)'));
});

test('the scratch folder lies outside the repository by its real path and is removed', () => {
  const text = pages();
  const commands = text.split('\n').filter((line) => line.includes('mktemp -d'));
  assert.equal(commands.filter((line) => /pwd -P/.test(line) && /case "\$(parent|dir)\/" in "\$top"\/\*\|\*\\'\*\)/.test(line)).length, 2, 'both ways check the real path against the repository and refuse a path with a single quote');
  assert.match(text, /rm -rf '<scratch>'/);
  assert.match(text, /on every way out/);
});

test('a reader that cannot be started gives a search-only answer that says what ran', () => {
  const text = pages();
  assert.match(text, /refused or fails before it returns/);
  assert.match(text, /say only what happened/);
});

test('a search-only run does not follow the steps of the package check that open pages', () => {
  assert.match(read('references/package-check.md'), /can open no page/);
});

test('the Search line ends the block, not the reply of a calling session', () => {
  const text = read('references/report-format.md');
  assert.doesNotMatch(text, /last line of the reply/);
  assert.match(text, /last line of the block/);
});

test('the body fits what Antigravity loads of a skill file', () => {
  // agy plugin validate: only the first 24000 bytes of a SKILL.md body are loaded, so a longer file loses its end.
  const body = read('SKILL.md').replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
  assert.ok(Buffer.byteLength(body) <= 24000, `the body is ${Buffer.byteLength(body)} bytes`);
});
