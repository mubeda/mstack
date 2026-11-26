#!/usr/bin/env bash
set -eu
bash "$(dirname "$0")/../plugin-target/place-files.sh"
rm -rf "$PWD/vendors"
