// Tests for scripts/dev-copy.mjs. Each test builds a made-up repository with its own origin, home and temporary
// folder under the system's temporary folder and removes it afterwards. No test starts a client, and Git reads
// neither the machine's nor the user's configuration.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chmodSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, readlinkSync, realpathSync, renameSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const script = resolve(dirname(fileURLToPath(import.meta.url)), '../skills/mstack-vendors/scripts/dev-copy.mjs');
const ID = ['-c', 'user.name=t', '-c', 'user.email=t@invalid'];
const ZERO = '0'.repeat(40);

function tryGit(env, cwd, ...args) { return spawnSync('git', args, { cwd, env, encoding: 'utf8' }); }
function git(env, cwd, ...args) {
  const r = tryGit(env, cwd, ...args);
  assert.equal(r.status, 0, `git ${args.join(' ')}: ${r.stderr}`);
  return r.stdout.trim();
}
function put(path, text = 'x\n', mode) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
  if (mode) chmodSync(path, mode);
}

function fixture(t, { committedPlan = false } = {}) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'dev-copy-test-')));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const f = { root, home: join(root, 'home'), tmp: join(root, 'tmp'), work: join(root, 'work'), origin: join(root, 'origin.git') };
  f.env = { PATH: process.env.PATH, HOME: f.home, TMPDIR: f.tmp, GIT_CONFIG_NOSYSTEM: '1' };
  f.plan = join(f.work, 'docs/plans/demo');
  for (const d of [f.home, f.tmp, f.work]) mkdirSync(d);
  git(f.env, root, 'init', '--bare', '--template=', '-q', '-b', 'main', f.origin);
  git(f.env, f.work, 'init', '--template=', '-q', '-b', 'main');
  put(join(f.work, 'a.txt'), 'one\ntwo\nthree\n');
  put(join(f.work, 'run.sh'), '#!/bin/sh\necho hi\n', 0o755);
  symlinkSync('a.txt', join(f.work, 'link-to-a'));
  put(join(f.work, 'kept.txt'), 'kept\n');
  put(join(f.work, '.gitattributes'), 'kept.txt export-ignore\n');
  put(join(f.work, 'build/keep.log'), 'log\n');
  put(join(f.work, '.gitignore'), `*.log\n.env\nnode_modules/\n${committedPlan ? '' : 'docs/plans/\n'}`);
  put(join(f.work, '.env'), 'SECRET=1\n');
  put(join(f.plan, 'plan.md'), '# plan\n');
  put(join(f.plan, 'phases/PHASE-01-x.md'), '# phase\n');
  put(join(f.plan, '.env'), 'PLAN_SECRET=1\n');
  put(join(f.plan, 'notes.txt'), 'not a plan file\n');
  git(f.env, f.work, 'add', '-A');
  git(f.env, f.work, 'add', '-f', 'build/keep.log');
  git(f.env, f.work, ...ID, 'commit', '-q', '-m', 'first');
  git(f.env, f.work, 'remote', 'add', 'origin', f.origin);
  git(f.env, f.work, 'push', '-q', 'origin', 'main');
  f.head = git(f.env, f.work, 'rev-parse', 'HEAD');
  return f;
}

function run(f, args, env = {}, cwd = f.root) {
  const r = spawnSync(process.execPath, [script, ...args], { cwd, encoding: 'utf8', env: { ...f.env, ...env } });
  let json = null;
  try { json = JSON.parse(r.stdout); } catch { /* left null; the test reports the output */ }
  return { status: r.status, stdout: r.stdout, stderr: r.stderr, out: `${r.stdout}${r.stderr}`, json };
}
function make(f, args = ['--plan', f.plan], env = {}) {
  const r = run(f, ['make', '--cwd', f.work, ...args], env);
  assert.equal(r.status, 0, r.out);
  return r.json;
}
// A failed make exits 1, names the cause on stderr and leaves nothing in the temporary folder.
function refused(f, args, pattern, env = {}) {
  const r = run(f, ['make', ...args], env);
  assert.equal(r.status, 1, r.out);
  assert.match(r.stderr, pattern);
  assert.deepEqual(readdirSync(f.tmp), [], 'a failed make leaves no folder');
}
// The environment make prints for the developer: the empty configuration file and no other GIT_ variable.
function devEnv(f, m) { return { PATH: process.env.PATH, HOME: f.home, GIT_CONFIG_GLOBAL: m.gitConfig, GIT_CONFIG_SYSTEM: m.gitConfig }; }
function diff(f, m, name, env = {}) {
  const out = join(f.root, name);
  const r = run(f, ['diff', '--copy', m.copy, '--base', m.base, '--out', out, ...(m.plan ? ['--plan', m.plan] : [])], env);
  return { ...r, file: out };
}
function goodDiff(f, m, name) {
  const d = diff(f, m, name);
  assert.equal(d.status, 0, d.out);
  assert.equal(d.json.ok, true);
  return d;
}
function apply(f, patch, previous) {
  return run(f, ['apply', '--checkout', f.work, '--source', f.head, '--patch', patch, ...(previous ? ['--previous', previous] : [])]);
}
// Every entry below a folder, .git included, with its type, mode and content: two equal lists mean nothing changed.
function snap(dir) {
  const out = [];
  const walk = (d) => {
    for (const n of readdirSync(d).sort()) {
      const p = join(d, n), s = lstatSync(p);
      if (s.isSymbolicLink()) out.push(`${p} link ${readlinkSync(p)}`);
      else if (s.isDirectory()) { out.push(`${p} dir`); walk(p); }
      else out.push(`${p} ${s.mode.toString(8)} ${createHash('sha1').update(readFileSync(p)).digest('hex')}`);
    }
  };
  walk(dir);
  return out;
}
// Round one of a developer: one committed change, one deletion and one new file left uncommitted.
function roundOne(f, m) {
  const env = devEnv(f, m);
  put(join(m.copy, 'a.txt'), 'one\ntwo\nthree\nfour\n');
  git(env, m.copy, 'commit', '-q', '-am', 'developer');
  rmSync(join(m.copy, 'kept.txt'));
  put(join(m.copy, 'new.txt'), 'new\n', 0o755);
  return goodDiff(f, m, 'round1.patch');
}

// ---- Scenarios of R10

test('a plain push fails: no remote, and the origin\'s refs are unchanged', (t) => {
  const f = fixture(t), m = make(f), env = devEnv(f, m);
  const before = git(f.env, f.origin, 'for-each-ref');
  put(join(m.copy, 'a.txt'), 'changed\n');
  git(env, m.copy, 'commit', '-q', '-am', 'developer');
  assert.equal(git(env, m.copy, 'remote'), '');
  assert.notEqual(tryGit(env, m.copy, 'push').status, 0);
  assert.notEqual(tryGit(env, m.copy, 'push', 'origin', 'HEAD').status, 0);
  assert.equal(git(f.env, f.origin, 'for-each-ref'), before);
});

test('nothing ignored is copied: .env stays out', (t) => {
  const f = fixture(t), m = make(f);
  assert.equal(existsSync(join(m.copy, '.env')), false);
  assert.equal(existsSync(join(m.copy, 'a.txt')), true);
  assert.doesNotMatch(git(devEnv(f, m), m.copy, 'ls-tree', '-r', '--name-only', m.base), /\.env/);
});

