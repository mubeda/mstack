#!/usr/bin/env bash
set -eu
case_dir="$(cd "$(dirname "$0")" && pwd)"
DEV_SKILLS_SIDE=codex bash "$case_dir/../_fixture/place.sh" plan "$case_dir"
node -e '
const fs = require("node:fs");
const p = "mathlib/docs/plans/mathlib-functions/phases/PHASE-02-mul-square.md";
fs.writeFileSync(p, fs.readFileSync(p, "utf8").replaceAll("- Tier: cheap", "- Tier: standard"));
const pm = "mathlib/docs/plans/mathlib-functions/plan.md";
fs.writeFileSync(pm, fs.readFileSync(pm, "utf8").replace("| 2 | phases/PHASE-02-mul-square.md | mul and square | 2 | 1 | cheap |", "| 2 | phases/PHASE-02-mul-square.md | mul and square | 2 | 1 | standard |"));
'
(cd mathlib && git add -A && git commit -q -m "Phase 2 standard tier")
