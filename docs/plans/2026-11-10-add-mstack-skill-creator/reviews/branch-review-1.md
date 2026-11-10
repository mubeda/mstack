# Branch review 1

Reviewer: Codex gpt-6-astra, effort high, read-only, 2026-11-10, on the uncommitted working tree of branch skill-creator against main. Output kept unchanged below, then the handling.

Found nine issues. No files were changed.

1. **[P1] Eval output can execute JavaScript in the review page.** [generate_review.py:279](/work/github/mstack/plugins/mstack-skill-creator/skills/mstack-skill-creator/scripts/vendor/anthropic-skill-creator/generate_review.py:279) inserts JSON directly inside a `<script>` element. An output containing `</script><script>alert(1)</script>` closes that element and injects executable code. Ordinary HTML containing a closing script tag also breaks initialization. **Reproduce:** pass that text as an output’s `content` to `generate_html()`. My in-memory HTML-parser probe confirmed a separate executable script. The smoke test checks only that the page contains the prompt.

2. **[P1] Quoted JSON credentials bypass the privacy scan.** [scan-private.mjs:25](/work/github/mstack/plugins/mstack-skill-creator/skills/mstack-skill-creator/scripts/scan-private.mjs:25) requires whitespace or an assignment separator immediately after the key; a closing quote prevents matching. **Reproduce:** scan `{"password": "abcdef123456"}` or `{"token": "abcdef123456"}`. Both returned a pass in memory, while `password = abcdef123456` produced a hit. Config files containing credentials without recognizable vendor prefixes can therefore pass the R22 gate. Tests cover only unquoted assignments.

