#!/usr/bin/env bash
# Shared scaffold of the eval cases. Run from an empty run root with the case folder as the argument.
# It leaves: shop/ (a git repository of the made-up project example--org/shop, the session's working folder),
# bin/gh (the stand-in, to be put first on PATH), .fake-gh/ (the stand-in's tracker, FAKE_GH_DIR),
# and the empty folders .gh-empty/ and .home-empty/ for GH_CONFIG_DIR and HOME.
set -eu
case_dir="$1"
fixture="$(cd "$(dirname "$0")" && pwd)"
mkdir -p bin .fake-gh .gh-empty .home-empty shop
cp "$fixture/bin/gh" bin/gh
chmod +x bin/gh
cp -R "$case_dir/files/tracker/." .fake-gh/
cp -R "$fixture/shop/." shop/
if [ -d "$case_dir/files/shop" ]; then cp -R "$case_dir/files/shop/." shop/; fi
cd shop
git init -q -b main
git remote add origin https://github.com/example--org/shop.git
git -c user.name=eval -c user.email=eval@example.com add -A
git -c user.name=eval -c user.email=eval@example.com commit -qm "Shop: orders, export, upload"
