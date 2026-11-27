// Tests for the shape of the mstack-sharpen-prompt skill: size limits, parts, allowed file types,
// offline zero-URL rule, license and notices parity, and key behavioral invariants.
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const skill = resolve(here, '../skills/mstack-sharpen-prompt');
const root = resolve(here, '../../..');
const PARTS = ['reframe', 'sharpen', 'prompt-craft'];
const SOURCES = ['cursor/plugins', 'github/awesome-copilot'];

const read = (rel) => readFileSync(join(skill, rel), 'utf8');
const lines = (rel) => read(rel).replace(/\n$/, '').split('\n').length;

// Every file of the skill outside evals/, as paths relative to the skill folder.
function files() {
  const out = [];
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) { if (relative(skill, p) !== 'evals') walk(p); } else out.push(relative(skill, p));
    }
  };
  walk(skill);
  return out.sort();
}

const ruleText = () => ['SKILL.md', ...PARTS.map((p) => `references/${p}.md`)].map(read).join('\n');

test('(a) SKILL.md exists, has at most 200 lines, and body is at most 24,000 bytes', () => {
  assert.ok(existsSync(join(skill, 'SKILL.md')), 'SKILL.md is missing');
  assert.ok(lines('SKILL.md') <= 200, `${lines('SKILL.md')} lines`);
  const raw = read('SKILL.md');
  const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
  assert.ok(Buffer.byteLength(body, 'utf8') <= 24000, `body is ${Buffer.byteLength(body, 'utf8')} bytes`);
});

test('(b) each reference part exists and has at most 150 lines', () => {
  for (const p of PARTS) {
    const rel = `references/${p}.md`;
    assert.ok(existsSync(join(skill, rel)), `${rel} is missing`);
    assert.ok(lines(rel) <= 150, `${rel}: ${lines(rel)} lines`);
  }
});

test('(c) total Markdown outside evals/ has at most 700 lines', () => {
  const md = files().filter((f) => f.endsWith('.md'));
  assert.ok(md.includes('SKILL.md'), 'SKILL.md is missing');
  const total = md.reduce((n, f) => n + lines(f), 0);
  assert.ok(total <= 700, `${total} lines`);
});

test('(d) SKILL.md names each reference part, and references/ holds no other file', () => {
  const main = read('SKILL.md');
  for (const p of PARTS) assert.ok(main.includes(`references/${p}.md`), `SKILL.md does not name references/${p}.md`);
  assert.deepEqual(readdirSync(join(skill, 'references')).sort(), PARTS.map((p) => `${p}.md`).sort());
});

test('(e) outside evals/ the skill holds only Markdown files and LICENSE', () => {
  const all = files();
  assert.ok(all.includes('SKILL.md'), 'SKILL.md is missing');
  assert.deepEqual(all.filter((f) => !f.endsWith('.md') && f !== 'LICENSE'), []);
});

test('(f) rule text is 100% offline with zero http(s) URLs', () => {
  assert.deepEqual(ruleText().match(/https?:\/\/\S+/g) ?? [], []);
});

test('(g) LICENSE matches the root LICENSE and THIRD_PARTY_NOTICES preserves exact MIT copyright lines', () => {
  assert.ok(readFileSync(join(skill, 'LICENSE')).equals(readFileSync(join(root, 'LICENSE'))));
  const notices = read('THIRD_PARTY_NOTICES.md');
  for (const s of SOURCES) assert.ok(notices.includes(s), `THIRD_PARTY_NOTICES.md missing ${s}`);
  assert.match(notices, /^Copyright \(c\) 2026 Lauren Tan$/m, 'THIRD_PARTY_NOTICES.md missing exact Lauren Tan copyright line');
  assert.match(notices, /^Copyright GitHub, Inc\.$/m, 'THIRD_PARTY_NOTICES.md missing exact GitHub, Inc. copyright line');
  assert.ok(notices.includes('Permission is hereby granted, free of charge'), 'THIRD_PARTY_NOTICES.md missing MIT permission notice');
});

