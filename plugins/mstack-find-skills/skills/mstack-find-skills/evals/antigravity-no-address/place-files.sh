#!/usr/bin/env bash
# Stand-in npx and agy in ./bin: each logs its call to ./calls.log and installs nothing.
set -eu
cp -R "$(dirname "$0")/files/bin" .
chmod +x bin/npx bin/agy
