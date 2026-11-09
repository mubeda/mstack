#!/usr/bin/env sh
# Builds the test repository: 8 commits, slugify regresses at commit 5.
set -eu
mkdir -p shop && cd shop
git init -q -b main
c() { git -c user.email=dev@example.invalid -c user.name=dev commit -qam "$1"; }
cat > slug.py <<'PY'
import re
def slugify(title):
    s = title.lower().replace("'", "")
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")
PY
cat > test_slug.py <<'PY'
import unittest
from slug import slugify
class SlugTest(unittest.TestCase):
    def test_apostrophe(self):
        self.assertEqual(slugify("Don't Panic"), "dont-panic")
    def test_spaces(self):
        self.assertEqual(slugify("  Hello  World "), "hello-world")
if __name__ == "__main__":
    unittest.main()
PY
echo "# shop" > README.md
git add -A && git -c user.email=dev@example.invalid -c user.name=dev commit -qm "add slugify" && git tag v1.0
echo "Docs." >> README.md && c "docs: readme"
printf '\ndef is_slug(s):\n    return bool(re.fullmatch(r"[a-z0-9-]+", s))\n' >> slug.py && c "feat: is_slug helper"
echo "More docs." >> README.md && c "docs: more readme"
sed -i 's/s = title.lower().replace("'"'"'", "")/s = title.lower()/' slug.py && c "refactor: simplify slugify"
echo "Changelog." >> README.md && c "docs: changelog"
printf '\ndef slug_len(s):\n    return len(slugify(s))\n' >> slug.py && c "feat: slug_len"
echo "Final." >> README.md && c "docs: final"
