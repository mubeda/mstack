# Add mstack-evidence and mstack-decisions, two skills for product people

Status: Approved 2026-11-12 (approved in chat by the user; clarified the same day after the independent read and on 2026-11-13 after the branch reviews; one of those clarifications narrows a user decision of the product skills and was approved in chat by the user on 2026-11-13, see Constraints)
Size: full    Mode: gated    Type: feature
Source: conversation 2026-11-12. Research: `reports/Evidence and decisions skills research.md` (local, not committed).

## Problem

A product plan written with `mstack-product-plan` may say "no evidence yet" for its problem, and nothing in mstack helps a product person turn the feedback they already have (support tickets, interview notes, survey answers) into evidence. Decisions made in meetings do not reach the product plan or its epics either, so those documents go stale. Existing skills cover the general jobs, but none checks its quotes against the source, writes for the product plan's format, or says what an existing plan has to change (research 2026-11-12). A 2026 study of meeting assistants counted 1,049 grounding failures: 27.3% confident rewording of vague wording, 16.9% unsupported numbers, 16.0% statements given to the wrong speaker, 13.4% tentative discussion reported as a decision.

## Goals

- A product person turns a folder of feedback into an evidence document whose every quote and count can be checked against the sources, and a product plan takes it as its problem and evidence without asking again.
- A product person turns meeting notes into a decisions document that keeps decisions apart from discussion, and sees which parts of a product plan or epic it changes.
- Neither skill sends feedback or transcripts to a second company.
- Both skills run as one self-contained folder in Claude Code, Codex CLI, the Claude desktop app and the ChatGPT desktop app.

## Non-goals

- Solutions or recommendations in an evidence document. Choosing a solution belongs to the product plan and to developers.
- Editing a product plan or an epic from `mstack-decisions`. One skill writes each document.
- Pulling feedback or transcripts from outside services. The user provides files or pasted text; a connected tool the session already has may be read when the user names it.
- Recording or transcribing a meeting.
- A review by another vendor's model, because the material is sensitive.
- Desktop packaging and a desktop test. Best effort, as for the two product skills.

Anti-goals:

- A quote that is not in the source, or that was polished.
- A count nobody can check, or a word such as "many" in place of a number.
- A suggestion reported as a decision, or a statement given to a guessed speaker.
- A report that shows only what supports one conclusion.

## Users and scenarios

1. As a product manager with a folder of support tickets and interview notes, I want the problems in them with counts and exact quotes, so that my product plan rests on evidence I can show.
2. As a product manager after a meeting, I want the decisions, the action items and the open points from my notes, so that everyone works from the same record.
3. As a product manager with an approved product plan, I want to see which parts a meeting's decisions change, so that I can bring the plan up to date.
4. As a developer writing a spec, I want the evidence and the decisions as sources, so that I do not ask the product person again.

## Requirements

"The document" is the evidence document or the decisions document. "The sources" are the files, folders or pasted text the user gives. "An item" is one unit of a source: one ticket, one survey answer, one interview note, one review. "A pointer" names the place of a passage: the file, and its row, line, item number or timestamp.

### Both skills

### R1. Loads on a fitting request  [Must]
WHEN a user asks to turn feedback into evidence, or to turn meeting notes into decisions, the host SHALL be able to load the fitting skill from a description of at most 200 characters that names those situations and does not summarize the skill's steps.
#### Scenario: feedback
- GIVEN both skills are installed
- WHEN the user writes "what do these support tickets tell us"
- THEN `mstack-evidence` loads
#### Scenario: a code review
- GIVEN the same session
- WHEN the user writes "process these review comments"
- THEN neither skill loads

### R2. Says what it read  [Must]
The skill SHALL list every source it read with the number of items in it, and every source it could not read or skipped, with the reason.
#### Scenario: one unreadable file
- GIVEN three files, one of them empty
- WHEN the document is written
- THEN it lists two sources with their item counts and the third as skipped because it is empty
#### Scenario: a large source
- GIVEN a source too large to read in full
- WHEN the document is written
- THEN it says how many items were read, how they were chosen, and how many were not read

