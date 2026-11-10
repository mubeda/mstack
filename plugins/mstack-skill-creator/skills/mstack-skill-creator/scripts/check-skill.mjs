#!/usr/bin/env node
// Check one skill folder against the rules in references/writing-rules.md that a script can decide.
//   node check-skill.mjs <skill-folder>
// Prints "FAIL  <message>" per failure and "WARN  <message>" per warning, then a pass line.
// Exits 0 with no failure, 1 with any failure, 2 on a usage error. Uses no dependency.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join, resolve, sep } from 'node:path';

const dir = process.argv[2];
if (!dir) { console.error('usage: node check-skill.mjs <skill-folder>'); process.exit(2); }
const fails = [];
const warns = [];
const fail = (m) => fails.push(m);
const warn = (m) => warns.push(m);
const HOST_TOOLS = ['AskUserQuestion', 'codex exec', 'claude -p', 'opencode run', 'cursor-agent'];

function finish() {
  for (const m of fails) console.log(`FAIL  ${m}`);
  for (const m of warns) console.log(`WARN  ${m}`);
  if (fails.length) process.exit(1);
  console.log(`skill check passed: ${dir}`);
  process.exit(0);
}

const skillPath = join(dir, 'SKILL.md');
if (!existsSync(skillPath)) { fail('SKILL.md is missing'); finish(); }
const text = readFileSync(skillPath, 'utf8');

// Frontmatter: a closed --- block at the top. Top-level "key: value" lines, quoted values, and
// block scalars (">", ">-", "|", "|-") with indented lines. Nested maps are kept as raw text.
// shortcut: not a full YAML parser; it rejects the plain-scalar forms YAML itself rejects.
const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
if (!fm) { fail('SKILL.md must open with a frontmatter block closed by a "---" line'); finish(); }
const fields = new Map();
const fmLines = fm[1].split(/\r?\n/);
for (let i = 0; i < fmLines.length; i++) {
  const m = fmLines[i].match(/^([A-Za-z][\w-]*):[ \t]*(.*)$/);
  if (!m) continue;
  const [, key, raw] = m;
  let value = raw.trim();
  if (/^[>|][+-]?$/.test(value)) {
    const block = [];
    while (i + 1 < fmLines.length && (/^\s+\S/.test(fmLines[i + 1]) || fmLines[i + 1].trim() === '')) block.push(fmLines[++i].trim());
    value = value.startsWith('>') ? block.filter(Boolean).join(' ') : block.join('\n').trim();
  } else if (/^(["']).*\1$/.test(value)) {
    value = value.slice(1, -1);
  } else if (/: |\s#/.test(value)) {
    fail(`frontmatter "${key}" is not valid YAML: quote the value, or use a ">-" block, because it contains ": " or " #"`);
  }
  fields.set(key, value);
}
const name = fields.get('name');
if (!name) fail('frontmatter has no name');
else {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) fail(`name "${name}" must be lowercase letters, digits and single hyphens`);
  if (name.length > 64) fail(`name is ${name.length} characters, at most 64 allowed`);
  if (name !== basename(resolve(dir))) fail(`name "${name}" must equal the folder name "${basename(resolve(dir))}"`);
}
const description = fields.get('description');
if (!description) fail('frontmatter has no description');
else {
  if (description.length > 1024) fail(`description is ${description.length} characters, at most 1024 allowed`);
  if (!description.startsWith('Use when')) fail('description must start with "Use when"');
}
for (const key of fields.keys()) {
  if (key !== 'name' && key !== 'description') warn(`frontmatter field "${key}" is host-only or optional; say which hosts ignore it`);
}

// Files the text names must exist, at any depth and with an optional "./" in front. As in the mstack
// marketplace check, a path after "/", ">", ".", "-" or a word character (such as `<skill>/scripts/x.py`)
// is an example and skipped.
const refDir = join(dir, 'references');
const refs = existsSync(refDir) ? readdirSync(refDir).filter((f) => f.endsWith('.md')) : [];
const texts = [['SKILL.md', text], ...refs.map((f) => [`references/${f}`, readFileSync(join(refDir, f), 'utf8')])];
for (const [where, body] of texts) {
  for (const [, sub, file] of body.matchAll(/(?<![\w/>.-])(?:\.\/)?(references|scripts)\/((?:[\w.-]+\/)*[\w.-]+\.\w+)\b/g)) {
    const target = resolve(dir, sub, file);
    if (!target.startsWith(resolve(dir) + sep)) fail(`${where} names ${sub}/${file}, which points outside the skill folder`);
    else if (!existsSync(target)) fail(`${where} names ${sub}/${file}, which is not in the skill folder`);
  }
  for (const [, path] of body.matchAll(/(?:\]\(|`)(\.\.\/[^)`\s]*)/g)) fail(`${where} points outside the skill folder: ${path}`);
}

// No second SKILL.md below the folder: an install would load it as another skill.
function nested(d) {
  const out = [];
  for (const e of readdirSync(d, { withFileTypes: true })) {
    if (e.name === '.git' || e.name === 'node_modules') continue;
    const p = join(d, e.name);
    if (e.isDirectory()) out.push(...nested(p));
    else if (e.name === 'SKILL.md' && d !== dir) out.push(p);
  }
  return out;
}
for (const p of nested(dir)) fail(`nested SKILL.md at ${p}; name test data SKILL.md.fixture`);

// Host tools are named only in the host table, so the rest of the file works on every host.
const lines = text.split(/\r?\n/);
lines.forEach((line, i) => {
  if (/^\s*\|/.test(line)) return;
  for (const tool of HOST_TOOLS) if (line.includes(tool)) fail(`SKILL.md:${i + 1} names the host tool "${tool}" outside the host table`);
});
if (lines.length > 500) warn(`SKILL.md has ${lines.length} lines; move detail into references/ (aim for under 500)`);

finish();
