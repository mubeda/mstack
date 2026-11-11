#!/usr/bin/env bash
# Report which skills and tools mstack-claude-review-workflow needs are missing.
#   bash check-required-skills.sh [--github] [--web-ui]
#     no flag     core requirements
#     --github    also gh, logged in (GitHub issues or a GitHub PR)
#     --web-ui    also the web UI requirements
# Exit 0 when every checked item is present, 1 otherwise. Prints one line per item.
set -u
[ -n "${HOME:-}" ] || { echo "HOME is not set, so the skill folders cannot be found" >&2; exit 2; }

github=0; webui=0
for arg in "$@"; do
  case "$arg" in
    --github) github=1 ;;
    --web-ui) webui=1 ;;
    *) echo "unknown option: $arg" >&2; exit 2 ;;
  esac
done

roots=(
  "${CODEX_HOME:-$HOME/.codex}/skills" "$HOME/.agents/skills"
  "./.codex/skills" "./.agents/skills"
)
plugin_cache="${CODEX_HOME:-$HOME/.codex}/plugins/cache" # <marketplace>/<plugin>/<version>/skills/<skill>/SKILL.md

has_skill() { # $1 = skill folder name
  local r
  for r in "${roots[@]}"; do [ -f "$r/$1/SKILL.md" ] && return 0; done
  [ -d "$plugin_cache" ] && find "$plugin_cache/" -path "*/skills/$1/SKILL.md" -print -quit 2>/dev/null | grep -q . && return 0
  return 1
}

# The agent-bridges `claude` plugin ships `claude-review` next to the companion script it runs.
has_claude_review() {
  [ -d "$plugin_cache" ] && find "$plugin_cache/" -path "*/skills/claude-review/SKILL.md" 2>/dev/null \
    | while read -r f; do [ -f "$(dirname "$f")/../../scripts/claude-companion.mjs" ] && echo y; done | grep -q y
}

missing=0
reviewer() { # $1 = label, $2 = command; a missing reviewer is a warning, because reviews fall back to a same-vendor subagent
  if eval "$2"; then echo "ok       $1"; else echo "WARN     $1 is missing; reviews will run as a same-vendor fallback"; fi
}
check() { # $1 = label, $2 = command that succeeds when present
  if eval "$2"; then echo "ok       $1"; else echo "MISSING  $1"; missing=1; fi
}

check "ponytail"                          "has_skill ponytail"
check "mstack-diagnose (this marketplace)"  "has_skill mstack-diagnose"
check "mstack-find-skills (this marketplace)"  "has_skill mstack-find-skills"
check "mstack-best-model-for (this marketplace)" "has_skill mstack-best-model-for"
check "mstack-receive-review (this marketplace)" "has_skill mstack-receive-review"
reviewer "claude-review (agent-bridges claude plugin)" "has_claude_review"
check "node on PATH"                      "command -v node >/dev/null"
reviewer "claude CLI logged in"              "command -v claude >/dev/null && claude auth status >/dev/null 2>&1"
check "git on PATH"                       "command -v git >/dev/null"

if [ "$github" = 1 ]; then
  check "gh CLI logged in"                "command -v gh >/dev/null && gh auth status >/dev/null 2>&1"
fi

if [ "$webui" = 1 ]; then
  check "ui-ux-pro-max (web UI lanes)"    "has_skill ui-ux-pro-max"
  check "Python 3 on PATH"                "python3 -c 'import sys' 2>/dev/null || python -c 'import sys; sys.exit(sys.version_info[0] < 3)' 2>/dev/null"
fi

exit $missing
