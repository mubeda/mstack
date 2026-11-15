# Add mstack-auto, a router that picks the mstack skill for a prompt

Status: Approved 2026-11-14 (approved in chat by the user)
Size: full    Mode: gated    Type: feature
Source: conversation 2026-11-14

## Problem

The marketplace has twenty skills. A user who does not know them cannot tell which one to start for a job, and the hosts' own choice by description is weakest exactly where it matters: when several skills of one chain fit (an idea could go to `mstack-brainstorm`, `mstack-write-specs` or `mstack-plan`), when a skill runs on one host only (the three workflows), and when the fitting skill is not installed (the host then silently does the job without it). The only phrase that addresses the set as a whole, "mentions mstack", sits in the descriptions of the two review workflows (read 2026-11-14), so "use mstack for this" starts a delivery workflow whatever the job is.

## Goals

1. A user can type one command with any prompt and the fitting mstack skill starts, with one line that says which skill and why.
2. A prompt that fits several skills gets the earliest skill of the chain, or one question when the skills are not in one chain. It never gets a silent guess.
3. A fitting skill that is missing, or that runs only on the other host, is named to the user instead of being skipped silently.
4. The routing table cannot fall behind the marketplace: a plugin without a row fails the repository's check before a commit.

## Non-goals

- Routing to skills outside mstack. `mstack-find-skills` already matches any installed skill; `mstack-auto` hands over to it.
- Starting on every work request. It starts only when the user asks for it, because an extra hop on every task costs time and competes with every other skill's description.
- Doing the job. `mstack-auto` chooses and loads; the loaded skill does the work.
- Installing anything. `mstack-setup` installs.
- A row in `mstack-chief-of-staff`'s routes table. That skill routes on its own; a router row there would be circular.
- Proving that a row is correct. The check proves only that the table is complete; the written rule and the test cases cover correctness.
- A run of the description optimizer of Anthropic's skill creator (declined by the user).

Anti-goals: a router that does the job itself when no skill fits; a router that loads a skill in called mode, so the skill asks nothing and returns a result block instead of working with the user; a table that restates another skill's steps instead of naming when to use it.

## Users and scenarios

1. As a developer new to mstack, I want to give my prompt to one command, so that I do not have to read twenty descriptions first.
2. As a developer with an idea that is half formed, I want the router to start me at the right link of the chain, so that I do not write a plan for something that has no agreed goal.
3. As a developer working in Codex, I want to be told when the skill I need runs only in Claude Code, so that I can choose the nearest one knowingly.
4. As a maintainer who adds a skill, I want the check to fail until the router knows the skill, so that the table stays complete without anyone remembering it.

## Requirements

### R1. One choice from the routing table  [Must]
WHEN the user starts `mstack-auto` with a prompt, `mstack-auto` SHALL choose at most one mstack skill for that prompt from its own routing table, which has one row for every mstack skill except `mstack-auto`.
#### Scenario: a broken test
- GIVEN every mstack skill is installed
- WHEN the prompt is "the export test fails since yesterday and I don't know why"
- THEN the chosen skill is `mstack-diagnose`
#### Scenario: the prompt names another skill's steps
- GIVEN every mstack skill is installed
- WHEN the prompt is "use mstack for this: fix the typo in the README title"
- THEN no mstack skill is chosen, because no row covers a plain edit, R8 applies, and `mstack-auto` does NOT pick the nearest-sounding skill to have a match

### R2. The announcement line  [Must]
WHEN `mstack-auto` has chosen a skill that is in the session's skill list and runs on this host, `mstack-auto` SHALL print the line `mstack-auto: <skill>, because <reason in a few words>.` before it loads the skill.
#### Scenario: the line comes first
- GIVEN the chosen skill is `mstack-diagnose`
- WHEN `mstack-auto` answers
- THEN its first line reads `mstack-auto: mstack-diagnose, because ` followed by a reason and a full stop, and the skill's own first question or step comes after it
#### Scenario: no line without a load
- GIVEN the chosen skill is not in the session's skill list
- WHEN `mstack-auto` answers
- THEN the line of R2 does NOT appear, and R6 applies

