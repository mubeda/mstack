#!/usr/bin/env bash
# An unlicensed skill beside a target repository.
set -eu
cp -R "$(dirname "$0")/files/vendor-skill" .
mv vendor-skill/SKILL.md.fixture vendor-skill/SKILL.md
cp -R "$(dirname "$0")/files/api-repo" .
cd api-repo
git init -q -b main
git -c user.name=eval -c user.email=eval@example.com add -A
git -c user.name=eval -c user.email=eval@example.com commit -qm "Add the API client"
