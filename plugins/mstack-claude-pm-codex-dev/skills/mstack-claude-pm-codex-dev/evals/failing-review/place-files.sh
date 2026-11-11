#!/usr/bin/env bash
# Builds the case's scratch repository content. The case runner copies the needed skills in and makes the first commit.
set -eu
here="$(dirname "$0")"
cp -R "$here/../_fixture/mathlib" ./mathlib
mkdir -p mathlib/.agents/skills
cp -R "$here/../_fixture/codex-skills/." mathlib/.agents/skills/
# Fixture skills are stored as SKILL.md.fixture so installs of this skill do not pick them up.
find mathlib/.agents -name 'SKILL.md.fixture' -exec sh -c 'mv "$1" "${1%.fixture}"' _ {} \;
cp "$here/validate.sh" mathlib/validate.sh