### R3. Loading as the user's own request  [Must]
WHEN `mstack-auto` loads the chosen skill, `mstack-auto` SHALL give it the user's prompt unchanged and SHALL NOT say that a skill is calling.
#### Scenario: the loaded skill runs in user mode
- GIVEN the chosen skill has a called mode and a user mode
- WHEN `mstack-auto` loads it
- THEN the skill works with the user as if the user had started it (it asks its own questions), and it does NOT return a called-mode result block
#### Scenario: the prompt is not rewritten
- GIVEN the prompt contains a file path and a number
- WHEN the skill is loaded
- THEN both reach the skill as written, and `mstack-auto` adds no decision of its own to the prompt

### R4. The earliest link of a chain  [Must]
WHEN a prompt fits several skills that follow one another in a chain, `mstack-auto` SHALL choose the earliest one whose input the user does not have yet, and SHALL name the skill that follows it in the announcement line.
#### Scenario: an idea without a goal
- GIVEN the prompt is "I want to add notifications to the app" and no brief, spec or plan is named
- WHEN `mstack-auto` chooses
- THEN it chooses `mstack-brainstorm`, the line names `mstack-write-specs` as the next step, and it asks no question about the choice
#### Scenario: an approved spec is named
- GIVEN the prompt names an existing spec file and asks to build it
- WHEN `mstack-auto` chooses
- THEN it chooses `mstack-plan`, and it does NOT start at `mstack-brainstorm`
#### Scenario: a draft is named
- GIVEN the prompt names a spec file whose status is Draft and asks to build it
- WHEN `mstack-auto` chooses
- THEN it chooses `mstack-write-specs`, which resumes the draft, and it does NOT choose `mstack-plan`

