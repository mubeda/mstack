# Add mstack-resolve-merge-conflicts, a skill that resolves Git conflicts with compact context extraction and intent tracing

Status: Approved 2026-11-26 (approved in chat by the user)
Size: full    Mode: gated    Type: feature
Source: docs/briefs/2026-11-26-add-mstack-resolve-merge-conflicts.md (Approved 2026-11-26); supersedes GitHub issue #28

## Problem

Developers using Claude Code, Codex CLI, or Antigravity regularly stop on Git merge, rebase, cherry-pick, or stash-pop conflicts—or encounter stray conflict markers left inside already-staged files. No `mstack` skill handles Git conflict resolution today, so the skill router falls back to an online search every time, while unprompted agents dump whole conflicted files into context, discard one branch's intent with `--ours` or `--theirs`, hand-edit lockfiles, or leave conflict markers behind. An external companion skill (`warpdotdev/common-skills@resolve-merge-conflicts`) also fails out of the box when installed globally because its instructions assume a project-local script path, require Python 3, and ignore staged marker-only conflicts.

## Goals

1. A developer stopped on any Git merge, rebase, cherry-pick, stash-pop, or staged marker-only conflict gets every conflicted path inspected through compact hunks, diffs, and stage previews without loading whole conflicted files into context by default.
2. Every resolved hunk reflects both branches' intent traced from commit history (with genuine contradictions, ambiguous deletions, and binary files escalated to the user instead of guessed), and lockfiles or generated files are regenerated rather than hand-merged.
3. Resolution finishes cleanly: deterministic verification confirms zero unmerged index entries and zero remaining conflict markers in modified or staged files, relevant project checks run, and no commit, rebase continuation, push, tag, or abort happens without the user's explicit consent.
4. The skill runs identically across Claude Code, Codex CLI, and Antigravity (and via the skills CLI) on Linux, macOS, and Windows using only Node.js 18+ and Git, with all four adapted third-party sources credited under their verified MIT and Apache-2.0 licenses.

## Non-goals

- Calling `mstack-resolve-merge-conflicts` from the six review/dev workflows in v0.1.0, so workflow scope and versions stay untouched until the standalone skill is proven.
- Providing a called-mode result block for other skills in v0.1.0, because no caller invokes it yet.
- Automatically running `git commit`, `git merge --continue`, `git rebase --continue`, `git cherry-pick --continue`, `git push`, `git tag`, or `--abort` without the user's explicit yes, because outward or destructive Git actions require user consent.
- Tracking `warpdotdev/common-skills@resolve-merge-conflicts` as an external dependency in `mstack-setup`, because this native skill replaces it.
- Merging binary file contents automatically, because binary conflicts require the user to pick a side or regenerate the artifact.
- Running the description optimizer of Anthropic's skill creator.

Anti-goals: dumping whole conflicted files into context before checking compact extraction; silently dropping a branch's intended change via `--ours` or `--theirs` without inspecting intent; introducing behavior present on neither branch; reporting conflicts resolved while any unmerged index entry or conflict marker remains; hand-merging lockfiles or generated files; mutating repository files or Git state during inspection; executing commit, continue, push, tag, or abort commands without explicit approval; requiring Python 3 or third-party packages; omitting MIT/Apache-2.0 notices or copying unlicensed text; committing personal data or machine paths.

## Users and scenarios

1. As a developer stopped mid-merge or mid-rebase on large source files, I want the agent to inspect only the conflicted hunks, stage diffs, and commit messages for both sides, so that both features survive the merge without burning context on whole files.
2. As a developer in a multi-commit rebase, I want each stopped commit resolved, staged, and checked with targeted tests before I approve continuing, so that every rebased commit stays valid and I stay in control of history.
3. As a developer whose merge hit a conflicted lockfile, renamed-and-modified file, or binary asset, I want lockfiles regenerated with the project's tool, renames traced through history, and genuinely ambiguous choices presented to me with evidence, so that nothing breaks silently.
4. As a developer who accidentally staged a file that still contains conflict markers, I want the skill to detect those markers even when Git reports no unmerged paths and verify zero markers remain when done.
5. As a user routing tasks through `mstack-auto` or setting up a machine with `mstack-setup`, I want conflict-resolution prompts routed directly to `mstack-resolve-merge-conflicts` without an online search and the skill discoverable as an optional mstack plugin.

