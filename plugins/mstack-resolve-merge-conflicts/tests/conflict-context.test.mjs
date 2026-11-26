// Tests for scripts/conflict-context.mjs against disposable temporary Git repositories.
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, symlinkSync, unlinkSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const script = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../skills/mstack-resolve-merge-conflicts/scripts/conflict-context.mjs',
);

const roots = [];
after(() => {
  for (const r of roots) rmSync(r, { recursive: true, force: true });
});

function tempDir(prefix = 'mstack-conflicts-') {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  roots.push(dir);
  return dir;
}

function git(cwd, args, { allowFail = false, input } = {}) {
  const r = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    input,
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: 'Dev',
      GIT_AUTHOR_EMAIL: 'dev@example.com',
      GIT_COMMITTER_NAME: 'Dev',
      GIT_COMMITTER_EMAIL: 'dev@example.com',
    },
  });
  if (!allowFail && r.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed (${r.status}): ${r.stdout}${r.stderr}`);
  }
  return r;
}

function writeRepoFile(repo, rel, content) {
  const full = join(repo, rel);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
}

function initRepo(files = { 'app.txt': 'line1\nline2\nline3\n' }, message = 'Initial commit') {
  const repo = tempDir();
  git(repo, ['init', '-b', 'main']);
  git(repo, ['config', 'user.name', 'Dev']);
  git(repo, ['config', 'user.email', 'dev@example.com']);
  git(repo, ['config', 'commit.gpgsign', 'false']);
  for (const [rel, content] of Object.entries(files)) writeRepoFile(repo, rel, content);
  git(repo, ['add', '.']);
  git(repo, ['commit', '-m', message]);
  return repo;
}

function runCli(cwd, args = [], extraEnv = null) {
  const r = spawnSync(process.execPath, [script, ...args], {
    cwd,
    encoding: 'utf8',
    env: extraEnv ?? process.env,
  });
  let json = null;
  if (args.includes('--json')) {
    try { json = JSON.parse(r.stdout); } catch { /* left null for assertion diagnostics */ }
  }
  return { status: r.status, stdout: r.stdout, stderr: r.stderr, json };
}

test('Task 1.1: active merge with text and deleted-by-them conflicts reports summary without full file bodies', () => {
  const longBody = Array.from({ length: 60 }, (_, i) => `filler line ${i + 1}`).join('\n');
  const repo = initRepo({
    'service.js': `header\nvalue = 1\n${longBody}\nSENTINEL_FAR_FROM_HUNK\n`,
    'legacy.txt': 'keep me\n',
  }, 'Base service');
  git(repo, ['checkout', '-b', 'feature']);
  writeRepoFile(repo, 'service.js', `header\nvalue = 2\n${longBody}\nSENTINEL_FAR_FROM_HUNK\n`);
  git(repo, ['rm', 'legacy.txt']);
  git(repo, ['commit', '-am', 'Feature: update value and drop legacy']);

  git(repo, ['checkout', 'main']);
  writeRepoFile(repo, 'service.js', `header\nvalue = 3\n${longBody}\nSENTINEL_FAR_FROM_HUNK\n`);
  writeRepoFile(repo, 'legacy.txt', 'keep me with update\n');
  git(repo, ['commit', '-am', 'Main: change value and edit legacy']);

  const mergeRes = git(repo, ['merge', 'feature'], { allowFail: true });
  assert.notEqual(mergeRes.status, 0);

  const textRes = runCli(repo, []);
  assert.equal(textRes.status, 0, textRes.stderr);
  assert.match(textRes.stdout, /operation: merge/);
  assert.match(textRes.stdout, /conflicted files: 2/);
  assert.match(textRes.stdout, /service\.js \| type=text \| stages=1,2,3 \| hunks=1/);
  assert.match(textRes.stdout, /legacy\.txt \| type=deleted-by-them \| stages=1,2 \| hunks=0/);
  assert.match(textRes.stdout, /Main: change value and edit legacy/);
  assert.match(textRes.stdout, /Feature: update value and drop legacy/);
  assert.doesNotMatch(textRes.stdout, /SENTINEL_FAR_FROM_HUNK/);

  const jsonRes = runCli(repo, ['--json']);
  assert.equal(jsonRes.status, 0, jsonRes.stderr);
  assert.equal(jsonRes.json.operation, 'merge');
  assert.equal(jsonRes.json.conflicted_files.length, 2);
  assert.equal(jsonRes.json.commits.ours, 'Main: change value and edit legacy');
  assert.equal(jsonRes.json.commits.theirs, 'Feature: update value and drop legacy');
});

test('Task 1.1: active multi-commit rebase (merge backend and apply backend) reports step k/n', () => {
  for (const backend of ['merge', 'apply']) {
    const repo = initRepo({ 'counter.txt': 'base\n' }, 'Base');
    git(repo, ['checkout', '-b', 'topic']);
    writeRepoFile(repo, 'other.txt', 'clean first\n');
    git(repo, ['add', 'other.txt']);
    git(repo, ['commit', '-m', 'Topic 1: clean']);
    writeRepoFile(repo, 'counter.txt', 'topic-2\n');
    git(repo, ['commit', '-am', 'Topic 2: conflict']);
    writeRepoFile(repo, 'third.txt', 'third\n');
    git(repo, ['add', 'third.txt']);
    git(repo, ['commit', '-m', 'Topic 3: clean']);

    git(repo, ['checkout', 'main']);
    writeRepoFile(repo, 'counter.txt', 'main-change\n');
    git(repo, ['commit', '-am', 'Main: change counter']);

    git(repo, ['checkout', 'topic']);
    const rebaseArgs = backend === 'apply' ? ['rebase', '--apply', 'main'] : ['rebase', 'main'];
    const rb = git(repo, rebaseArgs, { allowFail: true });
    assert.notEqual(rb.status, 0, `${backend} rebase should conflict`);

    const res = runCli(repo, ['--json']);
    assert.equal(res.status, 0, `${backend}: ${res.stderr}`);
    assert.equal(res.json.operation, 'rebase', backend);
    assert.equal(res.json.rebase_step, '2/3', backend);
    assert.equal(res.json.conflicted_files[0].path, 'counter.txt', backend);
  }
});

test('Task 1.1: distinguishes git am, cherry-pick, merge --squash, and stash pop (unknown)', () => {
  // cherry-pick
  const cpRepo = initRepo({ 'a.txt': 'v1\n' });
  git(cpRepo, ['checkout', '-b', 'feat']);
  writeRepoFile(cpRepo, 'a.txt', 'feat\n');
  git(cpRepo, ['commit', '-am', 'Feat edit']);
  const featSha = git(cpRepo, ['rev-parse', 'HEAD']).stdout.trim();
  git(cpRepo, ['checkout', 'main']);
  writeRepoFile(cpRepo, 'a.txt', 'main\n');
  git(cpRepo, ['commit', '-am', 'Main edit']);
  assert.notEqual(git(cpRepo, ['cherry-pick', featSha], { allowFail: true }).status, 0);
  const cpOut = runCli(cpRepo, ['--json']);
  assert.equal(cpOut.status, 0, cpOut.stderr);
  assert.equal(cpOut.json.operation, 'cherry-pick');

  // merge --squash
  const sqRepo = initRepo({ 'a.txt': 'v1\n' });
  git(sqRepo, ['checkout', '-b', 'feat']);
  writeRepoFile(sqRepo, 'a.txt', 'feat\n');
  git(sqRepo, ['commit', '-am', 'Feat edit']);
  git(sqRepo, ['checkout', 'main']);
  writeRepoFile(sqRepo, 'a.txt', 'main\n');
  git(sqRepo, ['commit', '-am', 'Main edit']);
  assert.notEqual(git(sqRepo, ['merge', '--squash', 'feat'], { allowFail: true }).status, 0);
  const sqOut = runCli(sqRepo, ['--json']);
  assert.equal(sqOut.status, 0, sqOut.stderr);
  assert.equal(sqOut.json.operation, 'squash-merge');

  // stash pop -> unknown (never blindly guessed)
  const stRepo = initRepo({ 'a.txt': 'v1\n' });
  writeRepoFile(stRepo, 'a.txt', 'stashed\n');
  git(stRepo, ['stash', 'push', '-m', 'wip']);
  writeRepoFile(stRepo, 'a.txt', 'committed\n');
  git(stRepo, ['commit', '-am', 'Main edit']);
  assert.notEqual(git(stRepo, ['stash', 'pop'], { allowFail: true }).status, 0);
  const stOut = runCli(stRepo, ['--json']);
  assert.equal(stOut.status, 0, stOut.stderr);
  assert.equal(stOut.json.operation, 'unknown');

  // git am -> am (not rebase)
  const amRepo = initRepo({ 'a.txt': 'v1\n' });
  git(amRepo, ['checkout', '-b', 'patch']);
  writeRepoFile(amRepo, 'a.txt', 'patched\n');
  git(amRepo, ['commit', '-am', 'Patch edit']);
  const patchText = git(amRepo, ['format-patch', '-1', '--stdout']).stdout;
  git(amRepo, ['checkout', 'main']);
  writeRepoFile(amRepo, 'a.txt', 'main\n');
  git(amRepo, ['commit', '-am', 'Main edit']);
  assert.notEqual(git(amRepo, ['am', '-3'], { allowFail: true, input: patchText }).status, 0);
  const amOut = runCli(amRepo, ['--json']);
  assert.equal(amOut.status, 0, amOut.stderr);
  assert.equal(amOut.json.operation, 'am');
});

test('Task 1.1: clean repo exits 0 with zero conflicts, and invalid CLI args or non-repo exit 2', () => {
  const repo = initRepo();
  const clean = runCli(repo, []);
  assert.equal(clean.status, 0, clean.stderr);
  assert.match(clean.stdout, /conflicted files: 0/);

  const outside = tempDir('not-git-');
  const outsideRes = runCli(outside, []);
  assert.equal(outsideRes.status, 2);
  assert.match(outsideRes.stderr, /error:/i);

  for (const badArgs of [['--bogus'], ['--context', '-1'], ['--max-lines', '0'], ['--max-lines', 'abc']]) {
    const r = runCli(repo, badArgs);
    assert.equal(r.status, 2, badArgs.join(' '));
    assert.match(r.stderr, /error:/i, badArgs.join(' '));
  }
});

test('Task 1.2: diff3 hunks with --file, --all, --context, --max-lines, and unified diff in text and JSON', () => {
  const ctxLines = ['ctx1', 'ctx2', 'ctx3', 'ctx4'];
  const longOurs = Array.from({ length: 25 }, (_, i) => `ours-line-${i + 1}`);
  const longTheirs = Array.from({ length: 25 }, (_, i) => `theirs-line-${i + 1}`);
  const repo = initRepo({
    'diff3.txt': `${ctxLines.join('\n')}\nbase-val\nafter1\nafter2\nafter3\nafter4\n`,
  });
  git(repo, ['config', 'merge.conflictstyle', 'diff3']);
  git(repo, ['checkout', '-b', 'feat']);
  writeRepoFile(repo, 'diff3.txt', `${ctxLines.join('\n')}\n${longTheirs.join('\n')}\nafter1\nafter2\nafter3\nafter4\n`);
  git(repo, ['commit', '-am', 'Feat long diff3']);
  git(repo, ['checkout', 'main']);
  writeRepoFile(repo, 'diff3.txt', `${ctxLines.join('\n')}\n${longOurs.join('\n')}\nafter1\nafter2\nafter3\nafter4\n`);
  git(repo, ['commit', '-am', 'Main long diff3']);
  assert.notEqual(git(repo, ['merge', 'feat'], { allowFail: true }).status, 0);

  const detail = runCli(repo, ['--file', 'diff3.txt', '--context', '3', '--max-lines', '20']);
  assert.equal(detail.status, 0, detail.stderr);
  assert.match(detail.stdout, /== diff3\.txt ==/);
  assert.match(detail.stdout, /base \(/);
  assert.match(detail.stdout, /base-val/);
  assert.match(detail.stdout, /ctx2/);
  assert.match(detail.stdout, /ctx4/);
  assert.doesNotMatch(detail.stdout, /\bctx1\b/);
  assert.match(detail.stdout, /ours vs theirs diff:/);
  assert.match(detail.stdout, /\.\.\. \(5 more lines omitted\)/);

  const allJson = runCli(repo, ['--all', '--context', '3', '--max-lines', '20', '--json']);
  assert.equal(allJson.status, 0, allJson.stderr);
  const f = allJson.json.conflicted_files[0];
  assert.equal(f.path, 'diff3.txt');
  assert.equal(f.hunks.length, 1);
  assert.deepEqual(f.hunks[0].before_context, ['ctx2', 'ctx3', 'ctx4']);
  assert.deepEqual(f.hunks[0].base, ['base-val']);
  assert.ok(Array.isArray(f.hunks[0].ours_vs_theirs_diff));
  assert.ok(f.hunks[0].ours.some((l) => l.includes('5 more lines omitted')));
});

test('Task 1.2: index-only add/add, deleted-by-them, deleted-by-us, binary, lockfile, linguist-generated, and submodule', () => {
  const repo = initRepo({
    '.gitattributes': 'dist/bundle.js linguist-generated=true\n',
    'package-lock.json': '{"lockfileVersion": 3, "name": "base"}\n',
    'dist/bundle.js': '/* base */\n',
    'del-them.txt': 'line A\nline B\n',
    'del-us.txt': 'keep A\nkeep B\n',
    'icon.bin': Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0x01, 0x02]),
  });
  git(repo, ['checkout', '-b', 'feat']);
  writeRepoFile(repo, 'both-added.txt', 'from feat\n');
  writeRepoFile(repo, 'package-lock.json', '{"lockfileVersion": 3, "name": "feat"}\n');
  writeRepoFile(repo, 'dist/bundle.js', '/* feat */\n');
  git(repo, ['rm', 'del-them.txt']);
  writeRepoFile(repo, 'del-us.txt', 'keep A\nkeep B feat\n');
  writeRepoFile(repo, 'icon.bin', Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0x99, 0x88]));
  git(repo, ['add', '-A']);
  git(repo, ['commit', '-m', 'Feat changes']);

  git(repo, ['checkout', 'main']);
  writeRepoFile(repo, 'both-added.txt', 'from main\n');
  writeRepoFile(repo, 'package-lock.json', '{"lockfileVersion": 3, "name": "main"}\n');
  writeRepoFile(repo, 'dist/bundle.js', '/* main */\n');
  writeRepoFile(repo, 'del-them.txt', 'line A\nline B main\n');
  git(repo, ['rm', 'del-us.txt']);
  writeRepoFile(repo, 'icon.bin', Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0x11, 0x22]));
  git(repo, ['add', '-A']);
  git(repo, ['commit', '-m', 'Main changes']);

  assert.notEqual(git(repo, ['merge', 'feat'], { allowFail: true }).status, 0);
  // Make both-added.txt index-only by removing markers from worktree while keeping stages 2 & 3
  writeRepoFile(repo, 'both-added.txt', 'plain without markers\n');

  const jsonRes = runCli(repo, ['--all', '--json']);
  assert.equal(jsonRes.status, 0, jsonRes.stderr);
  const byPath = new Map(jsonRes.json.conflicted_files.map((x) => [x.path, x]));

  assert.equal(byPath.get('both-added.txt').conflict_type, 'add/add');
  assert.ok(byPath.get('both-added.txt').index_preview.ours.includes('from main'));
  assert.ok(byPath.get('both-added.txt').index_preview.theirs.includes('from feat'));
  assert.ok(byPath.get('both-added.txt').index_preview.ours_vs_theirs_diff.length > 0);

  assert.equal(byPath.get('del-them.txt').conflict_type, 'deleted-by-them');
  assert.ok(byPath.get('del-them.txt').index_preview.ours.includes('line B main'));
  assert.equal(byPath.get('del-them.txt').index_preview.theirs, null);

  assert.equal(byPath.get('del-us.txt').conflict_type, 'deleted-by-us');
  assert.equal(byPath.get('del-us.txt').index_preview.ours, null);
  assert.ok(byPath.get('del-us.txt').index_preview.theirs.includes('keep B feat'));

  assert.equal(byPath.get('icon.bin').conflict_type, 'binary');
  assert.equal(byPath.get('icon.bin').hunks, undefined);

  assert.equal(byPath.get('package-lock.json').generated, true);
  assert.equal(byPath.get('dist/bundle.js').generated, true);

  // Submodule gitlink mode 160000
  const subRepo = initRepo({ 'readme.txt': 'hi\n' });
  const hash1 = '1'.repeat(40);
  const hash2 = '2'.repeat(40);
  const hash3 = '3'.repeat(40);
  git(subRepo, ['update-index', '--index-info'], {
    input: `160000 ${hash1} 1\tlibs/sub\n160000 ${hash2} 2\tlibs/sub\n160000 ${hash3} 3\tlibs/sub\n`,
  });
  const subRes = runCli(subRepo, ['--all', '--json']);
  assert.equal(subRes.status, 0, subRes.stderr);
  assert.equal(subRes.json.conflicted_files[0].conflict_type, 'submodule');
  assert.equal(subRes.json.conflicted_files[0].submodule_commits.ours, hash2);
  assert.equal(subRes.json.conflicted_files[0].submodule_commits.theirs, hash3);
});

test('Task 1.2: handles >1 MiB stage blobs and large hunks without ENOBUFS or LCS hang', () => {
  const bigLine = 'x'.repeat(200);
  const bigBase = Array.from({ length: 6500 }, (_, i) => `b${i} ${bigLine}`).join('\n') + '\n'; // ~1.3 MiB
  const bigOurs = Array.from({ length: 6500 }, (_, i) => `o${i} ${bigLine}`).join('\n') + '\n';
  const bigTheirs = Array.from({ length: 6500 }, (_, i) => `t${i} ${bigLine}`).join('\n') + '\n';

  const repo = initRepo({ 'huge.txt': bigBase });
  git(repo, ['checkout', '-b', 'feat']);
  writeRepoFile(repo, 'huge.txt', bigTheirs);
  git(repo, ['commit', '-am', 'Feat huge']);
  git(repo, ['checkout', 'main']);
  writeRepoFile(repo, 'huge.txt', bigOurs);
  git(repo, ['commit', '-am', 'Main huge']);
  assert.notEqual(git(repo, ['merge', 'feat'], { allowFail: true }).status, 0);

  // Test large hunk LCS bound
  const hunkRes = runCli(repo, ['--file', 'huge.txt', '--max-lines', '10', '--json']);
  assert.equal(hunkRes.status, 0, hunkRes.stderr);
  const diffLines = hunkRes.json.conflicted_files[0].hunks[0].ours_vs_theirs_diff;
  assert.ok(diffLines.some((l) => /omitted/i.test(l)), diffLines.join('\n'));

  // Test >1 MiB index-only stage preview without ENOBUFS
  writeRepoFile(repo, 'huge.txt', 'cleared markers\n');
  const stageRes = runCli(repo, ['--file', 'huge.txt', '--max-lines', '10', '--json']);
  assert.equal(stageRes.status, 0, stageRes.stderr);
  const preview = stageRes.json.conflicted_files[0].index_preview;
  assert.ok(preview.ours.length <= 12);
  assert.ok(preview.ours.some((l) => /omitted|truncated/i.test(l)));
});

test('Task 1.2: handles paths with spaces, CRLF markers, empty/no-trailing-newline files, and rejects invalid --file/--all', () => {
  const repo = initRepo({
    'dir with spaces/file name.txt': 'a\r\nb\r\nc',
    'clean.txt': 'untouched\n',
  });
  git(repo, ['checkout', '-b', 'feat']);
  writeRepoFile(repo, 'dir with spaces/file name.txt', 'a\r\nfeat\r\nc');
  git(repo, ['commit', '-am', 'Feat CRLF']);
  git(repo, ['checkout', 'main']);
  writeRepoFile(repo, 'dir with spaces/file name.txt', 'a\r\nmain\r\nc');
  git(repo, ['commit', '-am', 'Main CRLF']);
  assert.notEqual(git(repo, ['merge', 'feat'], { allowFail: true }).status, 0);

  const ok = runCli(repo, ['--file', 'dir with spaces/file name.txt', '--json']);
  assert.equal(ok.status, 0, ok.stderr);
  assert.equal(ok.json.conflicted_files[0].hunks.length, 1);
  assert.deepEqual(ok.json.conflicted_files[0].hunks[0].ours, ['main']);
  assert.deepEqual(ok.json.conflicted_files[0].hunks[0].theirs, ['feat']);

  assert.equal(runCli(repo, ['--all', '--file', 'dir with spaces/file name.txt']).status, 2);
  const outside = runCli(repo, ['--file', '../outside.txt']);
  assert.equal(outside.status, 2);
  assert.match(outside.stderr, /outside repository/i);
  const nonConflicted = runCli(repo, ['--file', 'clean.txt']);
  assert.equal(nonConflicted.status, 2);
  assert.match(nonConflicted.stderr, /not found|not conflicted/i);
  assert.equal(nonConflicted.stdout, '');
});

test('Task 1.3: detects staged marker-only files, snapshot divergence in both directions, and unborn HEAD additions', () => {
  const marked = 'top\n<<<<<<< HEAD\nours\n=======\ntheirs\n>>>>>>> feat\nbottom\n';
  const repo = initRepo({ 'a.txt': 'clean\n', 'b.txt': 'clean\n', 'docs/example.md': marked });

  // Staged markers with clean worktree (divergence direction 1)
  writeRepoFile(repo, 'a.txt', marked);
  git(repo, ['add', 'a.txt']);
  writeRepoFile(repo, 'a.txt', 'clean worktree edit\n');

  // Worktree markers with clean staged blob (divergence direction 2)
  writeRepoFile(repo, 'b.txt', 'staged clean\n');
  git(repo, ['add', 'b.txt']);
  writeRepoFile(repo, 'b.txt', marked);

  // Untouched docs/example.md has markers but must be ignored!
  const sum = runCli(repo, ['--json']);
  assert.equal(sum.status, 0, sum.stderr);
  const byPath = new Map(sum.json.conflicted_files.map((x) => [x.path, x]));
  assert.equal(byPath.has('docs/example.md'), false, 'untouched doc with markers must be ignored');
  assert.equal(byPath.get('a.txt')?.conflict_type, 'marker-only');
  assert.equal(byPath.get('a.txt')?.source, 'staged');
  assert.equal(byPath.get('b.txt')?.conflict_type, 'marker-only');
  assert.equal(byPath.get('b.txt')?.source, 'worktree');

  const detailA = runCli(repo, ['--file', 'a.txt', '--json']);
  assert.equal(detailA.status, 0, detailA.stderr);
  assert.equal(detailA.json.conflicted_files[0].hunks.length, 1);
  assert.deepEqual(detailA.json.conflicted_files[0].hunks[0].ours, ['ours']);

  const verFail = runCli(repo, ['--verify', '--json']);
  assert.equal(verFail.status, 1, verFail.stdout);
  assert.equal(verFail.json.clean, false);
  assert.equal(verFail.json.marked_files.length, 2);

  // Unborn HEAD (initial commit) with newly staged file holding markers + worktree deletion
  const unborn = tempDir('unborn-');
  git(unborn, ['init', '-b', 'main']);
  writeRepoFile(unborn, 'new.txt', marked);
  git(unborn, ['add', 'new.txt']);
  rmSync(join(unborn, 'new.txt')); // worktree deleted, staged blob still holds markers!
  const unbornRes = runCli(unborn, ['--verify', '--json']);
  assert.equal(unbornRes.status, 1, unbornRes.stdout);
  assert.equal(unbornRes.json.marked_files[0].path, 'new.txt');
  assert.equal(unbornRes.json.marked_files[0].source, 'staged');

  // Staged deletion followed by untracked file with markers is ignored as untracked
  const delRepo = initRepo({ 'gone.txt': 'old\n' });
  git(delRepo, ['rm', 'gone.txt']);
  writeRepoFile(delRepo, 'gone.txt', marked);
  assert.equal(runCli(delRepo, ['--verify']).status, 0);
});

test('Task 1.3: skips modified binaries and Markdown setext ======= headings, flags unterminated/nested markers, and fails --verify on index-only conflicts', () => {
  const repo = initRepo({
    'bin.dat': Buffer.from([0x00, 0x01, 0x02]),
    'unterm.txt': 'ok\n',
    'setext.md': 'Old\n',
    'nested.txt': 'ok\n',
  });
  // Modified binary with ASCII markers -> ignored
  writeRepoFile(repo, 'bin.dat', Buffer.concat([Buffer.from([0x00, 0x01]), Buffer.from('\n<<<<<<< HEAD\n=======\n>>>>>>> feat\n')]));
  // Modified Markdown file with a setext heading underline (lone =======) -> ignored
  writeRepoFile(repo, 'setext.md', 'Heading\n=======\nBody\n');
  assert.equal(runCli(repo, ['--verify']).status, 0);

  // Unterminated opening marker
  writeRepoFile(repo, 'unterm.txt', 'a\n<<<<<<< HEAD\nno end\n');
  // Nested conflict markers
  writeRepoFile(repo, 'nested.txt', '<<<<<<< A\n<<<<<<< B\nx\n=======\ny\n>>>>>>> B\n=======\nz\n>>>>>>> A\n');
  // Orphaned closing and diff3 base markers must fail --verify
  writeRepoFile(repo, 'orphan-end.txt', 'resolved\n>>>>>>> incoming\n');
  writeRepoFile(repo, 'orphan-base.txt', 'resolved\n||||||| base\n');
  git(repo, ['add', 'orphan-end.txt', 'orphan-base.txt']);

  const sum = runCli(repo, ['--json']);
  assert.equal(sum.status, 0, sum.stderr);
  const byPath = new Map(sum.json.conflicted_files.map((x) => [x.path, x]));
  assert.equal(byPath.has('bin.dat'), false);
  assert.equal(byPath.has('setext.md'), false, 'lone ======= in Markdown setext heading must not fail --verify');
  assert.ok(byPath.get('unterm.txt')?.parse_error);
  assert.ok(byPath.get('nested.txt'));
  assert.ok(byPath.get('orphan-end.txt')?.parse_error, 'orphaned >>>>>>> must be flagged');
  assert.ok(byPath.get('orphan-base.txt')?.parse_error, 'orphaned ||||||| must be flagged');

  const ver = runCli(repo, ['--verify', '--json']);
  assert.equal(ver.status, 1);
  assert.equal(ver.json.marked_files.length, 4);

  // Index-only add/add conflict with zero markers still fails --verify independently
  const idxRepo = initRepo({ 'base.txt': 'x\n' });
  git(idxRepo, ['checkout', '-b', 'feat']);
  writeRepoFile(idxRepo, 'only-idx.txt', 'feat\n');
  git(idxRepo, ['add', 'only-idx.txt']);
  git(idxRepo, ['commit', '-m', 'Feat add']);
  git(idxRepo, ['checkout', 'main']);
  writeRepoFile(idxRepo, 'only-idx.txt', 'main\n');
  git(idxRepo, ['add', 'only-idx.txt']);
  git(idxRepo, ['commit', '-m', 'Main add']);
  assert.notEqual(git(idxRepo, ['merge', 'feat'], { allowFail: true }).status, 0);
  writeRepoFile(idxRepo, 'only-idx.txt', 'clean text without markers\n');
  const idxVer = runCli(idxRepo, ['--verify', '--json']);
  assert.equal(idxVer.status, 1);
  assert.deepEqual(idxVer.json.unmerged_files, ['only-idx.txt']);

  // After staging, --verify exits 0
  git(idxRepo, ['add', 'only-idx.txt']);
  const cleanVer = runCli(idxRepo, ['--verify', '--json']);
  assert.equal(cleanVer.status, 0, cleanVer.stdout);
  assert.equal(cleanVer.json.clean, true);

  // --verify combined with --file or --all exits 2
  assert.equal(runCli(idxRepo, ['--verify', '--all']).status, 2);
  assert.equal(runCli(idxRepo, ['--verify', '--file', 'only-idx.txt']).status, 2);
});

test('Task 1.3: strictly read-only (.git/index bytes & mtime unchanged after stat-only touch) and runs with node+git-only PATH', () => {
  const repo = initRepo({ 'file.txt': 'hello\n' });
  // Stat-only timestamp change that plain `git diff` would refresh into .git/index
  const filePath = join(repo, 'file.txt');
  const future = new Date(Date.now() + 60_000);
  utimesSync(filePath, future, future);

  const idxPath = join(repo, '.git', 'index');
  const idxBytesBefore = readFileSync(idxPath);
  const idxMtimeBefore = statSync(idxPath).mtimeMs;

  // Build restricted PATH containing ONLY node and git (no python/python3)
  const restrictedBin = tempDir('node-git-only-');
  const gitBin = execFileSync('which', ['git'], { encoding: 'utf8' }).trim();
  writeFileSync(join(restrictedBin, 'git'), `#!/bin/sh\nexec "${gitBin}" "$@"\n`, { mode: 0o755 });
  const env = { ...process.env, PATH: restrictedBin };

  for (const args of [[], ['--json'], ['--all'], ['--verify']]) {
    const r = runCli(repo, args, env);
    assert.equal(r.status, 0, `${args.join(' ')}: ${r.stderr}`);
  }

  assert.ok(Buffer.compare(readFileSync(idxPath), idxBytesBefore) === 0, '.git/index bytes changed during read-only run');
  assert.equal(statSync(idxPath).mtimeMs, idxMtimeBefore, '.git/index mtime changed during read-only run');
});