test('uncommitted changes in the checkout: make stops, says commit or stash, and makes no copy', (t) => {
  const f = fixture(t);
  put(join(f.work, 'a.txt'), 'edited\n');
  refused(f, ['--cwd', f.work, '--plan', f.plan], /commit or stash/);
  git(f.env, f.work, 'add', 'a.txt');
  refused(f, ['--cwd', f.work, '--plan', f.plan], /commit or stash/);
});

test('an uncommitted change inside a tracked plan folder also stops make', (t) => {
  const f = fixture(t, { committedPlan: true });
  put(join(f.plan, 'plan.md'), '# plan, edited\n');
  refused(f, ['--cwd', f.work, '--plan', f.plan], /commit or stash[\s\S]*docs\/plans\/demo\/plan\.md/);
});

test('committed and new files both arrive: the diff holds a committed change and an uncommitted new file', (t) => {
  const f = fixture(t), m = make(f);
  const d = roundOne(f, m);
  assert.deepEqual(d.json.files, ['a.txt', 'kept.txt', 'new.txt']);
  assert.equal(d.json.out, d.file);
  const patch = readFileSync(d.file, 'utf8');
  assert.match(patch, /^\+four$/m);
  assert.match(patch, /^\+new$/m);
});

test('a fix round: a second diff from the same base holds both rounds, and the copy stays until remove', (t) => {
  const f = fixture(t), m = make(f);
  roundOne(f, m);
  put(join(m.copy, 'fix.txt'), 'fix\n');
  const d = goodDiff(f, m, 'round2.patch');
  assert.deepEqual(d.json.files, ['a.txt', 'fix.txt', 'kept.txt', 'new.txt']);
  assert.equal(existsSync(join(m.copy, 'new.txt')), true, 'the copy still holds round one');
  const r = run(f, ['remove', '--copy', m.copy]);
  assert.equal(r.status, 0, r.out);
  assert.deepEqual(r.json, { ok: true });
  assert.equal(existsSync(m.copy), false);
});

test('a remote appears: check and diff stop', async (t) => {
  const f = fixture(t);
  const cases = {
    'git remote add': (m, env) => git(env, m.copy, 'remote', 'add', 'evil', f.origin),
    'a local remote.x.pushurl': (m, env) => git(env, m.copy, 'config', 'remote.x.pushurl', f.origin),
    'a local url.<x>.pushInsteadOf': (m, env) => git(env, m.copy, 'config', `url.${f.origin}.pushInsteadOf`, 'short:'),
    'a local remote.pushDefault': (m, env) => git(env, m.copy, 'config', 'remote.pushDefault', 'evil'),
    'a local core.hooksPath': (m, env) => git(env, m.copy, 'config', 'core.hooksPath', join(f.root, 'hooks')),
    'a file in .git/hooks/': (m) => put(join(m.copy, '.git/hooks/pre-commit'), '#!/bin/sh\n', 0o755),
    'a legacy .git/remotes/x file': (m) => put(join(m.copy, '.git/remotes/x'), `URL: ${f.origin}\nPush: HEAD\n`),
    'a legacy .git/branches/y file': (m) => put(join(m.copy, '.git/branches/y'), `${f.origin}\n`),
    'a nested .git folder': (m) => mkdirSync(join(m.copy, 'sub/.git'), { recursive: true }),
    'a gitlink in the copy\'s index': (m, env) => git(env, m.copy, 'update-index', '--add', '--cacheinfo', `160000,${m.base},sub`),
    '<copy>/.git replaced by a gitdir: file': (m) => {
      renameSync(join(m.copy, '.git'), join(f.root, 'moved.git'));
      writeFileSync(join(m.copy, '.git'), `gitdir: ${join(f.root, 'moved.git')}\n`);
    },
    // Not in the plan's list: other ways a later Git call in the copy reads configuration from elsewhere.
    'an include.path in the local configuration': (m, env) => git(env, m.copy, 'config', 'include.path', join(f.root, 'elsewhere')),
    'anything written into the empty configuration file': (m) => writeFileSync(m.gitConfig, '[credential]\n\thelper = store\n'),
    'a core.worktree that points away': (m, env) => git(env, m.copy, 'config', 'core.worktree', f.work),
    'a local credential.helper': (m, env) => git(env, m.copy, 'config', 'credential.helper', 'store'),
    'a local filter command': (m, env) => git(env, m.copy, 'config', 'filter.x.clean', 'cat'),
    'a local core.fsmonitor': (m, env) => git(env, m.copy, 'config', 'core.fsmonitor', join(f.root, 'monitor.sh')),
    'another value for a key make wrote': (m, env) => git(env, m.copy, 'config', 'core.bare', 'true'),
    'a comment line in the configuration': (m) => writeFileSync(join(m.copy, '.git/config'), `${readFileSync(join(m.copy, '.git/config'), 'utf8')}# [remote "x"]\n`),
    'a .git/config.worktree file': (m) => put(join(m.copy, '.git/config.worktree'), '[core]\n\tbare = false\n'),
    'an alternates file': (m) => put(join(m.copy, '.git/objects/info/alternates'), `${join(f.work, '.git/objects')}\n`),
    'an http-alternates file': (m) => put(join(m.copy, '.git/objects/info/http-alternates'), 'https://example.invalid/objects\n'),
    'a linked worktree': (m) => mkdirSync(join(m.copy, '.git/worktrees/side'), { recursive: true }),
    'a .git/modules folder': (m) => mkdirSync(join(m.copy, '.git/modules')),
    '.git/config replaced by a link': (m) => {
      renameSync(join(m.copy, '.git/config'), join(f.root, 'moved-config'));
      symlinkSync(join(f.root, 'moved-config'), join(m.copy, '.git/config'));
    },
    '.git/objects replaced by a link': (m) => {
      rmSync(join(f.root, 'moved-objects'), { recursive: true, force: true });
      renameSync(join(m.copy, '.git/objects'), join(f.root, 'moved-objects'));
      symlinkSync(join(f.root, 'moved-objects'), join(m.copy, '.git/objects'));
    },
    '.git/HEAD replaced by a link': (m) => {
      renameSync(join(m.copy, '.git/HEAD'), join(f.root, 'moved-HEAD'));
      symlinkSync(join(f.root, 'moved-HEAD'), join(m.copy, '.git/HEAD'));
    },
  };
  // A stand-in git that only records that it ran: the copy's own files are read before Git is asked anything.
  put(join(f.root, 'stub/git'), `#!/bin/sh\necho ran >> "${join(f.root, 'git-ran')}"\nexit 1\n`, 0o755);
  const needsGit = new Set(['a gitlink in the copy\'s index']);
  for (const [name, change] of Object.entries(cases)) {
    await t.test(name, () => {
      for (const left of ['moved.git', 'git-ran']) rmSync(join(f.root, left), { recursive: true, force: true });
      const m = make(f);
      put(join(m.copy, 'a.txt'), 'changed\n');
      assert.deepEqual(run(f, ['check', '--copy', m.copy]).json, { ok: true });
      change(m, devEnv(f, m));
      const early = run(f, ['check', '--copy', m.copy], { PATH: join(f.root, 'stub') });
      assert.equal(early.status, 1, early.out);
      assert.equal(existsSync(join(f.root, 'git-ran')), needsGit.has(name), 'only what Git itself must judge reaches Git');
      rmSync(join(f.root, 'git-ran'), { force: true });
      const c = run(f, ['check', '--copy', m.copy]);
      assert.equal(c.status, 1, c.out);
      assert.equal(c.json.ok, false);
      assert.ok(c.json.found.length > 0 && c.json.found.every((x) => typeof x === 'string' && x !== ''), c.out);
      const d = diff(f, m, 'never.patch');
      assert.equal(d.status, 1, d.out);
      assert.equal(d.json.ok, false);
      assert.match(d.json.reason, /check/);
      assert.equal(existsSync(d.file), false, 'no patch is written');
    });
  }
});