3. **[P2] The frontmatter checker accepts invalid YAML and rejects valid YAML.** [check-skill.mjs:33](/work/github/mstack/plugins/mstack-skill-creator/skills/mstack-skill-creator/scripts/check-skill.mjs:33) extracts lines rather than parsing frontmatter. **Reproduce:** use `description: Use when asked: produces a note.`; the checker passes, but YAML parsing fails. Conversely, `description: >-` followed by an indented `Use when…` description fails the opening-word check despite being valid. Both outcomes were reproduced in memory. This undermines R16 and portability; hosts expect YAML frontmatter. [Cursor documentation](https://cursor.com/docs/skills)

4. **[P2] Path traversal can pass the self-containment check.** [check-skill.mjs:61](/work/github/mstack/plugins/mstack-skill-creator/skills/mstack-skill-creator/scripts/check-skill.mjs:61) checks whether a joined path exists, while line 64 rejects only paths beginning with `../`. **Reproduce:** reference `` `scripts/../../shared.md` `` and provide `shared.md` beside the skill folder. The checker passes, as confirmed in memory. Installing only the skill folder then loses the dependency, violating R17. Normalize paths and verify containment; the existing test covers only a leading parent component.

5. **[P2] Skipped large files still produce a clean privacy pass.** [scan-private.mjs:33](/work/github/mstack/plugins/mstack-skill-creator/skills/mstack-skill-creator/scripts/scan-private.mjs:33) skips files larger than 1 MiB, then prints the success line and exits zero. **Reproduce:** scan a text file containing 1 MiB of padding followed by `password = abcdef123456`. The in-memory run returned a warning and “private-data scan passed.” Neither the completion instructions nor tests require resolving this incomplete scan, so R22 can be reported satisfied without examining the credential.

6. **[P2] The baseline setup does not exclude globally installed skills.** [testing.md:16](/work/github/mstack/plugins/mstack-skill-creator/skills/mstack-skill-creator/references/testing.md:16) treats withholding the skill path—or copying a repository without it—as sufficient isolation. **Reproduce:** create a user-scoped skill, then execute both documented CLI runs under the same user account. Both sessions still discover the user-level installation, so “without skill” can use it too. User-level discovery is independent of the repository copy. [Claude Code discovery documentation](https://code.claude.com/docs/en/skills) R14 needs an explicit isolation mechanism and verification of what each run can load.

7. **[P2] Packaging changes happen after their required review.** [SKILL.md:119](/work/github/mstack/plugins/mstack-skill-creator/skills/mstack-skill-creator/SKILL.md:119) performs review before Phase 8 creates manifests, registry entries, notices and README changes. Yet `plugin-packaging.md` instructs the reviewer to inspect those changes. **Reproduce:** follow the numbered phases for a new plugin: the requested packaging diff does not exist at review time, and no review follows packaging. Package before review, and repeat affected checks after review fixes. The eval graders check the review’s reported outcome without checking this ordering.

8. **[P2] The documented benchmark produces misleading measurements.** [testing.md:82](/work/github/mstack/plugins/mstack-skill-creator/skills/mstack-skill-creator/references/testing.md:82) tells callers to omit unavailable timing/token fields, but the bundled aggregator converts absence into measured zeroes. It also hardcodes three runs per configuration at [aggregate_benchmark.py:271](/work/github/mstack/plugins/mstack-skill-creator/skills/mstack-skill-creator/scripts/vendor/anthropic-skill-creator/aggregate_benchmark.py:271), although the documented layout uses one. **Reproduce:** aggregate one graded run per configuration without timing data: the report displays zero time/tokens and claims three runs. The smoke tests assert neither metric availability nor sample count. R18/D24 require unavailable measurements to remain unavailable.

9. **[P2] Existing-skill discovery omits repository skills for local targets.** [workflow-steps.md:56](/work/github/mstack/plugins/mstack-skill-creator/skills/mstack-skill-creator/references/workflow-steps.md:56) searches every repository skill only for plugin targets. **Reproduce:** in a repository without registries, place a matching skill at `skills/sql-review/SKILL.md`, outside the host’s discovery folders, then request a local SQL-review skill. The prescribed search misses it and permits creating a duplicate. R2 requires searching repository skills for either target. The existing-match eval places its fixture inside `.agents/skills`, so it misses this branch.

**Did:** Reviewed the tracked diff and new plugin/docs files against the spec, including the six eval cases and unchanged repository contracts.

**Verified:** Marketplace check, self-check, privacy scan and tracked whitespace check passed. License copy matches the root; both spec copies match. Failure probes ran entirely in memory.

**Noticed:** No additional regression identified in the unchanged plugins.

**Skipped:** File-writing test suites, fixture setup, live host runs and fetch; version-bump validation failed with sandbox `spawnSync git EPERM`.
**Risk:** Passing static checks currently do not establish safe publication or a valid comparison baseline.

## Handling

Processed with `receiving-review.md` without asking the user. Each finding was checked against the files first.

| # | Outcome | Reason or evidence |
|---|---|---|
| 1 | mitigated, not fixed | Confirmed at `generate_review.py:279` (`json.dumps` placed inside a script element). The file stays unchanged, because spec D2 copies it verbatim from the pinned commit. `references/testing.md` now says the page must only be opened for trusted outputs, kept local and never published. Worth reporting upstream |
| 2 | fixed | Reproduced with a new test, "a quoted JSON credential is a hit", which failed. The pattern now allows a quote after the key |
| 3 | fixed | Reproduced with two new tests (a plain value with ": " passed, a ">-" block failed). The checker now reads block scalars and quoted values, and fails a plain value that YAML rejects |
| 4 | fixed | Reproduced with a new test (`scripts/../../shared.md` passed). Named paths are now resolved and must stay inside the skill folder |
| 5 | fixed | Reproduced with a new test (a credential after 1 MB passed). The size limit is removed, so every text file is read whole; binary files are still skipped |
| 6 | fixed | True: user-level skills load in every run of the same account. `references/testing.md` now has the user-scope check and the listing prompt before the baseline |
| 7 | fixed | Confirmed: review (7) came before packaging (8). Packaging is now Phase 7 and the review Phase 8, which also covers packaging; checks rerun after review fixes. Siblings swept: `plugin-packaging.md` and `workflow-steps.md` updated |
| 8 | mitigated, not fixed | Confirmed at `aggregate_benchmark.py:271` (`runs_per_configuration: 3`) and the zero defaults. Unchanged for the same reason as 1. `references/testing.md` now says to report the real run count and the missing metrics instead of quoting those lines |
| 9 | fixed | True: repository skills were searched only for a plugin target. The check now reads every SKILL.md in the target repository for both targets |

Evidence after the fixes: `node --test plugins/mstack-skill-creator/tests/` 40 pass (5 new tests failed first); skill check, private-data scan and marketplace check pass.
