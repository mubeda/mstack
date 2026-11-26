#!/usr/bin/env bash
set -eu
here="$(cd "$(dirname "$0")" && pwd)"
bash "$here/../_fixture/place.sh" plan "$here"
if [ "${FALLBACK_VARIANT:-supplied}" = "no-model-option" ]; then
  cp "$PWD/vendors/result-no-model.md" "$PWD/vendors/result-1.md"
  cp "$PWD/files/models-no-model.md" "$PWD/models.md"
else
  cp "$PWD/vendors/result-supplied.md" "$PWD/vendors/result-1.md"
  cp "$PWD/files/models-supplied.md" "$PWD/models.md"
fi
