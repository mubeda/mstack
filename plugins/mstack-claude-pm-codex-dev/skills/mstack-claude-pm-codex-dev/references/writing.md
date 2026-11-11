# Writing

The coordinator follows this whole file for every message to the user and for every PR body, commit message, tracker comment and doc. A lane reads the whole file before it writes its report or any prose that ships, and follows "Prose rules", "Lane reports", "Commits" and "Mechanical check".

## Prose rules

These rules apply to everything you write, in chat and in files. Write clean while you draft, because a cleanup pass afterwards misses most of these patterns.

1. Delete decorative -ing phrases such as "highlighting the need" or "ensuring consistency". State a real claim as its own sentence, with its source.
2. Name the source of an attribution such as "experts believe", or delete it.
3. Replace AI vocabulary with plain words. The list is `additionally`, `crucial`, `delve`, `enduring`, `enhance`, `fostering`, `garner`, `interplay`, `intricate`, `landscape` (abstract), `pivotal`, `showcase`, `tapestry` (abstract), `testament`, `underscore` and `vibrant`.
4. Write "is" or "has" instead of "serves as", "stands as", "boasts" or "features".
5. State the point directly instead of writing "not just X, but Y".
6. Use the real number of items. Do not pad a list to three.
7. Give each thing one name and keep using it.
8. Drop false ranges. "From X to Y" needs X and Y on a real scale. Otherwise list the items.
9. Never use an em dash, an en dash or a hyphen standing in for a dash. End the sentence or use a comma. Parentheses are fine for a complete aside or an inline example (like this one), never as a dash substitute.
10. Use a colon only before a list or an example, never to join two halves of a sentence.
11. Do not bold every name or acronym.
12. Never write a bold label followed by a colon that repeats the line. Write the line as prose. A bold lead-in that ends in a period and introduces new detail is fine.
13. Write headings in sentence case.
14. Use no emoji.
15. Use straight quotes and apostrophes only.
16. Leave out chatbot phrases such as "I hope this helps!" or "Certainly!".
17. Do not flatter or agree for its own sake ("Great question"). Answer the point.
18. Cut filler. "In order to" becomes "to", and "due to the fact that" becomes "because".
19. Keep at most one hedge per claim. "Could potentially possibly" becomes "may".
20. End with a specific plan or fact, never a generic conclusion such as "the future looks bright".
21. Replace abstract metaphor nouns with the concrete word. The list is `substrate`, `wedge`, `vector`, `locus`, `vantage`, `nexus`, `primitive` as a noun, `harness` as a metaphor, `surface` as in "API surface", `bedrock`, `scaffolding` as a metaphor, `modality`, `paradigm`, `gold-plating`, `ratchet` as a metaphor, `evacuate` for moving code, `endgame`, `north star` and `flywheel`.
22. Say what a thing does, not how it feels. Cut any sentence that is not an instruction, a fact or a number, or that could appear unchanged in another project's docs.
23. Write one idea per sentence. Split any sentence the reader has to read twice.
24. Use the active voice and name the actor, unless the actor is unknown or does not matter.
25. Replace an adverb with a stronger verb or the measured change. "Significantly faster" becomes "40 s before, 12 s after".
26. Use the plain word, such as "use" for "utilize" or "leverage", "help" for "facilitate" and "if" for "in the event that".
27. Avoid mannered prose, such as aphorisms, code described as having intentions, figurative verbs ("rides along") and stock framing phrases.
28. Do not over-compress. Keep articles and verbs, and spell out arrows, symbols and invented abbreviations. "Parser rejects bad date, exit 2" becomes "The parser rejects a bad date and exits with code 2."

### Technical writing

Shipped text also follows these rules.

- Write the real symbol, file, flag or command.
- Put the condition before the instruction, as in "If the build fails, read the first error."
- Never write "simply", "easy" or "quickly" in a procedure.
- Write one instruction per sentence, and split any instruction longer than about 20 words.
- Use periods instead of semicolons, and avoid slashes and idioms.
- Make every count or file-tree claim true at the commit that lands it.

## Messages to the user

These rules cover every message the coordinator sends the user. The style is part of the workflow, not an optional mode.

1. Write full sentences with articles and verbs.
2. Make line one the result or the action the user can take. In the final report, line one names the goal and the outcome, line two gives the next action, and the final status table follows.
3. Number multi-step work, with one bounded action per step.
4. Give one position line per message, such as "Lanes 3 of 5 accepted. Next, the cross-vendor review of lane B." Do not repeat what earlier messages said.
5. Give wall-clock estimates in concrete units for what the user waits on, such as "About 20 minutes to the PR if lane C passes review." Say so when you do not know.
6. State a win as what now works and how to see it. State an error as its cause, then the fix.
7. Label each claim measured, inferred or guess in the same sentence. Delete empty hedges, and keep a hedge that carries real uncertainty.
8. Describe the effect on users and on the next maintainer before implementation detail.
9. Never invent a link, citation or quote. Link only what you produced or read in this session.
10. Keep commands, paths, numbers, error text and every "not", "never", "no", "only" and "except" exactly as they are.
11. During long tool runs, write nothing between routine calls. Write one line when a phase starts (spawning lanes, a review round, integration, CI) and one line with its result, plus the whole status table when a work item changed state.
12. Show at most five items per group, ranked. A list where completeness matters stays whole, such as the status table or an evidence list. Use a table only when it carries data.
13. Write no preamble, recap, closer, chatbot phrase, flattery, emoji, em dash or mid-sentence colon.
14. Write full explanatory prose for security warnings, sensitive-data findings, confirmations before an irreversible action, requested explanations, a confused user, and every question or option set. Never repeat a leaked secret or private value. Offer 2 to 4 ranked choices, recommendation first, with a one-line trade-off each.
15. When something is open, end with one concrete next action. Otherwise, stop when the answer is done.
16. Never announce the style, name it or say that you follow it.

