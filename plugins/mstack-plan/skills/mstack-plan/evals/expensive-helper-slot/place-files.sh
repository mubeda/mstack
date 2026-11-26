#!/usr/bin/env bash
set -eu
cp -R "$(dirname "$0")/../_fixture/shop" .
# The fixture's project skill is stored as SKILL.md.fixture so installs of this skill do not pick it up.
find shop -name 'SKILL.md.fixture' -exec sh -c 'mv "$1" "${1%.fixture}"' _ {} \;
# A copy of mstack-best-model-for whose Codex standard tier is a flagged model, so a helper slot is flagged.
# MODEL_SKILL is that skill's folder; the default is its place in a checkout of the mstack repository.
src=${MODEL_SKILL:-$(dirname "$0")/../../../../../mstack-best-model-for/skills/mstack-best-model-for}
[ -f "$src/SKILL.md" ] || { echo "set MODEL_SKILL to the folder of the mstack-best-model-for skill" >&2; exit 1; }
mkdir -p .claude/skills/mstack-best-model-for
cp -R "$src/SKILL.md" "$src/references" .claude/skills/mstack-best-model-for/
t=.claude/skills/mstack-best-model-for/references/model-table.md
sed -i.bak '/^| standard | /s/gpt-6\.2-sol/gpt-6.2-astra/' "$t" && rm "$t.bak"
grep -q '^| standard | .*gpt-6\.2-astra' "$t" || { echo "the standard row of the model table has changed its form" >&2; exit 1; }
