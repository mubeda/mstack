# Host: Antigravity

## This plugin

- Plugin and skill name: `mstack-antigravity-led-dev`
- Host: Antigravity (`Host: antigravity`, preflight `--host antigravity`)
- Review workflow on this host: `mstack-antigravity-led-review`
- Dev workflow on this host: `mstack-antigravity-led-dev`
- `Executor` value in `progress.md`: `mstack-antigravity-led-dev`

## Developer runs

- **Read-only helpers:** start helper subagents via `invoke_subagent` on a subagent tier (`flash` for cheap helpers), never with a model id or effort.
- **Leader model (R21):** before the first `mstack-vendors` message, run read-only `agy models` once, then ask the user once with `ask_question` which offered id this session runs on plus `"I do not know"`. Only an exact offered id goes onto `Leader model:` in every `mstack-vendors` message of the run; any other typed text counts as `"I do not know"` (say so once and never send it). If the listing fails or is empty, or nobody can be asked, ask nothing, send no `Leader model` line, and keep the reason for section 9. Never guess an id, never classify an id yourself, and never ask again.
- **External commands:** run any `codex exec` or `claude -p` command from the final `mstack-vendors` result block as it is, and await its completion and output before reporting or finishing. Never start a second Antigravity session or run the Antigravity client with a prompt.

## Approvals

Requests for a run outside the client's sandbox come only from `mstack-vendors` and the `Steps` of its returned result block, never from this workflow's own text. Antigravity's sandbox does not show clients installed under the user's home folder, so:

- `mstack-vendors` tells the user first and requests one run outside the client's sandbox to check whether the `claude` and `codex` clients are installed and signed in.
- The result block's Antigravity `Steps` request one run outside the client's sandbox per developer run (fix rounds included) and per second-reviewer run.

Report each other-vendor client check using exactly one of these three outcomes:

- **approved and found**: the outside-sandbox check was approved and found the client.
- **approved and not installed**: the outside-sandbox check was approved and did not find the client.
- **not approved**: the outside-sandbox check was not approved, so nothing is known about whether the client is installed.

Never report a client as `not installed` because the sandbox hid it or because an approval request was declined.

Keep these three events apart in every status update and in section 9:

1. **Declined availability check (inside `mstack-vendors`, not a step of its returned block):** `mstack-vendors` runs `--leader-only` inside the sandbox, marks every `reviewer` and `developer` row `not available` with the reason `the run outside the sandbox was not approved`, adds the block warning `the run outside the sandbox was not approved, so no other vendor was checked`, and recommends `no developer here`. This workflow stops immediately and names `mstack-antigravity-led-review` without launching any external vendor client.
2. **Declined launch of a chosen developer:** the check was `approved and found`, the developer was chosen, and the user declined its launch outside the client's sandbox. Treat it as a failed round with the reason `the run outside the sandbox was not approved`, stop the phase with that report, and do not start it another way.
3. **Declined launch of a chosen second reviewer:** the check was `approved and found`, the second reviewer was chosen, and the user declined its launch outside the client's sandbox. Treat it as a failed run with the reason `the run outside the sandbox was not approved` (never a clean review, never a missing client); your finished review as the leader stands and no fallback review starts.

This workflow runs only the commands of the `mstack-vendors` result block, writes no external vendor command of its own, and has no advisor.
