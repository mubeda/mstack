# Phase 2: Copied eval tools

- Goal: The benchmark and the review page run from inside the skill folder, from three files copied unchanged from Anthropic's skill creator, with a smoke test.
- Round: 2
- Depends on: 1
- Owns: `plugins/mstack-skill-creator/skills/mstack-skill-creator/scripts/vendor/`, `plugins/mstack-skill-creator/tests/vendor-smoke.test.mjs`
- Must not touch: `plugins/mstack-skill-creator/skills/mstack-skill-creator/THIRD_PARTY_NOTICES.md` (written in task 1.1), `plugins/mstack-skill-creator/skills/mstack-skill-creator/references/` (Phase 3)
- Skills: none
- Read first: `plan.md` › Decisions P3 and P8 (which files, and the folder layout the copied tool reads)
- Checkpoint: `node --test plugins/mstack-skill-creator/tests/vendor-smoke.test.mjs` exits 0. The user can open the static review page the test leaves in its temporary folder when run with `KEEP=1`.

In this file `S` stands for `plugins/mstack-skill-creator/skills/mstack-skill-creator`, `V` for `S/scripts/vendor/anthropic-skill-creator`, and `PIN` for `b9e19e6f44773509fbdd7001d77ff41a49a486c1`.

## Tasks

### Task 2.1: Copy the benchmark and review tools

- Satisfies: R18 (the benchmark and the review page exist), R21 (a licensed source is copied with its license)
- Depends on: 1.1
- Files: create `V/aggregate_benchmark.py`; create `V/generate_review.py`; create `V/viewer.html`; create `V/LICENSE.txt`; test `plugins/mstack-skill-creator/tests/vendor-smoke.test.mjs`
- Interfaces: consumes nothing; produces `python3 V/aggregate_benchmark.py <iteration-folder> --skill-name <name>`, which writes `benchmark.json` and `benchmark.md` into the iteration folder, and `python3 V/generate_review.py <iteration-folder> --skill-name <name> --benchmark <iteration-folder>/benchmark.json --static <out.html>`, which writes one HTML file. The iteration folder holds `eval-<case>/eval_metadata.json` and `eval-<case>/<configuration>/run-<n>/{grading.json,timing.json,outputs/}`.
- Skills: tdd (the smoke test is written before the files are copied)
- Read first: https://github.com/anthropics/skills/tree/b9e19e6f44773509fbdd7001d77ff41a49a486c1/skills/skill-creator (the source of the four files); https://raw.githubusercontent.com/anthropics/skills/b9e19e6f44773509fbdd7001d77ff41a49a486c1/skills/skill-creator/references/schemas.md (the `grading.json`, `timing.json` and `eval_metadata.json` fields the fixture must have; read only, not copied)
- Tier: cheap
- TDD: red-green
- Done when: `node --test plugins/mstack-skill-creator/tests/vendor-smoke.test.mjs` exits 0 with 2 tests passing, and for each of the four files `git hash-object` prints the blob id the upstream tree lists at the pin

Steps

1. [ ] Write `plugins/mstack-skill-creator/tests/vendor-smoke.test.mjs` with `node:test`. It builds, in a temporary directory, `iteration-1/eval-sample/eval_metadata.json` (`eval_name` "sample", a prompt, one assertion) and, for `with_skill` and `without_skill`, `run-1/grading.json` (one expectation with `text`, `passed`, `evidence`, and the summary fields the schema requires), `run-1/timing.json` and `run-1/outputs/result.md`. Test 1 runs the aggregate command and asserts `benchmark.json` exists and its `run_summary` has an entry for both configurations. Test 2 runs the review command with `--static` and asserts the HTML file exists and contains the text "sample". Both tests skip, with the message "python3 not found", when `python3 --version` fails.
2. [ ] Run `node --test plugins/mstack-skill-creator/tests/vendor-smoke.test.mjs`. Expected: FAIL, because `aggregate_benchmark.py` does not exist ("No such file or directory").
3. [ ] Download the four files unchanged from `https://raw.githubusercontent.com/anthropics/skills/PIN/skills/skill-creator/` (`scripts/aggregate_benchmark.py`, `eval-viewer/generate_review.py`, `eval-viewer/viewer.html`, `LICENSE.txt`) into `V/`. Do not edit them.
4. [ ] Run `gh api "repos/anthropics/skills/git/trees/PIN?recursive=1" --jq '.tree[] | select(.path | startswith("skills/skill-creator/")) | "\(.sha) \(.path)"'` and `git hash-object` on each copied file. Expected: each of the four ids equals the id listed for its upstream path.
5. [ ] Run `node --test plugins/mstack-skill-creator/tests/vendor-smoke.test.mjs`. Expected: PASS, 2 tests. If a test fails because the fixture lacks a field the tool reads, add the field to the fixture, never to the copied file.
6. [ ] Prove the test can fail: rename the fixture folder `eval-sample` to `sample` inside the test, then run `node --test plugins/mstack-skill-creator/tests/vendor-smoke.test.mjs`. Expected: FAIL, because `run_summary` is empty. Restore the test and run it again. Expected: PASS, 2 tests.
7. [ ] Run `node scripts/check-marketplace.mjs`. Expected: "Marketplace checks passed: 7 Claude plugins, 7 Codex plugins".
8. [ ] Run `node plugins/mstack-skill-creator/skills/mstack-skill-creator/scripts/scan-private.mjs plugins/mstack-skill-creator/skills/mstack-skill-creator/scripts/vendor`. Expected: "private-data scan passed". A hit inside a copied file is not edited away. Log it as a Ruling with a note that says the value is an example, when it is one.
