# Phase 2: mul and square

- Goal: mul and square with tests.
- Round: 2
- Depends on: 1
- Owns: `mathlib.py`, `test_mathlib.py`
- Checkpoint: `python3 -m unittest` exits 0.

## Tasks

### Task 2.1: Multiply

- Satisfies: R3
- Depends on: none
- Files: modify `mathlib.py`; test `test_mathlib.py`
- Skills: none
- Tier: cheap
- TDD: red-green
- Done when: `python3 -m unittest` exits 0 and runs 4 tests

Steps

1. [ ] Write the failing test `test_mul` asserting `mul(4, 3) == 12`.
2. [ ] Run `python3 -m unittest`. Expected: FAIL with ImportError.
3. [ ] Implement `mul` in `mathlib.py` returning `a * b`.
4. [ ] Run `python3 -m unittest`. Expected: PASS, 4 tests.

### Task 2.2: Square

- Satisfies: R4
- Depends on: 2.1
- Files: modify `mathlib.py`; test `test_mathlib.py`
- Skills: none
- Tier: cheap
- TDD: red-green
- Done when: `python3 -m unittest` exits 0 and runs 5 tests

Steps

1. [ ] Write the failing test `test_square` asserting `square(5) == 25`.
2. [ ] Run `python3 -m unittest`. Expected: FAIL with ImportError.
3. [ ] Implement `square` in `mathlib.py` returning `a * a`.
4. [ ] Run `python3 -m unittest`. Expected: PASS, 5 tests.
