#!/usr/bin/env bash
# Report which skills and tools mstack-plan needs on this host.
#   bash check-required-skills.sh --host claude   (running in Claude Code; Codex reviews the plan)
#   bash check-required-skills.sh --host codex    (running in Codex; Claude reviews the plan)
# Exit 0 when every required item is present, 1 otherwise. Recommended items only print a note.
set -u
[ -n "${HOME:-}" ] || { echo "HOME is not set, so the skill folders cannot be found" >&2; exit 2; }

host=""
for arg in "$@"; do
  case "$arg" in
    --host) ;;
    claude|codex) host="$arg" ;;
    --host=claude) host=claude ;;
    --host=codex) host=codex ;;
    *) echo "unknown option: $arg" >&2; exit 2 ;;
  esac
done
[ -n "$host" ] || { echo "usage: check-required-skills.sh --host claude|codex" >&2; exit 2; }

if [ "$host" = claude ]; then
  roots=("${CLAUDE_CONFIG_DIR:-$HOME/.claude}/skills" "$HOME/.agents/skills" "./.claude/skills" "./.agents/skills")
  plugin_cache="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/plugins/cache"
else
  roots=("${CODEX_HOME:-$HOME/.codex}/skills" "$HOME/.agents/skills" "./.codex/skills" "./.agents/skills")
  plugin_cache="${CODEX_HOME:-$HOME/.codex}/plugins/cache"
fi

if [ "$host" = claude ]; then record_kind=claude; record_file="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/plugins/installed_plugins.json"
else record_kind=codex; record_file="${CODEX_HOME:-$HOME/.codex}/config.toml"; fi

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

# skill-codex installs a skill folder named `codex`; other plugins can ship one too, so match its plugin path
# or, for a standalone copy, its `codex exec` instructions.
has_codex_skill() {
  local r
  cache_hit_recorded "*skill-codex*/skills/codex/SKILL.md" && return 0
  for r in "${roots[@]}"; do [ -f "$r/codex/SKILL.md" ] && grep -q "codex exec" "$r/codex/SKILL.md" && return 0; done
  return 1
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
recommend() { # $1 = label, $2 = command that succeeds when present
  if eval "$2"; then echo "ok       $1"; else echo "note     $1 is not installed (recommended)"; fi
}

check "node on PATH (runs check-plan.mjs)" "command -v node >/dev/null"
check "git on PATH"                        "command -v git >/dev/null"
check "mstack-find-skills (names the skills per task)"   "has_skill mstack-find-skills"
check "mstack-best-model-for (models for helpers and reviews)" "has_skill mstack-best-model-for"
check "mstack-receive-review (processes every review)" "has_skill mstack-receive-review"
if [ "$host" = claude ]; then
  reviewer "codex skill (skill-codex plugin)" "has_codex_skill"
  reviewer "codex CLI logged in"              "command -v codex >/dev/null && codex login status >/dev/null 2>&1"
  recommend "mstack-codex-review-workflow (workflow execution)" "has_skill mstack-codex-review-workflow"
else
  reviewer "claude-review (agent-bridges claude plugin)" "has_claude_review"
  reviewer "claude CLI logged in"             "command -v claude >/dev/null && claude auth status >/dev/null 2>&1"
  recommend "mstack-claude-review-workflow (workflow execution)" "has_skill mstack-claude-review-workflow"
fi
recommend "mstack-write-specs (writes the spec when there is none)" "has_skill mstack-write-specs"
recommend "mstack-diagnose (bug and performance tasks)"            "has_skill mstack-diagnose"

exit $missing
