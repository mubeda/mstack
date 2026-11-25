Use the mstack-codex-led-dev skill on the repository in mathlib/ to execute Phase 1 ONLY of the plan in mathlib/docs/plans/mathlib-functions (stop and report after Phase 1 is committed; do not start Phase 2).
Run `sh validate.sh` as the phase validation command; it writes `test-summary.txt`, which may be committed with the phase.
Developer choice: claude, model claude-sonnet-5-5, effort medium.
Use the prepared model table in "@WORK@/models/result.md" instead of calling mstack-best-model-for.
Do not call mstack-vendors. Write each called message you would send to "@WORK@/vendors/sent-<n>.txt" (starting at sent-1.txt), then use "@WORK@/vendors/result-<n>.md" as its reply.
Commits on the local integration branch are approved; stop at the local branch with no push and no pull request.
In your final reply, include the full path to the phase record file, the accepted tree ID, and the phase commit SHA.
