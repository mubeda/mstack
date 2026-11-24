#!/usr/bin/env node
// The copy a Claude developer of mstack-vendors writes in: a fresh repository in the temporary folder that holds the
// tracked files of the checkout's HEAD and the run's plan files. What it is: a repository with no remote, no push
// address and no hook in its configuration, so a plain `git push` there has nowhere to go, and `check` looks at it
// again after each round and stops when that changed. What it is not: a sandbox. The developer runs under the
// user's identity with a shell and the network, so the copy limits what Git does by default and nothing else.
//
// Usage: node dev-copy.mjs make [--cwd <checkout>] [--plan <folder>]
//        node dev-copy.mjs check --copy <dir>
//        node dev-copy.mjs diff --copy <dir> --base <sha> --out <file> [--plan <printed plan>]
//        node dev-copy.mjs apply --checkout <dir> --source <sha> --patch <file> [--previous <file>]
//        node dev-copy.mjs remove --copy <dir>
//
// make   prints {"copy","base","source","plan","gitConfig"}: the copy's folder, its one commit, the checkout's HEAD,
//        the plan folder's path inside the copy (or null) and an empty file. Start the developer in the copy with
//        GIT_CONFIG_GLOBAL and GIT_CONFIG_SYSTEM set to gitConfig and no other GIT_ variable. On a failure it prints
//        the cause on stderr and leaves no folder. A plan folder inside the checkout lands at the same path, one
//        outside it at .mstack-plan/<folder name>/; only spec.md, plan.md, progress.md, execute-plan.md, phases/**
//        and reviews/** are copied.
// check  prints {"ok":true}, or {"ok":false,"found":[...]} when the copy is no longer what make wrote: its
//        configuration (every key and value), no remote in any form, no hook, no second repository, no borrowed
//        object store, a HEAD that is a commit or an unborn branch. It reads the copy's files before it asks Git.
// diff   runs check, then writes a binary patch from the base to everything in the copy (new files in, ignored
//        files out, an outside plan folder out) to --out, a new file outside the copy, and prints
//        {"ok":true,"out","files"}. Otherwise {"ok":false,"reason"} and no file.
// apply  puts a patch into the checkout's working tree, replacing --previous (the patch of the round before).
//        It never touches the index or the object store, and changes a file only after the whole replacement was
//        worked out beside the repository. An empty --patch file means "no change from the source commit": with
//        --previous it takes that round out again. A patch file inside a copy is refused, and so is a path with
//        "..", an absolute path, a path in .git or below a link, a link that leaves the checkout, and a new file
//        over one Git does not track. Prints {"ok":true} or {"ok":false,"reason"}.
// remove deletes a copy that make created, and nothing else. Prints {"ok":true} or {"ok":false,"reason"}.
// Exit codes: 0 success; 1 refused or failed (see above); 2 usage error.
//
// What the copy does not prevent: a developer that types a remote's address in full can still push to it, because
// the copy shares the machine and its network. The user's credentials (keys, tokens, a credential store) stay
// readable on that machine, so the developer's brief must forbid pushing and the leader reviews every diff.
//
// Git on the user's checkout runs without hooks and without the file-system monitor. Calls that only read or write
// commits, trees and an index of their own also run with an empty global and system configuration. The three calls
// that read or write working-tree files (status, add -u, the last apply) keep the user's configuration, because
// its line-ending and filter settings decide what those files hold. The repository's own configuration is always
// read; a filter there that changes a file on checkout makes make refuse.
import { spawnSync } from 'node:child_process';
import { closeSync, copyFileSync, lstatSync, mkdirSync, mkdtempSync, openSync, readFileSync, readdirSync, readlinkSync, realpathSync, rmSync, statSync, utimesSync, writeFileSync, writeSync } from 'node:fs';
import { devNull, tmpdir } from 'node:os';
import { basename, dirname, isAbsolute, join, parse, relative, resolve, sep } from 'node:path';
import { parseArgs } from 'node:util';

