#!/usr/bin/env bash
set -eu
mkdir -p work
cat > work/package.json <<'EOF'
{
  "name": "example-parser",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "test": "node --test"
  }
}
EOF
cat > work/parser.js <<'EOF'
// Parses simple KEY=VALUE config text into an object.
export function parseConfig(text) {
  const out = {};
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, value] = trimmed.split('=');
    out[key.trim()] = value.trim();
  }
  return out;
}
EOF