### R3. Quotes are exact and point at their place  [Must]
The skill SHALL copy every quote character for character from a source, in the source's own language, and SHALL give its pointer.
#### Scenario: a quote
- GIVEN a ticket in row 14 that says "I had to ask three times for the same invoice"
- WHEN that passage is quoted
- THEN the document holds exactly that sentence and the pointer to the file and row 14
#### Scenario: a tempting cleanup
- GIVEN a ticket with a spelling mistake
- WHEN it is quoted
- THEN the mistake is kept, and a shortened quote marks the cut with "[...]"

### R4. Checked before it is shown  [Must]
WHEN the document is drafted, the skill SHALL check that every quote is in its source at its pointer and that every count equals the number of items listed for it, with the script in its folder WHERE the host can run it and otherwise by reading the sources again, and IF a check fails, THEN it SHALL correct or remove the passage before showing the document.
#### Scenario: an altered quote
- GIVEN a draft with a quote that differs from the source by one word
- WHEN the check runs
- THEN it reports that quote, and the shown document holds the source's wording
#### Scenario: no script possible
- GIVEN a host that cannot run a script
- WHEN the document is shown
- THEN its Review line says the check was done by reading, not by the script

### R5. Personal data becomes roles  [Must]
The skill SHALL replace the names, email addresses and phone numbers of customers and other people outside the user's own organization with roles in everything it writes, SHALL keep the names of the user's colleagues (speakers, deciders and owners of actions), and WHEN the user asks to keep them, it SHALL keep them.
#### Scenario: a ticket with a name
- GIVEN a quote that holds a customer's name and email address
- WHEN the document is written
- THEN the quote shows a role such as "[role: a finance contact]" in their place, and the rest of the quote is unchanged
#### Scenario: the user wants names
- GIVEN the user says to keep names
- WHEN the document is written
- THEN names are kept, and the document says so near its top

### R6. Reviewed without a second vendor  [Must]
The skill SHALL have the document reviewed by a fresh read of the same vendor's model before it asks for approval, SHALL NOT send the sources or the document to another vendor's model, and SHALL record in the Review line how it was checked and reviewed.
#### Scenario: Claude Code with a cross-vendor reviewer installed
- GIVEN the cross-vendor reviewer is installed
- WHEN the document is written
- THEN that reviewer is not called, and the Review line says same-vendor

### R7. Approval is an explicit yes  [Must]
The skill SHALL mark the document Approved only after the user's explicit yes to the written document, and WHEN an approved document is edited, the skill SHALL set it back to Draft.
#### Scenario: after the review
- GIVEN a checked and reviewed document
- WHEN the skill shows it
- THEN its Status line says Draft and the skill asks for approval
#### Scenario: silence
- GIVEN no answer to that question
- WHEN the session ends
- THEN the Status line still says Draft

### R8. Saved like the other product documents  [Must]
The skill SHALL open the document with the opening lines and header lines of the shared format, save it by that format's rules for places, vaults and hosts that cannot save, and tell the user the path.
#### Scenario: beside a product plan
- GIVEN a repository with a product plan folder and the user names that initiative
- WHEN an evidence document is written
- THEN it is saved in that initiative's folder, and the path is shown
#### Scenario: an existing file
- GIVEN a file already exists at the path
- WHEN the skill is about to write
- THEN it shows what is there and writes nothing until the user says yes

### R9. Works alone and sends nothing out  [Must]
The skill SHALL work with no other skill installed, and SHALL NOT commit, push, post to any service or install anything.
#### Scenario: nothing else installed
- GIVEN a host with only this skill
- WHEN the user gives it sources
- THEN the run reaches the approval question, and nothing told the user to install something first

### R10. The user's language, the source's words  [Must]
The skill SHALL write the document in the language the user writes in, keep the fixed headings in English, and never translate a quote; WHERE a quote is in another language, it MAY add a translation after it, marked as a translation.
#### Scenario: German tickets, English user
- GIVEN tickets in German and a user who writes in English
- WHEN the document is written
- THEN each quote is in German, and any English version beside it is marked "translation"

### The evidence document

### R11. Problems, not solutions  [Must]
`mstack-evidence` SHALL describe problems only, and WHEN a source asks for a specific feature or fix, it SHALL record that under what people asked for, in their words, and SHALL NOT recommend a solution.
#### Scenario: a feature request
- GIVEN five tickets that ask for a "download all" button
- WHEN the document is written
- THEN the problem is stated as what those people could not do, and "download all" appears under what they asked for

