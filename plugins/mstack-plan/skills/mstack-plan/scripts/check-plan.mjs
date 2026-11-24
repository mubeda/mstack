#!/usr/bin/env node
// Lint an mstack-plan folder against references/plan-format.md: structure, task fields (including optional
// Approved models lines), writer/executor records, valid Executor values, start-file workflows and placeholders.
//   node check-plan.mjs <plan-folder>
// Prints one line per problem and exits 1 when there is any, 0 when the plan passes.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2];
if (!dir) { console.error('usage: node check-plan.mjs <plan-folder>'); process.exit(2); }
const problems = [];
const tasks = new Map();
const fail = (msg) => problems.push(msg);
const read = (name) => (existsSync(join(dir, name)) ? readFileSync(join(dir, name), 'utf8') : null);
// Prose checks skip fenced code and inline code, where generics and literal text are legitimate.
const prose = (text) => text.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
const field = (block, name) => block.match(new RegExp(`^- ${name}:[ \\t]*(.*)$`, 'm'))?.[1].trim() ?? null;

const spec = read('spec.md');
const plan = read('plan.md');
const progress = read('progress.md');
const execute = read('execute-plan.md');
for (const [name, text] of [['spec.md', spec], ['plan.md', plan], ['progress.md', progress], ['execute-plan.md', execute]]) {
  if (text === null) fail(`missing ${name}`);
}
const phaseDir = join(dir, 'phases');
const phaseNames = existsSync(phaseDir) ? readdirSync(phaseDir).filter((f) => f.endsWith('.md')).sort() : [];
const phaseFiles = phaseNames.filter((f) => /^PHASE-\d{2}-[a-z0-9-]+\.md$/.test(f));
if (!phaseFiles.length) fail('no phase files named phases/PHASE-NN-<slug>.md');
// A misnamed phase file would be skipped, and its tasks with it, so it is an error, never ignored.
for (const f of phaseNames) if (!phaseFiles.includes(f)) fail(`phases/${f}: name must be PHASE-NN-<slug>.md (two digits, then lowercase letters, digits and hyphens)`);
if (problems.length) finish();

// plan.md
for (const h of ['Goal', 'Global constraints', 'Review focus', 'Out of scope', 'Sources', 'Stack and commands',
  'Phases', 'File map', 'Traceability', 'End-to-end verification', 'Decisions']) {
  if (!new RegExp(`^## ${h}\\s*$`, 'm').test(plan)) fail(`plan.md: missing section "## ${h}"`);
}
const DATE = '\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])';
const STATUS = `(Draft|Approved ${DATE})(?![\\w-])`;
const APPROVAL_SHAPE = new RegExp(`^- Approved models: [^\\s,()<>]+(, [^\\s,()<>]+)* \\(user, (${DATE})\\)$`);
const isValidDate = (str) => {
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
};
const hasToken = (text, name) => new RegExp(`(?<![\\w-])${name.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}(?![\\w-])`).test(text);
const VENDORS = ['claude', 'codex', 'antigravity', 'other'];
const SIX_WORKFLOWS = [
  'mstack-claude-led-review',
  'mstack-codex-led-review',
  'mstack-antigravity-led-review',
  'mstack-claude-led-dev',
  'mstack-codex-led-dev',
  'mstack-antigravity-led-dev',
];
const EXECUTORS = [
  'none',
  'inline',
  'mstack-codex-review-workflow',
  'mstack-claude-review-workflow',
  'mstack-claude-pm-codex-dev',
  ...SIX_WORKFLOWS,
];
const validVendors = (value) => {
  if (value === 'unknown') return true;
  const items = value.split(',').map((s) => s.trim());
  return items.length > 0 && items.every((v) => VENDORS.includes(v)) && new Set(items).size === items.length;
};
const planStatus = plan.match(new RegExp(`^Status: ${STATUS}`, 'm'))?.[1];
if (!planStatus) fail('plan.md: Status line must be "Draft" or "Approved <yyyy-mm-dd>"');

