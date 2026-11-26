#!/usr/bin/env bash
set -eu
here="$(cd "$(dirname "$0")" && pwd)"
work="$PWD"
cp -R "$here/../_fixture/shop" "$work/shop"
# The fixture's project skill is stored as SKILL.md.fixture so installs of this skill do not pick it up.
find "$work/shop" -name 'SKILL.md.fixture' -exec sh -c 'mv "$1" "${1%.fixture}"' _ {} \;
git -C "$work/shop" init -q -b main
git -C "$work/shop" add -A
git -C "$work/shop" -c user.name=eval -c user.email=eval@example.com commit -q -m "fixture"
mkdir -p "$work/bin" "$work/vendors"
cp "$here/../_fixture/bin/review-ok" "$work/bin/review-ok"
chmod +x "$work/bin/review-ok"
sed "s|@WORK@|$work|g" "$here/files/vendors/result-1.md" > "$work/vendors/result-1.md"
