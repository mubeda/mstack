#!/usr/bin/env bash
# A service in an invented RPC protocol with one unrelated project skill, and stub npx and curl that fail as with no network.
set -eu
cp -R "$(dirname "$0")/files/api" "$(dirname "$0")/files/bin" .
chmod +x bin/npx bin/curl
find api -name 'SKILL.md.fixture' -exec sh -c 'mv "$1" "${1%.fixture}"' _ {} \;
