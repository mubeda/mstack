#!/usr/bin/env bash
set -eu
cp -R "$(dirname "$0")/files/." .
cc -g -O0 -o parsecfg parsecfg.c
