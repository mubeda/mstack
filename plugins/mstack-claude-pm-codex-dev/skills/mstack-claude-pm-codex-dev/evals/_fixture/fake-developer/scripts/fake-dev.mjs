#!/usr/bin/env node
// Stand-in developer for mstack-claude-pm-codex-dev's test cases. Called once per rescue request with the whole
// prompt as one argument. It plays the next round of the file named by FAKE_DEV_SCRIPT (a JSON list of rounds:
// files [{path, content}], report, status, optional launchReply and threadId), writes that round's files into the
// current folder, appends {"request", "cwd"} to <CLAUDE_PLUGIN_DATA>/requests.jsonl, and records the job in
// <CLAUDE_PLUGIN_DATA>/state/jobs.json for the stub codex-companion.mjs. Exits 1, recording nothing, after the last round.
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const data = process.env.CLAUDE_PLUGIN_DATA, roundsFile = process.env.FAKE_DEV_SCRIPT;
if (!data || !roundsFile) { console.error('fake-dev needs CLAUDE_PLUGIN_DATA and FAKE_DEV_SCRIPT'); process.exit(1); }
const prompt = process.argv[2] ?? '';

// Routing flags lead the prompt, as the Codex plugin's rescue command expects.
const words = prompt.split(/\s+/).filter(Boolean);
const flags = {};
while (words.length && words[0].startsWith('--')) {
  const f = words.shift().slice(2);
  flags[f] = f === 'model' || f === 'effort' ? words.shift() : true;
}

const rounds = JSON.parse(readFileSync(roundsFile, 'utf8'));
const jobsFile = join(data, 'state', 'jobs.json');
const state = existsSync(jobsFile) ? JSON.parse(readFileSync(jobsFile, 'utf8')) : { jobs: [] };
const n = state.jobs.length;
const round = rounds[n];
if (!round) { console.error(`fake-dev: no round ${n + 1} in ${roundsFile}`); process.exit(1); }

appendFileSync(join(data, 'requests.jsonl'), `${JSON.stringify({ request: prompt, cwd: process.cwd() })}\n`);
for (const f of round.files ?? []) {
  const p = resolve(process.cwd(), f.path);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, f.content);
}
const last = state.jobs[n - 1];
const threadId = round.threadId ?? (flags.resume && last ? last.threadId : `thread-${n + 1}`);
const id = `task-fake-${n + 1}`;
state.jobs.push({
  id, kind: 'task', jobClass: 'task', title: 'Codex Task', summary: words.join(' ').slice(0, 80),
  status: round.status ?? 'completed', pid: null, startedAt: new Date(Date.UTC(2026, 10, 10, 12, 0, n)).toISOString(),
  threadId, request: { model: flags.model ?? null, effort: flags.effort ?? null, resumeLast: Boolean(flags.resume) },
  output: round.report ?? '', touchedFiles: (round.files ?? []).map((f) => f.path),
});
mkdirSync(dirname(jobsFile), { recursive: true });
writeFileSync(jobsFile, JSON.stringify(state, null, 2));
process.stdout.write(round.launchReply ?? `Codex Task started in the background as ${id}. Check /codex:status ${id} for progress.\n`);