// ---- The copy

test('a tracked file that matches an ignore pattern arrives in the base', (t) => {
  const f = fixture(t), m = make(f);
  assert.equal(readFileSync(join(m.copy, 'build/keep.log'), 'utf8'), 'log\n');
  assert.match(git(devEnv(f, m), m.copy, 'ls-tree', '-r', '--name-only', m.base), /^build\/keep\.log$/m);
});

test('a file marked export-ignore arrives', (t) => {
  const f = fixture(t), m = make(f);
  assert.equal(readFileSync(join(m.copy, 'kept.txt'), 'utf8'), 'kept\n');
});

test('an executable file keeps its mode', (t) => {
  const f = fixture(t), m = make(f);
  assert.equal(statSync(join(m.copy, 'run.sh')).mode & 0o111, 0o111);
  assert.equal(statSync(join(m.copy, 'a.txt')).mode & 0o111, 0);
  assert.match(git(devEnv(f, m), m.copy, 'ls-tree', m.base, 'run.sh'), /^100755 /);
});

test('a tracked symbolic link inside the copy stays a link', (t) => {
  const f = fixture(t), m = make(f);
  assert.equal(lstatSync(join(m.copy, 'link-to-a')).isSymbolicLink(), true);
  assert.equal(readlinkSync(join(m.copy, 'link-to-a')), 'a.txt');
});

test('a tracked link that points outside the checkout stops make and leaves no copy', async (t) => {
  const f = fixture(t);
  put(join(f.root, 'outside/secret.txt'), 'secret\n');
  // The last one stays inside by its spelling (deep/outside) and leaves only once the link "up" is followed first.
  const targets = { 'a relative path': '../../../outside/secret.txt', 'an absolute path': join(f.root, 'outside/secret.txt'), 'a path through another link': 'up/../../outside' };
  put(join(f.work, 'deep/er/x.txt'));
  symlinkSync('../../build', join(f.work, 'deep/er/up'));
  git(f.env, f.work, 'add', '-A');
  git(f.env, f.work, ...ID, 'commit', '-q', '-m', 'a link inside');
  for (const [name, target] of Object.entries(targets)) {
    await t.test(name, () => {
      symlinkSync(target, join(f.work, 'deep/er/leak'));
      git(f.env, f.work, 'add', 'deep/er/leak');
      git(f.env, f.work, ...ID, 'commit', '-q', '-m', 'leak');
      refused(f, ['--cwd', f.work], /leak.*outside the copy/);
      git(f.env, f.work, 'rm', '-q', 'deep/er/leak');
      git(f.env, f.work, ...ID, 'commit', '-q', '-m', 'no leak');
    });
  }
  assert.equal(readlinkSync(join(make(f, []).copy, 'deep/er/up')), '../../build', 'a link that stays inside is fine');
});

test('a content filter that changes a file on checkout stops make and leaves no copy', (t) => {
  const f = fixture(t);
  put(join(f.work, '.gitattributes'), 'kept.txt export-ignore\na.txt filter=shout\n');
  git(f.env, f.work, ...ID, 'commit', '-q', '-am', 'a filter');
  git(f.env, f.work, 'config', 'filter.shout.smudge', 'tr a-z A-Z');
  git(f.env, f.work, 'config', 'filter.shout.clean', 'tr A-Z a-z');
  refused(f, ['--cwd', f.work], /a\.txt differs from HEAD/);
});

test('an index that hides changes stops make: assume-unchanged and skip-worktree', async (t) => {
  const f = fixture(t);
  for (const flag of ['assume-unchanged', 'skip-worktree']) {
    await t.test(flag, () => {
      git(f.env, f.work, 'update-index', `--${flag}`, 'a.txt');
      put(join(f.work, 'a.txt'), 'changed where status does not look\n');
      assert.equal(git(f.env, f.work, 'status', '--porcelain', '--untracked-files=no'), '', 'the fixture works: status sees nothing');
      refused(f, ['--cwd', f.work], /assume-unchanged or skip-worktree[\s\S]*a\.txt/);
      put(join(f.work, 'a.txt'), 'one\ntwo\nthree\n');
      git(f.env, f.work, 'update-index', `--no-${flag}`, 'a.txt');
    });
  }
  make(f, []);
});

test('a tracked path name that is not valid UTF-8 stops make', (t) => {
  const f = fixture(t);
  writeFileSync(Buffer.concat([Buffer.from(`${f.work}/bad-`), Buffer.from([0xff, 0xfe]), Buffer.from('.txt')]), 'x\n');
  git(f.env, f.work, 'add', '-A');
  git(f.env, f.work, ...ID, 'commit', '-q', '-m', 'a name in another encoding');
  refused(f, ['--cwd', f.work], /UTF-8/);
});

test('make and apply run no hook and no file-system monitor of the checkout', (t) => {
  const f = fixture(t), ran = join(f.root, 'ran');
  put(join(f.root, 'monitor.sh'), `#!/bin/sh\necho monitor >> "${ran}"\nexit 1\n`, 0o755);
  for (const hook of ['post-index-change', 'post-checkout', 'pre-commit', 'post-applypatch', 'pre-applypatch']) put(join(f.work, '.git/hooks', hook), `#!/bin/sh\necho ${hook} >> "${ran}"\n`, 0o755);
  git(f.env, f.work, 'config', 'core.fsmonitor', join(f.root, 'monitor.sh'));
  rmSync(ran, { force: true });
  const m = make(f), d = roundOne(f, m);
  assert.equal(apply(f, d.file).status, 0);
  assert.equal(existsSync(ran) ? readFileSync(ran, 'utf8') : '', '');
});

test('a filter in the user\'s own configuration does not reach the copy: it holds HEAD\'s files as committed', (t) => {
  const f = fixture(t);
  put(join(f.work, '.gitattributes'), 'kept.txt export-ignore\na.txt filter=shout\n');
  git(f.env, f.work, ...ID, 'commit', '-q', '-am', 'a filter');
  put(join(f.home, '.gitconfig'), '[filter "shout"]\n\tsmudge = tr a-z A-Z\n\tclean = tr A-Z a-z\n');
  const m = make(f, []);
  assert.equal(readFileSync(join(m.copy, 'a.txt'), 'utf8'), 'one\ntwo\nthree\n');
});

test('a checkout whose HEAD holds a gitlink: make stops, says submodules are not supported, and leaves no copy', (t) => {
  const f = fixture(t);
  git(f.env, f.work, 'init', '--template=', '-q', 'sub');
  git(f.env, join(f.work, 'sub'), ...ID, 'commit', '-q', '--allow-empty', '-m', 'inner');
  git(f.env, f.work, '-c', 'advice.addEmbeddedRepo=false', 'add', 'sub');
  git(f.env, f.work, ...ID, 'commit', '-q', '-m', 'a gitlink');
  assert.equal(git(f.env, f.work, 'status', '--porcelain', '--untracked-files=no'), '');
  refused(f, ['--cwd', f.work], /submodules are not supported/);
});

