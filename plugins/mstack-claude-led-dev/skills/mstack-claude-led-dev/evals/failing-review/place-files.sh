#!/usr/bin/env bash
set -eu
case_dir="$(cd "$(dirname "$0")" && pwd)"
DEV_SKILLS_SIDE=codex bash "$case_dir/../_fixture/place.sh" none "$case_dir"
