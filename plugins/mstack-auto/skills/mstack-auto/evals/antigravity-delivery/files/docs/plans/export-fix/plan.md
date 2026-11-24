# Fix the CSV export of orders

Status: Approved 2026-11-20 (approved in chat by the user)
Spec: spec.md (Status line: Approved 2026-11-19, sha256 3f9a1c0b7d2e)
Repository: this repository
Base: main

## Goal
An export of more than 1,000 orders holds every order once.

## Phases
1. Page through the orders in the export query.
2. Test the export with 2,500 orders.
