#!/usr/bin/env bash
set -eu
here="$(dirname "$0")"
cp -R "$here/../_fixture/shop" ./shop
cd shop
g() { git -c user.name=case -c user.email="case@"example.invalid "$@"; }
git init -q -b main && git add -A && g commit -qm "export behind the EXPORT_V2 flag"
# The wiki cites the commit its code claim was true at.
sed -i.bak "s/shop@COMMIT/shop@$(git rev-parse --short HEAD)/" docs/wiki/export-flag.md && rm docs/wiki/export-flag.md.bak
git add -A && g commit -qm "wiki: record the flag decision"
python3 - <<'PY'
import re
p = "app/export.py"
s = open(p).read()
s = s.replace('    if not export_v2_enabled():\n        raise RuntimeError("the CSV export is behind the EXPORT_V2 flag")\n', '')
s = re.sub(r'\ndef export_v2_enabled\(\):\n    return .*\n\n', '', s).replace('import os\n', '')
open(p, "w").write(s)
PY
git add -A && g commit -qm "remove the EXPORT_V2 flag"
