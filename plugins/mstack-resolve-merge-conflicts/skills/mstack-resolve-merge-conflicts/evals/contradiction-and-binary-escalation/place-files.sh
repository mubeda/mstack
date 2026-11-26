#!/usr/bin/env bash
set -eu
T="$(cd "${1:-.}" && pwd)"
cd "$T"
git init -b main >/dev/null
git config user.name "Dev"
git config user.email "dev@example.com"
git config commit.gpgsign false

mkdir -p src assets
cat <<'EOF' > src/price.js
export function totalPrice(base) {
  return base;
}
EOF
printf '\x89PNG\r\n\x1a\n\x00\x00\x00base' > assets/logo.png
git add -A
git commit -m "Base pricing and logo" >/dev/null

git checkout -b feat/flat-fee >/dev/null
cat <<'EOF' > src/price.js
export function totalPrice(base) {
  return base + 5;
}
EOF
printf '\x89PNG\r\n\x1a\n\x00\x00\x00feat' > assets/logo.png
git add -A
git commit -m "pricing update" >/dev/null

git checkout main >/dev/null
cat <<'EOF' > src/price.js
export function totalPrice(base) {
  return base * 1.1;
}
EOF
printf '\x89PNG\r\n\x1a\n\x00\x00\x00main' > assets/logo.png
git add -A
git commit -m "adjust total" >/dev/null

git merge feat/flat-fee >/dev/null 2>&1 || true
