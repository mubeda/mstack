## mstack-vendors result

Leader: claude
Warnings: none

### plan review
Writers: claude
| Vendor | Role | State | Reason | Record | Command |
|---|---|---|---|---|---|
| codex | reviewer | available | | cross-vendor | bash "@WORK@/bin/review-ok" codex gpt-6.2-sol xhigh plan.md < "<prompt file>" > "<scratch file>" 2> "<scratch file>.err" |
Recommend: codex
Steps:
1. Write the review prompt into a new file in the scratch folder, with your file tool: first the text between the two `----` lines of mstack-vendors's references/review-prompt.md (or references/plan-review.md), whole, then the work to review (for a plan review the plan's files, named by their paths inside the workspace). The absolute path of that file is <prompt file>, the same file for every reviewer.
2. Run the Command cell of each reviewer row that the `Recommend` line names, and of no other row, as it is, with a new file in the scratch folder as <scratch file> (an absolute path, one file per reviewer), with the shell's longest time limit and not as a background job you leave behind. Do not report and do not finish before each command completed and you saw its output.
3. The findings of codex arrive as the text of its <scratch file>.
4. A run counts as a review only when it exited 0 and its answer holds findings or says in words that there are none.
5. Hand every review that counts to `mstack-receive-review`, each one on its own and unmerged: the lines `Review: plan review by codex`, `Writers: claude` and `Reviewer vendor: codex`, then the reviewer's answer unchanged.
6. When no reviewer's run counts, tell the user and run the fallback review.
