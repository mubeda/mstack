## mstack-vendors result

Leader: claude
Warnings: none

### developer
| Vendor | Role | State | Reason | Record | Command |
|---|---|---|---|---|---|
| codex | developer | available | | - | cd "@WORK@/mathlib" && node "@WORK@/bin/fake-dev.mjs" --vendor codex --model gpt-6.2-sol --effort low --prompt-file "<prompt file>" > "<scratch file>" 2> "<scratch file>.err" |
Recommend: codex
Steps:
1. Before the first round, run git -C "@WORK@/mathlib" status --porcelain. When it prints anything, list those paths, ask the user what to do with them, and wait: the developer writes in this checkout, so earlier changes would mix into its change. Never stash, discard or commit them yourself. Then note the commit you start from: git -C "@WORK@/mathlib" rev-parse HEAD.
2. Decide <phase-id> before the brief: the plan's phase number, or the work item's ID when there is no plan. Put it in single quotes in every command. Write the developer's brief into a new file in the scratch folder, with your file tool; its absolute path is <prompt file>. Its first line is exactly Phase <phase-id>, and it asks for a report whose first line is the same. It says: do not commit and do not push.
3. Run the Command cell of the codex row as it is, with a new file in the scratch folder as <scratch file>. Use the shell's longest time limit and do not leave it as a background job. Do not report and do not finish before the command completed and you saw its output.
4. Take the result from <scratch file>. Its first line is `thread: <id>`, followed by the developer's report whose first line must be `Phase <phase-id>`. Accept it only when the command exited 0 and its report names Phase <phase-id>. Keep its thread id as <thread>. Any other answer is a failed round, also when files changed.
5. Record the tree it left: node "@VENDORS@/scripts/codex-dev.mjs" snapshot --cwd "@WORK@/mathlib". The round's change is git diff between the commit you started from and that tree, new files included.
6. A fix round: write the findings into a new brief file in the scratch folder, whose first line is again Phase <phase-id>. Run the Command cell again with --resume <thread> added before --prompt-file (at the fix round's effort). Compare the `thread:` line it prints with <thread>: the answer "wrong thread" (a different thread id) is a failed round. Accept only when the command exited 0 and its report names Phase <phase-id>. Then snapshot again.
7. Review the change as the leader, and commit it yourself.

### developer
| Vendor | Role | State | Reason | Record | Command |
|---|---|---|---|---|---|
| codex | developer | available | | - | cd "@WORK@/mathlib" && node "@WORK@/bin/fake-dev.mjs" --vendor codex --model gpt-6.2-sol --effort high --prompt-file "<prompt file>" > "<scratch file>" 2> "<scratch file>.err" |
Recommend: codex
Steps:
1. Before the first round, run git -C "@WORK@/mathlib" status --porcelain. When it prints anything, list those paths, ask the user what to do with them, and wait: the developer writes in this checkout, so earlier changes would mix into its change. Never stash, discard or commit them yourself. Then note the commit you start from: git -C "@WORK@/mathlib" rev-parse HEAD.
2. Decide <phase-id> before the brief: the plan's phase number, or the work item's ID when there is no plan. Put it in single quotes in every command. Write the developer's brief into a new file in the scratch folder, with your file tool; its absolute path is <prompt file>. Its first line is exactly Phase <phase-id>, and it asks for a report whose first line is the same. It says: do not commit and do not push.
3. Run the Command cell of the codex row as it is, with a new file in the scratch folder as <scratch file>. Use the shell's longest time limit and do not leave it as a background job. Do not report and do not finish before the command completed and you saw its output.
4. Take the result from <scratch file>. Its first line is `thread: <id>`, followed by the developer's report whose first line must be `Phase <phase-id>`. Accept it only when the command exited 0 and its report names Phase <phase-id>. Keep its thread id as <thread>. Any other answer is a failed round, also when files changed.
5. Record the tree it left: node "@VENDORS@/scripts/codex-dev.mjs" snapshot --cwd "@WORK@/mathlib". The round's change is git diff between the commit you started from and that tree, new files included.
6. A fix round: write the findings into a new brief file in the scratch folder, whose first line is again Phase <phase-id>. Run the Command cell again with --resume <thread> added before --prompt-file (at the fix round's effort). Compare the `thread:` line it prints with <thread>: the answer "wrong thread" (a different thread id) is a failed round. Accept only when the command exited 0 and its report names Phase <phase-id>. Then snapshot again.
7. Review the change as the leader, and commit it yourself.

### code review
Writers: codex
| Vendor | Role | State | Reason | Record | Command |
|---|---|---|---|---|---|
| claude | leader | available | | cross-vendor | |
Recommend: the leader's review
Steps:
1. Your own review as the leader is the review of this section, and it always runs. Hand it to mstack-receive-review with the lines Review: code review by the leader, Writers: codex and Reviewer vendor: claude.
