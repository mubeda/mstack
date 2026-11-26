#!/usr/bin/env node
// Read-only Git conflict context extractor and verifier for mstack-resolve-merge-conflicts.
// Adapted in concept from warpdotdev/common-skills (MIT); rewritten in zero-dependency Node.js 18+.
// Usage:
//   node conflict-context.mjs [--repo <dir>] [--file <path>...] [--all] [--verify]
//                             [--json] [--context <N>] [--max-lines <N>]
import { spawnSync } from 'node:child_process';
import { existsSync, lstatSync, readFileSync } from 'node:fs';
import { basename, isAbsolute, join, relative, resolve } from 'node:path';

const LOCKFILES = new Set([
  'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lock', 'bun.lockb',
  'Cargo.lock', 'poetry.lock', 'uv.lock', 'Pipfile.lock', 'Gemfile.lock',
  'go.sum', 'composer.lock', 'Podfile.lock', 'Package.resolved', 'flake.lock',
]);

const MAX_PREVIEW_BYTES = 1024 * 1024; // 1 MiB preview slice cap
const MAX_HARD_READ_BYTES = 32 * 1024 * 1024; // 32 MiB safety cap before refusing full read
const MAX_LCS_PAIRS = 2_000_000;
const GIT_ENV = { ...process.env, GIT_OPTIONAL_LOCKS: '0' };
const MARKER_REGEX_CACHE = new Map();

function getMarkerRegexes(size = 7) {
  const width = Number.isInteger(size) && size > 0 ? size : 7;
  let cached = MARKER_REGEX_CACHE.get(width);
  if (!cached) {
    cached = {
      start: new RegExp(`^<{${width}}(?: (.*))?$`),
      base: new RegExp(`^\\|{${width}}(?: (.*))?$`),
      sep: new RegExp(`^={${width}}$`),
      end: new RegExp(`^>{${width}}(?: (.*))?$`),
    };
    MARKER_REGEX_CACHE.set(width, cached);
  }
  return cached;
}

function runGit(repoRoot, args, { allowFail = false, encoding = 'utf8', maxBuffer = 16 * 1024 * 1024 } = {}) {
  const fullArgs = ['-c', 'diff.autoRefreshIndex=false', '-c', 'core.fsmonitor=false', '-C', repoRoot, ...args];
  const r = spawnSync('git', fullArgs, { encoding, env: GIT_ENV, maxBuffer });
  if (r.error) throw new Error(`git ${args[0] ?? ''} failed: ${r.error.message}`);
  if (!allowFail && r.status !== 0) {
    const errText = encoding === 'buffer'
      ? (r.stderr?.toString('utf8') || r.stdout?.toString('utf8') || '').trim()
      : (r.stderr || r.stdout || '').trim();
    throw new Error(`git ${args.join(' ')} failed: ${errText || `exit ${r.status}`}`);
  }
  return r;
}

function parseArgs(argv) {
  const opts = { repo: '.', files: [], all: false, verify: false, json: false, context: 2, maxLines: 40 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      if (i + 1 >= argv.length) throw new Error(`missing value for ${a}`);
      return argv[++i];
    };
    if (a === '--repo') opts.repo = next();
    else if (a.startsWith('--repo=')) opts.repo = a.slice(7);
    else if (a === '--file') opts.files.push(next());
    else if (a.startsWith('--file=')) opts.files.push(a.slice(7));
    else if (a === '--all') opts.all = true;
    else if (a === '--verify') opts.verify = true;
    else if (a === '--json') opts.json = true;
    else if (a === '--context' || a.startsWith('--context=')) {
      const raw = a === '--context' ? next() : a.slice(10);
      if (!/^-?\d+$/.test(raw) || Number(raw) < 0) throw new Error('--context must be a non-negative integer');
      opts.context = Number(raw);
    } else if (a === '--max-lines' || a.startsWith('--max-lines=')) {
      const raw = a === '--max-lines' ? next() : a.slice(12);
      if (!/^-?\d+$/.test(raw) || Number(raw) <= 0) throw new Error('--max-lines must be a positive integer');
      opts.maxLines = Number(raw);
    } else {
      throw new Error(`unknown option: ${a}`);
    }
  }
  if (opts.all && opts.files.length) throw new Error('--all cannot be combined with --file');
  if (opts.verify && (opts.all || opts.files.length)) throw new Error('--verify cannot be combined with --all or --file');
  return opts;
}

