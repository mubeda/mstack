## mstack-vendors result

Leader: unknown
Warnings:
- the leader's vendor is unknown: send the full model id in Leader model

### code review
Writers: unknown
| Vendor | Role | State | Reason | Record | Command |
|---|---|---|---|---|---|
| claude | reviewer | available | | writer unknown | bash "@WORK@/bin/review-ok" claude claude-sonnet-5-5 medium app/greet.py < "<prompt file>" > "<scratch file>" 2> "<scratch file>.err" |
| codex | reviewer | available | | writer unknown | bash "@WORK@/bin/review-ok" codex gpt-6.2-sol xhigh app/greet.py < "<prompt file>" > "<scratch file>" 2> "<scratch file>.err" |
Recommend: claude, codex
Steps:
1. Write the review prompt into a new file in the scratch folder, with your file tool: first the text between the two `----` lines of mstack-vendors's references/review-prompt.md (or execute-plan.md's review prompt), whole, then the work to review. The absolute path of that file is <prompt file>, the same file for every reviewer.
2. Before you request the first reviewer run outside the sandbox, write the user this sentence, word for word, as a message of its own: "Each reviewer run starts outside the sandbox, so the client will ask you to approve each one."
3. Request a run outside the sandbox from the client for each reviewer command, one request per run.
4. Run the Command cell of each reviewer row that the `Recommend` line names, and of no other row, as it is, with a new file in the scratch folder as <scratch file> (an absolute path, one file per reviewer). Do not report before each command completed and you saw its output.
5. Run them one after the other, each with its own request outside the sandbox, and keep each run's exit code and output apart: the second run starts after the first completed, whatever the first returned.
6. The findings of codex arrive as the text of its <scratch file>.
7. The findings of claude arrive in its <scratch file> as the `result` field of one JSON object. Compare the keys of its `modelUsage` with the model asked for.
8. A run counts as a review only when it exited 0 and its answer holds findings or says in words that there are none.
9. Hand every review that counts to `mstack-receive-review`, each one on its own and unmerged: the lines `Review: code review by <vendor>`, `Writers: unknown` and `Reviewer vendor: <vendor>`, then the reviewer's answer unchanged.
10. When no reviewer's run counts, tell the user and run the fallback review.
