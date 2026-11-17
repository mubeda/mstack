#!/usr/bin/env bash
# Starts one turn of a fresh session for an eval case of mstack-web-ui.
#   launch.sh <run root built by a case's place-files.sh> <prompt file> <turn number> [--no-plugin] [claude options...]
# The session runs in <run root>/work with an empty HOME. CLAUDE_CONFIG_DIR keeps pointing at the real one,
# so the session can sign in, and --setting-sources project keeps the user's own plugins and skills out, so
# no other interface or design skill is loaded in either kind of session. It has no connected tools and only
# the tools named below. There is no shell tool on purpose: the session is signed in with the real
# configuration folder, the cases need only to read and write files in work/, and without a shell a session
# cannot run a command or install a package. Its file tools can still read and write any file the user can,
# so run a case only with a prompt and files you trust. Its stream-json output goes to <run root>/trace-<turn number>.jsonl, never over an
# existing file. Pass the model as an option (--model <name>), and --resume <session id> for a second turn.
# --no-plugin as the first option leaves the plugin out, for a baseline run.
# The first event of a trace lists the session's skills: read it before trusting a comparison.
set -eu
[ $# -ge 3 ] || { echo "usage: launch.sh <run root> <prompt file> <turn number> [--no-plugin] [claude options...]" >&2; exit 2; }
ROOT="$(cd "$1" && pwd)"; PROMPT="$(cd "$(dirname "$2")" && pwd)/$(basename "$2")"; TURN="$3"; shift 3
PLUGIN="$(cd "$(dirname "$0")/../../../.." && pwd)"
[ -d "$ROOT/work" ] || { echo "launch.sh: $ROOT/work is missing; run the case's place-files.sh in the run root first" >&2; exit 2; }
TRACE="$ROOT/trace-$TURN.jsonl"
[ ! -e "$TRACE" ] || { echo "launch.sh: $TRACE exists" >&2; exit 2; }
PLUGIN_ARGS=(--plugin-dir "$PLUGIN")
if [ "${1:-}" = "--no-plugin" ]; then PLUGIN_ARGS=(); shift; fi
REAL_HOME="$HOME"
mkdir -p "$ROOT/home-empty"
cd "$ROOT/work"
env HOME="$ROOT/home-empty" CLAUDE_CONFIG_DIR="${CLAUDE_CONFIG_DIR:-$REAL_HOME/.claude}" \
  claude -p "$(cat "$PROMPT")" "${PLUGIN_ARGS[@]}" --setting-sources project --strict-mcp-config --mcp-config '{"mcpServers":{}}' \
  --tools Read Write Edit Glob Grep Skill --allowedTools Read Write Edit Glob Grep Skill \
  --output-format stream-json --verbose "$@" > "$TRACE"
