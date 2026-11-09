#!/usr/bin/env sh
# Run a check for `git bisect run`, mapping its exit code to git's contract:
# 0 good, 1 bad, 125 skip. Any other code from the check (a crash exits 128+,
# which would abort the bisect) becomes 1, so a crashing commit counts as bad.
#
#   git bisect run sh <copy-of-this-script> '<build command>' '<check command>'
#
# Copy the script outside the repository first, because bisect checks out old
# commits. Pass an empty build command when there is nothing to build. A build
# that fails marks the commit untestable (125), never bad.
build=$1
check=$2
if [ -z "$check" ]; then
  echo "usage: bisect-run.sh '<build command>' '<check command>'" >&2
  exit 128
fi
if [ -n "$build" ]; then
  sh -c "$build" >/dev/null 2>&1 || exit 125
fi
sh -c "$check"
code=$?
case $code in
  0) exit 0 ;;
  125) exit 125 ;;
  *) exit 1 ;;
esac
