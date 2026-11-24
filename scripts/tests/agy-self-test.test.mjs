// Tests for scripts/agy-self-test/build-batch.mjs and collect.mjs. Every test works on throwaway folders: a made-up
// repository root, a made-up Antigravity data folder and stand-in executables on PATH. No test starts a client.
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, readlinkSync, realpathSync, renameSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const builder = resolve(here, '../agy-self-test/build-batch.mjs');
const collector = resolve(here, '../agy-self-test/collect.mjs');
const bashDir = (process.env.PATH ?? '').split(delimiter).find((d) => d && existsSync(join(d, 'bash')));

// Every temporary folder of the run, removed once at the end.
const made = [];
const tmp = () => { const d = mkdtempSync(join(tmpdir(), 'agy-self-test-')); made.push(d); return d; };
after(() => { for (const d of made) rmSync(d, { recursive: true, force: true }); });
function put(path, text, mode) {
  mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, text); if (mode) chmodSync(path, mode);
}
function stubs(names, body = 'exit 0') {
  const bin = tmp();
  for (const n of names) put(join(bin, n), `#!/bin/sh\n${body}\n`, 0o755);
  return bin;
}

const CASES = 'plugins/alpha/skills/alpha/evals';
const ONE = { id: 'a.one', case: `${CASES}/one`, replies: [] };
const ONE_REPLIES = { ...ONE, replies: ['reply-1.md', 'reply-2.md'] };
const TWO = { id: 'a.two', case: `${CASES}/two`, replies: [] };
const THREE = { id: 'b.three', case: 'plugins/beta/skills/beta/evals/three', replies: [] };

function repo() {
  const root = tmp();
  for (const p of ['alpha', 'gamma']) {
    put(join(root, 'plugins', p, '.antigravity-plugin/plugin.json'), JSON.stringify({ name: p, version: '0.0.1' }));
    put(join(root, 'plugins', p, 'skills', p, 'SKILL.md'), `---\nname: ${p}\ndescription: Use when testing.\n---\n`);
    put(join(root, 'plugins', p, 'agents/helper/agent.md'), '---\nname: helper\n---\n');
  }
  put(join(root, 'plugins/beta/skills/beta/SKILL.md'), '---\nname: beta\ndescription: Use when testing.\n---\n');
  const one = join(root, CASES, 'one');
  put(join(one, 'prompt.md'), '---\ntags: [alpha]\nmax_turns: 5\n---\n\nDo the thing.\nUse @CODEX_MODEL_ID@.\n');
  put(join(one, 'place-files.sh'), '#!/usr/bin/env bash\nset -eu\necho seed > seed.txt\n');
  put(join(one, 'reply-1.md'), 'Which colour?\nBlue.\n');
  put(join(one, 'reply-2.md'), 'Which model?\nTake @AGY_CLAUDE_MODEL_ID@ for it.\n');
  put(join(root, CASES, 'two', 'prompt.md'), 'Do the second thing.\n');
  put(join(root, 'plugins/beta/skills/beta/evals/three/prompt.md'), 'Do the third thing.\n');
  return root;
}

// cases: a list of entries, or a whole cases file. models: the placeholder options, given by default.
function build(root, cases, { batch = 'skills', out, path, models = ['--codex-model', 'gpt-x', '--agy-claude-model', 'agy-c'], args } = {}) {
  const dir = tmp();
  out ??= join(dir, 'out');
  const file = join(dir, 'cases.json');
  writeFileSync(file, JSON.stringify(Array.isArray(cases) ? { model: 'gemini-test-flash', cases } : cases));
  const bin = stubs(['node', 'git', 'codex', 'claude']);
  const r = spawnSync(process.execPath, [builder, ...(args ?? ['--batch', batch, '--cases', file, '--out', out]), ...models], {
    encoding: 'utf8', env: { MSTACK_CHECK_ROOT: root, PATH: path ?? [bin, bashDir].join(delimiter) },
  });
  return { status: r.status, text: `${r.stdout}${r.stderr}`, out, bin, read: (rel) => readFileSync(join(out, rel), 'utf8') };
}

// One transcript in the saved sample's line form: argument values are JSON-quoted strings.
function lines(model, tools, args = { Path: '"/abs/made-up/file"' }) {
  const at = '2026-01-01T00:00:00Z';
  return [
    { step_index: 0, source: 'SYSTEM', type: 'SYSTEM_MESSAGE', status: 'DONE', created_at: at, content: 'made-up task' },
    { step_index: 1, source: 'MODEL', type: 'PLANNER_RESPONSE', status: 'DONE', created_at: at, model,
      tool_calls: tools.map((name) => ({ name, args })) },
    { step_index: 2, source: 'MODEL', type: 'GENERIC', status: 'DONE', created_at: at, content: 'made-up result' },
    { step_index: 3, source: 'MODEL', type: 'PLANNER_RESPONSE', status: 'DONE', created_at: at, model, content: 'done' },
  ].map((l) => JSON.stringify(l)).join('\n') + '\n';
}

// A made-up Antigravity data folder next to <out>. A subagent: { id, role, typeName, parent, spawn, model, tools, transcript }.
function gemini(out, { session = 'sess-1', sessionTranscript = true, sessionFull, subagents = [] } = {}) {
  const dir = join(dirname(out), 'gemini');
  const sys = (id) => join(dir, 'antigravity-cli/brain', id, '.system_generated');
  mkdirSync(sys(session), { recursive: true });
  if (sessionTranscript) put(join(sys(session), 'logs/transcript.jsonl'), lines('gemini-test-session', ['invoke_subagent']));
  if (sessionFull !== undefined) put(join(sys(session), 'logs/transcript_full.jsonl'), sessionFull);
  for (const s of subagents) {
    put(join(sys(s.parent ?? session), 'subagents', `${s.id}.json`), JSON.stringify({ conversationId: s.id, spawnStepIndex: s.spawn ?? 1,
      state: 'SUBAGENT_STATE_ALIVE', subagentDescriptor: { typeName: s.typeName ?? 'self', role: s.role }, workspaceUris: ['file:///abs/made-up'] }));
    if (s.transcript !== false) put(join(sys(s.id), 'logs/transcript.jsonl'), s.text ?? lines(s.model ?? 'gemini-test-flash', s.tools ?? ['read_file']));
    if (s.full !== undefined) put(join(sys(s.id), 'logs/transcript_full.jsonl'), s.full);
  }
  return { dir, transcript: (id) => join(sys(id), 'logs/transcript.jsonl'), full: (id) => join(sys(id), 'logs/transcript_full.jsonl') };
}

