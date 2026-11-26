#!/usr/bin/env bash
set -eu
here="$(cd "$(dirname "$0")" && pwd)"
bash "$here/../_fixture/place.sh" plan "$here"
if [ "${ONE_CLIENT_VARIANT:-openai}" = "non-openai" ]; then
  # Stand-in hint file for non-OpenAI / missing provider header verification in the runner
  cat <<'EOF' > "$PWD/files/one-client-variant.txt"
variant=non-openai
expected_provider_header=provider: custom-proxy
expected_record=reviewer unknown
EOF
fi
