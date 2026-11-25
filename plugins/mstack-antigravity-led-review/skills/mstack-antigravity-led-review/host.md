# Host: Antigravity

## This plugin

- Plugin and skill name: `mstack-antigravity-led-review`
- Host: Antigravity (`Host: antigravity`, preflight `--host antigravity`)
- Review workflow on this host: `mstack-antigravity-led-review`
- Dev workflow on this host: `mstack-antigravity-led-dev`
- `Executor` value in `progress.md`: `mstack-antigravity-led-review`

**Leader model (R21):** Before the first `mstack-vendors` call, run read-only `agy models` once, then ask the user once with `ask_question` which listed id this session runs on plus `"I do not know"`. Only an exact listed id goes onto `Leader model:`; any other answer is treated as `"I do not know"` (say so once and omit `Leader model`); a failed or empty listing or a run where nobody can answer omits `Leader model`, guesses no id, and keeps the reason for section 9.

**Sequential reviewers:** When two external reviewers are chosen (`claude` and `codex`), run them one after the other so the second starts only after the first completes, each with its own approval outside the sandbox, keeping exit codes and outputs apart.

## Lanes

**No lane agent listed (skills CLI install).** Before creating worktrees or sending the selection call, check whether this session lists the agent `review-lane`. If `review-lane` is not listed, include this exact line verbatim in your reply (never paraphrase it):

```text
Lanes need the plugin install of mstack-antigravity-led-review; running the items one after another.
```

Then run the items one after another yourself in this session on one branch (keeping all reference files, status updates, reviews, validation and delivery rules). Never start another subagent type for lanes, and never call `define_subagent` to create one at run time. Because no lanes run, `Writers:` in selection call `(b)` holds the leader's vendor alone.

**Worktrees.** Create one worktree per lane under the workspace with `run_command`:

```bash
git worktree add -b mstack/<run-id>/<lane> .mstack-worktrees/<lane> <lane base>
```

Ensure `.mstack-worktrees/` is listed in the exclude file resolved by `git rev-parse --git-path info/exclude` (never in `.gitignore`, never committed; resolving with `--git-path` works in linked worktrees too). Clean up finished worktrees after integration (`git worktree remove`).

**Spawning a lane.** Start each lane with `invoke_subagent` using:

- `TypeName`: `review-lane` (exact listed agent from this plugin; its pinned tool list allows only `read_file`, `write_file`, `edit_file`, `run_command` — no web search, question or subagent tools)
- `Role`: `mstack-<run-id>-<lane>`
- `Model`: the lane's subagent tier from `check-lanes.mjs` (`flash` for `cheap` and `standard`; `pro` for `most capable`)
- `Prompt`: the self-contained 10-part brief (`references/review-intake-and-briefs.md` › Section 5) giving the worktree's absolute path, required files (`working-style.md`, `writing.md`, `mstack-receive-review`, repo and plan rules), owned and forbidden files, acceptance criteria, and the lane report format (`writing.md` › Lane reports)

**Completion.** `invoke_subagent` returns immediately with a `conversationId`. A lane is finished only when its own completion report has arrived and its expected commit on `mstack/<run-id>/<lane>` has been checked in Git, never when `invoke_subagent` returns. A quiet lane whose work is undone stays open and is never reviewed or integrated.

**Transcript check before any reviewer starts (D6, R8).** Before launching any reviewer for a lane, read that lane's transcript with `read_file`. Locate the lane's subagent record and transcript by the exact `conversationId` returned by that lane's own `invoke_subagent` call (recorded in this session's transcript as the created subagent's `conversationId`, matching `~/.gemini/antigravity-cli/brain/<session id>/.system_generated/subagents/<subagent id>.json` and `~/.gemini/antigravity-cli/brain/<subagent id>/.system_generated/logs/transcript.jsonl`), or, for lanes started in different turns, by the record's `spawnStepIndex` (note that two subagents started in the same turn share one `spawnStepIndex`), and verify that the record's `subagentDescriptor.typeName` is `review-lane`. Never find a lane's transcript by `Role` alone, because two lanes of the same agent can share `typeName` and `role` while having different `conversationId` values and different models.

Classify the lane's `model` field from its transcript model turns using this rule (stated here because `mstack-vendors` has no model-id rule a caller can apply), and combine it with every earlier round's verified writers on that lane's branch:

