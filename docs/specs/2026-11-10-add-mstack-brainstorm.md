# Add mstack-brainstorm, a skill that turns an unformed idea into an approved design brief

Status: Approved 2026-11-12 (approved in chat by the user; edited that day: copyright names moved to the notices file only)
Size: full    Mode: gated    Type: feature
Source: conversation 2026-11-10. The user asked for a brainstorming skill built on the superpowers `brainstorming` skill, combined with other brainstorming skills found through `mstack-find-skills` and with whatever pstack offers that is licensed and fits.

## Problem

The mstack chain starts at `mstack-write-specs`, which assumes the user already knows what they want: its interview settles decisions, it does not help someone work out the goal. A user with an unformed idea has no mstack entry point. The closest installed skill, superpowers `brainstorming` 7.0.2, hands off to its own planning skill and no other, commits its design document, and ships a browser companion that runs a local server (its SKILL.md, read 2026-11-10), so its result does not flow into an mstack spec and it breaks this repository's rule that nothing is committed without a request.

## Goals

1. A user who starts with an unformed idea ends with a written design brief they approved, and no product code was written on the way.
2. A user who asks for ideas gets a set of ideas generated before any of them is judged, and leaves with a short list and a next step for each.
3. An approved brief goes into `mstack-write-specs` without the user answering the same decision twice.
4. The skill behaves the same in Claude Code and Codex from one skill folder.

## Non-goals

- A browser visual companion. It is a local server with scripts, the largest and riskiest part to port to two hosts; text sketches and an offered throwaway prototype replace it in this version.
- A multi-role design review (skeptic, user advocate and similar) or a cross-vendor review of the brief. The one public source for it has unclear authorship, and the builder check already gives the brief a fresh reader.
- OpenCode and Cursor support. The skills this one calls run in Claude Code and Codex only.
- Writing the spec or the plan. `mstack-write-specs` and `mstack-plan` do that.
- Committing the brief, or installing anything. The repository's rules leave both to the user.
- Text from sources without a license file or with unclear authorship. The repository's rules forbid it.

Anti-goals, which count as failure even when everything runs:

- Product code, scaffolding or a dependency install before the user approved the written brief.
- An interview forced on a user whose request was already decided.
- A menu of options offered before the user has described what they want in their own words.
- A brief that presents a default the agent filled in as something the user decided.
- A list of ideas with no next step.

## Users and scenarios

1. As a developer with a rough feature idea in an existing repository, I want the agent to find out what I want and why before anything is built, so that the hundred decisions I never mention are made the way I would have made them.
2. As someone who asks "give me ideas for X", I want many ideas before any judging, so that the first plausible idea does not win by default.
3. As a user of the mstack chain, I want the approved brief to feed the spec, so that I am not interviewed twice.
4. As a user with a decided, small request, I want the skill to get out of the way, so that a one-line change does not cost a conversation.
5. As a Codex user, I want the same behavior as in Claude Code, so that I do not learn two skills.
6. As someone planning something that is not software (a talk, a renovation), I want the same conversation, so that the skill is useful outside a repository.

## Requirements

Terms used below. The **brainstorm skill** is the new skill. The **brief** is the design brief it writes. The **default mode** works out what the user wants and why, then how. The **ideas mode** generates ideas first and chooses afterwards. The **builder check** is a read of the brief by a fresh reader who has to plan from it. An **agent's call** is a choice the agent made that the user did not.

### R1. When the conversation starts  [Must]
WHEN the user asks to brainstorm, or brings a request whose goal or reason is not stated, the brainstorm skill SHALL start a conversation about what the user wants before any building.
#### Scenario: unformed idea
- GIVEN a repository and the request "add notifications to the app"
- WHEN the brainstorm skill runs
- THEN its first message contains a question about what the user wants, and no file of the repository has changed

