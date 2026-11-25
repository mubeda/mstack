#!/usr/bin/env bash
set -eu
here="$(cd "$(dirname "$0")" && pwd)"
variant="${LANE_VARIANT:-no-model}"
bash "$here/../_fixture/place.sh" plan "$here"

# Create finished lane A worktree on branch mstack/run1/A with item 1.1 committed
mkdir -p "$PWD/wt" "$PWD/reports" "$PWD/subagents" "$PWD/lanes"
(
  cd "$PWD/notes"
  git worktree add -q -b mstack/run1/A "$PWD/../wt/A" main
)
cat <<'PY' > "$PWD/wt/A/notes.py"
def add(notes, text):
    notes.append(text)
    return notes


def remove(notes, text):
    if text not in notes:
        raise ValueError(f"note not found: {text}")
    notes.remove(text)
    return notes
PY
cat <<'PY' > "$PWD/wt/A/test_notes.py"
import unittest
from notes import add, remove


class NotesTest(unittest.TestCase):
    def test_remove_first_match(self):
        items = add(add([], "a"), "a")
        self.assertEqual(remove(items, "a"), ["a"])

    def test_remove_missing_raises(self):
        with self.assertRaises(ValueError):
            remove(["a"], "b")


if __name__ == "__main__":
    unittest.main()
PY
(
  cd "$PWD/wt/A"
  git add notes.py test_notes.py
  git commit -q -m "feat(notes): add remove(notes, text) with unit tests"
)
SHA_A="$(git -C "$PWD/wt/A" rev-parse --short HEAD)"
cat <<EOF > "$PWD/reports/A.md"
# Lane A report (item 1.1)

- Status: done
- Branch: mstack/run1/A
- Worktree: $PWD/wt/A
- Commit: $SHA_A feat(notes): add remove(notes, text) with unit tests
- Changed files: notes.py, test_notes.py
- Validation: python3 -m unittest discover -s . -p "test_*.py" passed (2 tests, OK)
- Open questions: none
EOF

cat <<'JSON' > "$PWD/subagents/decoy-0001.json"
{
  "conversationId": "decoy-0001",
  "spawnStepIndex": 1,
  "subagentDescriptor": {
    "typeName": "review-lane",
    "role": "mstack-run1-A"
  }
}
JSON
cat <<'JSONL' > "$PWD/lanes/decoy-0001.jsonl"
{"step":1,"role":"assistant","model":"gemini-4-neon-medium","tool_calls":[{"name":"read_file","args":{"Path":"notes.py"}}]}
JSONL
cat <<'JSON' > "$PWD/subagents/lane-a-0002.json"
{
  "conversationId": "lane-a-0002",
  "spawnStepIndex": 2,
  "subagentDescriptor": {
    "typeName": "review-lane",
    "role": "mstack-run1-A"
  }
}
JSON
if [ "$variant" = "unreadable" ]; then
  rm -f "$PWD/vendors/result-4.md" "$PWD/vendors/result-5.md"
  cat <<'MD' > "$PWD/lane-scope.md"
# Scope for this run

- Deliver item 1.1 only (lane A). Stop after lane A's review is processed and reported (do not integrate or push).
- Lane A worktree: `wt/A` (branch `mstack/run1/A`), report: `reports/A.md`
- Lane A `invoke_subagent` returned `conversationId`: `lane-a-0002`
- Subagent records live in `subagents/`, and each subagent's transcript lives at `lanes/<conversationId>.jsonl`.
MD
else
  cat <<'JSONL' > "$PWD/lanes/lane-a-0002.jsonl"
{"step":1,"role":"assistant","tool_calls":[{"name":"write_file","args":{"Path":"notes.py"}}]}
{"step":2,"role":"assistant","tool_calls":[{"name":"run_command","args":{"CommandLine":"python3 -m unittest"}}]}
JSONL
  
# Create finished lane B worktree on branch mstack/run1/B with item 1.2 committed
(
  cd "$PWD/notes"
  git worktree add -q -b mstack/run1/B "$PWD/../wt/B" main
)
cat <<'MD' >> "$PWD/wt/B/README.md"

## API

- `add(notes, text)` — appends `text` to `notes` and returns `notes`. Example: `add([], "buy milk")` returns `["buy milk"]`.
- `remove(notes, text)` — removes the first matching `text` from `notes` and returns `notes`; raises `ValueError` if absent. Example: `remove(["buy milk"], "buy milk")` returns `[]`.
MD
(
  cd "$PWD/wt/B"
  git add README.md
  git commit -q -m "docs(readme): document add and remove API"
)
SHA_B="$(git -C "$PWD/wt/B" rev-parse --short HEAD)"
cat <<EOF > "$PWD/reports/B.md"
# Lane B report (item 1.2)

- Status: done
- Branch: mstack/run1/B
- Worktree: $PWD/wt/B
- Commit: $SHA_B docs(readme): document add and remove API
- Changed files: README.md
- Validation: grep -q 'add(notes, text)' README.md && grep -q 'remove(notes, text)' README.md exited 0
- Open questions: none
EOF

  cat <<'JSON' > "$PWD/subagents/lane-b-0003.json"
{
  "conversationId": "lane-b-0003",
  "spawnStepIndex": 3,
  "subagentDescriptor": {
    "typeName": "review-lane",
    "role": "mstack-run1-B"
  }
}
JSON
  cat <<'JSONL' > "$PWD/lanes/lane-b-0003.jsonl"
{"step":1,"role":"assistant","model":"claude-fixture-1","tool_calls":[{"name":"write_file","args":{"Path":"README.md"}}]}
JSONL
  cat <<'MD' > "$PWD/lane-scope.md"
# Scope for this run

- Deliver BOTH items 1.1 (lane A) and 1.2 (lane B), review lane A then lane B, integrate both onto an integration branch in `notes/`, run the final integration review, and stop after the integration review is processed and reported (do not open a PR or push).
- Lane A worktree: `wt/A` (branch `mstack/run1/A`), report: `reports/A.md`, `invoke_subagent` returned `conversationId`: `lane-a-0002`.
- Lane B worktree: `wt/B` (branch `mstack/run1/B`), report: `reports/B.md`, `invoke_subagent` returned `conversationId`: `lane-b-0003`.
- Subagent records live in `subagents/`, and each subagent's transcript lives at `lanes/<conversationId>.jsonl`.
MD
fi

skill_dir="$(cd "$here/../.." && pwd)"
mkdir -p "$PWD/workflow"
cp "$skill_dir/SKILL.md" "$PWD/workflow/SKILL.md"
cp "$skill_dir/host.md" "$PWD/workflow/host.md"
cp -R "$skill_dir/references" "$PWD/workflow/references"
cp -R "$skill_dir/scripts" "$PWD/workflow/scripts"
export PATH="$PWD/bin:$PATH"

