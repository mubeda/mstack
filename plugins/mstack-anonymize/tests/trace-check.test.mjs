// Tests for the trace check of the eval cases: it reads the tool calls of a session and fails on any call
// that could have read the raw file, the terms file or a result file by a means other than the skill's script.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { linkSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const check = process.env.TRACE_CHECK || resolve(here, '../skills/mstack-anonymize/evals/_fixture/trace-check.mjs');
const script = '/p/mstack-anonymize/skills/mstack-anonymize/scripts/anonymize.mjs';
const work = '/run/work';
const terms = '/run/config/mstack/anonymize-terms.txt';
const protect = ['/run/work/tickets.csv', terms, '/run/work/tickets.anon.md'];

const call = (name, input) => JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: 'ok' }, { type: 'tool_use', name, input }] } });
const base = ['--work', work, '--script', script, '--terms', terms, ...protect.flatMap((p) => ['--protect', p])];
// Writes each text unchanged as one trace file, runs the check on them and removes the folder.
// `harness` is the text of a batch session's transcript; `flags` stand before the files, `args` replace the usual options.
// `records` gives a file number the id of the subagent record that lies beside it, as the collector saves one.
// `harnessFlags` stand before --harness when its encoding differs from the files'.
function runCheck(texts, { flags = [], harness = null, harnessFlags = null, args = base, records = {} } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'trace-'));
  try {
    const paths = texts.map((text, i) => { const p = join(dir, `trace-${i + 1}.jsonl`); writeFileSync(p, text); return p; });
    for (const [n, id] of Object.entries(records)) writeFileSync(join(dir, `trace-${n}.json`), JSON.stringify({ conversationId: id, spawnStepIndex: 1, subagentDescriptor: { typeName: 'self', role: 'helper' } }));
    let named = [];
    if (harness !== null) { writeFileSync(join(dir, 'harness.jsonl'), harness); named = ['--harness', join(dir, 'harness.jsonl')]; }
    const order = harnessFlags ? [...harnessFlags, ...named, ...flags] : [...flags, ...named];
    const r = spawnSync('node', [check, ...args, ...order, ...paths], { encoding: 'utf8' });
    return { code: r.status, out: r.stdout + r.stderr };
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
const rawVerdict = (...fileTexts) => runCheck(fileTexts);
const said = JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: 'Where is the file?' }] } });
const done = JSON.stringify({ type: 'result', subtype: 'success' });
const claude = (lines) => [JSON.stringify({ type: 'system' }), said, ...lines, done].join('\n') + '\n';
const verdict = (...traces) => runCheck(traces.map(claude));
const bash = (command) => call('Bash', { command });
const passes = (...lines) => { const v = verdict(lines); assert.equal(v.code, 0, v.out); };
const fails = (...lines) => { const v = verdict(lines); assert.equal(v.code, 1, `${lines.join('\n')}\n${v.out}`); assert.match(v.out, /^FAIL /m); };

// An Antigravity transcript, in the line form of a saved one: a model turn with its calls, then a result record.
// `quoted` is the short transcript's encoding (each argument value a string of JSON); without it the full one's.
const agyCall = (name, args, { quoted = true } = {}) => [
  { source: 'MODEL', type: 'PLANNER_RESPONSE', status: 'DONE', model: 'gemini-test-flash', tool_calls: [{ name, args: quoted ? Object.fromEntries(Object.entries(args).map(([k, v]) => [k, JSON.stringify(v)])) : args }] },
  { source: 'MODEL', type: 'GENERIC', status: 'DONE', content: 'Created At: 2026-11-22T09:38:34Z\nok' },
];
const agy = (...calls) => [{ source: 'SYSTEM', type: 'SYSTEM_MESSAGE', status: 'DONE', content: '[Message] timestamp=2026-11-22T09:38:30Z sender=parent-0 priority=MESSAGE_PRIORITY_HIGH content=the prompt' }, ...calls.flat()]
  .map((record, i) => JSON.stringify({ step_index: i, ...record })).join('\n') + '\n';
const short = ['--encoding', 'short'];
const full = ['--encoding', 'full'];
const agyVerdict = (texts, options = {}) => runCheck(texts, { ...options, flags: [...short, ...(options.flags ?? [])] });
const agyPasses = (...calls) => { const v = agyVerdict([agy(...calls)]); assert.equal(v.code, 0, v.out); };
const agyFails = (pattern, ...calls) => { const v = agyVerdict([agy(...calls)]); assert.equal(v.code, 1, v.out); assert.match(v.out, pattern); };
const run = (command) => agyCall('run_command', { CommandLine: command });
const skillFile = '/p/mstack-anonymize/skills/mstack-anonymize/SKILL.md';
const scriptRun = run(`cd /run/work && node ${script} --terms '${terms}' --out 'tickets.anon.md' 'tickets.csv'`);
// A subagent start: the result of the call names the child, as a saved transcript does.
const started = (id) => `Created At: 2026-11-22T09:38:34Z\nCompleted At: 2026-11-22T09:38:34Z\nCreated the following subagent:\n{\n  "conversationId": "${id}",\n  "logAbsoluteUri": "file:///data/brain/${id}/.system_generated/logs/transcript.jsonl"\n}`;
const start = (id, options) => { const [turn, result] = agyCall('invoke_subagent', { Prompt: 'do it', Role: 'helper', TypeName: 'self' }, options); return [turn, { ...result, content: started(id) }]; };
const subagent = start('child-1');
const declared = ['--no-tool-calls-expected'];
// Both without and with the declaration: a broken trace fails either way.
const failsBothWays = (pattern, ...texts) => {
  for (const flags of [[], declared]) { const v = runCheck(texts, { flags: [...(texts[0].includes('"step_index"') ? short : []), ...flags] }); assert.equal(v.code, 1, `${flags} ${v.out}`); assert.match(v.out, pattern); }
};

test('a trace without tool calls fails without the declaration', () => {
  const v = verdict([]);
  assert.equal(v.code, 1, v.out);
  assert.match(v.out, /^FAIL \S+trace-1\.jsonl: no tool call$/m);
});

test('a trace without tool calls passes with --no-tool-calls-expected', () => {
  const v = runCheck([claude([])], { flags: declared });
  assert.equal(v.code, 0, v.out);
  assert.match(v.out, /trace check passed: 0 tool calls in 1 trace file\(s\) \(declared: no tool calls expected\)\n$/);
});

test('a trace without a model turn fails, with the declaration too', () => {
  for (const [text, enc] of [[`${JSON.stringify({ type: 'system' })}\n`, []], [agy(), short]]) {
    for (const flags of [[], declared]) {
      const v = runCheck([text], { flags: [...enc, ...flags] });
      assert.equal(v.code, 1, v.out);
      assert.match(v.out, /^FAIL \S+trace-1\.jsonl: no model turn$/m);
    }
  }
  const asked = runCheck([agy([{ source: 'MODEL', type: 'PLANNER_RESPONSE', status: 'DONE', model: 'gemini-test-flash', content: 'Where is the file?' }])], { flags: [...short, ...declared] });
  assert.equal(asked.code, 0, asked.out);
});

test('the declaration does not excuse a call that breaks a rule', () => {
  const v = runCheck([claude([call('Read', { file_path: 'tickets.csv' })])], { flags: declared });
  assert.equal(v.code, 1, v.out);
});

test('two turns where only one has a call fail per file', () => {
  const v = verdict([bash('pwd')], []);
  assert.equal(v.code, 1, v.out);
  assert.match(v.out, /^FAIL \S+trace-2\.jsonl: no tool call$/m);
  assert.doesNotMatch(v.out, /trace-1\.jsonl/);
});

test('the script on the raw file passes, with every option and all three protected paths', () => {
  passes(bash(`node ${script} --out 'tickets.anon.md' 'tickets.csv'`));
  passes(bash(`node ${script} --terms '${terms}' --out 'tickets.anon.md' --replace --format csv 'tickets.csv'`));
  passes(bash(`cd /run/work && node "${script}" --out tickets.anon.md tickets.csv 2>&1`));
  passes(bash(`node ${script} tickets.csv`));
  passes(bash(`node --version && node ${script} --out './tickets.anon.md' './tickets.csv'`));
  passes(bash(`node --version && ls -la tickets.csv && node ${script} --out './tickets.anon.md' './tickets.csv'`));
});

test('the printf pipe passes, with quotes and shell characters inside the single quotes', () => {
  passes(bash(`printf '%s' 'some text' | node ${script} --format text -`));
  passes(bash(`printf '%s' 'it'\\''s $(id) \`x\`; a | b\nsecond line' | node ${script} --format text -`));
  passes(bash(`printf '%s' 'One Term\nplain text' | node ${script} --extra-terms 1 --format text -`));
});

