// Tests for agents/review-lane/agent.md: Antigravity enforces an agent's tool list, and this list keeps
// review-lane from searching the web, asking the user directly, or spawning nested subagents.
// Tool names verified against a person's Antigravity session (2026-11-23):
// read_file, write_file, edit_file, run_command, search_web, ask_question, invoke_subagent, define_subagent.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const file = resolve(dirname(fileURLToPath(import.meta.url)), '../agents/review-lane/agent.md');
const text = () => readFileSync(file, 'utf8');
const frontmatter = () => text().match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';

test('the lane agent exists', () => {
  assert.match(frontmatter(), /^name: review-lane$/m);
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
    if (/^[^\s#-]/.test(line)) break;
    if (/^\s*(#.*)?$/.test(line)) continue;
    const entry = line.match(/^\s*-\s+([A-Za-z0-9_]+)\s*(#.*)?$/);
    assert.ok(entry, `every line of the tools list is one plain entry: ${JSON.stringify(line)}`);
    tools.push(entry[1]);
  }
  return tools;
}

test('its tools are a YAML list of exactly the reading, writing, editing and shell names', () => {
  assert.deepEqual(toolsOf(frontmatter()).sort(), ['edit_file', 'read_file', 'run_command', 'write_file']);
  for (const gap of ['\n', '  # more\n', '\n\n  # more\n\n']) {
    const widened = frontmatter().replace(/(  - run_command\r?\n?)/, `$1${gap}  - search_web\n`);
    assert.ok(toolsOf(widened).includes('search_web'), `an entry after ${JSON.stringify(gap)} is read`);
  }
  assert.throws(() => toolsOf('name: x\ntools:\n  - read_file, write_file\n'), /one plain entry/);
});

test('it names no web, question or subagent tool', () => {
  for (const forbidden of ['search_web', 'ask_question', 'invoke_subagent', 'define_subagent']) {
    assert.doesNotMatch(text(), new RegExp(`\\b${forbidden}\\b`), `must not name ${forbidden}`);
  }
});

test('its frontmatter has no model line', () => {
  assert.ok(frontmatter(), 'the file has frontmatter');
  assert.doesNotMatch(frontmatter(), /^model:/m);
});
