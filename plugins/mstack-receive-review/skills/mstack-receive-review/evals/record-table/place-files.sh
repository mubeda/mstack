#!/usr/bin/env bash
set -eu
here="$(dirname "$0")"
cp -R "$here/../_fixture/orders" ./orders
for n in 1 2 3 4 5 6 7 8 9 10; do cp "$here/../wrong-finding/review.md" "./review-$n.md"; done
cd orders && printf "__pycache__/\n" > .gitignore && git init -q -b main && git add -A && git -c user.name=case -c user.email="case@"example.invalid commit -qm fixture
