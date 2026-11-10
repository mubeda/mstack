// Smoke test for the tools copied unchanged from Anthropic's skill-creator into
// scripts/vendor/anthropic-skill-creator/. It builds the workspace layout those tools read:
//   iteration-1/eval-<case>/eval_metadata.json
//   iteration-1/eval-<case>/<configuration>/eval_metadata.json   (the review page looks here)
//   iteration-1/eval-<case>/<configuration>/run-1/{grading.json,timing.json,outputs/}
// Set KEEP=1 to keep the temporary folder and print its path.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const vendor = resolve(dirname(fileURLToPath(import.meta.url)), '../skills/mstack-skill-creator/scripts/vendor/anthropic-skill-creator');
const python = spawnSync('python3', ['--version']).status === 0;
const skip = python ? false : 'python3 not found';

function workspace() {
  const root = mkdtempSync(join(tmpdir(), 'vendor-smoke-'));
  const it = join(root, 'iteration-1');
  const meta = { eval_id: 0, eval_name: 'sample', prompt: 'Write a sample changelog entry.', assertions: ['The entry has a date'] };
  mkdirSync(join(it, 'eval-sample'), { recursive: true });
  writeFileSync(join(it, 'eval-sample', 'eval_metadata.json'), JSON.stringify(meta));
  for (const [config, passed] of [['with_skill', true], ['without_skill', false]]) {
    const run = join(it, 'eval-sample', config, 'run-1');
    mkdirSync(join(run, 'outputs'), { recursive: true });
    writeFileSync(join(it, 'eval-sample', config, 'eval_metadata.json'), JSON.stringify(meta));
    writeFileSync(join(run, 'outputs', 'result.md'), `# Entry from ${config}\n`);
    writeFileSync(join(run, 'grading.json'), JSON.stringify({
      expectations: [{ text: 'The entry has a date', passed, evidence: passed ? 'line 1 has a date' : 'no date' }],
      summary: { passed: passed ? 1 : 0, failed: passed ? 0 : 1, total: 1, pass_rate: passed ? 1 : 0 },
    }));
    writeFileSync(join(run, 'timing.json'), JSON.stringify({ total_tokens: 1000, duration_ms: 2000, total_duration_seconds: 2 }));
  }
  if (process.env.KEEP) console.log(`workspace kept at ${root}`);
  return it;
}

test('the benchmark has a summary for both configurations', { skip }, () => {
  const it = workspace();
  const r = spawnSync('python3', [join(vendor, 'aggregate_benchmark.py'), it, '--skill-name', 'sample-skill'], { encoding: 'utf8' });
  assert.equal(r.status, 0, `${r.stdout}${r.stderr}`);
  const bench = JSON.parse(readFileSync(join(it, 'benchmark.json'), 'utf8'));
  assert.ok(bench.run_summary.with_skill, 'run_summary.with_skill is missing');
  assert.ok(bench.run_summary.without_skill, 'run_summary.without_skill is missing');
  assert.ok(existsSync(join(it, 'benchmark.md')));
});

test('the static review page is written and shows the case', { skip }, () => {
  const it = workspace();
  const out = join(it, 'review.html');
  const r = spawnSync('python3', [join(vendor, 'generate_review.py'), it, '--skill-name', 'sample-skill', '--static', out], { encoding: 'utf8' });
  assert.equal(r.status, 0, `${r.stdout}${r.stderr}`);
  assert.ok(existsSync(out));
  assert.match(readFileSync(out, 'utf8'), /Write a sample changelog entry/);
});
