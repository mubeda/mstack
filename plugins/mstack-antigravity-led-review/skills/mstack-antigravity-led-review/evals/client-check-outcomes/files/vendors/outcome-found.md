## mstack-vendors result

Leader: antigravity
Warnings: none

### code review
Writers: antigravity
| Vendor | Role | State | Reason | Record | Command |
|---|---|---|---|---|---|
| claude | reviewer | available |  | cross-vendor | bash "@WORK@/bin/review-ok" claude claude-sonnet-5-5 medium < "<prompt file>" > "<scratch file>" 2> "<scratch file>.err" |
| codex | reviewer | available |  | cross-vendor | bash "@WORK@/bin/review-ok" codex gpt-6.2-sol xhigh < "<prompt file>" > "<scratch file>" 2> "<scratch file>.err" |
Recommend: claude, codex
Steps:
1. Write the review prompt into a new file in the scratch folder, with your file tool: first the review prompt text, whole, then the work to review (the diff of notes/). The absolute path of that file is <prompt file>, the same file for every reviewer.
2. Before you request the first reviewer run outside the sandbox, write the user this sentence, word for word, as a message of its own: "Each reviewer run starts outside the sandbox, so the client will ask you to approve each one."
3. Request a run outside the sandbox from the client for each reviewer command, one request per run. A run the user did not approve is a failed run with the reason "the run outside the sandbox was not approved": it is not a clean review and not a missing client, and it is not started another way.
4. Run the Command cell of each reviewer row that the `Recommend` line names, and of no other row, as it is, with a new file in the scratch folder as <scratch file> (an absolute path, one file per reviewer), with the shell's longest time limit and not as a background job you leave behind. Do not report and do not finish before each command completed and you saw its output.
5. Run them one after the other, each with its own request outside the sandbox, and keep each run's exit code and output apart: the second run starts after the first completed, whatever the first returned.
6. The findings of codex arrive as the text of its <scratch file>.
7. The findings of claude arrive in its <scratch file> as the `result` field of one JSON object. Compare the keys of its `modelUsage` with the model asked for, the one after `--model` (or the model argument in the stand-in command), and verify that `permission_denials` is an empty list: a run on another model or with a non-empty `permission_denials` list is a failed run with that reason.
8. A run counts as a review only when it exited 0 and its answer holds findings or says in words that there are none. A non-zero exit, an empty answer, an `is_error` that is true, a non-empty `permission_denials` list or an answer that is only an error message is a failed run, never a clean review.
9. Repair a failed run once, and only where this line says how. A rejected effort: run it once more at the next lower effort of low, medium, high, xhigh, max; when none is lower, make no retry. A rejected model: ask the user once which other model to use, and end your turn on that question. Every other cause (a sign-in or network error, a run that was not approved, another model in `modelUsage`, a non-empty `permission_denials` list, an empty answer): no retry.
10. Hand every review that counts to `mstack-receive-review`, each one on its own and unmerged, also when two reviewers report the same finding: the lines `Review: code review by <vendor>`, `Writers: antigravity` and `Reviewer vendor: <vendor>`, then the reviewer's answer unchanged.
11. When no reviewer's run counts and no question about a rejected model is open, do not stop: tell the user "No other vendor returned a review, so this is a fallback review by this session's own vendor.", then run the fallback review: run bash "@WORK@/bin/review-ok" fallback - - < "<prompt file>" > "<scratch file>" 2> "<scratch file>.err" and hand its answer to `mstack-receive-review` with `Review: code review, fallback review`, `Writers: antigravity` and `Reviewer vendor: antigravity`.
