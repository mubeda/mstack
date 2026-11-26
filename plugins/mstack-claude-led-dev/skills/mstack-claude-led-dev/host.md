# Host: Claude Code

## This plugin

- Plugin and skill name: `mstack-claude-led-dev`
- Host: Claude Code (`Host: claude-code`, preflight `--host claude`)
- Review workflow on this host: `mstack-claude-led-review`
- Dev workflow on this host: `mstack-claude-led-dev`
- `Executor` value in `progress.md`: `mstack-claude-led-dev`

## Developer runs

- Follow the `codex` developer `Steps` of the final `mstack-vendors` result block (running through the OpenAI Codex plugin's `codex:codex-rescue` agent and `codex-dev.mjs`).
- Never pass `isolation: "worktree"` on the developer call: a background job started in a removed worktree is stranded.
- A developer job ends with the session that started it, so if a run stops with work left, the next session reviews what the working tree holds and starts a fresh run.
- Read-only helper subagents you start (log readers, searches) use the `Agent` tool with `model` and `effort` set explicitly to `mstack-best-model-for`'s `cheap` answer for vendor `claude` and no `isolation`.

## Approvals

This workflow lists no special host sandbox approvals in Claude Code.
