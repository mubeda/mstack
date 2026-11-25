#!/usr/bin/env bash
set -eu
case_dir="$(cd "$(dirname "$0")" && pwd)"
DEV_SKILLS_SIDE=codex bash "$case_dir/../_fixture/place.sh" plan "$case_dir"
cat > mathlib/validate.sh <<'EOF'
#!/bin/sh
set -eu
python3 -m unittest
printf "all tests passed\n" > test-summary.txt
EOF
chmod +x mathlib/validate.sh
(
  cd mathlib
  git add validate.sh
  git commit -q -m "Add validate.sh"
)
