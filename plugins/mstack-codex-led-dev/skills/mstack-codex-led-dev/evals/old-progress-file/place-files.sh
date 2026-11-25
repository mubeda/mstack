#!/usr/bin/env bash
set -eu
case_dir="$(cd "$(dirname "$0")" && pwd)"
DEV_SKILLS_SIDE=claude bash "$case_dir/../_fixture/place.sh" plan "$case_dir"
node -e '
const fs = require("node:fs");
const p = "mathlib/docs/plans/mathlib-functions/progress.md";
let s = fs.readFileSync(p, "utf8");
s = s.replace("Executor: none", "Executor: mstack-claude-pm-codex-dev");
s += "\n- 2026-11-11 1.1 In progress. Owner: mstack-claude-pm-codex-dev.\n";
fs.writeFileSync(p, s);
'
(cd mathlib && git add docs/plans/mathlib-functions/progress.md && git commit -q -m "Old progress file")
