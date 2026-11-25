#!/usr/bin/env bash
# Report which skills and tools the dev workflows need, in two parts:
#   bash check-required-skills.sh --host claude|codex|antigravity [--github]
#   bash check-required-skills.sh --host claude|codex|antigravity --developer claude|codex [--web-ui]
#     --host       claude (Claude Code), codex (Codex) or antigravity (Antigravity)
#     --github     host part only: also gh, logged in (GitHub issues or a GitHub PR)
#     --developer  developer part: skills and tools on the developer's side (claude or codex, never the host's own)
#     --web-ui     developer part only: also ui-ux-pro-max on the developer's side and Python 3 on PATH
# Exit 0 when every checked item is present, 1 otherwise, 2 on a usage error.
# Client availability and login belong to mstack-vendors, so this script runs no client.
set -u
[ -n "${HOME:-}" ] || { echo "HOME is not set, so the skill folders cannot be found" >&2; exit 2; }

usage() {
  echo "usage: check-required-skills.sh --host claude|codex|antigravity [--github] | --host claude|codex|antigravity --developer claude|codex [--web-ui]" >&2
  exit 2
}

host=""
developer=""
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
    --developer)
      [ $# -ge 2 ] || usage
      value="$2"; shift
      case "$value" in claude|codex) ;; *) usage ;; esac
      [ -z "$developer" ] || usage
      developer="$value"
      ;;
    --developer=*)
      value="${1#--developer=}"
      case "$value" in claude|codex) ;; *) usage ;; esac
      [ -z "$developer" ] || usage
      developer="$value"
      ;;
    --github) github=1 ;;
    --web-ui) webui=1 ;;
    *) echo "unknown option: $1" >&2; usage ;;
  esac
  shift
done

[ -n "$host" ] || usage
if [ -n "$developer" ]; then
  [ "$developer" != "$host" ] || usage
  [ "$github" = 0 ] || usage
else
  [ "$webui" = 0 ] || usage
fi

claude_dir="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
codex_dir="${CODEX_HOME:-$HOME/.codex}"
claude_cache="$claude_dir/plugins/cache"
codex_cache="$codex_dir/plugins/cache"

abs_path() {
  local dir
  dir="$(cd "$(dirname "$1")" && pwd)"
  printf '%s/%s\n' "$dir" "$(basename "$1")"
}

# A cache folder alone proves nothing (leftover clones and old versions stay there): the client must record the plugin.
claude_plugin_recorded() { # $1 = plugin, $2 = marketplace
  grep -qF "\"$1@$2\"" "$claude_dir/plugins/installed_plugins.json" 2>/dev/null
}

