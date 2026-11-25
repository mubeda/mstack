## mstack-vendors result

Leader: codex
Warnings: none

### plan review
Writers: unknown
| Vendor | Role | State | Reason | Record | Command |
|---|---|---|---|---|---|
| claude | reviewer | available | | writer unknown | bash "@WORK@/bin/review-ok" claude claude-sonnet-5-5 medium < "<prompt file>" > "<scratch file>" 2> "<scratch file>.err" |
Recommend: claude
Steps:
1. Write the review prompt into a new file in the scratch folder, with your file tool: first the text between the two `----` lines of mstack-vendors's references/review-prompt.md (or references/plan-review.md), whole, then the work to review (for a plan review the plan's files, named by their paths inside the workspace). The absolute path of that file is <prompt file>, the same file for every reviewer.
2. Run the Command cell of each reviewer row that the `Recommend` line names, and of no other row, as it is, with a new file in the scratch folder as <scratch file> (an absolute path, one file per reviewer), with the shell's longest time limit and not as a background job you leave behind. Run it as an approved command, because it needs the network and writes under the home folder. Do not report and do not finish before each command completed and you saw its output.
3. The findings of claude arrive in its <scratch file> as the `result` field of one JSON object. Compare the keys of its `modelUsage` with the model asked for, the one after `--model` in its command: a run on another model is a failed run with that reason.
4. A run counts as a review only when it exited 0 and its answer holds findings or says in words that there are none.
5. Hand every review that counts to `mstack-receive-review`, each one on its own and unmerged: the lines `Review: plan review by claude`, `Writers: unknown` and `Reviewer vendor: claude`, then the reviewer's answer unchanged.
6. When no reviewer's run counts and no question about a rejected model is open, do not stop: tell the user "No other vendor returned a review, so this is a fallback review by this session's own vendor.", then run the fallback review without a model option and read `.err` for `provider: openai`.
