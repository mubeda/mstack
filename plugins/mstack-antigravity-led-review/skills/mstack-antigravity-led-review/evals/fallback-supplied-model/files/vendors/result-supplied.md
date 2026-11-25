## mstack-vendors result

Leader: codex
Warnings:
- code review (group 1): no other vendor reviews

### code review
Writers: codex
| Vendor | Role | State | Reason | Record | Command |
|---|---|---|---|---|---|
| claude | reviewer | not available | not installed: the claude command-line tool; mstack-setup installs it | - | |
| codex | fallback | available | | same-vendor | |
Recommend: a fallback review
Steps:
1. Write the review prompt into a new file in the scratch folder, with your file tool: first the review prompt text, whole, then the work to review (the diff of notes/).
2. Run the supplied-model fallback review command and wait for completion (note: this fallback runs on the supplied model `gpt-6.2-astra`, which differs from this session's model): bash "@WORK@/bin/review-ok" fallback gpt-6.2-astra high < "<prompt file>" > "<scratch file>" 2> "<scratch file>.err"
3. Hand its answer to `mstack-receive-review` with `Review: code review, fallback review`, `Writers: codex` and `Reviewer vendor: codex`, then the answer unchanged.
