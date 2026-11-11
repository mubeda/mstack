// Tests for scripts/check-required-skills.sh: the two shared skills are hard requirements on both hosts.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const script = resolve(dirname(fileURLToPath(import.meta.url)), '../skills/mstack-plan/scripts/check-required-skills.sh');
const bash = spawnSync('sh', ['-c', 'command -v bash'], { encoding: 'utf8' }).stdout.trim();

function run(host, skills) {
  const root = mkdtempSync(join(tmpdir(), 'plan-req-'));
  const home = join(root, 'home'), bin = join(root, 'bin');
  mkdirSync(bin, { recursive: true });
  for (const t of ['node', 'git']) { writeFileSync(join(bin, t), '#!/bin/sh\nexit 0\n'); chmodSync(join(bin, t), 0o755); }
  const dir = host === 'claude' ? '.claude' : '.codex';
  for (const s of skills) { mkdirSync(join(home, dir, 'skills', s), { recursive: true }); writeFileSync(join(home, dir, 'skills', s, 'SKILL.md'), 'x'); }
  mkdirSync(home, { recursive: true });
  // A bin folder of its own plus the system folders for the shell's own tools (find, grep, dirname).
  const r = spawnSync(bash, [script, '--host', host], { encoding: 'utf8', cwd: root, env: { HOME: home, PATH: `${bin}:/usr/bin:/bin` } });
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
}

for (const host of ['claude', 'codex']) {
  test(`${host}: missing shared skills are reported and fail the check`, () => {
    const r = run(host, []);
    assert.equal(r.status, 1, r.out);
    assert.match(r.out, /MISSING {2}mstack-find-skills/);
    assert.match(r.out, /MISSING {2}mstack-best-model-for/);
  });
  test(`${host}: installed shared skills are not reported missing`, () => {
    const r = run(host, ['mstack-find-skills', 'mstack-best-model-for']);
    assert.doesNotMatch(r.out, /MISSING {2}mstack-(find-skills|best-model-for)/, r.out);
  });
}

for (const host of ['claude', 'codex']) {
  test(`${host}: a missing mstack-receive-review is reported and fails the check`, () => {
    const r = run(host, ['mstack-find-skills', 'mstack-best-model-for']);
    assert.equal(r.status, 1, r.out);
    assert.match(r.out, /MISSING {2}mstack-receive-review/);
  });
}