// Plays the session from the built files only: writes the result files BATCH.md names, and nothing else.
function obey(out, { session = 'sess-1', sessionJson = {} } = {}) {
  const batch = readFileSync(join(out, 'BATCH.md'), 'utf8');
  const sections = batch.split(/^## /m);
  const named = (text, tail) => text.match(new RegExp('`([^`\\s]*' + tail.replaceAll('.', '\\.') + ')`'))[1];
  JSON.parse(readFileSync(join(out, 'EXPECTED.json'), 'utf8')).cases.forEach((c, i) => {
    const section = sections.find((s) => s.startsWith(`Case ${c.id}\n`));
    const times = { started_at: '2026-01-01T00:00:00Z', ended_at: '2026-01-01T00:01:00Z' };
    put(named(section, `results/${c.id}/reply.md`), 'made-up reply\n');
    put(named(section, `results/${c.id}/meta.json`), JSON.stringify(/`subagent_id`/.test(section) ? { subagent_id: `sub-${i + 1}`, ...times } : { session_id: session, ...times }));
  });
  put(named(batch, 'results/session.json'), JSON.stringify({ session_id: session, model: 'gemini-test-flash', client_version: 'unknown', mode: 'unknown', ...sessionJson }));
}

function collect(out, gdir, { path } = {}) {
  const r = spawnSync(process.execPath, [collector, '--out', out, '--gemini-dir', gdir], { encoding: 'utf8', env: { PATH: path ?? tmp() } });
  const log = existsSync(join(out, 'results/run-log.md')) ? readFileSync(join(out, 'results/run-log.md'), 'utf8') : '';
  return { status: r.status, text: `${r.stdout}${r.stderr}`, log, row: (start) => log.split('\n').find((l) => l.startsWith(start)) ?? '' };
}

// A built batch of the given cases whose session did what BATCH.md says.
function ran(cases = [ONE], options) {
  const b = build(repo(), cases);
  assert.equal(b.status, 0, b.text);
  obey(b.out, options);
  return b;
}

function listing(dir) {
  const found = [];
  const walk = (d) => { for (const n of readdirSync(d).sort()) { const p = join(d, n); const s = statSync(p); found.push(`${p}:${s.size}:${s.mtimeMs}:${s.mode}`); if (s.isDirectory()) walk(p); } };
  walk(dir);
  return found;
}

// build-batch.mjs

test('usage error without --batch', () => {
  const b = build(repo(), [ONE], { args: ['--cases', 'x.json', '--out', join(tmp(), 'out')] });
  assert.equal(b.status, 2, b.text);
  assert.match(b.text, /usage:/);
  const unknown = build(repo(), [ONE], { batch: 'nightly' });
  assert.equal(unknown.status, 2, unknown.text);
  assert.match(unknown.text, /unknown batch: nightly/);
  const full = join(tmp(), 'out');
  put(join(full, 'kept.txt'), 'x');
  assert.equal(build(repo(), [ONE], { out: full }).status, 2);
  assert.deepEqual(readdirSync(full), ['kept.txt']);
  const broken = join(tmp(), 'cases.json');
  put(broken, '{ not json');
  const parsed = build(repo(), [ONE], { args: ['--batch', 'skills', '--cases', broken, '--out', join(tmp(), 'out')] });
  assert.equal(parsed.status, 2, parsed.text);
  assert.match(parsed.text, /bad cases file/);
});

test('out inside the repository is refused', () => {
  const root = repo();
  const b = build(root, [ONE], { out: join(root, 'batch') });
  assert.equal(b.status, 2, b.text);
  assert.ok(!existsSync(join(root, 'batch')));
});

test('duplicate or malformed ids are refused', () => {
  const twice = build(repo(), [ONE, { ...TWO, id: 'a.one' }]);
  assert.equal(twice.status, 2, twice.text);
  assert.match(twice.text, /duplicate case id: a\.one/);
  const bad = build(repo(), [{ ...ONE, id: 'A/one' }]);
  assert.equal(bad.status, 2, bad.text);
  assert.match(bad.text, /A\/one/);
});

test('a case folder gets its workspace and its prompt', () => {
  const b = build(repo(), [ONE]);
  assert.equal(b.status, 0, b.text);
  assert.match(b.text, /^batch built: 1 cases in /);
  assert.equal(b.read('cases/a.one/workspace/seed.txt'), 'seed\n');
  assert.ok(existsSync(join(b.out, 'cases/a.one/prompt.md')));
  assert.deepEqual(readdirSync(join(b.out, 'results')), []);
});

test('the prompt starts with the proven wrapper', () => {
  const b = build(repo(), [ONE]);
  const ws = join(b.out, 'cases/a.one/workspace');
  assert.ok(b.read('cases/a.one/prompt.md').startsWith(
    `This is an automated test with no person. Your working folder is ${ws}. Start every shell command with \`cd ${ws} && \`. `
    + 'Where the skill tells you to ask the user, do not call the question tool: take the answer from the list of prepared answers below, in order, '
    + 'and say in your reply which question got which answer. When the list is empty or used up, write the question into your reply and stop.\n'), b.read('cases/a.one/prompt.md'));
});

test('the prompt loses its settings block and gains the appended text', () => {
  const b = build(repo(), [{ ...ONE, append: 'Use {case}/scratch. Work in {workspace}/w, install from {out}/.agents.' }]);
  const prompt = b.read('cases/a.one/prompt.md');
  assert.doesNotMatch(prompt, /^---$/m);
  assert.doesNotMatch(prompt, /max_turns/);
  assert.match(prompt, /^Do the thing\.$/m);
  assert.ok(prompt.includes(`Use ${join(b.out, 'cases/a.one')}/scratch. Work in ${join(b.out, 'cases/a.one/workspace')}/w, install from ${b.out}/.agents.`), prompt);
});

test("reply files become the prompt's answer list", () => {
  const b = build(repo(), [ONE_REPLIES]);
  const prompt = b.read('cases/a.one/prompt.md');
  assert.match(prompt, /\nPrepared answers:\n1\. Which colour\?\n   Blue\.\n2\. Which model\?\n/);
  assert.ok(prompt.indexOf('Prepared answers:') > prompt.indexOf('Do the thing.'));
  assert.ok(!existsSync(join(b.out, 'cases/a.one/replies')) && !existsSync(join(b.out, 'cases/a.one/reply-1.md')));
});

test('more questions than replies is a build error', () => {
  const b = build(repo(), [{ ...ONE, questions: 1 }]);
  assert.equal(b.status, 2, b.text);
  assert.match(b.text, /case a\.one: more questions/);
  assert.ok(!existsSync(b.out));
});

test('model placeholders are filled from the options', () => {
  const b = build(repo(), [ONE], { models: ['--codex-model', 'gpt-x'] });
  assert.match(b.read('cases/a.one/prompt.md'), /^Use gpt-x\.$/m);
  const none = build(repo(), [ONE], { models: [] });
  assert.equal(none.status, 2, none.text);
  assert.match(none.text, /@CODEX_MODEL_ID@/);
  assert.ok(!existsSync(none.out));
});

test('the two Claude placeholders take different options', () => {
  const cases = [{ ...ONE, append: 'Review with @CLAUDE_MODEL_ID@, start @AGY_CLAUDE_MODEL_ID@.' }];
  const b = build(repo(), cases, { models: ['--codex-model', 'gpt-x', '--claude-model', 'a', '--agy-claude-model', 'b'] });
  assert.match(b.read('cases/a.one/prompt.md'), /Review with a, start b\./);
  const one = build(repo(), cases, { models: ['--codex-model', 'gpt-x', '--claude-model', 'a'] });
  assert.equal(one.status, 2, one.text);
  assert.match(one.text, /@AGY_CLAUDE_MODEL_ID@/);
});

test('a placeholder inside a reply file is filled', () => {
  const b = build(repo(), [ONE_REPLIES]);
  assert.equal(b.status, 0, b.text);
  assert.match(b.read('cases/a.one/prompt.md'), /2\. Which model\?\n   Take agy-c for it\./);
  assert.doesNotMatch(b.read('cases/a.one/prompt.md'), /@AGY_CLAUDE_MODEL_ID@/);
  const self = build(repo(), [{ ...ONE_REPLIES, self: true }]);
  assert.match(self.read('BATCH.md'), /^2\. Which model\? -> answer: Take agy-c for it\.$/m);
  assert.doesNotMatch(self.read('BATCH.md'), /@AGY_CLAUDE_MODEL_ID@/);
});

test('hide builds a PATH without the client and with node', () => {
  const b = build(repo(), [{ ...ONE, hide: ['codex'] }]);
  assert.equal(b.status, 0, b.text);
  const path = join(b.out, 'cases/a.one/path');
  assert.equal(readlinkSync(join(path, 'node')), join(b.bin, 'node'));
  for (const n of ['git', 'claude', 'bash']) assert.ok(existsSync(join(path, n)), n);
  assert.ok(!readdirSync(path).includes('codex'));
  const ws = join(b.out, 'cases/a.one/workspace');
  const form = `Run every shell command, inside the sandbox and outside it, as \`cd ${ws} && PATH=${path} <command>\`: \`PATH=\` stands directly before the command, never before \`cd\`.`;
  const prompt = b.read('cases/a.one/prompt.md');
  assert.ok(prompt.startsWith(`This is an automated test with no person. Your working folder is ${ws}. ${form} Where the skill tells you`), prompt);
  assert.doesNotMatch(prompt, /Start every shell command|Put `PATH=/);
  const self = build(repo(), [{ ...ONE, hide: ['codex'], self: true }]);
  const section = self.read('BATCH.md').split(/^## /m).find((s) => s.startsWith('Case a.one\n'));
  assert.ok(section.includes(`2. Change to \`${join(self.out, 'cases/a.one/workspace')}\`. ${form.replaceAll(b.out, self.out)}`), section);
  assert.doesNotMatch(section, /start every command with|Put `PATH=/);
});

test('a case that starts a client asks for a run outside the sandbox', () => {
  const b = build(repo(), [{ ...ONE, outside_sandbox: ['codex exec'] }, { ...TWO, outside_sandbox: ['codex exec', 'claude -p'] }]);
  assert.ok(b.read('cases/a.one/prompt.md').includes('This case runs `codex exec`: ask for a run outside the sandbox for that command, and for the check whether its program is installed.'));
  assert.ok(b.read('BATCH.md').includes('You will be asked to approve runs outside the sandbox. This batch starts there: `codex exec` (a.one, a.two); `claude -p` (a.two). '
    + 'Approve each of them. Answer no other question, except the ones on the answer sheet below.'), b.read('BATCH.md'));
});

test('EXPECTED.json lists the batch, the model and each case with its self flag', () => {
  const b = build(repo(), [ONE, { ...TWO, self: true }], { batch: 'workflow-dev' });
  assert.deepEqual(JSON.parse(b.read('EXPECTED.json')), { batch: 'workflow-dev', model: 'gemini-test-flash',
    cases: [{ id: 'a.one', self: false }, { id: 'a.two', self: true }] });
});

test('BATCH.md opens with the model and the approvals notice', () => {
  const head = build(repo(), [ONE]).read('BATCH.md').split('\n## ')[0];
  assert.match(head, /`gemini-test-flash`/);
  assert.match(head, /This batch starts nothing outside the sandbox\./);
});

test('BATCH.md starts one subagent per case with its id as Role', () => {
  const b = build(repo(), [ONE, TWO]);
  const batch = b.read('BATCH.md');
  for (const id of ['a.one', 'a.two']) {
    const section = batch.split(/^## /m).find((s) => s.startsWith(`Case ${id}\n`));
    assert.match(section, new RegExp(`one subagent with no agent type and \`Role\` exactly \`${id}\``));
    assert.ok(section.includes(`"Read the file ${join(b.out, 'cases', id, 'prompt.md')} and do exactly what it says."`), section);
    assert.ok(section.includes(`\`${join(b.out, 'results', id, 'reply.md')}\``) && section.includes('`subagent_id`'), section);
    assert.ok(section.includes('`started_at` and `ended_at`'), section);
    assert.ok(section.includes(`Never open a file under \`${join(b.out, 'cases', id, 'workspace')}/\` yourself, answer no question for the subagent, and install nothing.`), section);
  }
  assert.match(batch, /`session_id`.*`model`.*`client_version`.*`mode`/);
  assert.match(batch, /reply exactly `batch done`/);
});

