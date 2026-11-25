#!/usr/bin/env bash
set -eu
here="$(cd "$(dirname "$0")" && pwd)"
variant="${LANE_VARIANT:-codex-left}"
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
cat <<'JSONL' > "$PWD/lanes/lane-a-0002.jsonl"
{"step":1,"role":"assistant","model":"claude-fixture-1","tool_calls":[{"name":"write_file","args":{"Path":"notes.py"}}]}
{"step":2,"role":"assistant","model":"claude-fixture-1","tool_calls":[{"name":"run_command","args":{"CommandLine":"python3 -m unittest"}}]}
JSONL
if [ "$variant" = "none-left" ]; then
  cp "$PWD/vendors/none-left-result-3.md" "$PWD/vendors/result-3.md"
  cp "$PWD/vendors/none-left-result-4.md" "$PWD/vendors/result-4.md"
else
  cp "$PWD/vendors/codex-left-result-3.md" "$PWD/vendors/result-3.md"
fi
rm -f "$PWD/vendors/codex-left-result-3.md" "$PWD/vendors/none-left-result-3.md" "$PWD/vendors/none-left-result-4.md"

skill_dir="$(cd "$here/../.." && pwd)"
mkdir -p "$PWD/workflow"
cp "$skill_dir/SKILL.md" "$PWD/workflow/SKILL.md"
cp "$skill_dir/host.md" "$PWD/workflow/host.md"
cp -R "$skill_dir/references" "$PWD/workflow/references"
cp -R "$skill_dir/scripts" "$PWD/workflow/scripts"
export PATH="$PWD/bin:$PATH"

