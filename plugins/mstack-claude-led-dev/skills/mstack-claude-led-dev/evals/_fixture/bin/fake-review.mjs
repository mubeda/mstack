#!/usr/bin/env node
// Stand-in reviewer for the dev workflows' eval cases.
// Logs start/end to stand-in/calls.log beside bin/, sleeps 3 seconds, and prints the vendor's review output or failure mode.
import { appendFileSync, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const USAGE = 'usage: fake-review.mjs --vendor <claude|codex> --model <m> --effort <e> --prompt-file <file>';
let opts;
try {
  opts = parseArgs({
    args: process.argv.slice(2),
    options: {
      vendor: { type: 'string' },
      model: { type: 'string' },
      effort: { type: 'string' },
      'prompt-file': { type: 'string' },
    },
    strict: true,
    allowPositionals: false,
  }).values;
} catch (e) {
  console.error(`fake-review: ${e.message}\n${USAGE}`);
  process.exit(2);
}

if (!['claude', 'codex'].includes(opts.vendor ?? '') || !opts.model || !opts.effort || !opts['prompt-file']) {
  console.error(`fake-review: missing or invalid option\n${USAGE}`);
  process.exit(2);
}

try {
  const st = statSync(opts['prompt-file']);
  if (!st.isFile()) throw new Error('not a regular file');
  readFileSync(opts['prompt-file'], 'utf8');
} catch (e) {
  console.error(`fake-review: unreadable --prompt-file ${opts['prompt-file']}: ${e.message}`);
  process.exit(2);
}

const standIn = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'stand-in');
const logFile = join(standIn, 'calls.log');
mkdirSync(standIn, { recursive: true });
appendFileSync(logFile, `start ${opts.vendor} ${opts.model} ${opts.effort} ${Date.now()}\n`);
await new Promise((r) => setTimeout(r, 3000));
appendFileSync(logFile, `end ${opts.vendor} ${Date.now()}\n`);

if (existsSync(join(standIn, `fail-${opts.vendor}`))) {
  process.exit(1);
}
if (existsSync(join(standIn, `empty-${opts.vendor}`))) {
  process.stderr.write(`stand-in ${opts.vendor}: diagnostic only\n`);
  process.exit(0);
}

if (opts.vendor === 'claude') {
  const text = readFileSync(join(standIn, 'review-claude.md'), 'utf8');
  const wrongFile = join(standIn, 'wrong-model-claude');
  const usageKey = existsSync(wrongFile) ? readFileSync(wrongFile, 'utf8').trim() : opts.model;
  process.stdout.write(
    `${JSON.stringify({
      result: text,
      session_id: 'standin-rev-1',
      is_error: false,
      permission_denials: [],
      modelUsage: { [usageKey]: { inputTokens: 100, outputTokens: 50 } },
    })}\n`,
  );
} else {
  process.stdout.write(readFileSync(join(standIn, 'review-codex.md'), 'utf8'));
}
