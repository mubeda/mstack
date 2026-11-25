#!/usr/bin/env bash
set -eu
here="$(cd "$(dirname "$0")" && pwd)"
work="$PWD"
bash "$here/../plugin-target/place-files.sh"
rm -rf "$work/vendors"
cd "$work/skills-repo"
printf '\n- `codex-note`: Codex only\n' >> AGENTS.md
git add AGENTS.md
git -c user.name=eval -c user.email=eval@example.com commit -q -m "Declare codex-note as Codex only"
