#!/usr/bin/env bash
set -eu
here="$(cd "$(dirname "$0")" && pwd)"
work="$PWD"
cp -R "$here/../_fixture/shop" "$work/shop"
find "$work/shop" -name 'SKILL.md.fixture' -exec sh -c 'mv "$1" "${1%.fixture}"' _ {} \;
mkdir -p "$work/shop/docs/plans"
cp -R "$here/../_fixture/sample-plan" "$work/shop/docs/plans/greeting"
node -e '
  const fs = require("node:fs");
  const p = process.argv[1];
  let s = fs.readFileSync(p, "utf8").replace(/^Written by:.*\n/m, "");
  s = s.replace(/^(Plan status:.*)$/m, "$1\nWritten by: claude");
  fs.writeFileSync(p, s);
' "$work/shop/docs/plans/greeting/progress.md"
git -C "$work/shop" init -q -b main
git -C "$work/shop" add -A
git -C "$work/shop" -c user.name=eval -c user.email=eval@example.com commit -q -m "fixture"
mkdir -p "$work/bin" "$work/vendors"
cp "$here/../_fixture/bin/review-ok" "$work/bin/review-ok"
chmod +x "$work/bin/review-ok"
for f in "$here"/files/vendors/*; do
  [ -f "$f" ] || continue
  sed "s|@WORK@|$work|g" "$f" > "$work/vendors/$(basename "$f")"
done