test('(h) SKILL.md has exact two-field frontmatter (LF or CRLF), three modes, read-only boundary, reusable-prompt handling, and one-line offer', () => {
  const main = read('SKILL.md');
  const parseFrontmatter = (text) => {
    const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    assert.ok(m, 'missing YAML frontmatter');
    const keys = [];
    for (const line of m[1].split(/\r?\n/)) {
      const km = line.match(/^([A-Za-z0-9_-]+):/);
      if (km) keys.push(km[1]);
    }
    return { raw: m[1], keys };
  };
  const lf = parseFrontmatter(main);
  const crlf = parseFrontmatter(main.replace(/\r?\n/g, '\r\n'));
  assert.deepEqual(lf.keys, ['name', 'description'], `unexpected frontmatter keys: ${lf.keys.join(', ')}`);
  assert.deepEqual(crlf.keys, ['name', 'description'], 'frontmatter check must accept CRLF checkouts');
  assert.match(lf.raw, /^name:\s*mstack-sharpen-prompt\r?$/m);
  assert.match(lf.raw, /^description:\s*Use when /m);
  assert.match(main, /Mode: reframe/);
  assert.match(main, /Mode: sharpen/);
  assert.match(main, /Mode: both/);
  assert.match(main, /read-only|never execute|do not execute/i, 'SKILL.md must enforce read-only execution boundary');
  assert.match(main, /reusable prompt[^\n]*draft|without[^\n]*draft[^\n]*reusable/i, 'SKILL.md must handle explicit reusable-prompt requests without stopping on no-draft');
  assert.match(main, /credential|secret|token/i, 'SKILL.md must forbid leaking credentials/secrets into the rewritten prompt');
  assert.match(main, /Reply "yes" if you want me to run this prompt now\./, 'SKILL.md must specify the one-line offer');
});

test('(i) reference parts enforce core reframe, sharpen, and prompt-craft invariants', () => {
  const reframe = read('references/reframe.md');
  const sharpen = read('references/sharpen.md');
  const craft = read('references/prompt-craft.md');
  assert.match(reframe, /problem class/i, 'reframe.md must cover problem-class disambiguation');
  assert.match(reframe, /analog/i, 'reframe.md must cover cross-field analogies');
  assert.match(reframe, /breaks/i, 'reframe.md must state where each analogy breaks');
  assert.match(reframe, /never invent|no URL|zero URL|by name only/i, 'reframe.md must forbid invented URLs');
  assert.match(sharpen, /without expanding|same scope|scope/i, 'sharpen.md must deepen without expanding scope');
  assert.match(sharpen, /raw/i, 'sharpen.md must cover rawer source inputs');
  assert.match(sharpen, /objective|external check|verif/i, 'sharpen.md must cover objective external checks');
  assert.match(sharpen, /prototype|experiment/i, 'sharpen.md must separate empirical prototyping from user judgment');
  assert.match(craft, /placeholder/i, 'prompt-craft.md must address avoiding hollow placeholders');
  assert.match(craft, /credential|secret|redact/i, 'prompt-craft.md must prohibit copying credential values into prompts');
  assert.match(craft, /longer than|tilde|non-colliding|more backtick/i, 'prompt-craft.md must prevent outer fence collision with nested code blocks');
});

test('(j) every eval case uses schema_version 1.1 with scaffold_script and prompt settings', () => {
  const evalDir = join(skill, 'evals');
  const cases = readdirSync(evalDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
  assert.ok(cases.length >= 3, 'expected at least 3 eval cases');
  for (const name of cases) {
    const yaml = read(`evals/${name}/case.yaml`);
    const prompt = read(`evals/${name}/prompt.md`);
    assert.match(yaml, /^schema_version:\s*"1\.1"/m, `${name}/case.yaml missing schema_version "1.1"`);
    assert.match(yaml, /^expected_outcome:/m, `${name}/case.yaml missing expected_outcome`);
    assert.match(yaml, /scaffold_script:\s*place-files\.sh/, `${name}/case.yaml missing scaffold_script`);
    assert.match(prompt, /^---\r?\n[\s\S]*?allowed_tools:/, `${name}/prompt.md missing frontmatter settings block`);
  }
});
