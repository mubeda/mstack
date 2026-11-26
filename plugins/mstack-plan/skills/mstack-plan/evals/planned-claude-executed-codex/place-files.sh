#!/usr/bin/env bash
set -eu
here="$(cd "$(dirname "$0")" && pwd)"
work="$PWD"
mkdir -p "$work/docs/plans" "$work/app" "$work/bin" "$work/vendors"
cp -R "$here/../_fixture/start-file-plan" "$work/docs/plans/greeting"
rm -rf "$work/docs/plans/greeting/app"
git init -q -b main
mkdir -p .git/info
printf '%s\n' '.agents/' 'prompt.md' 'replies/' 'vendors/' 'bin/' >> .git/info/exclude
git add -A
git -c user.name=eval -c user.email=eval@example.com commit -q -m "base plan"
git checkout -q -b plan/greeting

cat > "$work/app/greet.py" <<'PY'
def greet(name: str) -> str:
    return f"Hello, {name}"
PY
cat > "$work/app/test_greet.py" <<'PY'
import unittest
from greet import greet


class TestGreet(unittest.TestCase):
    def test_greets(self):
        self.assertEqual(greet("Ada"), "Hello, Ada")


if __name__ == "__main__":
    unittest.main()
PY
git add app/
git -c user.name=eval -c user.email=eval@example.com commit -q -m "task 1.1 greet by name"
c1="$(git rev-parse --short HEAD)"

cat > "$work/docs/plans/greeting/progress.md" <<EOF
# Progress: Greeting plan

Plan: plan.md
Spec: spec.md (sha256 11f0216323e8)
Plan status: Approved 2026-11-20
Plan review: codex gpt-6.2-sol xhigh, cross-vendor, round 1, Approve
Written by: claude
Executor: inline
Branch: plan/greeting

| Task | Title | Phase | State | Owner | Note |
|---|---|---|---|---|---|
| 1.1 | Greet by name | 1 | Closed | inline | |
| 1.2 | Reject empty names | 1 | Open | | |

## Log
- 2026-11-20 10:00 1.1 Closed. Executed by: codex. Evidence: \`python3 -m unittest discover -s app\` exit 0, 1 test. Commits: $c1.
EOF
git add docs/plans/greeting/progress.md
git -c user.name=eval -c user.email=eval@example.com commit -q -m "record task 1.1 closed"

cp "$here/../_fixture/bin/review-ok" "$work/bin/review-ok"
chmod +x "$work/bin/review-ok"
sed "s|@WORK@|$work|g" "$here/files/vendors/result-1.md" > "$work/vendors/result-1.md"
