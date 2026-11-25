#!/usr/bin/env bash
set -eu
here="$(cd "$(dirname "$0")" && pwd)"
bash "$here/../_fixture/place.sh" plan "$here"
if [ "${CHEAP_GAP_VARIANT:-lower}" = "lowest" ]; then
  cp "$PWD/files/models-lowest.md" "$PWD/models.md"
  cp "$PWD/vendors/result-1-claude-lowest.md" "$PWD/vendors/result-1-claude.md"
  cp "$PWD/vendors/result-1-codex-lowest.md" "$PWD/vendors/result-1-codex.md"
else
  cp "$PWD/files/models-lower.md" "$PWD/models.md"
fi