const USAGE = 'usage: dev-copy.mjs make [--cwd <checkout>] [--plan <folder>] | check --copy <dir> | diff --copy <dir> --base <sha> --out <file> [--plan <printed plan>] | apply --checkout <dir> --source <sha> --patch <file> [--previous <file>] | remove --copy <dir>\nThe copy has no remote in its configuration and is checked after each round. It is not a sandbox.';
const OPTIONS = { make: { cwd: 0, plan: 0 }, check: { copy: 1 }, diff: { copy: 1, base: 1, out: 1, plan: 0 }, apply: { checkout: 1, source: 1, patch: 1, previous: 0 }, remove: { copy: 1 } };
const PREFIX = 'mstack-vendors-dev-', MARKER = 'mstack-vendors-copy', EMPTY = 'mstack-empty-config';
const PLAN_FILES = ['spec.md', 'plan.md', 'progress.md', 'execute-plan.md'], PLAN_FOLDERS = ['phases', 'reviews'];
const SHA = /^([0-9a-f]{40}|[0-9a-f]{64})$/;
// Everything a copy's .git/config may hold: what `git init` and make wrote, by key and value.
const BOOL = /^(true|false)$/;
const CONFIG = { 'core.repositoryformatversion': /^[01]$/, 'core.filemode': BOOL, 'core.bare': /^false$/, 'core.logallrefupdates': /^true$/, 'core.ignorecase': BOOL,
  'core.precomposeunicode': BOOL, 'core.symlinks': BOOL, 'extensions.objectformat': /^sha(1|256)$/, 'user.name': /^mstack-vendors$/, 'user.email': /^mstack-vendors@invalid$/ };
// One spelling of a patch whatever the repository's or the user's configuration says.
const DIFF = ['-c', 'diff.noprefix=false', '-c', 'diff.mnemonicPrefix=false', 'diff', '--no-ext-diff', '--no-textconv', '--no-color', '--no-renames', '--no-relative', '--src-prefix=a/', '--dst-prefix=b/'];
const APPLY = ['-c', 'apply.whitespace=nowarn', '-c', 'apply.ignoreWhitespace=no', 'apply', '--whitespace=nowarn'];
// Every Git call on the user's checkout: no hook, no file-system monitor command, no shared index file.
const QUIET = ['-c', `core.hooksPath=${devNull}`, '-c', 'core.fsmonitor=false', '-c', 'core.splitIndex=false'];
const UTF8 = new TextDecoder('utf-8', { fatal: true });
// The variables that tell Git where a repository is; dropped where the user's configuration is kept.
const LOCATION = ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_OBJECT_DIRECTORY', 'GIT_ALTERNATE_OBJECT_DIRECTORIES', 'GIT_COMMON_DIR', 'GIT_NAMESPACE', 'GIT_CEILING_DIRECTORIES', 'GIT_PREFIX'];

class Stop extends Error {}
const stop = (message) => { throw new Stop(message); };
const lst = (path) => lstatSync(path, { throwIfNoEntry: false });
const real = (path) => { try { return realpathSync(path); } catch { return null; } };
const within = (path, dir) => path === dir || path.startsWith(dir.endsWith(sep) ? dir : dir + sep);
const line = (text) => text.replace(/\r?\n$/, '');

