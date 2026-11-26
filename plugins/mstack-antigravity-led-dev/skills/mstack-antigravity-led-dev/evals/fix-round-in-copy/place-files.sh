#!/usr/bin/env bash
set -eu
case_dir="$(cd "$(dirname "$0")" && pwd)"
DEV_SKILLS_SIDE=claude bash "$case_dir/../_fixture/place.sh" plan "$case_dir"
node -e '
const fs = require("node:fs");
const p1 = "mathlib/docs/plans/mathlib-functions/phases/PHASE-01-sub-neg.md";
fs.writeFileSync(p1, fs.readFileSync(p1, "utf8").replace("- Owns: `mathlib.py`, `test_mathlib.py`", "- Owns: `mathlib.py`, `sub_helper.py`, `test_mathlib.py`"));
const pm = "mathlib/docs/plans/mathlib-functions/plan.md";
fs.writeFileSync(pm, fs.readFileSync(pm, "utf8").replace("| `test_mathlib.py` | modify | 1, 2 | `python3 -m unittest` |", "| `sub_helper.py` | create | 1 | `python3 -m unittest` |\n| `test_mathlib.py` | modify | 1, 2 | `python3 -m unittest` |"));
'
(cd mathlib && git add -A && git commit -q -m "Allow sub_helper.py in Phase 1")
