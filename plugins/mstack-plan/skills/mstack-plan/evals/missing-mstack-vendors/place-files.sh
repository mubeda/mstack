#!/usr/bin/env bash
set -eu
cp -R "$(dirname "$0")/../_fixture/shop" .
find shop -name 'SKILL.md.fixture' -exec sh -c 'mv "$1" "${1%.fixture}"' _ {} \;
