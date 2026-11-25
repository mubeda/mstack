// Tests for scripts/check-required-skills.sh (three hosts, mstack-vendors, ponytail note in Antigravity,
// ui-ux-pro-max WARN in Antigravity, no reviewer row) and scripts/check-lanes.mjs (including --subagent-tier).
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const pluginDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const skill = resolve(pluginDir, 'skills', basename(pluginDir));
const bash = spawnSync('sh', ['-c', 'command -v bash'], { encoding: 'utf8' }).stdout.trim();
const temps = [];
const temp = (prefix) => { const dir = mkdtempSync(join(tmpdir(), prefix)); temps.push(dir); return dir; };
after(() => { for (const dir of temps) rmSync(dir, { recursive: true, force: true }); });

const skillDir = { claude: '.claude/skills', codex: '.codex/skills', antigravity: '.gemini/config/skills' };
const coreSkills = [
  'ponytail',
  'mstack-diagnose',
  'mstack-find-skills',
  'mstack-best-model-for',
  'mstack-receive-review',
  'mstack-research',
  'mstack-vendors',
];
const hostInstallSnippets = {
  claude: {
    plugin: 'claude plugin install mstack-vendors@mstack',
    cli: '-g -a claude-code -y',
    other: ['codex plugin add', 'agy plugin install', '-a codex', '-a antigravity'],
  },
  codex: {
    plugin: 'codex plugin add mstack-vendors@mstack',
    cli: '-g -a codex -y',
    other: ['claude plugin install', 'agy plugin install', '-a claude-code', '-a antigravity'],
  },
  antigravity: {
    plugin: 'agy plugin install https://github.com/mubeda/mstack/tree/main/plugins/mstack-vendors',
    cli: '-g -a antigravity -y',
    other: ['claude plugin install', 'codex plugin add', '-a claude-code', '-a codex'],
  },
};

function required(host, skills, flags = [], { stubs = {} } = {}) {
  const root = temp('wf-req-');
  const home = join(root, 'home'), bin = join(root, 'bin');
  mkdirSync(bin, { recursive: true });
  mkdirSync(home, { recursive: true });
  const tools = { node: 'exit 0', git: 'exit 0', ...stubs };
  if (flags.includes('--web-ui') && !Object.hasOwn(tools, 'python3')) tools.python3 = 'exit 0';
  for (const [t, body] of Object.entries(tools)) {
    writeFileSync(join(bin, t), `#!/bin/sh\n${body}\n`);
    chmodSync(join(bin, t), 0o755);
  }
  for (const s of skills) {
    mkdirSync(join(home, skillDir[host], s), { recursive: true });
    writeFileSync(join(home, skillDir[host], s, 'SKILL.md'), 'x');
  }
  const args = [join(skill, 'scripts/check-required-skills.sh'), ...(host ? ['--host', host] : []), ...flags];
  const r = spawnSync(bash, args, { encoding: 'utf8', cwd: root, env: { HOME: home, PATH: `${bin}:/usr/bin:/bin` } });
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
}

function requiredAt(host, baseFn, skills = coreSkills, flags = []) {
  const root = temp('wf-req-');
  const home = join(root, 'home'), bin = join(root, 'bin');
  mkdirSync(bin, { recursive: true });
  mkdirSync(home, { recursive: true });
  for (const t of ['node', 'git']) {
    writeFileSync(join(bin, t), '#!/bin/sh\nexit 0\n');
    chmodSync(join(bin, t), 0o755);
  }
  for (const s of skills) {
    const d = join(baseFn(root, home), 'mstack-x', 'skills', s);
    mkdirSync(d, { recursive: true });
    writeFileSync(join(d, 'SKILL.md'), 'x');
  }
  const r = spawnSync(bash, [join(skill, 'scripts/check-required-skills.sh'), '--host', host, ...flags], {
    encoding: 'utf8',
    cwd: root,
    env: { HOME: home, PATH: `${bin}:/usr/bin:/bin` },
  });
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
}

// Original seven tests (the four preflight ones now pass --host claude).
test('missing shared skills are reported and fail the check', () => {
  const r = required('claude', ['ponytail', 'mstack-diagnose']);
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /MISSING {2}mstack-find-skills/);
  assert.match(r.out, /MISSING {2}mstack-best-model-for/);
});

test('installed shared skills are not reported missing', () => {
  const r = required('claude', ['ponytail', 'mstack-diagnose', 'mstack-find-skills', 'mstack-best-model-for']);
  assert.match(r.out, /ok {7}mstack-find-skills/, r.out);
  assert.doesNotMatch(r.out, /MISSING {2}mstack-(find-skills|best-model-for)/, r.out);
});

// A synthetic answer of mstack-best-model-for, with model names this workflow never named.
const allow = ['--allow', 'cheap=small-model-x', '--allow', 'standard=mid-model-x', '--allow', 'most capable=big-model-x'];
function lanes(rows, extraArgs = allow) {
  const file = join(temp('wf-lanes-'), 'lane-table.md');
  writeFileSync(file, ['| Lane | Items | Plan tier | Tier | Model | Effort | Reason |', '|---|---|---|---|---|---|---|', ...rows].join('\n') + '\n');
  const r = spawnSync(process.execPath, [join(skill, 'scripts/check-lanes.mjs'), ...extraArgs, file], { encoding: 'utf8' });
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
  const r = required('claude', ['ponytail', 'mstack-diagnose', 'mstack-find-skills', 'mstack-best-model-for']);
  assert.match(r.out, /MISSING {2}mstack-receive-review/);
  assert.equal(r.status, 1, r.out);
});

