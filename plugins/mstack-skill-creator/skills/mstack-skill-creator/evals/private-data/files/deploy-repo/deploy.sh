#!/usr/bin/env bash
set -eu
case "${1:-}" in
  build) echo building ;;
  restart) echo restarting ;;
  *) echo "usage: deploy.sh build|restart"; exit 2 ;;
esac
