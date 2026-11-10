# Phase 1: Scaffold and checkers

- Goal: The plugin exists in both registries, both repository checks pass, and two tested scripts check a skill folder for format problems and private data.
- Round: 1
- Depends on: none
- Owns: `plugins/mstack-skill-creator/.claude-plugin/`, `plugins/mstack-skill-creator/.codex-plugin/`, `plugins/mstack-skill-creator/skills/mstack-skill-creator/{SKILL.md,LICENSE,THIRD_PARTY_NOTICES.md}`, `plugins/mstack-skill-creator/skills/mstack-skill-creator/scripts/check-skill.mjs`, `plugins/mstack-skill-creator/skills/mstack-skill-creator/scripts/scan-private.mjs`, `plugins/mstack-skill-creator/tests/check-skill.test.mjs`, `plugins/mstack-skill-creator/tests/scan-private.test.mjs`, `.claude-plugin/marketplace.json`, `.agents/plugins/marketplace.json`, `README.md`
- Must not touch: any other plugin folder, `scripts/`, `AGENTS.md`
- Skills: none
- Read first: `AGENTS.md` (public-repository rule and what a skill folder must hold); `scripts/check-marketplace.mjs` (the exact assertions the scaffold must meet)
- Checkpoint: `node scripts/check-marketplace.mjs` prints "Marketplace checks passed: 7 Claude plugins, 7 Codex plugins", and `node --test plugins/mstack-skill-creator/tests/` exits 0. The user can see the new row in the README table.

In this file `S` stands for `plugins/mstack-skill-creator/skills/mstack-skill-creator`.

## Tasks

### Task 1.1: Plugin scaffold

- Satisfies: R20 (scenario "checks pass", for this plugin itself), R21 (the credit a license requires is recorded inside the skill folder)
- Depends on: none
- Files: create `plugins/mstack-skill-creator/.claude-plugin/plugin.json`; create `plugins/mstack-skill-creator/.codex-plugin/plugin.json`; create `S/SKILL.md`; create `S/LICENSE`; create `S/THIRD_PARTY_NOTICES.md`; modify `.claude-plugin/marketplace.json`; modify `.agents/plugins/marketplace.json`; modify `README.md`
- Interfaces: consumes nothing; produces the skill folder `S` with a minimal `SKILL.md` that Phase 4 replaces, and the notices file that no later task edits
- Skills: none
- Read first: `plugins/mstack-handoff/.claude-plugin/plugin.json` and `plugins/mstack-handoff/.codex-plugin/plugin.json` (field names and the `interface` block to mirror); `plugins/mstack-handoff/skills/mstack-handoff/THIRD_PARTY_NOTICES.md` (the table and license-text layout); `README.md` (the skills table and the two install sections)
- Tier: standard
- TDD: exempt (configuration and documentation with no logic; the marketplace check is the proof)
- Done when: `node scripts/check-marketplace.mjs` exits 0 and prints "Marketplace checks passed: 7 Claude plugins, 7 Codex plugins"

Steps

