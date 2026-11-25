#!/usr/bin/env bash
set -eu
here="$(cd "$(dirname "$0")" && pwd)"
work="$PWD"
bash "$here/../plugin-target/place-files.sh"

cd "$work/skills-repo"
git checkout -q -b feat/commit-msg
mkdir -p plugins/commit-msg/.claude-plugin plugins/commit-msg/.codex-plugin plugins/commit-msg/.antigravity-plugin plugins/commit-msg/skills/commit-msg
cat > plugins/commit-msg/.claude-plugin/plugin.json <<'JSON'
{
  "name": "commit-msg",
  "version": "0.1.0",
  "description": "Write conventional commit messages following repository rules.",
  "author": { "name": "example" },
  "license": "Apache-2.0"
}
JSON
cat > plugins/commit-msg/.codex-plugin/plugin.json <<'JSON'
{
  "name": "commit-msg",
  "version": "0.1.0",
  "description": "Write conventional commit messages following repository rules.",
  "author": { "name": "example" },
  "license": "Apache-2.0",
  "skills": "./skills/"
}
JSON
cat > plugins/commit-msg/.antigravity-plugin/plugin.json <<'JSON'
{
  "name": "commit-msg",
  "version": "0.1.0",
  "description": "Write conventional commit messages following repository rules.",
  "license": "Apache-2.0",
  "author": { "name": "example" }
}
JSON
cat > plugins/commit-msg/skills/commit-msg/SKILL.md <<'MD'
---
name: commit-msg
description: "Use when writing a commit message for this repository. Formats changes as <type>(<scope>): <summary> using feat, fix, docs or chore."
---

# commit-msg

Write one commit subject line in the form `<type>(<scope>): <summary>` where `<type>` is `feat`, `fix`, `docs` or `chore`.
MD
cp LICENSE plugins/commit-msg/skills/commit-msg/LICENSE
cat > plugins/commit-msg/skills/commit-msg/THIRD_PARTY_NOTICES.md <<'MD'
# Third-party notices

None.
MD
cat > .claude-plugin/marketplace.json <<'JSON'
{
  "name": "skills-repo",
  "plugins": [
    {"name": "greet", "source": "./plugins/greet", "version": "0.1.0"},
    {"name": "commit-msg", "source": "./plugins/commit-msg", "version": "0.1.0"}
  ]
}
JSON
cat > .agents/plugins/marketplace.json <<'JSON'
{
  "name": "skills-repo",
  "plugins": [
    {"name": "greet", "source": {"source": "local", "path": "./plugins/greet"}},
    {"name": "commit-msg", "source": {"source": "local", "path": "./plugins/commit-msg"}}
  ]
}
JSON
printf '| commit-msg | Writes commit messages by the repository convention. |\n' >> README.md
git add -A
git -c user.name=eval -c user.email=eval@example.com commit -q -m "feat(commit-msg): add commit-msg plugin"

cd "$work"
mkdir -p "$work/bin" "$work/vendors"
cp "$here/../_fixture/bin/review-ok" "$work/bin/review-ok"
chmod +x "$work/bin/review-ok"
sed "s|@WORK@|$work|g" "$here/files/vendors/result-1.md" > "$work/vendors/result-1.md"
