#!/usr/bin/env bash
set -eu
here="$(cd "$(dirname "$0")" && pwd)"
work="$PWD"
mkdir -p "$work/docs/plans"
cp -R "$here/../_fixture/start-file-plan" "$work/docs/plans/greeting"
rm -rf "$work/docs/plans/greeting/app"
git init -q -b main
git add -A
git -c user.name=eval -c user.email=eval@example.com commit -q -m "fixture"
