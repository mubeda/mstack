#!/usr/bin/env bash
# Builds a throwaway machine for one eval case of mstack-vendors.
#   machine.sh <run folder> --host <claude-code|codex|antigravity> --claude <missing|signed-out|ready> --codex <missing|signed-out|ready>
#              [--agy-models <listed|fails>] [--codex-plugin <none|unusable|ready>] [--outside <approved|refused>] [--check <runs|fails>]
#              [--claude-review <finding|error|empty|other-model>] [--codex-review <finding|empty|network|unknown-model>] [--reject-efforts "<effort> ..."]
#              [--refuse-run <claude|codex>] [--worktree] [--claude-dev <plain|remote|intervene|replace>] [--dirty] [--plan-pending]
#              [--codex-network-on]
# In the run folder: home/ (the home folder), bin/ (stand-in clients and a few basic tools), calls.log (every call
# of a stand-in), testenv (runs one command on this machine only) and workspace/ (a small committed Git repository).
# The stand-ins answer only the sign-in question (claude auth status, codex login status) and, on an Antigravity host,
# agy models. They start no session: any other call is logged and exits 1.
# A ready client is also a stand-in reviewer: `claude -p ...` and `codex exec ...` log their arguments, save the prompt
# they got on stdin (prompt-claude.txt, prompt-codex.txt in the run folder), log a start and an end line two seconds
# apart, and print a fixed answer in the real client's output form. No model runs.
# --claude-review: finding prints the JSON result of a review; error prints a result with is_error true and exits 1;
#   empty prints a result whose `result` is empty; other-model names another model in modelUsage than the one asked for.
# --codex-review: finding prints a review; empty prints nothing and exits 0; network and unknown-model exit 1 with a line.
# --reject-efforts: `codex exec` exits 1 for each effort of the list, with a line that names it.
# --refuse-run, on an Antigravity host: ask-outside answers "not approved" to a request whose command names the file
#   run-<vendor>.sh, and approves every other request.
# --worktree: wt/ in the run folder is a second worktree of the workspace's repository.
# work.diff in the run folder is the work a case asks to review. calls.log also gets one line per call of
# dev-copy.mjs (subcommand and exit code) and per git commit.
# --codex-plugin: the OpenAI Codex plugin of Claude Code. unusable: its files and install record are there, its session
#   hook did not run. ready: the hook ran too (testenv sets CLAUDE_PLUGIN_DATA) and its status call answers.
# --outside, on an Antigravity host only: ask-outside stands for the client's approval prompt for a run outside the
#   sandbox. It logs the request; approved prints "approved" and runs the command, refused prints "not approved".
# --check fails: check-vendors.mjs prints one error line and exits 2, whatever it is called with.
# --claude-dev: the workspace holds calc.mjs and a tracked plan folder docs/plan, and a ready `claude` is also a stand-in
#   developer: a `claude -p` call with acceptEdits logs its working folder, its arguments and the GIT_ variables it sees
#   (testenv sets one stray GIT_ variable), saves its prompt (prompt-dev-<round>.txt) and prints a JSON result with a
#   fixed session_id. Round one (no --resume) adds a function to calc.mjs, commits it with a plain `git commit`, leaves
#   the test calc.test.mjs new and uncommitted and runs `git push`, logging its exit code. Round two (--resume) adds a line to
#   README.md. remote: round one also adds a remote. intervene: round two also edits calc.mjs in the user's checkout.
#   replace: round two also writes CHANGELOG.md, which the checkout holds untracked, so the round cannot replace round one.
# --dirty: calc.mjs of the workspace has an uncommitted change. --plan-pending: docs/plan/progress.md has one.
# --codex-network-on: the Codex configuration of the test home turns network access on for workspace-write.
# A ready `codex` is also a stand-in developer: a `codex exec` call that names workspace-write logs its working folder
# and arguments, saves its prompt (prompt-codex-dev.txt), writes the -o file, adds a line to calc.mjs of its working
# root and prints a thread.started event with a fixed thread id.
set -eu
[ $# -ge 1 ] || { echo "usage: machine.sh <run folder> --host <host> --claude <state> --codex <state> [--agy-models <listed|fails>] [--codex-plugin <none|unusable|ready>] [--outside <approved|refused>] [--check <runs|fails>] [--claude-review <mode>] [--codex-review <mode>] [--reject-efforts <list>]" >&2; exit 2; }
T="$(cd "$1" && pwd)"; shift
host= claude= codex= agy=listed plugin=none outside=approved check=runs crev=finding xrev=finding reject= refuse= wt= dev= dirty= pending= neton=
while [ $# -gt 0 ]; do
  case "$1" in
    --host) host=$2 ;; --claude) claude=$2 ;; --codex) codex=$2 ;; --agy-models) agy=$2 ;;
    --codex-plugin) plugin=$2 ;; --outside) outside=$2 ;; --check) check=$2 ;;
    --claude-review) crev=$2 ;; --codex-review) xrev=$2 ;; --reject-efforts) reject=$2 ;;
    --refuse-run) refuse=$2 ;; --worktree) wt=1; shift; continue ;;
    --claude-dev) dev=$2 ;; --dirty) dirty=1; shift; continue ;; --plan-pending) pending=1; shift; continue ;;
    --codex-network-on) neton=1; shift; continue ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
  shift 2
