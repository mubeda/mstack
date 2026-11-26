# Review workflow: root-cause rubric, integration, delivery and report

Read this for bug lanes in section 6, and at sections 7, 8 and 9 of `SKILL.md`.

## Accepting a root-cause claim

Bug lanes follow `mstack-diagnose`. Accept a lane's root-cause claim only when the report has all eight items (a missing item sends the lane back):

1. The signal: loop command already run with redacted failing output, or saved record with format and completeness (for a crash record, symbol status).
2. Reproduction: evidence that the reproduced failure matches the reported symptom and repeats (or measured rate / linkage for a past CI record).
3. Minimized scenario: every element shown to be needed, or for a saved record the one finding it was reduced to.
4. Ranked hypotheses with predictions, marked confirmed, refuted or left untested.
5. Probes: which probe tested which prediction, one variable at a time (or which record supports/refutes each hypothesis); for performance, baseline, run counts and spread.
6. Root-cause tier from `mstack-diagnose`: `Confirmed`, unless diagnosing a past event that cannot be replayed (then `Supported`, said plainly).
7. Fix proof: regression test seen failing before and passing after (with pristine diff if forced), original loop rerun, fix verdict, pre-chosen passing runs for a flake, or a recorded "no correct seam" finding with both outputs.
8. Empty debug-prefix search (`git grep -n --untracked '\[DEBUG-'`) on the lane diff, and the hypothesis that proved correct named in the commit message to carry into the PR body.

## Section 7: Integration and local validation

1. Create or continue one integration branch from `<base>`. For an `mstack-plan` run, continue `progress.md`'s `Branch` line (never creating another), or create `plan/<slug>` and record it on `Branch:`. Integrate ONLY the accepted lane commits that were reviewed — if any lane commit was made after its last review, send it back to section 6 before integrating. Bring in accepted lane branches (cherry-pick or rebase for linear history unless the repo prefers merges), resolve rare conflicts yourself and re-run that lane's tests.
2. Write reserved shared files (changelogs, docs indexes, plan status file).
3. Run the repository's and plan's full completion checklist on the integrated tree (all focused tests, typecheck, lint, format, broader suites). Send integration breakage to the owning lane (or a fresh small lane if gone) and move the affected item back to In progress until fixed.
4. Run one final review of the whole integration diff before pushing: send section 0 call `(e)` whenever integrated `Writers:` differs from `(b)`/`(c)`, then run the chosen reviewer(s) (or fallback) and advisor (per host table) on the integration branch, and process each output unmerged with `mstack-receive-review`.
5. Run the sensitive-data gate before any push, tracker comment, PR body or comment: run `gitleaks` (or the repository's secret scanner) over the commit range and grep added lines for private hosts, org/customer names, real people, tokens and local paths. Public repositories get placeholders only; keep leak notes vague and never repeat a secret. Rewriting published history is the user's call.
6. Clean up finished lane worktrees as `host.md` › Lanes specifies.

## Section 8: Delivery and serialized CI

- When the repository has a remote taking PRs/MRs and the user did not ask for a local result, push the integration branch and open one PR ready for review (never draft) once every item is Closed or explicitly reported uncompletable with reason. Use `gh` on GitHub (or push and give the link when no CLI exists), with title and body per `references/writing.md` › Pull request body.
- When there is no remote or the user asked for a local result, stop at the validated integration branch, report its name and do not push.
- Serialize CI across this work: at most one CI run in flight at once; never push while a CI run for this PR is in progress, never push lane branches, never trigger parallel CI across branches (parallel jobs inside one CI run stay parallel). Batch CI fixes into one push after the current run finishes.
- Triage every CI failure from logs (`references/working-style.md`, using a cheap helper if helpful) before retriggering; fix through the owning lane, revalidate locally, then push once.
- Process PR review-bot and human comments with `mstack-receive-review`. Only you reply on the PR, posting each drafted reply inline in the comment's own thread via a file (`gh api -X POST repos/{owner}/{repo}/pulls/{pr}/comments/{id}/replies -F body=@<reply file>`), never pasting raw review text.

## Section 9: Final report checklist

If the run stops with work left (context/session running out, blocker, or user stop), stop at a safe point, write a handoff with `mstack-handoff` when installed and include its path; without it, include branch, HEAD, uncommitted paths, live lanes/worktrees, scratch/run-dir path, gates still due with commands, and user-blocked decisions in the report.

Write the report per `references/writing.md` › Messages to the user:

1. Line 1: goal and outcome. Line 2: next action for the user.
2. Final status table with evidence in the Note column.
3. Models used: per lane its tier, model, effort, round count, every tier move with reason, and every expensive-model question/answer.
4. Reviews: every reviewer that ran, its model and effort, its exact `Record` value from `mstack-receive-review`, every failed reviewer run with its reason, and every fallback review and why it ran.
5. In Antigravity only (host table row "The leader's model"): state either that the leader's model was stated by the user so records resting on the leader's vendor rest on that statement, or that the leader's model is unknown and why (omit on Claude Code and Codex).
6. Review findings not applied (each rejected or deferred finding with its reason) and any gap skill candidates from `mstack-find-skills`.
7. Validation commands with results, what was not run and why, residual risk, and cleanup commands from `host.md`.

When the run deferred follow-ups, follow `references/follow-up-issues.md` after the report is written (only when `mstack-write-issue` is installed).
