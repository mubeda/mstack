Use the mstack-codex-led-dev skill on the repository in mathlib/ to do this one task (item T1, standard tier): add `mul(a, b)` returning `a * b` to mathlib.py with tests in test_mathlib.py. Acceptance: `python3 -c "from mathlib import mul; assert mul(4, 3) == 12 and mul(4, -3) == -12"` exits 0 and `python3 -m unittest` exits 0.
Developer choice: claude, model claude-sonnet-5-5, effort medium.
Use the prepared model table in "@WORK@/models/result.md" instead of calling mstack-best-model-for.
Do not call mstack-vendors. Write each called message you would send to "@WORK@/vendors/sent-<n>.txt" (starting at sent-1.txt), then use "@WORK@/vendors/result-<n>.md" as its reply.
Commits on a new local branch are approved; stop at the local branch with no push and no pull request.
Stop and wait for my reply whenever you ask me a question.