### R12. What each problem carries  [Must]
`mstack-evidence` SHALL give each problem one sentence, who has it, its count, the list of the items behind that count, at most three quotes, and its strength with a reason.
#### Scenario: a problem
- GIVEN twelve items about missing invoices
- WHEN the document is written
- THEN that problem shows the number 12, twelve pointers, at most three quotes, and a strength with a reason in words
#### Scenario: one item
- GIVEN a problem only one item mentions
- WHEN the document is written
- THEN it shows the number 1 and the strength weak

### R13. Real numbers  [Must]
`mstack-evidence` SHALL state every quantity as a number of items, and of distinct people or customers WHERE the source tells them apart, and SHALL NOT use a quantity word in place of a number.
#### Scenario: repeated complaints from one customer
- GIVEN six tickets about one problem, four of them from the same customer
- WHEN the document is written
- THEN it says 6 items from 3 customers
#### Scenario: no customer field
- GIVEN a source that does not say who wrote each item
- WHEN the document is written
- THEN it gives the number of items and says that distinct people cannot be told apart

### R14. Strength by a written rule  [Must]
`mstack-evidence` SHALL rate each problem strong, medium or weak by the rule in its method file, which rests on the number of distinct people and the number of kinds of source, and SHALL state the facts that gave the rating.
#### Scenario: two kinds of source
- GIVEN a problem in 9 tickets from 7 customers and in 2 interviews
- WHEN it is rated
- THEN it is strong, and the reason names 7 customers and two kinds of source
#### Scenario: one loud customer
- GIVEN a problem in 8 tickets, all from one customer
- WHEN it is rated
- THEN it is weak, and the reason says one customer

### R15. Notes per item, then counts  [Must]
`mstack-evidence` SHALL note for every item which problems it mentions before it counts, and SHALL list the items that fit no problem as not grouped, with their number.
#### Scenario: items that fit nothing
- GIVEN 40 items of which 5 mention none of the problems
- WHEN the document is written
- THEN it says 5 items were not grouped and what they were about, and every one of the 40 items is listed under at least one problem or under not grouped
#### Scenario: one item, two problems
- GIVEN an item that mentions two problems
- WHEN it is counted
- THEN it is listed under both, and the document says items can count for more than one problem

### R16. What the evidence cannot show  [Must]
`mstack-evidence` SHALL include the voices that contradict a problem, the limits of the sample, and what it looked for and did not find.
#### Scenario: a contradiction
- GIVEN ten items that call the invoice page confusing and two that call it clear
- WHEN the document is written
- THEN the two appear under that problem as contradicting voices, with quotes
#### Scenario: tickets only
- GIVEN support tickets as the only source
- WHEN the document is written
- THEN it says the sample holds only people who wrote to support

### The decisions document

### R17. Only what was decided is a decision  [Must]
`mstack-decisions` SHALL list as a decision only what the notes show was decided, with the decision, who decided, the reason, the options that were set aside WHERE the notes name them, and a pointer.
#### Scenario: a clear decision
- GIVEN notes in which the product lead says "we go with option B, the export waits"
- WHEN the document is written
- THEN one decision names option B, the product lead as the decider, and the pointer
#### Scenario: no reason given
- GIVEN a decision with no stated reason
- WHEN the document is written
- THEN its reason reads "not stated in the notes"

### R18. Tentative talk is not a decision  [Must]
WHEN the notes show a suggestion, an agreement nobody confirmed, or a topic that was only discussed, `mstack-decisions` SHALL list it under what seems decided and needs confirmation, or under open points, and SHALL NOT list it as a decision.
#### Scenario: nobody objected
- GIVEN someone says "maybe we should drop the mobile view" and nobody answers
- WHEN the document is written
- THEN that line is under what seems decided and needs confirmation, with a question for the user
#### Scenario: discussed, not closed
- GIVEN ten minutes on pricing with no conclusion
- WHEN the document is written
- THEN pricing is an open point

