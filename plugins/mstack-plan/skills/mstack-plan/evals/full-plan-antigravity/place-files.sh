#!/usr/bin/env bash
set -eu
here="$(cd "$(dirname "$0")" && pwd)"
cp -R "$here/../_fixture/shop" .
find shop -name 'SKILL.md.fixture' -exec sh -c 'mv "$1" "${1%.fixture}"' _ {} \;
git -C shop init -q -b main
git -C shop add -A
git -C shop -c user.name=eval -c user.email=eval@example.com commit -q -m "fixture"
