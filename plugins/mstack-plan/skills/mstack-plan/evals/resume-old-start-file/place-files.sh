#!/usr/bin/env bash
set -eu
here="$(cd "$(dirname "$0")" && pwd)"
work="$PWD"
mkdir -p "$work/docs/plans"
cp -R "$here/../_fixture/start-file-plan" "$work/docs/plans/greeting"
rm -rf "$work/docs/plans/greeting/app"
sed -i 's/^Status: Approved.*/Status: Draft/' "$work/docs/plans/greeting/plan.md"
sed -i 's/^Plan status: Approved.*/Plan status: Draft/' "$work/docs/plans/greeting/progress.md"
cp "$here/files/execute-plan.frozen.md" "$work/docs/plans/greeting/execute-plan.md"
cp "$here/files/execute-plan.frozen.md" "$work/execute-plan.frozen.md"
git init -q -b main
git add -A
git -c user.name=eval -c user.email=eval@example.com commit -q -m "fixture"
