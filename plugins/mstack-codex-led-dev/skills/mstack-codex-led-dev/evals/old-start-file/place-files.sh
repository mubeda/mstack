#!/usr/bin/env bash
set -eu
case_dir="$(cd "$(dirname "$0")" && pwd)"
DEV_SKILLS_SIDE=claude bash "$case_dir/../_fixture/place.sh" plan "$case_dir"
cat > mathlib/docs/plans/mathlib-functions/execute-plan.md <<'EOF'
# Execute plan: mathlib functions

- Recommended mode: Inline

Inline, mstack-codex-review-workflow or mstack-claude-review-workflow, or mstack-claude-pm-codex-dev in Claude Code.
EOF
(cd mathlib && git add docs/plans/mathlib-functions/execute-plan.md && git commit -q -m "Old execute-plan.md")
