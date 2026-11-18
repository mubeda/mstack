#!/usr/bin/env bash
# Builds the run root of the case in the current folder: work/ with a two-line README.
# The product and every fact in the prompt are invented.
set -eu
mkdir -p work
printf '# Example Ledger help\n\nThe help page goes here as help.html. Plain HTML and CSS, no build step.\n' > work/README.md