codex_plugin_enabled() { # $1 = plugin, $2 = marketplace
  local cfg="$codex_dir/config.toml"
  [ -f "$cfg" ] || return 1
  awk -v want="[plugins.\"$1@$2\"]" '
    /^[[:space:]]*\[/ { line=$0; gsub(/^[[:space:]]+|[[:space:]]+$/, "", line); inside = (line == want); if (inside) found=1; next }
    inside && /^[[:space:]]*enabled[[:space:]]*=[[:space:]]*false/ { off=1 }
    END { exit !(found && !off) }' "$cfg"
}

find_claude_cache_skill() { # $1 = skill folder name; prints absolute path of SKILL.md on hit
  local p rel market plugin rec="$claude_dir/plugins/installed_plugins.json" resolved
  [ -d "$claude_cache" ] || return 1
  [ -f "$rec" ] || return 1
  if command -v node >/dev/null 2>&1; then
    resolved="$(node -e '
      const fs = require("node:fs");
      const path = require("node:path");
      const [recPath, cacheDir, skillName, rawCwd] = process.argv.slice(1);
      const real = (x) => { try { return fs.realpathSync(x); } catch { return path.resolve(x); } };
      const withinDir = (child, parent) => {
        const c = real(child), p = real(parent);
        return c === p || c.startsWith(p.endsWith(path.sep) ? p : p + path.sep);
      };
      let data;
      try { data = JSON.parse(fs.readFileSync(recPath, "utf8")); } catch { process.exit(1); }
      const plugins = data && typeof data.plugins === "object" && data.plugins ? data.plugins : {};
      const entries = [];
      for (const [key, list] of Object.entries(plugins)) {
        if (!Array.isArray(list)) continue;
        for (const item of list) {
          if (!item || typeof item !== "object") continue;
          const scope = item.scope ?? "user";
          if (scope === "project") {
            if (typeof item.projectPath !== "string" || !item.projectPath || !withinDir(rawCwd, item.projectPath)) continue;
          } else if (scope !== "user") {
            continue;
          }
          const ip = typeof item.installPath === "string" && item.installPath ? item.installPath : null;
          entries.push({ key, ip, prio: scope === "project" ? 0 : 1 });
        }
      }
      for (const prio of [0, 1]) {
        const hits = new Set();
        for (const e of entries) {
          if (e.prio !== prio || !e.ip) continue;
          const cand = path.join(e.ip, "skills", skillName, "SKILL.md");
          if (fs.existsSync(cand) && fs.statSync(cand).isFile()) hits.add(fs.realpathSync(cand));
        }
        if (hits.size === 1) { console.log([...hits][0]); process.exit(0); }
        if (hits.size > 1) process.exit(1);
      }
      // Fallback only for applicable records omitting installPath, and only when unambiguously one cached version matches.
      for (const prio of [0, 1]) {
        const hits = new Set();
        for (const e of entries) {
          if (e.prio !== prio || e.ip) continue;
          const at = e.key.lastIndexOf("@");
          if (at <= 0) continue;
          const plugin = e.key.slice(0, at), market = e.key.slice(at + 1);
          const pluginCache = path.join(cacheDir, market, plugin);
          if (!fs.existsSync(pluginCache) || !fs.statSync(pluginCache).isDirectory()) continue;
          for (const ver of fs.readdirSync(pluginCache, { withFileTypes: true })) {
            if (!ver.isDirectory()) continue;
            const cand = path.join(pluginCache, ver.name, "skills", skillName, "SKILL.md");
            if (fs.existsSync(cand) && fs.statSync(cand).isFile()) hits.add(fs.realpathSync(cand));
          }
        }
        if (hits.size === 1) { console.log([...hits][0]); process.exit(0); }
        if (hits.size > 1) process.exit(1);
      }
      process.exit(1);
    ' "$rec" "$claude_cache" "$1" "$PWD" 2>/dev/null)" && [ -n "$resolved" ] && {
      printf '%s\n' "$resolved"
      return 0
    }
    return 1
  fi
  while IFS= read -r p; do
    rel="${p#"$claude_cache"}"; rel="${rel#/}"; rel="${rel#/}"
    market="${rel%%/*}"; rel="${rel#*/}"; plugin="${rel%%/*}"
    if claude_plugin_recorded "$plugin" "$market"; then
      abs_path "$p"
      return 0
    fi
  done < <(find "$claude_cache/" -path "*/skills/$1/SKILL.md" 2>/dev/null)
  return 1
}

has_codex_cache_skill() { # $1 = skill folder name
  local p rel market plugin
  [ -d "$codex_cache" ] || return 1
  while IFS= read -r p; do
    rel="${p#"$codex_cache"}"; rel="${rel#/}"; rel="${rel#/}"
    market="${rel%%/*}"; rel="${rel#*/}"; plugin="${rel%%/*}"
    codex_plugin_enabled "$plugin" "$market" && return 0
  done < <(find "$codex_cache/" -path "*/skills/$1/SKILL.md" 2>/dev/null)
  return 1
}

has_claude_skill() { # $1 = skill folder name
  local r
  for r in "$claude_dir/skills" "$HOME/.agents/skills" "./.claude/skills" "./.agents/skills"; do
    [ -f "$r/$1/SKILL.md" ] && return 0
  done
  find_claude_cache_skill "$1" >/dev/null
}

has_codex_skill() { # $1 = skill folder name
  local r
  for r in "$codex_dir/skills" "$HOME/.agents/skills" "./.codex/skills" "./.agents/skills"; do
    [ -f "$r/$1/SKILL.md" ] && return 0
  done
  has_codex_cache_skill "$1"
}

has_antigravity_skill() { # $1 = skill folder name
  local r
  for r in "$HOME/.gemini/config/skills" "./.agents/skills"; do
    [ -f "$r/$1/SKILL.md" ] && return 0
  done
  # Antigravity keeps no install record, so an installed plugin is its folder under the user's or workspace's plugins.
  for r in "$HOME/.gemini/config/plugins" "./.agents/plugins"; do
    compgen -G "$r/*/skills/$1/SKILL.md" >/dev/null && return 0
  done
  return 1
}

