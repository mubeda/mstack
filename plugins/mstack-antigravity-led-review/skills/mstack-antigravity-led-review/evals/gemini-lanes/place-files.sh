#!/usr/bin/env bash
set -eu
here="$(cd "$(dirname "$0")" && pwd)"
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

cat <<'JSON' > "$PWD/subagents/lane-a-0001.json"
{
  "conversationId": "lane-a-0001",
  "spawnStepIndex": 1,
  "subagentDescriptor": {
    "typeName": "review-lane",
    "role": "mstack-run1-A"
  }
}
JSON
cat <<'JSONL' > "$PWD/lanes/lane-a-0001.jsonl"
{"step":1,"role":"assistant","model":"gemini-4-prism-pro","tool_calls":[{"name":"write_file","args":{"Path":"notes.py"}}]}
{"step":2,"role":"assistant","model":"gemini-4-prism-pro","tool_calls":[{"name":"run_command","args":{"CommandLine":"python3 -m unittest"}}]}
JSONL
ln -sf lane-a-0001.jsonl "$PWD/lanes/A.jsonl"

skill_dir="$(cd "$here/../.." && pwd)"
mkdir -p "$PWD/workflow"
cp "$skill_dir/SKILL.md" "$PWD/workflow/SKILL.md"
cp "$skill_dir/host.md" "$PWD/workflow/host.md"
cp -R "$skill_dir/references" "$PWD/workflow/references"
cp -R "$skill_dir/scripts" "$PWD/workflow/scripts"
export PATH="$PWD/bin:$PATH"

