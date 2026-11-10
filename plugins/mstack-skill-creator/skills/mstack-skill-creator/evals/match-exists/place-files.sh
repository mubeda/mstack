#!/usr/bin/env bash
# A repository that already has a skill doing the requested job.
set -eu
cp -R "$(dirname "$0")/files/db-repo" .
cd db-repo
mv .agents/skills/sql-review/SKILL.md.fixture .agents/skills/sql-review/SKILL.md
git init -q -b main
git -c user.name=eval -c user.email=eval@example.com add -A
git -c user.name=eval -c user.email=eval@example.com commit -qm "Add migrations and the sql-review skill"