function userEnv(extra = {}) {
  return { ...Object.fromEntries(Object.entries(process.env).filter(([k]) => !LOCATION.includes(k.toUpperCase()))), ...extra };
}
// No inherited GIT_ variable, and one file as the global and system configuration.
function cleanEnv(config, extra = {}) {
  return { ...Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^GIT_/i.test(k))), GIT_CONFIG_GLOBAL: config, GIT_CONFIG_SYSTEM: config, ...extra };
}
// Every Git call on a copy reads the copy's own empty file there.
const copyEnv = (copy, extra) => cleanEnv(join(copy, '.git', EMPTY), extra);
// Runs Git with an argument array and stops on every exit code the caller did not name.
function git(cwd, env, args, ok = [0]) {
  const r = spawnSync('git', args, { cwd, env, maxBuffer: 2 ** 30 });
  const shown = args.filter((a, i) => a !== '-c' && args[i - 1] !== '-c').join(' ');
  if (r.error) stop(`git ${shown} did not run: ${r.error.code ?? r.error.message}`);
  if (!ok.includes(r.status)) stop(`git ${shown} failed: ${r.stderr.toString().trim() || `exit ${r.status}`}`);
  // A name in another encoding would be mangled on the way to the file system, so it stops the command instead.
  return { status: r.status, raw: r.stdout, get out() { try { return UTF8.decode(r.stdout); } catch { return stop(`git ${shown} printed a name that is not valid UTF-8, which this script does not handle`); } } };
}
// The top folder of the checkout a folder lies in, or null.
function topOf(dir) {
  if (!dir || !statSync(dir).isDirectory()) return null;
  const r = spawnSync('git', [...QUIET, 'rev-parse', '--show-toplevel'], { cwd: dir, env: cleanEnv(devNull), encoding: 'utf8' });
  return r.status === 0 ? real(line(r.stdout)) : null;
}
// A checkout's own .git folder and, for a linked worktree, the repository's.
function gitFolders(top) {
  const dirs = ['--absolute-git-dir', '--git-common-dir'].map((flag) => real(resolve(top, line(git(top, cleanEnv(devNull), [...QUIET, 'rev-parse', flag]).out))));
  if (dirs.includes(null)) stop(`cannot find the repository folder of ${top}`);
  return dirs;
}
// 'commit', or 'unborn' only when HEAD names a branch that has no ref at all. A HEAD that exists and is no commit stops.
function headOf(copy, env) {
  if (git(copy, env, ['rev-parse', '-q', '--verify', 'HEAD^{commit}'], [0, 1, 128]).status === 0) return 'commit';
  const ref = git(copy, env, ['symbolic-ref', '-q', 'HEAD'], [0, 1, 128]), name = ref.status === 0 ? ref.out.trim() : '';
  const packed = lst(join(copy, '.git', 'packed-refs')) ? readFileSync(join(copy, '.git', 'packed-refs'), 'utf8').split('\n') : [];
  if (/^refs\/heads\/[^.]/.test(name) && !name.includes('..') && !lst(join(copy, '.git', name)) && !packed.some((l) => l.endsWith(` ${name}`))) return 'unborn';
  return stop('HEAD exists and does not resolve to a commit');
}
// path -> "mode sha" for every entry of a tree.
function tree(cwd, env, rev) {
  const entries = new Map();
  for (const e of git(cwd, env, ['ls-tree', '-r', '-z', rev]).out.split('\0')) {
    if (!e) continue;
    const tab = e.indexOf('\t'), [mode, , sha] = e.slice(0, tab).split(' ');
    entries.set(e.slice(tab + 1), `${mode} ${sha}`);
  }
  return entries;
}
const gitlinks = (entries) => [...entries].filter(([, v]) => v.startsWith('160000 ')).map(([p]) => p);
// Where a path leads once every link on the way is followed, also when its end does not exist: links first, then "..".
function lead(path, depth = 0) {
  if (depth > 40) stop(`too many links at ${path}`);
  let at = parse(path).root;
  for (const part of path.slice(at.length).split(sep)) {
    if (!part || part === '.') continue;
    if (part === '..') { at = dirname(at); continue; }
    const next = join(at, part);
    if (!lst(next)?.isSymbolicLink()) { at = next; continue; }
    const to = readlinkSync(next);
    at = lead(isAbsolute(to) ? to : `${at}${sep}${to}`, depth + 1);
  }
  return at;
}
// Makes the folders of a path below base one by one and never walks through a link.
function folder(base, rel) {
  let at = base;
  for (const part of rel.split('/')) {
    if (!part || part === '.') continue;
    at = join(at, part);
    const s = lst(at);
    if (!s) mkdirSync(at);
    else if (!s.isDirectory()) stop(`${at} is in the way of a plan file and is not a folder`);
  }
  return at;
}
function scratchFolder() {
  const tmp = real(tmpdir());
  if (!tmp) stop(`the temporary folder ${tmpdir()} does not exist`);
  return mkdtempSync(join(tmp, 'mstack-vendors-scratch-'));
}

// The plan format's files below a plan folder, each a regular file reached without a link.
function planInputs(from) {
  const files = [];
  const bad = (rel) => stop(`the plan input ${rel} is not a regular file: ${join(from, rel)}`);
  for (const name of PLAN_FILES) {
    const s = lst(join(from, name));
    if (s && !s.isFile()) bad(name);
    if (s) files.push(name);
  }
  const walk = (rel) => {
    for (const name of readdirSync(join(from, rel)).sort()) {
      const below = `${rel}/${name}`, s = lst(join(from, below));
      if (name.toLowerCase() === '.git') stop(`the plan folder holds ${below}, and a copy holds no second repository`);
      if (s?.isDirectory()) walk(below);
      else if (s?.isFile()) files.push(below);
      else bad(below);
    }
  };
  for (const name of PLAN_FOLDERS) {
    const s = lst(join(from, name));
    if (s && !s.isDirectory()) stop(`the plan folder's ${name} is not a folder: ${join(from, name)}`);
    if (s) walk(name);
  }
  return files;
}