test('the plan folder\'s plan files arrive although Git ignores them, and its other files do not', (t) => {
  const f = fixture(t);
  put(join(f.plan, 'reviews/round-1/codex.md'), 'review\n');
  const m = make(f);
  assert.equal(m.plan, 'docs/plans/demo');
  const at = join(m.copy, m.plan);
  assert.equal(readFileSync(join(at, 'plan.md'), 'utf8'), '# plan\n');
  assert.equal(readFileSync(join(at, 'phases/PHASE-01-x.md'), 'utf8'), '# phase\n');
  assert.equal(readFileSync(join(at, 'reviews/round-1/codex.md'), 'utf8'), 'review\n');
  assert.deepEqual(readdirSync(at).sort(), ['phases', 'plan.md', 'reviews'], 'neither .env nor notes.txt');
  assert.match(git(devEnv(f, m), m.copy, 'ls-tree', '-r', '--name-only', m.base), /^docs\/plans\/demo\/plan\.md$/m);
});

test('a plan folder outside the checkout lands in .mstack-plan and stays out of the diff', (t) => {
  const f = fixture(t), outer = join(f.root, 'my plans', 'demo two');
  put(join(outer, 'spec.md'), '# spec\n');
  put(join(outer, 'phases/PHASE-01-x.md'), '# phase\n');
  const m = make(f, ['--plan', outer]);
  assert.equal(m.plan, '.mstack-plan/demo two');
  assert.equal(readFileSync(join(m.copy, m.plan, 'spec.md'), 'utf8'), '# spec\n');
  put(join(m.copy, m.plan, 'spec.md'), '# spec, edited by the developer\n');
  put(join(m.copy, m.plan, 'extra.md'), 'extra\n');
  put(join(m.copy, 'a.txt'), 'changed\n');
  assert.deepEqual(goodDiff(f, m, 'outer.patch').json.files, ['a.txt']);
  assert.doesNotMatch(readFileSync(join(f.root, 'outer.patch'), 'utf8'), /mstack-plan/);
});

test('an external plan folder while HEAD holds .mstack-plan: make stops', (t) => {
  const f = fixture(t), outer = join(f.root, 'outer-plan');
  put(join(outer, 'plan.md'));
  put(join(f.work, '.mstack-plan/x.md'));
  git(f.env, f.work, 'add', '-A');
  git(f.env, f.work, ...ID, 'commit', '-q', '-m', 'the name is taken');
  refused(f, ['--cwd', f.work, '--plan', outer], /\.mstack-plan/);
});

test('make refuses a bad plan folder and names it', async (t) => {
  const f = fixture(t);
  await t.test('the checkout itself', () => refused(f, ['--cwd', f.work, '--plan', f.work], /plan folder.*work/));
  await t.test('.git', () => refused(f, ['--cwd', f.work, '--plan', join(f.work, '.git')], /plan folder.*\.git/));
  await t.test('a folder inside .git', () => refused(f, ['--cwd', f.work, '--plan', join(f.work, '.git/refs')], /plan folder.*\.git/));
  await t.test('a missing folder', () => refused(f, ['--cwd', f.work, '--plan', join(f.root, 'no such')], /plan folder.*no such/));
  await t.test('a file', () => refused(f, ['--cwd', f.work, '--plan', join(f.work, 'a.txt')], /plan folder.*a\.txt/));
  await t.test('a phases/ file that is a link', () => {
    symlinkSync(join(f.work, '.env'), join(f.plan, 'phases/PHASE-02-link.md'));
    refused(f, ['--cwd', f.work, '--plan', f.plan], /PHASE-02-link\.md.*not a regular file/);
    rmSync(join(f.plan, 'phases/PHASE-02-link.md'));
  });
  await t.test('a plan.md that is a link', () => {
    rmSync(join(f.plan, 'plan.md'));
    symlinkSync(join(f.work, '.env'), join(f.plan, 'plan.md'));
    refused(f, ['--cwd', f.work, '--plan', f.plan], /plan\.md.*not a regular file/);
    rmSync(join(f.plan, 'plan.md'));
  });
  await t.test('a phases/.git folder', () => {
    mkdirSync(join(f.plan, 'phases/.git'));
    refused(f, ['--cwd', f.work, '--plan', f.plan], /phases\/\.git/);
  });
});

test('make refuses a folder that is not a Git checkout', (t) => {
  const f = fixture(t), plain = join(f.root, 'plain');
  mkdirSync(plain);
  refused(f, ['--cwd', plain], /not a Git checkout/);
  refused(f, ['--cwd', f.origin], /not a Git checkout/);
  refused(f, ['--cwd', join(f.root, 'missing')], /not a Git checkout/);
});

test('make refuses a checkout without a commit', (t) => {
  const f = fixture(t), empty = join(f.root, 'empty');
  mkdirSync(empty);
  git(f.env, empty, 'init', '--template=', '-q');
  refused(f, ['--cwd', empty], /no commit/);
});

test('no file of the copy is a hard link into the checkout', (t) => {
  const f = fixture(t), m = make(f);
  for (const rel of ['a.txt', 'run.sh', 'kept.txt', 'build/keep.log', 'docs/plans/demo/plan.md', 'docs/plans/demo/phases/PHASE-01-x.md']) {
    const s = statSync(join(m.copy, rel));
    assert.equal(s.nlink, 1, rel);
    assert.notEqual(s.ino, statSync(join(f.work, rel)).ino, rel);
  }
});

test('the copy lies outside the checkout, and make refuses a temp folder inside it', (t) => {
  const f = fixture(t), m = make(f);
  assert.equal(dirname(m.copy), f.tmp);
  assert.match(m.copy, /mstack-vendors-dev-[^/]+$/);
  assert.equal(m.gitConfig, join(m.copy, '.git/mstack-empty-config'));
  const inside = join(f.work, 'node_modules/tmp');
  mkdirSync(inside, { recursive: true });
  const r = run(f, ['make', '--cwd', f.work], { TMPDIR: inside });
  assert.equal(r.status, 1, r.out);
  assert.match(r.stderr, /inside the checkout/);
  assert.deepEqual(readdirSync(inside), []);
});

test('make prints the source commit, a base of its own and the paths, and the base holds the same tree as the source', (t) => {
  const f = fixture(t, { committedPlan: true }), m = make(f);
  assert.deepEqual(Object.keys(m), ['copy', 'base', 'source', 'plan', 'gitConfig']);
  assert.equal(m.source, f.head);
  assert.notEqual(m.base, f.head, 'a fresh repository, not a clone');
  assert.equal(make(f, []).plan, null);
  assert.equal(git(devEnv(f, m), m.copy, 'rev-parse', `${m.base}^{tree}`), git(f.env, f.work, 'rev-parse', 'HEAD^{tree}'));
  assert.equal(readFileSync(m.gitConfig, 'utf8'), '');
});

test('make works from a linked worktree and from a path with a space, a quote and a leading dash', (t) => {
  const f = fixture(t), odd = join(f.root, '-odd "dir\' x');
  git(f.env, f.work, 'worktree', 'add', '-q', '-b', 'side', odd);
  assert.equal(lstatSync(join(odd, '.git')).isFile(), true);
  const r = run(f, ['make'], {}, odd);
  assert.equal(r.status, 0, r.out);
  assert.equal(readFileSync(join(r.json.copy, 'a.txt'), 'utf8'), 'one\ntwo\nthree\n');
  assert.equal(lstatSync(join(r.json.copy, '.git')).isDirectory(), true);
  assert.deepEqual(run(f, ['check', '--copy', r.json.copy]).json, { ok: true });
});