test('a missing mstack-research is reported, because broad research goes through it', () => {
  const r = required('claude', ['ponytail', 'mstack-diagnose', 'mstack-find-skills', 'mstack-best-model-for', 'mstack-receive-review']);
  assert.match(r.out, /MISSING {2}mstack-research/);
  assert.equal(r.status, 1, r.out);
});

// New multi-host preflight tests.
for (const host of ['claude', 'codex', 'antigravity']) {
  test(`${host}: mstack-vendors missing names this host's install line and mstack-setup`, () => {
    const r = required(host, coreSkills.filter((s) => s !== 'mstack-vendors'));
    assert.equal(r.status, 1, r.out);
    assert.match(r.out, /MISSING {2}mstack-vendors/, r.out);
    assert.ok(r.out.includes(hostInstallSnippets[host].plugin), r.out);
    assert.ok(r.out.includes(hostInstallSnippets[host].cli), r.out);
    assert.match(r.out, /mstack-setup/, r.out);
    for (const forbidden of hostInstallSnippets[host].other) {
      assert.ok(!r.out.includes(forbidden), `unexpected other-host text "${forbidden}" in:\n${r.out}`);
    }
  });

  test(`${host}: mstack-receive-review missing fails`, () => {
    const r = required(host, coreSkills.filter((s) => s !== 'mstack-receive-review'));
    assert.equal(r.status, 1, r.out);
    assert.match(r.out, /MISSING {2}mstack-receive-review/, r.out);
  });
}

test('antigravity: ponytail skills without hooks pass and say so once', () => {
  const r = required('antigravity', coreSkills);
  assert.equal(r.status, 0, r.out);
  const hits = r.out.match(/hooks do not run in Antigravity/g) ?? [];
  assert.equal(hits.length, 1, r.out);
});

test('antigravity: a skill in an installed plugin folder counts', () => {
  const r = requiredAt('antigravity', (_root, home) => join(home, '.gemini', 'config', 'plugins'));
  assert.equal(r.status, 0, r.out);
  for (const s of coreSkills) assert.match(r.out, new RegExp(`ok {7}${s}`), r.out);
});

test('antigravity: a skill in the workspace plugin folder counts', () => {
  const r = requiredAt('antigravity', (root) => join(root, '.agents', 'plugins'));
  assert.equal(r.status, 0, r.out);
  for (const s of coreSkills) assert.match(r.out, new RegExp(`ok {7}${s}`), r.out);
});

test('antigravity: a missing ui-ux-pro-max is one warning line', () => {
  const r = required('antigravity', coreSkills, ['--web-ui']);
  assert.equal(r.status, 0, r.out);
  const warnLines = r.out.split(/\r?\n/).filter((l) => /^WARN\s+/.test(l));
  assert.equal(warnLines.length, 1, r.out);
  assert.match(warnLines[0], /ui-ux-pro-max/, r.out);
});

test('claude: a missing ui-ux-pro-max still fails', () => {
  const r = required('claude', coreSkills, ['--web-ui']);
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /MISSING {2}ui-ux-pro-max/, r.out);
});

test('codex: a missing ui-ux-pro-max still fails', () => {
  const r = required('codex', coreSkills, ['--web-ui']);
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /MISSING {2}ui-ux-pro-max/, r.out);
});

test('no reviewer row on any host', () => {
  for (const host of ['claude', 'codex', 'antigravity']) {
    const r = required(host, coreSkills);
    assert.equal(r.status, 0, `${host}:\n${r.out}`);
    assert.doesNotMatch(r.out, /codex skill|claude-review|logged in/i, `${host}:\n${r.out}`);
  }
});

test('usage names three hosts', () => {
  const r = required(null, []);
  assert.equal(r.status, 2, r.out);
  assert.match(r.out, /claude\|codex\|antigravity/, r.out);
});

// New check-lanes.mjs --subagent-tier tests.
test('an Antigravity lane with a subagent tier and no effort passes', () => {
  const r = lanes(
    ['| A | 1.1 | standard | standard | flash | - | |'],
    ['--subagent-tier', 'flash', '--subagent-tier', 'pro', '--allow', 'standard=flash'],
  );
  assert.equal(r.status, 0, r.out);
});

test('a subagent tier with an effort fails and names the lane', () => {
  const r = lanes(
    ['| A | 1.1 | standard | standard | flash | medium | |'],
    ['--subagent-tier', 'flash', '--subagent-tier', 'pro', '--allow', 'standard=flash'],
  );
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /lane A: a subagent tier takes no effort; write -/, r.out);
});

test('a most capable Antigravity lane on flash without a reason fails', () => {
  const r = lanes(
    ['| A | 1.1 | most capable | most capable | flash | - | |'],
    ['--subagent-tier', 'flash', '--subagent-tier', 'pro', '--allow', 'most capable=pro'],
  );
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /\bA\b/, r.out);
});

test('without --subagent-tier an effort of - still fails', () => {
  const r = lanes(['| A | 1.1 | standard | standard | mid-model-x | - | |']);
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /lane A: Effort "-"/, r.out);
});

test('with --subagent-tier a full model id with effort and reason fails', () => {
  const r = lanes(
    ['| A | 1.1 | most capable | most capable | gemini-4-neon-high | medium | complex concurrency |'],
    ['--subagent-tier', 'flash', '--subagent-tier', 'pro', '--allow', 'most capable=pro'],
  );
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /lane A:.*gemini-4-neon-high.*subagent tier/, r.out);
});

test('antigravity: missing ponytail does not print the hooks-do-not-run note', () => {
  const r = required('antigravity', coreSkills.filter((s) => s !== 'ponytail'));
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /MISSING {2}ponytail/, r.out);
  assert.doesNotMatch(r.out, /hooks do not run in Antigravity/, r.out);
});
