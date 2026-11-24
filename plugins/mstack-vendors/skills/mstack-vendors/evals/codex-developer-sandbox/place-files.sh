#!/usr/bin/env bash
# Builds the test machine of this case in the target folder (default: the current folder).
set -eu
T="$(cd "${1:-.}" && pwd)"
bash "$(dirname "$0")/../_fixture/machine.sh" "$T" --host antigravity --claude missing --codex ready
# The developer's task names calc.mjs: the workspace holds it, committed, and the test home has a Git identity for the leader's commit.
printf 'export const add = (a, b) => a + b;\n' > "$T/workspace/calc.mjs"
GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null git -C "$T/workspace" -c user.name=test -c user.email=test@example.com add calc.mjs
GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null git -C "$T/workspace" -c user.name=test -c user.email=test@example.com commit -q -m "Add calc"
printf '[user]\n\tname = Test User\n\temail = test@example.com\n' > "$T/home/.gitconfig"
