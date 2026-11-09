# Phase 1: Greet

- Goal: greet users by name, with tests.
- Round: 1
- Depends on: none
- Owns: `greet.py`, `test_greet.py`
- Checkpoint: `python3 -m unittest` exits 0.

## Tasks

### Task 1.1: Greet by name

- Satisfies: R1
- Depends on: none
- Files: create `greet.py`; test `test_greet.py`
- Skills: none
- Tier: cheap
- TDD: red-green
- Done when: `python3 -m unittest` exits 0 and prints OK

Steps

1. [ ] Write the failing test `test_greets` asserting `greet("Ada") == "Hello, Ada"`.
2. [ ] Run `python3 -m unittest`. Expected: FAIL with ImportError.
3. [ ] Implement `greet(name: str) -> str` in `greet.py`.
4. [ ] Run `python3 -m unittest`. Expected: PASS, 1 test.

### Task 1.2: Reject empty names

- Satisfies: R2
- Depends on: 1.1
- Files: modify `greet.py`; test `test_greet.py`
- Skills: none
- Tier: cheap
- TDD: red-green
- Done when: `python3 -m unittest` exits 0

Steps

1. [ ] Write the failing test `test_empty` asserting `ValueError`.
2. [ ] Run `python3 -m unittest`. Expected: FAIL, 1 failure.
3. [ ] Raise `ValueError` for an empty name.
4. [ ] Run `python3 -m unittest`. Expected: PASS, 2 tests.
