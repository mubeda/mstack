#!/usr/bin/env bash
# Runs after the fixture commit: leaves one tracked file modified.
set -eu
echo "Local note, not committed." >> README.md
