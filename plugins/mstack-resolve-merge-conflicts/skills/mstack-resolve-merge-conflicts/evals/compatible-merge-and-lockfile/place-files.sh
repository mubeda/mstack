#!/usr/bin/env bash
set -eu
T="$(cd "${1:-.}" && pwd)"
cd "$T"
git init -b main >/dev/null
git config user.name "Dev"
git config user.email "dev@example.com"
git config commit.gpgsign false

mkdir -p src test
cat <<'EOF' > package.json
{
  "name": "conflict-eval-sample",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "test": "node --test"
  }
}
EOF
cat <<'EOF' > package-lock.json
{
  "name": "conflict-eval-sample",
  "version": "1.0.0",
  "lockfileVersion": 3,
  "packages": {
    "": { "name": "conflict-eval-sample", "version": "1.0.0" }
  }
}
EOF
cat <<'EOF' > src/format.js
import { trimText } from './helpers.js';

export function formatOrder(order) {
  return trimText(order.id);
}

// Unrelated utility that must stay untouched during conflict resolution.
export function unrelatedHelper(x) {
  return x * 2;
}
EOF
cat <<'EOF' > src/helpers.js
export const trimText = (s) => String(s).trim();
export const validateOrder = (o) => { if (!o?.id) throw new Error('missing id'); };
export const logOrder = (o, out) => { out.push(`order:${o.id}`); };
EOF
cat <<'EOF' > src/old-notes.txt
line 1: base note
line 2: order formatter behavior
line 3: release tracking
EOF
cat <<'EOF' > test/format.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatOrder, unrelatedHelper } from '../src/format.js';

test('formats order id', () => {
  assert.equal(formatOrder({ id: ' A1 ' }), 'A1');
  assert.equal(unrelatedHelper(3), 6);
});
EOF

git add -A
git commit -m "Initial order formatter" >/dev/null

git checkout -b feat/logging >/dev/null
cat <<'EOF' > src/format.js
import { trimText, logOrder } from './helpers.js';

export function formatOrder(order, audit = []) {
  const id = trimText(order.id);
  logOrder(order, audit);
  return id;
}

// Unrelated utility that must stay untouched during conflict resolution.
export function unrelatedHelper(x) {
  return x * 2;
}
EOF
cat <<'EOF' > package-lock.json
{
  "name": "conflict-eval-sample",
  "version": "1.0.1",
  "lockfileVersion": 3,
  "packages": {
    "": { "name": "conflict-eval-sample", "version": "1.0.1" }
  }
}
EOF
git mv src/old-notes.txt src/release-notes.txt
git add -A
git commit -m "Feat: add audit logging to formatOrder and rename old-notes to release-notes" >/dev/null

git checkout main >/dev/null
cat <<'EOF' > src/format.js
import { trimText, validateOrder } from './helpers.js';

export function formatOrder(order) {
  validateOrder(order);
  return trimText(order.id);
}

// Unrelated utility that must stay untouched during conflict resolution.
export function unrelatedHelper(x) {
  return x * 2;
}
EOF
cat <<'EOF' > package-lock.json
{
  "name": "conflict-eval-sample",
  "version": "1.0.2",
  "lockfileVersion": 3,
  "packages": {
    "": { "name": "conflict-eval-sample", "version": "1.0.2" }
  }
}
EOF
printf 'line 1: base note\nline 2: order formatter behavior\nline 3: release tracking\nline 4: main local edit\n' > src/old-notes.txt
git add -A
git commit -m "Main: validate order before formatting and append local note" >/dev/null

git -c merge.renames=false merge feat/logging >/dev/null 2>&1 || true
