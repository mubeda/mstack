#!/usr/bin/env bash
# The marketplace repository of plugin-target, plus the lockfile the research block names.
set -eu
bash "$(dirname "$0")/../plugin-target/place-files.sh"
printf '%s\n' '{' '  "name": "skills-repo",' '  "lockfileVersion": 3,' '  "packages": { "node_modules/@commitlint/cli": { "version": "19.3.0" } }' '}' > skills-repo/package-lock.json