function make(o) {
  const top = topOf(real(resolve(o.cwd ?? '.')));
  if (!top) stop(`not a Git checkout: ${resolve(o.cwd ?? '.')}`);
  const plumb = cleanEnv(devNull);
  const gitDirs = gitFolders(top);
  const head = git(top, plumb, [...QUIET, 'rev-parse', '-q', '--verify', 'HEAD^{commit}'], [0, 1]);
  if (head.status !== 0) stop(`the checkout has no commit yet: ${top}`);
  const source = head.out.trim();
  const dirty = git(top, userEnv(), [...QUIET, 'status', '--porcelain', '--untracked-files=no']).out;
  if (dirty.trim()) stop(`the checkout has uncommitted changes to tracked files; commit or stash them first, then run make again:\n${dirty.trimEnd()}`);
  // status does not look at a file with one of these marks, so a change to it would stay behind unseen.
  const hidden = git(top, plumb, [...QUIET, 'ls-files', '-v', '-z']).out.split('\0').filter((e) => e && !e.startsWith('H '));
  if (hidden.length) stop(`the index marks files assume-unchanged or skip-worktree, so status cannot see a change to them; clear the marks (git update-index --no-assume-unchanged --no-skip-worktree <file>) and run make again: ${hidden.map((e) => e.slice(2)).join(', ')}`);
  const wanted = tree(top, plumb, source);
  if (gitlinks(wanted).length) stop(`submodules are not supported: HEAD holds ${gitlinks(wanted).join(', ')}`);

  let plan = null;
  if (o.plan !== undefined) {
    const given = resolve(o.plan), from = real(given);
    if (!from || !statSync(from).isDirectory()) stop(`the plan folder is missing or not a folder: ${given}`);
    if (within(top, from)) stop(`the plan folder is the checkout itself or holds it: ${given}`);
    if (gitDirs.some((d) => within(from, d) || within(d, from))) stop(`the plan folder lies inside .git or holds it: ${given}`);
    const rel = within(from, top) ? relative(top, from).split(sep).join('/') : `.mstack-plan/${basename(from)}`;
    // diff leaves a plan below .mstack-plan/ out, so a tracked path of that name would lose its changes without a word.
    if (rel.startsWith('.mstack-plan/') && [...wanted.keys()].some((p) => p === '.mstack-plan' || p.startsWith('.mstack-plan/'))) {
      stop('HEAD holds a .mstack-plan path, the place a copy keeps a plan folder that Git does not track; rename it or move the plan folder');
    }
    plan = { from, rel, files: planInputs(from) };
  }

  const tmp = real(tmpdir());
  if (!tmp) stop(`the temporary folder ${tmpdir()} does not exist`);
  if ([top, ...gitDirs].some((d) => within(tmp, d))) stop(`the temporary folder ${tmp} lies inside the checkout, and the copy must lie outside it; set TMPDIR to another folder`);
  let copy, scratch;
  try {
    copy = mkdtempSync(join(tmp, PREFIX));
    scratch = scratchFolder();
    // The tracked files of HEAD, through an index of its own: no ignored file, no untracked file, no export-ignore rule.
    const index = cleanEnv(devNull, { GIT_INDEX_FILE: join(scratch, 'index') });
    git(top, index, [...QUIET, 'read-tree', source]);
    git(top, index, [...QUIET, 'checkout-index', '-a', `--prefix=${copy}${sep}`]);
    for (const [path, entry] of wanted) {
      if (entry.startsWith('120000 ') && !within(lead(join(copy, path)), copy)) stop(`${path} is a link that leads outside the copy: ${readlinkSync(join(copy, path))}`);
    }
    const dotGit = join(copy, '.git');
    mkdirSync(dotGit);
    writeFileSync(join(dotGit, EMPTY), '', { flag: 'wx' });
    const cenv = copyEnv(copy);
    const format = git(top, plumb, [...QUIET, 'rev-parse', '--show-object-format']).out.trim();
    // A fresh repository, not a clone: no history, no other branch, no tracking setting, no hook (empty template).
    git(copy, cenv, ['init', '-q', '--template=', '--initial-branch=main', `--object-format=${format}`]);
    git(copy, cenv, ['config', 'user.name', 'mstack-vendors']);
    git(copy, cenv, ['config', 'user.email', 'mstack-vendors@invalid']);
    writeFileSync(join(dotGit, MARKER), '', { flag: 'wx' });
    const planPaths = new Set();
    for (const rel of plan?.files ?? []) {
      const to = join(folder(copy, `${plan.rel}/${dirname(rel)}`), basename(rel));
      if (lst(to) && !lst(to).isFile()) stop(`${to} is in the way of a plan file and is not a regular file`);
      copyFileSync(join(plan.from, rel), to);
      planPaths.add(`${plan.rel}/${rel}`);
    }
    git(copy, cenv, ['add', '-A', '-f']);
    git(copy, cenv, ['commit', '-q', '--no-verify', '--allow-empty', '-m', 'mstack-vendors: the base of the copy']);
    const base = git(copy, cenv, ['rev-parse', 'HEAD']).out.trim();
    const got = tree(copy, cenv, base);
    for (const [path, entry] of wanted) {
      if (got.get(path) !== entry) stop(`the copy of ${path} differs from HEAD in mode or content (a content filter or a line-ending setting changes it on checkout)`);
    }
    for (const path of got.keys()) if (!wanted.has(path) && !planPaths.has(path)) stop(`the copy holds ${path}, which is neither in HEAD nor a plan file`);
    const failed = check(copy);
    if (failed.length) stop(`the new copy fails its own check: ${failed.join('; ')}`);
    return { code: 0, json: { copy, base, source, plan: plan?.rel ?? null, gitConfig: join(dotGit, EMPTY) } };
  } catch (e) {
    if (copy) rmSync(copy, { recursive: true, force: true });
    throw e;
  } finally {
    if (scratch) rmSync(scratch, { recursive: true, force: true });
  }
}