1. [ ] Create both manifests with `name` `mstack-skill-creator`, `version` `0.1.0`, the author and license fields copied from `plugins/mstack-handoff`, and in the Codex manifest `"skills": "./skills/"` and an `interface` block (display name "mstack skill creator", category as the handoff plugin uses).
2. [ ] Copy the root `LICENSE` to `S/LICENSE`. Run `cmp LICENSE plugins/mstack-skill-creator/skills/mstack-skill-creator/LICENSE`. Expected: no output, exit 0.
3. [ ] Write `S/SKILL.md` with frontmatter `name: mstack-skill-creator` and a `description` that starts with "Use when" and is under 1024 characters, and a body of one paragraph saying what the skill does. Phase 4 writes the full file.
4. [ ] Write `S/THIRD_PARTY_NOTICES.md` in the layout of the handoff plugin. Rows: Anthropic skill-creator (three files copied unchanged into `scripts/vendor/anthropic-skill-creator/` at commit `b9e19e6f44773509fbdd7001d77ff41a49a486c1`, and the comparison-test method adapted in own words, Apache-2.0); OpenAI Codex skill-creator (validation rules and progressive disclosure adapted in own words, Apache-2.0); obra/superpowers writing-skills (the failing baseline before writing and the trigger-first description, adapted in own words, MIT, Copyright (c) 2025 Jesse Vincent); tripleyak/SkillForge (the existing-skill check before creating, idea only, MIT, with its copyright line read from its LICENSE file). State that Cursor's built-in creator is named but not copied because it carries no license. Include the MIT text once and the sentence that the Apache-2.0 text is in `LICENSE` beside this file and in `scripts/vendor/anthropic-skill-creator/LICENSE.txt`.
5. [ ] Add the entry to `.claude-plugin/marketplace.json` (`name`, `description`, `version` `0.1.0`, `author`, `source` `./plugins/mstack-skill-creator`, `category` as its neighbors) and set `metadata.version` to `0.3.0`.
6. [ ] Add the entry to `.agents/plugins/marketplace.json` (`name`, `source` `{ "source": "local", "path": "./plugins/mstack-skill-creator" }`, `policy` `{ "installation": "AVAILABLE", "authentication": "ON_INSTALL" }`, `category`).
7. [ ] Add the row to the README skills table and the install lines to both install sections. Add one paragraph for Cursor and OpenCode: they install with the skills CLI, `npx skills add mubeda/mstack --skill mstack-skill-creator -a cursor opencode`, because both hosts load the shared agents skills folder.
8. [ ] Run `node scripts/check-marketplace.mjs`. Expected: "Marketplace checks passed: 7 Claude plugins, 7 Codex plugins".
9. [ ] Run `claude plugin validate .`. Expected: exit 0.
10. [ ] Run the two prose lint commands from `plan.md` on `README.md`, `S/SKILL.md` and `S/THIRD_PARTY_NOTICES.md`. Expected: no output.

### Task 1.2: Static checker for a skill folder