### R5. One question for a real tie  [Must]
WHEN a prompt fits two or more skills that are not links of one chain, `mstack-auto` SHALL ask the user one question that lists each fitting skill with one line on what it would do, and SHALL load nothing before the answer.
#### Scenario: "process the backlog"
- GIVEN the prompt is "process the backlog"
- WHEN `mstack-auto` answers
- THEN it asks whether to sort the backlog (`mstack-backlog-triage`) or to deliver it (this host's review workflow), and no skill has been loaded
#### Scenario: no question for a clear prompt
- GIVEN the prompt fits exactly one row
- WHEN `mstack-auto` answers
- THEN it does NOT ask the user to confirm the choice

### R6. A fitting skill that is not installed  [Must]
IF the chosen skill is not in the session's skill list, THEN `mstack-auto` SHALL name the skill, say that it is not available in this session, say that `mstack-setup` installs it and that a new session picks it up, and stop.
#### Scenario: `mstack-diagnose` is missing
- GIVEN `mstack-diagnose` is not in the session's skill list
- WHEN the prompt is a failing test with an unknown cause
- THEN the answer names `mstack-diagnose` and `mstack-setup`, and `mstack-auto` does NOT diagnose the failure itself and does NOT load another skill in its place

### R7. A fitting skill of the other host  [Must]
IF the chosen skill runs only on the other host, THEN `mstack-auto` SHALL say so in one line and ask whether to load this host's nearest skill, which the skill's row names, saying what that skill does differently; this check comes before the one of R6, and R6 then applies to the nearest skill.
#### Scenario: Codex as the writer, asked in Codex
- GIVEN the session runs in Codex and the prompt is "let Codex write this plan's code while Claude manages and reviews it"
- WHEN `mstack-auto` answers
- THEN it says `mstack-claude-pm-codex-dev` runs in Claude Code only, offers `mstack-claude-review-workflow` with the difference in one line, and does NOT load it before a yes
#### Scenario: not reported as missing
- GIVEN the same session and prompt
- WHEN `mstack-auto` answers
- THEN it does NOT say that `mstack-claude-pm-codex-dev` is not installed or that `mstack-setup` installs it, because no install makes it run in Codex

### R8. No mstack skill fits  [Must]
WHEN no row of the table fits the prompt, `mstack-auto` SHALL say in one line that no mstack skill fits and SHALL load `mstack-find-skills` as the user's own request, with the prompt as its text.
#### Scenario: a translation
- GIVEN the prompt is "translate this README to Spanish"
- WHEN `mstack-auto` answers
- THEN it says no mstack skill fits, and `mstack-find-skills` reports the installed skills that fit the prompt, with its item ID `1`
#### Scenario: the job is not done
- GIVEN no row fits
- WHEN `mstack-auto` answers
- THEN it does NOT translate the file, and it does NOT pick an mstack skill anyway

### R9. The required shared skill  [Must]
IF `mstack-find-skills` is not in the session's skill list, THEN `mstack-auto` SHALL stop before it chooses anything: with the message that a new session is needed when the skill's folder exists on disk, and otherwise with the install commands for Claude Code, Codex and the skills CLI and the name `mstack-setup`.
#### Scenario: not installed
- GIVEN `mstack-find-skills` is installed nowhere
- WHEN the user starts `mstack-auto` with a prompt that a row would match
- THEN the answer is the stop block naming `mstack-find-skills` and `mstack-setup`, and no skill is chosen or loaded

### R10. No prompt  [Should]
WHEN the user starts `mstack-auto` without a prompt, `mstack-auto` SHALL ask one question for the job and wait.
#### Scenario: a bare command
- GIVEN the user typed only the command
- WHEN `mstack-auto` answers
- THEN it asks what the job is, and it does NOT choose a skill from earlier messages of the conversation

### R11. Two unrelated jobs  [Could]
WHEN a prompt holds two unrelated jobs, `mstack-auto` SHALL route the first one and name the second one, with its skill, in the announcement line's following sentence.
#### Scenario: a bug and a new idea
- GIVEN the prompt asks to find why a test fails and also to think about a new export feature
- WHEN `mstack-auto` answers
- THEN `mstack-diagnose` is loaded, and one sentence says the export idea is for `mstack-brainstorm` afterwards

### R12. The router does no work of its own  [Must]
`mstack-auto` SHALL NOT perform the prompt's job, install anything, write a file, commit or push, in any of its outcomes.
#### Scenario: after the hand-over
- GIVEN a skill was loaded
- WHEN that skill takes over
- THEN `mstack-auto` adds no step, summary or check after it
#### Scenario: after a stop
- GIVEN `mstack-auto` stopped under R6 or R9
- WHEN the answer ends
- THEN the working tree is unchanged, and no install command has been run

### R13. The completeness check  [Must]
WHEN the repository's marketplace check runs, the check SHALL fail, naming the skill, if a plugin of either registry other than `mstack-auto` has no row in `mstack-auto`'s routing table, or if a row names an mstack skill that no registry has.
#### Scenario: a plugin without a row
- GIVEN a plugin folder and its registry entries exist and the table has no row for it
- WHEN the check runs
- THEN it exits non-zero and its message names that plugin and the routing table
#### Scenario: a row for a removed skill
- GIVEN the table has a row for a skill whose plugin was removed
- WHEN the check runs
- THEN it exits non-zero and names that row, and it does NOT pass because every existing plugin has a row

### R14. The rule for future agents  [Must]
The repository's agent instructions SHALL state that `mstack-auto` holds its own routing table as an exception to the rule that no skill restates another's tables, SHALL tell the agent to add, change or remove the table's row in the same change that adds a skill, changes what a skill is for or which host it runs on, or removes it, and SHALL name the table in the outside-the-diff sweep.
#### Scenario: an agent adds a skill
- GIVEN an agent reads the instructions before adding a plugin
- WHEN it searches them for `mstack-auto`
- THEN it finds the exception, the rule and the sweep entry, each saying the table changes in the same change
#### Scenario: the instruction file Claude Code reads
- GIVEN Claude Code reads its own instruction file, which includes the shared one
- WHEN the rule is added to the shared file
- THEN Claude Code reads the rule, and the rule is NOT written a second time in another file

### R15. The phrase "mentions mstack"  [Must]
The descriptions of the two review workflows SHALL NOT contain the trigger "mentions mstack" (R16 gives the router the phrases a user types to hand a job to mstack as a whole).
#### Scenario: after the change
- GIVEN the change is applied
- WHEN the skill descriptions are searched for "mentions mstack"
- THEN no description contains it, and each workflow's other triggers are unchanged word for word

### R16. The description  [Must]
`mstack-auto`'s description SHALL start with "Use when", name only explicit requests (the command with a prompt, "use mstack for this", "which mstack skill", "let mstack pick"), state that it does not start on a plain work request, and stay within 1024 characters.
#### Scenario: a plain work request
- GIVEN the description is read by a host choosing a skill for "fix this bug"
- WHEN the host compares descriptions
- THEN `mstack-auto`'s description gives no reason to load it, because it names only requests addressed to mstack or to the router

### R17. Listed with the other skills  [Must]
The marketplace SHALL list `mstack-auto` in every place that lists the mstack skills as a set: both registries, the README's table, install lists and prose, `mstack-setup`'s optional rows with its test, reference table and complete-machine case, the supported-skills sentence of both `mstack-skill-creator` host files, and `mstack-find-skills`' table of preferred skills.
#### Scenario: the sweep
- GIVEN the change is applied
- WHEN the repository is searched for each place that names `mstack-decisions` in a list of all skills
- THEN each such place also names `mstack-auto`, or the hand-over says why that list is a different set
#### Scenario: the counts
- GIVEN the two host files say how many mstack skills run on each host
- WHEN `mstack-auto` is added
- THEN each total and each supported count rises by one, and the number of names in each sentence equals its count

## Constraints and assumptions

- Hosts: Claude Code and Codex, like the other plugins. The skill file is the same for both and names host tools only in its host table (repository rule).
- Versions, read 2026-11-14: a new plugin starts at `0.1.0`; the marketplace `metadata.version` is `0.9.0` and rises to `0.10.0`, because a plugin is added. Every other plugin this change touches rises by one patch number: `mstack-codex-review-workflow`, `mstack-claude-review-workflow`, `mstack-setup`, `mstack-find-skills`, `mstack-skill-creator`.
- The description limit of 1024 characters is the one `mstack-skill-creator`'s check enforces.
- Host-only skills, read from the descriptions on 2026-11-14: `mstack-codex-review-workflow` and `mstack-claude-pm-codex-dev` run in Claude Code only; `mstack-claude-review-workflow` runs in Codex only.
- The chains, from the repository's instructions and README (read 2026-11-14). Development: `mstack-brainstorm` (no agreed goal yet) → `mstack-write-specs` (no approved spec yet) → `mstack-plan` (an approved spec, no plan yet) → this host's workflow (a plan, issues or one larger task to deliver). Product: `mstack-product-plan` (an initiative) → `mstack-epic` (one epic) → `mstack-write-specs`, where it joins the development chain. `mstack-evidence` (customer feedback as the input) and `mstack-decisions` (meeting notes as the input) feed both chains and are chosen by their input, not by position. Every other skill stands alone.
- "Has the input" means the artifact exists and is approved. A named draft goes to the skill that writes that artifact, which resumes it.
- A request about product-level work with no code (an initiative, epics, a product or management person) belongs to the product chain; "plan" alone, with a spec or code in view, belongs to the development chain.
- In Claude Code the workflow link is `mstack-codex-review-workflow`, and `mstack-claude-pm-codex-dev` only when the prompt says Codex is to write the code; that is a rule of the table, not a tie. In Codex it is `mstack-claude-review-workflow`. Each host-only row names its counterpart on the other host: the two review workflows name each other, and `mstack-claude-pm-codex-dev` names `mstack-claude-review-workflow`.
- The skill knows its host and loads another skill the way every mstack skill does: a host table in the skill file, with the host's skill-loading tool in a cell (the Skill tool with the prompt as its arguments in Claude Code; reading the skill's file and following it with the prompt in Codex).
- `mstack-find-skills` in user mode takes a given text as its one work item and asks nothing more (its skill file, read 2026-11-14).
- "Installed" means: in the session's skill list, as `<name>` or `<plugin>:<name>` (agent's call: the same test the other skills use, and the only one that says the skill can be loaded now).
- Nothing is saved between runs, so there is no value of an earlier version to handle. The removed phrase "mentions mstack" was a trigger, not a saved value.
- The skill carries a `LICENSE` identical to the root one and a notices file, and adapts no third-party text.

