# Greeting plan

Status: Approved 2026-11-20 (approved in chat by the user)
Spec: spec.md (Status line: Approved 2026-11-20, sha256 11f0216323e8)
Repository: this repository
Base: main

## Goal
Provide `greet(name)` in `app/greet.py` with unit tests in `app/test_greet.py`.

## Global constraints
- Python standard library only (R1, R2).

## Review focus
- Whitespace-only input must raise `ValueError` (task 1.2).

## Out of scope
- CLI entrypoint (not in spec).

## Sources
- Repository rules: none.

## Stack and commands
- Python 3: `python3 -m unittest discover -s app`

## Phases
| Phase | File | Goal | Round | Depends on | Tier |
|---|---|---|---|---|---|
| 1 | phases/PHASE-01-greet.md | Implement `greet` and empty-name rejection with tests | 1 | none | cheap |

## File map
| Path or external change | Action | Phase | Verification |
|---|---|---|---|
| `app/greet.py` | create | 1 | `python3 -m unittest discover -s app` |
| `app/test_greet.py` | create | 1 | `python3 -m unittest discover -s app` |

Shared files reserved for the executor: `progress.md`.
Parallel conflicts: none.

## Traceability
| Requirement | Tasks |
|---|---|
| R1 | 1.1 |
| R2 | 1.2 |

## End-to-end verification
- `python3 -m unittest discover -s app` exits 0.

## Decisions
- P1. Single phase in `app/`. Alternatives: flat root module (less organized). Decided by: user.
