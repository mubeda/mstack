## mstack-vendors result

Leader: antigravity
Warnings:
- code review (group 1): the Writers line is not a list of vendor names, so the writers are unknown

### code review
Writers: unknown
| Vendor | Role | State | Reason | Record | Command |
|---|---|---|---|---|---|
| codex | reviewer | available |  | writer unknown | bash "@WORK@/bin/review-ok" codex gpt-6.2-sol xhigh < "<prompt file>" > "<scratch file>" 2> "<scratch file>.err" |
Recommend: codex
Steps:
1. Write the review prompt into a new file in the scratch folder, with your file tool: first the review prompt text, whole, then the work to review (the diff of the lane worktree or integrated branch). The absolute path of that file is <prompt file>.
2. Before you request the first reviewer run outside the sandbox, write the user this sentence, word for word, as a message of its own: "Each reviewer run starts outside the sandbox, so the client will ask you to approve each one."
3. Request a run outside the sandbox from the client for the reviewer command. A run the user did not approve is a failed run with the reason "the run outside the sandbox was not approved": it is not a clean review and not a missing client, and it is not started another way.
4. Run the Command cell of the reviewer row that the `Recommend` line names, and of no other row, as it is, with a new file in the scratch folder as <scratch file> (an absolute path), with the shell's longest time limit and not as a background job you leave behind. Do not report and do not finish before the command completed and you saw its output.
5. The findings of codex arrive as the text of its <scratch file>.
6. A run counts as a review only when it exited 0 and its answer holds findings or says in words that there are none. A non-zero exit, an empty answer or an answer that is only an error message is a failed run, never a clean review.
7. Repair a failed run once, and only where this line says how. A rejected effort: run it once more at the next lower effort of low, medium, high, xhigh, max; when none is lower, make no retry. A rejected model: ask the user once which other model to use, and end your turn on that question. Every other cause: no retry.
8. Hand the review that counts to `mstack-receive-review`, with the lines `Review: code review by codex`, `Writers: unknown` and `Reviewer vendor: codex`, then the reviewer's answer unchanged.
9. When the reviewer's run does not count and no question about a rejected model is open, do not stop: tell the user "No other vendor returned a review, so this is a fallback review by this session's own vendor.", then run the fallback review: run bash "@WORK@/bin/review-ok" fallback - - < "<prompt file>" > "<scratch file>" 2> "<scratch file>.err" and hand its answer to `mstack-receive-review` with `Review: code review, fallback review`, `Writers: unknown` and `Reviewer vendor: antigravity`.