## Decisions

D1. `mstack-auto` holds its own routing table, in its own skill folder. Alternatives considered: calling `mstack-find-skills` in called mode and keeping its mstack entries (no second table, but a slower first step and a result that does not know the chain rule); reading only the descriptions the session shows (weak where the host cuts them short). Decided by: user. Source: interview 2026-11-14.
D2. The table is kept complete by a written rule and by the marketplace check. Alternative considered: the written rule alone, which nothing enforces. Decided by: user.
D3. Explicit triggers only, and the phrase "mentions mstack" moves from the two workflows to the router. Alternatives considered: leaving the phrase in the workflows (a bare mention would still start a delivery workflow); starting on any task. Decided by: user.
D4. The chosen skill is loaded after one announcement line, without a confirmation. Alternatives considered: always asking first; recommending only. Decided by: user.
D5. No match goes to `mstack-find-skills` in user mode. Alternatives considered: doing the job without a skill; stopping. Decided by: user.
D6. `mstack-find-skills` is a required shared skill of `mstack-auto`, checked before anything else. Alternative considered: saying it is missing and continuing. Decided by: user.
D7. A missing match stops with the skill's name and `mstack-setup`. Alternative considered: doing the job without the skill. Decided by: user.
D8. A match of the other host is offered as a question. Alternative considered: loading this host's nearest skill directly. Decided by: user.
D9. Skills of one chain resolve to the earliest link whose input is missing; a question is kept for skills outside one chain. Decided by: user.
D10. The announcement line has the fixed form `mstack-auto: <skill>, because <reason>.` Decided by: user.
D11. The table has a row for every plugin except `mstack-auto` itself, including the shared skills. Alternative considered: leaving out skills a user rarely starts, which would need an allow-list in the check. Decided by: agent's call, because one rule without exceptions is the simplest check.
D12. `mstack-auto` is an optional row in `mstack-setup`. Decided by: agent's call, because no other skill requires it.
D13. `mstack-auto` gets a row in `mstack-find-skills`' table of preferred skills and none in `mstack-chief-of-staff`'s routes. Decided by: agent's call (see Non-goals).
D14. Without a prompt it asks one question; with two unrelated jobs it routes the first and names the second; after the hand-over it does nothing. Decided by: agent's call, as the smallest behavior for each case.
D15. The host check of R7 comes before the installed check of R6. Alternative considered: the other order, which would tell a Codex user to install a skill that cannot run there. Decided by: agent's call.
D16. A named draft counts as a missing input and goes to the skill that writes it. Alternative considered: planning from a draft, which the plan skill refuses. Decided by: agent's call.
D17. Every prompt no row covers goes to `mstack-find-skills`, including an obvious plain edit. Alternative considered: stopping for "obvious" non-fits, which needs a judgment the table cannot state. Decided by: agent's call, following D5.

