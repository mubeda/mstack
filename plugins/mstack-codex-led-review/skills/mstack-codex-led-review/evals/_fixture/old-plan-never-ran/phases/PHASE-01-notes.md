# Phase 1: Remove and document notes

- Goal: Implement `remove(notes, text)` with tests and document both `add` and `remove` in `README.md`.
- Round: 1
- Depends on: none
- Owns: `notes.py`, `test_notes.py`, `README.md`
- Must not touch: none
- Checkpoint: `python3 -m unittest discover -s . -p 'test_*.py'` exits 0 and `README.md` documents `add` and `remove`.

## Tasks

### Task 1.1: Add remove(notes, text) with a test

- Satisfies: R1
- Depends on: none
- Files: modify `notes.py`; create `test_notes.py`
- Skills: none
- Tier: standard
- TDD: red-green
- Done when: `python3 -m unittest test_notes.py` exits 0 with both removal and missing-item tests passing

Steps

1. [ ] Create `test_notes.py` testing `remove(["buy milk", "call mom"], "buy milk") == ["call mom"]` and `remove(["buy milk"], "absent")` raising `ValueError`. Run `python3 -m unittest test_notes.py`. Expected: FAIL (`ImportError: cannot import name 'remove'`).
2. [ ] Implement `remove(notes, text)` in `notes.py` using `notes.remove(text); return notes`. Run `python3 -m unittest test_notes.py`. Expected: PASS (2 tests OK).
3. [ ] Prove the test can fail by temporarily removing the `notes.remove(text)` call, run `python3 -m unittest test_notes.py`. Expected: FAIL. Restore it and run `python3 -m unittest test_notes.py`. Expected: PASS.

### Task 1.2: Document add and remove in README.md

- Satisfies: R2
- Depends on: none
- Files: modify `README.md`
- Skills: none
- Tier: cheap
- TDD: exempt (documentation edit with no executable code)
- Done when: `grep -q 'add(notes, text)' README.md && grep -q 'remove(notes, text)' README.md` exits 0

Steps

1. [ ] Add an `## API` section to `README.md` documenting `add(notes, text)` and `remove(notes, text)` with one short usage example each. Run `grep -q 'add(notes, text)' README.md && grep -q 'remove(notes, text)' README.md`. Expected: exit 0.
