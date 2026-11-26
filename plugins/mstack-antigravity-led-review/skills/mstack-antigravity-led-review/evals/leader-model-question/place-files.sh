#!/usr/bin/env bash
set -eu
here="$(cd "$(dirname "$0")" && pwd)"
bash "$here/../_fixture/place.sh" plan "$here"
skill_dir="$(cd "$here/../.." && pwd)"
mkdir -p "$PWD/workflow"
[ -f "$skill_dir/SKILL.md" ] && cp "$skill_dir/SKILL.md" "$PWD/workflow/SKILL.md"
[ -f "$skill_dir/host.md" ] && cp "$skill_dir/host.md" "$PWD/workflow/host.md"
[ -d "$skill_dir/references" ] && cp -R "$skill_dir/references" "$PWD/workflow/references"
[ -d "$skill_dir/scripts" ] && cp -R "$skill_dir/scripts" "$PWD/workflow/scripts"
export PATH="$PWD/bin:$PATH"
v="${LEADER_VARIANT:-gemini-id}"
case "$v" in
  gemini-id)
    cp "$PWD/vendors/leader-antigravity.md" "$PWD/vendors/result-1.md"
    cp "$PWD/vendors/select-both-cross.md" "$PWD/vendors/result-2.md"
    cp "$PWD/vendors/refresh-codex-astra.md" "$PWD/vendors/result-3.md"
    ;;
  claude-id)
    cp "$PWD/vendors/leader-claude.md" "$PWD/vendors/result-1.md"
    cp "$PWD/vendors/select-codex-only.md" "$PWD/vendors/result-2.md"
    ;;
  does-not-know|not-an-offered-id|listing-fails-exit1|listing-fails-empty|cannot-ask)
    cp "$PWD/vendors/leader-unknown.md" "$PWD/vendors/result-1.md"
    cp "$PWD/vendors/select-both-unknown.md" "$PWD/vendors/result-2.md"
    ;;
esac
if [ "$v" = "listing-fails-exit1" ]; then
  rm -f "$PWD/files/models-list.txt"
  printf '#!/usr/bin/env bash\necho "agy models failed" >&2\nexit 1\n' > "$PWD/bin/agy"
  chmod +x "$PWD/bin/agy"
elif [ "$v" = "listing-fails-empty" ]; then
  rm -f "$PWD/files/models-list.txt"
  printf '#!/usr/bin/env bash\nexit 0\n' > "$PWD/bin/agy"
  chmod +x "$PWD/bin/agy"
elif [ "$v" = "cannot-ask" ]; then
  cat <<'EOF' > "$PWD/run-constraints.md"
# Run constraints

Nobody can answer questions in this run. Do not ask the user any question and do not pause to wait for a reply; omit `Leader model`, take the recommended reviewers from the selection result, and report in section 9 that the leader's model is unknown because nobody could be asked.
EOF
fi
