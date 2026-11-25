#!/usr/bin/env bash
set -eu
here="$(cd "$(dirname "$0")" && pwd)"
bash "$here/../_fixture/place.sh" plan "$here"
skill_dir="$(cd "$here/../.." && pwd)"
mkdir -p "$PWD/workflow"
[ -f "$skill_dir/SKILL.md" ] && cp "$skill_dir/SKILL.md" "$PWD/workflow/SKILL.md"
[ -f "$skill_dir/host.md" ] && cp "$skill_dir/host.md" "$PWD/workflow/host.md"
[ -d "$skill_dir/references" ] && cp -R "$skill_dir/references" "$PWD/workflow/references"
[ -d "$skill_dir/scripts" ] && cp -R "$skill_dir/scripts" "$PWD/workflow/scripts"
export PATH="$PWD/bin:$PATH"
v="${OUTCOME_VARIANT:-found}"
case "$v" in
  not-installed) cp "$PWD/vendors/result-1-not-installed.md" "$PWD/vendors/result-1.md" ;;
  not-approved)  cp "$PWD/vendors/result-1-not-approved.md" "$PWD/vendors/result-1.md" ;;
  *)             cp "$PWD/vendors/result-1-found.md" "$PWD/vendors/result-1.md" ;;
esac
cp "$PWD/vendors/outcome-$v.md" "$PWD/vendors/result-2.md"
