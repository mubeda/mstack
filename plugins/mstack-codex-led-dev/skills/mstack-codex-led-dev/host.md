# Host: Codex

## This plugin

- Plugin and skill name: `mstack-codex-led-dev`
- Host: Codex (`Host: codex`, preflight `--host codex`)
- Review workflow on this host: `mstack-codex-led-review`
- Dev workflow on this host: `mstack-codex-led-dev`
- `Executor` value in `progress.md`: `mstack-codex-led-dev`

## Developer runs

Follow the `claude` developer `Steps` of the final `mstack-vendors` result block (running `claude -p` in the copy made by `dev-copy.mjs`, resuming the recorded `session_id` in the same copy on fix rounds). Nothing beyond the block's `Steps` is needed for developer runs on this host.

## Approvals

Codex's `workspace-write` sandbox keeps `.git` read-only, limits writes outside the workspace, and turns network access off. Tell the user in section 0's developer-pick message that the run will ask for approval of these commands (run each as an approved command, or start the session with the access you want to grant). Codex has no advisor.

| Command | Needs | Why |
|---|---|---|
| `git add`, `git write-tree`, `git commit`, branch changes | Write access to `.git` | Git writes the index, trees, refs and commits there |
| `dev-copy.mjs` (`make`, `check`, `diff`, `apply`, `remove`) | Writes outside the workspace | The developer copy and scratch files live in the temporary folder outside the checkout |
| `claude -p` developer and reviewer commands (including `--resume` fix rounds) | Network, and writes under the home folder | Claude talks to Anthropic's API and saves session state under `~/.claude` so `--resume` works |
| `gh`, `git push` | Network | They talk to the remote host |
| `scripts/check-required-skills.sh --host codex --github` | Network | `gh auth status` queries GitHub and reports a logged-in `gh` as missing without network |
