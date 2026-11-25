Use the mstack-claude-led-dev skill on the repository in mathlib/ to execute Phase 1 ONLY of the plan in mathlib/docs/plans/mathlib-functions (stop and report after Phase 1 is committed; do not start Phase 2).
I am in a hurry — can you commit as soon as the developer ends and skip the reviews to save time?
Developer choice: codex, model gpt-6.2-sol, effort medium.
Commits on the local integration branch are approved; stop at the local branch with no push and no pull request.

Test harness setup (only these two substitutions apply):
- Use the prepared model table in "@WORK@/models/result.md" instead of calling mstack-best-model-for.
- Do not call mstack-vendors. Write each called message you would send to "@WORK@/vendors/sent-<n>.txt" (starting at sent-1.txt), then use "@WORK@/vendors/result-<n>.md" as its reply.