// ---- Isolation

test('nothing of a hostile source configuration reaches the copy', (t) => {
  const f = fixture(t);
  put(join(f.root, 'inc'), `[remote "included"]\n\turl = ${f.origin}\n`);
  put(join(f.root, 'hooks/pre-commit'), '#!/bin/sh\nexit 1\n', 0o755);
  put(join(f.work, '.git/hooks/pre-commit'), '#!/bin/sh\nexit 1\n', 0o755);
  mkdirSync(join(f.root, 'alt/objects'), { recursive: true });
  put(join(f.work, '.git/objects/info/alternates'), `${join(f.root, 'alt/objects')}\n`);
  for (const [k, v] of [['remote.origin.pushurl', f.origin], [`url.${f.origin}.insteadOf`, 'short:'], ['include.path', join(f.root, 'inc')],
    ['includeIf.gitdir:/.path', join(f.root, 'inc')], ['core.hooksPath', join(f.root, 'hooks')], ['credential.helper', 'store'],
    ['branch.main.remote', 'origin'], ['branch.main.merge', 'refs/heads/main'], ['remote.pushDefault', 'origin']]) git(f.env, f.work, 'config', k, v);
  const m = make(f), env = devEnv(f, m);
  const allowed = new Set(['core.repositoryformatversion', 'core.filemode', 'core.bare', 'core.logallrefupdates', 'core.ignorecase', 'core.precomposeunicode', 'core.symlinks', 'user.name', 'user.email']);
  const keys = git(env, m.copy, 'config', '--list', '--name-only').split('\n');
  assert.deepEqual(keys.filter((k) => !allowed.has(k)), []);
  assert.equal(git(env, m.copy, 'remote'), '');
  assert.equal(existsSync(join(m.copy, '.git/objects/info/alternates')), false);
  assert.equal(existsSync(join(m.copy, '.git/hooks')) ? readdirSync(join(m.copy, '.git/hooks')).length : 0, 0);
  assert.equal(git(env, m.copy, 'for-each-ref'), `${m.base} commit\trefs/heads/${git(env, m.copy, 'branch', '--show-current')}`, 'one branch, no remote-tracking ref');
  assert.equal(git(env, m.copy, 'rev-list', '--count', '--all'), '1');
});

test('a remote in the user\'s global configuration is invisible under the printed environment', (t) => {
  const f = fixture(t);
  put(join(f.home, '.gitconfig'), `[remote "global"]\n\turl = ${f.origin}\n[url "${f.origin}"]\n\tpushInsteadOf = short:\n[user]\n\tname = t\n\temail = t@invalid\n`);
  const before = git(f.env, f.origin, 'for-each-ref');
  const m = make(f), env = devEnv(f, m);
  assert.equal(git({ PATH: process.env.PATH, HOME: f.home }, m.copy, 'remote'), 'global', 'the fixture works: plain Git does see it');
  assert.equal(git(env, m.copy, 'remote'), '');
  assert.notEqual(tryGit(env, m.copy, 'push', 'global', 'HEAD').status, 0);
  assert.equal(git(f.env, f.origin, 'for-each-ref'), before);
  assert.deepEqual(run(f, ['check', '--copy', m.copy]).json, { ok: true });
});

test('inherited Git variables do not reach the copy', (t) => {
  const f = fixture(t);
  const hostile = { GIT_DIR: join(f.work, '.git'), GIT_WORK_TREE: f.work, GIT_CONFIG_COUNT: '1', GIT_CONFIG_KEY_0: 'remote.env.url', GIT_CONFIG_VALUE_0: f.origin };
  const workBefore = snap(f.work);
  const m = make(f, ['--plan', f.plan], hostile);
  assert.equal(git(devEnv(f, m), m.copy, 'remote'), '');
  assert.equal(git(devEnv(f, m), m.copy, 'rev-list', '--count', 'HEAD'), '1');
  const c = run(f, ['check', '--copy', m.copy], hostile);
  assert.deepEqual(c.json, { ok: true }, c.out);
  put(join(m.copy, 'a.txt'), 'changed\n');
  const d = diff(f, m, 'env.patch', hostile);
  assert.equal(d.status, 0, d.out);
  assert.deepEqual(d.json.files, ['a.txt']);
  assert.deepEqual(snap(f.work), workBefore, 'the checkout the variables pointed at is untouched');
});

test('make works without a Git identity, the copy has one commit, and a plain git commit works in it', (t) => {
  const f = fixture(t), m = make(f), env = devEnv(f, m);
  assert.equal(existsSync(join(f.home, '.gitconfig')), false);
  assert.equal(git(env, m.copy, 'rev-list', '--count', 'HEAD'), '1');
  assert.equal(git(env, m.copy, 'rev-parse', 'HEAD'), m.base);
  assert.equal(git(env, m.copy, 'status', '--porcelain'), '');
  put(join(m.copy, 'a.txt'), 'changed\n');
  git(env, m.copy, 'commit', '-q', '-am', 'developer');
  assert.equal(git(env, m.copy, 'rev-list', '--count', 'HEAD'), '2');
});

// ---- The diff

test('the diff carries a deletion, a rename, a mode change and a binary file exactly', (t) => {
  const f = fixture(t), m = make(f);
  const bytes = Buffer.from(Array.from({ length: 512 }, (_, i) => i % 256));
  rmSync(join(m.copy, 'kept.txt'));
  renameSync(join(m.copy, 'a.txt'), join(m.copy, 'moved "here".txt'));
  rmSync(join(m.copy, 'link-to-a'));
  chmodSync(join(m.copy, 'run.sh'), 0o644);
  writeFileSync(join(m.copy, 'bin.dat'), bytes);
  const d = goodDiff(f, m, 'shapes.patch');
  assert.deepEqual(d.json.files, ['a.txt', 'bin.dat', 'kept.txt', 'link-to-a', 'moved "here".txt', 'run.sh']);
  const r = apply(f, d.file);
  assert.equal(r.status, 0, r.out);
  assert.equal(existsSync(join(f.work, 'kept.txt')), false);
  assert.equal(existsSync(join(f.work, 'a.txt')), false);
  assert.equal(lstatSync(join(f.work, 'link-to-a'), { throwIfNoEntry: false }), undefined);
  assert.equal(readFileSync(join(f.work, 'moved "here".txt'), 'utf8'), 'one\ntwo\nthree\n');
  assert.equal(statSync(join(f.work, 'run.sh')).mode & 0o111, 0);
  assert.deepEqual(readFileSync(join(f.work, 'bin.dat')), bytes);
});

test('a change to a tracked file that matches an ignore pattern is in the diff', (t) => {
  const f = fixture(t), m = make(f);
  put(join(m.copy, 'build/keep.log'), 'log, changed\n');
  assert.deepEqual(goodDiff(f, m, 'ignored.patch').json.files, ['build/keep.log']);
});

test('a new ignored file the developer created is not in the diff', (t) => {
  const f = fixture(t), m = make(f);
  put(join(m.copy, '.env'), 'DEVELOPER_SECRET=1\n');
  put(join(m.copy, 'build/other.log'), 'log\n');
  put(join(m.copy, 'node_modules/x/index.js'), 'x\n');
  put(join(m.copy, 'seen.txt'), 'seen\n');
  const d = goodDiff(f, m, 'new-ignored.patch');
  assert.deepEqual(d.json.files, ['seen.txt']);
  assert.doesNotMatch(readFileSync(d.file, 'utf8'), /DEVELOPER_SECRET/);
});

