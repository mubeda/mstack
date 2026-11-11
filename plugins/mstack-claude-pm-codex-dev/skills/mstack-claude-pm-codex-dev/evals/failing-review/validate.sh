#!/bin/sh
# The validation command: runs the tests and writes a summary file Git does not ignore.
python3 -m unittest 2>&1 | tail -1 > test-summary.txt
python3 -c "from mathlib import mul; assert mul(4, 3) == 12 and mul(4, -3) == -12" && python3 -m unittest
