#!/usr/bin/env bash
set -eu
here="$(cd "$(dirname "$0")" && pwd)"
bash "$here/../_fixture/place.sh" plan "$here"
cat > "$PWD/notes/docs/plans/notes/phases/PHASE-01-notes.md" <<'PHASE_EOF'
# Phase 1: Notes core

- Goal: Implement the requested notes operations with tests.
- Round: 1
- Depends on: none
- Owns: `notes.py`, `format.py`, `test_notes.py`, `README.md`
- Must not touch: none
- Checkpoint: `python3 -m unittest discover -s . -p 'test_*.py'` exits 0.

## Tasks

### Task 1.1: Add remove(notes, text) with a test

- Satisfies: R1
- Depends on: none
- Files: modify `notes.py`; create `test_notes.py`
- Skills: none
- Tier: most capable
- TDD: red-green
- Done when: `python3 -m unittest test_notes.py` exits 0

Steps

1. [ ] Implement `remove(notes, text)` in `notes.py` with tests. Expected: tests pass.

### Task 1.2: Document add and remove in README.md

- Satisfies: R2
- Depends on: none
- Files: modify `README.md`
- Skills: none
- Tier: most capable
- TDD: exempt (documentation edit)
- Done when: `grep -q 'add(notes, text)' README.md && grep -q 'remove(notes, text)' README.md` exits 0

Steps

1. [ ] Document `add(notes, text)` and `remove(notes, text)` in `README.md`. Expected: exit 0.
PHASE_EOF

(cd "$PWD/notes" && git add -A && git commit -q -m "Update fixture plan for case")
