// Fails when a plugin changed on this branch but its version did not move past the base branch.
// Claude Code and Codex only pick up a plugin change when its version changes, so an unbumped
// change never reaches anyone who already has the plugin installed.
//
//   node scripts/check-version-bumps.mjs [base-ref]
//
// base-ref defaults to origin/$CI_DEFAULT_BRANCH, or origin/main outside CI. Changes are taken
// from where the branch left the base (committed, staged, unstaged and untracked files); the
// version must be higher than the base's *current* version, so two branches that both picked
// the same new number are caught.
//
// In CI (CI is set) the script fetches the default branch itself, every run: runners differ in
// shell (PowerShell, sh) and may reuse a checkout whose origin/<default> is stale, so the CI file
// only calls node. Outside CI, fetch the base yourself first (git fetch origin main).
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const gitQuiet = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
const defaultBranch = process.env.CI_DEFAULT_BRANCH ?? 'main';
const base = process.argv[2] ?? `origin/${defaultBranch}`;

if (process.env.CI && !process.argv[2]) {
  try {
    if (git('rev-parse', '--is-shallow-repository') === 'true') git('fetch', '--no-tags', '--unshallow', 'origin');
    git('fetch', '--no-tags', 'origin', `+refs/heads/${defaultBranch}:refs/remotes/origin/${defaultBranch}`);
  } catch {
    // git's own error is already on stderr; replace the Node stack trace with what to check.
    console.error(`Version bump check: could not prepare ${base}; check git availability, checkout ownership, `
      + 'origin credentials and network access.');
    process.exit(1);
  }
}

try {
  gitQuiet('rev-parse', '--verify', '--quiet', `${base}^{commit}`);
} catch {
  console.error(`Version bump check: base ref ${base} not found. Fetch it first, e.g. git fetch origin main`);
  process.exit(1);
}

const forkPoint = git('merge-base', 'HEAD', base);
const changed = [
  ...git('diff', '--name-only', forkPoint).split('\n'),
  ...git('ls-files', '--others', '--exclude-standard').split('\n'),
].filter(Boolean);
const plugins = [...new Set(changed.map((path) => path.match(/^plugins\/([^/]+)\//)?.[1]).filter(Boolean))].sort();

// Claude-only and Codex-only plugins carry one manifest; plugins on both hosts keep both versions equal.
const manifest = (plugin) => [`plugins/${plugin}/.claude-plugin/plugin.json`, `plugins/${plugin}/.codex-plugin/plugin.json`]
  .find((path) => existsSync(resolve(root, path))) ?? `plugins/${plugin}/.claude-plugin/plugin.json`;
const parse = (version) => {
  const parts = /^(\d+)\.(\d+)\.(\d+)$/.exec(version ?? '');
  return parts ? parts.slice(1).map(Number) : null;
};
const isHigher = (a, b) => {
  for (let i = 0; i < 3; i += 1) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return false;
};

const problems = [];
let checked = 0;
for (const plugin of plugins) {
  if (!existsSync(resolve(root, manifest(plugin)))) continue; // plugin removed on this branch
  let baseText;
  try {
    baseText = gitQuiet('show', `${base}:${manifest(plugin)}`);
  } catch {
    continue; // plugin is new on this branch: nothing to bump past
  }
  const current = JSON.parse(readFileSync(resolve(root, manifest(plugin)), 'utf8')).version;
  const previous = JSON.parse(baseText).version;
  const [now, before] = [parse(current), parse(previous)];
  checked += 1;
  if (!now || !before) {
    problems.push(`${plugin}: cannot compare versions ${current} and ${previous} (expected x.y.z)`);
  } else if (!isHigher(now, before)) {
    problems.push(`${plugin}: files changed but version ${current} is not higher than ${base}'s ${previous}`);
  }
}

if (problems.length) {
  console.error('Version bump check failed — bump each plugin everywhere its version appears '
    + '(see AGENTS.md › Before every commit):');
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log(`Version bump checks passed: ${checked} changed plugin(s) bumped past ${base}`);