### R2. Decided requests pass through  [Must]
IF the request already states everything needed to do it, THEN the brainstorm skill SHALL ask no interview question and SHALL say that no brainstorm is needed.
#### Scenario: one-line change
- GIVEN the request "make the save button label say Save changes"
- WHEN the brainstorm skill runs
- THEN it says that no brainstorm is needed and goes on with the request through the normal workflow, and it does NOT ask what the user wants or why

### R3. Reading before asking  [Must]
WHEN the session has a repository or material the user pointed at, the brainstorm skill SHALL read the referenced material and what it connects to before its first question, and SHALL ask nothing that this material answers.
#### Scenario: the repository answers it
- GIVEN a repository whose instructions name its language and test command
- WHEN the brainstorm skill prepares its first message
- THEN the message states what it found about the relevant parts, and it does NOT ask which language or test command the project uses

### R4. The first message  [Must]
WHEN the conversation starts, the brainstorm skill SHALL send one message that restates the request in its own words, says what it found that bears on it, and ends with exactly one question together with what the answer would change.
#### Scenario: not asked for by name
- GIVEN the user brought an unformed idea without asking to brainstorm
- WHEN the first message is sent
- THEN it also carries a one-line offer to skip the conversation and just start
#### Scenario: no questionnaire
- GIVEN any unformed idea
- WHEN the first message is sent
- THEN it does NOT contain a list of several questions and does NOT explain the skill's process

### R5. Open questions one at a time  [Must]
WHILE the user's reason for wanting the thing is unknown, the brainstorm skill SHALL ask one open question per message, without example answers or options attached.
#### Scenario: why is unknown
- GIVEN the user has not said why they want the feature
- WHEN the brainstorm skill asks its next question
- THEN the message holds one question, and it does NOT list options to choose from

### R6. Numbered rounds for named choices  [Must]
WHEN the reason is known and the open decisions have nameable choices, the brainstorm skill SHALL ask them in a numbered round in which every question carries a recommendation that a plain yes accepts.
#### Scenario: three named decisions
- GIVEN the reason is known and three independent decisions are open
- WHEN the brainstorm skill asks
- THEN one message numbers the three questions, each with a recommendation and its reason
#### Scenario: dependent question
- GIVEN a decision that depends on another open decision
- WHEN the round is written
- THEN the dependent question is NOT in that round

### R7. Playing back  [Should]
WHEN the brainstorm skill understands one part of the subject well enough to describe it, it SHALL describe that part back in 300 words or fewer, mark what it filled in as its own proposal, and ask what is wrong or missing.
#### Scenario: a filled-in default
- GIVEN the agent assumed email as the notification channel
- WHEN it plays the part back
- THEN the channel appears as the agent's proposal with its reason, and NOT as something the user said

### R8. Approaches before the brief  [Must]
WHEN the brainstorm skill understands what the user wants, it SHALL lay out two or three approaches that differ in their whole shape, in a message of their own, each with what it trades off, recommend one, and wait for the user's pick before writing the brief.
#### Scenario: a real choice exists
- GIVEN a feature that could live in three structurally different places
- WHEN the approaches message is sent
- THEN it holds two or three approaches, a recommendation with its reason, and a question asking which way to go
#### Scenario: one sensible way
- GIVEN the existing work rules out every alternative but one
- WHEN the approaches message is sent
- THEN it says there is one sensible way and why the others do not fit, and it does NOT invent variants of one shape to reach a count
#### Scenario: brief before the pick
- GIVEN the user has not picked an approach and has not handed the choice over
- WHEN the brainstorm skill would write the brief
- THEN no brief file exists

### R9. Usage first for things that are called  [Should]
WHERE the subject is something other code or people call (a library, an interface, a command), the brainstorm skill SHALL show for each approach how a caller would use it.
#### Scenario: a command-line tool
- GIVEN an idea for a new command
- WHEN the approaches are laid out
- THEN each approach shows the command line a user would type and what they would see

