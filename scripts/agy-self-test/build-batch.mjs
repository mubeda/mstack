#!/usr/bin/env node
// Builds one self-test batch for Antigravity: a folder with the branch's plugins and skills, one prepared workspace and
// prompt per eval case, and BATCH.md, the one file a person tells their own Antigravity session to read. The person
// starts that session; this script starts no client and no session. It only copies files and runs each case's
// place-files.sh. collect.mjs gathers the session's saved files afterwards.
import { parseArgs } from 'node:util';
import { spawnSync } from 'node:child_process';
import { appendFileSync, cpSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, realpathSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { basename, delimiter, dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const BATCHES = ['skills', 'pairings', 'workflow-review', 'workflow-dev'];
const PLACEHOLDERS = { '@CLAUDE_MODEL_ID@': 'claude-model', '@AGY_CLAUDE_MODEL_ID@': 'agy-claude-model', '@CODEX_MODEL_ID@': 'codex-model' };
const NAME = /^[a-z0-9][a-z0-9._-]*$/;
// The collector's own files and folder in results/, which a case folder of the same name would collide with.
const RESERVED = ['transcripts', 'session.json', 'session.jsonl', 'run-log.md', 'batch-root.txt'];

function usage(message) {
  console.error(`build-batch: ${message}\nusage: node scripts/agy-self-test/build-batch.mjs --batch <${BATCHES.join('|')}> --cases <cases file> `
    + '--out <folder outside the repository> [--claude-model <id>] [--agy-claude-model <id>] [--codex-model <id>]');
  process.exit(2);
}

let o;
try {
  o = parseArgs({ options: Object.fromEntries(['batch', 'cases', 'out', ...Object.values(PLACEHOLDERS)].map((n) => [n, { type: 'string' }])) }).values;
} catch (e) { usage(e.message); }
if (!o.batch || !o.cases || !o.out) usage('--batch, --cases and --out are required');
if (!BATCHES.includes(o.batch)) usage(`unknown batch: ${o.batch}`);
const root = resolve(process.env.MSTACK_CHECK_ROOT || join(dirname(fileURLToPath(import.meta.url)), '../..'));
if (o.out.split(/[\\/]/).includes('..')) usage(`--out holds a .. segment, so its spelling and its real path can differ: ${o.out}`);
const out = resolve(o.out);
// BATCH.md writes this path into shell commands unquoted.
if (!/^[A-Za-z0-9_./-]+$/.test(out)) usage(`--out holds a character outside [A-Za-z0-9_./-], which a shell command would need quoted: ${out}`);
const within = (p, dir) => p === dir || p.startsWith(dir + sep);
const real = (p) => { try { return realpathSync(p); } catch { return null; } };
const realRoot = realpathSync(root);
// The real path of a folder that may not exist yet: its nearest existing ancestor, resolved, then the rest.
function realOut(p) {
  if (lstatSync(p, { throwIfNoEntry: false })) return real(p) ?? usage(`--out is a broken link: ${p}`);
  return dirname(p) === p ? p : join(realOut(dirname(p)), basename(p));
}
if (within(realOut(out), realRoot)) usage(`--out must be outside the repository: ${out}`);
if (existsSync(out) && (!statSync(out).isDirectory() || readdirSync(out).length)) usage(`--out is not an empty folder: ${out}`);

// The cases file. Everything is checked and rendered before the first file is written, so a usage error leaves no half-built batch.
let spec;
try { spec = JSON.parse(readFileSync(o.cases, 'utf8')); } catch (e) { usage(`bad cases file: ${e.message}`); }
const names = (v) => Array.isArray(v) && v.every((x) => typeof x === 'string' && x);
const exclude = spec?.exclude_plugins ?? [], loose = spec?.loose_skills ?? [];
if (typeof spec?.model !== 'string' || !spec.model) usage('bad cases file: no model');
if (!names(exclude) || !names(loose) || ![...exclude, ...loose].every((p) => NAME.test(p))) usage('bad cases file: exclude_plugins and loose_skills are lists of plugin names');
for (const p of loose) {
  if (exclude.includes(p)) usage(`plugin in both exclude_plugins and loose_skills: ${p}`);
  if (!existsSync(join(root, 'plugins', p, 'skills'))) usage(`loose_skills names a plugin without skills: ${p}`);
}
if (!Array.isArray(spec.cases) || !spec.cases.length) usage('bad cases file: no cases');

const hasManifest = (plugin) => existsSync(join(root, 'plugins', plugin, '.antigravity-plugin', 'plugin.json'));
const ids = new Set();
const cases = spec.cases.map((c) => {
  const id = c?.id;
  if (typeof id !== 'string' || !NAME.test(id)) usage(`bad case id: ${JSON.stringify(id)}`);
  if (ids.has(id)) usage(`duplicate case id: ${id}`);
  if (RESERVED.includes(id)) usage(`bad case id: ${id} is a file or folder of the collector in results/`);
  ids.add(id);
  const bad = (message) => usage(`case ${id}: ${message}`);
  if (typeof c.case !== 'string' || !c.case) bad('no case folder');
  const src = resolve(root, c.case);
  const realSrc = real(src);
  if (realSrc && !within(realSrc, realRoot)) bad(`${c.case} is outside the repository`);
  if (!existsSync(join(src, 'prompt.md'))) bad(`no prompt.md in ${c.case}`);
  const lists = {};
  for (const key of ['replies', 'hide', 'outside_sandbox']) {
    lists[key] = c[key] ?? [];
    if (!names(lists[key])) bad(`${key} is not a list of names`);
  }
  for (const h of lists.hide) if (!['claude', 'codex'].includes(h)) bad(`hide knows claude and codex, not ${h}`);
  for (const r of lists.replies) {
    const at = real(join(src, r));
    if (!at) bad(`no reply file ${r}`);
    if (!within(at, realSrc)) bad(`reply file ${r} is outside the case folder`);
    if (!statSync(at).isFile()) bad(`reply file ${r} is not a file`);
  }
  if (c.self !== undefined && typeof c.self !== 'boolean') bad('self is not true or false');
  const questions = c.questions ?? 0;
  if (!Number.isInteger(questions) || questions < 0) bad('questions is not a count');
  if (questions > lists.replies.length) bad(`more questions (${questions}) than replies (${lists.replies.length})`);
  if (c.append !== undefined && typeof c.append !== 'string') bad('append is not text');
  // plugins/<plugin>/skills/<skill>/...: the skill that holds the case, when the case lies in one.
  const at = relative(realRoot, realSrc).split(sep);
  const [plugin, skill] = at[0] === 'plugins' && at[2] === 'skills' && at.length > 4 ? [at[1], at[3]] : [];
  return { id, src, ...lists, append: c.append ?? '', self: c.self === true, plugin, skill, dir: join(out, 'cases', id), workspace: join(out, 'cases', id, 'workspace') };
});
if (cases.filter((c) => c.self).length > 1) usage('more than one self case: a session runs at most one case itself');

// What is installed in the batch: whole plugins, and loose skill folders.
const plugins = readdirSync(join(root, 'plugins')).filter((p) => hasManifest(p) && !exclude.includes(p) && !loose.includes(p));
const skills = new Map();
for (const p of loose) {
  for (const d of readdirSync(join(root, 'plugins', p, 'skills'), { withFileTypes: true })) if (d.isDirectory()) skills.set(d.name, join(root, 'plugins', p, 'skills', d.name));
}
for (const c of cases) {
  if (c.plugin && !hasManifest(c.plugin) && !exclude.includes(c.plugin)) skills.set(c.skill, join(root, 'plugins', c.plugin, 'skills', c.skill));
}

// Render every file the script writes itself: path below <out> -> text.
const files = new Map();
const tick = (s) => `\`${s}\``;
const body = (text) => text.replace(/^---\r?\n[\s\S]*?\n---\r?\n/, '').trim();
const sheet = [], sections = [], outside = new Map();
for (const c of cases) {
  const prompt = body(readFileSync(join(c.src, 'prompt.md'), 'utf8'));
  const replies = c.replies.map((r) => readFileSync(join(c.src, r), 'utf8').trim());
  const append = c.append.replaceAll('{out}', () => out).replaceAll('{case}', () => c.dir).replaceAll('{workspace}', () => c.workspace);
  // The one command form of a case with hide: PATH stands on the command itself, so cd cannot drop it.
  const hidden = c.hide.length ? `Run every shell command, inside the sandbox and outside it, as ${tick(`cd ${c.workspace} && PATH=${join(c.dir, 'path')} <command>`)}: \`PATH=\` stands directly before the command, never before \`cd\`.` : '';
  const extras = [];
  if (c.outside_sandbox.length) {
    extras.push(`This case runs ${c.outside_sandbox.map(tick).join(', ')}: ask for a run outside the sandbox for that command, and for the check whether its program is installed.`);
  }
  for (const command of c.outside_sandbox) outside.set(command, [...(outside.get(command) ?? []), c.id]);
  const reply = join(out, 'results', c.id, 'reply.md'), meta = join(out, 'results', c.id, 'meta.json');
  if (c.self) {
    files.set(`cases/${c.id}/prompt.md`, `${[prompt, append].filter(Boolean).join('\n\n')}\n`);
    replies.forEach((r, i) => {
      const [first, ...rest] = r.split('\n');
      sheet.push(`${i + 1}. ${first} -> answer: ${rest.join(' ').trim()}`);
    });
    sections.push(`## Case ${c.id}

You run this case yourself.

1. Note the start time.
2. Change to ${tick(c.workspace)}${hidden ? `. ${hidden}` : ` and start every command with ${tick(`cd ${c.workspace} && `)}.`}${extras.map((e) => ` ${e}`).join('')}
3. Read ${tick(join(c.dir, 'prompt.md'))} and do exactly what it says yourself, with no subagent for the case. Where the skill asks the user, ask the person.
4. Write your final reply to ${tick(reply)}.
5. Write ${tick(meta)} with \`session_id\` (your own id), \`started_at\` and \`ended_at\`.`);
    continue;
  }
  const answers = replies.length ? replies.map((r, i) => `${i + 1}. ${r.replaceAll('\n', '\n   ')}`).join('\n') : '(none)';
  files.set(`cases/${c.id}/prompt.md`, `${[
    [`This is an automated test with no person. Your working folder is ${c.workspace}. ${hidden || `Start every shell command with ${tick(`cd ${c.workspace} && `)}.`} `
      + 'Where the skill tells you to ask the user, do not call the question tool: take the answer from the list of prepared answers below, in order, '
      + 'and say in your reply which question got which answer. When the list is empty or used up, write the question into your reply and stop.', ...extras].join(' '),
    prompt, `Prepared answers:\n${answers}`, append].filter(Boolean).join('\n\n')}\n`);
  sections.push(`## Case ${c.id}

1. Start one subagent with no agent type and \`Role\` exactly ${tick(c.id)}. Its prompt is exactly: "Read the file ${join(c.dir, 'prompt.md')} and do exactly what it says."
2. Save its final reply to ${tick(reply)}.
3. Write ${tick(meta)} with \`subagent_id\` (the id of that subagent), \`started_at\` and \`ended_at\`.

Never open a file under ${tick(`${c.workspace}/`)} yourself, answer no question for the subagent, and install nothing.`);
}
const notice = outside.size
  ? `You will be asked to approve runs outside the sandbox. This batch starts there: ${[...outside].map(([command, by]) => `${tick(command)} (${by.join(', ')})`).join('; ')}. `
    + 'Approve each of them. Answer no other question, except the ones on the answer sheet below.'
  : 'This batch starts nothing outside the sandbox.';
files.set('BATCH.md', `${[
  `# Self-test batch: ${o.batch}`,
  `For the person: start the session on the model ${tick(spec.model)}, in the folder ${tick(out)}, and tell it to read this file and do what it says.`,
  notice,
  ...(cases.some((c) => c.self) ? [`## Answer sheet\n\nFor the person. The case the session runs itself asks these questions, in this order:\n\n${sheet.join('\n') || '(no question is expected)'}`] : []),
  `## Protocol\n\nFor the session. Run the ${cases.length} cases below in this order, one after the other, and do nothing else.`,
  ...sections,
  `## At the end\n\nWrite ${tick(join(out, 'results', 'session.json'))} with \`session_id\` (the id in your own context), \`model\`, \`client_version\` and \`mode\`; `
    + 'write `unknown` where you cannot see a value. Then reply exactly `batch done`.',
].join('\n\n')}\n`);
files.set('EXPECTED.json', `${JSON.stringify({ batch: o.batch, model: spec.model, cases: cases.map((c) => ({ id: c.id, self: c.self })) }, null, 2)}\n`);

// The placeholders are replaced here, over the whole rendered output, and nowhere else.
for (const [path, text] of files) {
  let filled = text;
  for (const [mark, option] of Object.entries(PLACEHOLDERS)) {
    if (!filled.includes(mark)) continue;
    if (!o[option]) usage(`${path} holds ${mark}: give --${option}`);
    filled = filled.replaceAll(mark, () => o[option]);
  }
  files.set(path, filled);
}

mkdirSync(join(out, 'results'), { recursive: true });
mkdirSync(join(out, '.agents'));
for (const p of plugins) cpSync(join(root, 'plugins', p), join(out, '.agents', 'plugins', p), { recursive: true });
for (const [name, src] of skills) cpSync(src, join(out, '.agents', 'skills', name), { recursive: true });
for (const [path, text] of files) {
  mkdirSync(dirname(join(out, path)), { recursive: true });
  writeFileSync(join(out, path), text);
}
const fail = (message) => { console.error(`build-batch: ${message}`); process.exit(1); };
for (const c of cases) {
  mkdirSync(c.workspace, { recursive: true });
  const script = join(c.src, 'place-files.sh');
  if (existsSync(script)) {
    const r = spawnSync('bash', [script], { cwd: c.workspace, encoding: 'utf8' });
    if (r.status !== 0) fail(`place-files.sh failed for case ${c.id}: ${r.error?.message ?? `exit ${r.status}\n${r.stderr}`}`);
  }
  if (c.self) {
    // A preflight run from the workspace finds the batch's install in the shape the batch has.
    const link = join(c.workspace, '.agents');
    if (lstatSync(link, { throwIfNoEntry: false })) fail(`case ${c.id}: its workspace already holds .agents`);
    symlinkSync(join(out, '.agents'), link, 'dir');
    // .agents goes into this workspace's own excludes and never through a link, which could reach another repository.
    const git = join(c.workspace, '.git'), info = join(git, 'info'), exclude = join(info, 'exclude');
    const kind = (p) => lstatSync(p, { throwIfNoEntry: false });
    if (kind(git)) {
      if (!kind(git).isDirectory()) fail(`case ${c.id}: ${git} is not a plain folder, so .agents cannot be kept out of Git there`);
      for (const p of [info, exclude]) if (kind(p)?.isSymbolicLink()) fail(`case ${c.id}: ${p} is a link, and .agents is never added through a link`);
      mkdirSync(info, { recursive: true });
      appendFileSync(exclude, '\n.agents\n');
    }
  }
  if (c.hide.length) {
    // shortcut: a hidden client is matched by its exact file name (no .exe or .cmd); upgrade when a batch is built on Windows.
    const dir = join(c.dir, 'path'), taken = new Set(c.hide);
    mkdirSync(dir);
    for (const d of (process.env.PATH ?? '').split(delimiter).filter(Boolean)) {
      let entries = [];
      try { entries = readdirSync(d); } catch { /* a PATH entry that does not exist */ }
      for (const n of entries) {
        if (taken.has(n)) continue; // hidden, or an earlier PATH entry already has it
        const s = statSync(join(d, n), { throwIfNoEntry: false });
        if (!s?.isFile() || !(s.mode & 0o111)) continue;
        symlinkSync(resolve(d, n), join(dir, n));
        taken.add(n);
      }
    }
  }
}
console.log(`batch built: ${cases.length} cases in ${out}`);
