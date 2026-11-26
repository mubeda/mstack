#!/usr/bin/env bash
# Shared placement helper for review-kind eval cases.
# Usage: bash "<fixture>/place.sh" <plan-variant> [case-dir]
set -eu
variant="${1:?plan variant required (plan | old-plan-ran | old-plan-never-ran)}"
case_dir="${2:-}"
fixture="$(cd "$(dirname "$0")" && pwd)"
work="$PWD"

cp -R "$fixture/repo" "$work/notes"
mkdir -p "$work/notes/docs/plans"
cp -R "$fixture/$variant" "$work/notes/docs/plans/notes"
(
  cd "$work/notes"
  git init -q -b main
  git config user.name eval
  git config user.email eval@example.com
  git add -A
  git commit -q -m "Initial notes repo and plan"
)

mkdir -p "$work/bin" "$work/files"
cp "$fixture/bin/"* "$work/bin/"
cp "$fixture/files/"* "$work/files/"

if [ -n "$case_dir" ] && [ -d "$case_dir/files" ]; then
  cp -R "$case_dir/files/." "$work/"
  find "$work" -maxdepth 4 -type f \( -path "$work/vendors/*" -o -path "$work/files/*" -o -path "$work/bin/*" -o -name 'models.md' -o -name 'research-*.md' \) -print0 | while IFS= read -r -d '' f; do
    node -e 'const fs = require("node:fs"); const [w, p] = process.argv.slice(1); const s = fs.readFileSync(p, "utf8"); if (s.includes("@WORK@")) fs.writeFileSync(p, s.replaceAll("@WORK@", () => w));' "$work" "$f"
  done
fi
chmod +x "$work/bin/"*