### R10. Entering ideas mode  [Must]
WHEN the user asks for ideas or options instead of bringing an idea of their own, the brainstorm skill SHALL generate the ideas itself before any choosing, and SHALL prompt the user to generate them instead only when the user asks for that.
#### Scenario: default stance
- GIVEN the request "give me ideas for onboarding new users"
- WHEN ideas mode starts
- THEN the brainstorm skill's message contains ideas, and it does NOT ask the user to produce the ideas

### R11. Generating apart from judging  [Must]
WHILE ideas are being generated, the brainstorm skill SHALL NOT rank, score or discard any idea, and SHALL draw on at least two different ways of generating ideas.
#### Scenario: no early winner
- GIVEN ideas mode has produced its first set of ideas
- WHEN the message is sent
- THEN it holds no ranking and no recommendation, and the ideas are not all variants of one idea

### R12. Ending ideas mode  [Must]
WHEN the user is ready to choose, the brainstorm skill SHALL present a short list in which each idea carries its biggest unknown and the cheapest way to settle it, list the ideas set aside, ask for a pick, and continue in the default mode with the picked idea.
#### Scenario: the pick
- GIVEN a short list was shown and the user picked one idea
- WHEN the conversation continues
- THEN the next message works on that idea in the default mode
#### Scenario: nothing picked
- GIVEN the user picks none of the ideas
- WHEN the brainstorm skill replies
- THEN it asks what was missing from the list, and it does NOT write a brief

### R13. Throwaway prototypes  [Should]
WHEN a question is about how something looks or feels, or a short run could answer it, the brainstorm skill SHALL offer a throwaway prototype and SHALL build it only after a yes, in a scratch folder outside the repository.
#### Scenario: declined
- GIVEN the user declines the prototype
- WHEN the conversation continues
- THEN no prototype file exists, and the offer is NOT repeated unless the user raises it
#### Scenario: keeping it
- GIVEN an accepted prototype was built
- WHEN the user asks to keep building on it
- THEN the brainstorm skill treats that as a new request that needs an approved brief
#### Scenario: a screen prototype
- GIVEN an accepted prototype of a screen and `mstack-find-skills` in the session's skill list
- WHEN the brainstorm skill builds it
- THEN it loads the installed UI design skill that `mstack-find-skills` returns, says which one, and installs nothing

### R14. What the brief contains  [Must]
The brainstorm skill SHALL write a brief that holds the intent and the reason, the goals, non-goals and anti-goals, the constraints, the approaches considered with the pick and its reason, the tradeoffs accepted, the user's decisions apart from the agent's calls, the open questions, and what is left to the spec.
#### Scenario: project-sized work
- GIVEN the user picked an approach for work the skill sized as a project
- WHEN the brief is written
- THEN every one of the eight parts is present
#### Scenario: small change
- GIVEN work the skill sized as a small change
- WHEN the brief is written
- THEN the same parts appear in one or two lines each
#### Scenario: a call is not a decision
- GIVEN a choice the user never made
- WHEN it appears in the brief
- THEN it is listed under the agent's calls with a reason, and NOT under the user's decisions

### R15. Where the brief goes  [Must]
The brainstorm skill SHALL write the brief to the first place that applies, in this order: a place the user named, a rule in the repository's instructions, an existing briefs or design folder under the repository's docs folder, and otherwise a dated file in a briefs folder under the docs folder, SHALL state the path, and SHALL NOT commit it.
#### Scenario: default place
- GIVEN a repository with no rule and no such folder
- WHEN the brief is written
- THEN it is a file named with the date and a short slug in a briefs folder under the docs folder, and `git log` shows no new commit
#### Scenario: outside a repository
- GIVEN a topic that is not software and no repository
- WHEN the brief is written
- THEN the skill picks a place, says where, and runs no repository step