done
case "$host" in claude-code|codex|antigravity) ;; *) echo "--host is claude-code, codex or antigravity" >&2; exit 2 ;; esac
for s in "$claude" "$codex"; do case "$s" in missing|signed-out|ready) ;; *) echo "--claude and --codex are missing, signed-out or ready" >&2; exit 2 ;; esac; done
case "$agy" in listed|fails) ;; *) echo "--agy-models is listed or fails" >&2; exit 2 ;; esac
case "$plugin" in none|unusable|ready) ;; *) echo "--codex-plugin is none, unusable or ready" >&2; exit 2 ;; esac
case "$outside" in approved|refused) ;; *) echo "--outside is approved or refused" >&2; exit 2 ;; esac
case "$check" in runs|fails) ;; *) echo "--check is runs or fails" >&2; exit 2 ;; esac
case "$crev" in finding|error|empty|other-model) ;; *) echo "--claude-review is finding, error, empty or other-model" >&2; exit 2 ;; esac
case "$xrev" in finding|empty|network|unknown-model) ;; *) echo "--codex-review is finding, empty, network or unknown-model" >&2; exit 2 ;; esac
case "$dev" in ''|plain|remote|intervene|replace) ;; *) echo "--claude-dev is plain, remote, intervene or replace" >&2; exit 2 ;; esac

H="$T/home"; B="$T/bin"; L="$T/calls.log"; W="$T/workspace"
mkdir -p "$H" "$B" "$W" "$T/scratch"; : > "$L"
real() { command -v "$1" || { echo "$1 is needed to build this case" >&2; exit 1; }; }
NODE="$(real node)"
if [ "$check" = fails ]; then
  # A made-up error line, not one the real script prints: it holds the character a table cell must not hold.
  { echo '#!/bin/sh'
    echo 'case "$*" in *check-vendors.mjs*)'
    echo "  echo \"node \$*\" >> \"$L\""
    echo "  echo 'check-vendors.mjs: internal error | no vendor was checked' >&2"
    echo '  exit 2 ;;'
    echo 'esac'
    echo "exec \"$NODE\" \"\$@\""; } > "$B/node"
else
  # A call of dev-copy.mjs is logged with its subcommand, its options and its exit code.
  { echo '#!/bin/sh'
    echo 'case "$*" in *dev-copy.mjs*)'
    echo "  \"$NODE\" \"\$@\"; e=\$?; echo \"dev-copy \${2:-} exit=\$e \$*\" >> \"$L\"; exit \$e ;;"
    echo 'esac'
    echo "exec \"$NODE\" \"\$@\""; } > "$B/node"
fi
# A git commit is logged with the folder it ran in.
{ echo '#!/bin/sh'
  echo "case \" \$* \" in *\" commit \"*) echo \"git-commit cwd=\$(pwd) \$*\" >> \"$L\" ;; esac"
  echo "exec \"$(real git)\" \"\$@\""; } > "$B/git"
