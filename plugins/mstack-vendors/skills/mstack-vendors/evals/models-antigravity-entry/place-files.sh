#!/usr/bin/env bash
# Builds the test machine of this case in the target folder (default: the current folder).
set -eu
T="$(cd "${1:-.}" && pwd)"
bash "$(dirname "$0")/../_fixture/machine.sh" "$T" --host antigravity --claude missing --codex ready
