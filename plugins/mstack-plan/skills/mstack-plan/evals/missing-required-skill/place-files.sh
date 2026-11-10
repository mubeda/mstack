#!/usr/bin/env bash
set -eu
cp -R "$(dirname "$0")/../_fixture/shop" .
# The fixture's project skill is stored as SKILL.md.fixture so installs of this skill do not pick it up.
find shop -name 'SKILL.md.fixture' -exec sh -c 'mv "$1" "${1%.fixture}"' _ {} \;
