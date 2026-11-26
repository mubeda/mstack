## mstack-vendors result

Leader: claude
Warnings:
- code review (group 1): no other vendor reviews

### code review
Writers: claude
| Vendor | Role | State | Reason | Record | Command |
|---|---|---|---|---|---|
| codex | reviewer | not available | not installed: the codex command-line tool; mstack-setup installs it | - |  |
| claude | fallback | available |  | same-vendor |  |
Recommend: a fallback review
Steps:
1. Write the review prompt into a new file in the scratch folder, with your file tool: first the review prompt text, whole, then the work to review (the diff of notes/).
2. Run the fallback review command and wait for completion: bash "@WORK@/bin/review-ok" fallback - - < "<prompt file>" > "<scratch file>" 2> "<scratch file>.err"
3. Hand its answer to `mstack-receive-review` with the lines `Review: code review, fallback review`, `Writers: claude` and `Reviewer vendor: claude`, then the answer unchanged.
