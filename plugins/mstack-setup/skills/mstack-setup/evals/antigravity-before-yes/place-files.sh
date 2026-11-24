#!/usr/bin/env bash
# Builds a throwaway Antigravity machine under the target folder (default: the current folder): home/ and bin/ of stand-ins.
# The code index is installed but not connected; ponytail and every mstack skill are missing.
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
skill ".gemini/config/skills/archify"
echo "{}" > "$A/mcp_config.json"
printf "%s\n" "$CG" > "$B/codegraph"
stub agy; stub npm; stub npx; stub gh; stub python3
# Both other vendors' clients are installed and signed in (each stand-in exits 0 for its status command), so the vendor rows are ok.
stub claude; stub codex
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
