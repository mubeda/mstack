## mstack-vendors result

Leader: claude
Warnings: none

### code review
Writers: claude
| Vendor | Role | State | Reason | Record | Command |
|---|---|---|---|---|---|
| codex | reviewer | available |  | cross-vendor | bash "@WORK@/bin/review-ok" codex gpt-6.2-sol xhigh < "<prompt file>" > "<scratch file>" 2> "<scratch file>.err" |
Recommend: codex
Steps:
1. Write the review prompt into a new file in the scratch folder, with your file tool: first the review prompt text, whole, then the work to review.
2. Run the Command cell of codex and wait for completion.
3. Hand the review to `mstack-receive-review` with `Review: code review by codex`, `Writers: claude` and `Reviewer vendor: codex`.

### code review
Writers: claude
| Vendor | Role | State | Reason | Record | Command |
|---|---|---|---|---|---|
| codex | reviewer | available |  | cross-vendor | bash "@WORK@/bin/review-ok" codex gpt-6.2-sol high < "<prompt file>" > "<scratch file>" 2> "<scratch file>.err" |
Recommend: codex
Steps:
1. Write the review prompt into a new file in the scratch folder, with your file tool: first the review prompt text, whole, then the work to review.
2. Run the Command cell of codex and wait for completion.
3. Hand the review to `mstack-receive-review` with `Review: code review by codex`, `Writers: claude` and `Reviewer vendor: codex`.
