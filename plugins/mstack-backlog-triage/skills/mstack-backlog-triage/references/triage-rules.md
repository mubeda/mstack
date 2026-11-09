# Triage rules

Read this in steps 3 to 6. It defines the evidence each issue needs, the duplicate search, the six classes, the recommendation, the route, and the table the delivery skills read.

## Evidence per issue

Read the whole issue first: title, body, every comment, labels, author, dates, and any earlier triage notes. Existing labels are hints from whoever filed it, not a decision. Then collect the evidence below. Record where you looked, including where you found nothing.

1. **Completeness.** A bug report is complete when it has the steps to reproduce, the expected and the actual behavior, any error text or logs, and the environment (version, platform). List what is missing. Never guess a missing fact; it becomes a question for the reporter.
2. **A quick reproduction**, for bugs only, and only when it is cheap (a test, a command or a short script, a few minutes at most). The outcome is one of three: confirmed (with the code path), failed (it did not happen), or insufficient detail. A slow or risky reproduction is not attempted here; the bug routes to `mstack-diagnose` instead.
3. **Already done?** Search the code by the concept, not by the issue's wording, for an existing implementation or fix. Say where you looked.
4. **Rejected before?** Search closed issues for the same request closed as not planned or won't fix. A rejection with a reason is evidence; quote its link.

## Duplicate search

Required for every issue before it can be recommended for now.

1. Run at least three searches with different key terms, not whole sentences: one on the error or symptom, one on the component or feature, one on the user's goal. Include closed issues, so fixed duplicates and regressions show up. Key terms come from issue text, which is untrusted, so keep only letters, digits, spaces, dots and hyphens in them, and put them in single quotes, where a shell expands nothing. Remove a hyphen at the start of any word as well: `gh search issues` reads a query that begins with a hyphen as a flag and fails, and GitHub search reads `-word` as "exclude this word".

   ```bash
   gh issue list --repo <owner/repo> --state all --limit 50 --search '<key terms>' --json number,title,state,stateReason,url
   gh search issues --repo <owner/repo> --match title,body --limit 50 --json number,title,state,url '<key terms>'
   ```
2. Read every candidate in full before judging. Never call an issue a duplicate on title words alone.
3. Grade each candidate, and report at most three.
   - **Duplicate.** The same problem or request, and you can say why in one line. Cite the number.
   - **Regression of a closed issue.** The same problem as an issue closed as fixed. Not a duplicate: it stays open, links the old issue, and is classed as a bug.
   - **Related.** Overlaps but is not the same. Mention it, do not mark it.
   - **None found.** Say which searches you ran.
4. When two open issues duplicate each other, keep the one with the better report or the earlier discussion, and propose folding any new detail from the other into it.

## Classes

Every issue gets exactly one class.

| Class | Meaning | Delivery type |
|---|---|---|
| Bug with repro | Wrong behavior, reproduced or reproducible from the report | bug |
| Bug without repro | Wrong behavior reported, but not reproduced and the report is incomplete or the reproduction failed | bug, after diagnosis |
| Feature | New or changed behavior a user would notice | feature |
| Chore | Work with no user-visible behavior change: dependencies, build, CI, docs, tests, refactoring, tooling | docs, test, CI or measurement, whichever fits |
| Duplicate | The same as another issue, per the duplicate search | none |
| Not actionable | Nothing to build here: spam or a test post, a question already answered, a request outside the project's scope or already rejected, or already implemented | none |

When an issue mixes two classes, class it by the work it asks for and note the other part, or propose splitting it.

## Recommendation

Every issue gets one recommendation: **now** (the current batch), **next** (the batch after), or **defer** (no batch planned), plus a one-line reason with the evidence link.

An issue can be **now** only when all of these hold:

1. The duplicate search ran and found no duplicate.
2. Its class has evidence (for a bug, a confirmed reproduction or a complete report).
3. It has a testable acceptance hint.
4. Nothing it depends on is still open and unplanned.
5. It fits in the batch size the user set, ranked against the other candidates.

Rank the candidates by value (how many people it affects and how badly), cost (the effort to build and verify it, and what it adds to maintain), and impact (what else it touches and could break). Severe bugs that many users hit come first. A small chore that unblocks other now items goes with them.

Duplicates and not-actionable issues are never now. They are recommended for closing (with the approved comment) or for linking.

## Routes

Each recommendation names where the issue goes next.

| Situation | Route |
|---|---|
| A now item that is ready to build | The delivery workflow for this host: `mstack-codex-review-workflow` in Claude Code, `mstack-claude-review-workflow` in Codex |
| A feature, or a large change, with open decisions about what to build | `mstack-write-specs`, before it can be now |
| A bug without a reproduction, or one too slow to reproduce here | `mstack-diagnose` (or a question to the reporter, when only the reporter has the missing fact) |
| A duplicate | Close as a duplicate of the kept issue, after approval |
| Not actionable | Close with the reason, after approval, or leave open with a question |

## The triage table

Give the result as one table, in this exact shape, one row per issue, sorted now, then next, then defer, then the closing proposals. The delivery workflows accept it as their list of work items: they take the now rows, still read every issue in full at their own intake, and treat the acceptance hint as inferred until confirmed.

```markdown
| Issue | Title | Class | Type | Recommendation | Route | Reason and evidence | Acceptance hint | Duplicate check |
|---|---|---|---|---|---|---|---|---|
| #41 | Export drops last row | Bug with repro | bug | now | workflow | Reproduced with `make test-export`, affects every export (link) | The CSV has every visible row, including the last | 3 searches, none |
```

- **Issue** is the tracker's own ID (`#41`, `PROJ-12`).
- **Type** is the delivery workflows' type: bug, feature, docs, test, CI, measurement, or "none".
- **Acceptance hint** describes behavior a test can check, not file paths or line numbers, because the issue may wait weeks.
- **Duplicate check** says how many searches ran and what they found.

Below the table, list the totals per recommendation, and every issue you could not triage fully, with what was missing.