# standin <name> <the one call it answers> <exit code> <a line it prints>...
standin() {
  local n=$1 call=$2 code=$3; shift 3
  { printf '#!/bin/sh\necho "%s $*" >> "%s"\n' "$n" "$L"
    [ -z "${HOOK:-}" ] || printf '%s\n' "$HOOK"
    printf 'if [ "$*" = "%s" ]; then\n' "$call"
    for line in "$@"; do printf "  echo '%s'\n" "$line"; done
    printf '  exit %s\nfi\n' "$code"
    printf 'echo "stand-in %s: this call starts nothing on the test machine" >&2\nexit 1\n' "$n"; } > "$B/$n"
}
# reviewer <name> <the review call's first argument>: puts the review call in front of the stand-in's last two lines.
CAT="$(real cat)"; SLEEP="$(real sleep)"
SHARED='1. Severity: high. Title: sum subtracts. File: sum.js, lines 3 to 3. Scenario: sum(2, 1) returns 1. Reproduce: call sum(2, 1) and print the result. Recommendation: return a + b.'
reviewer() {
  local n=$1 first=$2 f="$B/$1" keep
  keep="$(tail -n 2 "$f")"; head -n -2 "$f" > "$f.tmp"
  { cat "$f.tmp"
    printf 'if [ "$1" = "%s" ]; then\n' "$first"
    echo '  model=; effort=; prev='
    echo '  for a in "$@"; do'
    echo '    case "$prev" in --model|-m) model=$a ;; --effort) effort=$a ;; esac'
    echo '    case "$a" in model_reasoning_effort=*) effort=${a#model_reasoning_effort=} ;; esac'
    echo '    prev=$a'
    echo '  done'
    echo "  \"$CAT\" > \"$T/prompt-$n.txt\""
    echo "  echo \"$n start\" >> \"$L\"; \"$SLEEP\" 2; echo \"$n end\" >> \"$L\""
    cat
    echo 'fi'
    echo "$keep"; } > "$f"
  rm -f "$f.tmp"
}
# The JSON object of a headless Claude Code run, with the fields a caller reads.
cjson() { printf "  printf '{\"type\":\"result\",\"subtype\":\"success\",\"is_error\":%s,\"result\":\"%s\",\"session_id\":\"00000000-0000-4000-8000-000000000001\",\"permission_denials\":[],\"total_cost_usd\":0.001,\"modelUsage\":{%s}}\\\\n' %s\n" "$1" "$2" "$3" "$4"; }
USAGE='\"%s\":{\"inputTokens\":2,\"outputTokens\":40,\"costUSD\":0.001}'
CFIND="Verdict: needs attention\\\\nSummary: one defect in sum.js and no check of the arguments.\\\\nFindings:\\\\n$SHARED\\\\n2. Severity: low. Title: arguments are not checked. File: sum.js, lines 1 to 1. Scenario: sum(1) returns NaN. Reproduce: call sum with one argument. Recommendation: reject a missing argument."
XFIND="Verdict: needs attention\nSummary: one defect in sum.js and no test.\nFindings:\n$SHARED\n2. Severity: medium. Title: no test for sum. File: sum.js, lines 1 to 5. Scenario: the defect was not caught. Reproduce: list the test files. Recommendation: add sum.test.js."
TAB="$(printf '\t')"
# The stand-in developers. They run in the folder the caller started them in, with the stand-ins' PATH.
SID=00000000-0000-4000-8000-000000000002 TID=0190a0b0-0000-7000-8000-000000000003
{ echo '#!/bin/sh'
  echo "L=\"$L\"; W=\"$W\"; T=\"$T\"; MODE=\"$dev\""
  cat <<'DEV'
round=1; case " $* " in *" --resume "*) round=2 ;; esac
echo "claude-dev round=$round cwd=$(pwd)" >> "$L"
echo "claude-dev args=$*" >> "$L"
echo "claude-dev git-vars=$(env | grep '^GIT_' | sort | tr '\n' ' ')" >> "$L"
cat > "$T/prompt-dev-$round.txt"
if [ $round = 1 ]; then
  printf 'export const sub = (a, b) => a - b;\n' >> calc.mjs
  git commit -q -a -m "Add sub" >> "$L" 2>&1; echo "claude-dev commit exit=$?" >> "$L"
  printf 'import { sub } from "./calc.mjs";\nif (sub(3, 1) !== 2) throw new Error("sub");\n' > calc.test.mjs
  [ "$MODE" = remote ] && git remote add origin https://example.invalid/project.git
  git push >/dev/null 2>&1; echo "claude-dev push exit=$?" >> "$L"
