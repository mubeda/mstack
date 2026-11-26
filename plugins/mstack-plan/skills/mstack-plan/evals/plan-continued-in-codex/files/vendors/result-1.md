## mstack-vendors result

Leader: codex
Warnings:
- plan review (group 1): no other vendor reviews

### plan review
Writers: claude, codex
| Vendor | Role | State | Reason | Record | Command |
|---|---|---|---|---|---|
| codex | fallback | available | | reviewer unknown | |
Recommend: a fallback review
Steps:
1. Write the review prompt into a new file in the scratch folder, with your file tool: first the text between the two `----` lines of mstack-vendors's references/review-prompt.md (or references/plan-review.md), whole, then the work to review.
2. This run names no model, so it runs on the model the client is configured with, which may differ from this session's model. Run it as an approved command, wait for it, and do not report before it completed: bash "@WORK@/bin/review-ok" codex configured medium < "<prompt file>" > "<scratch file>" 2> "<scratch file>.err"
3. Read the header at the top of <scratch file>.err, which names the run's model on a line `model: ` and its provider on a line `provider: `. Hand the answer to `mstack-receive-review` with the lines `Review: plan review, fallback review`, `Writers: claude, codex` and `Reviewer vendor: codex` when the header says `provider: openai`, or `Reviewer vendor: unknown` when it names another provider or there is no header, then the answer unchanged.