## Risks

- The table says something different from a skill's own description after that skill changes. -> The rule of R14 covers "changes what a skill is for", and the sweep names the table.
- Removing "mentions mstack" changes when the workflows start for existing users. -> Their other triggers stay word for word, and the README prose says that the router owns the phrase.
- A baseline run without the router may choose the same skill on clear prompts. -> The test tasks are ties, a missing skill and a no-match; the comparison result is shown to the user whatever it says.

## Verification

- R1 to R8, R10 to R12: eval cases with graders, run with and without the skill: an idea without a goal (R1, R2, R4), "process the backlog" (R5), a product-level plan request (R1, `mstack-product-plan` and not `mstack-plan`), a failing test with `mstack-diagnose` missing (R6, R12), a translation (R8, R12). R3 is graded in the first case: the loaded skill asks its own question. R7 and R11 are checked by reading the skill text against their scenarios, because R7 needs a Codex session; the hand-over says they were not run.
- R9: read against the stop block's form in the skill text; an eval case when the harness can hide an installed skill, otherwise reported as not run.
- R13: run the marketplace check three times: as changed (passes), with one row removed (fails, names the skill), with a row for a skill that does not exist (fails, names the row).
- R14, R15, R17: text search for `mstack-auto`, "mentions mstack" and `mstack-decisions` across the plugins, the README and the instructions; counts in the hand-over.
- R16: `mstack-skill-creator`'s static check on the skill folder.
- Input classes no scenario covers: a prompt in another language is matched by its meaning; a prompt that names an mstack skill outright loads that skill; a prompt that asks which skills exist, without a job, gets the table's skill names and one line each, and nothing is loaded (agent's call for all three).

