#!/usr/bin/env bash
set -eu
mkdir shop && cd shop
g() { git -c user.name=case -c user.email="case@"example.invalid "$@"; }
git init -q -b main
printf 'def total(items):\n    return sum(i.price for i in items)\n' > cart.py
git add -A && g commit -qm "feat: add cart total"
printf '# Shop\n\nA small cart module.\n' > README.md
git add -A && g commit -qm "docs: add readme"
printf 'def total(items):\n    return sum(i.price * i.quantity for i in items)\n' > cart.py
git add -A && g commit -qm "fix: count quantity in cart total"
# The staged change the commit message is for: a renamed function.
printf 'def cart_total(items):\n    return sum(i.price * i.quantity for i in items)\n' > cart.py
git add -A