test('Review fixes: staged rename/typechange, >1 MiB staged markers, stat-dirty untouched doc, and marker-only parse-error context', () => {
  // M1: staged rename with markers must fail --verify
  const renRepo = initRepo({
    'orig.txt': Array.from({ length: 20 }, (_, i) => `line ${i + 1}`).join('\n') + '\n',
    'docs/example.md': '<<<<<<< HEAD\na\n=======\nb\n>>>>>>> feat\n',
  });
  // M4: stat-only touch on untouched doc with example markers must NOT trigger false marker-only hit
  const docPath = join(renRepo, 'docs', 'example.md');
  const future = new Date(Date.now() + 60_000);
  utimesSync(docPath, future, future);
  const idxBefore = readFileSync(join(renRepo, '.git', 'index'));
  const statClean = runCli(renRepo, ['--verify', '--json']);
  assert.equal(statClean.status, 0, `stat-dirty untouched doc should be clean: ${statClean.stdout}`);
  assert.equal(statClean.json.clean, true);
  assert.equal(Buffer.compare(readFileSync(join(renRepo, '.git', 'index')), idxBefore), 0);

  // Staged git mv + markers
  git(renRepo, ['mv', 'orig.txt', 'renamed.txt']);
  const renamedContent = readFileSync(join(renRepo, 'renamed.txt'), 'utf8') + '<<<<<<< HEAD\nours\n=======\ntheirs\n>>>>>>> feat\n';
  writeRepoFile(renRepo, 'renamed.txt', renamedContent);
  git(renRepo, ['add', 'renamed.txt']);
  const renVer = runCli(renRepo, ['--verify', '--json']);
  assert.equal(renVer.status, 1, `staged rename with markers must fail --verify: ${renVer.stdout}`);
  assert.equal(renVer.json.marked_files.some((m) => m.path === 'renamed.txt'), true);

  // M2: staged file > 1 MiB with markers past byte 1,048,576 must fail --verify
  const bigRepo = initRepo({ 'large.txt': 'start\n' });
  const pad = 'x'.repeat(100) + '\n';
  const bigContent = pad.repeat(11_000) + '<<<<<<< HEAD\nlate ours\n=======\nlate theirs\n>>>>>>> feat\n';
  assert.ok(Buffer.byteLength(bigContent) > 1024 * 1024);
  writeRepoFile(bigRepo, 'large.txt', bigContent);
  git(bigRepo, ['add', 'large.txt']);
  const bigVer = runCli(bigRepo, ['--verify', '--json']);
  assert.equal(bigVer.status, 1, `>1 MiB staged file with late markers must fail --verify: ${bigVer.stdout}`);
  assert.equal(bigVer.json.marked_files[0].path, 'large.txt');

  // M6: marker-only file with parse_error and 0 hunks shows parse-error context instead of empty index preview
  const untermRepo = initRepo({ 'broken.txt': 'top\n' });
  writeRepoFile(untermRepo, 'broken.txt', 'before\n<<<<<<< HEAD\nonly ours\n');
  git(untermRepo, ['add', 'broken.txt']);
  const detText = runCli(untermRepo, ['--file', 'broken.txt']);
  assert.equal(detText.status, 0, detText.stderr);
  assert.match(detText.stdout, /parse-error:/);
  assert.match(detText.stdout, /<<<<<<< HEAD/);
  assert.doesNotMatch(detText.stdout, /index preview:/);
  const detJson = runCli(untermRepo, ['--file', 'broken.txt', '--json']);
  assert.equal(detJson.status, 0, detJson.stderr);
  assert.ok(Array.isArray(detJson.json.conflicted_files[0].parse_error_context));
  assert.equal(detJson.json.conflicted_files[0].index_preview, undefined);
});

