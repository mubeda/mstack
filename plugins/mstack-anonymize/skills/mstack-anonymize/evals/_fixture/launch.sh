#!/usr/bin/env bash
# Starts one turn of a fresh session for an eval case of mstack-anonymize.
#   launch.sh <run root built by a case's place-files.sh> <prompt file> <turn number> [--no-plugin] [claude options...]
# The session runs in <run root>/work with an empty HOME and with XDG_CONFIG_HOME at <run root>/config, so the
# script, called without --terms, reads the case's made-up terms file and not the user's own. CLAUDE_CONFIG_DIR keeps pointing at the
# real one, so the session can sign in. It has no connected tools and no advisor model, and the tools Agent,
# Task, WebFetch and WebSearch are denied; its shell is not restricted. Its stream-json output goes to <run root>/trace-<turn number>.jsonl,
# never over an existing file.
# Pass the model as an option, by its full id (--model <full model id>; an alias can run another model), and
# --resume <session id> for a second turn. --no-plugin as the first option leaves the plugin out, for a baseline run.
# CLAUDE_BIN names the client program when it is not `claude` on PATH, so PATH can hold only what the case
# needs (node and the system's commands) and the session cannot start a second client.
# The tools are cut with a deny list, not with a fixed tool list: trace-check.mjs fails every call of a tool it
# has no rule for, so it needs no fixed set.
# This changes which terms file the script takes by default. It keeps a session from no file: a session can still
# read the case's raw file, planted.txt or the user's terms file by its path. trace-check.mjs reports such a read
# afterwards, for the paths its command protects, and a case fails on it.
set -eu
[ $# -ge 3 ] || { echo "usage: launch.sh <run root> <prompt file> <turn number> [--no-plugin] [claude options...]" >&2; exit 2; }
ROOT="$(cd "$1" && pwd)"; PROMPT="$(cd "$(dirname "$2")" && pwd)/$(basename "$2")"; TURN="$3"; shift 3
PLUGIN="$(cd "$(dirname "$0")/../../../.." && pwd)"
for need in work config/mstack/anonymize-terms.txt planted.txt; do
  [ -e "$ROOT/$need" ] || { echo "launch.sh: $ROOT/$need is missing; run the case's place-files.sh in the run root first" >&2; exit 2; }
done
TRACE="$ROOT/trace-$TURN.jsonl"
[ ! -e "$TRACE" ] || { echo "launch.sh: $TRACE exists" >&2; exit 2; }
PLUGIN_ARGS=(--plugin-dir "$PLUGIN" --add-dir "$PLUGIN")
if [ "${1:-}" = "--no-plugin" ]; then PLUGIN_ARGS=(); shift; fi
REAL_HOME="$HOME"
mkdir -p "$ROOT/home-empty"
cd "$ROOT/work"
env HOME="$ROOT/home-empty" XDG_CONFIG_HOME="$ROOT/config" CLAUDE_CONFIG_DIR="${CLAUDE_CONFIG_DIR:-$REAL_HOME/.claude}" \
  "${CLAUDE_BIN:-claude}" -p "$(cat "$PROMPT")" "${PLUGIN_ARGS[@]}" --setting-sources project --strict-mcp-config --mcp-config '{"mcpServers":{}}' \
  --settings '{"advisorModel":"off"}' --permission-mode acceptEdits --allowedTools "Bash" \
  --disallowedTools "Agent,Task,WebFetch,WebSearch" \
  --output-format stream-json --verbose "$@" < /dev/null > "$TRACE"
