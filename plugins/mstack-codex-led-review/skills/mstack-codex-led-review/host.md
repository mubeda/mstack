# Host: Codex

## This plugin

- Plugin and skill name: `mstack-codex-led-review`
- Host: Codex (`Host: codex`, preflight `--host codex`)
- Review workflow on this host: `mstack-codex-led-review`
- Dev workflow on this host: `mstack-codex-led-dev`
- `Executor` value in `progress.md`: `mstack-codex-led-review`

## Lanes

Create `<run-dir>` outside the repository (e.g. `${TMPDIR:-/tmp}/mstack-<repo>-<run-id>`). For each lane, create its worktree from `<lane base>` (an approved command, because it writes `.git`), write its brief to `<run-dir>/brief-<lane>.md`, and start it in the background with `codex exec`:

```bash
git worktree add -b mstack/<run-id>/<lane> <run-dir>/wt/<lane> <lane base>
nohup codex exec -m <model> --config model_reasoning_effort="<effort>" --sandbox workspace-write -c sandbox_workspace_write.network_access=false -C <run-dir>/wt/<lane> \
  --json -o <run-dir>/lane-<lane>.md - < <run-dir>/brief-<lane>.md \
  > <run-dir>/lane-<lane>.jsonl 2> <run-dir>/lane-<lane>.err &
echo $! > <run-dir>/lane-<lane>.pid
```

- Start all independent lanes before waiting on any. The first line of `lane-<lane>.jsonl` is a `thread.started` event; record its `thread_id`, branch and worktree in `<run-dir>/lanes.md` so fix rounds can resume it.
- A lane is finished when its process exits (`kill -0 $(cat <run-dir>/lane-<lane>.pid)` fails). Its report is `lane-<lane>.md`. An empty report means the lane failed: read the end of `lane-<lane>.err` and follow `references/working-style.md` for retries.
- Lanes run in `workspace-write` with network off, so a lane can never commit and commands inside the lane stay offline (the approval for `codex exec` to reach its model API is not a grant of network access to lane commands). Keep writer lanes offline: the lane handles only local probes (`references/external-facts.md`), while the coordinator runs `mstack-research` for any broad external lookup and passes verified facts in the lane's brief.

Include these Codex rules in each lane brief:

- **Part 7 (commits):** "Do not commit, push, open a PR or trigger CI. The sandbox keeps `.git` read-only, so leave every change in this worktree, and the coordinator commits it. Where a reference file tells you to commit at a point that later work changes again (for example a failing test before the fix), stop at that point and list that commit (files and message per `references/writing.md`) in your report; the coordinator commits it and resumes you. List any remaining commits in order at the end of your report."
- **Part 8 (questions):** "You cannot ask the user or the coordinator while you run. Finish everything that does not depend on an open decision, then end your run with the question and its evidence in your report; the coordinator resumes your session with the answer."
- **Part 10 (report):** Include `commits to make in order (files and message for each)` alongside the fields of `references/writing.md` › Lane reports.

**Coordinator commit before review (section 6 step 1):** Commit the lane's work on its branch as approved commands in the order the lane listed. If the lane stopped at a mid-task commit point, commit that point and resume the lane with `"Committed. Continue."` before reviewing. For each commit, write its message to `<run-dir>/commit-<lane>-<n>.txt`, run `references/writing.md`'s mechanical check, run `git -C <run-dir>/wt/<lane> add <files>` and `git -C <run-dir>/wt/<lane> commit -F <run-dir>/commit-<lane>-<n>.txt`, and verify with `git -C <run-dir>/wt/<lane> status --short` that nothing was left out.

**Cleanup (section 7 & section 9):** Remove integrated lane worktrees with `git worktree remove <run-dir>/wt/<lane>`, and name `<run-dir>` with its cleanup command in section 9 (and in any handoff, since it holds uncommitted lane work).

## Fix rounds

Write verified findings to `<run-dir>/findings-<lane>-<n>.md` (instructing the lane to process them with `mstack-receive-review` and report per finding) and resume the lane from its worktree. Always pass model, effort and sandbox again (keeping network off), because `codex exec resume` reads defaults from config:

```bash
cd <run-dir>/wt/<lane> && nohup codex exec --sandbox workspace-write -c sandbox_workspace_write.network_access=false resume <thread-id> -m <model> \
  -c model_reasoning_effort="<effort>" --json -o <run-dir>/lane-<lane>-fix<n>.md - \
  < <run-dir>/findings-<lane>-<n>.md > <run-dir>/lane-<lane>-fix<n>.jsonl 2> <run-dir>/lane-<lane>-fix<n>.err &
echo $! > <run-dir>/lane-<lane>.pid
```

Wait for exit as in `## Lanes`; the fix report is `lane-<lane>-fix<n>.md`. Commit its changes before re-reviewing. On capability failure, resume the same thread with `-m` one tier up; a purely mechanical fix round may resume one tier down.

## Approvals

Codex's `workspace-write` sandbox keeps `.git` read-only and turns the network off. Tell the user in section 0's first message that the run will ask for approval of these commands (run each with escalated permissions, or ask the user to start the session with the access they want to grant):

| Command | Needs | Why |
|---|---|---|
| `git worktree add`, `git commit`, `git cherry-pick`, branch changes | Write access to `.git` | Git stores worktree metadata, the index and commits there |
| `codex exec` and `codex exec resume` for lanes | Network | The lane talks to the model API |
| The `claude -p` reviewer command from `mstack-vendors` | Network, and writes under the home folder | Claude talks to Anthropic's API and records session state under the home folder |
| `gh`, `git push` | Network | They talk to the remote host |
| `scripts/check-required-skills.sh --host codex --github` | Network | `gh auth status` queries the host and reports a logged-in `gh` as missing without network |
