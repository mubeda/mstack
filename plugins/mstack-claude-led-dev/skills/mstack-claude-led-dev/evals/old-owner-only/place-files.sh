#!/usr/bin/env bash
set -eu
case_dir="$(cd "$(dirname "$0")" && pwd)"
DEV_SKILLS_SIDE=codex bash "$case_dir/../_fixture/place.sh" plan "$case_dir"
node -e '
const fs = require("node:fs");
const p = "mathlib/docs/plans/mathlib-functions/progress.md";
let s = fs.readFileSync(p, "utf8");
s = s.replace("| 1.1 | Subtract | 1 | Open | | |", "| 1.1 | Subtract | 1 | Open | mstack-claude-pm-codex-dev | |");
fs.writeFileSync(p, s);
'
(cd mathlib && git add docs/plans/mathlib-functions/progress.md && git commit -q -m "Old owner only")
