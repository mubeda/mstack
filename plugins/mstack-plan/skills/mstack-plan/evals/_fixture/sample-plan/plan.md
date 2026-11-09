# Greeting plan

Status: Draft
Spec: spec.md (Status line: Approved 2026-11-09, sha256 x)

## Goal
Greet.
## Global constraints
None.
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
| 1 | phases/PHASE-01-greet.md | Greet | 1 | none | standard |
## File map
| Path | Action | Phase | Verification |
|---|---|---|---|
| `greet.py` | create | 1 | `python3 -m unittest` |
## Traceability
| Requirement | Tasks |
|---|---|
| R1 | 1.1 |
| R2 | 1.2 |
## End-to-end verification
`python3 -m unittest` passes.
## Decisions
- P1. One phase. Decided by: agent's call.