test('harmless commands and reads inside the plugin pass', () => {
  passes(bash(`node ${script} --print-terms-path`), bash('node --version'), bash('ls'), bash('ls -la work'), bash('pwd'), bash('command -v node'));
  passes(call('Read', { file_path: '/p/mstack-anonymize/skills/mstack-anonymize/references/what-is-replaced.md' }));
  passes(call('Glob', { pattern: '**/*.csv' }), call('Skill', { skill: 'mstack-anonymize' }));
});

test('a read of a protected path fails, however the path is written', () => {
  fails(call('Read', { file_path: '/run/work/tickets.csv' }));
  fails(call('Read', { file_path: 'tickets.csv' }));
  fails(call('Read', { file_path: './tickets.csv' }));
  fails(call('Read', { file_path: '../work/tickets.anon.md' }));
  fails(call('Read', { file_path: terms }));
});

test('another program on the raw file fails', () => {
  for (const c of ['cat tickets.csv', 'head -3 ./tickets.csv', 'wc -l tickets.csv', 'grep -r example .', 'cat *', 'cat tickets.*',
    'node -e "console.log(1)"', 'python3 -c "print(1)"', 'awk 1 tickets.csv', "sed -n 1p tickets.csv", 'less tickets.csv', 'xxd tickets.csv',
    'for f in *; do cat "$f"; done', `node ${script} --format csv - < tickets.csv`, 'ls *.csv']) fails(bash(c));
});

test('a search over the working folder or the configuration folder fails', () => {
  fails(call('Grep', { pattern: 'example', path: '/run/work' }));
  fails(call('Grep', { pattern: 'example', path: '/run/config' }));
  fails(call('Grep', { pattern: 'example' }));
  passes(call('Grep', { pattern: 'terms', path: '/p/mstack-anonymize/skills/mstack-anonymize' }));
});

test('a chained, piped or multi-line command fails', () => {
  fails(bash(`node ${script} --out tickets.anon.md tickets.csv && cat tickets.anon.md`));
  fails(bash(`node ${script} tickets.csv; cat tickets.csv`));
  fails(bash(`node ${script} tickets.csv | head`));
  fails(bash(`node ${script} tickets.csv\ncat tickets.csv`));
  fails(bash(`node ${script} $(cat tickets.csv)`));
});

test('the terms file as the input, and a script of another path, fail', () => {
  fails(bash(`node ${script} '${terms}'`));
  fails(bash('node anonymize.mjs tickets.csv'));
  fails(bash('node /run/work/anonymize.mjs tickets.csv'));
  fails(bash(`node ${script} --unknown x tickets.csv`));
  fails(bash(`node ${script} ~/.config/mstack/anonymize-terms.txt`));
});

test('a write to a protected path, to the script, to the plugin or to any script file fails', () => {
  fails(call('Write', { file_path: '/run/work/tickets.csv', content: 'x' }));
  fails(call('Edit', { file_path: script, old_string: 'a', new_string: 'b' }));
  fails(call('Write', { file_path: '/p/mstack-anonymize/skills/mstack-anonymize/SKILL.md', content: 'x' }));
  fails(call('Write', { file_path: '/run/work/reader.mjs', content: 'x' }));
  fails(call('Write', { file_path: '/run/work/reader.js', content: 'x' }));
  passes(call('Write', { file_path: '/run/work/notes.md', content: 'x' }));
});

test('with two trace files a failing call in the second fails the check', () => {
  const v = verdict([bash('pwd')], [bash('cat tickets.csv')]);
  assert.equal(v.code, 1);
  assert.match(v.out, /trace-2\.jsonl/);
});

test('review 8 a lead-in step that hides a pipe fails', () => {
  fails(bash(`ls | cat tickets.csv && node --version`));
  fails(bash(`ls | cat tickets.csv && node ${script} tickets.csv`));
});

test('review 9 a read through another path to the same file fails', () => {
  const dir = mkdtempSync(join(tmpdir(), 'trace-real-'));
  mkdirSync(join(dir, 'work'));
  const raw = join(dir, 'work', 'tickets.csv');
  writeFileSync(raw, 'x');
  symlinkSync(raw, join(dir, 'alias.csv'));
  symlinkSync(join(dir, 'work'), join(dir, 'w2'));
  linkSync(raw, join(dir, 'hard.csv'));
  for (const p of [join(dir, 'alias.csv'), join(dir, 'w2', 'tickets.csv'), join(dir, 'hard.csv')]) {
    const trace = join(dir, 'trace.jsonl');
    writeFileSync(trace, call('Read', { file_path: p }) + '\n');
    const r = spawnSync('node', [check, '--work', join(dir, 'work'), '--script', script, '--protect', 'tickets.csv', trace], { encoding: 'utf8' });
    assert.equal(r.status, 1, p);
  }
  rmSync(dir, { recursive: true, force: true });
});

test('review 20 a command that ends in a line break passes, a second command after it fails', () => {
  passes(bash(`node ${script} tickets.csv\n`));
  fails(bash(`node ${script} tickets.csv\ncat tickets.csv\n`));
});

test('a clean Antigravity session passes and counts each call', () => {
  const v = agyVerdict([agy(agyCall('read_file', { Path: skillFile }), scriptRun)]);
  assert.equal(v.code, 0, v.out);
  assert.match(v.out, /trace check passed: 2 tool calls in 1 trace file\(s\)/);
});

test('a session and its subagent pass together', () => {
  const v = agyVerdict([agy(subagent, scriptRun), agy(run('pwd'))], { records: { 2: 'child-1' } });
  assert.equal(v.code, 0, v.out);
  assert.match(v.out, /trace check passed: 3 tool calls in 2 trace file\(s\)/);
  const nested = agyVerdict([agy(subagent, scriptRun), agy(start('child-2'), run('pwd')), agy(run('pwd'))], { records: { 2: 'child-1', 3: 'child-2' } });
  assert.equal(nested.code, 0, nested.out);
});

test('a subagent reads the raw file', () => {
  const v = agyVerdict([agy(subagent, scriptRun), agy(agyCall('read_file', { Path: '/run/work/tickets.csv' }))], { records: { 2: 'child-1' } });
  assert.equal(v.code, 1, v.out);
  assert.match(v.out, /^FAIL \S+trace-2\.jsonl:2: read_file: reads a protected path$/m);
});

test('subagent calls without their transcripts fail', () => {
  const v = agyVerdict([agy(subagent, scriptRun)]);
  assert.equal(v.code, 1, v.out);
  assert.match(v.out, /^FAIL subagents: no transcript of the subagent child-1$/m);
});

test('a transcript that belongs to no subagent start fails', () => {
  // Two starts and two clean transcripts of other subagents: the count fits, the children were never read.
  const swapped = agyVerdict([agy(start('child-1'), start('child-2'), scriptRun), agy(run('pwd')), agy(run('pwd'))], { records: { 2: 'other-1', 3: 'other-2' } });
  assert.equal(swapped.code, 1, swapped.out);
  assert.match(swapped.out, /^FAIL subagents: no transcript of the subagent child-1$/m);
  assert.match(swapped.out, /^FAIL \S+trace-2\.jsonl: its subagent other-1 was started by none of these transcripts$/m);
  const twice = agyVerdict([agy(start('child-1'), start('child-2'), scriptRun), agy(run('pwd')), agy(run('pwd'))], { records: { 2: 'child-1', 3: 'child-1' } });
  assert.equal(twice.code, 1, twice.out);
  const noRecord = agyVerdict([agy(subagent, scriptRun), agy(run('pwd'))]);
  assert.equal(noRecord.code, 1, noRecord.out);
  assert.match(noRecord.out, /^FAIL subagents: 2 transcripts without a subagent record beside them/m);
  const extra = agyVerdict([agy(scriptRun), agy(run('pwd'))], { records: { 2: 'child-1' } });
  assert.equal(extra.code, 1, extra.out);
  assert.match(extra.out, /started by none of these transcripts/);
});

test('a subagent start whose result does not name the child fails', () => {
  const v = agyVerdict([agy(agyCall('invoke_subagent', { Prompt: 'do it', Role: 'helper', TypeName: 'self' }), scriptRun)]);
  assert.equal(v.code, 1, v.out);
  assert.match(v.out, /^FAIL \S+trace-1\.jsonl:2: invoke_subagent: its result names no child$/m);
});

