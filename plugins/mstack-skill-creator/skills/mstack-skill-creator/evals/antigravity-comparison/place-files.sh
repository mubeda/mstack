#!/usr/bin/env bash
# The notes repository of local-small-skill, with the created skill already in place.
set -eu
bash "$(dirname "$0")/../local-small-skill/place-files.sh"
mkdir -p notes-app/.agents/skills/changelog-entry
cat > notes-app/.agents/skills/changelog-entry/SKILL.md <<'SKILL'
---
name: changelog-entry
description: Use when the user wants a changelog entry, release notes for one change, or asks to document a change that was just made. Produces one entry in the format the README describes.
---

# Changelog entry

Read the README's section on the changelog format, then add one entry at the top of CHANGELOG.md in that format.
SKILL
