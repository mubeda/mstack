# Add mstack-write-issue, a skill that turns a finding into one well-formed tracker issue

Status: Approved 2026-11-16 (approved in chat by the user)
Size: full    Mode: gated    Type: feature
Source: https://github.com/mubeda/mstack/issues/21

## Problem

No mstack skill writes a tracker issue. When an agent has to file one (a bug found during validation, a follow-up scoped out of a pull request), `mstack-auto` has no row for it and the agent writes the issue ad hoc, so its quality depends on the run: issue #21 reports a real bug issue whose first draft had no steps to reproduce, no expected and actual result and no environment. The three delivery workflows log a finding outside the change's scope as "deferred, as a follow-up" (`mstack-receive-review`, rule 13) and nothing turns that log line into an issue.

## Goals

1. A user can say "file an issue for this" and get one issue that a maintainer can act on without asking back: what happened, how to see it, what should happen, and when it counts as done.
2. No issue is opened for a problem the tracker already has: the existing issue gets the new evidence instead.
3. Nothing private reaches a public tracker through an issue the skill wrote.
4. A follow-up that a workflow deferred can become an issue with one yes from the user, instead of staying a line in a log.

## Non-goals

- Triage of existing issues (classes, priorities, the next batch): `mstack-backlog-triage` does that.
- Diagnosing the bug or fixing it: `mstack-diagnose` and the delivery workflows do that. The skill reports what the session already knows.
- Pull request descriptions, release notes and comments that are not about a duplicate.
- An offer from `mstack-diagnose`: a diagnosis that ends without a fix does not offer the skill. The user can still ask for an issue.
- A requirement for the workflows: they offer the skill when it is installed and work as today without it.
- Posting from called mode. The calling skill shows the draft and posts what the user approves.
- Assignees, milestones and projects. The skill sets a title, a body and labels.
- A run of the description optimizer of Anthropic's skill creator.

Anti-goals: an issue with invented steps or an invented impact; a second issue for a problem that already has one; an issue posted before the user approved its exact text; a label created or guessed; a credential, host name or person's name in a posted body; a security vulnerability described in a public issue.

## Users and scenarios

1. As a developer whose agent hit a bug it will not fix now, I want it filed with everything a maintainer needs, so that the report is not bounced for missing steps.
2. As a maintainer, I want new evidence added to the issue I already have, so that I do not close duplicates.
3. As a developer running a delivery workflow, I want the follow-ups it deferred offered to me as drafted issues at the end, so that they are not lost.
4. As a developer on a tracker other than GitHub, I want the finished text to paste, so that the same quality reaches my tracker.

## Requirements

### R1. Two modes  [Must]
WHEN the user asks for an issue, `mstack-write-issue` SHALL work in user mode. WHEN another skill loads it with the called message of R14, whose first line is `Called by: <skill>`, it SHALL work in called mode: ask the user nothing, post nothing, and end with the result block of R14.
#### Scenario: a user request
- GIVEN the session found a bug and the user says "file an issue for the timeout bug"
- WHEN the skill runs
- THEN it runs the duplicate check, drafts the issue and goes on as R10 says
#### Scenario: a called request
- GIVEN a workflow calls with one deferred follow-up
- WHEN the skill runs
- THEN it returns the draft in the result block, and no issue or comment is created

### R2. Duplicate check first  [Must]
Before it drafts, `mstack-write-issue` SHALL search the tracker's open and closed issues with at least two different queries built from the finding's key words (the fixed text of an error, the component, the symptom), read each plausible match in full with its comments, and record the queries it ran. The queries SHALL pass the same removal of private values as the body (R9), because they are sent to the tracker's search.
#### Scenario: nothing matches
- GIVEN no open or closed issue describes the finding
- WHEN the check ends
- THEN the draft is for a new issue, and the report names the queries
#### Scenario: the search cannot run
- GIVEN the tracker cannot be reached and no export of its issues was given
- WHEN the skill drafts
- THEN the draft says "duplicate check not run" with the reason, and does NOT say that no duplicate exists