### R19. Action items as they were given  [Must]
`mstack-decisions` SHALL list each action item with its one owner and its date as the notes give them, SHALL keep the names of owners, and IF the notes give no owner or no date, THEN it SHALL write "no owner named" or "no date" and SHALL NOT fill one in.
#### Scenario: no date
- GIVEN "Sam will check the invoice export" with no date
- WHEN the document is written
- THEN the action item names Sam and reads "no date"
#### Scenario: two people
- GIVEN an action two people took together
- WHEN the document is written
- THEN it names both as the notes do, and asks the user which one owns it

### R20. Nobody is guessed  [Must]
IF the notes do not show who said or decided something, THEN `mstack-decisions` SHALL write "speaker unclear" and SHALL NOT name a person.
#### Scenario: an unattributed line
- GIVEN a transcript line with no speaker label that says "fine, we ship in March"
- WHEN the document is written
- THEN it is listed with "speaker unclear" under what seems decided and needs confirmation

### R21. No number or agreement the notes do not hold  [Must]
`mstack-decisions` SHALL state a number, a date, or that everyone agreed only WHERE the notes say so.
#### Scenario: silence is not agreement
- GIVEN one person proposes a date and no one else speaks
- WHEN the document is written
- THEN it does not say the team agreed

### R22. Changes other documents need  [Must]
WHEN the user names a product plan or an epic, `mstack-decisions` SHALL list for each decision the part of that document it changes, what the part says now and what the decision implies, and SHALL NOT edit that document.
#### Scenario: a scope decision
- GIVEN an approved product plan whose invoices epic includes export, and a decision that export waits
- WHEN the document is written
- THEN it names that epic's in-and-out line, what it says now, and that export moves out, and the product plan file is byte-for-byte unchanged
#### Scenario: no document named
- GIVEN no product plan or epic was named
- WHEN the document is written
- THEN that part reads "None, no document was named"

### The skills that read them

### R23. Evidence fills the problem  [Must]
WHEN an Approved evidence document is a source of `mstack-product-plan` or `mstack-epic`, that skill SHALL take the problem and its evidence from it, with the counts and at most one quote per problem and a pointer to the evidence document, and SHALL NOT ask for the evidence again; a Draft evidence document SHALL be context only.
#### Scenario: an approved evidence document
- GIVEN an Approved evidence document with three problems
- WHEN a product plan is written from it
- THEN "Problem and evidence" names those problems with their counts and points at the evidence document, and no question asked what the evidence is
#### Scenario: no evidence at all
- GIVEN the user has no evidence
- WHEN the product plan is written
- THEN the evidence line reads "no evidence yet", and the skill said once that `mstack-evidence` can build it from feedback

### R24. Decisions are settled  [Must]
WHEN an Approved decisions document is a source of `mstack-product-plan`, `mstack-epic` or `mstack-write-specs`, that skill SHALL treat its decisions as settled, and SHALL add what seems decided and its open points to the open items of the interview.
#### Scenario: a decision already made
- GIVEN an Approved decisions document that says export waits
- WHEN an epic is detailed from it
- THEN no question asks whether export is in scope, and the epic's Source line names the decisions document
#### Scenario: a Draft decisions document
- GIVEN a decisions document whose Status says Draft
- WHEN it is given as a source
- THEN the skill says it is not approved and treats nothing in it as settled

### R25. The spec skill reads evidence  [Should]
WHEN an Approved evidence document is a source of `mstack-write-specs`, `mstack-write-specs` SHALL use it for the spec's Problem part and SHALL cite it.
#### Scenario: a spec from an epic and evidence
- GIVEN an Approved epic and an Approved evidence document
- WHEN the spec is drafted
- THEN its Problem part states a count from the evidence document and names that document

### R26. Background for two more skills  [Should]
`mstack-brainstorm` SHALL read an evidence document the user points at before its first message, and `mstack-chief-of-staff` SHALL route "a meeting happened" to `mstack-decisions`.
#### Scenario: a brainstorm with evidence
- GIVEN an evidence document the user names
- WHEN the brainstorm starts
- THEN its first message says what the evidence shows and does not ask what the document answers

### Packaging