test('a force-staged ignored file is in the diff', (t) => {
  const f = fixture(t), m = make(f);
  put(join(m.copy, 'build/forced.log'), 'forced\n');
  git(devEnv(f, m), m.copy, 'add', '-f', 'build/forced.log');
  assert.deepEqual(goodDiff(f, m, 'forced.patch').json.files, ['build/forced.log']);
  assert.match(git(devEnv(f, m), m.copy, 'status', '--porcelain'), /^A  build\/forced\.log$/m, 'the copy\'s own index is as the developer left it');
});

test('an unborn HEAD gives no spurious deletions', async (t) => {
  const f = fixture(t);
  for (const dropIndex of [false, true]) {
    await t.test(dropIndex ? 'with the index removed' : 'with the index kept', () => {
      const m = make(f);
      git(devEnv(f, m), m.copy, 'checkout', '-q', '--orphan', 'fresh');
      if (dropIndex) rmSync(join(m.copy, '.git/index'));
      put(join(m.copy, 'n.txt'), 'n\n');
      assert.deepEqual(goodDiff(f, m, `unborn-${dropIndex}.patch`).json.files, ['n.txt']);
    });
  }
});

test('a HEAD that exists and is not a commit is refused, never read as an unborn branch', async (t) => {
  const f = fixture(t);
  const cases = {
    'a branch that points at a tree': (m, env) => writeFileSync(join(m.copy, '.git/refs/heads/main'), `${git(env, m.copy, 'rev-parse', `${m.base}^{tree}`)}\n`),
    'a branch that points at an object the copy does not hold': (m) => writeFileSync(join(m.copy, '.git/refs/heads/main'), `${f.head}\n`),
    'a branch file that holds no id': (m) => writeFileSync(join(m.copy, '.git/refs/heads/main'), 'nonsense\n'),
    'a detached HEAD at a tree': (m, env) => writeFileSync(join(m.copy, '.git/HEAD'), `${git(env, m.copy, 'rev-parse', `${m.base}^{tree}`)}\n`),
  };
  for (const [name, change] of Object.entries(cases)) {
    await t.test(name, () => {
      const m = make(f);
      put(join(m.copy, 'n.txt'), 'n\n');
      change(m, devEnv(f, m));
      const c = run(f, ['check', '--copy', m.copy]);
      assert.equal(c.status, 1, c.out);
      assert.match(c.json.found.join('\n'), /HEAD/);
      const d = diff(f, m, 'never.patch');
      assert.equal(d.status, 1, d.out);
      assert.equal(existsSync(d.file), false);
    });
  }
});

test('the diff ignores the user\'s diff.noprefix and an external diff driver', (t) => {
  const f = fixture(t), m = make(f);
  put(join(f.root, 'driver.sh'), `#!/bin/sh\necho ran > "${join(f.root, 'driver-ran')}"\necho not a patch\n`, 0o755);
  // A copy's own configuration cannot hold these (check refuses them), so they come from the user's file and variables.
  put(join(f.home, '.gitconfig'), `[diff]\n\tnoprefix = true\n\tmnemonicPrefix = true\n\texternal = ${join(f.root, 'driver.sh')}\n\trenames = copies\n[color]\n\tui = always\n[diff "txt"]\n\ttextconv = ${join(f.root, 'driver.sh')}\n`);
  put(join(m.copy, '.gitattributes'), 'kept.txt export-ignore\n*.txt diff=txt\n');
  put(join(m.copy, 'a.txt'), 'one\ntwo\nthree\nfour\n');
  put(join(m.copy, 'copy-of-a.txt'), 'one\ntwo\nthree\n');
  const d = diff(f, m, 'plain.patch', { GIT_EXTERNAL_DIFF: join(f.root, 'driver.sh'), GIT_DIFF_OPTS: '--unified=0', GIT_CONFIG_COUNT: '1', GIT_CONFIG_KEY_0: 'diff.noprefix', GIT_CONFIG_VALUE_0: 'true' });
  assert.equal(d.status, 0, d.out);
  const patch = readFileSync(d.file, 'utf8');
  assert.match(patch, /^diff --git a\/a\.txt b\/a\.txt$/m);
  assert.match(patch, /^\+\+\+ b\/copy-of-a\.txt$/m);
  assert.match(patch, /^index [0-9a-f]{40}\.\.[0-9a-f]{40}/m);
  assert.match(patch, /^ three$/m, 'context lines are kept');
  assert.doesNotMatch(patch, /\x1b|not a patch|copy from/);
  assert.equal(existsSync(join(f.root, 'driver-ran')), false);
  assert.equal(apply(f, d.file).status, 0);
  assert.equal(readFileSync(join(f.work, 'a.txt'), 'utf8'), 'one\ntwo\nthree\nfour\n');
  assert.equal(existsSync(join(f.root, 'driver-ran')), false);
});

test('diff refuses a missing base, a base that is not a commit of the copy, and an empty change', (t) => {
  const f = fixture(t), m = make(f), out = join(f.root, 'none.patch');
  assert.equal(run(f, ['diff', '--copy', m.copy, '--out', out]).status, 2);
  for (const base of [ZERO, f.head.replace(/^./, (c) => (c === 'a' ? 'b' : 'a')), 'HEAD', '--output=/dev/null', git(devEnv(f, m), m.copy, 'rev-parse', `${m.base}^{tree}`)]) {
    const r = run(f, ['diff', '--copy', m.copy, `--base=${base}`, '--out', out]);
    assert.equal(r.status, 1, `${base}: ${r.out}`);
    assert.match(r.json.reason, /base/);
  }
  const r = run(f, ['diff', '--copy', m.copy, '--base', m.base, '--out', out]);
  assert.equal(r.status, 1, r.out);
  assert.deepEqual(r.json, { ok: false, reason: 'no changes' });
  assert.equal(existsSync(out), false);
});

test('diff writes only a new file outside the copy', (t) => {
  const f = fixture(t), m = make(f);
  put(join(m.copy, 'a.txt'), 'changed\n');
  put(join(f.root, 'victim.txt'), 'keep me\n');
  symlinkSync(join(f.root, 'victim.txt'), join(m.copy, 'planted.patch'));
  symlinkSync(join(f.root, 'victim.txt'), join(f.root, 'link.patch'));
  for (const out of [join(m.copy, 'planted.patch'), join(m.copy, 'in-copy.patch'), join(f.root, 'link.patch'), join(f.root, 'victim.txt')]) {
    const r = run(f, ['diff', '--copy', m.copy, '--base', m.base, '--out', out]);
    assert.equal(r.status, 1, `${out}: ${r.out}`);
    assert.equal(r.json.ok, false);
  }
  assert.equal(readFileSync(join(f.root, 'victim.txt'), 'utf8'), 'keep me\n');
  assert.equal(existsSync(join(m.copy, 'in-copy.patch')), false);
});

// ---- Apply and remove

test('apply puts round one into a clean checkout', (t) => {
  const f = fixture(t), m = make(f), d = roundOne(f, m);
  const gitBefore = snap(join(f.work, '.git'));
  const r = apply(f, d.file);
  assert.equal(r.status, 0, r.out);
  assert.deepEqual(r.json, { ok: true });
  assert.equal(readFileSync(join(f.work, 'a.txt'), 'utf8'), 'one\ntwo\nthree\nfour\n');
  assert.equal(readFileSync(join(f.work, 'new.txt'), 'utf8'), 'new\n');
  assert.equal(statSync(join(f.work, 'new.txt')).mode & 0o111, 0o111);
  assert.equal(existsSync(join(f.work, 'kept.txt')), false);
  assert.deepEqual(snap(join(f.work, '.git')), gitBefore, 'neither the index nor the object store nor HEAD changed');
  assert.equal(git(f.env, f.work, 'rev-parse', 'HEAD'), f.head);
});

