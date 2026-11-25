## mstack-vendors result

Leader: codex
Warnings:
- code review (group 1): no other vendor reviews

### code review
Writers: codex
| Vendor | Role | State | Reason | Record | Command |
|---|---|---|---|---|---|
| claude | reviewer | not available | not installed: the claude command-line tool; mstack-setup installs it | - | |
| codex | fallback | available | | reviewer unknown | |
Recommend: a fallback review
Steps:
1. Write the review prompt into a new file in the scratch folder, with your file tool: first the review prompt text, whole, then the work to review (the diff of notes/).
2. This fallback run names no model option, so it runs on the model the client is configured with. Run and wait for completion: bash "@WORK@/bin/review-ok" fallback - - < "<prompt file>" > "<scratch file>" 2> "<scratch file>.err"
3. Hand its answer to `mstack-receive-review` with `Review: code review, fallback review`, `Writers: codex` and `Reviewer vendor: unknown`, then the answer unchanged.
