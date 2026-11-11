#!/usr/bin/env node
// Test stub of the OpenAI Codex plugin's scripts/codex-companion.mjs. It answers only the three calls codex-dev.mjs
// makes, in the real script's JSON shape, from <CLAUDE_PLUGIN_DATA>/state/jobs.json:
//   status --all --json | status <job> [--wait] [--timeout-ms <n>] --json | result <job> --json
// jobs.json is {"jobs": [job, ...]}. A job may carry "answers" (a list of statuses served one per status call) and
// "blocking": true (sleep for the requested timeout, then answer "running"). A missing jobs.json is an empty list.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const data = process.env.CLAUDE_PLUGIN_DATA;
if (!data) { console.error('CLAUDE_PLUGIN_DATA is not set'); process.exit(1); }
const file = join(data, 'state', 'jobs.json');
const load = () => (existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : { jobs: [] });
const save = (s) => { mkdirSync(join(data, 'state'), { recursive: true }); writeFileSync(file, JSON.stringify(s, null, 2)); };
const bare = ({ answers, blocking, output, touchedFiles, ...job }) => job;

const args = process.argv.slice(2);
const [cmd, ref] = args;
const opt = (name) => { const i = args.indexOf(name); return i < 0 ? undefined : args[i + 1]; };
const state = load();
const active = (j) => j.status === 'queued' || j.status === 'running';

if (cmd === 'status' && ref === '--all') {
  const jobs = [...state.jobs].sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt))).map(bare);
  const finished = jobs.filter((j) => !active(j));
  console.log(JSON.stringify({ workspaceRoot: process.cwd(), running: jobs.filter(active), latestFinished: finished[0] ?? null, recent: finished.slice(1), needsReview: false }));
  process.exit(0);
}

const job = state.jobs.find((j) => j.id === ref);
if (!job) { console.log(`No job found for "${ref}". Run /codex:status to list known jobs.`); process.exit(1); }

if (cmd === 'status') {
  if (job.blocking) {
    await new Promise((r) => setTimeout(r, Number(opt('--timeout-ms') ?? 0)));
    console.log(JSON.stringify({ workspaceRoot: process.cwd(), job: { ...bare(job), status: 'running' }, waitTimedOut: true }));
    process.exit(0);
  }
  if (Array.isArray(job.answers) && job.answers.length) {
    job.status = job.answers.shift();
    save(state);
  }
  console.log(JSON.stringify({ workspaceRoot: process.cwd(), job: bare(job), waitTimedOut: active(job) }));
  process.exit(0);
}

if (cmd === 'result') {
  const result = { status: job.status === 'completed' ? 0 : 1, threadId: job.threadId, rawOutput: job.output ?? '', touchedFiles: job.touchedFiles ?? [] };
  // No process.exit here: exiting right after console.log cuts a large answer on a pipe at 64 KiB.
  console.log(JSON.stringify({ job: bare(job), storedJob: { ...bare(job), result, rendered: result.rawOutput } }));
  process.exitCode = 0;
} else {
  console.error(`unknown command: ${cmd}`);
  process.exitCode = 2;
}
