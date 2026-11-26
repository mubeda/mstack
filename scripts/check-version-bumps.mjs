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

const root = process.env.MSTACK_CHECK_ROOT ?? fileURLToPath(new URL('../', import.meta.url));
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

// Plugins for one host carry one manifest (Claude Code, Codex or Antigravity-only); plugins on several hosts keep their versions equal.
// The working tree and the base are looked up independently, because a plugin's manifest set can change on a branch.
const paths = (plugin) => ['.claude-plugin', '.codex-plugin', '.antigravity-plugin'].map((dir) => `plugins/${plugin}/${dir}/plugin.json`);
const manifest = (plugin) => paths(plugin).find((path) => existsSync(resolve(root, path)));
// Absence is decided by listing the base tree; any other Git failure stops the check instead of waiving the bump.
const baseManifest = (plugin) => {
  const found = paths(plugin).find((path) => git('ls-tree', '--name-only', base, '--', path));
  return found ? gitQuiet('show', `${base}:${found}`) : null;
};
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
  const path = manifest(plugin);
  if (!path) continue; // plugin removed on this branch
  let baseText;
  try {
    baseText = baseManifest(plugin);
  } catch {
    console.error(`Version bump check: could not read ${plugin}'s manifest on ${base}; Git failed, so its bump cannot be checked.`);
    process.exit(1);
  }
  if (!baseText) continue; // plugin is new on this branch: nothing to bump past
  const current = JSON.parse(readFileSync(resolve(root, path), 'utf8')).version;
  const previous = JSON.parse(baseText).version;
  const [now, before] = [parse(current), parse(previous)];
  checked += 1;
  if (!now || !before) {
    problems.push(`${plugin}: cannot compare versions ${current} and ${previous} (expected x.y.z)`);
  } else if (!isHigher(now, before)) {
    problems.push(`${plugin}: files changed but version ${current} is not higher than ${base}'s ${previous}`);
  }
}

// The marketplace's own version moves with any plugin change, so a catalog refresh is visible too.
if (plugins.length) {
  const catalog = '.claude-plugin/marketplace.json';
  let baseCatalog = null;
  try { baseCatalog = JSON.parse(gitQuiet('show', `${base}:${catalog}`)).metadata?.version; } catch { /* new catalog */ }
  const currentCatalog = JSON.parse(readFileSync(resolve(root, catalog), 'utf8')).metadata?.version;
  if (baseCatalog) {
    const [now, before] = [parse(currentCatalog), parse(baseCatalog)];
    if (!now || !before) problems.push(`marketplace: cannot compare versions ${currentCatalog} and ${baseCatalog} (expected x.y.z)`);
    else if (!isHigher(now, before)) problems.push(`marketplace: plugins changed but ${catalog} metadata.version ${currentCatalog} is not higher than ${base}'s ${baseCatalog}`);
  }
}

if (problems.length) {
  console.error('Version bump check failed — bump each plugin everywhere its version appears '
    + '(see AGENTS.md › Before every commit):');
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log(`Version bump checks passed: ${checked} changed plugin(s) and the marketplace version bumped past ${base}`);