### R3. A match gets the evidence  [Must]
WHEN an open issue describes the same problem, `mstack-write-issue` SHALL draft a comment for that issue that holds only what the issue does not have yet, and SHALL NOT draft a new issue. WHEN the match is closed, it SHALL say so, name the closing reason and the fix when the issue shows one, and draft a new issue that links the closed one only when the finding shows the problem still occurs after that fix. It SHALL never edit the text of an existing issue: new evidence goes into a comment.
#### Scenario: an open duplicate
- GIVEN an open issue reports the same timeout
- WHEN the skill has new counts and a new environment
- THEN it drafts a comment with those for that issue, and drafts no new issue
#### Scenario: nothing new
- GIVEN the open issue already holds everything the session knows
- WHEN the check ends
- THEN the skill says the issue exists, gives its link, and drafts nothing

### R4. The repository's template wins  [Must]
WHEN the repository has issue templates, `mstack-write-issue` SHALL read them from the repository's default branch (or from the working tree when the tracker cannot be reached, and say which), choose the one nearest to the finding's type, and write the body in that template's own sections or fields, in their order, each filled or marked unknown. It SHALL take the title prefix and the labels the template names, keeping only labels that exist (R11). The outline of R5 is used only when the repository has no template at all. WHEN no template is a good fit, it SHALL use the nearest one and say so.
#### Scenario: an issue form
- GIVEN the repository has a bug form whose fields are labelled "What happened?", "Steps to reproduce" and "Version"
- WHEN the finding is a bug
- THEN the body has those three labels as headings in that order, each filled or marked unknown, followed by the done-when line of R7
#### Scenario: no template
- GIVEN the repository has no template folder
- WHEN the finding is a bug
- THEN the body follows the bug outline of R5

### R5. The outline by type  [Must]
Without a fitting template, `mstack-write-issue` SHALL write: for a bug, a summary, the steps to reproduce, the expected and the actual result as separate parts, the environment, the evidence, what was ruled out, and the done-when line; for a feature or a follow-up, the problem, the proposal, the scope (in and out), and the done-when line. The title SHALL name the component and the symptom or the change in one line, and SHALL NOT be repeated in the body.
#### Scenario: a bug
- GIVEN a crash with a known command and version
- WHEN the body is written
- THEN it has the seven bug parts and a done-when line
#### Scenario: a follow-up from a pull request
- GIVEN a finding deferred from a review
- WHEN the body is written
- THEN it has problem, proposal, scope and done-when, and links the pull request it came from

### R6. A bug that does not happen every time  [Must]
WHEN the session's evidence shows a bug that happened in some runs and not in others, `mstack-write-issue` SHALL write "Not deterministic" in the steps part, give the counts (how many times it happened out of how many attempts), the conditions under which it was seen and under which it was not, and SHALL NOT present steps as a reliable reproduction.
#### Scenario: three of twenty
- GIVEN the test failed in 3 of 20 runs
- WHEN the body is written
- THEN it says "failed in 3 of 20 runs" and what the failing runs had in common, or that nothing in common was found
#### Scenario: seen once
- GIVEN the failure was seen once and never again
- WHEN the body is written
- THEN it says so with the number of later attempts, and does NOT state steps that "reproduce" it

### R7. Done when  [Must]
Every drafted issue SHALL end with one "Done when" line that an observer can check. In a body that follows a template, the line comes after the template's last section, under its own heading, so the template's sections keep their order. For a bug that is not deterministic it SHALL also name the exit for "not reproducible": the evidence that would justify closing it (for example a number of runs without the failure under the conditions named).
#### Scenario: a deterministic bug
- GIVEN the bug has a command that fails every time
- WHEN the line is written
- THEN it names that command and its expected result
#### Scenario: a flaky test
- GIVEN the failure was seen in 3 of 20 runs
- WHEN the line is written
- THEN it names both the fixed state and the evidence for closing as not reproducible