## Appendix: interview record

- 2026-11-14 Q: where the skill goes / Recommended: a new plugin / Decision: new plugin for Claude Code and Codex.
- 2026-11-14 Q: what happens after a match / Recommended: say it, then load / Decision: one line, then load; ask only on a tie.
- 2026-11-14 Q: how the skill knows the mstack skills / Recommended: call `mstack-find-skills` / Decision: its own table, with an exception and a rule in the agent instructions.
- 2026-11-14 Q: enforcement of the table / Recommended: rule and check / Decision: both.
- 2026-11-14 Q: when the skill starts / Recommended: explicit, own the phrase / Decision: explicit triggers; "mentions mstack" leaves the two workflows.
- 2026-11-14 Q: no mstack skill fits / Recommended: do the job plainly / Decision: hand over to `mstack-find-skills`.
- 2026-11-14 Q: `mstack-find-skills` missing / Recommended: say so and continue / Decision: stop with the install commands.
- 2026-11-14 Q: description optimizer / Recommended: no / Decision: no.
- 2026-11-14 Q: fixed announcement line / Recommended: yes / Decision: yes.
- 2026-11-14 Q: matched skill not installed / Recommended: name it and `mstack-setup`, stop / Decision: yes.
- 2026-11-14 Q: matched skill of the other host / Recommended: say so, offer the nearest as a question / Decision: yes.
- 2026-11-14 Q: several skills of one chain / Recommended: earliest link, name the next, ask only outside a chain / Decision: yes.
- 2026-11-14 Q: the five test tasks / Recommended: yes / Decision: yes.
- 2026-11-14 Evidence: the two workflow descriptions / Decision: both hold "mentions mstack"; no other description does.
- 2026-11-14 Evidence: `mstack-find-skills` skill file, Two modes / Decision: user mode with a given text needs no question, so R8 needs no new input form.
- 2026-11-14 Evidence: the marketplace check script / Decision: one script of assertions over registries and plugin folders; R13 is one more assertion.
- 2026-11-14 Evidence: registries / Decision: marketplace `0.9.0`, new plugins start at `0.1.0`.
- 2026-11-14 Evidence: the repository's instructions and README prose / Decision: the two chains and the two feeding skills are as listed under Constraints; no question needed.
- 2026-11-14 Evidence: independent read, five questions / Decision: three answered from the repository (chains, host and loading, no-row case), two settled as agent's calls (D15, D16); none needed the user.
- 2026-11-14 Evidence: search for `mstack-decisions` outside its plugin / Decision: fourteen files name it; the set lists among them are the ones in R17.