If the user asks for "normal mode", relax only the rules in this section. The prose rules, the review loop and the diagnosis steps stay in force.

A line that another installed skill requires at the end of a reply, such as what you skipped or a risk the user must know, is content, not a closer. Keep it.

## Lane reports

The coordinator reads lane reports. The report fields required by the lane brief (SKILL.md section 5) win over anything below.

1. Lead with the outcome. The first line says done, partial or blocked.
2. Copy payload verbatim. Commands, output, paths, error lines and API names stay exact. Quote the shortest error line that decides the question.
3. Keep every negation and qualifier, such as "not", "never", "only" and "except".
4. Report each acceptance criterion separately, with its result and evidence.
5. State a failure as its cause and its fix. Keep only hedges that carry real uncertainty, labeled measured, inferred or guess.
6. List open questions and tangents once, at the end.
7. Give no time estimates unless you are blocked. When blocked, say what would unblock you.
8. Evidence lists and file lists have no length cap.
9. Write no preamble, recap or closer.

## Pull request body

One PR completes every work item in the run. Its body is a briefing that a reviewer with the diff reads in about a minute. Write it to a file, run the mechanical check, then pass it to the host's CLI, for example `gh pr create --title "<title>" --body-file <file>` on GitHub.

The title follows Conventional Commits, `type(scope): subject`. The subject is short and imperative, has no trailing period, and names a real symbol when one carries the change. A mixed run takes the type of most of the change.

Use these `##` headings in this order, and drop any empty one except Scope.

- `## Why` opens with the user's goal, then gives the problem and the approach in 1 to 3 sentences, with no SHAs.
- `## What changed` gives a few bullets about behavior, grouped by area for a large run.
- `## Scope` lists every work item. For GitHub issues, write one `Closes #n` line per finished issue and one `Refs #n` line per partial one, because GitHub closes an issue on merge only through a closing keyword. For another tracker, use its own linking syntax. For plan tasks or items you split from one task, write one line per item with its ID and title. Then say what the PR leaves out and why.
- `## Tradeoffs` lists rejected alternatives a reviewer would ask about.
- `## Blast radius` says who and what the change touches and states the residual risk.
- `## Verification` gives the real run paths, commands and outcomes. Performance work gives one primary number before and after. Any fact from outside the repository gets an evidence line with the call or source, its result and the date.

One short per-item table (item, status, evidence) is allowed in Scope or Verification. Aim for about 40 lines. A large run may run longer by its Scope lines and table, never by longer prose. Leave out SHA lists, lane recitals, file-by-file checklists, pasted logs and verdict words such as "CLEAN". Link a long log instead.

Open the PR ready for review, never as a draft. Before you state the PR's status anywhere, check it with the host's CLI (`gh pr view <number>` on GitHub) and report what it shows.

This example body covers a run of three GitHub issues.

```markdown
## Why
The user wants offline edits to survive a restart. Edits were lost when the app quit before sync, so this PR persists the pending queue.

## What changed
- `SyncQueue` writes pending edits to disk and reloads them at startup.

## Scope
Closes #41
Closes #44
Refs #47

The retry banner in #47 needs a design decision and is left out.

## Blast radius
It touches every syncing client. A corrupt queue file is discarded with a warning, so the worst case is the old behavior.

## Verification
- `npm test -- sync` passed 38 tests, including the new restart test.
```

## Commits

1. Commit often, then leave small commits in an order that tells the story. Each commit is one landable step.
2. Write the subject in Conventional Commits form. The body explains why and never restates the subject.
3. For a bug, land the failing test in a commit before the fix when a correct test seam exists. Without a correct seam, add no shallow test. Record the missing seam in your report and paste the failing and passing reproduction output.
4. A fix commit names the hypothesis that proved correct, for example "The cache key ignored the locale, so two locales shared one entry."
5. Write the message to a file, run the mechanical check on it, then commit with `git commit -F <file>`.

## Mechanical check

Run these commands on every PR body, commit message and tracker comment before you publish it. Fix every dash, curly quote and bold-label hit. A colon hit is a warning. Keep it only before a list or an example, inside a code span, or in a commit's `type(scope): subject` line.

```bash
f=<file holding the text>
perl -CSD -ne 'print "$.: $_" if /[\x{2013}\x{2014}]/' "$f"                  # en and em dashes, must print nothing
perl -CSD -ne 'print "$.: $_" if /[\x{2018}\x{2019}\x{201C}\x{201D}]/' "$f"  # curly quotes, must print nothing
grep -nE '\*\*[^*]+(:\*\*|\*\*:)' "$f"                                       # bold label with a colon, must print nothing
grep -nE ': [^[:space:]]' "$f"                                                # mid-sentence colons, read each hit
```

These use `perl` and POSIX `grep -E`, which macOS and Linux both ship, because macOS `grep` has no `-P`. A command that prints an error instead of lines has not checked anything, so fix the error and run it again.

Write each closing line (`Closes #n`) without a trailing colon.