### R8. No invented facts  [Must]
`mstack-write-issue` SHALL take every statement of the body from the session's evidence (output it saw, files it read, what the user said), keep the certainty the evidence has ("appears to", "in one run"), and write "unknown" for a part it has no evidence for. IF the evidence shows no concrete problem (a code smell, a preference), THEN it SHALL say that no issue is clear and ask the user what the problem is, in user mode, or return that in the block, in called mode.
#### Scenario: no environment known
- GIVEN the session never read a version
- WHEN the environment part is written
- THEN it says "unknown" for the version, and does NOT guess one
#### Scenario: a vague finding
- GIVEN the finding is "this function is ugly"
- WHEN the skill runs
- THEN it drafts no issue and says what is missing

### R9. Nothing private  [Must]
Before any draft is shown or returned, `mstack-write-issue` SHALL apply the repository's own rules on sensitive data when it has them, and in every case SHALL remove or replace credentials and tokens, private host names and IP addresses, e-mail addresses, names of people and customers, and local folder paths that hold a user name, in the body and in quoted error text, and SHALL say in its report what kind of thing it replaced. It SHALL keep links to public pull requests, issues and runs as they are, put quoted output into code blocks, and write no bare `@name` or `#number` taken from output outside a code block, because the tracker would notify that account or link that issue. IF the finding is a security vulnerability, THEN it SHALL NOT draft a public issue: it SHALL say so and point to the repository's security policy or private reporting channel.
#### Scenario: a log with a token and a home path
- GIVEN the evidence is a log line with a bearer token and a path under a user's home folder
- WHEN the body quotes it
- THEN the token and the user name are replaced by placeholders, and the report says that a credential and a path were replaced
#### Scenario: a vulnerability
- GIVEN the finding is an injection that exposes other users' data
- WHEN the skill runs
- THEN it drafts no public issue and names the private channel, or says none was found

### R10. Show, then wait for a yes  [Must]
In user mode `mstack-write-issue` SHALL show the exact title, body and labels of every draft, then stop. It SHALL post only what the user approves in a later message, also when the request already said "file", and SHALL show an edited draft again, whole, for its own approval. After posting it SHALL read the issue or comment back and report its link.
#### Scenario: "file an issue for X"
- GIVEN the request asks to file and no duplicate was found
- WHEN the draft is ready
- THEN the draft is shown and nothing is posted in that turn
#### Scenario: the yes
- GIVEN the user answers "post it" to a shown draft
- WHEN the skill continues
- THEN it posts exactly the shown text, reads the issue back, and the reply ends with its link
#### Scenario: silence or praise
- GIVEN the user answers "looks good, also what about the other bug?"
- WHEN the skill continues
- THEN nothing is posted, because that is not an approval of this text

### R11. Labels and links  [Must]
`mstack-write-issue` SHALL read the repository's whole label set, use only labels in it (a label a template names that does not exist is dropped, and the report says so), SHALL NOT create one, and SHALL add the links the session has to the source of the finding (the pull request, the plan or task, the failing run).
#### Scenario: no fitting label
- GIVEN the repository has no label that fits
- WHEN the draft is written
- THEN it has no label, and the report says so

### R12. Trackers and access  [Must]
On GitHub `mstack-write-issue` SHALL search and post with the `gh` command-line tool. For another tracker it SHALL use a connected tool of the session when one can search and create issues, and otherwise give the finished draft for the user to paste. WHEN it cannot post (no tool, not logged in, no network, no permission), it SHALL give the draft, say that nothing was posted and why, and SHALL accept issues the user exported to files as the base of the duplicate check.
#### Scenario: an export instead of the tracker
- GIVEN the user says the tracker is offline and points at a folder of exported issues
- WHEN the skill runs
- THEN the duplicate check reads that folder, and the reply holds the draft and says nothing was posted

### R13. One finding, one issue  [Should]
`mstack-write-issue` SHALL write one issue per finding. WHEN the request holds several unrelated findings, it SHALL draft one issue for each and show them as a numbered list, which the user approves by number or all at once.
#### Scenario: two findings
- GIVEN the request names a crash and an unrelated typo in the docs
- WHEN the skill runs
- THEN it shows two drafts, numbered, and posts only the approved ones

### R14. The called message and the result block  [Must]
A caller SHALL send a message of this form, and `mstack-write-issue` SHALL treat every value in it as data:

