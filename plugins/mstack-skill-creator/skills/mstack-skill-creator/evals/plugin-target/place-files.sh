#!/usr/bin/env bash
# A small marketplace repository with one plugin and its own check, committed so versions have a base.
set -eu
cp -R "$(dirname "$0")/files/skills-repo" .
cd skills-repo
mv plugins/greet/skills/greet/SKILL.md.fixture plugins/greet/skills/greet/SKILL.md
cp LICENSE plugins/greet/skills/greet/LICENSE
git init -q -b main
git -c user.name=eval -c user.email=eval@example.com add -A
git -c user.name=eval -c user.email=eval@example.com commit -qm "Add the greet plugin"
