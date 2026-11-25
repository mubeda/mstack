#!/usr/bin/env bash
# Shared placement helper for dev-kind eval cases and self-test cases.
# Usage: bash "<fixture>/place.sh" <plan-variant> [case-dir]
#   <plan-variant>: plan | none | <path to plan folder>
#   [case-dir]: optional case folder holding files/ (vendors/, stand-in/, models/); omitted for self-test cases.
set -eu
variant="${1:?plan variant required (plan | none | <dir>)}"
case_dir="${2:-}"
fixture="$(cd "$(dirname "$0")" && pwd)"
work="$PWD"

cp -R "$fixture/mathlib" "$work/mathlib"
if [ "$variant" != "none" ]; then
  if [ -d "$fixture/$variant" ]; then
    plan_src="$fixture/$variant"
  elif [ -d "$variant" ]; then
    plan_src="$variant"
  else
    echo "place.sh: unknown plan variant: $variant" >&2
    exit 2
  fi
  mkdir -p "$work/mathlib/docs/plans"
  cp -R "$plan_src" "$work/mathlib/docs/plans/mathlib-functions"
fi

# Place developer-side fixture skills inside the repository so they are tracked (and land in a copy developer's copy).
dev_side="${DEV_SKILLS_SIDE:-both}"
place_dev_skills() {
  local target="$1"
  shift
  local s
  for s in "$@"; do
    mkdir -p "$work/mathlib/$target/$s"
    cp "$fixture/dev-skills/$s/SKILL.md.fixture" "$work/mathlib/$target/$s/SKILL.md"
  done
}
all_dev_skills=(ponytail mstack-diagnose mstack-best-model-for mstack-receive-review)
same_folder="${LEADER_SAME_FOLDER:-0}"
leader_host="${LEADER_HOST:-}"
if [ "$same_folder" = "1" ] && [ "$leader_host" != "claude" ] && [ "$leader_host" != "codex" ]; then
  echo "place.sh: LEADER_SAME_FOLDER=1 requires LEADER_HOST=claude or LEADER_HOST=codex" >&2
  exit 2
fi
if [ "$dev_side" = "claude" ] || [ "$dev_side" = "both" ]; then
  if [ "$same_folder" = "1" ] && [ "$leader_host" = "claude" ]; then
    place_dev_skills ".claude/skills" ponytail mstack-diagnose
  else
    place_dev_skills ".claude/skills" "${all_dev_skills[@]}"
  fi
fi
if [ "$dev_side" = "codex" ] || [ "$dev_side" = "both" ]; then
  if [ "$same_folder" = "1" ] && [ "$leader_host" = "codex" ]; then
    place_dev_skills ".agents/skills" ponytail mstack-diagnose
  else
    place_dev_skills ".agents/skills" "${all_dev_skills[@]}"
  fi
fi

(
  cd "$work/mathlib"
  git init -q -b main
  git config user.name eval
  git config user.email eval@example.com
  git add -A
  git commit -q -m "Initial mathlib repo and plan"
  mkdir -p .git/info
  {
    echo ".claude/skills/mstack-*"
    echo ".agents/skills/mstack-*"
    echo ".codex/skills/mstack-*"
  } >> .git/info/exclude
)

# With a case folder, place stand-ins and case files beside mathlib/ (never inside it) and fill @WORK@ / @VENDORS@.
if [ -n "$case_dir" ]; then
  mkdir -p "$work/bin" "$work/stand-in"
  cp "$fixture/bin/"* "$work/bin/"
  chmod +x "$work/bin/"*
  if [ -d "$case_dir/files" ]; then
    cp -R "$case_dir/files/." "$work/"
  fi
  vendors_dir="${MSTACK_VENDORS_DIR:-$(cd "$fixture/../../../../../mstack-vendors/skills/mstack-vendors" && pwd)}"
  find "$work" -maxdepth 4 -type f \( -path "$work/vendors/*" -o -path "$work/stand-in/*" -o -path "$work/models/*" -o -path "$work/bin/*" \) -print0 | while IFS= read -r -d '' f; do
    node -e '
      const fs = require("node:fs");
      const [w, v, p] = process.argv.slice(1);
      const s = fs.readFileSync(p, "utf8");
      if (s.includes("@WORK@") || s.includes("@VENDORS@")) {
        fs.writeFileSync(p, s.replaceAll("@WORK@", () => w).replaceAll("@VENDORS@", () => v));
      }
    ' "$work" "$vendors_dir" "$f"
  done
fi
