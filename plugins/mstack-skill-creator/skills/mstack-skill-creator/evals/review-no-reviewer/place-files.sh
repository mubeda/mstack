#!/usr/bin/env bash
set -eu
here="$(cd "$(dirname "$0")" && pwd)"
work="$PWD"
bash "$here/../review-from-vendors/place-files.sh"
rm -rf "$work/bin" "$work/vendors"
mkdir -p "$work/vendors"
sed "s|@WORK@|$work|g" "$here/files/vendors/result-1.md" > "$work/vendors/result-1.md"
