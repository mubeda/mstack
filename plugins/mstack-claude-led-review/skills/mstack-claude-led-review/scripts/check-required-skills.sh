#!/usr/bin/env bash
# Report which skills and tools the review workflows need on this host.
#   bash check-required-skills.sh --host claude|codex|antigravity [--github] [--web-ui]
#     --host      claude (Claude Code), codex (Codex) or antigravity (Antigravity)
#     --github    also gh, logged in (GitHub issues or a GitHub PR)
#     --web-ui    also the web UI requirements
# Exit 0 when every required item is present, 1 otherwise, 2 on a usage error.
# Reviewer availability belongs to mstack-vendors, so this script prints no reviewer row.
set -u
[ -n "${HOME:-}" ] || { echo "HOME is not set, so the skill folders cannot be found" >&2; exit 2; }

usage() {
  echo "usage: check-required-skills.sh --host claude|codex|antigravity [--github] [--web-ui]" >&2
  exit 2
}

host=""
github=0
webui=0
while [ $# -gt 0 ]; do
  case "$1" in
    --host)
      [ $# -ge 2 ] || usage
      value="$2"; shift
      case "$value" in claude|codex|antigravity) ;; *) usage ;; esac
      [ -z "$host" ] || usage
      host="$value"
      ;;
    --host=*)
      value="${1#--host=}"
      case "$value" in claude|codex|antigravity) ;; *) usage ;; esac
      [ -z "$host" ] || usage
      host="$value"
      ;;
    --github) github=1 ;;
    --web-ui) webui=1 ;;
    *) echo "unknown option: $1" >&2; usage ;;
  esac
  shift
done
[ -n "$host" ] || usage

if [ "$host" = claude ]; then
  roots=("${CLAUDE_CONFIG_DIR:-$HOME/.claude}/skills" "$HOME/.agents/skills" "./.claude/skills" "./.agents/skills")
  plugin_cache="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/plugins/cache"
  record_kind=claude
  record_file="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/plugins/installed_plugins.json"
  cli_agent="claude-code"
elif [ "$host" = antigravity ]; then
  roots=("$HOME/.gemini/config/skills" "./.agents/skills")
  # Antigravity keeps no install record, so an installed plugin is its folder under the user's or workspace's plugins.
  plugin_roots=("$HOME/.gemini/config/plugins" "./.agents/plugins")
  plugin_cache=""
  record_kind=""
  record_file=""
  cli_agent="antigravity"
else
  roots=("${CODEX_HOME:-$HOME/.codex}/skills" "$HOME/.agents/skills" "./.codex/skills" "./.agents/skills")
  plugin_cache="${CODEX_HOME:-$HOME/.codex}/plugins/cache"
  record_kind=codex
  record_file="${CODEX_HOME:-$HOME/.codex}/config.toml"
  cli_agent="codex"
fi

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
  [ -n "$plugin_cache" ] && [ -d "$plugin_cache" ] || return 1
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
  if [ "$host" = antigravity ]; then
    for r in "${plugin_roots[@]}"; do compgen -G "$r/*/skills/$1/SKILL.md" >/dev/null && return 0; done
    return 1
  fi
  cache_hit_recorded "*/skills/$1/SKILL.md"
}

missing=0
missing_mstack=()
check() { # $1 = label, $2 = command that succeeds when present, $3 = optional mstack skill name
  if eval "$2"; then
    echo "ok       $1"
  else
    echo "MISSING  $1"
    missing=1
    [ -n "${3:-}" ] && missing_mstack+=("$3")
  fi
}

check "ponytail"                                  "has_skill ponytail"
if [ "$host" = antigravity ] && has_skill ponytail; then
  echo "note     ponytail: its hooks do not run in Antigravity"
fi
check "mstack-diagnose (this marketplace)"        "has_skill mstack-diagnose"        "mstack-diagnose"
check "mstack-find-skills (this marketplace)"     "has_skill mstack-find-skills"     "mstack-find-skills"
check "mstack-best-model-for (this marketplace)"  "has_skill mstack-best-model-for"  "mstack-best-model-for"
check "mstack-receive-review (this marketplace)"  "has_skill mstack-receive-review"  "mstack-receive-review"
check "mstack-research (this marketplace)"        "has_skill mstack-research"        "mstack-research"
check "mstack-vendors (this marketplace)"         "has_skill mstack-vendors"         "mstack-vendors"
check "node on PATH"                              "command -v node >/dev/null"
check "git on PATH"                               "command -v git >/dev/null"

if [ "$github" = 1 ]; then
  check "gh CLI logged in"                        "command -v gh >/dev/null && gh auth status >/dev/null 2>&1"
fi

if [ "$webui" = 1 ]; then
  if [ "$host" = antigravity ]; then
    if has_skill ui-ux-pro-max; then
      echo "ok       ui-ux-pro-max (web UI lanes)"
    else
      echo "WARN     ui-ux-pro-max: not installed (Antigravity has no install for ui-ux-pro-max; web UI lanes run without it)"
    fi
  else
    check "ui-ux-pro-max (web UI lanes)"          "has_skill ui-ux-pro-max"
  fi
  check "Python 3 on PATH"                        "python3 -c 'import sys' 2>/dev/null || python -c 'import sys; sys.exit(sys.version_info[0] < 3)' 2>/dev/null"
fi

if [ "${#missing_mstack[@]}" -gt 0 ]; then
  for name in "${missing_mstack[@]}"; do
    echo ""
    echo "Install $name:"
    if [ "$host" = claude ]; then
      echo "  Claude Code: claude plugin marketplace add mubeda/mstack, then claude plugin install ${name}@mstack"
    elif [ "$host" = codex ]; then
      echo "  Codex:       codex plugin marketplace add mubeda/mstack, then codex plugin add ${name}@mstack"
    else
      echo "  Antigravity: agy plugin install https://github.com/mubeda/mstack/tree/main/plugins/${name}"
    fi
    echo "  Skills CLI:  npx skills add mubeda/mstack --skill ${name} -g -a ${cli_agent} -y"
  done
  echo "Or install mstack-setup the same way and run it: it installs everything the mstack skills need."
fi

exit $missing
