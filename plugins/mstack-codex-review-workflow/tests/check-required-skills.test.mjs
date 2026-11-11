// Tests for the shared-skill checks of scripts/check-required-skills.sh and for the lane check that section 3
// builds from mstack-best-model-for's answers (scripts/check-lanes.mjs itself does not change).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const skill = resolve(dirname(fileURLToPath(import.meta.url)), '../skills/mstack-codex-review-workflow');
const bash = spawnSync('sh', ['-c', 'command -v bash'], { encoding: 'utf8' }).stdout.trim();

function required(skills) {
  const root = mkdtempSync(join(tmpdir(), 'wf-req-'));
  const home = join(root, 'home'), bin = join(root, 'bin');
  mkdirSync(bin, { recursive: true }); mkdirSync(home, { recursive: true });
  for (const t of ['node', 'git']) { writeFileSync(join(bin, t), '#!/bin/sh\nexit 0\n'); chmodSync(join(bin, t), 0o755); }
  for (const s of skills) { mkdirSync(join(home, '.claude', 'skills', s), { recursive: true }); writeFileSync(join(home, '.claude', 'skills', s, 'SKILL.md'), 'x'); }
  const r = spawnSync(bash, [join(skill, 'scripts/check-required-skills.sh')], { encoding: 'utf8', cwd: root, env: { HOME: home, PATH: `${bin}:/usr/bin:/bin` } });
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
}

test('missing shared skills are reported and fail the check', () => {
  const r = required(['ponytail', 'mstack-diagnose']);
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /MISSING {2}mstack-find-skills/);
  assert.match(r.out, /MISSING {2}mstack-best-model-for/);
});

test('installed shared skills are not reported missing', () => {
  const r = required(['ponytail', 'mstack-diagnose', 'mstack-find-skills', 'mstack-best-model-for']);
  assert.doesNotMatch(r.out, /MISSING {2}mstack-(find-skills|best-model-for)/, r.out);
});

// A synthetic answer of mstack-best-model-for, with model names this workflow never named.
const allow = ['--allow', 'cheap=small-model-x', '--allow', 'standard=mid-model-x', '--allow', 'most capable=big-model-x'];
function lanes(rows) {
  const file = join(mkdtempSync(join(tmpdir(), 'wf-lanes-')), 'lane-table.md');
  writeFileSync(file, ['| Lane | Items | Plan tier | Tier | Model | Effort | Reason |', '|---|---|---|---|---|---|---|', ...rows].join('\n') + '\n');
  const r = spawnSync(process.execPath, [join(skill, 'scripts/check-lanes.mjs'), ...allow, file], { encoding: 'utf8' });
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
}

test('a standard lane on the model the answer gave passes', () => {
  const r = lanes(['| A | 1.1 | standard | standard | mid-model-x | medium | |']);
  assert.equal(r.status, 0, r.out);
});

test('a cheap-tier lane on the most capable model without a reason fails and names the lane', () => {
  const r = lanes(['| B | 1.2 | cheap | cheap | big-model-x | low | |']);
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /\bB\b/);
});

test('a lane at effort high without "escalated" fails', () => {
  const r = lanes(['| C | 2.1 | most capable | most capable | big-model-x | high | hard design |']);
  assert.equal(r.status, 1, r.out);
});

test('a missing mstack-receive-review is reported, because every review is processed with it', () => {
  const r = required(['ponytail', 'mstack-diagnose', 'mstack-find-skills', 'mstack-best-model-for']);
  assert.match(r.out, /MISSING {2}mstack-receive-review/);
  assert.equal(r.status, 1, r.out);
});