- **All model turns across all rounds on that branch start with `gemini-`:** the lane writer is `antigravity`. Use the run's selection review block (`Executed by: antigravity.`, or include the leader's known vendor if the leader also edited lane files).
- **Any model turn in any round starts with `claude-`:** that branch also names `claude` as a writer, and its writer identity is not pure Gemini. Send called message `(d)` of `SKILL.md` §0 before any finding for that lane reaches `mstack-receive-review`, with `Writers:` preserving every known writer across all rounds beside `unknown` (including `claude`, e.g. `claude, unknown` or `antigravity, claude, unknown`), repeating `Leader model` (when set), `Workspace` and `Workflow: review`, and keeping `Models:` limited to the chosen reviewer(s). Do NOT launch `claude` as a reviewer for that lane: let the other chosen reviewer (`codex`) review it; if no chosen reviewer is left (`claude` was the only chosen reviewer), run the fallback review from the `(d)` block's `Steps` with its warning. Record the lane's review as `writer unknown` from that block (never `cross-vendor`).
- **Any other non-`gemini-` value, missing `model`, or unreadable/missing transcript in any round:** send called message `(d)` of `SKILL.md` §0 before any finding for that lane reaches `mstack-receive-review`, preserving any known writer from all rounds beside `unknown` in `Writers:` (bare `Writers: unknown` only when no writer is known), repeating `Leader model` (when set), `Workspace` and `Workflow: review`, and keeping `Models:` limited to the chosen reviewer(s). Take the lane's review records (`writer unknown`, never `cross-vendor`) from that block.

Keep the persisted plan format and outgoing `Writers:` distinct:
- In `progress.md` Closed log lines, `Executed by:` must be either bare `unknown` (whenever any round or piece on that item had an unknown/non-Gemini writer) or a comma-separated list of known vendors (`claude`, `codex`, `antigravity`) per `references/plan-format.md` — never mix `unknown` with vendor names inside `Executed by:`. When `Executed by: unknown.` is written and a known writer (such as `claude`) also contributed, record that known writer after `Evidence:` (for example `Evidence: ...; known co-writers: claude`) so a resumed run recovers it without failing `check-plan.mjs`.
- In outgoing `mstack-vendors` lane call `(d)`, aggregate ONLY that lane branch's verified writers across all of its own rounds (plus the leader if the leader edited that lane) beside `unknown`, so one lane's writer never excludes a reviewer on an unrelated lane.
- In outgoing `mstack-vendors` integration call `(e)`, aggregate every known writer across all accepted items (including co-writers recorded after `Evidence:` on resume) and the leader alongside `unknown` whenever any piece is unknown (for example `claude, unknown` or `antigravity, claude, unknown`), so a known writer like `claude` stays excluded from reviewing integrated work while the record stays `writer unknown`.

## Fix rounds

- **Tier move:** When a lane fails on `flash`, start a fresh `review-lane` one tier up on `pro` in the same worktree/branch (`pro` has no tier above it).
- **Fix round:** Start a new `review-lane` via `invoke_subagent` (`TypeName: review-lane`, `Role: mstack-<run-id>-<lane>`) in the same worktree, giving it the verified findings, the lane's earlier report, and the same 10-part brief rules.
- **Accumulated re-verification:** After each fix round completes and its commit is verified, read the new lane transcript by its returned `conversationId` (verifying `subagentDescriptor.typeName` is `review-lane`), classify it, and **union** its writers and any uncertainty with every earlier round on that lane's branch before selecting reviewers for re-review, closing the item, or sending integration call `(e)`. An all-Gemini fix round never clears an earlier round's `claude` or `unknown` writer.
- **Two-round limit:** Two fix rounds without accepted evidence means stop and escalate with both rounds' evidence (`SKILL.md` §6 and `references/review-loop-and-delivery.md`).

## Approvals

Runs outside Antigravity's sandbox are requested only by `mstack-vendors` and the `Steps` of its returned result block, never by commands written in this workflow itself. The sandbox hides clients installed under the user's home folder, so:

- `mstack-vendors` notifies the user first and requests one run outside the sandbox to check whether the `claude` and `codex` clients are installed and signed in.
- The result block's Antigravity `Steps` request one run outside the sandbox per chosen external reviewer command.

Report each other-vendor client check using exactly one of these three outcomes:

- **approved and found**: the outside-sandbox check was approved and found the client.
- **approved and not installed**: the outside-sandbox check was approved and did not find the client.
- **not approved**: the outside-sandbox check was not approved, so nothing is known about whether the client is installed.

Never report a client as `not installed` because the sandbox hid it or because an approval request was declined.

Keep these three events separate in every status update and in section 9:

1. **Declined availability check (inside `mstack-vendors`, not a step of its block):** `mstack-vendors` runs `--leader-only` inside the sandbox, marks every `reviewer` row `not available` with the reason `the run outside the sandbox was not approved`, adds the block warning `the run outside the sandbox was not approved, so no other vendor was checked`, and recommends `a fallback review`. No external vendor client is launched, and this workflow runs the fallback review from the block's `Steps`.
2. **Declined launch of a chosen external reviewer:** the client check was `approved and found`, the reviewer was chosen, and the user declined that reviewer's outside-sandbox launch. Treat it as a failed run with the reason `the run outside the sandbox was not approved` (never count it as a review, never report the client as not installed), and follow the recovery of the block's `Steps` (run the other chosen reviewer, or run the fallback review with its warning when no chosen reviewer is left).
3. **Fallback review:** runs inside this session with `invoke_subagent` on the tier that inherits this session's model, and needs no run outside the sandbox.

This workflow runs only the commands from the `mstack-vendors` result block and writes no external reviewer command of its own.
