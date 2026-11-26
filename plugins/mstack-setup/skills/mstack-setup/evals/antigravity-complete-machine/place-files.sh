#!/usr/bin/env bash
# Builds a throwaway Antigravity machine under the target folder (default: the current folder): home/ and bin/ of stand-ins.
# Every Antigravity row is installed, the claude and codex clients among them; ui-ux-pro-max is absent, which Antigravity cannot offer.
# Every stand-in appends its arguments to calls.log and writes only under this folder's home/, never under the real home folder.
set -eu
T="$(cd "${1:-.}" && pwd)"
H="$T/home"; B="$T/bin"; L="$T/calls.log"; A="$H/.gemini/config"
mkdir -p "$B" "$A/skills" "$A/plugins"; : > "$L"
real() { command -v "$1" || { echo "$1 is needed to build this case" >&2; exit 1; }; }
printf "#!/bin/sh\nexec \"%s\" \"\$@\"\n" "$(real node)" > "$B/node"
printf "#!/bin/sh\nexec \"%s\" \"\$@\"\n" "$(real git)" > "$B/git"
stub() { printf "#!/bin/sh\necho \"%s \$*\" >> \"%s\"\nexit 0\n" "$1" "$L" > "$B/$1"; }
skill() { mkdir -p "$H/$1"; printf -- "---\nname: x\ndescription: Use when testing.\n---\n" > "$H/$1/SKILL.md"; }
plugin() { skill ".gemini/config/plugins/$1/skills/$1"; }
# The connect command of the real tool writes this entry; the stand-in writes it into this folder's home/ only.
# Its --print-config names the settings file and writes nothing, as the real one does.
CG="#!/bin/sh
echo \"codegraph \$*\" >> \"$L\"
case \"\$*\" in *--print-config*) echo \"# Add to $A/mcp_config.json\" ;; *install*--target=antigravity*) printf '{\"mcpServers\":{\"codegraph\":{\"command\":\"codegraph\",\"args\":[\"serve\",\"--mcp\"]}}}\n' > \"$A/mcp_config.json\" ;; esac
exit 0"
for s in ponytail mstack-find-skills mstack-best-model-for mstack-receive-review mstack-research mstack-setup mstack-plan mstack-write-specs mstack-brainstorm mstack-diagnose mstack-backlog-triage mstack-handoff mstack-skill-creator mstack-chief-of-staff mstack-explain-me-better mstack-product-plan mstack-epic mstack-evidence mstack-decisions mstack-auto mstack-write-issue mstack-anonymize mstack-web-ui mstack-resolve-merge-conflicts mstack-vendors mstack-antigravity-led-review mstack-antigravity-led-dev; do plugin "$s"; done
skill ".gemini/config/skills/archify"
printf "%s\n" "$CG" > "$B/codegraph"
printf '{"mcpServers":{"codegraph":{"command":"codegraph","args":["serve","--mcp"]}}}\n' > "$A/mcp_config.json"
stub agy; stub npm; stub npx; stub gh; stub python3
# Both other vendors' clients are installed and signed in (each stand-in exits 0 for its status command), so no row is left to install.
# A signed-in client stand-in: it logs each call and answers its status command as the real client does.
client() { printf "#!/bin/sh\necho \"%s \$*\" >> \"%s\"\ncase \"\$*\" in \"%s\") echo '%s' ;; esac\nexit 0\n" "$1" "$L" "$2" "$3" > "$B/$1"; }
client claude "auth status" '{"loggedIn": true}'
client codex "login status" 'Logged in using ChatGPT'
chmod +x "$B"/*
# testenv runs one command on this test machine only: its own home folder and a PATH of stand-ins and a few basic tools.
for t in sh cat ls grep head tail chmod mkdir; do p="$(command -v "$t")" && ln -sf "$p" "$B/$t"; done
{
  echo '#!/bin/sh'
  echo "export HOME=\"$H\" USERPROFILE=\"$H\" PATH=\"$B\""
  echo 'unset CLAUDE_CONFIG_DIR CODEX_HOME'
  echo 'exec "$@"'
} > "$T/testenv"
chmod +x "$T/testenv"
