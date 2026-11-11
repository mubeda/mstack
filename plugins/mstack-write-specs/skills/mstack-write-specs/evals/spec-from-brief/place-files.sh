#!/usr/bin/env bash
set -eu
here="$(dirname "$0")"
cp -R "$here/../first-round/files/shop" .
mkdir -p shop/docs/briefs
cp "$here/files/brief/2026-01-15-reset-links.md" shop/docs/briefs/
# Variant "draft brief": run with DRAFT_BRIEF=1 to mark the same brief as not approved.
if [ "${DRAFT_BRIEF:-0}" = 1 ]; then
  sed -i.bak 's/^Status: Approved .*/Status: Draft/' shop/docs/briefs/2026-01-15-reset-links.md && rm shop/docs/briefs/2026-01-15-reset-links.md.bak
fi