function findRepoInfo(startDir) {
  const abs = resolve(startDir);
  if (!existsSync(abs)) throw new Error(`path does not exist: ${startDir}`);
  const top = runGit(abs, ['rev-parse', '--show-toplevel'], { allowFail: true });
  if (top.status !== 0) throw new Error((top.stderr || top.stdout || 'not a git repository').trim());
  const repoRoot = resolve(top.stdout.trim());
  const gd = runGit(repoRoot, ['rev-parse', '--git-dir']);
  const rawGitDir = gd.stdout.trim();
  const gitDir = isAbsolute(rawGitDir) ? rawGitDir : resolve(repoRoot, rawGitDir);
  return { repoRoot, gitDir };
}

function normalizeRepoPath(repoRoot, rawPath) {
  const candidate = isAbsolute(rawPath) ? resolve(rawPath) : resolve(repoRoot, rawPath);
  const rel = relative(repoRoot, candidate);
  if (!rel || rel === '..' || rel.startsWith('../') || rel.startsWith('..\\') || isAbsolute(rel)) {
    throw new Error(`path is outside repository: ${rawPath}`);
  }
  return process.platform === 'win32' ? rel.replace(/\\/g, '/') : rel;
}

function readTrim(filePath) {
  try { return readFileSync(filePath, 'utf8').trim(); } catch { return ''; }
}

function detectOperation(gitDir, hasUnmerged) {
  const rebaseMerge = join(gitDir, 'rebase-merge');
  if (existsSync(rebaseMerge)) {
    const cur = readTrim(join(rebaseMerge, 'msgnum'));
    const end = readTrim(join(rebaseMerge, 'end'));
    return { operation: 'rebase', rebaseStep: cur && end ? `${cur}/${end}` : null };
  }
  const rebaseApply = join(gitDir, 'rebase-apply');
  if (existsSync(rebaseApply)) {
    const cur = readTrim(join(rebaseApply, 'next'));
    const end = readTrim(join(rebaseApply, 'last'));
    if (existsSync(join(rebaseApply, 'applying'))) {
      return { operation: 'am', rebaseStep: cur && end ? `${cur}/${end}` : null };
    }
    return { operation: 'rebase', rebaseStep: cur && end ? `${cur}/${end}` : null };
  }
  if (existsSync(join(gitDir, 'MERGE_HEAD'))) return { operation: 'merge', rebaseStep: null };
  if (existsSync(join(gitDir, 'CHERRY_PICK_HEAD'))) return { operation: 'cherry-pick', rebaseStep: null };
  if (existsSync(join(gitDir, 'REVERT_HEAD'))) return { operation: 'revert', rebaseStep: null };
  if (hasUnmerged && existsSync(join(gitDir, 'SQUASH_MSG'))) return { operation: 'squash-merge', rebaseStep: null };
  if (hasUnmerged) return { operation: 'unknown', rebaseStep: null };
  return { operation: 'none', rebaseStep: null };
}

function commitSubject(repoRoot, ref) {
  const r = runGit(repoRoot, ['log', '-1', '--format=%s', ref], { allowFail: true });
  return r.status === 0 ? r.stdout.trim() || null : null;
}

function getCommitSubjects(repoRoot, gitDir, operation) {
  const ours = commitSubject(repoRoot, 'HEAD');
  let theirs = null;
  if (operation === 'merge') theirs = commitSubject(repoRoot, 'MERGE_HEAD');
  else if (operation === 'cherry-pick') theirs = commitSubject(repoRoot, 'CHERRY_PICK_HEAD');
  else if (operation === 'revert') theirs = commitSubject(repoRoot, 'REVERT_HEAD');
  else if (operation === 'rebase') {
    theirs = commitSubject(repoRoot, 'REBASE_HEAD')
      || readTrim(join(gitDir, 'rebase-merge', 'message')).split(/\r?\n/)[0]
      || readTrim(join(gitDir, 'rebase-apply', 'msg')).split(/\r?\n/)[0]
      || null;
  } else if (operation === 'am') {
    theirs = readTrim(join(gitDir, 'rebase-apply', 'msg')).split(/\r?\n/)[0] || null;
  }
  return { ours, theirs };
}

function getUnmergedEntries(repoRoot) {
  const entries = new Map();
  const out = runGit(repoRoot, ['ls-files', '-u', '-z']).stdout;
  for (const record of out.split('\0')) {
    if (!record) continue;
    const tab = record.indexOf('\t');
    if (tab < 0) continue;
    const [mode, objectId, stageText] = record.slice(0, tab).split(' ');
    const filePath = record.slice(tab + 1);
    let stages = entries.get(filePath);
    if (!stages) { stages = {}; entries.set(filePath, stages); }
    stages[Number(stageText)] = { mode, objectId };
  }
  return entries;
}

