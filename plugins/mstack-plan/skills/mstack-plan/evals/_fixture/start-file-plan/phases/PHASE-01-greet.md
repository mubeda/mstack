# Phase 1: Greet

- Goal: greet users by name and reject empty or whitespace-only names, with tests.
- Round: 1
- Depends on: none
- Owns: `app/greet.py`, `app/test_greet.py`
- Checkpoint: `python3 -m unittest discover -s app` exits 0.

## Tasks

### Task 1.1: Greet by name

- Satisfies: R1
- Depends on: none
- Files: create `app/greet.py`; test `app/test_greet.py`
- Interfaces: produces `greet(name: str) -> str`
- Skills: none
- Tier: cheap
- TDD: red-green
- Done when: `python3 -m unittest discover -s app` exits 0 and prints OK

Steps

1. [ ] Write the failing test `test_greets` in `app/test_greet.py` asserting `greet("Ada") == "Hello, Ada"`.
2. [ ] Run `python3 -m unittest discover -s app`. Expected: FAIL with ImportError.
3. [ ] Implement `greet(name: str) -> str` in `app/greet.py`.
4. [ ] Run `python3 -m unittest discover -s app`. Expected: PASS, 1 test.

### Task 1.2: Reject empty names

- Satisfies: R2
- Depends on: 1.1
- Files: modify `app/greet.py`; test `app/test_greet.py`
- Interfaces: consumes `greet(name: str) -> str`
- Skills: none
- Tier: cheap
- TDD: red-green
- Done when: `python3 -m unittest discover -s app` exits 0 and prints OK

Steps

1. [ ] Write the failing test `test_empty` in `app/test_greet.py` asserting `ValueError` for empty and whitespace-only names.
2. [ ] Run `python3 -m unittest discover -s app`. Expected: FAIL, 1 failure.
3. [ ] Raise `ValueError` when `not name.strip()` in `app/greet.py`.
4. [ ] Run `python3 -m unittest discover -s app`. Expected: PASS, 2 tests.
