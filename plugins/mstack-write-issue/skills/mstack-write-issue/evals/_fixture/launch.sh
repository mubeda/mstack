#!/usr/bin/env bash
# Starts a command for an eval case so that it cannot reach a real tracker.
#   launch.sh <run root built by a case's place-files.sh> <command...>
# The command runs in <run root>/shop with the stand-in gh first on PATH, an invalid GH_TOKEN, an empty
# GH_CONFIG_DIR and an empty HOME (CLAUDE_CONFIG_DIR and CODEX_HOME keep pointing at the real ones, so an
# agent can still sign in to its model). When bwrap is installed, the desktop keyring, the gh configuration
# and the SSH keys of the real home are hidden as well; set NO_BWRAP=1 to skip that. Without bwrap this stops
# ordinary mistakes, not a session that goes looking for a credential in the real home folder.
set -eu
ROOT="$(cd "$1" && pwd)"; shift
REAL_HOME="$HOME"
WRAP=()
if [ "${NO_BWRAP:-0}" != 1 ] && command -v bwrap >/dev/null 2>&1; then
  WRAP=(bwrap --dev-bind / / --tmpfs "${XDG_RUNTIME_DIR:-/run/user/$(id -u)}")
  for d in "$REAL_HOME/.config/gh" "$REAL_HOME/.ssh"; do [ -d "$d" ] && WRAP+=(--tmpfs "$d"); done
  for f in "$REAL_HOME/.git-credentials" "$REAL_HOME/.netrc"; do [ -e "$f" ] && WRAP+=(--bind /dev/null "$f"); done
fi
cd "$ROOT/shop"
run() {
  env -u GITHUB_TOKEN -u GH_ENTERPRISE_TOKEN -u GITHUB_ENTERPRISE_TOKEN -u GH_HOST -u DBUS_SESSION_BUS_ADDRESS \
    PATH="$ROOT/bin:$PATH" FAKE_GH_DIR="$ROOT/.fake-gh" GH_TOKEN=invalid GH_CONFIG_DIR="$ROOT/.gh-empty" \
    HOME="$ROOT/.home-empty" CLAUDE_CONFIG_DIR="${CLAUDE_CONFIG_DIR:-$REAL_HOME/.claude}" CODEX_HOME="${CODEX_HOME:-$REAL_HOME/.codex}" \
    "${WRAP[@]}" "$@"
}
[ "$(run bash -c 'command -v gh')" = "$ROOT/bin/gh" ] || { echo "launch.sh: gh does not resolve to the stand-in" >&2; exit 2; }
[ -f "$ROOT/.fake-gh/issues.json" ] || { echo "launch.sh: no fixture tracker in $ROOT" >&2; exit 2; }
run "$@"
