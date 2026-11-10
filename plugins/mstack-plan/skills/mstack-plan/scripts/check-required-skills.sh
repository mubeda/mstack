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

has_skill() { # $1 = skill folder name
  local r
  for r in "${roots[@]}"; do [ -f "$r/$1/SKILL.md" ] && return 0; done
  [ -d "$plugin_cache" ] && find "$plugin_cache/" -path "*/skills/$1/SKILL.md" -print -quit 2>/dev/null | grep -q . && return 0
  return 1
}

# skill-codex installs a skill folder named `codex`; other plugins can ship one too, so match its plugin path
# or, for a standalone copy, its `codex exec` instructions.
has_codex_skill() {
  local r
  [ -d "$plugin_cache" ] && find "$plugin_cache/" -path "*skill-codex*/skills/codex/SKILL.md" -print -quit 2>/dev/null | grep -q . && return 0
  for r in "${roots[@]}"; do [ -f "$r/codex/SKILL.md" ] && grep -q "codex exec" "$r/codex/SKILL.md" && return 0; done
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
recommend() { # $1 = label, $2 = command that succeeds when present
  if eval "$2"; then echo "ok       $1"; else echo "note     $1 is not installed (recommended)"; fi
}

check "node on PATH (runs check-plan.mjs)" "command -v node >/dev/null"
check "git on PATH"                        "command -v git >/dev/null"
check "mstack-find-skills (names the skills per task)"   "has_skill mstack-find-skills"
check "mstack-best-model-for (models for helpers and reviews)" "has_skill mstack-best-model-for"
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