has_host_skill() { # $1 = skill folder name
  if [ "$host" = claude ]; then
    has_claude_skill "$1"
  elif [ "$host" = codex ]; then
    has_codex_skill "$1"
  else
    has_antigravity_skill "$1"
  fi
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

# A Claude developer runs under --safe-mode in a copy of tracked files: a tracked .claude/skills/<skill>/SKILL.md
# lands in the copy (in-copy), while any other readable SKILL.md is passed by its absolute path (outside-copy).
check_claude_dev_skill() { # $1 = skill folder name, $2 = optional mstack skill name
  local skill_name="$1" mstack_name="${2:-}" rel=".claude/skills/$1/SKILL.md" r found
  if [ -f "./$rel" ] && git ls-files --error-unmatch -- "$rel" >/dev/null 2>&1; then
    echo "ok       $skill_name in-copy $rel"
    return 0
  fi
  for r in "./.claude/skills" "./.agents/skills" "$claude_dir/skills" "$HOME/.agents/skills"; do
    if [ -f "$r/$skill_name/SKILL.md" ]; then
      found="$(abs_path "$r/$skill_name/SKILL.md")"
      echo "ok       $skill_name outside-copy $found"
      return 0
    fi
  done
  if found="$(find_claude_cache_skill "$skill_name")"; then
    echo "ok       $skill_name outside-copy $found"
    return 0
  fi
  echo "MISSING  $skill_name (Claude side)"
  missing=1
  [ -n "$mstack_name" ] && missing_mstack+=("$mstack_name")
  return 0
}

if [ -z "$developer" ]; then
  # Part one: host side only.
  check "node on PATH"                              "command -v node >/dev/null"
  check "git on PATH"                               "command -v git >/dev/null"
  check "mstack-find-skills (this marketplace)"     "has_host_skill mstack-find-skills"     "mstack-find-skills"
  check "mstack-best-model-for (this marketplace)"  "has_host_skill mstack-best-model-for"  "mstack-best-model-for"
  check "mstack-receive-review (this marketplace)"  "has_host_skill mstack-receive-review"  "mstack-receive-review"
  check "mstack-research (this marketplace)"        "has_host_skill mstack-research"        "mstack-research"
  check "mstack-vendors (this marketplace)"         "has_host_skill mstack-vendors"         "mstack-vendors"
  if [ "$github" = 1 ]; then
    check "gh CLI logged in"                        "command -v gh >/dev/null && gh auth status >/dev/null 2>&1"
  fi
  if [ "$host" = antigravity ] && has_antigravity_skill ponytail; then
    echo "note     ponytail: its hooks do not run in Antigravity"
  fi
  install_target="$host"
else
  # Part two: developer side only (no host-part lines, no client calls).
  if [ "$developer" = codex ]; then
    check "ponytail (Codex side)"                   "has_codex_skill ponytail"
    check "mstack-diagnose (Codex side)"            "has_codex_skill mstack-diagnose"        "mstack-diagnose"
    check "mstack-best-model-for (Codex side)"      "has_codex_skill mstack-best-model-for"  "mstack-best-model-for"
    check "mstack-receive-review (Codex side)"      "has_codex_skill mstack-receive-review"  "mstack-receive-review"
    if [ "$webui" = 1 ]; then
      check "ui-ux-pro-max (Codex side)"            "has_codex_skill ui-ux-pro-max"
      check "Python 3 on PATH"                      "python3 -c 'import sys' 2>/dev/null || python -c 'import sys; sys.exit(sys.version_info[0] < 3)' 2>/dev/null"
    fi
  else
    check_claude_dev_skill "ponytail"
    check_claude_dev_skill "mstack-diagnose"        "mstack-diagnose"
    check_claude_dev_skill "mstack-best-model-for"  "mstack-best-model-for"
    check_claude_dev_skill "mstack-receive-review"  "mstack-receive-review"
    if [ "$webui" = 1 ]; then
      check_claude_dev_skill "ui-ux-pro-max"
      check "Python 3 on PATH"                      "python3 -c 'import sys' 2>/dev/null || python -c 'import sys; sys.exit(sys.version_info[0] < 3)' 2>/dev/null"
    fi
  fi
  install_target="$developer"
fi

if [ "${#missing_mstack[@]}" -gt 0 ]; then
  if [ "$install_target" = claude ]; then
    cli_agent="claude-code"
  elif [ "$install_target" = codex ]; then
    cli_agent="codex"
  else
    cli_agent="antigravity"
  fi
  for name in "${missing_mstack[@]}"; do
    echo ""
    echo "Install $name:"
    if [ "$install_target" = claude ]; then
      echo "  Claude Code: claude plugin marketplace add mubeda/mstack, then claude plugin install ${name}@mstack"
    elif [ "$install_target" = codex ]; then
      echo "  Codex:       codex plugin marketplace add mubeda/mstack, then codex plugin add ${name}@mstack"
    else
      echo "  Antigravity: agy plugin install https://github.com/mubeda/mstack/tree/main/plugins/${name}"
    fi
    echo "  Skills CLI:  npx skills add mubeda/mstack --skill ${name} -g -a ${cli_agent} -y"
  done
  echo "Or install mstack-setup the same way and run it: it installs everything the mstack skills need."
elif [ "$missing" -ne 0 ]; then
  echo ""
  echo "Run mstack-setup to check and install missing dependencies for ${install_target} (or install the missing items listed above)."
fi

exit $missing
