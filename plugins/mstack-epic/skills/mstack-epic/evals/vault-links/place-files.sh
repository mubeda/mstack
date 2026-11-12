#!/usr/bin/env bash
set -eu
cp -R "$(dirname "$0")/files/." .
PLAN="Projects/Portal/product-plan.md"
( sha256sum "$PLAN" 2>/dev/null || shasum -a 256 "$PLAN" ) | cut -d" " -f1 > .plan-sha256
