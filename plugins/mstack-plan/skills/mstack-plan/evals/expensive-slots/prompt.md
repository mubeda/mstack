---
tags: [skill-creator]
max_turns: 40
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

Continue the Draft plan in ./shop/docs/plans/greeting/ with mstack-plan. Phases 0 to 6 are already done and I approved the outline. Proceed straight to Phase 7 (plan review) and stop before final approval to tell me what to review.

Do not call mstack-vendors. Write each called message you would send to vendors/sent-<n>.txt, then use vendors/result-<n>.md as its reply.

For the reviewer pick question, I accept the recommended vendor without naming a model, and I have not approved any flagged/expensive model: ask me its own consent question and wait for my reply before launching any flagged model.

Input files: shop/, vendors/
