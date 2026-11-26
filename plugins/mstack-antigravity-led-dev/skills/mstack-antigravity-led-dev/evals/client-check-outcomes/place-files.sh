#!/usr/bin/env bash
set -eu
case_dir="$(cd "$(dirname "$0")" && pwd)"
DEV_SKILLS_SIDE=both bash "$case_dir/../_fixture/place.sh" plan "$case_dir"
variant="${VARIANT:-found}"
cp "vendors/result-1-${variant}.md" "vendors/result-1.md"
if [ -f "vendors/result-2-${variant}.md" ]; then
  cp "vendors/result-2-${variant}.md" "vendors/result-2.md"
fi
case "$variant" in
  found)
    cat > stand-in/approval-policy.txt <<EOF
Outside-sandbox approval policy for this stand-in run:
- Client check: record the simulated approval request and decision ("Client check outside sandbox: requested -> approved (claude and codex approved and found)") and state the client-check outcome first.
- Developer command launch: write the developer disclosure sentence, record the simulated approval request and decision ("Developer launch outside sandbox: requested -> approved"), then run the stand-in command in "$PWD/bin/" directly.
- Second reviewer command launch: write the reviewer disclosure sentence, record the simulated approval request and decision ("Reviewer launch outside sandbox: requested -> approved"), then run the stand-in command in "$PWD/bin/" directly.
EOF
    ;;
  not-installed)
    cat > stand-in/approval-policy.txt <<EOF
Outside-sandbox approval policy for this stand-in run:
- Client check: approved, neither claude nor codex installed (result-1 reports not installed for both). Record the simulated approval request and decision ("Client check outside sandbox: requested -> approved (approved and not installed)"), state the client-check outcome ("approved and not installed") and stop naming mstack-antigravity-led-review.
EOF
    ;;
  not-approved)
    cat > stand-in/approval-policy.txt <<EOF
Outside-sandbox approval policy for this stand-in run:
- Client check: NOT APPROVED by the user (result-1 reports "the run outside the sandbox was not approved" for both). Record the simulated approval request and decision ("Client check outside sandbox: requested -> declined (not approved: the run outside the sandbox was not approved)"), state the client-check outcome ("not approved" with "the run outside the sandbox was not approved", never "not installed") and stop naming mstack-antigravity-led-review.
EOF
    ;;
  launch-declined-dev)
    cat > stand-in/approval-policy.txt <<EOF
Outside-sandbox approval policy for this stand-in run:
- Client check: record "Client check outside sandbox: requested -> approved (approved and found)".
- Developer command launch: DECLINED by the user! Write the required developer disclosure sentence, record the simulated approval request and decision ("Developer launch outside sandbox: requested -> declined"), do NOT execute fake-dev.mjs, treat the declined launch as a failed round with the exact reason "the run outside the sandbox was not approved", and stop the phase with that report per host.md Approvals.
EOF
    ;;
  launch-declined-reviewer)
    cat > stand-in/approval-policy.txt <<EOF
Outside-sandbox approval policy for this stand-in run:
- Client check: record "Client check outside sandbox: requested -> approved (approved and found)".
- Developer command launch: approved (write the developer disclosure sentence, record "Developer launch outside sandbox: requested -> approved", and run the codex stand-in command in "$PWD/bin/").
- Second reviewer command launch: DECLINED by the user! Write the required reviewer disclosure sentence, record the simulated approval request and decision ("Reviewer launch outside sandbox: requested -> declined"), do NOT execute fake-review.mjs, treat the declined reviewer launch as a failed run with the exact reason "the run outside the sandbox was not approved", let the leader's finished review stand with no fallback review, and complete Phase 1 per host.md Approvals.
EOF
    ;;
  *)
    echo "unknown VARIANT: $variant" >&2
    exit 2
    ;;
esac