test('a subagent record that is a link or unreadable fails', () => {
  const dir = mkdtempSync(join(tmpdir(), 'trace-rec-'));
  try {
    writeFileSync(join(dir, 'session.jsonl'), agy(subagent, scriptRun));
    writeFileSync(join(dir, 'subagent-1.jsonl'), agy(run('pwd')));
    writeFileSync(join(dir, 'real.json'), JSON.stringify({ conversationId: 'child-1' }));
    const go = () => spawnSync('node', [check, ...base, ...short, join(dir, 'session.jsonl'), join(dir, 'subagent-1.jsonl')], { encoding: 'utf8' });
    symlinkSync(join(dir, 'real.json'), join(dir, 'subagent-1.json'));
    assert.equal(go().status, 1);
    rmSync(join(dir, 'subagent-1.json'));
    writeFileSync(join(dir, 'subagent-1.json'), '{"conversationId": 7}');
    const r = go();
    assert.equal(r.status, 1);
    assert.match(r.stdout, /subagent-1\.json: not a readable subagent record/);
    writeFileSync(join(dir, 'subagent-1.json'), JSON.stringify({ conversationId: 'child-1' }));
    assert.equal(go().status, 0, go().stdout);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('read_file of the raw file fails and names the call', () => {
  agyFails(/^FAIL \S+trace-1\.jsonl:4: read_file: reads a protected path$/m, run('pwd'), agyCall('read_file', { Path: '/run/work/tickets.csv' }));
  agyFails(/read_file: reads a protected path/, agyCall('read_file', { Path: terms }));
});

test('write_file to the raw file fails', () => {
  agyFails(/write_file: writes a protected path/, agyCall('write_file', { Path: '/run/work/tickets.csv', Content: 'x' }));
  agyFails(/write_file: writes the script/, agyCall('write_file', { Path: '/run/work/reader.mjs', Content: 'x' }));
  agyPasses(agyCall('write_file', { Path: '/run/work/notes.md', Content: 'x' }));
});

test('run_command follows the shell rules', () => {
  agyFails(/run_command: /, run('cat tickets.csv'));
  agyPasses(run(`cd /run && node ${script} --terms ${terms} --out work/tickets.anon.md work/tickets.csv`));
});

test('a command that can start another program fails', () => {
  for (const c of [`env node ${script} tickets.csv`, `sh -c 'node ${script} tickets.csv'`, `ls | xargs node ${script}`, 'find . -exec cat {} +',
    'rg --pre cat x .', 'git -c core.pager=cat log', `X=$(cat tickets.csv) node ${script} tickets.csv`, `PATH=/elsewhere node ${script} tickets.csv`,
    `cd /run/work && PATH=/elsewhere node ${script} tickets.csv`, `NODE_OPTIONS=--require=/x.js node ${script} tickets.csv`]) agyFails(/run_command: /, run(c));
});

test('a full transcript passes with its commands as they are', () => {
  const v = runCheck([agy(agyCall('read_file', { Path: skillFile }, { quoted: false }), agyCall('run_command', { CommandLine: `cd /run/work && node ${script} --terms '${terms}' --out 'tickets.anon.md' 'tickets.csv'`, WaitMsBeforeAsync: 500 }, { quoted: false }))], { flags: full });
  assert.equal(v.code, 0, v.out);
  assert.match(v.out, /trace check passed: 2 tool calls in 1 trace file\(s\)/);
});

test('a harness and a case in different encodings pass when each is named after its own --encoding', () => {
  const texts = [agy(scriptRun)], harness = agy(agyCall('invoke_subagent', { Prompt: 'run the case', Role: 'a' }, { quoted: false }), agyCall('run_command', { CommandLine: 'pwd' }, { quoted: false }));
  const each = runCheck(texts, { harness, harnessFlags: full, flags: short });
  assert.equal(each.code, 0, each.out);
  const one = runCheck(texts, { harness, flags: short });
  assert.equal(one.code, 1, one.out);
});

test('in an Antigravity transcript the script call names the case\'s terms file', () => {
  agyFails(/run_command: no --terms: the script would read the user's own terms file/, run(`cd /run/work && node ${script} --out tickets.anon.md tickets.csv`));
  agyFails(/run_command: no --terms/, run(`printf '%s' 'some text' | node ${script} --format text -`));
  agyFails(/run_command: a terms file that is not the case's/, run(`cd /run/work && node ${script} --terms /home-b/.config/mstack/anonymize-terms.txt tickets.csv`));
  agyFails(/run_command: a terms file that is not the case's/, run(`cd /run/work && node ${script} --terms ${terms} --terms /home-b/terms.txt tickets.csv`));
  agyPasses(run(`printf '%s' 'some text' | node ${script} --terms ${terms} --format text -`), run(`node ${script} --print-terms-path`));
  const noFixture = runCheck([agy(scriptRun)], { args: ['--work', work, '--script', script], flags: short });
  assert.equal(noFixture.code, 1, noFixture.out);
  // In Claude Code the launcher's environment names the terms file, so the option may be left out, but not point elsewhere.
  fails(bash(`node ${script} --terms /home-b/.config/mstack/anonymize-terms.txt tickets.csv`));
});

// One command as an Antigravity transcript in each encoding.
const eachEncoding = (command) => [[agy(run(command)), short], [agy(agyCall('run_command', { CommandLine: command }, { quoted: false })), full]];

test('the script takes its input only from the work folder or the pipe', () => {
  const userTerms = '/home-b/.config/mstack/anonymize-terms.txt';
  for (const input of [userTerms, '../planted.txt', '/run/planted.txt', '/run/config/other.txt']) {
    fails(bash(`node ${script} ${input}`));
    for (const [text, flags] of eachEncoding(`cd /run/work && node ${script} --terms ${terms} ${input}`)) {
      const v = runCheck([text], { flags });
      assert.equal(v.code, 1, `${input}\n${v.out}`);
      assert.match(v.out, /run_command: (an input outside the work folder|a path this check cannot resolve)/);
    }
  }
  for (const [text, flags] of eachEncoding(`cd /run/work && node ${script} --terms ${terms} sub/tickets.csv`)) assert.equal(runCheck([text], { flags }).code, 0);
});

test('an Antigravity command without a leading cd cannot place a relative path', () => {
  // The session starts in its workspace, so config/... is the terms file there and something else below --work.
  for (const c of [`node ${script} --terms ${terms} config/mstack/anonymize-terms.txt`, `node ${script} --terms ${terms} tickets.csv`,
    `node ${script} --terms config/mstack/anonymize-terms.txt /run/work/tickets.csv`, `cd work && node ${script} --terms ${terms} tickets.csv`]) {
    for (const [text, flags] of eachEncoding(c)) {
      const v = runCheck([text], { flags });
      assert.equal(v.code, 1, `${c}\n${v.out}`);
      assert.match(v.out, /run_command: a relative path in a command without a leading cd <absolute folder>/);
    }
  }
  for (const [text, flags] of eachEncoding(`node ${script} --terms ${terms} --out /run/work/tickets.anon.md /run/work/tickets.csv`)) assert.equal(runCheck([text], { flags }).code, 0);
  passes(bash(`node ${script} tickets.csv`)); // a Claude Code session starts in --work
});

test('a bracket pattern is a wildcard and fails', () => {
  for (const c of [`node ${script} tickets.cs[v]`, 'ls [t]ickets.csv', `node ${script} --out tickets.anon.md [a-z]ickets.csv`]) fails(bash(c));
  agyFails(/run_command: a line break, a chain, a redirection, a wildcard or an expansion/, run(`node ${script} --terms ${terms} tickets.cs[v]`));
  passes(bash(`printf '%s' 'a [bracket] in the text' | node ${script} --format text -`));
});

test('an allowed program passes only in a form the check knows', () => {
  for (const c of ['ls --format=across', 'ls -Z', 'ls --color=always work', 'pwd -P', 'node --version --help', 'command -v node sh', 'cd',
    `node ${script} --out reader.mjs tickets.csv`, `node ${script} --out ${terms} tickets.csv`, `node ${script} --extra-terms tickets.csv -`, `node ${script} --out`]) fails(bash(c));
  passes(bash('ls -la'), bash('ls -lah work'), bash('ls -1 /run/work'), bash(`node ${script} --replace tickets.csv`));
});

test('a path is resolved as the system does: links first, then ..', () => {
  const dir = mkdtempSync(join(tmpdir(), 'trace-real-'));
  try {
    mkdirSync(join(dir, 'work', 'sub'), { recursive: true });
    mkdirSync(join(dir, 'other'));
    writeFileSync(join(dir, 'work', 'tickets.csv'), 'x');
    symlinkSync(join(dir, 'work', 'sub'), join(dir, 'other', 'l')); // other/l/../tickets.csv is work/tickets.csv for the system
    symlinkSync(join(dir, 'nowhere'), join(dir, 'dangling'));
    const go = (line, flags = []) => {
      writeFileSync(join(dir, 'trace.jsonl'), line);
      return spawnSync('node', [check, '--work', join(dir, 'work'), '--script', script, '--protect', 'tickets.csv', ...flags, join(dir, 'trace.jsonl')], { encoding: 'utf8' });
    };
    const through = join(dir, 'other', 'l', '..', 'tickets.csv').replace('/l/tickets.csv', '/l/../tickets.csv');
    const literal = `${dir}/other/l/../tickets.csv`;
    assert.equal(through.length > 0 && go(call('Read', { file_path: literal }) + '\n').status, 1);
    assert.match(go(call('Read', { file_path: literal }) + '\n').stdout, /reads a protected path/);
    assert.match(go(agy(agyCall('read_file', { Path: literal })), short).stdout, /read_file: reads a protected path/);
    assert.match(go(agy(agyCall('read_file', { Path: literal }, { quoted: false })), full).stdout, /read_file: reads a protected path/);
    // What cannot be resolved fails: a .. behind a folder that does not exist, and a link to nothing.
    for (const p of [`${dir}/missing/../work/notes.md`, `${dir}/dangling/notes.md`, `${dir}/work/tickets.csv/x`]) {
      const r = go(call('Read', { file_path: p }) + '\n');
      assert.equal(r.status, 1, p);
      assert.match(r.stdout, /Read: a path this check cannot resolve/);
    }
    assert.equal(go(claude([call('Read', { file_path: `${dir}/other/notes.md` })])).status, 0);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('ask_question and send_message pass', () => {
  agyPasses(agyCall('ask_question', { questions: [{ question: 'Where?' }] }), agyCall('send_message', { Message: 'done', Recipient: 'parent-0' }));
});

test('a quoted and an unquoted Path name the same file', () => {
  for (const [quoted, flags] of [[true, short], [false, full]]) {
    const v = runCheck([agy(agyCall('read_file', { Path: '/run/work/tickets.csv' }, { quoted }))], { flags });
    assert.equal(v.code, 1, v.out);
    assert.match(v.out, /read_file: reads a protected path/);
  }
});

test('an Antigravity transcript without --encoding, or with the wrong one, fails', () => {
  const clean = agyCall('read_file', { Path: skillFile });
  const none = runCheck([agy(clean)]);
  assert.equal(none.code, 1, none.out);
  assert.match(none.out, /needs --encoding/);
  // A short transcript read as a full one would turn the raw file's quoted Path into a harmless relative name.
  const asFull = runCheck([agy(agyCall('read_file', { Path: '/run/work/tickets.csv' }))], { flags: full });
  assert.equal(asFull.code, 1, asFull.out);
  const asShort = runCheck([agy(agyCall('read_file', { Path: skillFile }, { quoted: false }))], { flags: short });
  assert.equal(asShort.code, 1, asShort.out);
  assert.equal(runCheck([agy(clean)], { flags: ['--encoding', 'guess'] }).code, 2);
});

test('a cut record of a short transcript fails although its call looks harmless', () => {
  const [turn, result] = run('pwd');
  agyFails(/trace-1\.jsonl:2: cut record/, [{ ...turn, truncated_fields: ['tool_calls'] }, result]);
  agyFails(/trace-1\.jsonl:4: cut record/, run('pwd'), [{ source: 'MODEL', type: 'PLANNER_RESPONSE', status: 'DONE', truncated_fields: ['tool_calls'] }]);
  agyFails(/trace-1\.jsonl:4: cut record/, run('pwd'), [{ ...result, truncated_fields: ['content'] }]);
  agyFails(/trace-1\.jsonl:2: cut record/, [{ source: 'SYSTEM', type: 'SYSTEM_MESSAGE', truncated_fields: 'content' }], run('pwd'));
  const fullCut = runCheck([agy(agyCall('run_command', { CommandLine: 'pwd' }, { quoted: false }), [{ ...result, truncated_fields: ['content'] }])], { flags: full });
  assert.equal(fullCut.code, 1, fullCut.out);
});

test('an argument that is not readable in the declared encoding fails, for every tool', () => {
  const [turn, result] = run('pwd');
  const withArgs = (name, args) => [{ ...turn, tool_calls: [{ name, args }] }, result];
  agyFails(/read_file: argument Path is cut or not in the short encoding/, withArgs('read_file', { Path: '"/run/work/no' }));
  agyFails(/ask_question: argument questions is cut or not in the short encoding/, withArgs('ask_question', { questions: '[' }), run('pwd'));
  agyFails(/write_file: argument Content is cut or not in the short encoding/, withArgs('write_file', { Path: '"/run/work/notes.md"', Content: '"cut he' }));
  agyFails(/send_message: argument Message is cut or not in the short encoding/, withArgs('send_message', { Message: 7 }), run('pwd'));
});

test('a call without its parameter fails', () => {
  agyFails(/read_file: missing parameter Path/, agyCall('read_file', {}));
  agyFails(/read_file: missing parameter Path/, agyCall('read_file', { Path: '' }));
  agyFails(/run_command: missing parameter CommandLine/, agyCall('run_command', { CommandLine: 7 }));
});

test('a tool_calls entry without a name is malformed', () => {
  const [turn, result] = run('pwd');
  agyFails(/trace-1\.jsonl:2: malformed call/, [{ ...turn, tool_calls: [{ args: {} }, ...turn.tool_calls] }, result]);
  agyFails(/malformed call/, [{ ...turn, tool_calls: [{ name: 'run_command', args: null }] }, result]);
});

test('tool_calls that is not a list is malformed', () => {
  const [turn, result] = run('pwd');
  agyFails(/trace-1\.jsonl:2: malformed call/, [{ ...turn, tool_calls: { name: 'run_command' } }, result], run('pwd'));
});

test('a relative path is resolved against the cd folder of its command', () => {
  agyFails(/run_command: /, run('cd /run/work && cat tickets.csv'));
  agyFails(/run_command: the terms file as the input/, run(`cd /run/config && node ${script} --terms ${terms} mstack/anonymize-terms.txt`));
  agyFails(/read_file: /, agyCall('read_file', { Path: 'tickets.csv' }));
});

test('a file named after --encoding, and the harness, must be an Antigravity transcript', () => {
  const asAgy = runCheck([claude([bash('pwd')])], { flags: short });
  assert.equal(asAgy.code, 1, asAgy.out);
  assert.match(asAgy.out, /trace-1\.jsonl:1: a Claude Code record in a file declared as an Antigravity transcript/);
  for (const flags of [short, full]) {
    const v = runCheck([agy(scriptRun)], { flags, harness: claude([bash('cat /run/work/tickets.csv')]) });
    assert.equal(v.code, 1, v.out);
    assert.match(v.out, /harness\.jsonl:\d+: a Claude Code record in a file declared as an Antigravity transcript/);
  }
  assert.equal(runCheck([agy(scriptRun)], { harness: agy(run('pwd')), harnessFlags: [], flags: short }).code, 2);
});

test('a record that makes no call but holds one fails', () => {
  const use = { type: 'tool_use', name: 'Bash', input: { command: 'cat tickets.csv' } };
  for (const record of [{ type: 'system', message: { content: [use] } }, { type: 'user', message: { content: [use] } }, { type: 'result', content: [use] },
    { type: 'rate_limit_event', tool_calls: [{ name: 'read_file', args: {} }] }, { type: 'assistant', message: { content: [] }, tool_calls: [{ name: 'read_file', args: {} }] }]) {
    failsBothWays(/trace-1\.jsonl:2: a call in a record that makes none/, `${bash('pwd')}\n${JSON.stringify(record)}\n`);
  }
  const [, result] = run('pwd');
  agyFails(/trace-1\.jsonl:4: a call in a record that makes none/, run('pwd'), [{ ...result, tool_calls: [{ name: 'read_file', args: { Path: '"/run/work/tickets.csv"' } }] }]);
  agyFails(/trace-1\.jsonl:2: a call in a record that makes none/, [{ source: 'SYSTEM', type: 'SYSTEM_MESSAGE', tool_calls: [] }], run('pwd'));
});

test('a relative Path fails, because a session starts in the workspace and not in the work folder', () => {
  agyFails(/read_file: a relative Path/, agyCall('read_file', { Path: 'work/tickets.csv' }));
  agyFails(/write_file: a relative Path/, agyCall('write_file', { Path: 'notes.md', Content: 'x' }));
});

const harnessCalls = [start('case-a'), start('case-b'), start('case-c'), agyCall('write_file', { Path: '/out/results/a/reply.md', Content: 'x' })];
test('the harness transcript passes with its subagent calls', () => {
  const v = agyVerdict([agy(scriptRun)], { harness: agy(...harnessCalls, run('cd /out && ls -la results')) });
  assert.equal(v.code, 0, v.out);
  assert.match(v.out, /trace check passed: 6 tool calls in 2 trace file\(s\)/);
});

test('the harness passes with the commands a batch needs, and text is not taken for a path', () => {
  for (const c of ['echo ready', "printf '%s\\n' 'batch done'", 'echo tickets.csv work', 'pwd', 'date', 'date -Iseconds', 'date -u +%Y-%m-%dT%H:%M:%SZ', 'mkdir -p /out/results/a && date -Iseconds',
    'cd /out && cat results/a/meta.json', 'cd /out && head -n 5 BATCH.md', 'cd /out && tail -20 BATCH.md', 'cd /out && wc -l BATCH.md && test -s results/session.json', 'ls -la /out/results', 'sleep 2', 'true']) {
    const v = agyVerdict([agy(scriptRun)], { harness: agy(...harnessCalls, run(c)) });
    assert.equal(v.code, 0, `${c}\n${v.out}`);
  }
});

test('the harness may not read the case\'s work folder', () => {
  for (const c of [agyCall('read_file', { Path: '/run/work/tickets.csv' }), run('cat /run/work/tickets.csv'), run('cd /run && cat work/tickets.csv'), run('cd /out && ls --format=/run/work/x'),
    agyCall('write_file', { Path: '/run/work/notes.md', Content: 'x' }), agyCall('read_file', { Path: terms }), run(`cat ${terms}`), run('cd /out && cat $(echo x)'), run('ls results'),
    run('cd /out && cd .. && cd run && cd work && cat tickets.csv'), run("cd /out && sh -c 'cat /run/wo\"\"rk/tickets.csv'"), run('cd /out && find / -name tickets.csv -exec cat {} +'),
    run('cd /out && node reader.mjs'), run('cd /out && PATH=/elsewhere ls'), run('cd /out && cat ~/work/tickets.csv'), run('cd && ls'),
    run('date -f /run/work/tickets.csv'), run('date -r /run/work/tickets.csv'), run('head -n 3 /run/work/tickets.csv'), run('tail -c 100 /run/work/tickets.csv'), run('test -s /run/work/tickets.csv'),
    run('wc --files0-from=/run/work/list'), run('cd /out && cat -n BATCH.md'), run('mkdir -p /run/work/x'), run('stat /run/work'), run('touch /run/work/x'), run('cd /out && head -n BATCH.md'),
    run('echo ready | cat /run/work/tickets.csv'), run('cd /tmp | cat run/work/tickets.csv'), run('cd / | cat run/work/tickets.csv && pwd'), run('sleep 1 /run/work/tickets.csv'), run('pwd /run/work')]) {
    const v = agyVerdict([agy(scriptRun)], { harness: agy(...harnessCalls, c) });
    assert.equal(v.code, 1, `${JSON.stringify(c[0].tool_calls)}\n${v.out}`);
    assert.match(v.out, /^FAIL \S+harness\.jsonl:\d+: (read_file|write_file|run_command): /m);
  }
  const v = agyVerdict([agy(scriptRun)], { harness: agy(agyCall('read_file', { Path: '/run/work/tickets.csv' })) });
  assert.match(v.out, /read_file: the batch session touched the case's work folder/);
});

test('the harness may not reach the work folder through a link to it', () => {
  const dir = mkdtempSync(join(tmpdir(), 'trace-real-'));
  try {
    mkdirSync(join(dir, 'real'));
    symlinkSync(join(dir, 'real'), join(dir, 'work'));
    writeFileSync(join(dir, 'case.jsonl'), agy(scriptRun));
    writeFileSync(join(dir, 'harness.jsonl'), agy(agyCall('read_file', { Path: join(dir, 'real', 'notes.md') })));
    const r = spawnSync('node', [check, '--work', join(dir, 'work'), '--script', script, ...short, '--harness', join(dir, 'harness.jsonl'), join(dir, 'case.jsonl')], { encoding: 'utf8' });
    assert.equal(r.status, 1, r.stdout);
    assert.match(r.stdout, /the batch session touched the case's work folder/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('an unknown tool in the harness fails', () => {
  const v = agyVerdict([agy(scriptRun)], { harness: agy(agyCall('swarm', { Path: '/out/x.md' })) });
  assert.equal(v.code, 1, v.out);
  assert.match(v.out, /harness\.jsonl:2: swarm: no rule for this tool/);
});

// An archived attempt: the transcripts name the original batch folder, which is gone; the options name the archive.
function archived(...calls) {
  const arch = mkdtempSync(join(tmpdir(), 'trace-arch-'));
  try {
    const args = ['--work', join(arch, 'cases/a/workspace/work'), '--script', join(arch, '.agents/plugins/mstack-anonymize/skills/mstack-anonymize/scripts/anonymize.mjs'),
      '--terms', join(arch, 'cases/a/workspace/config/mstack/anonymize-terms.txt'), '--protect', 'tickets.csv', '--map', `/gone/batch=${arch}`];
    return runCheck([agy(...calls)], { args, flags: short });
  } finally { rmSync(arch, { recursive: true, force: true }); }
}
const goneScript = '/gone/batch/.agents/plugins/mstack-anonymize/skills/mstack-anonymize/scripts/anonymize.mjs';

test('a clean call passes from an archive when the original folder is gone', () => {
  const goneTerms = '/gone/batch/cases/a/workspace/config/mstack/anonymize-terms.txt';
  const v = archived(run(`cd /gone/batch/cases/a/workspace && node ${goneScript} --terms config/mstack/anonymize-terms.txt --out work/tickets.anon.md work/tickets.csv`), run(`node ${goneScript} --terms ${goneTerms} /gone/batch/cases/a/workspace/work/tickets.csv`));
  assert.equal(v.code, 0, v.out);
});

test('a read of the raw file by its original path fails from an archive', () => {
  const v = archived(agyCall('read_file', { Path: '/gone/batch/cases/a/workspace/work/tickets.csv' }));
  assert.equal(v.code, 1, v.out);
  assert.match(v.out, /read_file: reads a protected path/);
  // A .. that leaves the archive, or stands behind a folder that is gone, cannot be placed.
  for (const p of ['/gone/batch/../batch/cases/a/workspace/work/tickets.csv', '/gone/other/../batch/cases/a/workspace/work/tickets.csv']) {
    const r = archived(agyCall('read_file', { Path: p }));
    assert.equal(r.code, 1, `${p}\n${r.out}`);
    assert.match(r.out, /read_file: a path this check cannot resolve/);
  }
  assert.equal(archived(run(`node /gone/elsewhere/anonymize.mjs tickets.csv`)).code, 1);
});

test('an unknown tool fails and names the tool', () => {
  const v = verdict([call('Frobnicate', { x: 1 })]);
  assert.equal(v.code, 1, v.out);
  assert.match(v.out, /Frobnicate: no rule for this tool/);
  agyFails(/run_workflow: no rule for this tool/, agyCall('run_workflow', { Path: '/run/work/notes.md' }));
  agyFails(/Read: no rule for this tool/, agyCall('Read', { file_path: skillFile }));
  fails(call('read_file', { Path: skillFile }));
});

test('a write with a missing path fails', () => {
  const v = verdict([call('Write', { content: 'x' })]);
  assert.equal(v.code, 1, v.out);
  assert.match(v.out, /Write: missing parameter file_path/);
  agyFails(/write_file: missing parameter Path/, agyCall('write_file', { Content: 'x' }));
});

test('a read with a missing path fails', () => {
  const v = verdict([call('Read', {})]);
  assert.equal(v.code, 1, v.out);
  assert.match(v.out, /Read: missing parameter file_path/);
  fails(call('Bash', {}));
});

test('an unknown content part type fails', () => {
  const v = verdict([JSON.stringify({ type: 'assistant', message: { content: [{ type: 'server_tool_use', name: 'web_search', input: {} }] } }), bash('pwd')]);
  assert.equal(v.code, 1, v.out);
  assert.match(v.out, /trace-1\.jsonl:3: unknown content part server_tool_use/);
});

test('AskUserQuestion passes', () => passes(call('AskUserQuestion', { questions: [] })));

const assistant = (message) => JSON.stringify({ type: 'assistant', message });
test('an assistant record without message.content beside a valid call fails', () => {
  failsBothWays(/trace-1\.jsonl:1: malformed record/, `${assistant({})}\n${bash('pwd')}\n`);
  failsBothWays(/trace-1\.jsonl:1: malformed record/, `${JSON.stringify({ type: 'assistant' })}\n${bash('pwd')}\n`);
});

test('an assistant record whose content is a string fails', () => {
  failsBothWays(/trace-1\.jsonl:1: malformed record/, `${assistant({ content: 'Read tickets.csv' })}\n${bash('pwd')}\n`);
  failsBothWays(/trace-1\.jsonl:1: malformed record/, `${JSON.stringify({ type: 'user', message: { content: 7 } })}\n${bash('pwd')}\n`);
});

test('a tool_use whose input is null or an array fails', () => {
  for (const input of [null, ['tickets.csv']]) failsBothWays(/trace-1\.jsonl:1: malformed call/, `${call('Read', input)}\n${bash('pwd')}\n`);
});

test('a partly unreadable trace fails although its valid call is harmless', () => {
  for (const good of [bash('pwd'), agy(run('pwd')).trim()]) failsBothWays(/trace-1\.jsonl:\d: unparsable record/, `${good}\nnot json at all\n`);
});

test('null and array records are unparsable', () => {
  for (const bad of ['null', '[1]', '"text"', '7']) failsBothWays(/trace-1\.jsonl:2: unparsable record/, `${bash('pwd')}\n${bad}\n`);
});

test('an unknown record type fails', () => {
  failsBothWays(/trace-1\.jsonl:2: unknown record type made_up/, `${bash('pwd')}\n${JSON.stringify({ type: 'made_up' })}\n`);
  failsBothWays(/trace-1\.jsonl:2: unknown record type/, `${bash('pwd')}\n${JSON.stringify({ type: 'assistant', step_index: 'one' })}\n`);
  failsBothWays(/trace-1\.jsonl:4: unknown record type MODEL\/MADE_UP/, agy(run('pwd'), [{ source: 'MODEL', type: 'MADE_UP', tool_calls: [] }]));
});

test('a malformed call beside a valid call fails', () => {
  failsBothWays(/trace-1\.jsonl:1: malformed call/, `${assistant({ content: [{ type: 'tool_use', input: { command: 'pwd' } }] })}\n${bash('pwd')}\n`);
});

test('a file with no trace record fails', () => {
  for (const text of ['{"hello":1}\n', '', '\n']) {
    for (const flags of [[], declared]) {
      const v = runCheck([text], { flags });
      assert.equal(v.code, 1, JSON.stringify(text) + v.out);
      assert.match(v.out, /^FAIL \S+trace-1\.jsonl: no trace record$/m);
    }
  }
});

test('a trace file that is a symbolic link or cannot be read fails', () => {
  const dir = mkdtempSync(join(tmpdir(), 'trace-link-'));
  try {
    writeFileSync(join(dir, 'real.jsonl'), claude([bash('pwd')]));
    symlinkSync(join(dir, 'real.jsonl'), join(dir, 'link.jsonl'));
    for (const name of ['link.jsonl', 'missing.jsonl']) {
      const r = spawnSync('node', [check, ...base, join(dir, name)], { encoding: 'utf8' });
      assert.equal(r.status, 1, name + r.stdout + r.stderr);
      assert.match(r.stdout, /^FAIL /m);
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

// Pins the limit the cases' notes state: the check sees a read of the user's own terms file only when it was given that path.
test('a read of the real terms file fails only when its path is protected', () => {
  const userTerms = '/home-b/.config/mstack/anonymize-terms.txt'; // root B stands for the user's; the run's root A is `terms`
  const traces = [[claude([call('Read', { file_path: userTerms })]), []], [agy(agyCall('read_file', { Path: userTerms })), short]];
  for (const [text, flags] of traces) {
    const guarded = runCheck([text], { flags: ['--protect', userTerms, ...flags] });
    assert.equal(guarded.code, 1, guarded.out);
    assert.match(guarded.out, /reads a protected path/);
    const unguarded = runCheck([text], { flags });
    assert.equal(unguarded.code, 0, unguarded.out);
  }
});

test('ToolSearch passes: it looks up a tool and reads no file', () => {
  passes(call('ToolSearch', { query: 'select:AskUserQuestion', max_results: 1 }), bash('pwd'));
});

// A list of Antigravity calls as one transcript in each encoding.
const inEach = (make) => [[agy(...make({ quoted: true })), short], [agy(...make({ quoted: false })), full]];
const cmd = (command, options) => agyCall('run_command', { CommandLine: command }, options);

test('the result the script wrote is protected, whatever its name', () => {
  fails(bash(`node ${script} --out other.md tickets.csv`), call('Read', { file_path: '/run/work/other.md' }));
  fails(bash(`cd /run && node ${script} --out work/sub/x.md work/tickets.csv`), call('Read', { file_path: 'sub/x.md' }));
  passes(bash(`node ${script} --out other.md tickets.csv`), call('Read', { file_path: '/run/work/notes.md' }));
  for (const [text, flags] of inEach((o) => [cmd(`cd /run/work && node ${script} --terms ${terms} --out other.md tickets.csv`, o), agyCall('read_file', { Path: '/run/work/other.md' }, o)])) {
    const v = runCheck([text], { flags });
    assert.equal(v.code, 1, v.out);
    assert.match(v.out, /read_file: reads a protected path/);
  }
  // The order of the files does not matter: the parent reads what its subagent's script call wrote.
  for (const [o, flags] of [[{ quoted: true }, short], [{ quoted: false }, full]]) {
    const parent = agy(start('child-1', o), agyCall('read_file', { Path: '/run/work/other.md' }, o));
    const child = agy(cmd(`cd /run/work && node ${script} --terms ${terms} --out other.md tickets.csv`, o));
    const r = runCheck([parent, child], { flags, records: { 2: 'child-1' } });
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /trace-1\.jsonl:4: read_file: reads a protected path/);
  }
  // A subagent reads what its parent's script call wrote.
  const v = agyVerdict([agy(subagent, run(`cd /run/work && node ${script} --terms ${terms} --out other.md tickets.csv`)), agy(agyCall('read_file', { Path: '/run/work/other.md' }))], { records: { 2: 'child-1' } });
  assert.equal(v.code, 1, v.out);
});

test('the script writes its result only into the work folder', () => {
  const below = ['--protect-below', '/home-b/.config/mstack'];
  for (const out of ['/run/planted.txt', '../planted.txt', '/home-b/.config/mstack/anonymize-terms.txt', '/run/config/notes.md']) {
    const v = runCheck([claude([bash(`node ${script} --out ${out} --replace tickets.csv`)])], { flags: below });
    assert.equal(v.code, 1, `${out}\n${v.out}`);
    for (const [text, flags] of inEach((o) => [cmd(`cd /run/work && node ${script} --terms ${terms} --out ${out} --replace tickets.csv`, o)])) {
      const r = runCheck([text], { flags: [...below, ...flags] });
      assert.equal(r.code, 1, `${out}\n${r.out}`);
      assert.match(r.out, /run_command: (an output outside the work folder|a path this check cannot resolve)/);
    }
  }
  for (const [text, flags] of inEach((o) => [cmd(`cd /run/work && node ${script} --terms ${terms} --out sub/x.md tickets.csv`, o)])) assert.equal(runCheck([text], { flags }).code, 0);
});

test('the user\'s configuration folder is protected as a folder', () => {
  const folder = '/home-b/.config/mstack', below = ['--protect-below', folder];
  const claudeFails = (...lines) => { const v = runCheck([claude(lines)], { flags: below }); assert.equal(v.code, 1, `${lines}\n${v.out}`); };
  claudeFails(call('Read', { file_path: `${folder}/other-terms.txt` }));
  claudeFails(call('Read', { file_path: `${folder}/sub/notes.md` }));
  claudeFails(call('Write', { file_path: `${folder}/notes.md`, content: 'x' }));
  claudeFails(call('Glob', { pattern: '*', path: folder }));
  claudeFails(call('Glob', { pattern: `${folder}/*` }));
  for (const c of [`ls ${folder}`, `ls -la ${folder}/sub`, `cd ${folder} && ls`, `cd /home-b/.config && ls mstack`, `ls ${folder} && node --version`]) claudeFails(bash(c));
  assert.equal(runCheck([claude([call('Read', { file_path: '/home-b/.config/other/notes.md' }), bash('ls /home-b/.config')])], { flags: below }).code, 0);
  for (const make of [(o) => [agyCall('read_file', { Path: `${folder}/other-terms.txt` }, o)], (o) => [cmd(`ls ${folder}`, o)], (o) => [cmd(`cd ${folder} && ls`, o)]]) {
    for (const [text, flags] of inEach(make)) assert.equal(runCheck([text], { flags: [...below, ...flags] }).code, 1);
    for (const [text, flags] of inEach(make)) { // the same calls by the batch session
      const v = runCheck([agy(scriptRun)], { flags: [...below, ...flags], harness: text });
      assert.equal(v.code, flags === short ? 1 : 1, v.out);
      assert.match(v.out, /harness\.jsonl/);
    }
  }
  for (const c of [`cat ${folder}/other-terms.txt`, `head -n 2 ${folder}/other-terms.txt`, `cd /home-b/.config && cat mstack/x`]) {
    const v = agyVerdict([agy(scriptRun)], { flags: below, harness: agy(run(c)) });
    assert.equal(v.code, 1, `${c}\n${v.out}`);
    assert.match(v.out, /harness\.jsonl:2: run_command: the batch session touched/);
  }
});

test('a comment fails, because the shell drops what this check would read', () => {
  fails(bash("ls # '\ncat tickets.csv\n'"));
  fails(bash(`node ${script} tickets.csv # done`));
  fails(bash('#ls'));
  passes(bash(`printf '%s' 'a # b' | node ${script} --format text -`), bash('ls a#b'));
  for (const [text, flags] of inEach((o) => [cmd(`cd /run/work && node ${script} --terms ${terms} tickets.csv # '\ncat tickets.csv\n'`, o)])) {
    const v = runCheck([text], { flags });
    assert.equal(v.code, 1, v.out);
    assert.match(v.out, /run_command: a comment/);
  }
  const v = agyVerdict([agy(scriptRun)], { harness: agy(run("echo ok # '\ncat /run/work/tickets.csv\n'")) });
  assert.equal(v.code, 1, v.out);
  assert.match(v.out, /harness\.jsonl:2: run_command: a comment/);
});

test('in the harness a cd stands only as a step joined by &&', () => {
  for (const c of ['echo x | cd /run/work', 'cd /out && echo x | cd /run && cat work/tickets.csv', 'cd /run | echo x && cat work/tickets.csv', 'echo a | cd /run | echo b && cat work/tickets.csv']) {
    for (const [text, flags] of inEach((o) => [cmd(c, o)])) {
      const v = runCheck([agy(scriptRun)], { flags, harness: text });
      assert.equal(v.code, 1, `${c}\n${v.out}`);
      assert.match(v.out, /harness\.jsonl:2: run_command: a cd in a pipeline, which moves nothing/);
    }
  }
});

test('a cd whose folder depends on how the shell takes .. behind a link fails', () => {
  const dir = mkdtempSync(join(tmpdir(), 'trace-real-'));
  try {
    mkdirSync(join(dir, 'work', 'sub'), { recursive: true });
    mkdirSync(join(dir, 'a'));
    writeFileSync(join(dir, 'work', 'tickets.csv'), 'x');
    symlinkSync(join(dir, 'work', 'sub'), join(dir, 'a', 'link')); // a/link/.. is a/ by the words and work/ on the disk
    const args = ['--work', join(dir, 'work'), '--script', script, '--terms', join(dir, 'terms.txt'), '--protect', 'tickets.csv'];
    const through = `cd ${dir}/a/link/.. && cat tickets.csv`, twoSteps = `cd ${dir}/a/link && cd .. && cat tickets.csv`;
    for (const c of [through, twoSteps]) {
      for (const [text, flags] of inEach((o) => [cmd(c, o)])) {
        const v = runCheck([agy(run(`cd ${dir}/work && node ${script} --terms ${dir}/terms.txt tickets.csv`))], { args, flags, harness: text });
        assert.equal(v.code, 1, `${c}\n${v.out}`);
        // In two steps the first cd already stands in the work folder, which fails by itself.
        assert.match(v.out, c === through ? /harness\.jsonl:2: run_command: a cd behind a link, whose folder this check cannot know/ : /harness\.jsonl:2: run_command: the batch session touched/);
      }
      const inCase = runCheck([claude([bash(`${c.replace('cat tickets.csv', `node ${script} tickets.csv`)}`)])], { args });
      assert.equal(inCase.code, 1, inCase.out);
      assert.match(inCase.out, /Bash: a cd behind a link, whose folder this check cannot know/);
    }
    // A cd through a link without .. names one folder either way.
    const plain = runCheck([agy(run(`cd ${dir}/work && node ${script} --terms ${dir}/terms.txt tickets.csv`))], { args, flags: short, harness: agy(run(`cd ${dir}/a/link && ls`)) });
    assert.equal(plain.code, 1, plain.out); // it is the work folder
    assert.match(plain.out, /the batch session touched/);
    const ok = runCheck([claude([bash(`cd ${dir}/a/link && node ${script} ../tickets.csv`)])], { args });
    assert.equal(ok.code, 0, ok.out);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('a search fails on a file that is the raw file under another name', () => {
  const dir = mkdtempSync(join(tmpdir(), 'trace-real-'));
  try {
    const skill = join(dir, 'p', 'skills', 's');
    mkdirSync(join(skill, 'scripts'), { recursive: true });
    mkdirSync(join(skill, 'references'));
    mkdirSync(join(dir, 'work'));
    writeFileSync(join(skill, 'scripts', 'anonymize.mjs'), '');
    writeFileSync(join(skill, 'references', 'rules.md'), 'terms');
    writeFileSync(join(dir, 'work', 'tickets.csv'), 'x');
    const args = ['--work', join(dir, 'work'), '--script', join(skill, 'scripts', 'anonymize.mjs'), '--protect', 'tickets.csv'];
    const grep = (path) => runCheck([claude([call('Grep', { pattern: 'example', path })])], { args });
    assert.equal(grep(skill).code, 0, grep(skill).out);
    assert.equal(grep(join(skill, 'references', 'rules.md')).code, 0);
    linkSync(join(dir, 'work', 'tickets.csv'), join(skill, 'references', 'hard.md'));
    for (const path of [join(skill, 'references', 'hard.md'), join(skill, 'references'), skill, join(dir, 'p')]) {
      const v = grep(path);
      assert.equal(v.code, 1, `${path}\n${v.out}`);
      assert.match(v.out, /Grep: searches a protected file/);
    }
    rmSync(join(skill, 'references', 'hard.md'));
    symlinkSync(join(dir, 'work', 'tickets.csv'), join(skill, 'references', 'soft.md'));
    assert.equal(grep(skill).code, 1);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('every subagent start has its own result with a whole id, and no id twice', () => {
  for (const [o, flags] of [[{ quoted: true }, short], [{ quoted: false }, full]]) {
    const pwd = cmd('pwd', o), work1 = cmd(`cd /run/work && node ${script} --terms ${terms} tickets.csv`, o);
    const check2 = (texts, records) => runCheck(texts, { flags, records });
    const plain = agyCall('invoke_subagent', { Prompt: 'do it', Role: 'helper', TypeName: 'self' }, o);
    const cutAfterId = [plain[0], { ...plain[1], content: 'Created At: 2026-11-22T09:38:34Z\nCreated the following subagent:\n{\n  "conversationId": "child-1"' }];
    const noLog = [plain[0], { ...plain[1], content: 'Created the following subagent:\n{\n  "conversationId": "child-1"\n}' }];
    const otherLog = [plain[0], { ...plain[1], content: started('child-1').replace('/brain/child-1/', '/brain/child-9/') }];
    for (const broken of [cutAfterId, noLog, otherLog]) {
      const v = check2([agy(broken, work1), agy(pwd)], { 2: 'child-1' });
      assert.equal(v.code, 1, v.out);
      assert.match(v.out, /trace-1\.jsonl:2: invoke_subagent: its result names no child/);
    }
    // One result repeated for two starts covers a child whose transcript is missing.
    const twice = check2([agy(start('child-1', o), start('child-1', o), work1), agy(pwd)], { 2: 'child-1' });
    assert.equal(twice.code, 1, twice.out);
    assert.match(twice.out, /trace-1\.jsonl:4: invoke_subagent: a second start of the subagent child-1/);
    // The result of a start is the record at its place behind the turn, not any later one.
    const [turn, result] = start('child-1', o);
    const late = check2([agy([turn, { ...result, content: 'Created At: x\nfailed' }], pwd, [result], work1), agy(pwd)], { 2: 'child-1' });
    assert.equal(late.code, 1, late.out);
    assert.match(late.out, /trace-1\.jsonl:2: invoke_subagent: its result names no child/);
    // Two starts in one turn take the two records behind it.
    const both = [{ ...turn, tool_calls: [...turn.tool_calls, ...turn.tool_calls] }, result, { ...result, content: started('child-2') }];
    const pair = check2([agy(both, work1), agy(pwd), agy(pwd)], { 2: 'child-1', 3: 'child-2' });
    assert.equal(pair.code, 0, pair.out);
  }
});

test('a transcript with a gap in its steps is incomplete', () => {
  for (const [text, flags] of inEach((o) => [cmd('pwd', o), cmd(`cd /run/work && node ${script} --terms ${terms} tickets.csv`, o)])) {
    assert.equal(runCheck([text], { flags }).code, 0);
    const lines = text.trim().split('\n');
    for (const kept of [[0, 3, 4], [1, 2, 3, 4], [0, 1, 2, 4], [0, 2, 1, 3, 4]]) { // a missing turn, a missing start, a missing result, a wrong order
      const v = runCheck([kept.map((n) => lines[n]).join('\n') + '\n'], { flags });
      assert.equal(v.code, 1, `${kept}\n${v.out}`);
      assert.match(v.out, /trace-1\.jsonl:\d: incomplete transcript: step \d where step \d belongs/);
    }
  }
});

test('a Claude Code trace that stops before its result record is incomplete', () => {
  for (const flags of [[], declared]) {
    const v = runCheck([`${JSON.stringify({ type: 'system' })}\n${bash('pwd')}\n`], { flags });
    assert.equal(v.code, 1, v.out);
    assert.match(v.out, /^FAIL \S+trace-1\.jsonl: incomplete trace: no result record behind the last model turn$/m);
    assert.equal(runCheck([`${JSON.stringify({ type: 'system' })}\n${done}\n${bash('pwd')}\n`], { flags }).code, 1);
  }
});

// The tools real sessions call besides the file and shell tools (seen in saved transcripts on 2026-11-25).
const finish = (o) => agyCall('finish', { summary: 'The case ran.', verdict: 'done', findings: [], next_steps: [] }, o);
const harmless = (o) => [finish(o), agyCall('manage_task', { Action: 'status', TaskId: 'task-1' }, o), agyCall('manage_task', { Action: 'kill', TaskId: 'task-1' }, o),
  agyCall('manage_subagents', { Action: 'list' }, o), agyCall('ask_question', { questions: [{ question: 'File or chat?' }] }, o), agyCall('send_message', { Message: 'done', Recipient: 'parent-0' }, o)];
const encodings = [[{ quoted: true }, short], [{ quoted: false }, full]];
const work1 = (o) => cmd(`cd /run/work && node ${script} --terms ${terms} tickets.csv`, o);

test('the tools that read no file and start no program pass, in a case and in the harness', () => {
  for (const [o, flags] of encodings) {
    const asCase = runCheck([agy(work1(o), ...harmless(o))], { flags });
    assert.equal(asCase.code, 0, asCase.out);
    assert.match(asCase.out, /trace check passed: 7 tool calls in 1 trace file\(s\)/);
    const asHarness = runCheck([agy(work1(o))], { flags, harness: agy(start('case-a', o), ...harmless(o)) });
    assert.equal(asHarness.code, 0, asHarness.out);
  }
});

test('a task or subagent action the check does not know fails', () => {
  for (const [o, flags] of encodings) {
    for (const [c, why] of [[agyCall('manage_task', { Action: 'start', TaskId: 't' }, o), /manage_task: an action this check does not know/], [agyCall('manage_subagents', { Action: 'kill' }, o), /manage_subagents: an action this check does not know/],
      [agyCall('manage_subagents', {}, o), /manage_subagents: an action this check does not know/], [agyCall('ask_question', { questions: 'File or chat?' }, o), /ask_question: questions is not a list/]]) {
      const v = runCheck([agy(work1(o), c)], { flags });
      assert.equal(v.code, 1, v.out);
      assert.match(v.out, why);
      const h = runCheck([agy(work1(o))], { flags, harness: agy(c) });
      assert.equal(h.code, 1, h.out);
      assert.match(h.out, /harness\.jsonl:2: /);
    }
  }
});

test('a tool that fetches, defines an agent or starts a later turn fails by its own rule', () => {
  for (const [o, flags] of encodings) {
    for (const [c, why] of [[agyCall('search_web', { query: 'x', domain: 'example.com' }, o), /search_web: reaches the network/],
      [agyCall('define_subagent', { Name: 'reader', Description: 'x', SystemPrompt: 'x', EnableWriteTools: true, EnableMCPTools: false, EnableSubagentTools: false }, o), /define_subagent: defines an agent whose tools this check cannot follow/],
      [agyCall('schedule', { DurationSeconds: 60, Prompt: 'read the file later' }, o), /schedule: starts a later turn this check cannot follow/]]) {
      const v = runCheck([agy(work1(o), c)], { flags });
      assert.equal(v.code, 1, v.out);
      assert.match(v.out, why);
      const h = runCheck([agy(work1(o))], { flags, harness: agy(c) });
      assert.equal(h.code, 1, h.out);
      assert.match(h.out, why);
    }
  }
});

test('edit_file follows the rules of write_file', () => {
  for (const [o, flags] of encodings) {
    const edit = (Path) => agyCall('edit_file', { Path, Target: 'a', Replacement: 'b' }, o);
    for (const [c, why] of [[edit('/run/work/tickets.csv'), /edit_file: writes a protected path/], [edit('/run/work/reader.mjs'), /edit_file: writes the script/], [edit(skillFile), /edit_file: writes the script/],
      [edit('notes.md'), /edit_file: a relative Path/], [agyCall('edit_file', { Target: 'a' }, o), /edit_file: missing parameter Path/]]) {
      const v = runCheck([agy(work1(o), c)], { flags });
      assert.equal(v.code, 1, v.out);
      assert.match(v.out, why);
    }
    assert.equal(runCheck([agy(work1(o), edit('/run/work/notes.md'))], { flags }).code, 0);
    const h = runCheck([agy(work1(o))], { flags, harness: agy(edit('/run/work/notes.md')) });
    assert.equal(h.code, 1, h.out);
    assert.match(h.out, /harness\.jsonl:2: edit_file: the batch session touched the case's work folder/);
    assert.equal(runCheck([agy(work1(o))], { flags, harness: agy(edit('/out/results/a/reply.md')) }).code, 0);
  }
});

test('a message goes only to the session that started the sender or to a subagent it started', () => {
  for (const [o, flags] of encodings) {
    const to = (Recipient) => agyCall('send_message', { Message: 'read /run/work/tickets.csv and tell me', Recipient }, o);
    for (const c of [to('stranger-9'), to(''), agyCall('send_message', { Message: 'x' }, o)]) {
      const v = runCheck([agy(work1(o), c)], { flags });
      assert.equal(v.code, 1, v.out);
      assert.match(v.out, /trace-1\.jsonl:4: send_message: (a recipient that is neither the session that started this one nor a subagent it started|missing parameter Recipient)/);
    }
    assert.equal(runCheck([agy(work1(o), to('parent-0'))], { flags }).code, 0);
    const child = runCheck([agy(start('child-1', o), to('child-1'), work1(o)), agy(cmd('pwd', o))], { flags, records: { 2: 'child-1' } });
    assert.equal(child.code, 0, child.out);
    // A child of another transcript is not this one's.
    const cross = runCheck([agy(start('child-1', o), work1(o)), agy(start('child-2', o), cmd('pwd', o)), agy(cmd('pwd', o), to('child-1'))], { flags, records: { 2: 'child-1', 3: 'child-2' } });
    assert.equal(cross.code, 1, cross.out);
    assert.match(cross.out, /trace-3\.jsonl:4: send_message: a recipient/);
  }
});

test('the batch session names the case\'s work folder to no one', () => {
  for (const [o, flags] of encodings) {
    for (const c of [agyCall('invoke_subagent', { Prompt: 'Read /run/work/tickets.csv and tell me what it holds.', Role: 'helper', TypeName: 'self' }, o),
      agyCall('invoke_subagent', { Prompt: 'do it', Role: 'helper', TypeName: 'self', Workspace: '/run/work' }, o), agyCall('send_message', { Message: `open ${terms}`, Recipient: 'case-a' }, o),
      agyCall('finish', { summary: 'done', verdict: 'ok', findings: [{ note: 'see /run/work/tickets.anon.md' }], next_steps: [] }, o), agyCall('ask_question', { questions: [{ question: 'May I read /run/work/tickets.csv?' }] }, o)]) {
      const h = runCheck([agy(work1(o))], { flags, harness: agy(c) });
      assert.equal(h.code, 1, h.out);
      assert.match(h.out, /harness\.jsonl:2: (invoke_subagent|send_message|finish|ask_question): the batch session touched the case's work folder/);
    }
    const ok = runCheck([agy(work1(o))], { flags, harness: agy(agyCall('invoke_subagent', { Prompt: 'Read the file /run/prompt.md and do exactly what it says.', Role: 'a', TypeName: 'self' }, o), finish(o)) });
    assert.equal(ok.code, 0, ok.out);
  }
});