function getPathAttrs(repoRoot, relPath) {
  let generated = LOCKFILES.has(basename(relPath));
  let markerSize = 7;
  const r = runGit(repoRoot, ['check-attr', '-z', 'linguist-generated', 'conflict-marker-size', '--', relPath], { allowFail: true });
  if (r.status === 0 && r.stdout) {
    const parts = r.stdout.split('\0');
    for (let i = 0; i + 2 < parts.length; i += 3) {
      const attr = parts[i + 1];
      const val = parts[i + 2];
      if (attr === 'linguist-generated' && val === 'true') generated = true;
      if (attr === 'conflict-marker-size' && /^\d+$/.test(val) && Number(val) > 0) {
        markerSize = Number(val);
      }
    }
  }
  return { generated, markerSize };
}

function bufferToLines(buf) {
  if (buf.subarray(0, 8192).includes(0) || buf.includes(0)) return { binary: true, lines: null };
  const text = buf.toString('utf8');
  if (text.length === 0) return { binary: false, lines: [] };
  const normalized = text.replace(/\r\n/g, '\n');
  const lines = normalized.endsWith('\n') ? normalized.slice(0, -1).split('\n') : normalized.split('\n');
  return { binary: false, lines };
}

function readWorktreeLines(fullPath, { enforceMaxRead = false, relPath = fullPath } = {}) {
  let st;
  try { st = lstatSync(fullPath); } catch { return { present: false, binary: false, lines: null, symlink: false }; }
  if (st.isSymbolicLink()) return { present: false, binary: false, lines: null, symlink: true };
  if (!st.isFile()) return { present: false, binary: false, lines: null, symlink: false };
  if (enforceMaxRead && st.size > MAX_HARD_READ_BYTES) {
    throw new Error(`worktree file exceeds ${MAX_HARD_READ_BYTES} byte scan limit (${st.size} bytes): ${relPath}`);
  }
  const buf = readFileSync(fullPath);
  const decoded = bufferToLines(buf);
  return { present: true, binary: decoded.binary, lines: decoded.lines, symlink: false };
}

function readStageObject(repoRoot, objectId) {
  const sizeRes = runGit(repoRoot, ['cat-file', '-s', objectId], { allowFail: true });
  if (sizeRes.status !== 0) return { present: false, binary: false, lines: null, truncatedBytes: false, size: 0 };
  const size = Number(sizeRes.stdout.trim());
  if (Number.isNaN(size)) throw new Error(`could not determine blob size for ${objectId}`);
  if (size > MAX_HARD_READ_BYTES) {
    return {
      present: true,
      binary: false,
      lines: [`(stage blob exceeds ${MAX_HARD_READ_BYTES} byte read limit; total ${size} bytes)`],
      truncatedBytes: true,
      size,
    };
  }
  const r = runGit(repoRoot, ['cat-file', 'blob', objectId], {
    allowFail: true,
    encoding: 'buffer',
    maxBuffer: size + 65536,
  });
  if (r.status !== 0 || !r.stdout) return { present: false, binary: false, lines: null, truncatedBytes: false, size };
  const raw = r.stdout;
  if (raw.subarray(0, 8192).includes(0)) return { present: true, binary: true, lines: null, truncatedBytes: false, size };
  const truncatedBytes = raw.length > MAX_PREVIEW_BYTES;
  const slice = truncatedBytes ? raw.subarray(0, MAX_PREVIEW_BYTES) : raw;
  const decoded = bufferToLines(slice);
  if (decoded.binary) return { present: true, binary: true, lines: null, truncatedBytes: false, size };
  return { present: true, binary: false, lines: decoded.lines, truncatedBytes, size };
}

function readStageBlobForScan(repoRoot, objectId, relPath) {
  const sizeRes = runGit(repoRoot, ['cat-file', '-s', objectId]);
  const size = Number(sizeRes.stdout.trim());
  if (Number.isNaN(size)) throw new Error(`could not determine staged blob size for ${relPath}`);
  if (size > MAX_HARD_READ_BYTES) {
    throw new Error(`staged blob exceeds ${MAX_HARD_READ_BYTES} byte scan limit (${size} bytes): ${relPath}`);
  }
  const r = runGit(repoRoot, ['cat-file', 'blob', objectId], {
    encoding: 'buffer',
    maxBuffer: size + 65536,
  });
  const raw = r.stdout;
  const decoded = bufferToLines(raw);
  if (decoded.binary) return { binary: true, lines: null };
  return { binary: false, lines: decoded.lines };
}