### R27. One self-contained folder per skill  [Must]
Each new skill folder SHALL hold everything the skill uses, including its check script, name host tools only in a host table in its `SKILL.md` with a column for each of the four hosts, and contain no model name.
#### Scenario: installed alone
- GIVEN only the `mstack-decisions` folder is copied to a host
- WHEN the skill runs
- THEN no step fails for a missing file

### R28. A thin shared contract  [Must]
The existing shared format file `product-format.md` SHALL gain one part that describes, for the evidence document and the decisions document, only their opening lines, their header lines, the names of their top-level parts and when a reader may treat one as settled; the file SHALL ship as identical copies in `mstack-product-plan`, `mstack-epic`, `mstack-write-specs`, `mstack-evidence` and `mstack-decisions`, and the repository's marketplace check SHALL fail when a copy differs or is missing.
#### Scenario: one copy edited
- GIVEN the format file is changed in `mstack-evidence` only
- WHEN the marketplace check runs
- THEN it fails and names the file and the skill

### R29. The check script is tested  [Must]
Each check script SHALL exit non-zero and name the passage WHEN a quote is not found at its pointer or a count differs from its listed items, and SHALL have tests that show both outcomes.
#### Scenario: a wrong count
- GIVEN a document that says 12 and lists 11 pointers
- WHEN the script runs
- THEN it exits non-zero and names that problem

### R30. Packaged like the other plugins  [Must]
Each new skill SHALL ship as its own plugin for Claude Code and Codex, with both manifests, both registry entries, a copy of the license, a notices file that credits every adapted source, and eval cases.
#### Scenario: the checks
- GIVEN the finished branch
- WHEN the version check and the marketplace check run
- THEN both pass, with 19 Claude plugins and 18 Codex plugins

### R31. The rest of the repository stays true  [Must]
The change SHALL update every place that lists the mstack skills or states a rule this work changes: the README (table, install lists, how the skills fit together, the desktop section, Credits), `AGENTS.md` (the two new skills join the exception for built-in steps and the shared format file), `mstack-setup`, `mstack-find-skills`, `mstack-skill-creator` and `mstack-chief-of-staff`.
#### Scenario: the sweep
- GIVEN the finished branch
- WHEN the repository is searched for each place that names `mstack-epic` in a list of skills
- THEN each such list also names the two new skills, or the report says why not

## Success metrics

- Metric: quotes that match their source. Target: every quote in the eval runs. Measured by: the check script on each run's document. Checked: before the merge.
- Metric: tentative discussion reported as a decision. Target: none in the eval runs. Measured by: the eval's grader. Checked: before the merge.

## Constraints and assumptions

