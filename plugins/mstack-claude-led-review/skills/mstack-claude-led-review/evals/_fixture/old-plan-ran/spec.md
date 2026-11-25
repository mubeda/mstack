# Notes removal and documentation

Status: Approved 2026-11-24

## Goal

Allow removing a note from the list and document both `add` and `remove` in `README.md`.

## Requirements

### R1. Remove a note
GIVEN a list of notes containing `"buy milk"`
WHEN `remove(notes, "buy milk")` is called
THEN the first matching item is removed and the updated list is returned; if the item is absent, raise `ValueError`.

### R2. Document add and remove
GIVEN `README.md`
WHEN a reader checks the API section
THEN both `add(notes, text)` and `remove(notes, text)` are documented with one usage example each.
