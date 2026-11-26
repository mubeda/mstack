#!/usr/bin/env bash
set -eu
case_dir="$(cd "$(dirname "$0")" && pwd)"
DEV_SKILLS_SIDE=both bash "$case_dir/../_fixture/place.sh" plan "$case_dir"
node -e '
const fs = require("node:fs");
for (const f of ["mathlib/docs/plans/mathlib-functions/phases/PHASE-01-sub-neg.md", "mathlib/docs/plans/mathlib-functions/phases/PHASE-02-mul-square.md"]) {
  let s = fs.readFileSync(f, "utf8");
  s = s.replaceAll("- Tier: cheap", "- Tier: cheap\n- Approved models: gpt-6.2-astra (user, 2026-11-22)");
  fs.writeFileSync(f, s);
}
'
(cd mathlib && git add -A && git commit -q -m "Add Approved models lines")