// Requirements from the spec, and their traceability rows in the plan.
const reqs = [...spec.matchAll(/^#{2,4}\s*(R\d+)\b/gm)].map((m) => m[1]);
if (!reqs.length) fail('spec.md: no requirement headings like "### R1. <name>"');
const traceSection = plan.split(/^## Traceability\s*$/m)[1]?.split(/^## /m)[0] ?? '';
const traceRows = new Map([...traceSection.matchAll(/^\|\s*(R\d+)\s*\|\s*([^|]*)\|/gm)].map((m) => [m[1], m[2].trim()]));

// Phases and tasks.
for (const file of phaseFiles) {
  const text = readFileSync(join(phaseDir, file), 'utf8');
  const phase = Number(file.slice(6, 8));
  const where = `phases/${file}`;
  if (!new RegExp(`^# Phase ${phase}: \\S`, 'm').test(text)) fail(`${where}: first heading must be "# Phase ${phase}: <title>"`);
  const head = text.split(/^### Task /m)[0];
  for (const f of ['Goal', 'Round', 'Depends on', 'Owns', 'Checkpoint']) if (!field(head, f)) fail(`${where}: missing "- ${f}:" line`);
  if (!plan.includes(`phases/${file}`)) fail(`plan.md: Phases table does not list phases/${file}`);
  const blocks = text.split(/^(?=### Task )/m).slice(1);
  if (!blocks.length) fail(`${where}: no "### Task ${phase}.<n>: <title>" headings`);
  for (const block of blocks) {
    const m = block.match(/^### Task (\d+)\.(\d+): (\S.*)$/m);
    if (!m) { fail(`${where}: bad task heading "${block.split('\n')[0]}"`); continue; }
    const id = `${m[1]}.${m[2]}`;
    const at = `${where} task ${id}`;
    if (Number(m[1]) !== phase) fail(`${at}: ID belongs to phase ${m[1]}, not ${phase}`);
    if (tasks.has(id)) fail(`${at}: duplicate task ID`);
    for (const f of ['Satisfies', 'Depends on', 'Files', 'Skills', 'Tier', 'TDD', 'Done when']) if (!field(block, f)) fail(`${at}: missing "- ${f}:" line`);
    const done = field(block, 'Done when') ?? '';
    if (done && !/`[^`]+`/.test(done) && !/observ/i.test(done)) fail(`${at}: Done when needs a command in backticks or an observable result`);
    const tdd = field(block, 'TDD') ?? '';
    if (tdd && !/^(red-green|exempt \(.+\))$/.test(tdd)) fail(`${at}: TDD must be "red-green" or "exempt (<reason>)"`);
    const firstFail = block.search(/Expected:\s*FAIL/i);
    const lastPass = [...block.matchAll(/Expected:\s*PASS/gi)].at(-1)?.index ?? -1;
    if (tdd === 'red-green' && !(firstFail >= 0 && lastPass > firstFail)) {
      fail(`${at}: red-green task needs a step with "Expected: FAIL" before one with "Expected: PASS"`);
    }
    if (/^-?\s*\d+\.\s*\[[ x]\]/m.test(block) === false) fail(`${at}: no checkbox steps ("1. [ ] ...")`);
    // A step is its checkbox line plus the indented lines under it, so "Expected:" may sit on the next line.
    // It is a command step when the word "run" (outside code) is followed by a code span: "Run `npm test`".
    const lines = block.split('\n');
    const isStep = (l) => /^\d+\.\s*\[[ x]\]/.test(l.trim());
    for (let i = 0; i < lines.length; i++) {
      if (!isStep(lines[i])) continue;
      let step = lines[i];
      for (let j = i + 1; j < lines.length && /^\s+\S/.test(lines[j]) && !isStep(lines[j]); j++) step += `\n${lines[j]}`;
      const runsCommand = /\brun\b[^\u0001]*\u0001/i.test(step.replace(/`[^`\n]+`/g, '\u0001'));
      if (runsCommand && !/Expected:/.test(step)) fail(`${at}: command step without an "Expected:" line: ${lines[i].trim().slice(0, 70)}`);
    }
    const tier = field(block, 'Tier') ?? '';
    if (tier && !/^(cheap|standard|most capable)$/.test(tier)) fail(`${at}: Tier must be cheap, standard or most capable`);
    const blockLines = block.split(/\r?\n/);
    const tierIndex = blockLines.findIndex((l) => /^- Tier:[ \t]*/.test(l));
    const approvalIndexes = [];
    let fenceChar = null;
    let fenceLen = 0;
    for (let i = 0; i < blockLines.length; i++) {
      const fence = blockLines[i].match(/^([`~]{3,})(.*)$/);
      if (fence) {
        if (!fenceChar) { fenceChar = fence[1][0]; fenceLen = fence[1].length; continue; }
        if (fence[1][0] === fenceChar && fence[1].length >= fenceLen && !fence[2].trim()) { fenceChar = null; fenceLen = 0; continue; }
      }
      if (fenceChar) continue;
      if (/^-\s*approved models?\b/i.test(blockLines[i])) approvalIndexes.push(i);
    }
    if (approvalIndexes.length > 1) fail(`${at}: more than one Approved models line`);
    for (const idx of approvalIndexes) {
      const m = blockLines[idx].match(APPROVAL_SHAPE);
      if (!m || !isValidDate(m[2])) {
        fail(`${at}: Approved models line must be "- Approved models: <model>[, <model>] (user, <yyyy-mm-dd>)"`);
      }
    }
    if (approvalIndexes.length >= 1 && tierIndex >= 0 && approvalIndexes[0] !== tierIndex + 1) {
      fail(`${at}: Approved models line must come directly after the Tier line`);
    }
    const sat = field(block, 'Satisfies') ?? '';
    tasks.set(id, { at, deps: (field(block, 'Depends on') ?? '').match(/\b\d+\.\d+\b/g) ?? [], reqs: sat.match(/\bR\d+\b/g) ?? [], support: /support/i.test(sat) });
  }
  for (const word of ['TBD', 'handle edge cases', 'as appropriate', 'add appropriate']) {
    if (prose(text).toLowerCase().includes(word.toLowerCase())) fail(`${where}: contains "${word}", which decides nothing`);
  }
}

// Dependencies exist and form no cycle.
for (const [id, t] of tasks) for (const d of t.deps) if (!tasks.has(d)) fail(`${t.at}: depends on unknown task ${d}`);
const state = new Map();
const visit = (id, path) => {
  if (state.get(id) === 'done') return;
  if (state.get(id) === 'open') { fail(`dependency cycle: ${[...path, id].join(' -> ')}`); return; }
  state.set(id, 'open');
  for (const d of tasks.get(id)?.deps ?? []) if (tasks.has(d)) visit(d, [...path, id]);
  state.set(id, 'done');
};
for (const id of tasks.keys()) visit(id, []);

// Coverage: every requirement has a traceability row and a task, and every task serves a requirement.
const covered = new Set([...tasks.values()].flatMap((t) => t.reqs));
for (const r of reqs) {
  const row = traceRows.get(r);
  if (row === undefined) fail(`plan.md: Traceability has no row for ${r}`);
  if (!covered.has(r) && !/not planned/i.test(row ?? '')) fail(`${r}: no task lists it under Satisfies, and Traceability does not say "not planned: <reason>"`);
}
for (const [, t] of tasks) {
  for (const r of t.reqs) if (!reqs.includes(r)) fail(`${t.at}: satisfies ${r}, which spec.md does not define`);
  if (!t.reqs.length && !t.support) fail(`${t.at}: Satisfies names no requirement and is not marked "support"`);
}

// Traceability rows name only tasks that exist.
for (const [r, row] of traceRows) {
  if (/not planned/i.test(row)) continue;
  for (const id of row.match(/\b\d+\.\d+\b/g) ?? []) if (!tasks.has(id)) fail(`plan.md: Traceability row ${r} names task ${id}, which no phase file defines`);
}

// progress.md matches the tasks and the spec. The hash is over the file's bytes, like sha256sum.
const sha = createHash('sha256').update(readFileSync(join(dir, 'spec.md'))).digest('hex').slice(0, 12);
const specLine = progress.match(/^Spec: .*sha256 ([0-9a-f]{12})/m)?.[1];
if (specLine !== sha) fail(`progress.md: Spec line sha256 ${specLine ?? '(none)'} does not match spec.md (${sha})`);
const rows = [...progress.matchAll(/^\|\s*(\d+\.\d+)\s*\|[^|]*\|[^|]*\|\s*([^|]*?)\s*\|([^\n]*)$/gm)].map((m) => [m[1], m[2], m[3]]);
const progressStatus = progress.match(new RegExp(`^Plan status: ${STATUS}`, 'm'))?.[1];
if (!progressStatus) fail('progress.md: Plan status line must be "Draft" or "Approved <yyyy-mm-dd>"');
else if (planStatus && progressStatus !== planStatus) fail(`progress.md: Plan status "${progressStatus}" differs from plan.md Status "${planStatus}"; the executor reads progress.md`);
const executor = progress.match(/^Executor:[ \t]*(.*)$/m)?.[1].trim();
if (executor !== undefined && !EXECUTORS.includes(executor)) {
  fail(`progress.md: Executor "${executor}" must be ${EXECUTORS.slice(0, -1).join(', ')} or ${EXECUTORS.at(-1)}`);
}
const progressHeader = progress.split(/^## /m)[0];
const writtenByLines = [...progressHeader.matchAll(/^Written by:[ \t]*(.*)$/gm)];
if (writtenByLines.length > 1) fail('progress.md: more than one Written by line');
for (const m of writtenByLines) {
  const value = m[1].trim();
  if (!validVendors(value)) {
    fail(`progress.md: Written by "${value}" must be unknown or a comma-separated list of ${VENDORS.join(', ')}, each once`);
  }
}
const logSection = progress.split(/^## Log\s*$/m)[1]?.split(/^## /m)[0] ?? '';
for (const line of logSection.split(/\r?\n/)) {
  if (!/^\s*-\s/.test(line)) continue;
  const beforeEvidence = prose(line).split(/\bEvidence:/)[0];
  const matches = [...beforeEvidence.matchAll(/\bExecuted by:[ \t]*([^\n]*?)(?:\.(?:\s|$)|$)/g)];
  if (!matches.length) continue;
  const lineStart = line.trim().slice(0, 60);
  if (matches.length > 1) fail(`progress.md: log line "${lineStart}": more than one Executed by field`);
  for (const m of matches) {
    const value = m[1].trim();
    if (!validVendors(value)) {
      fail(`progress.md: log line "${lineStart}": Executed by "${value}" must be unknown or a comma-separated list of ${VENDORS.join(', ')}, each once`);
    }
  }
}
const seenRows = new Set();
for (const [id, st, rest] of rows) {
  if (seenRows.has(id)) fail(`progress.md: more than one row for task ${id}`);
  seenRows.add(id);
  // A removed task keeps its row, marked "removed", so its ID is never reused.
  if (!tasks.has(id) && !/\bremoved\b/i.test(rest)) fail(`progress.md: row ${id} has no task in the phase files and is not marked removed`);
  if (!['Open', 'In progress', 'Closed'].includes(st)) fail(`progress.md: task ${id} has state "${st}", not Open, In progress or Closed`);
}
for (const id of tasks.keys()) if (!rows.some(([r]) => r === id)) fail(`progress.md: no row for task ${id}`);

// execute-plan.md offers both modes.
for (const word of ['Recommended mode', 'Inline']) {
  if (!execute.includes(word)) fail(`execute-plan.md: does not mention "${word}"`);
}
const hasSix = SIX_WORKFLOWS.every((name) => hasToken(execute, name));
const hasOld = ['mstack-codex-review-workflow', 'mstack-claude-review-workflow'].every((name) => hasToken(execute, name));
if (!hasSix && !hasOld) {
  fail(`execute-plan.md: does not name the workflows (${SIX_WORKFLOWS.join(', ')})`);
}

// Template placeholders left behind.
for (const [name, text] of [['plan.md', plan], ['progress.md', progress], ['execute-plan.md', execute], ...phaseFiles.map((f) => [`phases/${f}`, readFileSync(join(phaseDir, f), 'utf8')])]) {
  // <model>, <effort>, <branch> and similar are filled by the executing session, so only planning-time placeholders count.
  // The host-choice labels and the helper and reviewer slots exist only in the start file; a plan may quote them elsewhere.
  const startOnly = name === 'execute-plan.md' ? '|Claude Code \\| Codex(?: \\| Antigravity)?|Codex \\| Claude(?: \\| a same-vendor subagent)?|(?:cheap|standard) helper: (?:claude|codex|antigravity)|fallback reviewer: (?:claude|codex|antigravity)' : '';
  const left = [...new Set(prose(text).match(new RegExp(`<(title|path|command|reason|plan title|slug|yyyy-mm-dd|placeholder|base|review model|review effort|reviewer and model|Inline \\| Workflow|one sentence from the plan|path of the plan folder[^>]*${startOnly})>`, 'g')) ?? [])];
  if (left.length) fail(`${name}: unfilled placeholder${left.length > 1 ? 's' : ''} ${left.join(', ')}`);
}

finish();

function finish() {
  for (const p of problems) console.log(`FAIL  ${p}`);
  if (problems.length) process.exit(1);
  console.log(`plan check passed: ${phaseFiles.length} phases, ${tasks.size} tasks, ${reqs.length} requirements`);
  process.exit(0);
}