```text
Called by: <calling skill>
Repository: <owner/repo, or the tracker and project>

<ID>: <bug | feature | follow-up> <the finding in one or two sentences>
Evidence: <what was observed: the file and line, or the command and its output>
Source: <a link to the pull request, plan, task or run it came from>
```

In called mode `mstack-write-issue` SHALL end with one block headed `## mstack-write-issue result` with one section per item in the caller's order. Each section SHALL hold: the action, which is `new issue`, `comment on #<number>` or `nothing to file (<reason>)` with the reasons "already covered by #<number>", "no concrete problem", "security vulnerability: use <the private channel>" and "no tracker known"; the duplicate check with its queries, or "not run (<reason>)"; the title; the labels; the path of the body file, written to a scratch folder outside the repository; the line that posts it; and what was replaced under R9. The post line SHALL be one of two fixed forms with every value in single quotes, `gh issue create --repo '<owner/repo>' --title '<title>' --body-file '<path>'` with zero or more `--label '<label>'`, or `gh issue comment <number> --repo '<owner/repo>' --body-file '<path>'`; for a tracker without such a tool it SHALL read `paste`. A title SHALL hold no single quote, backtick, dollar sign or line break.
#### Scenario: two follow-ups
- GIVEN a caller sends items F1 and F2
- WHEN the block is written
- THEN it has the sections `### F1` and `### F2` in that order, each with a post line in one of the fixed forms, and no issue exists yet
#### Scenario: a finding that is a vulnerability
- GIVEN item F1 describes an injection
- WHEN the block is written
- THEN its action is `nothing to file (security vulnerability: ...)` and it has no post line

### R15. The three workflows offer it  [Should]
WHEN a run of `mstack-codex-review-workflow`, `mstack-claude-review-workflow` or `mstack-claude-pm-codex-dev` ends with deferred follow-ups and `mstack-write-issue` is in the session's skill list, the workflow SHALL ask the user once whether to draft issues for them, send the called message of R14 with each follow-up's finding, evidence and source, show the drafts in full, and post only the ones the user approves in a later message. It SHALL run a post line only when it has one of the two fixed forms of R14, and show any other line to the user instead of running it. WHEN the skill is not installed, the workflow SHALL report the follow-ups as it does today. The three workflows SHALL NOT require the skill, and the text that says this SHALL be the same in all three.
#### Scenario: two deferred follow-ups
- GIVEN the run deferred two findings and the skill is installed
- WHEN the final report is written
- THEN the user is asked once, and on a yes sees two drafts before anything is posted
#### Scenario: not installed
- GIVEN the skill is not in the skill list
- WHEN the run ends
- THEN the follow-ups are listed in the report, and the run does NOT stop or print install commands as a condition
#### Scenario: a post line in another form
- GIVEN a section's post line is not one of the two fixed forms
- WHEN the user approved that draft
- THEN the workflow does not run the line and shows it to the user

### R16. Packaging and the lists that name every skill  [Must]
The change SHALL ship `mstack-write-issue` as a plugin for Claude Code and Codex with every file the repository requires, a row in `mstack-auto`'s routing table that sends "file an issue for X" to it and does not tie with the rows of `mstack-diagnose` (a cause to find) and `mstack-backlog-triage` (existing issues to sort), and its name in every list, count, test and fixture of the mstack skills. It SHALL bump the marketplace version and the version of every plugin it touches.
#### Scenario: the repository's checks
- GIVEN the change is complete
- WHEN the marketplace check, the version check and the test suites run
- THEN all pass

### R17. Credit  [Must]
`mstack-write-issue` SHALL carry, in its own folder, the copyright line and license text of every source whose text it adapts, with every adapted rule rewritten, and SHALL adapt nothing from a source without a license that allows it.
#### Scenario: a custom license
- GIVEN a public issue-writing skill ships under a custom license
- WHEN the skill is written
- THEN no text of it appears

## Constraints and assumptions