## Requirements

### R1. Compact conflict summary  [Must]
WHEN a caller invokes the conflict extractor in summary mode inside a Git repository, the conflict extractor SHALL output the active Git operation, the current and total rebase steps when a rebase is active, the commit subjects of local and incoming sides when available, every unmerged path with its index stages, conflict category, and marker-hunk count, and every staged or working-tree-modified tracked text file that contains a conflict marker block, without printing full file contents.

#### Scenario: active merge with text and index-only conflicts
- GIVEN a Git repository stopped on a merge with one text-conflicted file and one deleted-by-them file
- WHEN the caller runs the conflict extractor in summary mode
- THEN the output reports operation `merge`, lists both conflicted paths with their stages, categories (`text` and `deleted-by-them`), and hunk counts, includes local and incoming commit subjects, and prints no full file bodies

#### Scenario: active multi-commit rebase
- GIVEN a Git repository stopped at step 2 of a 4-commit rebase
- WHEN the caller runs the conflict extractor in summary mode
- THEN the output reports operation `rebase` with step `2/4` and lists the conflicted paths for the stopped commit

#### Scenario: repository with no conflicts
- GIVEN a clean Git repository with zero unmerged entries and zero conflict markers in modified or staged files
- WHEN the caller runs the conflict extractor in summary mode
- THEN the extractor exits with status 0 and reports zero conflicted files, and modifies no file or Git state

### R2. Compact per-file hunk, diff, and index preview  [Must]
WHEN a caller requests detailed output for one or more conflicted paths (or all conflicted paths) in text or JSON format, the conflict extractor SHALL output only the requested surrounding context lines, the ours, optional diff3 base, and theirs sections with an ours-versus-theirs unified diff for each marker hunk, or truncated stage previews and a unified diff for index-only conflicts, truncating every section at the configured maximum line count.

#### Scenario: diff3 text conflict with custom context and line limit
- GIVEN a conflicted file containing a diff3 marker block (`<<<<<<<`, `|||||||`, `=======`, `>>>>>>>`)
- WHEN the caller requests details for that file with 3 context lines and a 20-line section limit
- THEN the output includes up to 3 lines before and after the hunk, separate ours, base, and theirs sections, a unified diff between ours and theirs, and truncates any longer section with an omitted-line count

#### Scenario: index-only add/add conflict
- GIVEN a path with stages 2 and 3 in the index and no marker hunks in the working tree
- WHEN the caller requests details for that path
- THEN the output classifies it as `add/add` and prints truncated stage previews for ours and theirs plus their unified diff

#### Scenario: requesting a non-conflicted path
- GIVEN a Git repository with a tracked file that has neither unmerged stages nor conflict markers
- WHEN the caller requests details for that path
- THEN the conflict extractor exits with status 2, prints an error naming the non-conflicted path to standard error, and outputs no file contents

### R3. Staged and modified marker-only conflict detection  [Must]
WHILE a tracked text file has no unmerged index entry, WHEN that file is staged or modified in the working tree and contains a line-start conflict marker block (`<<<<<<<`, `=======`, and `>>>>>>>`), the conflict extractor SHALL classify that file as `marker-only` and extract its hunks, while ignoring untouched tracked files and binary files.

#### Scenario: file staged with conflict markers still present
- GIVEN a tracked text file that was staged with `git add` while still containing a `<<<<<<<` / `=======` / `>>>>>>>` block
- WHEN the caller runs the conflict extractor in summary mode and then detail mode for that path
- THEN summary mode lists the path with category `marker-only` and its hunk count, and detail mode extracts its hunks

#### Scenario: untouched documentation file containing example conflict markers
- GIVEN an untouched tracked Markdown file whose text includes example `<<<<<<<`, `=======`, and `>>>>>>>` lines
- WHEN the caller runs the conflict extractor in summary mode
- THEN the extractor ignores that untouched file and reports zero conflicts