### R16. The builder check  [Must]
WHEN a project-sized brief is written, the brainstorm skill SHALL have a fresh reader, on the standard tier's model and effort, list the places where a builder would have to guess, before the user is asked to approve the brief.
#### Scenario: sorting the reader's questions
- GIVEN the reader returned five questions
- WHEN the brainstorm skill processes them
- THEN questions the conversation already answers are answered in the brief, minor ones are settled and marked as the agent's calls, and only the ones the user alone can answer are asked, in one round
#### Scenario: no subagent tool
- GIVEN a host session without a subagent tool
- WHEN the brief is written
- THEN the brainstorm skill reads the brief as that builder itself and says that it did
#### Scenario: not an approval
- GIVEN the reader reported nothing important left
- WHEN the brainstorm skill hands the brief to the user
- THEN it still asks for the user's approval, and does NOT treat the reader's report as one

### R17. The design red-flags screen  [Should]
WHEN a brief for software is written, the brainstorm skill SHALL check the picked approach against its list of design red flags and record each one it finds under the tradeoffs accepted or the open questions.
#### Scenario: a flag is found
- GIVEN the picked approach needs two lists kept in step by hand
- WHEN the brief is written
- THEN the brief names that cost under the tradeoffs accepted or raises it as an open question

### R18. The approval gate  [Must]
The brainstorm skill SHALL NOT write product code, scaffold, install a dependency or start an implementation skill until the user explicitly approved the written brief, except after the user opted out of the conversation or accepted a throwaway prototype.
#### Scenario: agreement with the idea
- GIVEN the user said the approach sounds good and no brief is written yet
- WHEN the brainstorm skill continues
- THEN it writes the brief and asks for approval of that file, and does NOT start building
#### Scenario: opting out
- GIVEN the user says to skip the questions and just do it
- WHEN the brainstorm skill replies
- THEN it says the brainstorm is over, states any significant how-it-gets-made choice in one line, and the request goes on through the normal workflow

### R19. The hand-off  [Must]
WHEN the user approved the brief, the brainstorm skill SHALL offer `mstack-write-specs` as the next step for a project, SHALL say that no spec is needed and offer to go straight to the work for a small change, and SHALL take the next step only on the user's go.
#### Scenario: project
- GIVEN an approved brief for a project and `mstack-write-specs` in the session's skill list
- WHEN the hand-off is offered and the user accepts
- THEN `mstack-write-specs` starts with the brief's path as its source
#### Scenario: `mstack-write-specs` is missing
- GIVEN `mstack-write-specs` is not installed
- WHEN the hand-off is offered
- THEN the brainstorm skill names it and `mstack-setup` as the way to install it, offers to stop, and does NOT install anything
#### Scenario: no go
- GIVEN the user has not answered the offer
- WHEN the turn ends
- THEN no spec, plan or code was started

### R20. The required shared skill  [Must]
IF `mstack-best-model-for` is missing from the session, THEN the brainstorm skill SHALL stop before its first question and print the install commands and the name `mstack-setup`.
#### Scenario: not installed
- GIVEN a session without `mstack-best-model-for` on disk
- WHEN the brainstorm skill starts
- THEN it prints the install commands for both hosts and the skills CLI and stops, and it does NOT ask a brainstorm question
#### Scenario: installed after the session started
- GIVEN the skill is on disk but not in the session's skill list
- WHEN the brainstorm skill starts
- THEN it says that a new session is needed and stops

### R21. One skill for two hosts  [Must]
The brainstorm skill SHALL run in Claude Code and in Codex from the same skill folder, naming host tools only in one table.
#### Scenario: Codex
- GIVEN a Codex session
- WHEN a numbered round is due
- THEN the questions arrive as a numbered message in chat and the skill waits for the answer

### R22. A brief as input to `mstack-write-specs`  [Must]
WHEN its source is a brief, `mstack-write-specs` SHALL treat every decision the brief records as the user's as settled and SHALL NOT ask it again.
#### Scenario: settled decision
- GIVEN a brief that records the user's pick of an approach
- WHEN `mstack-write-specs` interviews
- THEN no question asks for that pick again, and the brief's agent's calls are listed for the user at approval
#### Scenario: vague idea without a brief
- GIVEN a vague idea and `mstack-brainstorm` in the session's skill list
- WHEN `mstack-write-specs` sizes the request
- THEN it names `mstack-brainstorm` as the better start and asks whether to switch