test('plugins with an Antigravity manifest are copied into .agents/plugins', () => {
  const b = build(repo(), [ONE]);
  assert.ok(existsSync(join(b.out, '.agents/plugins/alpha/skills/alpha/SKILL.md')));
  assert.ok(existsSync(join(b.out, '.agents/plugins/gamma/agents/helper/agent.md')));
  assert.ok(!existsSync(join(b.out, '.agents/plugins/beta')));
});

test('exclude_plugins keeps a plugin out of the batch', () => {
  const b = build(repo(), { model: 'm', exclude_plugins: ['gamma'], cases: [ONE] });
  assert.equal(b.status, 0, b.text);
  assert.ok(existsSync(join(b.out, '.agents/plugins/alpha')));
  assert.ok(!existsSync(join(b.out, '.agents/plugins/gamma')) && !existsSync(join(b.out, '.agents/skills/gamma')));
  const own = build(repo(), { model: 'm', exclude_plugins: ['beta'], cases: [THREE] });
  assert.equal(own.status, 0, own.text);
  assert.ok(!existsSync(join(own.out, '.agents/plugins/beta')) && !existsSync(join(own.out, '.agents/skills/beta')));
  const both = build(repo(), { model: 'm', exclude_plugins: ['gamma'], loose_skills: ['gamma'], cases: [ONE] });
  assert.equal(both.status, 2, both.text);
});

