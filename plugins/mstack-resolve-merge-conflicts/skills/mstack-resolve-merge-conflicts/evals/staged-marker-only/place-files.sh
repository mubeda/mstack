#!/usr/bin/env bash
set -eu
T="$(cd "${1:-.}" && pwd)"
cd "$T"
git init -b main >/dev/null
git config user.name "Dev"
git config user.email "dev@example.com"
git config commit.gpgsign false

mkdir -p docs src
cat <<'EOF' > docs/conflict-guide.md
# Example markers
```text
<<<<<<< HEAD
example ours
=======
example theirs
>>>>>>> branch
```
EOF
cat <<'EOF' > src/config.js
export const timeoutMs = 1000;
EOF
git add -A
git commit -m "Initial config and guide" >/dev/null

cat <<'EOF' > src/config.js
<<<<<<< HEAD
export const retries = 3;
=======
export const timeoutMs = 2000;
>>>>>>> feat/timeout
EOF
git add src/config.js