### R23. Listed by `mstack-find-skills`  [Should]
WHEN a work item is an unformed idea, `mstack-find-skills` SHALL list `mstack-brainstorm` before any other brainstorming skill.
#### Scenario: both installed
- GIVEN `mstack-brainstorm` and another brainstorming skill are installed
- WHEN `mstack-find-skills` scores a work item that is an unformed idea
- THEN `mstack-brainstorm` is the first entry for that item

### R24. Packaging and attribution  [Must]
The mstack repository SHALL ship the brainstorm skill as one plugin for Claude Code and Codex that passes the repository's checks, with every adapted rule rewritten and each source credited inside the skill folder.
#### Scenario: checks
- GIVEN the finished plugin
- WHEN the repository's marketplace check and version-bump check run
- THEN both pass, and the skill folder holds a license copy identical to the root one and a notices file with each source's copyright line and license text
#### Scenario: copied text
- GIVEN the finished skill folder
- WHEN its files are compared with the four sources
- THEN no sentence is a verbatim copy of a source sentence

## Constraints and assumptions

- Hosts: Claude Code and Codex. Topics: any, software or not.
- Sources and licenses, read 2026-11-10: superpowers `brainstorming` 7.0.2, MIT; pstack upstream in `cursor/plugins`, MIT; Anthropic `product-brainstorming` in `anthropics/knowledge-work-plugins`, Apache-2.0, whose license file holds only the unfilled copyright template and which has no notice file; BMad `bmad-brainstorming` in `bmad-code-org/bmad-method`, MIT, with a trademark notice. The copyright lines are in the skill's notices file only.
- The names of the sources' products and personas are never used as names of this skill's files, modes or steps. They appear only in the notices file.
- The repository's rules apply: no personal or company data, a skill never points outside its own folder, no commit without a request, and model names appear only in `mstack-best-model-for`'s table.
- Headless test runs have no question tool, so a test case that needs the user's answer supplies it as a second turn (the repository's existing practice for its setup cases).
- A new plugin starts at 0.1.0 and the marketplace's own version rises by a minor number (repository instructions).
- The brief's default place is a dated file under `docs/briefs/`, as the user approved in round 2, question 1.
- A playback is capped at 300 words (agent's call: the upper end of the base skill's range, so the lint has a number).
- A small change is one behavior in one component that fits one working session; anything larger is a project, and the user can override the size (agent's call: the sizes `mstack-write-specs` already uses).
- A brief opens with a line that says it is a design brief and gives its approval date, and `mstack-write-specs` recognizes a brief by that line in its source file (agent's call: the independent reader asked how a brief is recognized).
- `mstack-find-skills` recognizes an unformed idea as a work item whose goal or reason is not settled, in one row of its table of preferred mstack skills (agent's call, same reason).
- The notice for the Anthropic source gives its repository, its license name and the Apache-2.0 text, states that the adapted rules were changed, and invents no copyright line, because the source's license file fills none in (agent's call, same reason).
- When the user picks none of the short-listed ideas, the skill asks what was missing instead of ending (agent's call: ending there would be the "list with no next step" anti-goal).

## Decisions

D1. The skill is written fresh in mstack's own words, with reference files for the ideas techniques, the brief template, the builder-check prompt and the design red flags. Alternatives considered: a close port of the superpowers text, which stays too close to one source's wording and carries conventions the user dropped; a thin wrapper that requires superpowers, which depends on a third-party skill whose own gate allows no other next step. Decided by: user. Source: interview, approaches message.
D2. Two modes, a default mode and an ideas mode entered on request. Alternatives considered: the default mode only, which leaves out what the other sources add. Decided by: user. Source: round 1, question 3.
D3. One open question at a time while the reason is unknown, numbered rounds once choices can be named. Alternatives considered: one question at a time throughout, as the base skill does; rounds throughout, as `mstack-write-specs` does. Decided by: user. Source: round 1, question 4.
D4. The skill ends in a brief file and offers `mstack-write-specs`, which gains one rule so a brief's settled decisions are not asked again, and one line that names this skill for a vague idea. Alternatives considered: no file, which loses the record; writing the spec itself, which duplicates `mstack-write-specs`. Decided by: user. Source: round 1, question 2, and round 2, question 6.
D5. No browser visual companion in this version. Alternatives considered: porting the companion's server and scripts to both hosts. Decided by: user. Source: round 1, question 6.
D6. The skill triggers on a request to brainstorm or an unformed idea, not before every piece of creative work. Alternatives considered: the base skill's must-use-before-anything trigger, which would collide with `mstack-write-specs` for decided requests. Decided by: user. Source: round 1, question 7.
D7. Adapted sources are superpowers, pstack, Anthropic `product-brainstorming` and BMad, and no other. Alternatives considered: three more public skills, rejected for a missing license file, unclear authorship, and being only a pointer to superpowers. Decided by: user. Source: round 1, question 8, and the vetting evidence.
D8. The builder check runs on a fresh subagent with the standard tier from `mstack-best-model-for`, which is therefore a required skill with no built-in fallback. Alternatives considered: a self-read with no dependency. Decided by: user. Source: round 1, question 9.
D9. In ideas mode the agent generates by default, and the mode ends in a short list with each idea's biggest unknown. Alternatives considered: asking the user for a stance at the start of every ideas session. Decided by: user. Source: round 2, questions 3 and 4.
D10. `mstack-write-specs` is named in the hand-off, never required. Alternatives considered: making it a required skill, which would block a user who only wants the brief. Decided by: user. Source: round 2, question 5.
D11. `mstack-find-skills` lists the skill for an unformed idea. Alternatives considered: no pointer, which leaves nothing in the chain leading to the skill. Decided by: user. Source: round 2, question 6.
D12. From pstack the skill takes four things only: usage-first design, whole-shape alternatives, the red-flags screen and the tradeoffs-accepted part. Alternatives considered: its restate-first, prototype and sizing rules, which the base skill already has. Decided by: agent's call. Source: comparison of the pstack research with the base skill's text.
D13. A prototype of a screen or page uses an installed UI design skill that `mstack-find-skills` returns, named and never required, and no UI guideline text is copied into this skill (the installed candidate has no license file). Alternatives considered: copying a UI skill's guidelines, which the repository's rules forbid for an unlicensed source; no UI skill at all. Decided by: user. Source: conversation 2026-11-10, during execution.
D14. The numbered rounds use the design tree and frontier method of mattpocock `grilling` and `grill-me` (MIT), rewritten and credited, which widens D7's list of sources by one. Alternatives considered: keeping D7's four sources, which leaves the brainstorm's rounds without the method `mstack-write-specs` already uses. Decided by: user. Source: conversation 2026-11-10, after execution.

## Risks

- The base skill and this one are both installed and both trigger on the same request -> the description states this skill's narrower trigger, and the comparison tests invoke it by name.
- Ideas mode drifts into judging, because models rank by habit -> a test case grades the first ideas message for the absence of ranking.
- The one rule added to `mstack-write-specs` changes a skill with its own test cases -> its existing cases are rerun after the change.
- A headless test cannot show a multi-turn conversation in full -> cases grade the first message and one supplied reply, and the report says which behaviors were not exercised.

## Verification

- R1, R3, R4, R5: comparison case "vague idea in a sample repository", graded on the first message (one question with its reason, findings stated, no file changed, no question the repository answers).
- R2: comparison case "fully specified one-line change", graded on no interview question.
- R6, R7, R8, R14, R15, R18, R19: comparison case "detailed request" with supplied replies, graded on the approaches message, the brief's parts and path, no commit, no product code, and the hand-off offer.
- R9, R13, R17: read against the written skill in review, and exercised by the detailed-request case where its subject allows; the report names any that no run exercised.
- R10, R11, R12: an ideas-mode case, graded on ideas before judging and on the short list's unknowns.
- R16: the detailed-request case run with a subagent tool, graded on the check running before the approval request.
- R20: a stop case with the shared skill absent, graded on the printed commands and on no brainstorm question.
- R21: the vague-idea case run once in Codex.
- R22: `mstack-write-specs`' existing cases rerun, plus one case that feeds it a brief.
- R23: `mstack-find-skills`' called-mode case with an unformed-idea item.
- R24: the repository's marketplace check, version-bump check, the skill creator's static check and private-data scan.
- Input classes no scenario covers: a request in a language other than English (the skill answers in the user's language); several independent ideas in one request (the skill says so, agrees an order and takes them one at a time); a brief file that already exists at the path (it is shown to the user and never overwritten without a yes).

## Appendix: interview record

- 2026-11-10 Q: should both new skills be plugins in this repository, with the brainstorm skill for Claude Code and Codex? / Recommended: yes / Decision: yes (recorded in the previous session's handoff).
- 2026-11-10 Q: may other brainstorming skills be searched publicly and adapted with credit? / Recommended: yes, licensed text only / Decision: yes (previous session's handoff).
- 2026-11-10 Evidence: the installed skills, the repository's skill folders and skills.sh results / Decision: four skills overlap; the user's earlier choice to create a new skill stands.
- 2026-11-10 Evidence: superpowers `brainstorming` 7.0.2 SKILL.md / Decision: echo-back, spikes, sizing and the approaches step are already in the base; they are not credited to another source.
- 2026-11-10 Evidence: pstack upstream license and skills / Decision: four techniques fit and are not in the base (D12).
- 2026-11-10 Evidence: skills.sh pages and repository licenses of six candidates / Decision: two usable beside the base, three rejected (D7).
- 2026-11-10 Q (round 1, 2): end in a brief and offer the spec skill, with one line added there? / Recommended: yes / Decision: yes.
- 2026-11-10 Q (round 1, 3): a default mode and an ideas mode? / Recommended: yes / Decision: yes.
- 2026-11-10 Q (round 1, 4): one open question at a time, then numbered rounds? / Recommended: yes / Decision: yes.
- 2026-11-10 Q (round 1, 5): any topic, repository steps only in a repository? / Recommended: yes / Decision: yes.
- 2026-11-10 Q (round 1, 6): leave out the visual companion, use text sketches and an offered prototype? / Recommended: yes / Decision: yes.
- 2026-11-10 Q (round 1, 7): trigger only on a request to brainstorm or an unformed idea? / Recommended: yes / Decision: yes.
- 2026-11-10 Q (round 1, 8): adapt from the four named sources only? / Recommended: yes / Decision: yes.
- 2026-11-10 Q (round 1, 9): builder check by a fresh subagent, shared model skill required? / Recommended: yes / Decision: yes.
- 2026-11-10 Q (round 1, 10): the three test tasks? / Recommended: yes / Decision: yes.
- 2026-11-10 Proposal (round 2): nothing is built before the written brief is approved, except after an opt-out or an accepted prototype / Decision: accepted.
- 2026-11-10 Q (round 2, 1): the order of places for the brief? / Recommended: yes / Decision: yes.
- 2026-11-10 Q (round 2, 2): the eight parts of the brief? / Recommended: yes / Decision: yes.
- 2026-11-10 Q (round 2, 3): the agent generates ideas by default? / Recommended: yes / Decision: yes.
- 2026-11-10 Q (round 2, 4): ideas mode ends in a short list with unknowns, then the default mode? / Recommended: yes / Decision: yes.
- 2026-11-10 Q (round 2, 5): offer the spec skill for a project, straight to the work for a small change, the spec skill never required? / Recommended: yes / Decision: yes.
- 2026-11-10 Q (round 2, 6): one pointer line each in the spec skill and the skill finder? / Recommended: yes / Decision: yes.
- 2026-11-10 Q (approaches): a fresh skill in mstack's own words? / Recommended: yes / Decision: yes; the shared understanding was confirmed in the same answer.
