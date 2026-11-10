#!/usr/bin/env bash
# A web app with Driftwright and no installed skills, plus stub npx and curl with fixed directory answers.
set -eu
cp -R "$(dirname "$0")/files/web" "$(dirname "$0")/files/bin" .
chmod +x bin/npx bin/curl
