# Greeting spec

Status: Approved 2026-11-20

## Goals
Greet users by name and reject empty or whitespace-only names.

### R1. Greet by name
WHEN given a non-empty name, `greet(name)` SHALL return `"Hello, <name>"`.

### R2. Reject empty or whitespace-only names
WHEN given an empty string or a whitespace-only string, `greet(name)` SHALL raise `ValueError`.