test('Review fixes: symlinks not followed outside repo, POSIX backslash filenames, conflict-marker-size, fsmonitor disabled, git errors propagated, and piped large JSON', () => {
  // M8: tracked symlink pointing outside repo must NOT be followed or leaked
  if (process.platform !== 'win32') {
    const outsideDir = tempDir('outside-secret-');
    const outsideFile = join(outsideDir, 'secret.txt');
    writeFileSync(outsideFile, '<<<<<<< HEAD\nSECRET_OURS\n=======\nSECRET_THEIRS\n>>>>>>> feat\n');

    const symRepo = initRepo({ 'target.txt': 'safe\n' });
    symlinkSync('target.txt', join(symRepo, 'link.txt'));
    git(symRepo, ['add', 'link.txt']);
    git(symRepo, ['commit', '-m', 'Add tracked symlink']);
    unlinkSync(join(symRepo, 'link.txt'));
    symlinkSync(outsideFile, join(symRepo, 'link.txt'));
    const symAll = runCli(symRepo, ['--all', '--json']);
    assert.equal(symAll.status, 0, symAll.stderr);
    assert.equal(symAll.json.conflicted_files.length, 0, `symlink target must not be scanned: ${symAll.stdout}`);
    assert.doesNotMatch(symAll.stdout, /SECRET_OURS/);

    // Typechange symlink -> regular file with markers MUST be caught by --verify (M1 + M8)
    unlinkSync(join(symRepo, 'link.txt'));
    writeRepoFile(symRepo, 'link.txt', '<<<<<<< HEAD\nours\n=======\ntheirs\n>>>>>>> feat\n');
    git(symRepo, ['add', 'link.txt']);
    const tcVer = runCli(symRepo, ['--verify', '--json']);
    assert.equal(tcVer.status, 1, `typechange symlink->file with markers must fail --verify: ${tcVer.stdout}`);
    assert.equal(tcVer.json.marked_files[0].path, 'link.txt');

    // M5: literal backslash in POSIX filename
    const bsRepo = initRepo({ 'init.txt': 'ok\n' });
    writeRepoFile(bsRepo, 'dir\\file.txt', '<<<<<<< HEAD\na\n=======\nb\n>>>>>>> feat\n');
    git(bsRepo, ['add', 'dir\\file.txt']);
    const bsVer = runCli(bsRepo, ['--verify', '--json']);
    assert.equal(bsVer.status, 1, `POSIX backslash filename with staged markers must fail --verify: ${bsVer.stdout}`);
    assert.equal(bsVer.json.marked_files[0].path, 'dir\\file.txt');
  }

  // M11: .gitattributes conflict-marker-size=12
  const widthRepo = initRepo({
    '.gitattributes': '*.txt conflict-marker-size=12\n',
    'wide.txt': 'base\n',
  });
  git(widthRepo, ['checkout', '-b', 'feat']);
  writeRepoFile(widthRepo, 'wide.txt', 'feat\n');
  git(widthRepo, ['add', 'wide.txt']);
  git(widthRepo, ['commit', '-m', 'Feat wide']);
  git(widthRepo, ['checkout', 'main']);
  writeRepoFile(widthRepo, 'wide.txt', 'main\n');
  git(widthRepo, ['add', 'wide.txt']);
  git(widthRepo, ['commit', '-m', 'Main wide']);
  assert.notEqual(git(widthRepo, ['merge', 'feat'], { allowFail: true }).status, 0);
  const wSum = runCli(widthRepo, ['--json']);
  assert.equal(wSum.status, 0, wSum.stderr);
  assert.equal(wSum.json.conflicted_files[0].conflict_type, 'text');
  assert.equal(wSum.json.conflicted_files[0].marker_hunks, 1);
  git(widthRepo, ['add', 'wide.txt']);
  const wVer = runCli(widthRepo, ['--verify', '--json']);
  assert.equal(wVer.status, 1, `staged 12-char markers must fail --verify: ${wVer.stdout}`);
  assert.equal(wVer.json.marked_files[0].path, 'wide.txt');

  // M10: configured core.fsmonitor must NOT be executed during inspection
  if (process.platform !== 'win32') {
    const fsmRepo = initRepo({ 'a.txt': 'hello\n' });
    const markerFile = join(fsmRepo, '.git', 'fsmonitor-ran');
    const hookBin = join(tempDir('fsm-'), 'fsm.sh');
    writeFileSync(hookBin, `#!/bin/sh\necho ran > "${markerFile}"\nexit 0\n`, { mode: 0o755 });
    git(fsmRepo, ['config', 'core.fsmonitor', hookBin]);
    const r = runCli(fsmRepo, ['--verify']);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(statSync(markerFile, { throwIfNoEntry: false }), undefined, 'core.fsmonitor must not be invoked');
  }

  // M9: failed git diff during --verify must exit 2, never clean (0)
  if (process.platform !== 'win32') {
    const errRepo = initRepo({ 'a.txt': 'hello\n' });
    const fakeBin = tempDir('fake-git-');
    const realGit = execFileSync('which', ['git'], { encoding: 'utf8' }).trim();
    writeFileSync(
      join(fakeBin, 'git'),
      `#!/bin/sh\nfor a in "$@"; do\n  if [ "$a" = "--cached" ]; then echo "simulated diff failure" >&2; exit 128; fi\ndone\nexec "${realGit}" "$@"\n`,
      { mode: 0o755 },
    );
    const errVer = runCli(errRepo, ['--verify', '--json'], { ...process.env, PATH: `${fakeBin}:${process.env.PATH}` });
    assert.equal(errVer.status, 2, `failed git diff must exit 2, got ${errVer.status}: ${errVer.stdout} ${errVer.stderr}`);
  }

  // M12: large piped --all --json must drain completely without truncation
  const pipeRepo = initRepo({ 'huge-line.txt': 'base\n' });
  const hugeLine = 'A'.repeat(250_000);
  writeRepoFile(pipeRepo, 'huge-line.txt', `<<<<<<< HEAD\n${hugeLine}\n=======\n${hugeLine}B\n>>>>>>> feat\n`);
  git(pipeRepo, ['add', 'huge-line.txt']);
  const pipeRes = spawnSync(process.execPath, [script, '--repo', pipeRepo, '--all', '--json'], {
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
  assert.equal(pipeRes.status, 0, pipeRes.stderr);
  const parsedPipe = JSON.parse(pipeRes.stdout);
  assert.equal(parsedPipe.conflicted_files.length, 1);
  assert.equal(parsedPipe.conflicted_files[0].hunks[0].ours[0].length, 250_000);
});
