---
name: mstack-resolve-merge-conflicts
description: Use when Git stops on merge, rebase, cherry-pick, revert, squash-merge, or stash-pop conflicts, when git status shows unmerged paths, or when staged or modified files still contain conflict markers (<<<<<<<, =======, >>>>>>>). Works in Claude Code, Codex and Antigravity. Resolves Git conflicts from compact hunks and commit intent with deterministic zero-marker verification and no unapproved commits.
---

# mstack resolve merge conflicts

Resolve Git conflicts cleanly without loading entire conflicted files into context by default. Start from compact hunk and stage extraction, trace why each side changed before editing, apply category rules for lockfiles, renames, and binaries, verify zero remaining unmerged paths or conflict markers after staging, run project checks, and ask before committing or continuing the Git operation.

## Host tools

This file is the same on every host. It names roles, and this table says what plays each role.

| Role | Claude Code | Codex | Antigravity |
|---|---|---|---|
| Your question tool | `AskUserQuestion` for short choices; a numbered round in chat for longer ones | A numbered round in chat, then wait for the reply | `ask_question`, then wait for the reply |
| `<skill-folder>` | The base directory shown when this skill loaded | The folder of this `SKILL.md` | The folder of this `SKILL.md` |

## Ground rules

1. **Compact extraction first.** Always start with `scripts/conflict-context.mjs` (summary, then `--file <path>`). Read a whole file only when compact hunk context and diffs are not enough to resolve safely.
2. **Intent before edits.** Trace why both branches changed from local Git history before editing code, configuration, or documentation hunks. Preserve both sides' intent whenever compatible; never invent behavior absent from both branches.
3. **Never hand-merge lockfiles or generated files.** Regenerate them with the project's own tool (offline-first, asking before network commands, or reporting the missing tool).
4. **Resolve clear hunks directly; escalate real ambiguity.** Combine additive imports, tests, fields, docs, and compatible logic without asking. Pause and ask with your question tool on genuine intent contradictions, ambiguous deleted-modified or rename cases, and binary or unclear submodule choices.
5. **Minimal diff only.** Change only what resolves the conflict and keeps the affected area building and passing checks. Leave unrelated lines untouched.
6. **Never commit, continue, push, tag, or abort without explicit consent.** After staging resolved files, verifying clean, and running checks, ask the user before running `git commit`, `git merge --continue`, `git rebase --continue`, `git cherry-pick --continue`, or any `--abort` command. Never run `git push` or `git tag` during conflict resolution.
7. **Require Node.js 18+ and Git.** If `node` or `git` is missing from `PATH`, report the missing tool clearly and stop without silently dumping full conflicted files into context.

## Workflow

### 1. Inspect with the conflict extractor

Run the read-only summary from the target repository root:

```bash
node "<skill-folder>/scripts/conflict-context.mjs"
```

Read the active operation (`merge`, `rebase` with step `k/n`, `cherry-pick`, `revert`, `am`, `squash-merge`, or `unknown`), commit subjects, unmerged paths, conflict categories (`text`, `add/add`, `deleted-by-them`, `deleted-by-us`, `index-only`, `binary`, `submodule`, `marker-only`), and any `generated=true` flags.

- **Zero conflicts reported:** State that no unmerged paths or conflict markers were found in staged or modified tracked files, make no edits, run no Git write command, and stop.
- **Unknown operation:** If `operation: unknown` appears alongside unmerged paths (for example a `stash pop` or manual index state), note that Git has no operation head file and proceed using the index stages and commit context.

### 2. Trace branch intent

Before editing code, configuration, or documentation hunks, inspect local Git history for both sides (always offline first):

```bash
git log --oneline -n 5 HEAD
git log --oneline -n 5 <incoming-ref>
git show --stat <commit>
git show <commit> -- "<path>"
```

Use `<incoming-ref>` matching the operation (`MERGE_HEAD`, `REBASE_HEAD`, `CHERRY_PICK_HEAD`, or `REVERT_HEAD`), and inspect path-scoped patches (`git show <commit> -- "<path>"`) whenever commit subjects or `--stat` output are terse. When `operation: unknown` appears (such as a failed `stash pop`), check `git stash list` and inspect the matching retained stash with `git stash show -p <stash>` (including non-top entries when needed); if the incoming commit or stash still cannot be identified, rely on stage diffs and escalate genuine ambiguity to the user. Only when commit messages explicitly reference an issue or pull request AND local commit diffs still leave intent ambiguous, query the tracker (for example `gh pr view <n>` or `gh issue view <n>`) if available; if offline or unavailable, continue from local diffs and escalate to the user whenever intents genuinely clash.

