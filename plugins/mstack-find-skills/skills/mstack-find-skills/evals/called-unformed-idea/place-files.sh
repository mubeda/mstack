#!/usr/bin/env bash
# The project app/ plus two brainstorming skills in the session's own project skill folder: mstack-brainstorm and a broader one.
set -eu
here="$(dirname "$0")"
cp -R "$here/files/app" .
mkdir -p .claude/skills
mv app/.claude/skills/* .claude/skills/ && rm -rf app/.claude
# Fixture skills are stored as SKILL.md.fixture so installs of this skill do not pick them up.
find .claude/skills -name 'SKILL.md.fixture' -exec sh -c 'mv "$1" "${1%.fixture}"' _ {} \;
cd app && git init -q -b main && git -c user.name=eval -c user.email="eval@"example.invalid add -A && git -c user.name=eval -c user.email="eval@"example.invalid commit -qm init