test('loose_skills copies the skill folder and not the plugin', () => {
  const b = build(repo(), { model: 'm', loose_skills: ['gamma'], cases: [ONE] });
  assert.equal(b.status, 0, b.text);
  assert.ok(existsSync(join(b.out, '.agents/skills/gamma/SKILL.md')));
  assert.ok(!existsSync(join(b.out, '.agents/plugins/gamma')));
  assert.ok(!listing(join(b.out, '.agents')).some((l) => l.includes('gamma') && l.includes('agent.md')));
});

test('the skill of a case is copied into .agents/skills when its plugin has no Antigravity manifest', () => {
  const b = build(repo(), [ONE, THREE]);
  assert.equal(b.status, 0, b.text);
  assert.ok(existsSync(join(b.out, '.agents/skills/beta/SKILL.md')));
  assert.ok(!existsSync(join(b.out, '.agents/skills/alpha')));
});

test('a self case gets the answer sheet and the full protocol', () => {
  const b = build(repo(), [{ ...ONE_REPLIES, self: true }, TWO]);
  assert.equal(b.status, 0, b.text);
  const batch = b.read('BATCH.md'), ws = join(b.out, 'cases/a.one/workspace');
  const section = batch.split(/^## /m).find((s) => s.startsWith('Case a.one\n'));
  assert.doesNotMatch(section, /Role|subagent_id/);
  assert.equal(batch.match(/^\d+\. .* -> answer: .*$/gm).length, 2);
  assert.match(batch, /^1\. Which colour\? -> answer: Blue\.$/m);
  assert.ok(section.includes(`\`cd ${ws} && \``), section);
  assert.ok(section.includes(`\`${join(b.out, 'cases/a.one/prompt.md')}\``) && section.includes('with no subagent'), section);
  assert.match(section, /results\/a\.one\/meta\.json` with `session_id`/);
  assert.match(section, /^1\. Note the start time\.$/m);
  assert.match(section, /`session_id` \(your own id\), `started_at` and `ended_at`/);
  assert.ok(section.includes('Where the skill asks the user, ask the person.'), section);
  const prompt = b.read('cases/a.one/prompt.md');
  assert.match(prompt, /^Do the thing\.\nUse gpt-x\.\n$/);
});

test('two self cases are refused', () => {
  const b = build(repo(), [{ ...ONE, self: true }, { ...TWO, self: true }]);
  assert.equal(b.status, 2, b.text);
  assert.match(b.text, /self/);
});

test("a self case's workspace links to the batch's install", () => {
  const root = repo();
  put(join(root, CASES, 'tracked/prompt.md'), 'Do it in a repository.\n');
  put(join(root, CASES, 'tracked/place-files.sh'), 'set -eu\ngit init -q .\necho x > file.txt\n');
  // The real git has to answer here, so this build keeps the machine's PATH.
  const b = build(root, { model: 'm', loose_skills: ['gamma'], cases: [{ id: 'a.tracked', case: `${CASES}/tracked`, replies: [], self: true }] }, { path: process.env.PATH });
  assert.equal(b.status, 0, b.text);
  const ws = join(b.out, 'cases/a.tracked/workspace');
  assert.equal(realpathSync(join(ws, '.agents')), realpathSync(join(b.out, '.agents')));
  assert.ok(existsSync(join(ws, '.agents/skills/gamma/SKILL.md')) && existsSync(join(ws, '.agents/plugins/alpha')));
  const status = spawnSync('git', ['status', '--porcelain'], { cwd: ws, encoding: 'utf8' });
  assert.equal(status.status, 0, status.stderr);
  assert.match(status.stdout, /file\.txt/);
  assert.doesNotMatch(status.stdout, /\.agents/);
  assert.ok(!existsSync(join(build(repo(), [ONE]).out, 'cases/a.one/workspace/.agents')));
  put(join(root, CASES, 'two/place-files.sh'), 'mkdir .agents\n');
  const taken = build(root, [{ ...TWO, self: true }]);
  assert.equal(taken.status, 1, taken.text);
  assert.match(taken.text, /case a\.two: its workspace already holds \.agents/);
});

test('a failing place-files.sh fails the build', () => {
  const root = repo();
  put(join(root, CASES, 'two/place-files.sh'), 'echo broken >&2\nexit 3\n');
  const b = build(root, [TWO]);
  assert.equal(b.status, 1, b.text);
  assert.match(b.text, /place-files\.sh failed for case a\.two/);
});

test('an out that reaches the repository through a link is refused', () => {
  const root = repo(), alias = join(tmp(), 'alias');
  symlinkSync(root, alias, 'dir');
  const b = build(root, [ONE], { out: join(alias, 'new', 'batch') });
  assert.equal(b.status, 2, b.text);
  assert.match(b.text, /outside the repository/);
  assert.ok(!existsSync(join(root, 'new')));
});

test('a self case never adds .agents to Git through a link', () => {
  const root = repo(), self = [{ ...TWO, self: true }];
  put(join(root, CASES, 'two/place-files.sh'), 'echo "gitdir: elsewhere" > .git\n');
  const file = build(root, self);
  assert.equal(file.status, 1, file.text);
  assert.ok(file.text.includes(`${join(file.out, 'cases/a.two/workspace/.git')} is not a plain folder`), file.text);
  const victim = join(tmp(), 'exclude');
  put(victim, 'keep\n');
  put(join(root, CASES, 'two/place-files.sh'), `mkdir -p .git/info && ln -s '${victim}' .git/info/exclude\n`);
  const linked = build(root, self);
  assert.equal(linked.status, 1, linked.text);
  assert.ok(linked.text.includes(`${join(linked.out, 'cases/a.two/workspace/.git/info/exclude')} is a link`), linked.text);
  assert.equal(readFileSync(victim, 'utf8'), 'keep\n');
  const elsewhere = tmp();
  put(join(root, CASES, 'two/place-files.sh'), `mkdir .git && ln -s '${elsewhere}' .git/info\n`);
  const info = build(root, self);
  assert.equal(info.status, 1, info.text);
  assert.ok(info.text.includes(`${join(info.out, 'cases/a.two/workspace/.git/info')} is a link`), info.text);
  assert.deepEqual(readdirSync(elsewhere), []);
});

test('a case or reply outside its folder is refused', () => {
  const root = repo(), elsewhere = tmp();
  put(join(elsewhere, 'prompt.md'), 'Not a case of this repository.\n');
  put(join(elsewhere, 'place-files.sh'), `touch '${join(elsewhere, 'ran')}'\n`);
  symlinkSync(elsewhere, join(root, CASES, 'linked'), 'dir');
  symlinkSync(join(elsewhere, 'prompt.md'), join(root, CASES, 'one/reply-link.md'));
  mkdirSync(join(root, CASES, 'one/reply-dir'));
  for (const [c, message] of [
    [{ ...ONE, case: relative(root, elsewhere) }, /case a\.one: .*outside the repository/],
    [{ ...ONE, case: `${CASES}/linked` }, /case a\.one: .*outside the repository/],
    [{ ...ONE, replies: ['../two/prompt.md'] }, /case a\.one: reply file \.\.\/two\/prompt\.md is outside the case folder/],
    [{ ...ONE, replies: ['reply-link.md'] }, /case a\.one: reply file reply-link\.md is outside the case folder/],
    [{ ...ONE, replies: ['reply-dir'] }, /case a\.one: reply file reply-dir is not a file/],
    [{ ...ONE, self: 'true' }, /case a\.one: self is not true or false/]]) {
    const b = build(root, [c]);
    assert.equal(b.status, 2, `${JSON.stringify(c)}: ${b.text}`);
    assert.match(b.text, message);
    assert.ok(!existsSync(b.out));
  }
  assert.ok(!existsSync(join(elsewhere, 'ran')));
});

test('case ids that name a file of results/ are refused', () => {
  for (const id of ['transcripts', 'session.json', 'session.jsonl', 'run-log.md', 'batch-root.txt']) {
    const b = build(repo(), [{ ...ONE, id }]);
    assert.equal(b.status, 2, `${id}: ${b.text}`);
    assert.ok(b.text.includes(`bad case id: ${id}`), b.text);
  }
});

test('an out path that a shell would need quoted is refused', () => {
  const b = build(repo(), [ONE], { out: join(tmp(), 'batch one', 'out') });
  assert.equal(b.status, 2, b.text);
  assert.match(b.text, /--out holds a character outside \[A-Za-z0-9_\.\/-\]/);
  assert.ok(!existsSync(dirname(b.out)));
});

test('a model id is filled in literally', () => {
  const b = build(repo(), [ONE], { models: ['--codex-model', 'g$&x'] });
  assert.equal(b.status, 0, b.text);
  assert.match(b.read('cases/a.one/prompt.md'), /^Use g\$&x\.$/m);
});

test('the builder refuses an out with a .. segment', () => {
  const dir = tmp();
  const b = build(repo(), [ONE], { out: `${dir}/x/../out` });
  assert.equal(b.status, 2, b.text);
  assert.match(b.text, /--out holds a \.\. segment/);
  assert.ok(!existsSync(join(dir, 'out')));
});

test('a case given through a link in the repository still gets its skill', () => {
  const root = repo();
  symlinkSync(join(root, 'plugins/beta/skills/beta/evals/three'), join(root, 'linked-three'), 'dir');
  const b = build(root, [{ ...THREE, case: 'linked-three' }]);
  assert.equal(b.status, 0, b.text);
  assert.ok(existsSync(join(b.out, '.agents/skills/beta/SKILL.md')));
});

// collect.mjs

test('a complete case copies its transcripts and is complete', () => {
  const b = ran();
  const g = gemini(b.out, { subagents: [{ id: 'sub-1', role: 'a.one', model: 'gemini-test-flash', tools: ['read_file', 'read_file', 'run_command'] }] });
  const c = collect(b.out, g.dir);
  assert.equal(c.status, 0, c.text);
  assert.match(c.text, /^collected: 1 complete, 0 not run$/m);
  assert.equal(b.read('results/transcripts/a.one/session.jsonl'), readFileSync(g.transcript('sub-1'), 'utf8'));
  assert.equal(b.read('results/transcripts/session.jsonl'), readFileSync(g.transcript('sess-1'), 'utf8'));
  assert.equal(c.row('| a.one |'), '| a.one | sub-1 | gemini-test-flash | read_file, run_command | complete | short |');
  assert.match(c.log, /Batch: skills/);
  assert.match(c.log, /Session: sess-1/);
});

test('a nested subagent and its own subagent are copied under their case', () => {
  const b = ran();
  const g = gemini(b.out, { subagents: [{ id: 'sub-1', role: 'a.one' },
    { id: 'kid-1', parent: 'sub-1', role: 'reader', typeName: 'reader', spawn: 4, model: 'gemini-test-kid', tools: ['search_web'] },
    { id: 'kid-2', parent: 'kid-1', role: 'helper', spawn: 7 }] });
  const c = collect(b.out, g.dir);
  assert.equal(c.status, 0, c.text);
  for (const [n, id] of [[1, 'kid-1'], [2, 'kid-2']]) {
    assert.equal(JSON.parse(b.read(`results/transcripts/a.one/subagent-${n}.json`)).conversationId, id);
    assert.equal(b.read(`results/transcripts/a.one/subagent-${n}.jsonl`), readFileSync(g.transcript(id), 'utf8'));
  }
  assert.equal(c.row('| a.one | subagent-1 |'), '| a.one | subagent-1 | kid-1 | 4 | reader | reader | gemini-test-kid | search_web | short |');
  assert.equal(c.row('| a.one | subagent-2 |'), '| a.one | subagent-2 | kid-2 | 7 | self | helper | gemini-test-flash | read_file | short |');
  assert.ok(!existsSync(join(b.out, 'results/transcripts/a.one/subagent-3.json')));
});

test('the case is matched by role, then by the meta id', () => {
  const b = ran([ONE, TWO, THREE]);
  const g = gemini(b.out, { subagents: [{ id: 'sub-1', role: 'another name', model: 'by-meta' }, { id: 'sub-9', role: 'a.two', model: 'by-role' }] });
  const c = collect(b.out, g.dir);
  assert.equal(c.row('| b.three |'), '| b.three |  |  |  | not run: no subagent record |  |');
  assert.equal(c.row('| a.one |'), '| a.one | sub-1 | by-meta | read_file | complete | short |');
  assert.equal(c.row('| a.two |'), '| a.two | sub-9 | by-role | read_file | complete | short |');
  const both = ran();
  const h = gemini(both.out, { subagents: [{ id: 'sub-1', role: 'another name', model: 'by-meta' }, { id: 'sub-7', role: 'a.one', model: 'by-role' }] });
  assert.equal(collect(both.out, h.dir).row('| a.one |'), '| a.one | sub-7 | by-role | read_file | complete | short |', 'the role wins over a conflicting meta id');
  assert.equal(both.read('results/transcripts/a.one/session.jsonl'), readFileSync(h.transcript('sub-7'), 'utf8'));
});

test('a missing reply is not run', () => {
  const b = ran([ONE, TWO]);
  rmSync(join(b.out, 'results/a.one/reply.md'));
  rmSync(join(b.out, 'results/a.two/meta.json'));
  const c = collect(b.out, gemini(b.out, { subagents: [{ id: 'sub-1', role: 'a.one' }, { id: 'sub-2', role: 'a.two' }] }).dir);
  assert.equal(c.status, 0, c.text);
  assert.match(c.row('| a.one |'), /\| not run: no reply saved \|/);
  assert.match(c.row('| a.two |'), /\| not run: no meta\.json \|/);
  assert.match(c.text, /^collected: 0 complete, 2 not run$/m);
});

test('a missing transcript is not run', () => {
  const b = ran([ONE, TWO, THREE]);
  const g = gemini(b.out, { subagents: [{ id: 'sub-1', role: 'a.one', transcript: false }, { id: 'sub-2', role: 'a.two', text: '{"step_index":0}\n' },
    { id: 'sub-3', role: 'b.three', text: lines('gemini-test-flash', ['read_file']) + '{ cut off\n' }] });
  const c = collect(b.out, g.dir);
  assert.match(c.row('| a.one |'), /\| not run: no transcript \|/);
  assert.match(c.row('| a.two |'), /\| not run: transcript names no model \|/);
  assert.match(c.row('| b.three |'), /\| not run: transcript unreadable \|/);
  assert.match(c.text, /^collected: 0 complete, 3 not run$/m);
});

test('a missing session transcript writes the run log and exits 1', () => {
  const b = ran([ONE, TWO]);
  const g = gemini(b.out, { sessionTranscript: false, subagents: [{ id: 'sub-1', role: 'a.one' }] });
  const c = collect(b.out, g.dir);
  assert.equal(c.status, 1, c.text);
  assert.ok(c.text.includes(`session transcript not found: ${g.transcript('sess-1')}`), c.text);
  assert.match(c.row('| a.one |'), /\| not run: no session transcript \|/);
  assert.match(c.row('| a.two |'), /\| not run: no session transcript \|/);
  rmSync(join(b.out, 'results/session.json'));
  const lost = collect(b.out, g.dir);
  assert.equal(lost.status, 1, lost.text);
  assert.ok(lost.text.includes(`session transcript not found: ${join(b.out, 'results/session.json')}`), lost.text);
  assert.match(lost.row('| a.one |'), /\| not run: no session transcript \|/);
  assert.equal(collect(tmp(), g.dir).status, 2, 'a folder without EXPECTED.json is a usage error');
});

test("a self case reads the session's own transcript", () => {
  const b = ran([{ ...ONE, self: true }]);
  const g = gemini(b.out, { subagents: [{ id: 'kid-1', role: 'reviewer', typeName: 'reviewer', spawn: 3 }] });
  const c = collect(b.out, g.dir);
  assert.equal(c.status, 0, c.text);
  assert.equal(b.read('results/transcripts/a.one/session.jsonl'), readFileSync(g.transcript('sess-1'), 'utf8'));
  assert.equal(c.row('| a.one | sess-1 |'), '| a.one | sess-1 | gemini-test-session | invoke_subagent | complete | short |');
  assert.match(c.row('| a.one | subagent-1 |'), /\| kid-1 \| 3 \| reviewer \| reviewer \|/);
});

test('a mixed batch is collected from the files the session writes', () => {
  const b = ran([ONE, { ...TWO, self: true }]);
  const g = gemini(b.out, { subagents: [{ id: 'sub-1', role: 'a.one' }] });
  const c = collect(b.out, g.dir);
  assert.equal(c.status, 0, c.text);
  assert.match(c.text, /^collected: 2 complete, 0 not run$/m);
  assert.equal(c.row('| a.one |'), '| a.one | sub-1 | gemini-test-flash | read_file | complete | short |');
  assert.equal(c.row('| a.two |'), '| a.two | sess-1 | gemini-test-session | invoke_subagent | complete | short |');
  assert.equal(b.read('results/transcripts/a.two/session.jsonl'), readFileSync(g.transcript('sess-1'), 'utf8'));
});

test('the run log names the mode of session.json', () => {
  const b = ran();
  assert.match(collect(b.out, gemini(b.out).dir).log, /^- Mode: unknown$/m);
  const auto = ran([ONE], { sessionJson: { mode: 'auto' } });
  assert.match(collect(auto.out, gemini(auto.out).dir).log, /^- Mode: auto$/m);
  const none = ran([ONE], { sessionJson: { mode: undefined } });
  assert.match(collect(none.out, gemini(none.out).dir).log, /^- Mode: unknown$/m);
});

test('an unknown client version is taken from agy --version', () => {
  const b = ran();
  const calls = join(tmp(), 'calls.log');
  const path = stubs(['agy'], `echo "$*" >> '${calls}'\n[ "$1" = --version ] && echo 1.5.15`) + delimiter + bashDir;
  const c = collect(b.out, gemini(b.out).dir, { path });
  assert.equal(c.status, 0, c.text);
  assert.match(c.log, /^- Client version: 1\.5\.15 \(from agy --version\)$/m);
  assert.equal(readFileSync(calls, 'utf8'), '--version\n');
  const own = ran([ONE], { sessionJson: { client_version: '9.9.9' } });
  writeFileSync(calls, '');
  assert.match(collect(own.out, gemini(own.out).dir, { path }).log, /^- Client version: 9\.9\.9$/m);
  assert.equal(readFileSync(calls, 'utf8'), '--version\n', 'a known version still costs exactly one call');
  const failing = stubs(['agy'], 'echo 1.5.15\nexit 3') + delimiter + bashDir;
  const fb = ran();
  const f = collect(fb.out, gemini(fb.out).dir, { path: failing });
  assert.match(f.log, /^- Client version: unknown$/m);
});

test('the client version is unknown without agy', () => {
  const b = ran();
  const c = collect(b.out, gemini(b.out).dir);
  assert.equal(c.status, 0, c.text);
  assert.match(c.log, /^- Client version: unknown$/m);
});

test('the batch root is saved', () => {
  const b = ran();
  collect(b.out, gemini(b.out).dir);
  assert.equal(b.read('results/batch-root.txt'), `${b.out}\n`);
  const lost = ran();
  assert.equal(collect(lost.out, gemini(lost.out, { sessionTranscript: false }).dir).status, 1);
  assert.equal(lost.read('results/batch-root.txt'), `${lost.out}\n`);
});

test('nothing under the gemini dir is changed', () => {
  const b = ran();
  const g = gemini(b.out, { subagents: [{ id: 'sub-1', role: 'a.one' }, { id: 'kid-1', parent: 'sub-1', role: 'reader' }] });
  const before = listing(g.dir);
  assert.equal(collect(b.out, g.dir).status, 0);
  assert.equal(collect(b.out, g.dir).status, 0, 'a second run replaces its own read-only copies');
  assert.deepEqual(listing(g.dir), before);
  const copies = listing(join(b.out, 'results/transcripts')).filter((l) => /\.jsonl?:/.test(l));
  assert.equal(copies.length, 4);
  for (const l of copies) assert.equal(statSync(l.split(':')[0]).mode & 0o222, 0, l);
});

test('an out inside the gemini dir is refused', () => {
  const b = ran();
  gemini(b.out);
  const inside = collect(b.out, dirname(b.out));
  assert.equal(inside.status, 2, inside.text);
  assert.match(inside.text, /inside the client's data folder/);
  const alias = join(tmp(), 'alias');
  symlinkSync(dirname(b.out), alias, 'dir');
  assert.equal(collect(b.out, alias).status, 2, 'the real paths are compared');
  assert.ok(!existsSync(join(b.out, 'results/run-log.md')) && !existsSync(join(b.out, 'results/batch-root.txt')));
});

test('a linked results file or folder is refused', () => {
  for (const name of ['results', 'results/transcripts', 'results/run-log.md', 'results/batch-root.txt']) {
    const b = ran();
    const g = gemini(b.out, { subagents: [{ id: 'sub-1', role: 'a.one' }] });
    const elsewhere = tmp(), target = join(elsewhere, 'target');
    if (name === 'results') { cpSync(join(b.out, 'results'), target, { recursive: true }); rmSync(join(b.out, 'results'), { recursive: true }); }
    else if (name === 'results/transcripts') put(join(target, 'kept.txt'), 'keep\n');
    else put(target, 'keep\n');
    symlinkSync(target, join(b.out, name));
    const before = listing(elsewhere);
    const c = collect(b.out, g.dir);
    assert.equal(c.status, 1, `${name}: ${c.text}`);
    assert.ok(c.text.includes(`${join(b.out, name)} is a link`), c.text);
    assert.deepEqual(listing(elsewhere), before, name);
  }
});

test('a record or transcript outside the data folder is not read', () => {
  const b = ran([ONE, TWO]);
  const g = gemini(b.out, { subagents: [{ id: 'sub-1', role: 'a.one' }, { id: 'sub-2', role: 'a.two' }] });
  const elsewhere = tmp();
  put(join(elsewhere, 'leak.jsonl'), lines('leaked-model', ['read_file']));
  put(join(elsewhere, 'leak.json'), JSON.stringify({ conversationId: 'sub-2', spawnStepIndex: 1, subagentDescriptor: { typeName: 'leaked-type', role: 'a.two' } }));
  rmSync(g.transcript('sub-1'));
  symlinkSync(join(elsewhere, 'leak.jsonl'), g.transcript('sub-1'));
  const record = join(g.dir, 'antigravity-cli/brain/sess-1/.system_generated/subagents/sub-2.json');
  rmSync(record);
  symlinkSync(join(elsewhere, 'leak.json'), record);
  const c = collect(b.out, g.dir);
  assert.equal(c.status, 0, c.text);
  assert.ok(c.row('| a.one |').includes(`| not run: ${g.transcript('sub-1')} is outside the client's data folder |`), c.log);
  assert.ok(c.row('| a.two |').includes(`| not run: ${record} is outside the client's data folder |`), c.log);
  assert.doesNotMatch(c.log, /leaked/);
  assert.ok(!existsSync(join(b.out, 'results/transcripts/a.one/session.jsonl')));
});

test('a nested subagent without a transcript makes its case not run', () => {
  const b = ran();
  const g = gemini(b.out, { subagents: [{ id: 'sub-1', role: 'a.one' }, { id: 'kid-1', parent: 'sub-1', role: 'reader', transcript: false }] });
  const c = collect(b.out, g.dir);
  assert.equal(c.status, 0, c.text);
  assert.match(c.row('| a.one | sub-1 |'), /\| not run: subagent-1: no transcript \|/);
  assert.match(c.text, /^collected: 0 complete, 1 not run$/m);
});

test('an empty model name is no model', () => {
  const b = ran();
  const c = collect(b.out, gemini(b.out, { subagents: [{ id: 'sub-1', role: 'a.one', model: '' }] }).dir);
  assert.match(c.row('| a.one |'), /\| not run: transcript names no model \|/);
});

test('a subagent record that is not JSON matches no case', () => {
  const b = ran();
  const g = gemini(b.out, { subagents: [{ id: 'sub-1', role: 'a.one' }] });
  writeFileSync(join(g.dir, 'antigravity-cli/brain/sess-1/.system_generated/subagents/sub-1.json'), '{ cut off');
  const c = collect(b.out, g.dir);
  assert.equal(c.row('| a.one |'), '| a.one |  |  |  | not run: no subagent record |  |');
});

test('a copy error makes its case not run and the run log is still written', () => {
  const b = ran([ONE, TWO]);
  const g = gemini(b.out, { subagents: [{ id: 'sub-1', role: 'a.one', transcript: false }, { id: 'sub-2', role: 'a.two' }] });
  mkdirSync(g.transcript('sub-1'), { recursive: true });
  const c = collect(b.out, g.dir);
  assert.equal(c.status, 0, c.text);
  assert.ok(c.row('| a.one |').includes(`| not run: cannot copy ${g.transcript('sub-1')}: EISDIR |`), c.log);
  assert.match(c.row('| a.two |'), /\| complete \|/);
});

test('a moved batch keeps its first batch root', () => {
  const b = ran();
  const g = gemini(b.out, { subagents: [{ id: 'sub-1', role: 'a.one' }] });
  assert.equal(collect(b.out, g.dir).status, 0);
  const moved = join(tmp(), 'archived');
  renameSync(b.out, moved);
  assert.equal(collect(moved, g.dir).status, 0);
  assert.equal(readFileSync(join(moved, 'results/batch-root.txt'), 'utf8'), `${b.out}\n`);
});

// A short transcript whose one model turn was cut, as the client marks it.
test('a session transcript that cannot be copied makes every case not run', () => {
  const b = ran([ONE, { ...TWO, self: true }]);
  const g = gemini(b.out, { sessionTranscript: false, subagents: [{ id: 'sub-1', role: 'a.one' }] });
  mkdirSync(g.transcript('sess-1'), { recursive: true });
  const c = collect(b.out, g.dir);
  assert.equal(c.status, 1, c.text);
  assert.match(c.text, /^collected: 0 complete, 2 not run$/m);
  for (const id of ['a.one', 'a.two']) assert.ok(c.row(`| ${id} |`).includes(`| not run: session transcript: cannot copy ${g.transcript('sess-1')}: EISDIR |`), c.log);
});

test('an unreadable subagents folder makes its case not run', { skip: process.getuid?.() === 0 && 'root reads every folder' }, () => {
  const b = ran();
  const g = gemini(b.out, { subagents: [{ id: 'sub-1', role: 'a.one' }, { id: 'kid-1', parent: 'sub-1', role: 'reader' }] });
  const dir = join(g.dir, 'antigravity-cli/brain/sub-1/.system_generated/subagents');
  chmodSync(dir, 0o000);
  let c;
  try { c = collect(b.out, g.dir); } finally { chmodSync(dir, 0o755); }
  assert.equal(c.status, 0, c.text);
  assert.ok(c.row('| a.one |').includes(`| not run: cannot read ${dir}: EACCES |`), c.log);
});

test('a grandchild subagent without a transcript makes its case not run', () => {
  const b = ran();
  const g = gemini(b.out, { subagents: [{ id: 'sub-1', role: 'a.one' }, { id: 'kid-1', parent: 'sub-1', role: 'reader' },
    { id: 'kid-2', parent: 'kid-1', role: 'helper', transcript: false }] });
  const c = collect(b.out, g.dir);
  assert.match(c.row('| a.one | sub-1 |'), /\| not run: subagent-2: no transcript \|/);
});

test('a reply that is a link or a folder is no reply', () => {
  const b = ran([ONE, TWO]);
  rmSync(join(b.out, 'results/a.two/reply.md'));
  symlinkSync(join(b.out, 'results/a.one/reply.md'), join(b.out, 'results/a.two/reply.md'));
  rmSync(join(b.out, 'results/a.one/reply.md'));
  mkdirSync(join(b.out, 'results/a.one/reply.md'));
  const c = collect(b.out, gemini(b.out, { subagents: [{ id: 'sub-1', role: 'a.one' }, { id: 'sub-2', role: 'a.two' }] }).dir);
  assert.match(c.row('| a.one |'), /\| not run: no reply saved \|/);
  assert.match(c.row('| a.two |'), /\| not run: no reply saved \|/);
});

test('the collector refuses an out with a .. segment', () => {
  const b = ran();
  const c = spawnSync(process.execPath, [collector, '--out', `${b.out}/../out`, '--gemini-dir', gemini(b.out).dir], { encoding: 'utf8', env: { PATH: tmp() } });
  assert.equal(c.status, 2, c.stderr);
  assert.match(c.stderr, /--out holds a \.\. segment/);
  assert.ok(!existsSync(join(b.out, 'results/run-log.md')));
});

// A full transcript holds native argument values, not their JSON text.
const native = { Path: '/abs/made-up/file', limit: 2, range: { start: 1, end: 9 } };
const cut = (model) => JSON.stringify({ step_index: 1, source: 'MODEL', type: 'PLANNER_RESPONSE', status: 'DONE', created_at: '2026-01-01T00:00:00Z', model,
  tool_calls: [{ name: 'read_file', args: { Path: '"/abs/made-up/fi' } }], truncated_fields: ['tool_calls'] }) + '\n';

test('the full transcript is copied when the client saved one', () => {
  const b = ran();
  const g = gemini(b.out, { sessionFull: lines('full-session', ['invoke_subagent'], native), subagents: [
    { id: 'sub-1', role: 'a.one', text: cut('short-model'), full: lines('full-model', ['read_file', 'run_command'], native) },
    { id: 'kid-1', parent: 'sub-1', role: 'reader', text: cut('short-kid'), full: lines('full-kid', ['search_web'], native) }] });
  assert.match(readFileSync(g.full('sub-1'), 'utf8'), /"args":\{"Path":"\/abs\/made-up\/file","limit":2,"range":\{"start":1,"end":9\}\}/);
  const c = collect(b.out, g.dir);
  assert.equal(c.status, 0, c.text);
  assert.equal(b.read('results/transcripts/session.jsonl'), readFileSync(g.full('sess-1'), 'utf8'));
  assert.equal(b.read('results/transcripts/a.one/session.jsonl'), readFileSync(g.full('sub-1'), 'utf8'));
  assert.equal(b.read('results/transcripts/a.one/subagent-1.jsonl'), readFileSync(g.full('kid-1'), 'utf8'));
  assert.equal(c.row('| a.one | sub-1 |'), '| a.one | sub-1 | full-model | read_file, run_command | complete | full |');
  assert.equal(c.row('| a.one | subagent-1 |'), '| a.one | subagent-1 | kid-1 | 1 | self | reader | full-kid | search_web | full |');
  assert.match(c.log, /^- Session transcript: full$/m);
  assert.doesNotMatch(c.log, /arguments may be cut/);
});

test('a short transcript is copied when there is no full one, and a cut record is noted', () => {
  const b = ran([ONE, TWO]);
  const g = gemini(b.out, { sessionFull: '', subagents: [{ id: 'sub-1', role: 'a.one', text: cut('short-model'), full: '' }, { id: 'sub-2', role: 'a.two' },
    { id: 'kid-1', parent: 'sub-2', role: 'reader', text: cut('short-kid') }] });
  const c = collect(b.out, g.dir);
  assert.equal(c.status, 0, c.text);
  assert.equal(b.read('results/transcripts/a.one/session.jsonl'), readFileSync(g.transcript('sub-1'), 'utf8'));
  assert.equal(c.row('| a.one |'), '| a.one | sub-1 | short-model | read_file | complete | short, arguments may be cut |');
  assert.equal(c.row('| a.two | sub-2 |'), '| a.two | sub-2 | gemini-test-flash | read_file | complete | short |');
  assert.equal(c.row('| a.two | subagent-1 |'), '| a.two | subagent-1 | kid-1 | 1 | self | reader | short-kid | read_file | short, arguments may be cut |');
  assert.match(c.log, /^- Session transcript: short$/m);
});