else
  printf 'Fixed: README.md now says what the fix round changed.\n' >> README.md
  [ "$MODE" = intervene ] && printf '// edited in the checkout\n' >> "$W/calc.mjs"
  [ "$MODE" = replace ] && printf '# Changelog\n\n- Add sub.\n' > CHANGELOG.md
fi
DEV
  printf "printf '{\"type\":\"result\",\"subtype\":\"success\",\"is_error\":false,\"result\":\"Round %%s done.\",\"session_id\":\"%s\",\"permission_denials\":[],\"total_cost_usd\":0.001,\"modelUsage\":{\"claude-test-model\":{\"costUSD\":0.001}}}\\n' \"\$round\"\n" "$SID"
} > "$B/claude-dev.sh"
{ echo '#!/bin/sh'
  echo "L=\"$L\"; T=\"$T\""
  cat <<'DEV'
echo "codex-dev cwd=$(pwd) args=$*" >> "$L"
out=; dir=.; prev=
for a in "$@"; do case "$prev" in -o) out=$a ;; -C) dir=$a ;; esac; prev=$a; done
cat > "$T/prompt-codex-dev.txt"
printf '// written by the codex developer\n' >> "$dir/calc.mjs"
[ -z "$out" ] || printf 'Done.\n' > "$out"
DEV
  printf "echo '{\"type\":\"thread.started\",\"thread_id\":\"%s\"}'\n" "$TID"
} > "$B/codex-dev.sh"
case "$claude" in
  ready) HOOK=$([ -z "$dev" ] || printf 'case "$*" in *acceptEdits*) exec sh "%s" "$@" ;; esac' "$B/claude-dev.sh") standin claude "auth status" 0 '{"loggedIn": true}'
    case "$crev" in
      finding) { cjson false "$CFIND" "$USAGE" '"$model"'; echo '  exit 0'; } | reviewer claude -p ;;
      empty) { cjson false "" "$USAGE" '"$model"'; echo '  exit 0'; } | reviewer claude -p ;;
      other-model) { cjson false "$CFIND" "$USAGE" 'claude-another-model'; echo '  exit 0'; } | reviewer claude -p ;;
      error) { cjson true "API Error: Connection error." "" ''; echo '  exit 1'; } | reviewer claude -p ;;
    esac ;;
  signed-out) standin claude "auth status" 1 '{"loggedIn": false}' ;;
esac
case "$codex" in
  ready) HOOK=$(printf 'case "$*" in *workspace-write*) exec sh "%s" "$@" ;; esac' "$B/codex-dev.sh") standin codex "login status" 0 'Logged in using ChatGPT'
    { echo "  for e in $reject; do [ \"\$e\" = \"\$effort\" ] && { echo \"unsupported value for model_reasoning_effort: \$effort\" >&2; exit 1; }; done"
      case "$xrev" in
        finding) printf "  printf '%s\\\\n'\n  exit 0\n" "$XFIND" ;;
        empty) echo '  exit 0' ;;
        network) echo '  echo "network error" >&2; exit 1' ;;
        unknown-model) echo '  echo "unknown model $model" >&2; exit 1' ;;
      esac; } | reviewer codex exec ;;
  signed-out) standin codex "login status" 1 'Not logged in' ;;
esac
if [ "$host" = antigravity ]; then
  case "$agy" in
    listed) standin agy "models" 0 "gemini-test-flash-low${TAB}Gemini Test Flash (low)" "claude-test-model${TAB}Claude Test Model" "gpt-oss-test${TAB}GPT OSS Test" ;;
    fails) standin agy "models" 1 ;;
  esac
