#!/usr/bin/env bash
# Builds the run root of the case in the current folder: work/notes.txt (the raw file), a made-up terms file,
# planted.txt (every value that must not appear in the reply) and the raw file's checksum.
# Every value is invented or from a range reserved for examples.
set -eu
mkdir -p work config/mstack
printf '%s\n' 'Call back Test Person Alpha, test.person.alpha@example.com, about the late parcel.' \
  'Her mobile is +1 202 555 0143; she is in after four.' > work/notes.txt
printf '%s\n' '# made-up terms for this case' 'person: Test Person Alpha' > config/mstack/anonymize-terms.txt
printf '%s\n' 'Test Person Alpha' 'test.person.alpha@example.com' '+1 202 555 0143' > planted.txt
sha256sum work/notes.txt | cut -d' ' -f1 > notes.sha256
