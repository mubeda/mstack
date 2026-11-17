#!/usr/bin/env bash
# Starts one turn of a fresh session for an eval case of mstack-anonymize.
#   launch.sh <run root built by a case's place-files.sh> <prompt file> <turn number> [--no-plugin] [claude options...]
# The session runs in <run root>/work with an empty HOME and with XDG_CONFIG_HOME at <run root>/config, so the
# script reads the case's made-up terms file and never the user's own. CLAUDE_CONFIG_DIR keeps pointing at the
# real one, so the session can sign in. It has no connected tools and only the tools named below. Its
# stream-json output goes to <run root>/trace-<turn number>.jsonl, never over an existing file.
# Pass the model as an option (--model <name>), and --resume <session id> for a second turn.
# --no-plugin as the first option leaves the plugin out, for a baseline run.
# This keeps a session from the user's terms file. It cannot keep it from reading the case's raw file:
# trace-check.mjs reports that afterwards, and a case fails on it.
set -eu
[ $# -ge 3 ] || { echo "usage: launch.sh <run root> <prompt file> <turn number> [--no-plugin] [claude options...]" >&2; exit 2; }
ROOT="$(cd "$1" && pwd)"; PROMPT="$(cd "$(dirname "$2")" && pwd)/$(basename "$2")"; TURN="$3"; shift 3
PLUGIN="$(cd "$(dirname "$0")/../../../.." && pwd)"
for need in work config/mstack/anonymize-terms.txt planted.txt; do
  [ -e "$ROOT/$need" ] || { echo "launch.sh: $ROOT/$need is missing; run the case's place-files.sh in the run root first" >&2; exit 2; }
done
TRACE="$ROOT/trace-$TURN.jsonl"
[ ! -e "$TRACE" ] || { echo "launch.sh: $TRACE exists" >&2; exit 2; }
PLUGIN_ARGS=(--plugin-dir "$PLUGIN")
if [ "${1:-}" = "--no-plugin" ]; then PLUGIN_ARGS=(); shift; fi
REAL_HOME="$HOME"
mkdir -p "$ROOT/home-empty"
cd "$ROOT/work"
env HOME="$ROOT/home-empty" XDG_CONFIG_HOME="$ROOT/config" CLAUDE_CONFIG_DIR="${CLAUDE_CONFIG_DIR:-$REAL_HOME/.claude}" \
  claude -p "$(cat "$PROMPT")" "${PLUGIN_ARGS[@]}" --setting-sources project --strict-mcp-config --mcp-config '{"mcpServers":{}}' \
  --tools Bash Read Write Glob Grep Skill --allowedTools Bash Read Write Glob Grep Skill \
  --output-format stream-json --verbose "$@" > "$TRACE"
