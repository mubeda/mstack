## mstack-vendors result

Leader: claude
Warnings: none

### plan review
Writers: claude
| Vendor | Role | State | Reason | Record | Command |
|---|---|---|---|---|---|
| codex | reviewer | available | | cross-vendor | bash "@WORK@/bin/review-ok" codex gpt-6.2-astra xhigh < "<prompt file>" > "<scratch file>" 2> "<scratch file>.err" |
Recommend: codex
Steps:
1. Write the review prompt into a new file in the scratch folder, with your file tool: first the text between the two `----` lines of mstack-vendors's references/review-prompt.md (or references/plan-review.md), whole, then the work to review (for a plan review the plan's files, named by their paths inside the workspace). The absolute path of that file is <prompt file>, the same file for every reviewer.
2. Run the Command cell of each reviewer row that the `Recommend` line names, and of no other row, as it is, with a new file in the scratch folder as <scratch file> (an absolute path, one file per reviewer), with the shell's longest time limit and not as a background job you leave behind. Do not report and do not finish before each command completed and you saw its output.
3. The findings of codex arrive as the text of its <scratch file>.
4. A run counts as a review only when it exited 0 and its answer holds findings or says in words that there are none. A non-zero exit, an empty answer, an `is_error` that is true or an answer that is only an error message is a failed run, never a clean review.
5. Repair a failed run once, and only where this line says how. A rejected effort: run it once more at the next lower effort of low, medium, high, xhigh, max; when none is lower, make no retry. A rejected model: ask the user once which other model to use, and end your turn on that question: before the answer nothing more runs for that vendor and no fallback review starts; with the answer, run that vendor's command once more with the model the user named in place of the rejected one. Every other cause (a sign-in or network error, a run that was not approved, another model in `modelUsage`, an empty answer): no retry. Judge a repaired run by the line "A run counts as a review only when" above: a repaired run that counts is a review like any other. A run is reported as failed, with its reason, only when no repair applies, when its repair failed too, or when the user named no other model.
6. Hand every review that counts to `mstack-receive-review`, each one on its own and unmerged, also when two reviewers report the same finding: the lines `Review: plan review by codex`, `Writers: claude` and `Reviewer vendor: codex`, then the reviewer's answer unchanged.
7. When no reviewer's run counts and no question about a rejected model is open, do not stop: tell the user "No other vendor returned a review, so this is a fallback review by this session's own vendor.", then run the fallback review: Write the review prompt into a new file in the scratch folder, with your file tool; start one fresh subagent of this session with the `Agent` tool, give it the path of the prompt file and tell it to read only and to change no file; hand its answer to `mstack-receive-review` with the lines `Review: plan review, fallback review`, `Writers: claude` and `Reviewer vendor: claude`, then the answer unchanged.
