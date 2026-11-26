#!/usr/bin/env bash
set -eu
case_dir="$(cd "$(dirname "$0")" && pwd)"
DEV_SKILLS_SIDE=both bash "$case_dir/../_fixture/place.sh" plan "$case_dir"
variant="${VARIANT:-fail}"
if [ "$variant" = "fail" ]; then
  : > stand-in/fail-claude
else
  printf "claude-haiku-5-5\n" > stand-in/wrong-model-claude
fi