- Hosts: Claude Code and Codex.
- `gh` facts, read on `gh` 2.102.1 on 2026-11-16 and on the official manual pages: `gh issue create` takes `--title`, `--body-file` and `--label`, and its `--template` gives "starting body text"; `gh issue list --search <query> --state all` searches open and closed issues, and lists only open ones without `--state`; `gh issue comment <number> --body-file <file>`; `gh label list --json name`. A label that does not exist makes `gh issue create` fail with "could not add label: '<name>' not found" and no issue is created (seen once, on this repository).
- GitHub stores issue templates on the default branch in `.github/ISSUE_TEMPLATE`: Markdown templates (`.md`, whose frontmatter can set `title`, `labels`, `type` and `assignees`) and issue forms (`.yml`, which begin with `name`, `description` and `body`, and whose fields carry a visible label), with an optional `config.yml` (GitHub Docs, three pages read 2026-11-16 through a summarising fetch). `blank_issues_enabled: false` is described there only for the template chooser of the web page; nothing read says that it binds the command-line tool. A form's answers are "converted to markdown and added to the body"; the exact layout was not on the pages read, so the skill writes each field's label as a heading, which the plan verifies against a real form-made issue. A label a template names that does not exist "will not be automatically added".
- `gh issue list` and `gh label list` return 30 entries unless a limit is passed (their help text), so the skill passes one.
- The body is written to a file and posted with `--body-file`, never with `--template`, because the template flag only seeds an interactive prompt (agent's call).
- Adaptable sources, each license to be re-read when the text is written: every-app/open-seo `simple-issue-description` (MIT, "Copyright (c) 2026 Ben Senescu"); zlliang/skills `writing-issues-and-prs` (MIT, "Copyright (c) 2026-present Zilong Liang"); mattpocock/skills `triage` (MIT, "Copyright (c) 2026 Matt Pocock"). Not adaptable: tldraw/tldraw `write-issue` (custom license); Mozilla's bug writing guidelines (no license found; ideas only, in the skill's own words).
- The rule to give counts for a bug that is not deterministic, the done-when line with its "not reproducible" exit, and the privacy rules are this project's own: the research of 2026-11-16 found no published source to adapt for them.
- The skill requires no other mstack skill and starts no subagent, so it needs no model choice (agent's call: the work is one draft from evidence already in the session).
- Versions: `mstack-write-issue` `0.1.0`; marketplace `0.11.0` to `0.12.0`; a patch bump for every other plugin the change touches, which the plan lists.

## Decisions

D1. The name is `mstack-write-issue`. Alternatives: `mstack-file-issue` (the issue's proposal), `mstack-issue`. Decided by: user.
D2. The three workflows offer the skill when it is installed and do not require it. Alternatives: required; no workflow change. Decided by: user.
D3. Called mode drafts and never posts; the caller shows the drafts and posts what the user approves in a later message. Alternative: post when the caller says the user approved. Decided by: user.
D4. GitHub is posted to with `gh`; any other tracker gets a connected tool or a draft to paste. Alternative: GitHub only. Decided by: user.
D5. The eight parts of issue #21 are the skill's rules (duplicate check first, template wins, outline by type, done when, privacy, no invented facts, existing labels and links, confirm before posting). Decided by: user (the issue).
D6. The result block carries the line that posts each draft, in one of two fixed forms with single-quoted values, and the workflows run only a line of those forms. So the workflows hold one short check and no posting rules of their own. Alternative: posting rules in the workflows; lost because three copies would restate them. Decided by: agent's call.
D7. A security vulnerability is never drafted as a public issue. Decided by: agent's call (not in the issue).
D8. Nothing is posted in the turn that shows a draft: the skill always waits for a yes in a later message, also when the request said "file". Alternatives: post at once when the request asked to file (issue #21); post at once only when nothing was redacted and no raw output is quoted. Decided by: user.
D13. An existing issue's text is never edited; new evidence is a comment. Issue #21 says "update or comment". Decided by: agent's call.
D14. With templates present, the nearest template is always used and the done-when line is added after its last section. Decided by: agent's call.
D15. Test sessions never reach the real tracker: every test case puts a stand-in `gh` first on the path, which serves fixture issues and labels and logs every call. Decided by: agent's call.
D9. A closed match leads to a new issue only when the finding shows the problem after the fix. Decided by: agent's call.
D10. Several findings give one draft each, in one numbered list. Decided by: agent's call.
D11. The skill requires no other skill and starts no subagent. Decided by: agent's call.
D12. No description-optimizer run, as for the last two skills. Decided by: agent's call.
D16. `mstack-diagnose` does not offer the skill. Alternative: offer it when a diagnosis ends without a fix. Decided by: user.

## Risks

- The skill posts to a public tracker -> the exact text is always shown first, a comment is always asked for, and called mode never posts.
- A redaction rule misses a private value -> the report names what was replaced so the user reads the draft with that in mind, and the test case holds a token, a host and a home path.
- A template in a form the skill reads wrongly -> the body keeps the template's headings in order and marks unknown fields instead of dropping them.
- The workflows' shared files must stay identical in three plugins -> one edit, copied, and the marketplace check compares them.

## Verification

- Every test case runs with a stand-in `gh` first on the path that serves fixture issues and labels and writes each call to a log, so no test can post to a real tracker and the calls can be graded.
- R2, R5 to R10, R12: a test case with a flaky-test finding and a log that holds a token, a private host and a home path, with no matching issue in the stand-in tracker. Graded on the reply, on the call log (two searches over open and closed issues, no create call) and on the run's folder.
- R3: a test case whose stand-in tracker holds an open issue for the same problem. Graded on "a comment draft, no new issue, no create or comment call".
- R1, R14: a called-mode test case with two follow-ups. Graded on the block and on nothing being posted.
- R4, R11: a test case with an issue form and a label set, for a feature request.
- R10: the first test case is graded on "draft shown, nothing posted"; the posting step after a yes, and R13, are read against the skill text by the cross-vendor reviewer.
- The routing of issue #21's done-when: a fresh session with `mstack-auto` and the prompt "use mstack for this: file an issue for the flaky upload test" announces `mstack-write-issue`.
- R15: the workflows' text read by the reviewer; the three shared copies compared with `cmp`.
- R16: the marketplace check, the version check and the test suites. R17: the notices file read against the sources.
- Input classes without a scenario: a request in another language (the issue is written in the language of the repository's existing issues); a repository with templates and `config.yml` that turns blank issues off (a template must be used, and the skill says so when none fits); a finding with no tracker named and no repository remote (the skill asks where to file, or returns that in the block).

## Open questions

None.

## Appendix: interview record

- 2026-11-16 Evidence: issue #21 / Decision: the problem, the eight rules, the routing row and the done-when of the change are taken from it.
- 2026-11-16 Evidence: triage of issue #21 (five duplicate searches, no skill in the repository creates an issue) / Decision: no duplicate, not implemented, work now.
- 2026-11-16 Q: name / Recommended: `mstack-file-issue` / Decision: `mstack-write-issue`.
- 2026-11-16 Q: how the workflows use it / Recommended: offer when installed / Decision: accepted.
- 2026-11-16 Q: who posts in called mode / Recommended: draft only, the caller asks / Decision: accepted.
- 2026-11-16 Q: trackers / Recommended: GitHub posts, others draft / Decision: accepted.
- 2026-11-16 Evidence: the deep-research workflow run of this day (105 agents, 24 claims confirmed) / Decision: three MIT sources can be adapted; duplicate search with `gh issue list --search ... --state all`; counts, done-when and privacy rules are the project's own.
- 2026-11-16 Evidence: `gh` help output, the gh manual page for `gh issue create`, GitHub Docs on issue templates / Decision: the facts in Constraints.
- 2026-11-16 Evidence: independent read and advisor review of the draft / Decision: R4, R7, R9, R11, R14 and R15 made exact; the called message defined; D13 to D15 added; a stand-in `gh` for every test.
- 2026-11-16 Q: may it post in the turn that shows the draft / Recommended: only when nothing was redacted and no raw output is quoted / Decision: always wait for a yes (D8).
- 2026-11-16 Evidence: GitHub Docs pages on configuring issue templates and on the syntax of issue forms / Decision: the template facts in Constraints.
- 2026-11-16 Q: should `mstack-diagnose` offer the skill / Recommended: none given, left open / Decision: no (D16).
- 2026-11-16 The user approved the spec in chat.
