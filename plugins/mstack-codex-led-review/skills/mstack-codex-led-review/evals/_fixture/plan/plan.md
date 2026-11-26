# Plan: Notes removal and documentation

Status: Approved 2026-11-24 (approved in chat by the user)
Base: main

## Goal

Add `remove(notes, text)` with unit tests in `notes.py` and document `add` and `remove` in `README.md`.

## Global constraints

- Keep `notes.py` standard-library only (Python 3).
- Do not modify `add(notes, text)`.

## Review focus

- `remove` raises `ValueError` when the note is absent.
- `README.md` matches the exact signatures in `notes.py`.

## Out of scope

- Persistence or CLI parsing.

## Sources

- `spec.md` (this folder)
- `notes.py` and `README.md`

## Stack and commands

- Stack: Python 3 standard library
- Test: `python3 -m unittest discover -s . -p 'test_*.py'`
- Lint: none
- Format: none

## Phases

| Phase | Round | Title | File | Depends on |
|---|---|---|---|---|
| 1 | 1 | Remove and document notes | `phases/PHASE-01-notes.md` | none |

## File map

| File | Action | Owning phase |
|---|---|---|
| `notes.py` | modify | 1 |
| `test_notes.py` | create | 1 |
| `README.md` | modify | 1 |

## Traceability

| Requirement | Tasks |
|---|---|
| R1 | 1.1 |
| R2 | 1.2 |

## End-to-end verification

- Run `python3 -m unittest discover -s . -p 'test_*.py'` — exits 0 with all tests passing.
- Check `README.md` lists both `add` and `remove`.

## Decisions

- Approved 2026-11-24.