- The four hosts, the 200-character descriptions, the header lines (`Status:`, `Review:`, `Source:`), the Status forms, the rules for places, Obsidian vaults and hosts that cannot save, and the reviewer-free fallback all come from the two product skills and their shared format file as merged on 2026-11-12. This spec adds the opening lines `# Evidence: <title>` and `# Decisions: <title>`.
- The repository's skill check rejects a host command outside a table row; these skills have no reviewer command at all.
- Scripts run on Node, which the repository already requires. In the Claude desktop app a skill needs code execution switched on; where no script can run, R4's second path applies.
- The top-level parts the shared file names, so readers can find them (agent's call): for evidence `## Sources`, `## Problems`, `## Not grouped` and `## What this evidence cannot show`; for decisions `## Decisions`, `## Seems decided, please confirm`, `## Open points`, `## Action items` and `## Changes other documents need`. The layout inside each part lives only in that skill's own format file.
- What the check scripts read (agent's call; the plan holds the full grammar): a quote is one line of the form `> "<quote>" @ <file> :: <locator>`, where the locator is a row, a line, an item number or a timestamp; a count is a line `- Count: <n> items` followed by a line `- Items:` with that many pointers. The evidence script checks quotes and counts. The decisions document has no counts: each decision and each line under "seems decided" carries one exact quote as its pointer, and its script checks those quotes. Removed personal data is written `[role: <role>]` and stands for at most 80 characters of the source; a cut is written `[...]`; the text outside these gaps must match exactly and be at least 20 characters long. A problem that has no text to quote (ratings only) says so in place of a quote.
- Review (agent's call): the two new skills do not ship `product-review.md`, because it puts the cross-vendor reviewer first. Each has a short review part in its own method file: a fresh read by the host's subagent tool where there is one, otherwise the skill's own second read against the checklist. Their host tables have rows for the question tool, the subagent tool, running a script and saving a file, and no reviewer command.
- Added after the branch review and the comparison test, 2026-11-13 (agent's calls; no user decision changed):
  - In an evidence document, what people asked for and each contradicting voice (R11, R16) are quote lines, so the script checks them. The three quotes of R12 and D8 are the problem's own quotes; a contradicting voice carries its quote in addition.
  - Every item of every source has one home in an evidence document: under a problem, or under Not grouped. One item may count for two different problems (R15); a complaint and the fix it asks for are one problem, not two with the same items.
  - A decisions document says which notes it read, how much of them, and what it skipped, as R2 asks.
  - When two Approved sources disagree, the later decision wins: a decision made after a product plan or an epic was approved overrides what it changes there, and the reading skill writes the difference down and does not ask again (R24). A reader takes each decision in its own words and adds no date or scope the decision does not state.
  - What customers asked for stays what customers asked for when a product plan or an epic is written from evidence (R23); it is never recorded as an idea of the team.
  - A product plan or an epic that has an evidence document or a decisions document among its sources is reviewed by a same-vendor fresh read, never by the cross-vendor reviewer, and its Review line says why; so is an epic whose product plan rests on one. This applies D13 to the readers and narrows a user decision: the cross-vendor review the user chose for every product plan and epic (D4 of the product skills' spec) no longer runs in this case. Decided by: user, 2026-11-13.
  - The check scripts: an empty record of a CSV file still counts as a row; a file reached under two spellings is one file; quote and count lines above the first part are checked; a fenced block is ignored; a time with 60 or more minutes or seconds, or with one square bracket, is not a locator; matching needs no backtracking, so a crafted quote cannot stall the check; a quote sits inside one CSV field; a file is counted by one kind of locator; any line that starts with `>` and is not a quote line fails; a part that says None holds nothing else; a pointer to a folder fails. `check-decisions.mjs` needs exactly one non-empty owner line and one date line per action item.
- Places and names (agent's call): beside a product plan, `evidence.md` and `decisions/<yyyy-mm-dd>-<slug>.md` in that initiative's folder; with no product plan, `docs/product/evidence/<yyyy-mm-dd>-<slug>.md` and `docs/product/decisions/<yyyy-mm-dd>-<slug>.md`; one decisions document per meeting. In a vault the properties are `type` (evidence or decisions), `status`, and for decisions `date`.
- The two new skills have no interview file. They ask at most three things: which sources, whether to keep names, and for `mstack-decisions` which product plan or epic to compare with. They use no helper skill, so they need no built-in versions; `AGENTS.md` names them with the two product skills as skills that require no other skill.
- The strength rule (agent's call, to be written into the method file): strong needs at least two kinds of source and at least five distinct people; weak is one person, or one kind of source with fewer than three distinct people, or distinct people that cannot be told apart with fewer than five items; everything else is medium. A source that does not tell people apart can never be rated strong on its own, on purpose: repeated items may come from one person. These thresholds are conventions, and the document always shows the facts beside the rating.
- Research, 2026-11-12: the counting rule and its pitfalls (verbal counting in place of numbers), the two-step method (notes per item, then counts), the decision fields (decision, who decided, reason, options set aside), and the separation of the decider from people who give input come from published methods, used as ideas in this project's words. The meeting failure figures come from one 2026 preprint with three models of one vendor.
- The research found nothing verified on privacy, on model errors in feedback synthesis, or on whether a script check measurably helps. R4, R5 and the "one owner, a date" form of R19 are design choices, not research results.
- Licenses read 2026-11-12: Anthropic `synthesize-research` in `anthropics/knowledge-work-plugins`, Apache-2.0, may be adapted with credit; pstack in `cursor/plugins`, MIT, may be adapted with credit (its confidence levels, exact quotes with their place, kept contradictions, named gaps, a number explained by what it rests on, and its append-only decision log). `deanpeters/Product-Manager-Skills` is CC BY-NC-SA 4.0 and the license of `github/awesome-copilot` was not checked, so no text is taken from either.
- `AGENTS.md`: no personal or company data; fixtures use invented people and companies; model names only in `mstack-best-model-for`.
- Versions: `mstack-evidence` 0.1.0 and `mstack-decisions` 0.1.0; marketplace 0.8.0 to 0.9.0; `mstack-product-plan` 0.1.0 to 0.1.1; `mstack-epic` 0.1.0 to 0.1.1; `mstack-write-specs` 0.4.0 to 0.4.1; `mstack-brainstorm` 0.1.3 to 0.1.4; `mstack-chief-of-staff` 0.1.3 to 0.1.4; `mstack-setup` 0.2.5 to 0.2.6; `mstack-find-skills` 0.2.4 to 0.2.5; `mstack-skill-creator` 0.3.4 to 0.3.5.
- The spec has 31 requirements, above the usual 25. It is not split, because the two skills share ten of them and ship in one pull request. (agent's call)

## Decisions

D1. Two skills, `mstack-evidence` and `mstack-decisions`, as plugins. Decided by: user. Source: round 1.
D2. For product people, on the four hosts of the product skills, with no required skill and descriptions within 200 characters. Decided by: user. Source: round 1.
D3. Quotes are exact, carry their place, and are checked before the result is shown. Decided by: user. Source: round 1.
D4. Names, email addresses and phone numbers become roles by default. Decided by: user. Source: round 1.
D5. `mstack-decisions` lists the changes other documents need and never edits them. Alternative: apply the changes, which makes two writers of one file. Decided by: user. Source: round 1.
D6. The six places where other skills use the two documents. Decided by: user. Source: round 1.
D7. The evidence document holds problems only. Decided by: user. Source: round 2.
D8. Each problem carries one sentence, who has it, a count with its items, up to three quotes and a strength with a reason. Decided by: user. Source: round 2.
D9. The evidence document says what it cannot show. Decided by: user. Source: round 2.
D10. A script checks quotes and counts where the host can run one. Alternative: the model checks itself, which can misread. Decided by: user. Source: round 2.
D11. Only what was clearly decided is a decision. Decided by: user. Source: round 2.
D12. Owners of actions keep their names; customers and outsiders become roles. Decided by: user. Source: round 2.
D13. No review by another vendor's model. Alternative: the review the product skills use, which would send feedback and transcripts to a second company. Decided by: user. Source: round 2.
D14. A thin shared contract in the shared format file, shipped in five skills. Alternatives: both formats in full in the shared file; no shared contract. Decided by: user. Source: approaches message.
D15. Notes per item first, then counts. Decided by: agent's call, confirmed by the user in the playback. Source: research.
D16. "Speaker unclear" is written, never guessed. Decided by: agent's call, confirmed in the playback. Source: research (16.0% of measured failures).
D17. The fields of a decision and of an action item. Decided by: agent's call, confirmed in the playback.
D18. The same header lines and Status forms as the product plan. Decided by: agent's call, confirmed in the playback.
D19. Strength by a written rule with thresholds. Decided by: agent's call, confirmed in the playback; the thresholds are in Constraints.
D20. Credit to Anthropic's `synthesize-research` and to pstack only. Decided by: agent's call, confirmed in the playback.
D21. `mstack-brainstorm` and `mstack-chief-of-staff` get one sentence each and no copy of the shared file. Decided by: agent's call, shown with the approaches.
D22. One check script per skill, for Node, and one method file per skill. Decided by: agent's call, shown with the approaches.
D23. A quote is never translated; a translation may follow it, marked as one. Decided by: agent's call. Source: D3.
D24. A placeholder role replaces personal data inside a quote in square brackets, and the check script treats a bracketed role as matching the text it replaced. Decided by: agent's call. Source: D3 and D4 together.
D25. The product plan's "Problem and evidence" part summarizes an evidence document and points at it; it does not copy it. Decided by: agent's call.

## Risks

- The script cannot match a quote whose personal data was replaced -> bracketed roles are wildcards in the check (D24), and a test covers it.
- A source format the script cannot parse (a spreadsheet, a PDF) -> the pointer falls back to the file and a line of its text form, and R4's reading path applies with a note in the Review line.
- A same-vendor read misses more than a cross-vendor one -> the script covers what can be checked mechanically, and the Review line says which checks ran.
- Five copies of the shared file -> the existing copy check is extended (R28).
- The desktop apps may not run scripts or save files -> R4's second path and the shared format's printing rule; untested, and the README says so.

## Verification

- R1 to R3, R5, R7 to R22: eval cases built with `mstack-skill-creator`, with and without the skill. Evidence fixture: a file of about 40 support tickets and two interview notes, with a planted contradiction, a problem from one customer only, a name and an email address in a quote, and five items that fit no problem. Decisions fixture: a transcript with one clear decision, one suggestion nobody answered, one line with no speaker label, one action item without a date, and an approved product plan the decision changes.
- R4, R29: unit tests of each script (a matching document passes; an altered quote, a wrong count and a missing pointer each fail and are named; a bracketed role matches), and an eval grader that runs the script on the run's document.
- R6: an eval grader on the Review line and on the absence of any call to another vendor's tool.
- R23 to R26: eval cases for `mstack-product-plan`, `mstack-epic` and `mstack-write-specs` with an Approved and a Draft document as sources; R26 by reading the two skill texts.
- Checked by tests and eval graders, not by the check scripts: distinct people (R13), the strength rating (R14), the notices (R30) and the sweep (R31).
- R27: the skill creator's static check and private-data scan on both folders.
- R28, R30: `node scripts/check-marketplace.mjs` and `node scripts/check-version-bumps.mjs`, plus the mutation of one copy.
- R31: the outside-the-diff sweep of `AGENTS.md`, reported file by file.
- Not covered by any scenario: sources in several languages at once (expected: each quote in its own language); feedback with no text, such as ratings only (expected: counted, with no quotes, and said so); two meetings in one file (expected: one decisions document per meeting, after asking).

## Open questions

- Do the desktop apps run the check script and save files? Owner: the user, by an upload test. Can wait because: R4 and the shared format cover both outcomes.
- May text of `github/awesome-copilot`'s `meeting-minutes` be adapted? Owner: engineering, by reading its license. Can wait because: the design uses none of its text.

## Appendix: interview record

- 2026-11-12 Q: names `mstack-evidence` and `mstack-decisions` / Recommended: yes / Decision: accepted (D1).
- 2026-11-12 Q: same audience and hosts as the product skills / Recommended: yes / Decision: accepted (D2).
- 2026-11-12 Q: exact quotes with their place, checked / Recommended: yes / Decision: accepted (D3).
- 2026-11-12 Q: personal data becomes roles by default / Recommended: yes / Decision: accepted (D4).
- 2026-11-12 Q: `mstack-decisions` never edits other documents / Recommended: yes / Decision: accepted (D5).
- 2026-11-12 Q: the six places where other skills use the documents / Recommended: yes / Decision: accepted (D6).
- 2026-11-12 Q: problems only / Recommended: yes / Decision: accepted (D7).
- 2026-11-12 Q: the five things each problem carries / Recommended: yes / Decision: accepted (D8).
- 2026-11-12 Q: the document says what it cannot show / Recommended: yes / Decision: accepted (D9).
- 2026-11-12 Q: a script checks quotes and counts / Recommended: yes / Decision: accepted (D10).
- 2026-11-12 Q: only clear decisions count / Recommended: yes / Decision: accepted (D11).
- 2026-11-12 Q: owners keep names, outsiders become roles / Recommended: yes / Decision: accepted (D12).
- 2026-11-12 Q: no review by another vendor / Recommended: yes / Decision: accepted (D13).
- 2026-11-12 Q: the playback with seven agent's calls / Recommended: confirm / Decision: confirmed (D15 to D20, and the test tasks in Verification).
- 2026-11-12 Q: how the skills share their contract / Recommended: a thin shared contract / Decision: accepted (D14).
- 2026-11-12 Evidence: a survey of pstack's files, by a lookup / Decision: the rules named in Constraints may be adapted with credit; pstack has nothing on feedback or meetings as such.
- 2026-11-12 Evidence: the research report / Decision: prior art, the method rules and the failure figures in Problem and Constraints.
- 2026-11-12 Evidence: `.claude-plugin/marketplace.json` on main after pull request 18 / Decision: the versions in Constraints.
