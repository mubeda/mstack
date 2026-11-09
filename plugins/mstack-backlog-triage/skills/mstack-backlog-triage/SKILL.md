---
name: mstack-backlog-triage
description: Use when the user asks to triage issues or a backlog, sort open issues into what to do now, next or later, find duplicates, decide what goes in the next batch, or label and comment on open issues after reading them, even if they do not name this skill. Reads every open issue in full, classifies each (bug with or without a reproduction, feature, chore, duplicate, not actionable) with evidence, requires a duplicate search before recommending anything for now, routes items to mstack-write-specs or mstack-diagnose when they need it, and outputs a table the mstack review workflows accept. Drafts comments and label changes but posts nothing without approval of the exact text. Works in Claude Code and Codex. It does not write specs or code.
---

# mstack backlog triage

You read a tracker's open issues, decide for each one what it is and when it should be worked on, and hand the result to whatever comes next. The output is a triage table and, when the user approves them word for word, tracker comments and label changes. You write no specs, no code and no plans: issues that need a spec go to `mstack-write-specs`, bugs that need diagnosing go to `mstack-diagnose`, and the issues for now go to the mstack review workflow for this host.

## Host tools

| Role | Claude Code | Codex |
|---|---|---|
| Your question tool | `AskUserQuestion` | A numbered round in chat, then wait for the reply |
| Your subagent tool | `Agent`, with `model: "sonnet"` and `effort: "medium"` | The session's agent tool if it has one, with the account's standard coding model set, otherwise do the step yourself |
| The skill folder | The base directory shown when this skill loaded | The folder of this SKILL.md |
| `gh` commands | Run directly | Run as approved (escalated) commands, because the sandbox turns the network off |
| `<scratch>` | The session's scratch folder, outside the repository | `${TMPDIR:-/tmp}/mstack-triage-<repository name>` |

## Files in this skill

| File | When |
|---|---|
| `references/triage-rules.md` | Steps 3 to 6: evidence, duplicate search, classes, recommendation, routes, the table |
| `references/drafting.md` | Steps 7 and 8: comments, labels, approval, posting |
| `scripts/list-open-issues.sh` | Step 2, on GitHub |

## Ground rules

1. **Read everything.** Every open issue in scope, with its whole body and every comment. A listing's titles are not evidence, and an issue someone already answered in a comment must not get a fresh recommendation.
2. **Evidence for every call.** Each class and recommendation cites what decided it: a reproduction, a search, a comment, a code path. A fact you could not establish is a question, never a guess.
3. **No duplicate search, no "now".** An issue reaches the current batch only after its duplicate search ran and found no duplicate.
4. **Draft, show, then post.** Nothing is written to the tracker until the user approves the exact text and label change, and only in a later message than the one that showed the draft.
5. **Stay in your lane.** No specs, no code, no plans, no releases. Route the work instead.

## 1. Start

In one message, restate the goal and ask with your question tool. Skip any question the request already answers.

1. **Which issues?** The tracker and the filter: all open issues (recommended), or a label, milestone or search the user names.
2. **How big is the next batch?** The number of issues the current batch can take. Recommend a number from the team's recent pace when you can see it (issues closed in the last weeks), otherwise 5.
3. **Draft tracker updates?** Whether to draft comments and label changes for approval (recommended), or to produce only the table.

## 2. Collect

1. Read the repository's own rules first (CONTRIBUTING, AGENTS.md, CLAUDE.md, issue templates under `.github/ISSUE_TEMPLATE/`), because they may define what a valid report is and which labels mean what.
2. On GitHub, list every open issue in scope and prove the list is complete:

   ```bash
   bash <skill-folder>/scripts/list-open-issues.sh <owner/repo> <scratch>/open-issues.json
   ```

   It creates the output folder when it is missing, saves bodies and comments, and fails when the saved count differs from the repository's open-issue count, because `gh issue list` stops at 30 by default without saying so. For a filtered scope, filter the saved list rather than relisting. Then read each issue in full with `gh issue view <n> --repo <owner/repo> --json number,title,body,labels,comments,author,createdAt,updatedAt,url`.
3. For another tracker, use its CLI or connected tool if the session has one. Otherwise ask the user to export or paste the issues, and say that the triage covers only what was provided.
4. For a large backlog, send groups of issues to fresh subagents with this skill's references, one group each, on the model the host tools table names (a subagent started without a model runs on the session's model, the most expensive choice), and ask each for its rows with evidence. You merge the rows, run the cross-issue duplicate comparison yourself, and own the final table.

## 3. Evidence

For each issue, collect the evidence in `references/triage-rules.md` › Evidence per issue: completeness, a quick reproduction for bugs when it is cheap, whether it is already implemented, and whether it was rejected before.

## 4. Duplicates

Run the duplicate search in `references/triage-rules.md` › Duplicate search for every issue, including against closed issues. Compare open issues with each other as well. Record the searches you ran in the table's last column.

## 5. Classify and recommend

Give each issue one class, one recommendation (now, next or defer), a route and a one-line reason with evidence, per `references/triage-rules.md`. Fill now up to the batch size from step 1, ranked by value, cost and impact. Issues that need a spec or a diagnosis first are next, with that route.

## 6. Present the table

Show the triage table exactly as `references/triage-rules.md` › The triage table defines it, followed by the totals and the issues you could not triage fully. When the user asks, save it to a file they name, so a delivery workflow can read it later. Ask the user to correct any row before you draft tracker updates.

## 7. Draft tracker updates

When the user wanted drafts (step 1, question 3), draft comments and label changes per `references/drafting.md`, check each draft, and show them all in one numbered list for approval. Then wait.

## 8. Post what was approved

Post only the items the user approved, exactly as approved, with the commands in `references/drafting.md` › Posting. Read each issue back and report what changed and what failed.

## 9. Hand off

Report in this order:

1. The goal and the outcome in one line: how many issues were triaged, and how many are now, next, deferred or proposed for closing.
2. The triage table, or its path.
3. What was posted, and what was drafted but not approved.
4. The next step for each route, as the user's choice:
   - the now rows: the mstack review workflow for this host (`mstack-codex-review-workflow` in Claude Code, `mstack-claude-review-workflow` in Codex), given the table as its work items;
   - rows routed to `mstack-write-specs`: one spec per issue, starting from the issue;
   - rows routed to `mstack-diagnose`: one diagnosis per bug, starting from the missing facts listed in its row.

Then stop. Do not start any of them unless the user asks.