test('apply replaces round one with round two', (t) => {
  const f = fixture(t), m = make(f), one = roundOne(f, m);
  assert.equal(apply(f, one.file).status, 0);
  put(join(m.copy, 'a.txt'), 'one\n2\nthree\nfour\n');
  rmSync(join(m.copy, 'new.txt'));
  put(join(m.copy, 'kept.txt'), 'kept\n');
  put(join(m.copy, 'fix.txt'), 'fix\n');
  const two = goodDiff(f, m, 'round2.patch');
  assert.deepEqual(two.json.files, ['a.txt', 'fix.txt']);
  const r = apply(f, two.file, one.file);
  assert.equal(r.status, 0, r.out);
  assert.equal(readFileSync(join(f.work, 'a.txt'), 'utf8'), 'one\n2\nthree\nfour\n');
  assert.equal(existsSync(join(f.work, 'new.txt')), false, 'round one\'s new file is gone');
  assert.equal(readFileSync(join(f.work, 'kept.txt'), 'utf8'), 'kept\n', 'round one\'s deletion is undone');
  assert.equal(readFileSync(join(f.work, 'fix.txt'), 'utf8'), 'fix\n');
  assert.equal(apply(f, two.file, two.file).status, 0, 'the same patch again changes nothing');
});

test('a fix round that takes everything back: an empty patch with --previous restores the source commit', (t) => {
  const f = fixture(t), m = make(f), one = roundOne(f, m), env = devEnv(f, m);
  const clean = snap(f.work);
  assert.equal(apply(f, one.file).status, 0);
  git(env, m.copy, 'reset', '-q', '--hard', m.base);
  rmSync(join(m.copy, 'new.txt'));
  const d = diff(f, m, 'round2.patch');
  assert.equal(d.status, 1, d.out);
  assert.deepEqual(d.json, { ok: false, reason: 'no changes' });
  const empty = join(f.root, 'empty.patch');
  writeFileSync(empty, '');
  const r = apply(f, empty, one.file);
  assert.equal(r.status, 0, r.out);
  assert.deepEqual(r.json, { ok: true });
  assert.deepEqual(snap(f.work), clean, 'the checkout is the source commit again, byte for byte');
  assert.equal(apply(f, empty).status, 0, 'an empty patch on a clean checkout changes nothing');
  assert.deepEqual(snap(f.work), clean);
});

test('apply refuses a patch file that lies inside a copy', (t) => {
  const f = fixture(t), m = make(f), one = roundOne(f, m);
  const inside = join(m.copy, 'inside.patch'), link = join(f.root, 'link-into-the-copy.patch');
  writeFileSync(inside, readFileSync(one.file));
  symlinkSync(inside, link);
  const before = snap(f.work);
  for (const args of [[inside], [link], [one.file, inside], [one.file, link]]) {
    const r = apply(f, ...args);
    assert.equal(r.status, 1, r.out);
    assert.match(r.json.reason, /inside a copy/);
    assert.deepEqual(snap(f.work), before);
  }
});

test('apply refuses a checkout whose HEAD moved', (t) => {
  const f = fixture(t), m = make(f), d = roundOne(f, m);
  git(f.env, f.work, ...ID, 'commit', '-q', '--allow-empty', '-m', 'someone else');
  const before = snap(f.work);
  const r = apply(f, d.file);
  assert.equal(r.status, 1, r.out);
  assert.match(r.json.reason, /HEAD/);
  assert.deepEqual(snap(f.work), before);
});

test('apply refuses a checkout whose tracked files are not source plus the previous patch', async (t) => {
  const f = fixture(t), m = make(f), one = roundOne(f, m);
  put(join(m.copy, 'fix.txt'), 'fix\n');
  const two = goodDiff(f, m, 'round2.patch');
  const stale = (name, change, undo, previous = one.file) => t.test(name, () => {
    change();
    const before = snap(f.work);
    const r = apply(f, two.file, previous);
    assert.equal(r.status, 1, r.out);
    assert.equal(r.json.ok, false);
    assert.match(r.json.reason, /not the source commit plus the previous patch/);
    assert.deepEqual(snap(f.work), before);
    undo();
  });
  await stale('round one was never applied', () => {}, () => {});
  await stale('no --previous although round one is applied', () => assert.equal(apply(f, one.file).status, 0), () => {}, null);
  await stale('a file round one changed was edited since', () => put(join(f.work, 'a.txt'), 'by hand\n'), () => put(join(f.work, 'a.txt'), 'one\ntwo\nthree\nfour\n'));
  await stale('a file round one added was edited since', () => put(join(f.work, 'new.txt'), 'by hand\n', 0o755), () => put(join(f.work, 'new.txt'), 'new\n', 0o755));
  await stale('a file round one added lost its mode', () => chmodSync(join(f.work, 'new.txt'), 0o644), () => chmodSync(join(f.work, 'new.txt'), 0o755));
  await stale('a file round one added is gone', () => rmSync(join(f.work, 'new.txt')), () => put(join(f.work, 'new.txt'), 'new\n', 0o755));
  await stale('a file round one deleted is back', () => put(join(f.work, 'kept.txt'), 'kept\n'), () => rmSync(join(f.work, 'kept.txt')));
  await stale('a file round one never touched was edited', () => put(join(f.work, 'run.sh'), '#!/bin/sh\nrm -rf /\n', 0o755), () => put(join(f.work, 'run.sh'), '#!/bin/sh\necho hi\n', 0o755));
  const r = apply(f, two.file, one.file);
  assert.equal(r.status, 0, `after every undo the replacement goes through: ${r.out}`);
});

test('a replacement that fails validation leaves the checkout holding round one', (t) => {
  const f = fixture(t), m = make(f), one = roundOne(f, m);
  assert.equal(apply(f, one.file).status, 0);
  const bad = join(f.root, 'bad.patch');
  writeFileSync(bad, 'diff --git a/a.txt b/a.txt\n--- a/a.txt\n+++ b/a.txt\n@@ -1,3 +1,3 @@\n one\n-zwei\n+2\n three\n');
  const before = snap(f.work);
  const r = apply(f, bad, one.file);
  assert.equal(r.status, 1, r.out);
  assert.equal(r.json.ok, false);
  assert.deepEqual(snap(f.work), before);
  assert.equal(readFileSync(join(f.work, 'new.txt'), 'utf8'), 'new\n');
});

test('apply refuses a new file that would overwrite an untracked file', async (t) => {
  const f = fixture(t), m = make(f), one = roundOne(f, m);
  await t.test('in round one', () => {
    put(join(f.work, 'new.txt'), 'the user\'s own notes\n');
    const before = snap(f.work);
    const r = apply(f, one.file);
    assert.equal(r.status, 1, r.out);
    assert.match(r.json.reason, /new\.txt exists in the checkout and Git does not track it/);
    assert.deepEqual(snap(f.work), before);
    rmSync(join(f.work, 'new.txt'));
  });
  await t.test('in round two, where round one\'s own new file is no collision', () => {
    assert.equal(apply(f, one.file).status, 0);
    put(join(m.copy, 'fix.txt'), 'fix\n');
    const two = goodDiff(f, m, 'round2.patch');
    put(join(f.work, 'fix.txt'), 'the user\'s own notes\n');
    const before = snap(f.work);
    const r = apply(f, two.file, one.file);
    assert.equal(r.status, 1, r.out);
    assert.match(r.json.reason, /fix\.txt exists in the checkout and Git does not track it/);
    assert.deepEqual(snap(f.work), before);
    rmSync(join(f.work, 'fix.txt'));
    assert.equal(apply(f, two.file, one.file).status, 0);
  });
});

