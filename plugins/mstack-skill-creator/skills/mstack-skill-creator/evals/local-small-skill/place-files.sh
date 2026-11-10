#!/usr/bin/env bash
# A small repository with a changelog convention and no skills.
set -eu
cp -R "$(dirname "$0")/files/notes-app" .
cd notes-app
git init -q -b main
git -c user.name=eval -c user.email=eval@example.com add -A
git -c user.name=eval -c user.email=eval@example.com commit -qm "Initial notes app"
