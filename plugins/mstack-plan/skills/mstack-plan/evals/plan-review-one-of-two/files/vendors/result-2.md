## mstack-vendors result

Leader: unknown
Warnings:
- the leader's vendor is unknown: send the full model id in Leader model

### plan review
Writers: unknown
| Vendor | Role | State | Reason | Record | Command |
|---|---|---|---|---|---|
| claude | reviewer | not available | no model was given for claude in the Models line | - | |
| codex | reviewer | available | | writer unknown | bash "@WORK@/bin/review-ok" codex gpt-6.2-sol xhigh < "<prompt file>" > "<scratch file>" 2> "<scratch file>.err" |
Recommend: codex
Steps:
1. Write the review prompt into a new file in the scratch folder, with your file tool: first the text between the two `----` lines of mstack-vendors's references/review-prompt.md (or references/plan-review.md), whole, then the work to review (for a plan review the plan's files, named by their paths inside the workspace). The absolute path of that file is <prompt file>, the same file for every reviewer.
2. Before you request the first reviewer run outside the sandbox, write the user this sentence, word for word, as a message of its own: "Each reviewer run starts outside the sandbox, so the client will ask you to approve each one."
3. Request a run outside the sandbox from the client for each reviewer command, one request per run. A run the user did not approve is a failed run with the reason "the run outside the sandbox was not approved": it is not a clean review and not a missing client, and it is not started another way.
4. Run the Command cell of each reviewer row that the `Recommend` line names, and of no other row, as it is, with a new file in the scratch folder as <scratch file> (an absolute path, one file per reviewer), with the shell's longest time limit and not as a background job you leave behind. Do not report and do not finish before each command completed and you saw its output.
5. The findings of codex arrive as the text of its <scratch file>.
6. A run counts as a review only when it exited 0 and its answer holds findings or says in words that there are none.
7. Hand every review that counts to `mstack-receive-review`, each one on its own and unmerged: the lines `Review: plan review by codex`, `Writers: unknown` and `Reviewer vendor: codex`, then the reviewer's answer unchanged.
8. When no reviewer's run counts and no question about a rejected model is open, do not stop: tell the user "No other vendor returned a review, so this is a fallback review by this session's own vendor.", then run the fallback review by `invoke_subagent` inheriting this session's model and hand its answer to `mstack-receive-review` with `Writers: unknown` and `Reviewer vendor: unknown`.
