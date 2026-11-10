// Tests for scripts/scan-private.mjs. Sample hits are built from parts at run time, so this file
// stores no literal home path, private address, token or email address.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const script = resolve(dirname(fileURLToPath(import.meta.url)), '../skills/mstack-skill-creator/scripts/scan-private.mjs');
const j = (...p) => p.join('');
function scan(text) {
  const dir = mkdtempSync(join(tmpdir(), 'scan-private-'));
  writeFileSync(join(dir, 'notes.md'), text);
  const r = spawnSync(process.execPath, [script, dir], { encoding: 'utf8' });
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
}

test('a clean folder passes', () => {
  const r = scan('Run the tests, then open a pull request.\n');
  assert.equal(r.status, 0, r.out); assert.match(r.out, /private-data scan passed/);
});
test('real home path is a hit', () => {
  const r = scan(`Logs are in ${j('/ho', 'me/', 'alex', '/logs')}.\n`);
  assert.equal(r.status, 1); assert.match(r.out, /HIT .*home path/);
});
test('placeholder path is not a hit', () => {
  const r = scan('Logs are in /home/<name>/logs and ~/logs.\n');
  assert.equal(r.status, 0, r.out);
});
test('a 192.168 address is a hit', () => {
  const r = scan(`Server at ${j('192.', '168.', '4.', '20')}.\n`);
  assert.equal(r.status, 1); assert.match(r.out, /HIT .*private host/);
});
test('127.0.0.1 is not a hit', () => {
  const r = scan('Server at 127.0.0.1 and localhost.\n');
  assert.equal(r.status, 0, r.out);
});
test('a GitHub token shape is a hit and its value is not printed', () => {
  const token = j('gh', 'p_', 'A1b2C3d4E5f6G7h8I9j0K1l2M3n4');
  const r = scan(`token ${token}\n`);
  assert.equal(r.status, 1); assert.match(r.out, /HIT .*credential/);
  assert.ok(!r.out.includes(token), 'the token value must not be printed');
});
test('the word password in prose is not a hit', () => {
  const r = scan('Ask the user for the password, never store it.\n');
  assert.equal(r.status, 0, r.out);
});
test('a real-looking email address is a hit', () => {
  const r = scan(`Contact ${j('alex', '@', 'acme-', 'corp.io')}.\n`);
  assert.equal(r.status, 1); assert.match(r.out, /HIT .*email address/);
});
test('an example.com address is not a hit', () => {
  const r = scan('Contact dev@example.com.\n');
  assert.equal(r.status, 0, r.out);
});

// Added by task 1.4, after the plan review.
test('a Windows home path is a hit', () => {
  const r = scan(`Logs are in ${j('C:', '\\', 'Users', '\\', 'alex', '\\logs')}.\n`);
  assert.equal(r.status, 1); assert.match(r.out, /HIT .*home path/);
});
test('a host name ending in .internal is a hit', () => {
  const r = scan(`Deploy to ${j('build', '.acme', '.inter', 'nal')}.\n`);
  assert.equal(r.status, 1); assert.match(r.out, /HIT .*private host/);
});
test('a token assignment is a hit', () => {
  const r = scan(`${j('tok', 'en')} = ${j('abc', 'def', '123456')}\n`);
  assert.equal(r.status, 1); assert.match(r.out, /HIT .*credential/);
});

// Added after the branch review.
test('a quoted JSON credential is a hit', () => {
  const r = scan(`{"${j('pass', 'word')}": "${j('abcdef', '123456')}"}\n`);
  assert.equal(r.status, 1); assert.match(r.out, /HIT .*credential/);
});
test('a credential after 1 MB of text is still found', () => {
  const r = scan(`${'x'.repeat(1 << 20)}\n${j('pass', 'word')} = ${j('abcdef', '123456')}\n`);
  assert.equal(r.status, 1); assert.match(r.out, /HIT .*credential/);
});
