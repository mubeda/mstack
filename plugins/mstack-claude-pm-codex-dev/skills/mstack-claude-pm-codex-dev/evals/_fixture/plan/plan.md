# mathlib functions

Status: Approved 2026-11-10 (approved in chat by the user)
Spec: spec.md (Status line: Approved 2026-11-10, sha256 6c671cb0f217)
Base: main

## Goal
Four small pure functions in mathlib.py, each with a test.
## Global constraints
Python 3 standard library only. Each function in `mathlib.py`, each test in `test_mathlib.py`.
## Review focus
None found.
## Out of scope
None.
## Sources
- Repository rules: AGENTS.md
## Stack and commands
Python, `python3 -m unittest`.
## Phases
| Phase | File | Goal | Round | Depends on | Tier |
|---|---|---|---|---|---|
| 1 | phases/PHASE-01-sub-neg.md | sub and neg | 1 | none | cheap |
| 2 | phases/PHASE-02-mul-square.md | mul and square | 2 | 1 | cheap |
## File map
| Path | Action | Phase | Verification |
|---|---|---|---|
| `mathlib.py` | modify | 1, 2 | `python3 -m unittest` |
| `test_mathlib.py` | modify | 1, 2 | `python3 -m unittest` |
## Traceability
| Requirement | Tasks |
|---|---|
| R1 | 1.1 |
| R2 | 1.2 |
| R3 | 2.1 |
| R4 | 2.2 |
## End-to-end verification
`python3 -m unittest` passes with 5 tests.
## Decisions
- P1. Two phases of two functions each. Decided by: agent's call.
