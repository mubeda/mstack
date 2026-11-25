#!/usr/bin/env bash
set -eu
here="$(cd "$(dirname "$0")" && pwd)"
if [ "${OLD_PROGRESS_VARIANT:-executor}" = "owner-only" ]; then
  bash "$here/../_fixture/place.sh" plan "$here"
  node -e '
    const fs = require("node:fs");
    const p = process.argv[1];
    const s = fs.readFileSync(p, "utf8");
    const out = s.replace(
      "| 1.1 | Add remove(notes, text) with a test | 1 | Open | | |",
      "| 1.1 | Add remove(notes, text) with a test | 1 | In progress | mstack-codex-review-workflow | |"
    );
    fs.writeFileSync(p, out);
  ' "$PWD/notes/docs/plans/notes/progress.md"
  (cd "$PWD/notes" && git add -A && git -c user.name=eval -c user.email=eval@example.com commit -q -m "Mark owner")
else
  bash "$here/../_fixture/place.sh" old-plan-ran "$here"
fi
