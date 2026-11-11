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

record_kind=codex; record_file="${CODEX_HOME:-$HOME/.codex}/config.toml"

# A cache folder alone proves nothing (leftover clones and old versions stay there): the host must record the plugin.
# Claude Code records it as a "<plugin>@<marketplace>" key in installed_plugins.json; Codex as a
# [plugins."<plugin>@<marketplace>"] table in config.toml that does not say enabled = false.
plugin_recorded() { # $1 = plugin, $2 = marketplace
  if [ "$record_kind" = claude ]; then
    grep -qF "\"$1@$2\"" "$record_file" 2>/dev/null
  else
    [ -f "$record_file" ] || return 1
    awk -v want="[plugins.\"$1@$2\"]" '
      /^[[:space:]]*\[/ { line=$0; gsub(/^[[:space:]]+|[[:space:]]+$/, "", line); inside = (line == want); if (inside) found=1; next }
      inside && /^[[:space:]]*enabled[[:space:]]*=[[:space:]]*false/ { off=1 }
      END { exit !(found && !off) }' "$record_file"
  fi
}
cache_hit_recorded() { # $1 = find -path pattern, $2 = optional file that must exist relative to the hit's folder
  local p rel market plugin
  [ -d "$plugin_cache" ] || return 1
  while IFS= read -r p; do
    [ -z "${2:-}" ] || [ -f "$(dirname "$p")/$2" ] || continue
    rel="${p#"$plugin_cache"}"; rel="${rel#/}"; rel="${rel#/}" # BSD find prints "//" after a root that ends in a slash
    market="${rel%%/*}"; rel="${rel#*/}"; plugin="${rel%%/*}"
    plugin_recorded "$plugin" "$market" && return 0
  done < <(find "$plugin_cache/" -path "$1" 2>/dev/null)
  return 1
}

has_skill() { # $1 = skill folder name
  local r
  for r in "${roots[@]}"; do [ -f "$r/$1/SKILL.md" ] && return 0; done
  cache_hit_recorded "*/skills/$1/SKILL.md"
}

# The agent-bridges `claude` plugin ships `claude-review` next to the companion script it runs.
has_claude_review() {
  cache_hit_recorded "*/skills/claude-review/SKILL.md" "../../scripts/claude-companion.mjs"
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
