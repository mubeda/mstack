#!/usr/bin/env bash
# A repository with an existing local skill whose description is a step summary.
set -eu
cp -R "$(dirname "$0")/files/tools-repo" .
cd tools-repo
mv .agents/skills/release-notes/SKILL.md.fixture .agents/skills/release-notes/SKILL.md
git init -q -b main
git -c user.name=eval -c user.email=eval@example.com add -A
git -c user.name=eval -c user.email=eval@example.com commit -qm "Add release-notes skill"
