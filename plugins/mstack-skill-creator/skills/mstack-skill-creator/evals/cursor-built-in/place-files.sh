#!/usr/bin/env bash
set -eu
here="$(cd "$(dirname "$0")" && pwd)"
work="$PWD"
bash "$here/../review-from-vendors/place-files.sh"
rm -rf "$work/bin" "$work/vendors"
