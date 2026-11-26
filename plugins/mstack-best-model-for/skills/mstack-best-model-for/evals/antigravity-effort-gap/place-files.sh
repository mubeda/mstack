#!/usr/bin/env bash
# Controlled inventory: a workspace copy of the skill whose Neon line has no medium and whose Flash line has no effort at or below medium.
set -eu
skill="$(cd "$(dirname "$0")/../.." && pwd)"
dest=.claude/skills/mstack-best-model-for
mkdir -p "$dest"
rsync -a --exclude evals "$skill/" "$dest/"
sed -i 's/^- Antigravity `gemini-4-neon`:.*$/- Antigravity `gemini-4-neon`: `low`, `high`/' "$dest/references/model-table.md"
sed -i 's/^- Antigravity `gemini-3.8-flash`:.*$/- Antigravity `gemini-3.8-flash`: `high`/' "$dest/references/model-table.md"
grep -q '^- Antigravity `gemini-4-neon`: `low`, `high`$' "$dest/references/model-table.md"
grep -q '^- Antigravity `gemini-3.8-flash`: `high`$' "$dest/references/model-table.md"
