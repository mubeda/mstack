#!/usr/bin/env bash
set -eu
mkdir -p work
cat > work/package.json <<'EOF'
{
  "name": "example-worker",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "test": "node --test"
  }
}
EOF
cat > work/worker.js <<'EOF'
import { readFileSync, writeFileSync } from 'node:fs';

const QUEUE_FILE = './queue.json';

export async function runOnce(handler) {
  const jobs = JSON.parse(readFileSync(QUEUE_FILE, 'utf8'));
  if (!jobs.length) return;
  const job = jobs.shift();
  // Removed from queue before execution; a crash here loses the job.
  writeFileSync(QUEUE_FILE, JSON.stringify(jobs));
  try {
    await handler(job);
  } catch {
    // Swallowed failure; no retry or dead-letter queue.
  }
}

export function startLoop(handler) {
  return setInterval(() => {
    runOnce(handler);
  }, 100);
}
EOF
# Synthetic credential assembled from parts so no literal token stands in the fixture script.
TOK_A="ex_synth"
TOK_B="tok_424299"
cat > work/worker.log <<EOF
2026-11-27T10:01:02Z POST /webhooks/dispatch Authorization: Bearer ${TOK_A}_${TOK_B} -> 401 Unauthorized
2026-11-27T10:01:02Z WARN job_id=job-104 failed after dequeue; queue.json already overwritten
EOF
