## mstack-vendors result

Leader: codex
Warnings: none

### code review
Writers: codex
| Vendor | Role | State | Reason | Record | Command |
|---|---|---|---|---|---|
| claude | reviewer | available |  | cross-vendor | bash "@WORK@/bin/review-ok" claude claude-sonnet-5-5 medium < "<prompt file>" > "<scratch file>" 2> "<scratch file>.err" |
Recommend: claude
Steps:
1. Write the review prompt into a new file in the scratch folder, with your file tool: first the review prompt text, whole, then the work to review.
2. Run the Command cell of claude and wait for completion.
3. Hand the review to `mstack-receive-review` with `Review: code review by claude`, `Writers: codex` and `Reviewer vendor: claude`.

### code review
Writers: codex
| Vendor | Role | State | Reason | Record | Command |
|---|---|---|---|---|---|
| claude | reviewer | available |  | cross-vendor | bash "@WORK@/bin/review-ok" claude claude-sonnet-5-5 low < "<prompt file>" > "<scratch file>" 2> "<scratch file>.err" |
Recommend: claude
Steps:
1. Write the review prompt into a new file in the scratch folder, with your file tool: first the review prompt text, whole, then the work to review.
2. Run the Command cell of claude and wait for completion.
3. Hand the review to `mstack-receive-review` with `Review: code review by claude`, `Writers: codex` and `Reviewer vendor: claude`.