- Satisfies: R9 (scenario "default"), R10 (scenario "wrong opening or length"), R12 (no host tool outside the host table), R16 (scenarios "a file it names does not exist" and "a clean skill"), R17 (no path outside the folder)
- Depends on: 1.1
- Files: create `S/scripts/check-skill.mjs`; test `plugins/mstack-skill-creator/tests/check-skill.test.mjs`
- Interfaces: consumes nothing; produces the command `node check-skill.mjs <skill-folder>`, which prints one `FAIL  <message>` line per failure and one `WARN  <message>` line per warning, then `skill check passed: <skill-folder>` when there is no failure. Exit 0 with no failure, 1 with any failure, 2 on a usage error.
- Skills: tdd (write each rule's failing test before the rule)
- Read first: `scripts/check-marketplace.mjs` (the regex for named `references/` and `scripts/` files, reused so both checks agree); `plugins/mstack-handoff/skills/mstack-handoff/scripts/check-handoff.mjs` (the house style for a check script)
- Tier: standard
- TDD: red-green
- Done when: `node --test plugins/mstack-skill-creator/tests/check-skill.test.mjs` exits 0 with 14 tests passing, and `node plugins/mstack-skill-creator/skills/mstack-skill-creator/scripts/check-skill.mjs plugins/mstack-skill-creator/skills/mstack-skill-creator` prints "skill check passed"

Rules the script enforces, each with its level.

| Rule | Level |
|---|---|
| `SKILL.md` exists and opens with a closed `---` frontmatter block | FAIL |
| `name` is present, matches `^[a-z0-9]+(-[a-z0-9]+)*$`, is at most 64 characters, equals the folder name | FAIL |
| `description` is present, at most 1024 characters, starts with `Use when` | FAIL |
| A frontmatter field other than `name` and `description` | WARN, naming the field as host-only or optional |
| A `references/<file>` or `scripts/<file>` named in `SKILL.md` or in `references/*.md` does not exist (the marketplace check's regex, so a path with a placeholder prefix is skipped) | FAIL |
| A second `SKILL.md` anywhere below the folder | FAIL |
| A link or backticked path that starts with `../` in `SKILL.md` or `references/*.md` | FAIL |
| `AskUserQuestion`, `codex exec`, `claude -p`, `opencode run` or `cursor-agent` in `SKILL.md` on a line that is not a table row | FAIL |
| `SKILL.md` has more than 500 lines | WARN |

Steps

1. [ ] Write `plugins/mstack-skill-creator/tests/check-skill.test.mjs` with `node:test`. A helper builds a skill folder in a temporary directory from a map of file names to text and runs the script with `spawnSync`. Write 14 tests: a clean skill passes with exit 0; missing `SKILL.md`; unclosed frontmatter; name with an uppercase letter; name of 65 characters; name different from the folder; missing description; description of 1025 characters; description that does not start with "Use when"; an extra frontmatter field gives WARN and exit 0; a named `references/x.md` that is missing; "path with a placeholder prefix is skipped" (`<skill>/scripts/x.py` passes); a nested `SKILL.md`; a host tool name outside a table row fails while the same name inside a table row passes.
2. [ ] Run `node --test plugins/mstack-skill-creator/tests/check-skill.test.mjs`. Expected: FAIL, because `check-skill.mjs` does not exist and every spawn returns a non-zero status with "Cannot find module".
3. [ ] Implement `S/scripts/check-skill.mjs` with the rules in the table, the minimum that makes the tests pass. No dependency.
4. [ ] Run `node --test plugins/mstack-skill-creator/tests/check-skill.test.mjs`. Expected: PASS, 14 tests.
5. [ ] Prove the test can fail: make the description rule accept any opening, then run `node --test plugins/mstack-skill-creator/tests/check-skill.test.mjs`. Expected: FAIL in the "does not start with Use when" test. Restore the code and run it again. Expected: PASS, 14 tests.
6. [ ] Run `node plugins/mstack-skill-creator/skills/mstack-skill-creator/scripts/check-skill.mjs plugins/mstack-skill-creator/skills/mstack-skill-creator`. Expected: "skill check passed".
7. [ ] Run `node scripts/check-marketplace.mjs`. Expected: "Marketplace checks passed: 7 Claude plugins, 7 Codex plugins".

### Task 1.3: Private-data scan

- Satisfies: R22 (scenario "a home path")
- Depends on: 1.1
- Files: create `S/scripts/scan-private.mjs`; test `plugins/mstack-skill-creator/tests/scan-private.test.mjs`
- Interfaces: consumes nothing; produces the command `node scan-private.mjs <folder>`, which reads every text file below the folder, prints one `HIT  <file>:<line>: <kind>` line per finding and never the matched secret value, then `private-data scan passed: <folder>` when there is none. Exit 0 with no hit, 1 with any hit, 2 on a usage error. Kinds: `home path`, `private host`, `credential`, `email address`.
- Skills: tdd (write each pattern's failing test before the pattern)
- Read first: `plugins/mstack-handoff/skills/mstack-handoff/scripts/check-handoff.mjs` (the credential patterns, copied into this script because a skill cannot import from another skill's folder); `AGENTS.md` (the list of data that must never be committed)
- Tier: most capable
- TDD: red-green
- Done when: `node --test plugins/mstack-skill-creator/tests/scan-private.test.mjs` exits 0 with 9 tests passing, and `node plugins/mstack-skill-creator/skills/mstack-skill-creator/scripts/scan-private.mjs plugins/mstack-skill-creator` exits 0

Patterns.

| Kind | Hit | Not a hit |
|---|---|---|
| home path | `/home/<letters>/`, `/Users/<letters>/`, `C:\Users\<letters>\` with a real name | the same with a placeholder in angle brackets, such as `/home/<name>/`, and `~/` |
| private host | an IPv4 address in 10.0.0.0/8, 172.16.0.0/12 or 192.168.0.0/16; a host name ending in `.internal`, `.corp`, `.lan` or `.local` | `127.0.0.1`, `localhost`, `example.com` |
| credential | the token shapes and the `key = value` assignment pattern in `check-handoff.mjs` | the bare words "token" or "password" in prose |
| email address | any address | an address at `example.com`, `example.org` or `users.noreply.github.com`, and `noreply@anthropic.com` |

Steps

1. [ ] Write `plugins/mstack-skill-creator/tests/scan-private.test.mjs` with `node:test`, building folders in a temporary directory. Write 9 tests: a clean folder passes; "real home path is a hit"; "placeholder path is not a hit"; a 192.168 address is a hit; `127.0.0.1` is not a hit; a GitHub token shape is a hit and its value is absent from the output; the word "password" in prose is not a hit; a real-looking email address is a hit; an `example.com` address is not a hit.
2. [ ] Run `node --test plugins/mstack-skill-creator/tests/scan-private.test.mjs`. Expected: FAIL, because `scan-private.mjs` does not exist.
3. [ ] Implement `S/scripts/scan-private.mjs` with the patterns in the table. Skip binary files, and skip files larger than 1 MB with a `WARN` line that names them.
4. [ ] Run `node --test plugins/mstack-skill-creator/tests/scan-private.test.mjs`. Expected: PASS, 9 tests.
5. [ ] Prove the test can fail: remove the placeholder exception, then run `node --test plugins/mstack-skill-creator/tests/scan-private.test.mjs`. Expected: FAIL in "placeholder path is not a hit". Restore the code and run it again. Expected: PASS, 9 tests.
6. [ ] Run `node plugins/mstack-skill-creator/skills/mstack-skill-creator/scripts/scan-private.mjs plugins/mstack-skill-creator`. Expected: "private-data scan passed". If a test file's own sample data is reported, build that sample at run time from parts, so that no literal hit is stored in the repository.
7. [ ] Run `node scripts/check-marketplace.mjs`. Expected: "Marketplace checks passed: 7 Claude plugins, 7 Codex plugins".

### Task 1.4: Checker gaps from the plan review

- Satisfies: R16 (scenario "a file it names does not exist", for nested and relative paths), R17, R22 (scenario "a home path", Windows form)
- Depends on: 1.2, 1.3
- Files: modify `S/scripts/check-skill.mjs`; modify `S/scripts/scan-private.mjs`; modify `S/references/writing-rules.md`; test `plugins/mstack-skill-creator/tests/check-skill.test.mjs`; test `plugins/mstack-skill-creator/tests/scan-private.test.mjs`
- Interfaces: consumes the commands of tasks 1.2 and 1.3, unchanged; produces the same commands with wider path checks
- Skills: tdd (each new rule's failing test first)
- Read first: `reviews/plan-review-1.md` (findings 8, 9 and 10)
- Tier: standard
- TDD: red-green
- Done when: `node --test plugins/mstack-skill-creator/tests/` exits 0 with every test passing, and `node plugins/mstack-skill-creator/skills/mstack-skill-creator/scripts/check-skill.mjs plugins/mstack-skill-creator/skills/mstack-skill-creator` prints "skill check passed"

Steps

1. [ ] Add tests to `check-skill.test.mjs`: a missing `scripts/vendor/tool/run.py` fails; a missing `./scripts/run.py` fails; an existing nested file passes; a parent-folder link fails; 501 lines warn; a name of exactly 64 characters and a description of exactly 1024 characters pass. Add tests to `scan-private.test.mjs`: a Windows home path is a hit; a host name ending in `.internal` is a hit; a `token = <value>` assignment is a hit.
2. [ ] Run `node --test plugins/mstack-skill-creator/tests/`. Expected: FAIL in the two missing-nested-path tests, which the current regex does not see.
3. [ ] Widen the named-file pattern in `check-skill.mjs` to `references/` and `scripts/` paths with any depth and an optional `./` in front, still skipping a path after a placeholder such as `<skill>/`.
4. [ ] Run `node --test plugins/mstack-skill-creator/tests/`. Expected: PASS, every test.
5. [ ] Prove the test can fail: restore the old pattern, then run `node --test plugins/mstack-skill-creator/tests/`. Expected: FAIL in the nested-path tests. Put the new pattern back and run it again. Expected: PASS.
6. [ ] In `writing-rules.md` › The host table, state the rule's scope: the check reads only `SKILL.md`, and the host files in `references/` may name host tools.
7. [ ] Run `node plugins/mstack-skill-creator/skills/mstack-skill-creator/scripts/check-skill.mjs plugins/mstack-skill-creator/skills/mstack-skill-creator` and `node scripts/check-marketplace.mjs`. Expected: "skill check passed" and "Marketplace checks passed: 7 Claude plugins, 7 Codex plugins".