### 3. Resolve file by file

Inspect one conflicted file at a time in compact mode:

```bash
node "<skill-folder>/scripts/conflict-context.mjs" --file "<path>"
```

Tune `--context <N>` or `--max-lines <N>` (or add `--json`) only if needed. Read `references/resolution-patterns.md` whenever a file is `generated=true`, `deleted-by-them`, `deleted-by-us`, `binary`, `submodule`, or has a genuine logic contradiction.

Handle files in this order when multiple categories appear:
1. **Deleted-modified and renamed paths** (trace renames on both sides from the merge base before deleting or relocating).
2. **Source manifests and regular code/test/config/doc conflicts** (preserve both compatible intents; keep edits minimal; escalate mutually exclusive logic with commit evidence via your question tool).
3. **Lockfiles and generated files** (check out one side after resolving the manifest, then regenerate with offline-first project tooling; ask before networked commands; report if the tool is missing).
4. **Binary files and submodules** (escalate ambiguous choices via your question tool).
5. **Marker-only files** (if `source=staged` or `source=both`, run `git diff -- "<path>"` first to check whether the working tree holds separate unstaged edits; when index and worktree diverge, preserve unrelated unstaged edits by staging only the conflict-resolution hunks or asking the user before staging the whole file, and verify both snapshots are clean).

Take one side wholesale (`git checkout --ours -- "<path>"` or `git checkout --theirs -- "<path>"`) only when commit history or the user's answer confirms the other side should be dropped.

### 4. Stage resolved paths, verify deterministically, and run project checks

1. Stage **only** the resolved paths with `git add -- "<path>"` (or `git rm -- "<path>"` for accepted deletions). Never stage unrelated files, and for a `marker-only` file with separate unstaged edits in the same file, stage only the conflict-resolution hunks (or ask the user first) so unrelated unstaged edits are not swept into the index.
2. Run deterministic verification **after** staging (staging clears unmerged stages 1–3, which `--verify` checks alongside stray markers in both staged blobs and modified worktree files):
   ```bash
   node "<skill-folder>/scripts/conflict-context.mjs" --verify
   ```
   It must exit `0` (`unmerged files: 0` and `marked files: 0`). If it exits `1`, fix every listed path or remaining marker, re-stage it, and re-run `--verify` until it exits `0`.
3. Run project checks (with untrusted-command provenance gate):
   - **Provenance & trust gate before executing project code:** Before running any test, build, lint, codegen, or package-manager command, check whether the incoming branch came from an untrusted source (such as an external PR or fork) or modified executable build, test, script, or tool configuration files (for example `package.json` scripts, `Makefile`, `pyproject.toml`, `Cargo.toml`, `.npmrc`, build/codegen configs, or hook scripts) in `git diff --name-only HEAD...<incoming-ref>` (or the staged/worktree diff). Whenever the incoming changes are untrusted or modified any build/test/script configuration and the session is not running inside a no-secret, no-network, write-confined sandbox, show the exact command and its provenance (which files changed) and ask the user with your question tool for approval before executing it.
   - **Single-stop operation (`merge`, `cherry-pick`, `revert`, `squash-merge`, `marker-only`, or final rebase commit):** discover and run the approved project build, lint, or test command covering the touched area and full suite where practical.
   - **Intermediate stop in a multi-commit rebase (`k/n` where `k < n`):** run fast targeted checks/tests for the conflicted area first (applying the same provenance gate).
   - **No automated check discoverable:** state clearly that no test or build command was found, confirm `--verify` passed, and never fabricate a passing check.

### 5. Report and ask before finishing the Git operation

Present a concise summary containing:
- **Files resolved:** each path and its category (plus one-line resolution choice for non-trivial or escalated hunks).
- **Verification:** `conflict-context.mjs --verify` result (`clean`) and the exact project check/test commands run with their outcomes.
- **Remaining / manual items:** any missing generator tool or user-deferred file.

Then ask the user with your question tool whether to finish the current Git operation (for example `git commit` for a merge/cherry-pick, or `git rebase --continue` for a rebase).

- **Multi-commit rebase continuation:** After the user explicitly approves `git rebase --continue` (or approves continuing remaining clean commits), run it. If a later commit stops on conflicts, repeat Steps 1–5 for that commit. Once `git rebase --continue` finishes the rebase cleanly with no further conflicts, run the project's full test/build check before reporting final completion.
- Never run `git push`, `git tag`, or `--abort` without the user's explicit request.