// What a copy's .git/config holds beyond what make wrote. The file is read as text, the way Git writes it: Git itself
// would follow an include, so nothing is asked of Git before this passed.
function configFaults(dotGit) {
  const file = join(dotGit, 'config'), faults = [];
  if (!lst(file)?.isFile()) return ['.git/config is not a regular file of the copy'];
  let section = '';
  for (const text of readFileSync(file, 'utf8').split('\n')) {
    const head = /^\[([a-z]+)\]$/.exec(text), pair = /^\t([A-Za-z]+) = (\S+)$/.exec(text);
    const key = pair && `${section}.${pair[1].toLowerCase()}`;
    if (head) section = head[1];
    else if (pair && !(Object.hasOwn(CONFIG, key) && CONFIG[key].test(pair[2]))) faults.push(`.git/config holds ${key} = ${pair[2]}, which make did not write`);
    else if (!pair && text !== '') faults.push(`.git/config holds a line make did not write: ${text.trim().slice(0, 80)}`);
  }
  if (lst(join(dotGit, 'config.worktree'))) faults.push('.git/config.worktree is a second configuration file');
  return faults;
}

// Everything that makes a copy something else than what make wrote: a way to a remote, a hook, another repository.
function check(given) {
  const copy = real(resolve(given));
  if (!copy || !statSync(copy).isDirectory()) return [`${given} is not a folder`];
  const dotGit = join(copy, '.git'), found = [];
  if (!lst(dotGit)?.isDirectory()) return ['.git is not a folder of the copy: a gitdir: file or a link leads to another repository'];
  // 1. The copy's own files, before Git is asked anything: Git would act on what these hold.
  if (!lst(join(dotGit, MARKER))?.isFile()) found.push(`.git/${MARKER} is missing: this script did not make the folder, or its marker was removed`);
  const empty = lst(join(dotGit, EMPTY));
  if (!empty?.isFile() || empty.size !== 0) found.push(`.git/${EMPTY} is missing or no longer empty`);
  found.push(...configFaults(dotGit));
  if (!lst(join(dotGit, 'HEAD'))?.isFile()) found.push('.git/HEAD is not a regular file of the copy');
  if (!lst(join(dotGit, 'objects'))?.isDirectory()) found.push('.git/objects is not a folder of the copy');
  for (const name of ['alternates', 'http-alternates']) if (lst(join(dotGit, 'objects', 'info', name))) found.push(`.git/objects/info/${name} borrows another object store`);
  for (const name of ['commondir', 'modules']) if (lst(join(dotGit, name))) found.push(`.git/${name} leads to another repository`);
  const holds = (name) => { const s = lst(join(dotGit, name)); return s && !(s.isDirectory() && readdirSync(join(dotGit, name)).length === 0); };
  for (const name of ['remotes', 'branches']) if (holds(name)) found.push(`.git/${name}/ holds a remote in the old file form`);
  if (holds('hooks')) found.push('.git/hooks/ holds a file');
  if (holds('worktrees')) found.push('.git/worktrees/ holds a second working tree');
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, e.name);
      if (path === dotGit) continue;
      if (e.name.toLowerCase() === '.git') found.push(`a second repository: ${relative(copy, path)}`);
      else if (e.isDirectory()) walk(path);
    }
  };
  walk(copy);
  if (found.length) return found;
  // 2. What only Git can say.
  try {
    const env = copyEnv(copy);
    for (const flag of ['--git-dir', '--git-common-dir']) {
      if (real(resolve(copy, line(git(copy, env, ['rev-parse', flag]).out))) !== dotGit) found.push(`git rev-parse ${flag} does not lead to the copy's .git`);
    }
    const remotes = git(copy, env, ['remote']).out.trim();
    if (remotes) found.push(`a remote: ${remotes.split('\n').join(', ')}`);
    if (git(copy, env, ['ls-files', '-s', '-z']).out.split('\0').some((e) => e.startsWith('160000 '))) found.push('a gitlink (submodule) in the index');
    if (headOf(copy, env) === 'commit' && gitlinks(tree(copy, env, 'HEAD')).length) found.push('a gitlink (submodule) in HEAD');
  } catch (e) {
    if (!(e instanceof Stop)) throw e;
    found.push(e.message);
  }
  return found;
}

