#!/usr/bin/env bash
# Builds the run root of the case in the current folder: work/ with a README and a package manifest that has no
# dependency, and package.sha256 (the digest of that manifest) outside work/. Product and customers are invented.
set -eu
mkdir -p work
printf '# Example Courier site\n\nThe landing page goes here as index.html. No build step.\n' > work/README.md
cat > work/package.json <<'JSON'
{
  "name": "example-courier-site",
  "private": true,
  "version": "0.1.0"
}
JSON
sha256sum work/package.json | cut -d' ' -f1 > package.sha256
