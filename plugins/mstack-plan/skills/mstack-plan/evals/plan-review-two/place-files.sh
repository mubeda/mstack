#!/usr/bin/env bash
set -eu
here="$(cd "$(dirname "$0")" && pwd)"
work="$PWD"
for item in AGENTS.md README.md app docs; do
  cp -R "$here/../_fixture/shop/$item" "$work/$item"
done
mkdir -p "$work/docs/plans"
cp -R "$here/../_fixture/sample-plan" "$work/docs/plans/greeting"
node -e '
  const fs = require("node:fs");
  const p = process.argv[1];
  let s = fs.readFileSync(p, "utf8").replace(/^Written by:.*\n/m, "");
  s = s.replace(/^(Plan status:.*)$/m, "$1\nWritten by: unknown");
  fs.writeFileSync(p, s);
' "$work/docs/plans/greeting/progress.md"
git init -q -b main
mkdir -p .git/info
printf '%s\n' '.agents/' 'prompt.md' 'replies/' 'vendors/' 'bin/' >> .git/info/exclude
git add -A
git -c user.name=eval -c user.email=eval@example.com commit -q -m "fixture"
