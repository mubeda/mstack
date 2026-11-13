#!/usr/bin/env bash
set -eu
cp -R "$(dirname "$0")/files/." .
M="jo.park@"dune.example
sed "s/{{MAIL}}/$M/" tickets.csv > tickets.tmp && mv tickets.tmp tickets.csv
