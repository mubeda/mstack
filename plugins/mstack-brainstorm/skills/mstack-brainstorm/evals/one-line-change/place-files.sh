#!/usr/bin/env bash
set -eu
cp -R "$(dirname "$0")/../_fixture/shop" .
cd shop && git init -q && git add -A && git -c user.name=case -c user.email="case@"example.invalid commit -qm "fixture"