function diff(o) {
  const found = check(o.copy);
  if (found.length) stop(`the copy fails its check, so no diff is taken: ${found.join('; ')}`);
  const copy = real(resolve(o.copy)), env = copyEnv(copy);
  if (!SHA.test(o.base)) stop(`the base is not a full commit id: ${o.base}`);
  if (git(copy, env, ['cat-file', '-e', `${o.base}^{commit}`], [0, 1, 128]).status !== 0) stop(`the base ${o.base} is not a commit of the copy`);
  // The developer owns every path in the copy, links included, so the patch is written beside it and never over a file.
  const out = resolve(o.out), outDir = real(dirname(out));
  if (!outDir) stop(`the folder of --out does not exist: ${dirname(out)}`);
  if (within(outDir, copy)) stop(`--out lies inside the copy; keep every patch outside it: ${out}`);
  const leaveOut = [];
  if (o.plan?.startsWith('.mstack-plan/')) {
    if (o.plan.split('/').some((part) => part === '..' || part === '')) stop(`--plan is not a path make printed: ${o.plan}`);
    leaveOut.push(`:(top,exclude,literal)${o.plan}`);
  }
  const scratch = scratchFolder();
  try {
    // The tree `git add -A` would stage, in an index of its own that starts as a copy of the copy's index: the
    // developer's own staging (a force-added ignored file) is kept, new files are in, ignored files are out.
    const index = join(scratch, 'index');
    const g = (...args) => git(copy, { ...env, GIT_INDEX_FILE: index }, ['-c', 'core.splitIndex=false', ...args]);
    const from = join(copy, '.git', 'index'), head = headOf(copy, env);
    if (lst(from)?.isFile()) {
      copyFileSync(from, index);
      // Git reads an entry again when it is not older than its index file, so the copy keeps the original's time.
      const time = Math.floor(statSync(from).mtimeMs / 1000);
      utimesSync(index, time, time);
    } else {
      // Never an empty tree: with no index and no commit on the branch, every base file would read as deleted.
      g('read-tree', head === 'commit' ? 'HEAD' : o.base);
    }
    g('add', '-A');
    const now = g('write-tree').out.trim();
    if (gitlinks(tree(copy, env, now)).length) stop('the copy holds a gitlink (submodule)');
    const range = [o.base, now, '--', '.', ...leaveOut];
    const files = git(copy, env, [...DIFF, '--name-only', '-z', ...range]).out.split('\0').filter(Boolean);
    if (!files.length) stop('no changes');
    const patch = git(copy, env, [...DIFF, '--binary', '--full-index', ...range]).raw;
    let fd;
    try { fd = openSync(out, 'wx', 0o600); } catch (e) { stop(`--out must be a new file, and ${out} cannot be created: ${e.code}`); }
    try { for (let at = 0; at < patch.length;) at += writeSync(fd, patch, at); } finally { closeSync(fd); }
    return { code: 0, json: { ok: true, out, files } };
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

// The paths a patch names, old and new.
function patchPaths(top, env, file) {
  const parts = git(top, env, [...QUIET, 'apply', '--numstat', '-z', file]).out.split('\0'), paths = [];
  for (let i = 0; i < parts.length; i++) {
    if (!parts[i]) continue;
    const path = parts[i].split('\t').slice(2).join('\t');
    if (path) paths.push(path); else paths.push(parts[++i] ?? '', parts[++i] ?? '');
  }
  return paths;
}

function apply(o) {
  const given = resolve(o.checkout), top = real(given);
  if (!top || topOf(top) !== top) stop(`--checkout is not the top folder of a Git checkout: ${given}`);
  const plumb = cleanEnv(devNull), gitDirs = gitFolders(top);
  if (!SHA.test(o.source)) stop(`--source is not a full commit id: ${o.source}`);
  const head = git(top, plumb, [...QUIET, 'rev-parse', '-q', '--verify', 'HEAD^{commit}'], [0, 1]).out.trim();
  if (head !== o.source) stop(`the checkout's HEAD is ${head || 'missing'}, not the source commit ${o.source}; the copy was made from another commit`);
  const [patch, previous] = [o.patch, o.previous].map((file) => {
    if (file === undefined) return undefined;
    const at = real(resolve(file));
    if (!at || !statSync(at).isFile()) stop(`not a patch file: ${resolve(file)}`);
    // The developer can change every file of a copy, so a patch kept there is not the one diff wrote.
    for (let dir = dirname(at); dir !== dirname(dir); dir = dirname(dir)) {
      if (basename(dir).startsWith(PREFIX) || lst(join(dir, '.git', MARKER))) stop(`the patch file lies inside a copy; keep every patch outside it: ${at}`);
    }
    return at;
  });
  // An empty patch file is "no change from the source commit": with --previous it takes that round out again.
  const nothing = statSync(patch).size === 0;
  const objects = real(resolve(top, line(git(top, plumb, [...QUIET, 'rev-parse', '--git-path', 'objects']).out)));
  if (!objects) stop(`cannot find the object store of ${top}`);
  const scratch = scratchFolder();
  try {
    // Everything is worked out on an index and an object store beside the repository, which reads the real store
    // and writes nothing into it: until the last step the checkout stays byte for byte as it was.
    mkdirSync(join(scratch, 'objects'));
    const beside = { GIT_INDEX_FILE: join(scratch, 'index'), GIT_OBJECT_DIRECTORY: join(scratch, 'objects'),
      GIT_ALTERNATE_OBJECT_DIRECTORIES: `"${objects.replace(/[\\"]/g, '\\$&')}"` };
    const senv = cleanEnv(devNull, beside), files = userEnv(beside);
    const g = (...args) => git(top, senv, [...QUIET, ...args]);
    const cached = (what, ...args) => { try { g(...APPLY, '--cached', ...args); } catch (e) { if (!(e instanceof Stop)) throw e; stop(`${what}: ${e.message}`); } };
    // The first line of the path checks is this script's own; Git's apply repeats them below.
    for (const file of [previous, nothing ? undefined : patch]) {
      if (!file) continue;
      const bad = patchPaths(top, senv, file).find((p) => isAbsolute(p) || p.split('/').some((part) => part === '..' || part.toLowerCase() === '.git'));
      if (bad !== undefined) stop(`the patch ${file} names a path outside the checkout or inside .git: ${bad}`);
    }
    // 1. The checkout must hold the source commit plus the previous patch, and nothing else in its tracked files.
    g('read-tree', o.source);
    if (previous) cached('the previous patch does not apply to the source commit', previous);
    const expected = g('write-tree').out.trim();
    git(top, files, [...QUIET, 'add', '-u']);
    const actual = g('write-tree').out.trim();
    const sourceTree = tree(top, senv, o.source), expectedTree = tree(top, senv, expected);
    // A file the previous patch deleted is in no index here, so `add -u` cannot see that it came back.
    const off = [...g(...DIFF, '--name-only', '-z', expected, actual).out.split('\0').filter(Boolean),
      ...[...sourceTree.keys()].filter((p) => !expectedTree.has(p) && lst(join(top, p)))];
    if (off.length) stop(`the checkout's tracked files are not the source commit plus the previous patch: ${off.join(', ')}`);
    // 2. The replacement, on the index only: the previous patch out, the new one in.
    g('read-tree', expected);
    if (previous) {
      cached('the previous patch cannot be taken out again', '-R', previous);
      if (g('write-tree').out.trim() !== g('rev-parse', `${o.source}^{tree}`).out.trim()) stop('taking the previous patch out does not give the source commit');
    }
    if (!nothing) cached('the patch does not apply to the source commit', patch);
    const wanted = g('write-tree').out.trim(), wantedTree = tree(top, senv, wanted);
    if (gitlinks(wantedTree).length) stop('the patch adds a gitlink (submodule)');
    // The same rule as for the copy: no link the patch adds or changes may lead out of the checkout, or into .git.
    for (const [path, entry] of wantedTree) {
      if (!entry.startsWith('120000 ') || expectedTree.get(path) === entry) continue;
      const to = line(g('cat-file', 'blob', entry.slice(7)).out);
      const end = lead(isAbsolute(to) ? to : `${dirname(join(top, path))}${sep}${to}`);
      if (!within(end, top) || gitDirs.some((d) => within(end, d))) stop(`the patch makes ${path} a link that leads outside the checkout or into .git: ${to}`);
    }
    // 3. What changes in the working tree: nothing below a link, and no new file over one Git does not track.
    const changes = g(...DIFF, '--name-status', '-z', expected, wanted).out.split('\0');
    for (let i = 0; i + 1 < changes.length; i += 2) {
      const path = changes[i + 1];
      let at = top;
      for (const part of path.split('/').slice(0, -1)) {
        at = join(at, part);
        if (lst(at)?.isSymbolicLink()) stop(`${path} lies below a link, and a patch is never written through one: ${at}`);
      }
      if (changes[i] === 'A' && lst(join(top, path))) stop(`${path} exists in the checkout and Git does not track it; the patch would overwrite it`);
    }
    if (changes.length < 2) return { code: 0, json: { ok: true } };
    // 4. One patch from the old state to the new one, made by Git from the two trees, checked whole and then applied.
    const delta = join(scratch, 'delta.patch');
    writeFileSync(delta, g(...DIFF, '--binary', '--full-index', expected, wanted).raw);
    try { git(top, files, [...QUIET, ...APPLY, '--check', delta]); } catch (e) { if (!(e instanceof Stop)) throw e; stop(`the change does not fit the checkout's files: ${e.message}`); }
    try { git(top, files, [...QUIET, ...APPLY, delta]); } catch (e) { if (!(e instanceof Stop)) throw e; stop(`git apply failed after its check passed, so the checkout MAY BE PARTLY CHANGED; compare it with git status: ${e.message}`); }
    return { code: 0, json: { ok: true } };
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

function remove(o) {
  const copy = resolve(o.copy), tmp = real(tmpdir());
  // Only a real folder directly in the temporary folder, with make's name and make's marker: never a link, never another folder.
  const own = lst(copy)?.isDirectory() && tmp && real(dirname(copy)) === tmp && basename(copy).startsWith(PREFIX)
    && lst(join(copy, '.git'))?.isDirectory() && lst(join(copy, '.git', MARKER))?.isFile();
  if (!own) stop(`not a copy this script made, so it is not deleted: ${copy}`);
  rmSync(copy, { recursive: true });
  return { code: 0, json: { ok: true } };
}

function main() {
  const [command, ...rest] = process.argv.slice(2);
  const usage = (message) => { console.error(`dev-copy: ${message}\n${USAGE}`); return 2; };
  if (!Object.hasOwn(OPTIONS, command ?? '')) return usage(command ? `unknown command: ${command}` : 'no command');
  let o;
  try {
    o = parseArgs({ args: rest, options: Object.fromEntries(Object.keys(OPTIONS[command]).map((k) => [k, { type: 'string' }])), strict: true, allowPositionals: false }).values;
  } catch (e) { return usage(e.message); }
  for (const [name, required] of Object.entries(OPTIONS[command])) {
    if (o[name] === '' || (required && o[name] === undefined)) return usage(`${command} needs --${name} <value>`);
  }
  let result;
  try {
    if (command === 'check') {
      const found = check(o.copy);
      result = found.length ? { code: 1, json: { ok: false, found } } : { code: 0, json: { ok: true } };
    } else result = { make, diff, apply, remove }[command](o);
  } catch (e) {
    // Any failure is a refusal: a file error counts like a stop, so nothing is reported as fine by accident.
    const reason = e instanceof Stop ? e.message : `${e.code ?? e.name}: ${e.message}`;
    if (command === 'make') { console.error(`dev-copy make: ${reason}`); return 1; }
    result = { code: 1, json: command === 'check' ? { ok: false, found: [reason] } : { ok: false, reason } };
  }
  process.stdout.write(`${JSON.stringify(result.json)}\n`);
  return result.code;
}

process.exitCode = main();
