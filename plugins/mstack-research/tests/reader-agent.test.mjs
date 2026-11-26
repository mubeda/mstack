// Tests for agents/antigravity-reader/agent.md: Antigravity enforces an agent's tool list, and this list is the
// only guarantee mstack-research relies on before it hands the reader a page.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const file = resolve(dirname(fileURLToPath(import.meta.url)), '../agents/antigravity-reader/agent.md');
const text = () => readFileSync(file, 'utf8');
const frontmatter = () => text().match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';

test('the Antigravity reader exists', () => {
  assert.match(frontmatter(), /^name: antigravity-reader$/m);
});

// The whole YAML sequence under `tools:`, up to the next key: a blank line or a comment inside the list does
// not end it, so an entry after one is still an entry.
function toolsOf(front) {
  const lines = front.split(/\r?\n/);
  const at = lines.findIndex((line) => /^tools:/.test(line));
  assert.notEqual(at, -1, 'the frontmatter has a tools key');
  assert.equal(lines[at].replace(/^tools:/, '').replace(/#.*$/, '').trim(), '', 'tools is a list, not a one-line value');
  const tools = [];
  for (const line of lines.slice(at + 1)) {
    if (/^[^\s#-]/.test(line)) break; // the next key
    if (/^\s*(#.*)?$/.test(line)) continue;
    const entry = line.match(/^\s*-\s+([A-Za-z0-9_]+)\s*(#.*)?$/);
    assert.ok(entry, `every line of the tools list is one plain entry: ${JSON.stringify(line)}`);
    tools.push(entry[1]);
  }
  return tools;
}

test('its tools are a YAML list of exactly the search and file-reading names', () => {
  assert.deepEqual(toolsOf(frontmatter()).sort(), ['read_file', 'search_web']);
  // The reading must not stop early: an entry after a blank line or a comment is still granted.
  for (const gap of ['\n', '  # more\n', '\n\n  # more\n\n']) {
    const widened = frontmatter().replace(/(  - read_file\r?\n?)/, `$1${gap}  - write_file\n`);
    assert.ok(toolsOf(widened).includes('write_file'), `an entry after ${JSON.stringify(gap)} is read`);
  }
  assert.throws(() => toolsOf('name: x\ntools:\n  - read_file, write_file\n'), /one plain entry/);
});

test('it names no shell tool', () => {
  assert.doesNotMatch(text(), /run_command/);
});

test('its frontmatter has no model line', () => {
  assert.ok(frontmatter(), 'the file has frontmatter');
  assert.doesNotMatch(frontmatter(), /^model:/m);
});