#### Scenario: modified binary file containing marker-like bytes
- GIVEN a modified binary file containing NUL bytes alongside ASCII `<<<<<<<` sequences
- WHEN the caller runs the conflict extractor in summary mode
- THEN the extractor skips marker parsing for that binary file and does not report a marker-only text conflict

### R4. Read-only inspection and CLI validation  [Must]
IF the conflict extractor is invoked outside a Git repository, with an unknown flag, with `--all` combined with `--file`, with a negative `--context` value, with a non-positive `--max-lines` value, or with a path resolving outside the repository root, THEN the conflict extractor SHALL exit with status 2, print an error message naming the cause to standard error, and modify no file or Git state.

#### Scenario: invalid flag combination
- GIVEN a Git repository with a conflicted file
- WHEN the caller invokes the conflict extractor with both `--all` and `--file`
- THEN the extractor exits with status 2, writes an error explaining the conflicting flags to standard error, and leaves the working tree and index unchanged

#### Scenario: path traversal outside repository
- GIVEN a Git repository
- WHEN the caller requests `--file ../outside.txt`
- THEN the extractor exits with status 2, writes an error stating the path is outside the repository to standard error, and reads no external file

### R5. Intent tracing before editing conflicts  [Must]
WHEN resolving code, configuration, or documentation conflicts, `mstack-resolve-merge-conflicts` SHALL inspect local Git commit history for both conflicting sides before editing hunks, query the issue or pull-request tracker only when commit messages reference an issue or pull request and intent remains ambiguous, preserve both sides' intended behavior whenever compatible, and introduce no behavior absent from both branches.

#### Scenario: two compatible changes to the same function
- GIVEN one branch adds input validation and the incoming branch adds structured logging to the same function, both described in their commit messages
- WHEN `mstack-resolve-merge-conflicts` resolves the file
- THEN the agent cites both commits' intents and keeps both validation and logging in the resolved function without adding unrelated changes

#### Scenario: terse commits with no PR reference and offline environment
- GIVEN two conflicting commits with terse subjects and no network or tracker access
- WHEN `mstack-resolve-merge-conflicts` traces intent
- THEN it reads the local commit diffs via Git without failing on missing tracker access, and escalates to the user if intent still contradicts

### R6. Category-specific handling and lockfile regeneration  [Must]
WHEN a conflicted path is a lockfile or generated artifact, `mstack-resolve-merge-conflicts` SHALL NOT hand-edit its conflict markers and SHALL check out one side and regenerate the file using the project's own tool with offline options where supported, asking the user before running any command that accesses the network or reporting the missing tool when regeneration cannot run.

#### Scenario: conflicted package lockfile with offline regeneration available
- GIVEN a repository with a conflicted `package-lock.json` after resolving `package.json`
- WHEN `mstack-resolve-merge-conflicts` handles the lockfile
- THEN it checks out one version of the lockfile, regenerates it using the package manager (asking first if network access is needed), and does not manually edit marker lines inside the lockfile

#### Scenario: generator tool not installed on the machine
- GIVEN a conflicted generated lockfile whose package manager binary is absent from `PATH`
- WHEN `mstack-resolve-merge-conflicts` reaches that file
- THEN it does not hand-merge the file, reports that the required tool is missing, and gives the user the exact regeneration step to run

### R7. Deleted-modified, rename, and binary conflict handling  [Must]
WHEN a conflicted path is a deleted-modified, add/add, or binary conflict, `mstack-resolve-merge-conflicts` SHALL inspect index stages and rename history before editing and SHALL ask the user with its question tool whenever deletion intent, relocation target, or binary version choice is ambiguous.

#### Scenario: file renamed on one branch and modified on the other
- GIVEN a file moved to a new path on branch A and edited at its old path on branch B, producing a deleted-modified conflict
- WHEN `mstack-resolve-merge-conflicts` inspects the conflict
- THEN it traces the rename in Git history, applies the surviving edits to the relocated file when unambiguous (or asks the user when intent is unclear), and removes the stale path

