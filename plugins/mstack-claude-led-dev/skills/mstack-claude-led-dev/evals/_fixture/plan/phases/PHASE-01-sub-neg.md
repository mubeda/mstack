# Phase 1: sub and neg

- Goal: sub and neg with tests.
- Round: 1
- Depends on: none
- Owns: `mathlib.py`, `test_mathlib.py`
- Checkpoint: `python3 -m unittest` exits 0.

## Tasks

### Task 1.1: Subtract

- Satisfies: R1
- Depends on: none
- Files: modify `mathlib.py`; test `test_mathlib.py`
- Skills: none
- Tier: cheap
- TDD: red-green
- Done when: `python3 -m unittest` exits 0 and runs 2 tests

Steps

1. [ ] Write the failing test `test_sub` asserting `sub(5, 3) == 2`.
2. [ ] Run `python3 -m unittest`. Expected: FAIL with ImportError.
3. [ ] Implement `sub` in `mathlib.py` returning `a - b`.
4. [ ] Run `python3 -m unittest`. Expected: PASS, 2 tests.

### Task 1.2: Negate

- Satisfies: R2
- Depends on: 1.1
- Files: modify `mathlib.py`; test `test_mathlib.py`
- Skills: none
- Tier: cheap
- TDD: red-green
- Done when: `python3 -m unittest` exits 0 and runs 3 tests

Steps

1. [ ] Write the failing test `test_neg` asserting `neg(4) == -4`.
2. [ ] Run `python3 -m unittest`. Expected: FAIL with ImportError.
3. [ ] Implement `neg` in `mathlib.py` returning `-a`.
4. [ ] Run `python3 -m unittest`. Expected: PASS, 3 tests.
