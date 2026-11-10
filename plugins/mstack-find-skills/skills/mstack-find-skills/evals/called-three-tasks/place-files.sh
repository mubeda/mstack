#!/usr/bin/env bash
# A repository with three project skills and one repository plugin skill that is not installed.
set -eu
cp -R "$(dirname "$0")/files/app" .
# Fixture skills are stored as SKILL.md.fixture so installs of this skill do not pick them up.
find app -name 'SKILL.md.fixture' -exec sh -c 'mv "$1" "${1%.fixture}"' _ {} \;
cd app && git init -q -b main && git -c user.name=eval -c user.email=eval@example.com add -A && git -c user.name=eval -c user.email=eval@example.com commit -qm init