#### Scenario: binary image conflict
- GIVEN a conflicted PNG asset modified on both branches
- WHEN `mstack-resolve-merge-conflicts` reaches that asset
- THEN it does not attempt text edits on the binary and asks the user whether to keep ours, keep theirs, or replace/regenerate it

### R8. Escalating genuine intent contradictions  [Must]
IF two conflicting hunks express mutually exclusive behavior and commit history does not settle which behavior applies, THEN `mstack-resolve-merge-conflicts` SHALL stop before choosing a side for that hunk, present each competing option with its commit evidence using the host question tool, and wait for the user's decision.

#### Scenario: incompatible business logic on both branches
- GIVEN branch A calculates tax as a percentage and branch B adds a flat fee on the same line, and both commits look intentional
- WHEN `mstack-resolve-merge-conflicts` reaches that hunk
- THEN it presents both options with their commit summaries, asks the user which to keep or how to combine them, and makes no silent pick before the reply arrives

#### Scenario: clear additive imports conflict
- GIVEN both branches added distinct import lines in the same import block
- WHEN `mstack-resolve-merge-conflicts` reaches that hunk
- THEN it merges both imports directly without pausing to ask an unnecessary question

### R9. Minimal-diff scope and Git safety guardrails  [Must]
WHILE resolving conflicts, `mstack-resolve-merge-conflicts` SHALL restrict edits to resolving the conflicts and keeping the affected code building and passing checks, and SHALL NOT run `git commit`, `git merge --continue`, `git rebase --continue`, `git cherry-pick --continue`, `git push`, `git tag`, or any `--abort` command without the user's explicit consent.

#### Scenario: all conflicts resolved and staged
- GIVEN all conflicted files are resolved, verified clean, and staged with `git add`
- WHEN `mstack-resolve-merge-conflicts` finishes validation
- THEN it reports the resolved files, key decisions, and check results, asks whether to commit or continue the Git operation, and runs neither commit, continue, push, nor abort before the user answers

#### Scenario: tempted to refactor surrounding code
- GIVEN a conflicted function sits inside a file with unrelated style issues outside the conflict hunks
- WHEN `mstack-resolve-merge-conflicts` edits the file
- THEN it resolves only the conflicted area and leaves unrelated lines untouched

### R10. Deterministic post-resolution verification  [Must]
WHEN a caller invokes the conflict extractor with `--verify`, the conflict extractor SHALL exit with status 0 only when zero unmerged index entries remain and zero staged or working-tree-modified tracked text files contain conflict markers, and SHALL exit with status 1 listing every remaining unmerged path or marked file otherwise.

#### Scenario: clean resolution passes verification
- GIVEN every conflicted file has had its markers removed and has been staged with `git add`
- WHEN the caller runs the conflict extractor with `--verify`
- THEN it exits with status 0 and reports zero unmerged paths and zero remaining conflict markers

#### Scenario: stray marker left in a staged file fails verification
- GIVEN all files are staged so `git ls-files -u` is empty, but one staged file still contains a `<<<<<<<` marker line
- WHEN the caller runs the conflict extractor with `--verify`
- THEN it exits with status 1 and prints the path and line number of the remaining marker

### R11. Project validation and multi-commit rebase loop  [Should]
WHEN all conflicted paths for the current stopped state are resolved, verified, and staged, `mstack-resolve-merge-conflicts` SHALL run targeted checks or tests for the touched area during intermediate multi-commit rebase stops and run the project's full test or build check for single-stop operations or the final rebase commit, then report resolved files, notable decisions, and check results before asking to commit or continue.

#### Scenario: intermediate stop in a multi-commit rebase
- GIVEN a rebase stopped at commit 1 of 3 with conflicts in one module
- WHEN `mstack-resolve-merge-conflicts` finishes resolving and staging that stop
- THEN it runs the targeted tests for that module, reports the result, and asks before running `git rebase --continue` (resuming the same workflow if commit 2 or 3 also stops on conflicts)

#### Scenario: project has no discoverable test or build command
- GIVEN a repository with no test script or build configuration
- WHEN `mstack-resolve-merge-conflicts` reaches validation
- THEN it reports that no automated project check was found, confirms deterministic marker/unmerged verification passed, and does not fabricate a passing test result

