## mstack-vendors result

Leader: codex
Warnings: none

### code review
Writers: codex
| Vendor | Role | State | Reason | Record | Command |
|---|---|---|---|---|---|
| claude | reviewer | available | | cross-vendor | bash "@WORK@/bin/review-ok" claude claude-sonnet-5-5 medium app/greet.py < "<prompt file>" > "<scratch file>" 2> "<scratch file>.err" |
Recommend: claude
Steps:
1. Write the review prompt into a new file in the scratch folder, with your file tool: first the text between the two `----` lines of mstack-vendors's references/review-prompt.md (or execute-plan.md's review prompt), whole, then the work to review. The absolute path of that file is <prompt file>.
2. Run the Command cell of each reviewer row that the `Recommend` line names, and of no other row, as it is, with a new file in the scratch folder as <scratch file>. Run it as an approved command, because it needs the network and writes under the home folder. Do not report before it completed.
3. The findings of claude arrive in its <scratch file> as the `result` field of one JSON object. Compare the keys of its `modelUsage` with the model asked for.
4. A run counts as a review only when it exited 0 and its answer holds findings or says in words that there are none.
5. Hand every review that counts to `mstack-receive-review`, each one on its own and unmerged: the lines `Review: code review by claude`, `Writers: codex` and `Reviewer vendor: claude`, then the reviewer's answer unchanged.
6. When no reviewer's run counts, tell the user and run the fallback review.