fi
chmod +x "$B"/*
# The Codex plugin of Claude Code: an install record, a stand-in for its companion script and its rescue agent.
DATA=
if [ "$plugin" != none ]; then
  I="$H/.claude/plugins/cache/openai-codex/codex"
  mkdir -p "$I/scripts" "$I/agents"
  printf '{"version": 2, "plugins": {"codex@openai-codex": [{"scope": "user", "installPath": "%s"}]}}\n' "$I" > "$H/.claude/plugins/installed_plugins.json"
  printf -- '---\nname: codex-rescue\n---\nA stand-in on the test machine.\n' > "$I/agents/codex-rescue.md"
  # It answers only the status call of the availability check, in the real script's shape, with no job.
  { echo "import { appendFileSync } from 'node:fs';"
    echo "appendFileSync('$L', 'codex-companion ' + process.argv.slice(2).join(' ') + '\\n');"
    echo "if (process.argv.slice(2).join(' ') !== 'status --all --json') { console.error('stand-in codex-companion: this call starts nothing on the test machine'); process.exit(1); }"
    echo "console.log(JSON.stringify({ workspaceRoot: process.cwd(), running: [], latestFinished: null, recent: [], needsReview: false }));"; } > "$I/scripts/codex-companion.mjs"
  [ "$plugin" = ready ] && { DATA="$T/plugin-data"; mkdir -p "$DATA"; }
fi
for t in sh cat ls grep head tail env awk sed tr sort; do p="$(command -v "$t")" && ln -sf "$p" "$B/$t"; done
# testenv runs one command on this test machine only: its own home folder and a PATH of stand-ins and a few basic tools.
{
  echo '#!/bin/sh'
  echo "export HOME=\"$H\" USERPROFILE=\"$H\" CODEX_HOME=\"$H/.codex\" PATH=\"$B\""
  echo 'unset CLAUDE_CONFIG_DIR CLAUDE_PLUGIN_DATA CODEX_COMPANION_SCRIPT'
  [ -z "$DATA" ] || echo "export CLAUDE_PLUGIN_DATA=\"$DATA\""
  [ -z "$dev" ] || echo 'export GIT_PAGER=cat'
  echo 'exec "$@"'
} > "$T/testenv"
chmod +x "$T/testenv"
if [ "$host" = antigravity ]; then
  { echo '#!/bin/sh'
    echo "echo \"ask-outside \$*\" >> \"$L\""
    [ -z "$refuse" ] || echo "case \"\$*\" in *run-$refuse.sh*) echo \"not approved\"; exit 1 ;; esac"
    if [ "$outside" = approved ]; then echo 'echo "approved"'; echo 'exec "$@"'; else echo 'echo "not approved"'; echo 'exit 1'; fi
  } > "$T/ask-outside"
  chmod +x "$T/ask-outside"
fi
# The workspace: one committed file, so that `git status --porcelain` shows every write a run makes there.
G() { GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null git -C "$W" -c user.name=test -c user.email=test@example.com "$@"; }
printf '# Example project\n\nA workspace for an eval case.\n' > "$W/README.md"
printf -- '--- a/sum.js\n+++ b/sum.js\n@@ -1,5 +1,5 @@\n function sum(a, b) {\n   // adds two numbers\n-  return a + b;\n+  return a - b;\n }\n module.exports = sum;\n' > "$T/work.diff"
G init -q; G add README.md; G commit -q -m "Initial commit"
[ -z "$wt" ] || G worktree add -q "$T/wt" -b review-lane
if [ -n "$dev$dirty$pending" ]; then
  printf 'export const add = (a, b) => a + b;\n' > "$W/calc.mjs"
  mkdir -p "$W/docs/plan"; printf '# Plan\n\nTask 1: add sub to calc.mjs.\n' > "$W/docs/plan/plan.md"; printf 'Task 1: Open\n' > "$W/docs/plan/progress.md"
  G add calc.mjs docs; G commit -q -m "Add calc and the plan"
  [ -z "$dirty" ] || printf '// not committed yet\n' >> "$W/calc.mjs"
  [ -z "$pending" ] || printf 'Task 1: In progress\n' >> "$W/docs/plan/progress.md"
  [ "$dev" != replace ] || printf 'my own notes\n' > "$W/CHANGELOG.md"
fi
[ -z "$dev$dirty$pending" ] || printf '[user]\n\tname = Test User\n\temail = test@example.com\n' > "$H/.gitconfig"
if [ -n "$neton" ]; then mkdir -p "$H/.codex"; printf '[sandbox_workspace_write]\nnetwork_access = true\n' > "$H/.codex/config.toml"; fi