function truncateLines(lines, maxLines, extraNote = null) {
  if (lines.length <= maxLines) {
    return extraNote ? [...lines, extraNote] : [...lines];
  }
  const omitted = lines.length - maxLines;
  const note = extraNote ? `... (${omitted} more lines omitted; ${extraNote})` : `... (${omitted} more lines omitted)`;
  return [...lines.slice(0, maxLines), note];
}

function buildUnifiedDiff(left, right, leftLabel, rightLabel, maxLines) {
  const m = left.length;
  const n = right.length;
  if (m * n > MAX_LCS_PAIRS) {
    return [`(diff omitted: hunk exceeds ${MAX_LCS_PAIRS} line-pair limit; ours=${m} lines, theirs=${n} lines)`];
  }
  const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));
  for (let i = m - 1; i >= 0; i--) {
    const row = dp[i];
    const nextRow = dp[i + 1];
    for (let j = n - 1; j >= 0; j--) {
      row[j] = left[i] === right[j] ? nextRow[j + 1] + 1 : Math.max(nextRow[j], row[j + 1]);
    }
  }
  const ops = [];
  let i = 0, j = 0;
  while (i < m && j < n) {
    if (left[i] === right[j]) { ops.push({ type: ' ', line: left[i] }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { ops.push({ type: '-', line: left[i] }); i++; }
    else { ops.push({ type: '+', line: right[j] }); j++; }
  }
  while (i < m) { ops.push({ type: '-', line: left[i++] }); }
  while (j < n) { ops.push({ type: '+', line: right[j++] }); }

  const hasChanges = ops.some((o) => o.type !== ' ');
  if (!hasChanges) return ['(no textual diff)'];

  const out = [`--- ${leftLabel}`, `+++ ${rightLabel}`, `@@ -1,${m} +1,${n} @@`];
  for (const op of ops) out.push(`${op.type}${op.line}`);
  return truncateLines(out, maxLines);
}

function parseConflictHunks(lines, context, markerSize = 7) {
  const { start: START_RE, base: BASE_RE, sep: SEP_RE, end: END_RE } = getMarkerRegexes(markerSize);
  const hunks = [];
  let parseError = null;
  let i = 0;
  while (i < lines.length) {
    const startMatch = START_RE.exec(lines[i]);
    if (!startMatch) {
      i++;
      continue;
    }
    const startIdx = i;
    const oursLabel = startMatch[1] || 'ours';
    i++;
    const ours = [];
    let base = null;
    let baseLabel = null;
    const theirs = [];
    let theirsLabel = 'theirs';

    while (i < lines.length) {
      if (START_RE.test(lines[i])) {
        if (!parseError) parseError = `nested conflict marker at line ${i + 1}`;
      }
      const bm = BASE_RE.exec(lines[i]);
      if (bm) {
        baseLabel = bm[1] || 'base';
        base = [];
        i++;
        while (i < lines.length && !SEP_RE.test(lines[i])) {
          base.push(lines[i]);
          i++;
        }
        break;
      }
      if (SEP_RE.test(lines[i])) break;
      ours.push(lines[i]);
      i++;
    }
    if (i >= lines.length || !SEP_RE.test(lines[i])) {
      return { hunks, parseError: `unterminated conflict starting at line ${startIdx + 1}` };
    }
    i++;
    let endIdx = -1;
    while (i < lines.length) {
      const em = END_RE.exec(lines[i]);
      if (em) {
        theirsLabel = em[1] || 'theirs';
        endIdx = i;
        i++;
        break;
      }
      theirs.push(lines[i]);
      i++;
    }
    if (endIdx < 0) {
      return { hunks, parseError: `unterminated conflict starting at line ${startIdx + 1}` };
    }
    hunks.push({
      start_line: startIdx + 1,
      end_line: endIdx + 1,
      before_context: lines.slice(Math.max(0, startIdx - context), startIdx),
      ours_label: oursLabel,
      ours,
      base_label: baseLabel,
      base,
      theirs_label: theirsLabel,
      theirs,
      after_context: lines.slice(i, i + context),
    });
  }
  return { hunks, parseError };
}

function classifyConflict(stages, markerHunks, { binary = false, submodule = false, markerOnly = false } = {}) {
  if (submodule) return 'submodule';
  if (binary) return 'binary';
  if (markerOnly) return 'marker-only';
  if (markerHunks > 0) return 'text';
  const s = new Set(stages);
  if (s.size === 2 && s.has(2) && s.has(3)) return 'add/add';
  if (s.size === 2 && s.has(1) && s.has(2)) return 'deleted-by-them';
  if (s.size === 2 && s.has(1) && s.has(3)) return 'deleted-by-us';
  if (s.size === 3 && s.has(1) && s.has(2) && s.has(3)) return 'index-only';
  return 'unmerged';
}

function buildUnmergedReport(repoRoot, relPath, stageEntries, context) {
  const stages = Object.keys(stageEntries).map(Number).sort((a, b) => a - b);
  const submodule = stages.some((st) => stageEntries[st].mode === '160000');
  const symlinkStage = stages.some((st) => stageEntries[st].mode === '120000');
  const attrs = getPathAttrs(repoRoot, relPath);
  const wt = (submodule || symlinkStage)
    ? { present: false, binary: false, lines: null, symlink: symlinkStage }
    : readWorktreeLines(join(repoRoot, relPath), { relPath });
  let binary = !submodule && !symlinkStage && wt.binary;
  if (!submodule && !symlinkStage && !binary && !wt.present) {
    for (const st of stages) {
      if (readStageObject(repoRoot, stageEntries[st].objectId).binary) { binary = true; break; }
    }
  }
  let hunks = [];
  let parseError = null;
  if (!submodule && !symlinkStage && !binary && wt.lines !== null) {
    const parsed = parseConflictHunks(wt.lines, context, attrs.markerSize);
    hunks = parsed.hunks;
    parseError = parsed.parseError;
  }
  return {
    path: relPath,
    stages,
    stageEntries,
    conflict_type: classifyConflict(stages, hunks.length, { binary, submodule }),
    generated: attrs.generated,
    marker_hunks: hunks.length,
    parse_error: parseError,
    source: 'unmerged',
    hunks,
  };
}

function buildIndexPreview(repoRoot, report, maxLines) {
  const se = report.stageEntries ?? {};
  const load = (stage) => {
    if (!se[stage]) return null;
    const obj = readStageObject(repoRoot, se[stage].objectId);
    if (!obj.present) return null;
    if (obj.binary) return ['(binary stage)'];
    const note = obj.truncatedBytes ? `truncated at ${MAX_PREVIEW_BYTES} bytes of ${obj.size}` : null;
    return { raw: obj.lines, preview: truncateLines(obj.lines, maxLines, note) };
  };
  const oursObj = load(2);
  const baseObj = load(1);
  const theirsObj = load(3);
  const preview = {
    ours: Array.isArray(oursObj) ? oursObj : (oursObj?.preview ?? null),
    base: Array.isArray(baseObj) ? baseObj : (baseObj?.preview ?? null),
    theirs: Array.isArray(theirsObj) ? theirsObj : (theirsObj?.preview ?? null),
  };
  if (oursObj && !Array.isArray(oursObj) && theirsObj && !Array.isArray(theirsObj)) {
    preview.ours_vs_theirs_diff = buildUnifiedDiff(oursObj.raw, theirsObj.raw, 'ours', 'theirs', maxLines);
  }
  return preview;
}

function buildParseErrorContext(lines, firstLine, context, maxLines) {
  if (!lines || !lines.length || !firstLine) return [];
  const start = Math.max(0, firstLine - 1 - context);
  const end = Math.min(lines.length, firstLine - 1 + Math.max(context + 1, maxLines));
  const out = [];
  for (let i = start; i < end; i++) out.push(`${i + 1}: ${lines[i]}`);
  return out;
}

function sectionLines(title, lines) {
  if (lines === null || lines === undefined) return [`${title}:`, '  (not present)'];
  if (!lines.length) return [`${title}:`, '  (empty)'];
  return [`${title}:`, ...lines.map((l) => `  ${l}`)];
}

function renderSummaryText(repoRoot, opInfo, commits, reports) {
  const lines = [`repo: ${repoRoot}`, `operation: ${opInfo.operation}`];
  if (opInfo.rebaseStep) lines.push(`rebase step: ${opInfo.rebaseStep}`);
  if (commits.ours) lines.push(`ours commit: ${commits.ours}`);
  if (commits.theirs) lines.push(`theirs commit: ${commits.theirs}`);
  lines.push(`conflicted files: ${reports.length}`);
  for (const r of reports) {
    const stages = r.stages.length ? r.stages.join(',') : 'none';
    const flags = r.generated ? ' | generated=true' : '';
    const src = r.source && r.source !== 'unmerged' ? ` | source=${r.source}` : '';
    lines.push(`- ${r.path} | type=${r.conflict_type} | stages=${stages} | hunks=${r.marker_hunks}${flags}${src}`);
    if (r.parse_error) lines.push(`  parse-error: ${r.parse_error}`);
  }
  if (reports.length) lines.push('use --file <path> for compact hunk details or --all for every file');
  return lines.join('\n');
}

function renderDetailText(repoRoot, report, maxLines) {
  const lines = [
    `== ${report.path} ==`,
    `type: ${report.conflict_type}`,
    `stages: ${report.stages.length ? report.stages.join(', ') : 'none'}`,
  ];
  if (report.generated) lines.push('generated: true');
  if (report.source && report.source !== 'unmerged') lines.push(`source: ${report.source}`);
  if (report.parse_error) lines.push(`parse-error: ${report.parse_error}`);

  if (report.conflict_type === 'submodule') {
    const se = report.stageEntries ?? {};
    lines.push(`submodule base: ${se[1]?.objectId ?? '(not present)'}`);
    lines.push(`submodule ours: ${se[2]?.objectId ?? '(not present)'}`);
    lines.push(`submodule theirs: ${se[3]?.objectId ?? '(not present)'}`);
    return lines.join('\n');
  }
  if (report.conflict_type === 'binary') {
    lines.push('binary file: inspect or choose a side with git checkout --ours/--theirs or regenerate');
    return lines.join('\n');
  }
  if (report.hunks.length) {
    lines.push(`hunks: ${report.hunks.length}`);
    for (let idx = 0; idx < report.hunks.length; idx++) {
      const h = report.hunks[idx];
      const diff = buildUnifiedDiff(h.ours, h.theirs, h.ours_label, h.theirs_label, maxLines);
      lines.push('');
      lines.push(`[hunk ${idx + 1}] lines ${h.start_line}-${h.end_line}`);
      lines.push(...sectionLines('before', truncateLines(h.before_context, maxLines)));
      lines.push(...sectionLines(`ours (${h.ours_label})`, truncateLines(h.ours, maxLines)));
      if (h.base !== null) {
        lines.push(...sectionLines(`base (${h.base_label || 'base'})`, truncateLines(h.base, maxLines)));
      }
      lines.push(...sectionLines(`theirs (${h.theirs_label})`, truncateLines(h.theirs, maxLines)));
      lines.push(...sectionLines('ours vs theirs diff', diff));
      lines.push(...sectionLines('after', truncateLines(h.after_context, maxLines)));
    }
    return lines.join('\n');
  }
  if (report.conflict_type === 'marker-only') {
    lines.push('hunks: 0');
    lines.push(...sectionLines('parse-error context', truncateLines(report.parse_error_context ?? [], maxLines)));
    return lines.join('\n');
  }

  const preview = buildIndexPreview(repoRoot, report, maxLines);
  lines.push('hunks: 0');
  lines.push('index preview:');
  lines.push(...sectionLines('ours', preview.ours));
  lines.push(...sectionLines('base', preview.base));
  lines.push(...sectionLines('theirs', preview.theirs));
  if (preview.ours_vs_theirs_diff) {
    lines.push(...sectionLines('ours vs theirs diff', preview.ours_vs_theirs_diff));
  }
  return lines.join('\n');
}

function serializeReport(repoRoot, report, includeDetails, maxLines) {
  const out = {
    path: report.path,
    stages: report.stages,
    conflict_type: report.conflict_type,
    generated: report.generated,
    marker_hunks: report.marker_hunks,
    parse_error: report.parse_error,
    source: report.source,
  };
  if (!includeDetails) return out;
  if (report.conflict_type === 'submodule') {
    const se = report.stageEntries ?? {};
    out.submodule_commits = {
      base: se[1]?.objectId ?? null,
      ours: se[2]?.objectId ?? null,
      theirs: se[3]?.objectId ?? null,
    };
    return out;
  }
  if (report.conflict_type === 'binary') return out;
  if (report.hunks.length) {
    out.hunks = report.hunks.map((h) => ({
      start_line: h.start_line,
      end_line: h.end_line,
      before_context: truncateLines(h.before_context, maxLines),
      ours_label: h.ours_label,
      ours: truncateLines(h.ours, maxLines),
      base_label: h.base_label,
      base: h.base !== null ? truncateLines(h.base, maxLines) : null,
      theirs_label: h.theirs_label,
      theirs: truncateLines(h.theirs, maxLines),
      after_context: truncateLines(h.after_context, maxLines),
      ours_vs_theirs_diff: buildUnifiedDiff(h.ours, h.theirs, h.ours_label, h.theirs_label, maxLines),
    }));
  } else if (report.conflict_type === 'marker-only') {
    out.parse_error_context = truncateLines(report.parse_error_context ?? [], maxLines);
  } else {
    out.index_preview = buildIndexPreview(repoRoot, report, maxLines);
  }
  return out;
}

function firstMarkerLine(lines, markerSize = 7) {
  const { start: START_RE } = getMarkerRegexes(markerSize);
  for (let i = 0; i < lines.length; i++) {
    if (START_RE.test(lines[i])) return i + 1;
  }
  return null;
}

function listDiffPaths(repoRoot, args) {
  const r = runGit(repoRoot, args);
  if (!r.stdout) return [];
  return r.stdout.split('\0').filter(Boolean);
}

function getStagedEntry(repoRoot, relPath) {
  const r = runGit(repoRoot, ['ls-files', '-s', '-z', '--', relPath]);
  for (const record of r.stdout.split('\0')) {
    if (!record) continue;
    const tab = record.indexOf('\t');
    if (tab < 0) continue;
    const [mode, objectId, stageText] = record.slice(0, tab).split(' ');
    const path = record.slice(tab + 1);
    if (path === relPath && stageText === '0') return { mode, objectId };
  }
  return null;
}

function isWorktreeContentModified(repoRoot, relPath) {
  const r = runGit(repoRoot, ['-c', 'diff.renames=false', 'diff', '--no-renames', '--quiet', '--', relPath], { allowFail: true });
  if (r.status === 0) return false;
  if (r.status === 1) return true;
  throw new Error(`git diff --quiet failed for ${relPath}: ${(r.stderr || r.stdout || `exit ${r.status}`).trim()}`);
}

function scanTrackedMarkerSnapshots(repoRoot, unmerged, context, maxLines) {
  const stagedPaths = listDiffPaths(repoRoot, [
    '-c', 'diff.renames=false', 'diff', '--cached', '--no-renames', '--name-only', '--diff-filter=ACMRT', '-z',
  ]);
  const worktreePaths = listDiffPaths(repoRoot, [
    '-c', 'diff.renames=false', 'diff', '--no-renames', '--name-only', '--diff-filter=ACMRT', '-z',
  ]);
  const hits = new Map();
  const attrCache = new Map();
  const attrsFor = (p) => {
    let a = attrCache.get(p);
    if (!a) { a = getPathAttrs(repoRoot, p); attrCache.set(p, a); }
    return a;
  };

  for (const relPath of stagedPaths) {
    if (unmerged.has(relPath)) continue;
    const entry = getStagedEntry(repoRoot, relPath);
    if (!entry) throw new Error(`staged entry missing during scan: ${relPath}`);
    if (entry.mode === '120000' || entry.mode === '160000') continue;
    const obj = readStageBlobForScan(repoRoot, entry.objectId, relPath);
    if (obj.binary || !obj.lines) continue;
    const { markerSize } = attrsFor(relPath);
    const parsed = parseConflictHunks(obj.lines, context, markerSize);
    if (parsed.hunks.length > 0 || parsed.parseError) {
      const firstLine = firstMarkerLine(obj.lines, markerSize);
      hits.set(relPath, {
        staged: {
          ...parsed,
          firstLine,
          errorContext: parsed.hunks.length === 0 ? buildParseErrorContext(obj.lines, firstLine, context, maxLines) : [],
        },
        worktree: null,
      });
    }
  }

  for (const relPath of worktreePaths) {
    if (unmerged.has(relPath)) continue;
    if (!isWorktreeContentModified(repoRoot, relPath)) continue;
    const wt = readWorktreeLines(join(repoRoot, relPath), { enforceMaxRead: true, relPath });
    if (!wt.present || wt.symlink || wt.binary || !wt.lines) continue;
    const { markerSize } = attrsFor(relPath);
    const parsed = parseConflictHunks(wt.lines, context, markerSize);
    if (parsed.hunks.length > 0 || parsed.parseError) {
      const existing = hits.get(relPath) ?? { staged: null, worktree: null };
      const firstLine = firstMarkerLine(wt.lines, markerSize);
      existing.worktree = {
        ...parsed,
        firstLine,
        errorContext: parsed.hunks.length === 0 ? buildParseErrorContext(wt.lines, firstLine, context, maxLines) : [],
      };
      hits.set(relPath, existing);
    }
  }

  const reports = [];
  for (const relPath of [...hits.keys()].sort()) {
    const { staged, worktree } = hits.get(relPath);
    const source = staged && worktree ? 'both' : staged ? 'staged' : 'worktree';
    const primary = worktree ?? staged;
    const parseError = primary.parseError ?? (staged?.parseError ?? null);
    reports.push({
      path: relPath,
      stages: [],
      stageEntries: {},
      conflict_type: 'marker-only',
      generated: attrsFor(relPath).generated,
      marker_hunks: primary.hunks.length,
      parse_error: parseError,
      parse_error_context: primary.errorContext.length ? primary.errorContext : (staged?.errorContext ?? []),
      source,
      first_marker_line: primary.firstLine ?? staged?.firstLine ?? null,
      hunks: primary.hunks,
    });
  }
  return reports;
}

function renderVerifyText(repoRoot, unmergedFiles, markedFiles) {
  const clean = unmergedFiles.length === 0 && markedFiles.length === 0;
  const lines = [
    `repo: ${repoRoot}`,
    `verify: ${clean ? 'clean' : 'failed'}`,
    `unmerged files: ${unmergedFiles.length}`,
  ];
  for (const p of unmergedFiles) lines.push(`- unmerged: ${p}`);
  lines.push(`marked files: ${markedFiles.length}`);
  for (const m of markedFiles) {
    const loc = m.first_marker_line ? `:${m.first_marker_line}` : '';
    const err = m.parse_error ? ` (${m.parse_error})` : '';
    lines.push(`- marker-only [${m.source}]: ${m.path}${loc} | hunks=${m.marker_hunks}${err}`);
  }
  return lines.join('\n');
}

function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`error: ${err.message}`);
    return 2;
  }
  let repoRoot, gitDir, unmerged, opInfo, commits, unmergedReports, markerReports;
  try {
    ({ repoRoot, gitDir } = findRepoInfo(opts.repo));
    unmerged = getUnmergedEntries(repoRoot);
    opInfo = detectOperation(gitDir, unmerged.size > 0);
    commits = getCommitSubjects(repoRoot, gitDir, opInfo.operation);
    unmergedReports = [...unmerged.keys()].sort().map((p) => buildUnmergedReport(repoRoot, p, unmerged.get(p), opts.context));
    markerReports = scanTrackedMarkerSnapshots(repoRoot, unmerged, opts.context, opts.maxLines);
  } catch (err) {
    console.error(`error: ${err.message}`);
    return 2;
  }

  const reports = [...unmergedReports, ...markerReports].sort((a, b) => a.path.localeCompare(b.path));

  if (opts.verify) {
    const unmergedFiles = [...unmerged.keys()].sort();
    const markedFiles = markerReports.map((m) => ({
      path: m.path,
      source: m.source,
      marker_hunks: m.marker_hunks,
      first_marker_line: m.first_marker_line,
      parse_error: m.parse_error,
    }));
    const clean = unmergedFiles.length === 0 && markedFiles.length === 0;
    if (opts.json) {
      console.log(JSON.stringify({ repo_root: repoRoot, clean, unmerged_files: unmergedFiles, marked_files: markedFiles }, null, 2));
    } else {
      console.log(renderVerifyText(repoRoot, unmergedFiles, markedFiles));
    }
    return clean ? 0 : 1;
  }

  let selected = [];
  if (opts.all) {
    selected = reports;
  } else if (opts.files.length) {
    const requested = new Set();
    for (const raw of opts.files) {
      try { requested.add(normalizeRepoPath(repoRoot, raw)); } catch (err) {
        console.error(`error: ${err.message}`);
        return 2;
      }
    }
    const byPath = new Map(reports.map((r) => [r.path, r]));
    const missing = [...requested].filter((p) => !byPath.has(p)).sort();
    if (missing.length) {
      for (const p of missing) console.error(`error: conflicted file not found: ${p}`);
      return 2;
    }
    selected = reports.filter((r) => requested.has(r.path));
  }

  const includeDetails = opts.all || opts.files.length > 0;
  if (opts.json) {
    const list = includeDetails ? selected : reports;
    console.log(JSON.stringify({
      repo_root: repoRoot,
      operation: opInfo.operation,
      rebase_step: opInfo.rebaseStep,
      commits,
      conflicted_files: list.map((r) => serializeReport(repoRoot, r, includeDetails, opts.maxLines)),
    }, null, 2));
    return 0;
  }

  if (!includeDetails || !selected.length) {
    console.log(renderSummaryText(repoRoot, opInfo, commits, reports));
    return 0;
  }
  console.log(selected.map((r) => renderDetailText(repoRoot, r, opts.maxLines)).join('\n\n'));
  return 0;
}

process.exitCode = main();
