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
if [ "${ONE_FAIL_VARIANT:-empty}" = "wrong-model" ]; then
  cp "$PWD/vendors/result-2-wrong-model.md" "$PWD/vendors/result-2.md"
else
  cp "$PWD/vendors/result-2-empty.md" "$PWD/vendors/result-2.md"
fi