### R12. Clean repository handling  [Must]
IF `mstack-resolve-merge-conflicts` is invoked in a repository where the conflict extractor reports zero unmerged paths and zero marker-only conflicts, THEN `mstack-resolve-merge-conflicts` SHALL report that no conflicts were found, edit no file, and run no Git write command.

#### Scenario: user invokes skill after conflicts were already resolved
- GIVEN a Git repository with no unmerged paths and no conflict markers in modified or staged files
- WHEN the user invokes `mstack-resolve-merge-conflicts`
- THEN it states that no conflicts are present and stops without modifying files or Git state

### R13. Missing runtime handling  [Must]
IF Node.js or Git is unavailable when `mstack-resolve-merge-conflicts` starts, THEN `mstack-resolve-merge-conflicts` SHALL report the missing tool and stop without silently dumping full conflicted files into context.

#### Scenario: Node.js missing from PATH
- GIVEN an environment where `node` is not installed
- WHEN the user invokes `mstack-resolve-merge-conflicts`
- THEN the skill reports that Node.js 18+ is required to run the conflict extractor and stops without dumping full files

### R14. Three-host plugin packaging, attribution, and repository registration  [Must]
The `mstack` marketplace repository SHALL ship `mstack-resolve-merge-conflicts` as a self-contained plugin for Claude Code, Codex CLI, and Antigravity (and installable via the skills CLI) containing its Apache-2.0 license copy and complete third-party notices for all four adapted sources, registered in both marketplace catalogs (raising marketplace version by one minor increment), the skill router, the optional setup dependency list, the skill finder's preferred table, the skill creator's host lists, and repository documentation, passing every marketplace, version-bump, skill-lint, private-data, and Antigravity manifest check.

#### Scenario: repository validation checks after adding the plugin
- GIVEN `mstack-resolve-merge-conflicts` is packaged at version `0.1.0` with all three manifests, both marketplace entries at marketplace `0.16.0`, updated router/setup/find-skills/skill-creator entries, and bumped versions on every modified existing plugin
- WHEN the repository checks and unit tests run
- THEN version-bump checks, marketplace checks, Antigravity manifest validation, skill lint, private-data scan, and unit tests all pass with zero failures

#### Scenario: skills CLI single-folder install
- GIVEN a user installs only the skill folder via the skills CLI
- WHEN the skill runs on any supported host
- THEN every file the skill reads or executes (`SKILL.md`, references, extractor script, license, third-party notices) resides inside that skill folder with zero external file references

### R15. Cross-platform zero-dependency extractor runtime  [Should]
The conflict extractor SHALL execute on Node.js 18 or later and Git alone across Linux, macOS, and Windows without requiring Python or third-party npm packages.

#### Scenario: extractor runs with no Python installed
- GIVEN a machine with Node.js 18+ and Git on `PATH` and no Python binary installed
- WHEN the conflict extractor runs summary, detail, JSON, and `--verify` modes against a conflicted repository
- THEN every command succeeds with expected exit codes and normalized repository-relative paths

## Constraints and assumptions

- **Verified third-party licenses (checked 2026-11-26 from live GitHub repos):**
  - `warpdotdev/common-skills` (`resolve-merge-conflicts`): MIT (`Copyright (c) 2026 Denver Technologies, Inc.`).
  - `mattpocock/skills` (`docs/engineering/resolving-merge-conflicts.md`): MIT (`Copyright (c) 2026 Matt Pocock`).
  - `tailcallhq/forgecode` (`.forge/skills/resolve-conflicts/`): Apache-2.0 (no `NOTICE` file).
  - `cursor/plugins` (`cursor-team-kit/skills/fix-merge-conflicts`): MIT (`Copyright (c) 2026 Cursor`).
