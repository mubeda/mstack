#!/usr/bin/env bash
# Builds a throwaway machine under the target folder (default: the current folder): home/, codex-home/, bin/ of stubs.
# Stubs for claude, codex, npm, npx and codegraph append their arguments to calls.log and install nothing.
set -eu
T="$(cd "${1:-.}" && pwd)"
H="$T/home"; B="$T/bin"; L="$T/calls.log"
mkdir -p "$H" "$B" "$T/codex-home"; : > "$L"
real() { command -v "$1" || { echo "$1 is needed to build this case" >&2; exit 1; }; }
printf "#!/bin/sh\nexec \"%s\" \"\$@\"\n" "$(real node)" > "$B/node"
printf "#!/bin/sh\nexec \"%s\" \"\$@\"\n" "$(real git)" > "$B/git"
stub() { # name, then case lines of the form "pattern) exit N ;;"
  local n=$1; shift
  { printf "#!/bin/sh\necho \"%s \$*\" >> \"%s\"\ncase \"\$*\" in\n" "$n" "$L"; for c in "$@"; do printf "  %s\n" "$c"; done; printf "  *) exit 0 ;;\nesac\n"; } > "$B/$n"
}
skill() { mkdir -p "$H/$1"; printf -- "---\nname: x\ndescription: Use when testing.\n---\n" > "$H/$1/SKILL.md"; }
C=.claude/plugins/cache


mkdir -p "$H/$C/skill-codex/skill-codex/1.3.1/skills/codex"; echo "Run codex exec." > "$H/$C/skill-codex/skill-codex/1.3.1/skills/codex/SKILL.md"
for s in mstack-best-model-for mstack-setup mstack-plan mstack-write-specs mstack-diagnose mstack-backlog-triage mstack-handoff mstack-skill-creator mstack-codex-review-workflow; do skill "$C/mstack/$s/0.1.0/skills/$s"; done

skill "$C/mstack/mstack-find-skills/0.1.0/skills/mstack-find-skills"
stub claude '*"plugin install ponytail"*) echo "Error: marketplace ponytail could not be reached" >&2; exit 1 ;;'
stub codex; stub npx
# The npm stub "installs" codegraph by dropping a codegraph stub, so the later connect command is logged too.
{
  echo '#!/bin/sh'
  echo "echo \"npm \$*\" >> \"$L\""
  echo 'case "$*" in'
  echo "  *@colbymchenry/codegraph*) printf '#!/bin/sh\\necho \"codegraph \$*\" >> \"%s\"\\n' \"$L\" > \"$B/codegraph\"; chmod +x \"$B/codegraph\" ;;"
  echo 'esac'
  echo 'exit 0'
} > "$B/npm"
mkdir -p "$H/.claude/plugins"; echo '{"version":2,"plugins":{"skill-codex@skill-codex":[{}]}}' > "$H/.claude/plugins/installed_plugins.json"
chmod +x "$B"/*
# testenv runs one command on this test machine only: its own home folders and a PATH of stubs and a few basic tools.
for t in sh cat ls grep head tail chmod; do p="$(command -v "$t")" && ln -sf "$p" "$B/$t"; done
{
  echo '#!/bin/sh'
  echo "export HOME=\"$H\" USERPROFILE=\"$H\" CODEX_HOME=\"$T/codex-home\" PATH=\"$B\""
  echo 'unset CLAUDE_CONFIG_DIR'
  echo 'exec "$@"'
} > "$T/testenv"
chmod +x "$T/testenv"
