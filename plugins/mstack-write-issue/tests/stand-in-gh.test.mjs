// Tests for the stand-in gh that the eval cases put first on the path, so no test session reaches a real tracker.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const gh = resolve(dirname(fileURLToPath(import.meta.url)), '../skills/mstack-write-issue/evals/_fixture/bin/gh');
const repo = 'example--org/shop';

function tracker({ templates = false, labels = 3 } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'stand-in-gh-'));
  writeFileSync(join(dir, 'issues.json'), JSON.stringify([
    { number: 12, title: 'Upload retry times out', state: 'OPEN', stateReason: '', body: 'The retry test hangs.', comments: [{ body: 'Seen again.' }], url: `https://github.com/${repo}/issues/12` },
    { number: 7, title: 'Export drops the header', state: 'CLOSED', stateReason: 'COMPLETED', body: 'CSV export has no header row.', comments: [], url: `https://github.com/${repo}/issues/7` },
  ]));
  writeFileSync(join(dir, 'labels.json'), JSON.stringify(Array.from({ length: labels }, (_, i) => ({ name: `label-${i}` }))));
  if (templates) {
    mkdirSync(join(dir, 'templates'));
    writeFileSync(join(dir, 'templates', 'bug.yml'), 'name: Bug\n');
  }
  const run = (...args) => {
    const r = spawnSync(gh, args, { cwd: dir, env: { ...process.env, FAKE_GH_DIR: dir }, encoding: 'utf8' });
    return { ...r, json: () => JSON.parse(r.stdout) };
  };
  const log = () => readFileSync(join(dir, 'calls.log'), 'utf8').trim().split('\n');
  return { dir, run, log };
}

test('issue list searches open and closed issues only with --state all', () => {
  const t = tracker();
  const all = t.run('issue', 'list', '--repo', repo, '--search', 'export header', '--state', 'all', '--json', 'number,title,state,url');
  assert.equal(all.status, 0, all.stderr);
  assert.deepEqual(all.json().map((i) => i.number), [7]);
  const open = t.run('issue', 'list', '--repo', repo, '--search', 'export header', '--json', 'number,title,state,url');
  assert.deepEqual(open.json(), []);
});

test('issue list returns only the fields named in --json', () => {
  const t = tracker();
  const r = t.run('issue', 'list', '--repo', repo, '--state', 'all', '--json', 'number,title');
  assert.deepEqual(r.json().map((i) => Object.keys(i).sort()), [['number', 'title'], ['number', 'title']]);
});

test('label list honours its default limit of 30 and a higher one', () => {
  const t = tracker({ labels: 40 });
  assert.equal(t.run('label', 'list', '--repo', repo, '--json', 'name').json().length, 30);
  assert.equal(t.run('label', 'list', '--repo', repo, '--limit', '300', '--json', 'name').json().length, 40);
});

test('api lists the template folder, returns a file, and answers Not Found without templates', () => {
  const none = tracker().run('api', `repos/${repo}/contents/.github/ISSUE_TEMPLATE`);
  assert.equal(none.status, 1);
  assert.match(none.stderr, /Not Found/);
  const t = tracker({ templates: true });
  assert.equal(t.run('api', `repos/${repo}/contents/.github/ISSUE_TEMPLATE`, '--jq', '.[].name').stdout.trim(), 'bug.yml');
  const file = t.run('api', `repos/${repo}/contents/.github/ISSUE_TEMPLATE/bug.yml`, '--jq', '.content');
  assert.equal(Buffer.from(file.stdout, 'base64').toString(), 'name: Bug\n');
});

test('repo view names the made-up repository and its default branch', () => {
  const r = tracker().run('repo', 'view', repo, '--json', 'nameWithOwner,defaultBranchRef');
  assert.deepEqual(r.json(), { nameWithOwner: repo, defaultBranchRef: { name: 'main' } });
});

test('issue create saves what was posted, and issue view serves it', () => {
  const t = tracker();
  writeFileSync(join(t.dir, 'body.md'), 'The body.\n');
  const created = t.run('issue', 'create', '--repo', repo, '--title', 'T', '--label', 'label-0', '--label', 'label-1', '--body-file', join(t.dir, 'body.md'));
  assert.equal(created.stdout.trim(), `https://github.com/${repo}/issues/900`);
  assert.match(t.log().at(-1), /issue\tcreate\t.*\tT\t/);
  const seen = t.run('issue', 'view', '900', '--repo', repo, '--json', 'title,body,labels').json();
  assert.deepEqual(seen, { title: 'T', body: 'The body.\n', labels: [{ name: 'label-0' }, { name: 'label-1' }] });
});

test('issue comment appends the text, and issue view serves it', () => {
  const t = tracker();
  writeFileSync(join(t.dir, 'c.md'), 'New counts.\n');
  const posted = t.run('issue', 'comment', '12', '--repo', repo, '--body-file', join(t.dir, 'c.md'));
  assert.equal(posted.stdout.trim(), `https://github.com/${repo}/issues/12#issuecomment-2`);
  const comments = t.run('issue', 'view', '12', '--repo', repo, '--json', 'comments').json().comments;
  assert.equal(comments.at(-1).body, 'New counts.\n');
});

test('issue create with a label the repository does not have fails and creates nothing', () => {
  const t = tracker();
  writeFileSync(join(t.dir, 'body.md'), 'x\n');
  const r = t.run('issue', 'create', '--repo', repo, '--title', 'T', '--label', 'no-such-label', '--body-file', join(t.dir, 'body.md'));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /could not add label: 'no-such-label' not found/);
  assert.equal(t.run('issue', 'view', '900', '--repo', repo).status, 1);
});

test('an argument with a line break or a tab stays on one log line', () => {
  const t = tracker();
  t.run('issue', 'list', '--repo', repo, '--search', 'two\nlines\tand a tab');
  assert.deepEqual(t.log(), [`issue\tlist\t--repo\t${repo}\t--search\ttwo\\nlines\\tand a tab`]);
});

test('another repository, a missing issue and an unknown sub-command are refused', () => {
  const t = tracker();
  const other = t.run('issue', 'list', '--repo', 'other/repo');
  assert.equal(other.status, 1);
  assert.match(other.stderr, /wrong repository/);
  assert.equal(t.run('issue', 'view', '5', '--repo', repo).status, 1);
  const unknown = t.run('pr', 'list');
  assert.equal(unknown.status, 1);
  assert.match(unknown.stderr, /unsupported/);
});

test('every call is one line in calls.log', () => {
  const t = tracker();
  t.run('auth', 'status');
  t.run('issue', 'list', '--repo', repo);
  t.run('pr', 'list');
  assert.deepEqual(t.log(), ['auth\tstatus', `issue\tlist\t--repo\t${repo}`, 'pr\tlist']);
});