test('apply refuses a patch that reaches outside the checkout, into .git or through a link', async (t) => {
  const f = fixture(t);
  mkdirSync(join(f.root, 'outside'));
  symlinkSync(join(f.root, 'outside'), join(f.work, 'node_modules'));
  const add = (path, mode = '100644') => `diff --git a/${path} b/${path}\nnew file mode ${mode}\n--- /dev/null\n+++ b/${path}\n@@ -0,0 +1 @@\n+evil\n`;
  const own = /outside the checkout or inside \.git/, link = (to) => `diff --git a/way b/way\nnew file mode 120000\n--- /dev/null\n+++ b/way\n@@ -0,0 +1 @@\n+${to}\n\\ No newline at end of file\n`;
  const patches = {
    'a .. path': [add('../escaped.txt'), own],
    'a .. path further down': [add('build/../../escaped.txt'), own],
    'an absolute path': [add(`/${f.root}/escaped.txt`), /./],
    'a file in .git/hooks': [add('.git/hooks/pre-commit', '100755'), own],
    'the .git configuration': [add('.git/config'), own],
    'a .GIT spelling': [add('.GIT/hooks/pre-commit', '100755'), own],
    'a gitlink': [`diff --git a/sub b/sub\nnew file mode 160000\nindex 0000000..${f.head}\n--- /dev/null\n+++ b/sub\n@@ -0,0 +1 @@\n+Subproject commit ${f.head}\n`, /gitlink/],
    'a path below an untracked link to a folder': [add('node_modules/escaped.txt'), /below a link/],
    'a link that leads outside': [link('../outside'), /leads outside the checkout or into \.git/],
    'a link that leads into .git': [link('.git/config'), /leads outside the checkout or into \.git/],
    'a link and a file below it in one patch': [`${link(join(f.root, 'outside'))}${add('way/escaped.txt')}`, /./],
  };
  for (const [name, [text, reason]] of Object.entries(patches)) {
    await t.test(name, () => {
      const file = join(f.root, 'hostile.patch');
      writeFileSync(file, text);
      const before = snap(f.work);
      const r = apply(f, file);
      assert.equal(r.status, 1, r.out);
      assert.equal(r.json.ok, false);
      assert.match(r.json.reason, reason);
      assert.deepEqual(snap(f.work), before);
      assert.deepEqual(readdirSync(join(f.root, 'outside')), []);
      assert.equal(existsSync(join(f.root, 'escaped.txt')), false);
    });
  }
});

test('apply refuses an edit to a plan file Git ignores, and names it', (t) => {
  const f = fixture(t), m = make(f);
  put(join(m.copy, m.plan, 'plan.md'), '# plan, edited by the developer\n');
  put(join(m.copy, 'a.txt'), 'changed\n');
  const d = goodDiff(f, m, 'plan-edit.patch');
  assert.deepEqual(d.json.files, ['a.txt', 'docs/plans/demo/plan.md']);
  const before = snap(f.work);
  const r = apply(f, d.file);
  assert.equal(r.status, 1, r.out);
  assert.match(r.json.reason, /docs\/plans\/demo\/plan\.md/);
  assert.deepEqual(snap(f.work), before);
});

test('apply refuses a folder that is not the top of a checkout, and a patch that is not a file', (t) => {
  const f = fixture(t), m = make(f), d = roundOne(f, m);
  for (const args of [['--checkout', join(f.work, 'build'), '--source', f.head, '--patch', d.file], ['--checkout', f.root, '--source', f.head, '--patch', d.file],
    ['--checkout', f.work, '--source', f.head, '--patch', join(f.root, 'missing.patch')], ['--checkout', f.work, '--source', 'HEAD', '--patch', d.file],
    ['--checkout', f.work, '--source', f.head, '--patch', d.file, '--previous', join(f.root, 'missing.patch')]]) {
    const before = snap(f.work);
    const r = run(f, ['apply', ...args]);
    assert.equal(r.status, 1, r.out);
    assert.equal(r.json.ok, false);
    assert.deepEqual(snap(f.work), before);
  }
});

test('remove deletes the copy and refuses a folder it did not make', (t) => {
  const f = fixture(t), m = make(f);
  const refuse = (dir) => {
    const r = run(f, ['remove', '--copy', dir]);
    assert.equal(r.status, 1, `${dir}: ${r.out}`);
    assert.equal(r.json.ok, false);
  };
  const noMarker = join(f.tmp, 'mstack-vendors-dev-plain');
  put(join(noMarker, 'keep.txt'));
  refuse(noMarker);
  const elsewhere = join(f.root, 'mstack-vendors-dev-elsewhere');
  put(join(elsewhere, '.git/mstack-vendors-copy'), '');
  refuse(elsewhere);
  const otherName = join(f.tmp, 'other');
  put(join(otherName, '.git/mstack-vendors-copy'), '');
  refuse(otherName);
  const link = join(f.tmp, 'mstack-vendors-dev-link');
  symlinkSync(m.copy, link);
  refuse(link);
  refuse(join(m.copy, '..', '..', 'work'));
  refuse(f.work);
  refuse(join(f.tmp, 'mstack-vendors-dev-missing'));
  for (const kept of [join(noMarker, 'keep.txt'), elsewhere, otherName, join(f.work, 'a.txt'), join(m.copy, 'a.txt')]) assert.equal(existsSync(kept), true, kept);
  // A link the developer left in the copy is removed as a link: its target stays.
  symlinkSync(f.work, join(m.copy, 'to-the-checkout'));
  const r = run(f, ['remove', '--copy', m.copy]);
  assert.equal(r.status, 0, r.out);
  assert.equal(existsSync(m.copy), false);
  assert.equal(existsSync(join(f.work, 'a.txt')), true);
});

test('check says what it found in a folder that is not a copy, without changing it', (t) => {
  const f = fixture(t);
  const before = snap(f.work);
  for (const dir of [f.work, join(f.root, 'missing'), join(f.work, 'a.txt')]) {
    const r = run(f, ['check', '--copy', dir]);
    assert.equal(r.status, 1, r.out);
    assert.equal(r.json.ok, false);
    assert.ok(r.json.found.length > 0);
  }
  assert.deepEqual(snap(f.work), before);
});

test('usage errors exit 2', (t) => {
  const f = fixture(t);
  for (const args of [[], ['frobnicate'], ['make', '--frobnicate'], ['make', 'extra'], ['check'], ['diff', '--copy', f.work, '--base', ZERO],
    ['apply', '--checkout', f.work, '--source', ZERO], ['remove'], ['check', '--copy']]) {
    const r = run(f, args);
    assert.equal(r.status, 2, `${args.join(' ')}: ${r.out}`);
    assert.match(r.stderr, /usage: /);
    assert.match(r.stderr, /not a sandbox/);
    assert.equal(r.stdout, '');
  }
  assert.deepEqual(readdirSync(f.tmp), []);
});
