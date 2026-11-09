#!/usr/bin/env bash
# List every open issue of a GitHub repository, with bodies and comments, and prove the list is complete.
#   bash list-open-issues.sh <owner/repo> <output.json>
# `gh issue list` stops at 30 issues by default without saying so, so this script reads the open-issue
# count from GraphQL (the REST open_issues_count also counts pull requests), lists with a limit above it,
# and fails when the two numbers differ. Exit 0 when complete, 1 on a mismatch or a gh error, 2 on usage.
set -euo pipefail

repo="${1:-}"; out="${2:-}"
if [[ ! "$repo" =~ ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ ]] || [ -z "$out" ]; then
  echo "usage: list-open-issues.sh <owner/repo> <output.json>" >&2; exit 2
fi
owner="${repo%%/*}"; name="${repo##*/}"

command -v node >/dev/null || { echo "node is required to validate the saved list" >&2; exit 1; }

# -f keeps owner and name as strings; -F would turn a name like 123 or true into a number or a Boolean.
total=$(gh api graphql -f owner="$owner" -f name="$name" \
  -f query='query($owner:String!,$name:String!){repository(owner:$owner,name:$name){issues(states:OPEN){totalCount}}}' \
  --jq '.data.repository.issues.totalCount')

gh issue list --repo "$repo" --state open --limit $((total + 50)) \
  --json number,title,body,labels,comments,author,createdAt,updatedAt,url > "$out"
listed=$(gh issue list --repo "$repo" --state open --limit $((total + 50)) --json number --jq length)
saved=$(node -e 'process.stdout.write(String(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).length))' "$out") \
  || { echo "INCOMPLETE  $out is not a readable JSON list" >&2; exit 1; }

if [ "$saved" != "$total" ] || [ "$listed" != "$total" ]; then
  echo "INCOMPLETE  $repo has $total open issues, listed $listed, saved $saved" >&2; exit 1
fi
echo "complete    $repo: $total open issues saved to $out"
