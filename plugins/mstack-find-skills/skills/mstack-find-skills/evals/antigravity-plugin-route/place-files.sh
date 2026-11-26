#!/usr/bin/env bash
# Stand-in npx and agy in ./bin (each logs its call to ./calls.log and installs nothing), and a checkout of the candidate's repository in ./web-skills.
set -eu
cp -R "$(dirname "$0")/files/bin" "$(dirname "$0")/files/web-skills" .
chmod +x bin/npx bin/agy
find web-skills -name SKILL.md.fixture -exec sh -c 'mv "$1" "${1%.fixture}"' _ {} \;
