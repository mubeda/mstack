#!/usr/bin/env bash
# A small marketplace repository with one plugin and its own check, committed so versions have a base.
set -eu
here="$(cd "$(dirname "$0")" && pwd)"
work="$PWD"
cp -R "$here/files/skills-repo" "$work/"
cd "$work/skills-repo"
mv plugins/greet/skills/greet/SKILL.md.fixture plugins/greet/skills/greet/SKILL.md
cp LICENSE plugins/greet/skills/greet/LICENSE
git init -q -b main
git -c user.name=eval -c user.email=eval@example.com add -A
git -c user.name=eval -c user.email=eval@example.com commit -qm "Add the greet plugin"
if [ -f "$here/files/vendors/result-1.md" ]; then
  mkdir -p "$work/vendors"
  sed "s|@WORK@|$work|g" "$here/files/vendors/result-1.md" > "$work/vendors/result-1.md"
fi
