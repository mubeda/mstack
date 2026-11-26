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
- Tier: standard
- TDD: red-green
- Done when: `python3 -m unittest test_notes.py` exits 0

Steps

1. [ ] Add tests and implement `remove(notes, text)` in `notes.py`. Expected: tests pass.
PHASE_EOF

(cd "$PWD/notes" && git add -A && git commit -q -m "Update fixture plan for case")
