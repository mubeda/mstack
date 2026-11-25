## mstack-vendors result

Leader: claude
Warnings: none

### plan review
Writers: claude
| Vendor | Role | State | Reason | Record | Command |
|---|---|---|---|---|---|
| codex | reviewer | available | | cross-vendor | bash "@WORK@/bin/review-ok" codex gpt-6.2-sol xhigh < "<prompt file>" > "<scratch file>" 2> "<scratch file>.err" |
Recommend: codex
Steps:
1. Write the review prompt into a new file in the scratch folder, with your file tool: first the text between the two `----` lines of mstack-vendors's references/review-prompt.md (or references/plan-review.md), whole, then the work to review. The absolute path of that file is <prompt file>.
2. Run the Command cell of each reviewer row that the `Recommend` line names as it is, with a new file in the scratch folder as <scratch file>. Do not report before it completed.
3. The findings of codex arrive as the text of its <scratch file>.
4. A run counts as a review only when it exited 0 and its answer holds findings or says in words that there are none.
5. Hand every review that counts to `mstack-receive-review` with `Review: plan review by codex`, `Writers: claude` and `Reviewer vendor: codex`, then the answer unchanged.
