#!/usr/bin/env bash
# Self-test case fixture: places ONLY the notes fixture repository at the workspace root.
# Copies NO skill folders and writes nothing under HOME (build-batch.mjs owns plugin installs).
set -eu
here="$(cd "$(dirname "$0")" && pwd)"
fixture="$here/../_fixture"
work="$PWD"

cp -R "$fixture/repo/." "$work/"
mkdir -p "$work/docs/plans"
cp -R "$fixture/plan" "$work/docs/plans/notes"
git init -q -b main
git config user.name eval
git config user.email eval@example.com
git add -A
git commit -q -m "Initial notes repo and plan"
