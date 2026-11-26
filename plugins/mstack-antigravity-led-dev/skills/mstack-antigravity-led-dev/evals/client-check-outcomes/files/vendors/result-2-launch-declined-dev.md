## mstack-vendors result

Leader: antigravity
Warnings: none

### developer
| Vendor | Role | State | Reason | Record | Command |
|---|---|---|---|---|---|
| claude | developer | not available | no model was given for claude in the Models line | - | |
| codex | developer | available | | - | cd "@WORK@/mathlib" && node "@WORK@/bin/fake-dev.mjs" --vendor codex --model gpt-6.2-sol --effort low --prompt-file "<prompt file>" > "<scratch file>" 2> "<scratch file>.err" |
Recommend: codex
Steps:
1. Before you request the first developer run outside the sandbox, write the user this sentence, word for word, as a message of its own: "Each developer run starts outside the sandbox, so the client will ask you to approve each one."
2. Request a run outside the sandbox from the client for each developer command, one request per run, fix rounds included. A run the user did not approve is a failed round with the reason "the run outside the sandbox was not approved": it is not started another way.
3. Before the first round, run git -C "@WORK@/mathlib" status --porcelain. When it prints anything, list those paths, ask the user what to do with them, and wait: the developer writes in this checkout, so earlier changes would mix into its change. Never stash, discard or commit them yourself. Then note the commit you start from: git -C "@WORK@/mathlib" rev-parse HEAD.
4. Write the developer's brief into a new file in the scratch folder, with your file tool; its absolute path is <prompt file>. The brief says: do not commit and do not push; leave every change in the working tree.
5. Run the Command cell of the codex row as it is, with a new file in the scratch folder as <scratch file>. Use the shell's longest time limit and do not leave it as a background job. Do not report and do not finish before the command completed and you saw its output.
6. The developer's output starts with the line `thread: <id>`, followed by the developer's report. Keep that id as <thread> for a fix round. A non-zero exit or an empty report is a failed round.
7. Record the tree it left: node "@VENDORS@/scripts/codex-dev.mjs" snapshot --cwd "@WORK@/mathlib". The round's change is git diff between the commit you started from and that tree, new files included.
8. A fix round: write the findings into a new brief file and run the Command cell again with --resume <thread> added before --prompt-file (at the fix round's effort). Compare the `thread:` line it prints with <thread>: a different thread is a failed round. Then snapshot again.
9. Review the change as the leader, and commit it yourself.

### developer
| Vendor | Role | State | Reason | Record | Command |
|---|---|---|---|---|---|
| claude | developer | not available | no model was given for claude in the Models line | - | |
| codex | developer | available | | - | cd "@WORK@/mathlib" && node "@WORK@/bin/fake-dev.mjs" --vendor codex --model gpt-6.2-sol --effort medium --prompt-file "<prompt file>" > "<scratch file>" 2> "<scratch file>.err" |
Recommend: codex
Steps:
1. Before you request the first developer run outside the sandbox, write the user this sentence, word for word, as a message of its own: "Each developer run starts outside the sandbox, so the client will ask you to approve each one."
2. Request a run outside the sandbox from the client for each developer command, one request per run, fix rounds included. A run the user did not approve is a failed round with the reason "the run outside the sandbox was not approved": it is not started another way.
3. Before the first round, run git -C "@WORK@/mathlib" status --porcelain. When it prints anything, list those paths, ask the user what to do with them, and wait: the developer writes in this checkout, so earlier changes would mix into its change. Never stash, discard or commit them yourself. Then note the commit you start from: git -C "@WORK@/mathlib" rev-parse HEAD.
4. Write the developer's brief into a new file in the scratch folder, with your file tool; its absolute path is <prompt file>. The brief says: do not commit and do not push; leave every change in the working tree.
5. Run the Command cell of the codex row as it is, with a new file in the scratch folder as <scratch file>. Use the shell's longest time limit and do not leave it as a background job. Do not report and do not finish before the command completed and you saw its output.
6. The developer's output starts with the line `thread: <id>`, followed by the developer's report. Keep that id as <thread> for a fix round. A non-zero exit or an empty report is a failed round.
7. Record the tree it left: node "@VENDORS@/scripts/codex-dev.mjs" snapshot --cwd "@WORK@/mathlib". The round's change is git diff between the commit you started from and that tree, new files included.
8. A fix round: write the findings into a new brief file and run the Command cell again with --resume <thread> added before --prompt-file (at the fix round's effort). Compare the `thread:` line it prints with <thread>: a different thread is a failed round. Then snapshot again.
9. Review the change as the leader, and commit it yourself.

### developer
| Vendor | Role | State | Reason | Record | Command |
|---|---|---|---|---|---|
| claude | developer | not available | no model was given for claude in the Models line | - | |
| codex | developer | available | | - | cd "@WORK@/mathlib" && node "@WORK@/bin/fake-dev.mjs" --vendor codex --model gpt-6.2-sol --effort high --prompt-file "<prompt file>" > "<scratch file>" 2> "<scratch file>.err" |
Recommend: codex
Steps:
1. Before you request the first developer run outside the sandbox, write the user this sentence, word for word, as a message of its own: "Each developer run starts outside the sandbox, so the client will ask you to approve each one."
2. Request a run outside the sandbox from the client for each developer command, one request per run, fix rounds included. A run the user did not approve is a failed round with the reason "the run outside the sandbox was not approved": it is not started another way.
3. Before the first round, run git -C "@WORK@/mathlib" status --porcelain. When it prints anything, list those paths, ask the user what to do with them, and wait: the developer writes in this checkout, so earlier changes would mix into its change. Never stash, discard or commit them yourself. Then note the commit you start from: git -C "@WORK@/mathlib" rev-parse HEAD.
4. Write the developer's brief into a new file in the scratch folder, with your file tool; its absolute path is <prompt file>. The brief says: do not commit and do not push; leave every change in the working tree.
5. Run the Command cell of the codex row as it is, with a new file in the scratch folder as <scratch file>. Use the shell's longest time limit and do not leave it as a background job. Do not report and do not finish before the command completed and you saw its output.
6. The developer's output starts with the line `thread: <id>`, followed by the developer's report. Keep that id as <thread> for a fix round. A non-zero exit or an empty report is a failed round.
7. Record the tree it left: node "@VENDORS@/scripts/codex-dev.mjs" snapshot --cwd "@WORK@/mathlib". The round's change is git diff between the commit you started from and that tree, new files included.
8. A fix round: write the findings into a new brief file and run the Command cell again with --resume <thread> added before --prompt-file (at the fix round's effort). Compare the `thread:` line it prints with <thread>: a different thread is a failed round. Then snapshot again.
9. Review the change as the leader, and commit it yourself.

### code review
Writers: codex
| Vendor | Role | State | Reason | Record | Command |
|---|---|---|---|---|---|
| antigravity | leader | available | | cross-vendor | |
| claude | reviewer | available | | cross-vendor | node "@WORK@/bin/fake-review.mjs" --vendor claude --model claude-sonnet-5-5 --effort high --prompt-file "<prompt file>" > "<scratch file>" 2> "<scratch file>.err" |
Recommend: the leader's review + claude
Steps:
1. Your own review as the leader is the review of this section, and it always runs. Hand it to mstack-receive-review with the lines Review: code review by the leader, Writers: codex and Reviewer vendor: antigravity.
2. Write the review prompt into a new file in the scratch folder, with your file tool: first the text between the two `----` lines of "@VENDORS@/references/review-prompt.md", whole, then the work to review (for a code review the diff; for a plan review the plan's files, named by their paths inside the workspace). The absolute path of that file is <prompt file>, the same file for every reviewer.
3. Before you request the first reviewer run outside the sandbox, write the user this sentence, word for word, as a message of its own: "Each reviewer run starts outside the sandbox, so the client will ask you to approve each one."
4. Request a run outside the sandbox from the client for each reviewer command, one request per run. A run the user did not approve is a failed run with the reason "the run outside the sandbox was not approved": it is not a clean review and not a missing client, and it is not started another way.
5. Run the Command cell of each reviewer row that the `Recommend` line names, and of no other row, as it is, with a new file in the scratch folder as <scratch file> (an absolute path, one file per reviewer), with the shell's longest time limit and not as a background job you leave behind. Do not report and do not finish before each command completed and you saw its output.
6. The findings of claude arrive in its <scratch file> as the `result` field of one JSON object. Compare the keys of its `modelUsage` with the model asked for, the one after `--model` in its command, and verify that `permission_denials` is an empty list: a run on another model or with a non-empty `permission_denials` list is a failed run with that reason.
7. A run counts as a review only when it exited 0 and its answer holds findings or says in words that there are none. A non-zero exit, an empty answer, an `is_error` that is true, a non-empty `permission_denials` list or an answer that is only an error message is a failed run, never a clean review.
8. Repair a failed run once, and only where this line says how. A rejected effort: run it once more at the next lower effort of low, medium, high, xhigh, max; when none is lower, make no retry. A rejected model: ask the user once which other model to use, and end your turn on that question: before the answer nothing more runs for that vendor and no fallback review starts; with the answer, run that vendor's command once more with the model the user named in place of the rejected one. Every other cause (a sign-in or network error, a run that was not approved, another model in `modelUsage`, a non-empty `permission_denials` list, an empty answer): no retry. Judge a repaired run by the line "A run counts as a review only when" above: a repaired run that counts is a review like any other. A run is reported as failed, with its reason, only when no repair applies, when its repair failed too, or when the user named no other model.
9. Hand every review that counts to `mstack-receive-review`, each one on its own and unmerged, also when two reviewers report the same finding: the lines `Review: code review by claude`, `Writers: codex` and `Reviewer vendor: claude`, then the reviewer's answer unchanged.
10. When the reviewer's run does not count, your own review as the leader stands: report the failed run with its reason, and start no fallback review.
