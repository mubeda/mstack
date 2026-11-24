#!/usr/bin/env bash
set -eu
here="$(dirname "$0")"
cp -R "$here/../_fixture/orders" ./orders
cp "$here/../wrong-finding/review.md" ./review.md
cd orders && printf "__pycache__/\n" > .gitignore && git init -q -b main && git add -A && git -c user.name=case -c user.email="case@"example.invalid commit -qm fixture
