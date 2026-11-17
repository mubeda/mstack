#!/usr/bin/env bash
# Builds the run root of the case in the current folder: an empty work/ folder (the text is in the prompt),
# a made-up terms file, and planted.txt (every value that must not appear in the reply).
# Every value is invented or from a range reserved for examples.
set -eu
mkdir -p work config/mstack
printf '%s\n' '# made-up terms for this case' 'person: Paloma Echeverrieta' > config/mstack/anonymize-terms.txt
printf '%s\n' 'Paloma Echeverrieta' 'paloma.echeverrieta@example.com' '+1 202 555 0107' '50237' > planted.txt