- **Repository rules (`AGENTS.md`):**
  - Self-contained skill folder (`plugins/<plugin>/skills/<skill>/`) containing `SKILL.md`, `references/`, `scripts/`, `LICENSE` (matching root Apache-2.0), and `THIRD_PARTY_NOTICES.md`.
  - Antigravity `SKILL.md` body limit: at most 24,000 bytes after frontmatter; `.antigravity-plugin/plugin.json` must pass `agy plugin validate`.
  - Host tool names (`AskUserQuestion`, `ask_question`, etc.) appear only inside `SKILL.md`'s host table (`check-skill.mjs`).
  - Public repository: zero personal names, machine paths, private URLs, or credentials (`scan-private.mjs`).
  - Adding a plugin requires a minor bump to marketplace `metadata.version` (`0.15.0` → `0.16.0`) in both catalogs and patch bumps to every modified existing plugin (`mstack-auto`, `mstack-setup`, `mstack-find-skills`, `mstack-skill-creator`).
- **Assumptions (agent's calls carried from the approved brief):**
  - Requires no other `mstack` skill (only `node` and `git`), matching `mstack-anonymize` and `mstack-web-ui`, so `mstack-setup` tracks it as optional (agent's call: keeps the skill usable standalone without preflight friction).
  - Extractor script stays strictly read-only (agent's call: guarantees inspection never mutates files or `.git` before user consent).
  - Multi-commit rebase pauses to ask before each `git rebase --continue`, resuming the same loop if later commits conflict (agent's call: consistent with no-unapproved-Git-continuation rule).
  - Default context lines = 2 and default max lines per section = 40, matching `warpdotdev/common-skills` defaults (agent's call: proven compact defaults that callers can override via flags).
  - Built-in generated/lockfile recognition covers common ecosystems (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `bun.lock`, `bun.lockb`, `Cargo.lock`, `poetry.lock`, `uv.lock`, `Pipfile.lock`, `Gemfile.lock`, `go.sum`, `composer.lock`, `Podfile.lock`, `Package.resolved`, `flake.lock`, plus `.gitattributes` `linguist-generated=true` entries) (agent's call: covers mainstream lockfiles without needing external registries).

## Decisions

D1. Build a native `mstack-resolve-merge-conflicts` plugin rather than tracking `warpdotdev/common-skills@resolve-merge-conflicts` as an external companion. Alternatives considered: adding `warpdotdev/common-skills` to `mstack-setup` and a companion routing section in `mstack-auto`; lost because upstream hardcodes a project-local script path, requires Python 3, misses staged marker-only files, and lacks intent tracing and category playbooks.
Decided by: user. Source: approved brief (2026-11-26).

D2. Use a compact `SKILL.md`, one read-only zero-dependency Node.js conflict-extractor CLI, and one on-demand category-patterns reference file (Approach A). Alternatives considered: (a) a three-script toolkit with a mutating deleted-modified backup script (rejected because it splits one inspection concern and mutates Git state before user approval); (b) a prompt-only skill using raw `git` commands (rejected because it loses compact hunk extraction and deterministic verification).
Decided by: user. Source: approved brief (2026-11-26).

D3. Rewrite the conflict extractor in Node.js 18+ instead of shipping a Python 3 script. Alternatives considered: keeping an adapted copy of Warp's Python 3 script; lost because every other `mstack` script runs on Node.js 18+ with zero dependencies and Windows `python3` launcher mismatches break Python invocations.
Decided by: user. Source: approved brief (2026-11-26).

D4. Combine compact context extraction (`warpdotdev/common-skills`, MIT) with intent tracing (`mattpocock/skills`, MIT), category resolution rules (`tailcallhq/forgecode`, Apache-2.0), and minimal-diff guardrails (`cursor/plugins`, MIT), rewriting all rules in this project's own words and crediting all four sources. Alternatives considered: keeping only Warp's extraction plus basic lockfile regeneration; lost because deleted-modified renames, intent tracing, and minimal-diff guardrails prevent the most common silent merge regressions.
Decided by: user. Source: approved brief (2026-11-26).

D5. Resolve clear hunks directly, ask only on genuine intent contradictions, ambiguous deleted-modified/rename cases, or binary files; stage resolved files and validate tests, but always ask before committing, continuing a merge/rebase/cherry-pick, or aborting (never push or tag). Alternatives considered: plan-first approval before any edit (too much friction for simple conflicts); automatic commit/continue after green tests (violates `mstack` no-outward-action rule).
Decided by: user. Source: approved brief (2026-11-26).

D6. Keep `mstack-resolve-merge-conflicts` standalone in v0.1.0 (no required other `mstack` skills, no called mode, no changes to the six review/dev workflows), registered in the router, optional setup tier, skill finder, and skill creator host lists. Alternatives considered: also wiring the six review/dev workflows now; lost to keep initial scope focused and avoid bumping all six workflows before standalone validation.
Decided by: user. Source: approved brief (2026-11-26).

D7. Restrict marker-only scanning and `--verify` to staged and working-tree-modified tracked text files using line-start conflict marker blocks (`<<<<<<<`, `=======`, `>>>>>>>`), skipping untouched files and binary files. Alternatives considered: scanning all tracked files in the repository; lost because documentation and test fixtures intentionally containing example markers would produce false positives.
Decided by: user. Source: interview round 1 (2026-11-26).

D8. Regenerate conflicted lockfiles and generated artifacts using offline project commands where supported, asking before running any command that touches the network and reporting missing tools rather than hand-merging. Alternatives considered: running package-manager commands unconditionally without asking; lost to preserve explicit user control over network activity and side effects.
Decided by: user. Source: interview round 1 (2026-11-26).

D9. Trace intent from local Git history first and query `gh` for referenced issues or pull requests only when local commits remain ambiguous. Alternatives considered: local Git history only; lost because terse squash/merge commits often reference a PR number that settles intent without interrupting the user.
Decided by: user. Source: interview round 1 (2026-11-26).

D10. During multi-commit rebases, run targeted checks/tests on intermediate stops, run broader/full checks at the final stop (or single-stop merges/cherry-picks), and ask before each `git rebase --continue` (allowing the user to opt into continuing remaining clean commits). Alternatives considered: running the full test suite on every intermediate rebase commit; lost because large suites make multi-commit rebases prohibitively slow.
Decided by: user. Source: interview round 1 (2026-11-26).

## Risks

- **False positives on conflict markers inside modified test or doc files** -> Guarded by scanning only staged/modified tracked text files, skipping binary files, and requiring full line-start `<<<<<<<` … `=======` … `>>>>>>>` blocks during summary extraction while `--verify` checks line-start markers (`<<<<<<<`, `=======`, `>>>>>>>`) in conflicted/modified/staged files (and noting any intentional test fixture markers if the user is editing a conflict-parser test).
- **Multi-file marketplace registration drift** -> Mitigated by `scripts/check-marketplace.mjs`, `scripts/check-version-bumps.mjs`, `plugins/mstack-setup/tests/check-setup.test.mjs`, and updating every `mstack-setup` eval fixture in the same change.
- **Incomplete diff/line handling on Windows CRLF or paths with spaces/non-ASCII** -> Mitigated by using `execFileSync` with `-z` NUL-delimited Git output, normalizing CRLF line endings when matching markers, and testing paths with spaces and CRLF in unit tests.
- **Large conflicted files or binary stages exhausting output** -> Mitigated by binary NUL-byte detection and enforcing `--max-lines` truncation on every hunk section, diff, and index preview.

## Verification

| Requirement | How it is checked |
|---|---|
| R1, R2, R3, R4, R10, R12, R15 | Automated Node.js unit test suite (`node --test`) building real temporary Git repositories covering: text merge conflict, diff3 markers, multi-commit rebase (step `k/n`), cherry-pick, stash pop, `add/add`, `deleted-by-them`, `deleted-by-us`, renamed-and-modified, binary conflict, lockfile classification, staged marker-only file, untouched file with example markers (ignored), modified binary with marker bytes (ignored), paths with spaces, CRLF markers, `--file` / `--all` / `--json` / `--context` / `--max-lines`, invalid flags and path traversal (exit 2), `--verify` pass (exit 0) and fail on unmerged or stray marker (exit 1), clean repo (exit 0), and read-only guarantee (repo state unchanged after every run). |
| R5, R6, R7, R8, R9, R11, R12, R13 | Eval cases and comparison test runs (with and without `mstack-resolve-merge-conflicts`, via `mstack-skill-creator` Phases 5–6) testing: (1) multi-file merge with compatible intent + lockfile conflict, verifying compact extraction, intent citation, no hand-merged lockfile, `--verify`, and asking before commit; (2) genuine intent contradiction + binary/deleted-modified conflict, verifying user escalation without silent `--ours`/`--theirs`; (3) staged marker-only conflict detection and clean repo no-op. |
| R14 | `node scripts/check-version-bumps.mjs`, `node scripts/check-marketplace.mjs` (including `agy plugin validate`), `node --test plugins/mstack-setup/tests/check-setup.test.mjs scripts/tests/check-marketplace.test.mjs scripts/tests/check-version-bumps.test.mjs`, `check-skill.mjs`, `scan-private.mjs`, outside-the-diff sweep, and cross-vendor review via `mstack-vendors` + `mstack-receive-review`. |

**Uncovered input classes and expected behavior:**
- *Unterminated conflict markers* (`<<<<<<<` without matching `=======` or `>>>>>>>`): extractor reports a `parse_error` with the starting line number, does not crash, and `--verify` exits 1.
- *Nested conflict markers* (from rerunning a merge over unresolved markers): parser surfaces all outer/remaining markers or reports a parse error, and `--verify` exits 1 until every marker line is gone.
- *Submodule or gitlink conflicts (mode `160000`)*: classified cleanly as `submodule` (no text hunk dump) so the agent inspects stage commit hashes and asks the user when ambiguous.
- *Empty files or files without trailing newlines*: handled without off-by-one crashes or spurious empty hunks.
- *Non-UTF-8 / high-byte files without NUL bytes*: decoded safely with replacement characters so extraction never crashes.
- *Detached HEAD or initial-commit repositories*: commit-subject lookup degrades gracefully to empty/omitted subjects without failing summary mode.

## Appendix: interview record

- 2026-11-26 Evidence: Live GitHub API check of `warpdotdev/common-skills` (`LICENSE`), `mattpocock/skills` (`LICENSE`), `tailcallhq/forgecode` (`LICENSE`), and `cursor/plugins` (`cursor-team-kit/LICENSE`) / Decision: All four sources carry permissive licenses (MIT or Apache-2.0) compatible with `mstack`'s Apache-2.0; all four may be adapted in our own words with required notices and credits.
- 2026-11-26 Brief: `docs/briefs/2026-11-26-add-mstack-resolve-merge-conflicts.md` (Approved 2026-11-26) / Decision: Name `mstack-resolve-merge-conflicts`; zero-dependency Node.js extractor; Approach A (`SKILL.md` + `conflict-context.mjs` + `resolution-patterns.md`); include intent tracing, category playbooks, and minimal-diff guardrails; standalone v0.1.0 across Claude Code, Codex CLI, and Antigravity; resolve clear hunks directly, ask on contradictions/deleted-modified/binary, ask before commit/continue/abort; discard earlier companion-skill edits.
- 2026-11-26 Q: Marker-only conflict scanning scope to avoid false positives / Recommended: Staged and working-tree-modified tracked text files only, matching line-start `<<<<<<<` / `=======` / `>>>>>>>` blocks, skipping binaries and untouched files / Decision: Accepted recommendation.
- 2026-11-26 Q: Conflicted lockfiles and generated files handling / Recommended: Never hand-edit; check out one side and regenerate with project tool (preferring offline flags, asking before networked commands, flagging missing tools) / Decision: Accepted recommendation.
- 2026-11-26 Q: Intent tracing depth when commits are terse / Recommended: Local Git history first; query `gh` only when commit messages reference a PR/issue and intent remains ambiguous; ask user if still clashing / Decision: Accepted recommendation.
- 2026-11-26 Q: Multi-commit rebase validation and continuation / Recommended: Targeted checks on intermediate stops, broader/full checks at final stop, ask before each `git rebase --continue` (or let user confirm continuing remaining clean commits) / Decision: Accepted recommendation.
