#!/usr/bin/env bash
set -eu
here="$(cd "$(dirname "$0")" && pwd)"
work="$PWD"
bash "$here/../plan-review-two/place-files.sh"
mkdir -p "$work/bin" "$work/vendors"
cp "$here/../_fixture/bin/review-ok" "$work/bin/review-ok"
chmod +x "$work/bin/review-ok"
sed "s|@WORK@|$work|g" "$here/files/vendors/result-1.md" > "$work/vendors/result-1.md"
