#!/usr/bin/env bash
set -eu
cp -R "$(dirname "$0")/files/." .
git init -q
git add -A
git -c user.name=eval -c user.email="eval@"example.invalid commit -q -m "docs: initial notes"
PLAN="docs/product/2026-11-01-self-service-portal/product-plan.md"
( sha256sum "$PLAN" 2>/dev/null || shasum -a 256 "$PLAN" ) | cut -d" " -f1 > .plan-sha256
