#!/usr/bin/env bash
# Report which skills and tools mstack-claude-pm-codex-dev needs are missing, on the Claude side (this session) and
# on the Codex side (the developer, which loads its own skills).
#   bash check-required-skills.sh [--github] [--web-ui]
#     no flag     core requirements
#     --github    also gh, logged in (GitHub issues or a GitHub PR)
#     --web-ui    also the web UI requirements
# Exit 0 when no checked item is MISSING, 1 otherwise, 2 on an unknown option. Prints one line per item.
# It reports what is on disk; whether this session's lists show a skill or the rescue agent is the skill's own check.
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

here="$(cd "$(dirname "$0")" && pwd)"
claude_dir="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
codex_dir="${CODEX_HOME:-$HOME/.codex}"

claude_roots=( "$claude_dir/skills" "$HOME/.agents/skills" "./.claude/skills" "./.agents/skills" )
claude_cache="$claude_dir/plugins/cache"
codex_roots=( "$codex_dir/skills" "$HOME/.agents/skills" "./.codex/skills" "./.agents/skills" )
codex_cache="$codex_dir/plugins/cache" # <marketplace>/<plugin>/<version>/skills/<skill>/SKILL.md

has_claude_skill() { # $1 = skill folder name
  local r
  for r in "${claude_roots[@]}"; do [ -f "$r/$1/SKILL.md" ] && return 0; done
  [ -d "$claude_cache" ] && find "$claude_cache/" -path "*/skills/$1/SKILL.md" -print -quit 2>/dev/null | grep -q . && return 0
  return 1
}

# True when Codex's config.toml has a [plugins."<plugin>@<marketplace>"] table that does not say enabled = false.
codex_plugin_enabled() { # $1 = plugin, $2 = marketplace
  local cfg="$codex_dir/config.toml"
  [ -f "$cfg" ] || return 1
  awk -v want="[plugins.\"$1@$2\"]" '
    /^[[:space:]]*\[/ { line=$0; gsub(/^[[:space:]]+|[[:space:]]+$/, "", line); inside = (line == want); if (inside) found=1; next }
    inside && /^[[:space:]]*enabled[[:space:]]*=[[:space:]]*false/ { off=1 }
    END { exit !(found && !off) }' "$cfg"
}

# A Codex-side skill counts in a skill folder Codex reads, or in Codex's plugin cache when its plugin is switched on.
has_codex_skill() { # $1 = skill folder name
  local r p rel market plugin
  for r in "${codex_roots[@]}"; do [ -f "$r/$1/SKILL.md" ] && return 0; done
  [ -d "$codex_cache" ] || return 1
  while IFS= read -r p; do
    rel="${p#"$codex_cache"/}"
    market="${rel%%/*}"; rel="${rel#*/}"; plugin="${rel%%/*}"
    codex_plugin_enabled "$plugin" "$market" && return 0
  done < <(find "$codex_cache/" -path "*/skills/$1/SKILL.md" 2>/dev/null)
  return 1
}

# skill-codex installs a skill folder named `codex`; other plugins can ship one too, so match its plugin path
# or, for a standalone copy, its `codex exec` instructions.
has_skill_codex() {
  local r
  [ -d "$claude_cache" ] && find "$claude_cache/" -path "*skill-codex*/skills/codex/SKILL.md" -print -quit 2>/dev/null | grep -q . && return 0
  for r in "${claude_roots[@]}"; do [ -f "$r/codex/SKILL.md" ] && grep -q "codex exec" "$r/codex/SKILL.md" && return 0; done
  return 1
}

missing=0
check() { # $1 = label, $2 = command that succeeds when present
  if eval "$2"; then echo "ok       $1"; else echo "MISSING  $1"; missing=1; fi
}
warn() { # $1 = label, $2 = command, $3 = what happens without it
  if eval "$2"; then echo "ok       $1"; else echo "WARN     $1 is missing; $3"; fi
}

check "node on PATH"                              "command -v node >/dev/null"
check "mstack-find-skills (Claude side)"          "has_claude_skill mstack-find-skills"
check "mstack-best-model-for (Claude side)"       "has_claude_skill mstack-best-model-for"
check "Codex plugin for Claude Code"              "command -v node >/dev/null && node \"$here/codex-dev.mjs\" locate >/dev/null 2>&1"
check "codex CLI logged in"                       "command -v codex >/dev/null && codex login status >/dev/null 2>&1"
check "ponytail (Codex side)"                     "has_codex_skill ponytail"
check "mstack-diagnose (Codex side)"              "has_codex_skill mstack-diagnose"
check "mstack-best-model-for (Codex side)"       "has_codex_skill mstack-best-model-for"  # mstack-diagnose requires it in the developer's sessions
warn  "codex skill (skill-codex plugin)"          "has_skill_codex" "the Codex review uses the plain codex exec command"

if [ "$github" = 1 ]; then
  check "gh CLI logged in"                        "command -v gh >/dev/null && gh auth status >/dev/null 2>&1"
fi

if [ "$webui" = 1 ]; then
  check "ui-ux-pro-max (Codex side)"              "has_codex_skill ui-ux-pro-max"
  check "Python 3 on PATH"                        "python3 -c 'import sys' 2>/dev/null || python -c 'import sys; sys.exit(sys.version_info[0] < 3)' 2>/dev/null"
fi

exit $missing
