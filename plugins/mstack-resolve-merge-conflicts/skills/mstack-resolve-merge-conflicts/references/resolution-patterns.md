# Resolution patterns by conflict category

Read this reference when a conflict involves deleted-modified paths, renames, lockfiles or generated files, binary assets, submodules, or non-trivial code/config hunks. Keep edits strictly scoped to the conflict and preserve both sides' intent whenever compatible.

## 1. Lockfiles and generated artifacts

Recognized lockfiles and generated files (`generated=true` in `conflict-context.mjs`) include `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `bun.lock`, `bun.lockb`, `Cargo.lock`, `poetry.lock`, `uv.lock`, `Pipfile.lock`, `Gemfile.lock`, `go.sum`, `composer.lock`, `Podfile.lock`, `Package.resolved`, `flake.lock`, and any path marked `linguist-generated=true` in `.gitattributes`.

1. **Never hand-edit conflict markers inside a lockfile or generated artifact.**
2. Resolve the source manifest first (for example `package.json`, `Cargo.toml`, `pyproject.toml`, `go.mod`).
3. Check out one clean baseline side of the lockfile (`git checkout --ours -- <path>` or `--theirs`) so markers are removed before regeneration.
4. Regenerate using the project's own tool, preferring offline flags when available:
   - npm (`package-lock.json`): `npm install --package-lock-only --offline` (ask before omitting `--offline`)
   - pnpm (`pnpm-lock.yaml`): `pnpm install --lockfile-only --offline` (ask before omitting `--offline`)
   - yarn (`yarn.lock`): `yarn install --mode=update-lockfile` (ask first if network access is required)
   - Cargo (`Cargo.lock`): `cargo generate-lockfile --offline` or `cargo check --offline` (ask before online resolution)
   - Go (`go.sum`): `go mod tidy` (ask before running if module downloads may access the network)
   - Python (`uv.lock` / `poetry.lock`): `uv lock --offline` / `poetry lock --no-update` (ask before network access)
   - Other generated artifacts (protobuf, GraphQL, OpenAPI, build outputs): run the repository's documented codegen command.
5. **Network gate:** If offline regeneration fails or the tool needs network access, ask the user with your question tool before running any networked command.
6. **Missing tool:** If the required package manager or generator binary is not on `PATH`, do not hand-merge the file. Report the missing tool and give the user the exact regeneration command to run.

## 2. Deleted-modified and renamed paths (`deleted-by-them`, `deleted-by-us`)

Git reports a deleted-modified conflict when one side deleted or renamed a path and the other side modified it. Never drop edits blindly with `git rm` or `git add`.

1. Inspect stage contents via `conflict-context.mjs --file <path>` (`:1:` base, `:2:` ours, `:3:` theirs) to see exactly what the modifying side changed against the base.
2. Check for renames on **both** sides relative to the merge base (walking `HEAD` alone misses incoming-side renames):
   ```bash
   BASE=$(git merge-base HEAD <incoming-ref>)
   git diff -M --name-status "$BASE" HEAD
   git diff -M --name-status "$BASE" <incoming-ref>
   ```
   Where `<incoming-ref>` is `MERGE_HEAD`, `REBASE_HEAD`, `CHERRY_PICK_HEAD`, or `REVERT_HEAD`. When a rename candidate appears, inspect its history with `git log --follow --diff-filter=R <ref> -- <path>` on whichever ref moved or deleted the path.
3. Decide by evidence:
   - **Renamed on one side, edited on the other:** If the surviving edits cleanly map onto the relocated destination file, apply those edits to the destination file, remove the stale path (`git rm <old-path>`), and stage both. If the destination file diverged heavily and placement is unclear, ask the user.
   - **Intentional removal vs feature edit:** If commit history shows one branch intentionally removed the feature while the other edited it—or if deletion intent is unclear—stop and ask the user whether to drop the file, keep it with the edits, or move the edits elsewhere.

## 3. Binary files and submodules (`binary`, `submodule`)

- **Binary (`binary`):** Never run text edits on binary files. Check commit messages for both sides, then ask the user with your question tool whether to keep ours (`git checkout --ours -- <path>`), keep theirs (`git checkout --theirs -- <path>`), or replace/regenerate the asset.
- **Submodule (`submodule`, mode `160000`):** Inspect the `base`, `ours`, and `theirs` commit hashes printed by `conflict-context.mjs --file <path>`. If one commit is a direct descendant of the other (`git -C <submodule> merge-base --is-ancestor <a_sha> <b_sha>`), confirm whether the newer commit satisfies both branches; otherwise ask the user which submodule pointer to record.

## 4. Additive and structural code conflicts

Resolve these directly without interrupting the user when intent is unambiguous:

- **Imports / exports:** Combine distinct imports from both sides, deduplicate, and follow the file's existing grouping and sort order.
- **Tests:** Keep test cases added by both branches unless one branch explicitly removed the tested feature (verify in commit history).
- **Structs, interfaces, types, and schemas:** Preserve fields added by both branches. When both branches changed the same field's type or semantics incompatibly, escalate as a logic contradiction (Section 5).
- **Configuration and documentation:** Merge non-overlapping keys, flags, and sections from both branches while preserving consistent formatting.
- **Compatible logic in the same function:** Combine both behaviors cleanly (for example, validation from one branch plus logging from the other) without introducing behavior absent from both branches and without refactoring unrelated lines.

## 5. Escalating genuine intent contradictions

When two hunks express mutually exclusive behavior (for example, conflicting business rules, incompatible return values, or opposite defaults) and local history (plus any referenced PR/issue) does not settle which side wins:

1. Do not silently pick `--ours` or `--theirs`.
2. Ask the user with your question tool, presenting:
   - The file path and line range.
   - **Option 1 (ours — `<commit subject>`):** what our side does and why.
   - **Option 2 (theirs — `<commit subject>`):** what their side does and why.
   - **Option 3 (combine/custom):** how they might be combined, if meaningful, or ask for the intended rule.
3. Wait for the user's choice before editing that hunk.
