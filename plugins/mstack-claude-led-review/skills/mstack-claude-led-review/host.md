# Host: Claude Code

## This plugin

- Plugin and skill name: `mstack-claude-led-review`
- Host: Claude Code (`Host: claude-code`, preflight `--host claude`)
- Review workflow on this host: `mstack-claude-led-review`
- Dev workflow on this host: `mstack-claude-led-dev`
- `Executor` value in `progress.md`: `mstack-claude-led-review`

## Lanes

Spawn all independent lanes in one message with the `Agent` tool, `isolation: "worktree"`, and the chosen `model` and `effort` from section 3. Use plain `Agent` subagents, not a Workflow script, so you can send fix rounds to the same lane id later (messaging a Workflow-spawned agent resumes a duplicate writer).

Include these Claude Code rules in each lane brief:

- **Part 3 (base):** The lane's first command is `git merge --ff-only <lane base>`, where `<lane base>` is `<base>` or the earlier lane's accepted branch. If the merge fails, the lane stops and reports.
- **Part 7 (commits):** "Commit to your branch with a clear message. Do not push, do not open a PR, do not trigger CI."
- **Part 8 (advisor):** "You may consult the advisor tool, if your harness has it, for a second opinion on a diagnosis or design."
- **Part 10 (report):** Report `branch name` (from `git branch --show-current`), `worktree` path (from `git rev-parse --show-toplevel`), and `commits` alongside the fields of `references/writing.md` › Lane reports.

Take each lane's `<worktree>` and `<branch>` from the `Agent` result or the lane's report. When builds are large, include disk cleanup commands for finished worktrees in section 9.

## Fix rounds

Send verified review findings back to the same lane agent using `SendMessage` to its agent id, instructing it to fix in its own worktree, process the findings with `mstack-receive-review`, and report per finding fixed or rejected with a reason.

When a lane fails on capability and moves up a tier (section 3), start a fresh `Agent` lane one tier up with a consolidated brief and give it the failed lane's branch as its `<lane base>`, because a running `Agent` lane keeps its model.

## Approvals

This workflow lists no special host sandbox approvals in Claude Code.
