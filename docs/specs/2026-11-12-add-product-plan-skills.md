# Add mstack-product-plan and mstack-epic, planning skills for product people

Status: Draft (approved 2026-11-12; edited that day after the build: R10 and R33 aligned with decisions D26 and D34, one wording change in Success metrics, one constraint added; awaiting approval of this text)
Size: full    Mode: gated    Type: feature
Source: the approved design brief `docs/briefs/2026-11-12-product-plan-skills.md`, and conversation 2026-11-12.

## Problem

A product manager who used `mstack-plan` liked its interview but got a developer's document, and asked what is left for the developer to do afterwards. The mstack chain (brainstorm, spec, plan) works on one feature, reads code first and writes in developer terms, so nothing in it takes a whole initiative and cuts it into epics. Research on 2026-11-12 (`reports/Product plan skill research.md`, local and not committed) found no existing skill that combines an interview until everything is settled, a split into several epics, and no development content.

## Goals

- A product person finishes a product plan alone, with no repository and no developer present, and can tell from the document which epic starts first and why.
- A developer starts `mstack-write-specs` from an approved epic and is not asked the product decisions again.
- Both skills run as one self-contained folder in Claude Code, Codex CLI, the Claude desktop app and the ChatGPT desktop app.
- Neither document contains code, technical design, tasks or time estimates.

## Non-goals

- Export to a tracker. A skill that already does that can read the documents.
- A start file that runs the build chain, or a status table that later steps update. The user chose the review only.
- Any change to `mstack-plan` or the three workflows. They keep reading specs.
- Packaging for the desktop apps (ZIP builds, extra metadata, a desktop check). They are a best effort until an upload test shows what is needed.
- Running the skills inside Obsidian through one of its AI plugins. That would be a fifth host with its own rules; Obsidian support here means reading from a vault and saving into it.
- Scoring formulas for priority. The order is now, next and later with a reason.

Anti-goals:

- A document that prescribes the solution, so developers have nothing left to decide.
- A document a developer cannot write a spec from.
- A skill that stops in a desktop app because another mstack skill is missing.
- Developer words (endpoint, schema, migration) in a question to a product person.

## Users and scenarios

1. As a product manager with no repository open, I want to be interviewed about an initiative until nothing is open, so that I get a product plan with ordered epics I can approve.
2. As a product manager, I want to detail one epic in depth, so that developers get one document they can build a spec from.
3. As a developer, I want `mstack-write-specs` to accept an approved epic as its source, so that the product decisions are settled and I only decide how to build it.
4. As a manager who keeps notes in Obsidian, I want the plan and its epics saved in my vault with links and properties, so that I can browse and filter them there.
5. As a manager in a desktop app, I want the skill to work without any other skill installed, so that I am never told to install something I cannot install.

## Requirements

"The product plan" is the document `mstack-product-plan` writes. "An epic section" is one epic's short part of the product plan. "The epic" is the detailed document `mstack-epic` writes for one epic. "The document" means either one. "A helper skill" is any other mstack skill.

### Both skills

### R1. Loads on a fitting request  [Must]
WHEN a user asks to plan an initiative at product level, to split work into epics, or to detail one epic, the host SHALL be able to load the fitting skill from a description of at most 200 characters that names those situations and does not summarize the skill's steps.
#### Scenario: a product request
- GIVEN both skills are installed
- WHEN the user writes "I need a product plan for a customer self-service portal"
- THEN `mstack-product-plan` loads
#### Scenario: a developer request
- GIVEN the same session
- WHEN the user writes "plan the implementation of this spec"
- THEN neither skill loads, and `mstack-plan` does

### R2. Reads the documents it can reach  [Must]
WHEN a skill starts inside a Git repository, the skill SHALL read that repository's documents (its README, documentation folders, earlier briefs, specs, plans and product plans) without asking, and SHALL then ask once, on every host, whether there are further folders, files, links or attachments to read.
#### Scenario: inside a repository
- GIVEN a repository with a README and a documentation folder
- WHEN the skill starts
- THEN its first message says what it read, and asks one question about further sources
#### Scenario: no repository
- GIVEN a session with no repository and no attachment
- WHEN the user answers "no" to the question about sources
- THEN the interview starts, and no further question about sources is asked

### R3. Never asks about code  [Must]
The skill SHALL ask only about the product (who, why, what, how much it is worth, what is out, in what order) and SHALL NOT ask the user about code, architecture, data storage, interfaces or technical feasibility.
#### Scenario: a technical unknown comes up
- GIVEN the user says they do not know whether the billing system can export invoices
- WHEN the skill records that answer
- THEN it becomes an open question for developers in the document, and the skill does not ask the user how the billing system works

### R4. Interviews in numbered rounds until nothing is open  [Must]
The skill SHALL ask every decision that is ready to be asked together in one numbered round, each with its recommendation and a reason, worded so that a plain yes accepts it, and SHALL repeat rounds until no decision is open.
#### Scenario: a round
- GIVEN three decisions are open and none depends on another
- WHEN the skill asks
- THEN one message holds three numbered questions, each with a recommendation
#### Scenario: a dependent decision
- GIVEN the order of two epics depends on whether one of them is in scope
- WHEN the scope is still open
- THEN the order question is not asked in that round

### R5. Finds the reason first  [Must]
WHEN the request does not say why the initiative matters or for whom, the skill SHALL find that out before any numbered round: WHERE `mstack-brainstorm` is installed it SHALL name that skill and ask once whether to switch to it, and otherwise, or on a no, it SHALL ask its own open questions, one per message.
#### Scenario: an unformed idea, no helper skill
- GIVEN no helper skill is installed and the user writes "something for onboarding"
- WHEN the skill answers
- THEN it asks one open question with no options attached, and says it is using its own short version of the brainstorm
#### Scenario: a brief as the source
- GIVEN an Approved design brief is given as the source
- WHEN the skill starts
- THEN the brief's user decisions are not asked again, and its agent's calls are listed again at approval

### R6. Wrap up on request  [Should]
WHEN the user asks to wrap up, the skill SHALL stop asking and SHALL turn every decision not yet asked into either its own call, listed for the user at approval, or an open question for developers.
#### Scenario: wrap up
- GIVEN four decisions are still open
- WHEN the user writes "wrap up"
- THEN the document is written, and the approval message lists the four items as the skill's calls or as open questions

### R7. No development content  [Must]
The skill SHALL write no code, technical design, task list or estimate in hours or days into the document, and IF the user offers a solution, THEN the skill SHALL record it in one optional line named as an idea the team already has.
#### Scenario: the user names a technology
- GIVEN the user says "we should build it with a queue"
- WHEN the document is written
- THEN that sentence appears only under the ideas line of the epic it belongs to, and no requirement in the document depends on it

### R8. The user's language  [Must]
The skill SHALL write the document in the language the user answers in and SHALL keep the fixed headings in English.
#### Scenario: a Spanish interview
- GIVEN the user answers in Spanish
- WHEN the document is written
- THEN its text is Spanish and its headings match the format file exactly

### R9. A review before approval  [Must]
WHEN the document is written, the skill SHALL have it reviewed read-only before it asks for approval, without asking the user whether to review, and at most twice per document.
#### Scenario: Claude Code with the Codex reviewer installed
- GIVEN the cross-vendor reviewer is available
- WHEN the document is written
- THEN that reviewer reads it, and a `Review:` line under the Status line records the reviewer and that the review was cross-vendor
#### Scenario: a host without a second vendor
- GIVEN no cross-vendor reviewer is available
- WHEN the document is written
- THEN a fresh read by the same vendor's model reviews it (a subagent where the host has one, otherwise the skill's own second read against the checklist), and the `Review:` line records that the review was same-vendor

### R10. The review checks usability, not the product  [Must]
The review SHALL check whether a developer could write a spec from the document (every section filled; a measurable result and an in-and-out line for each epic section of a product plan; acceptance statements and a measurable result in a detailed epic; no prescribed solution, no development content, no two parts that contradict, a reason for the order) and SHALL NOT judge whether the initiative or its priorities are right.
#### Scenario: an epic without acceptance
- GIVEN an epic with no acceptance statement
- WHEN the review runs
- THEN a finding names that epic and what is missing
#### Scenario: the reviewer disagrees with a priority
- GIVEN the reviewer says another epic should come first
- WHEN the skill processes the findings
- THEN the order is unchanged, and the finding is listed for the user as a product decision

### R11. Findings are verified, not obeyed  [Must]
WHEN the review returns findings, the skill SHALL verify each against the document and its sources, fix gaps of fact itself, and keep every product decision for the user, by loading `mstack-receive-review` WHERE it is installed and otherwise by those rules.
#### Scenario: a wrong finding
- GIVEN a finding says an epic has no measurable result, and the epic has one
- WHEN the skill processes it
- THEN the document is unchanged and the finding is logged as rejected with the line that disproves it

### R12. Approval is an explicit yes to the written document  [Must]
The skill SHALL mark a document Approved only after the user's explicit yes to the written document, given after the review, and WHEN an approved document is edited, the skill SHALL set it back to Draft.
#### Scenario: agreement before the document exists
- GIVEN the user says "sounds good" during the interview
- WHEN the document is written
- THEN its Status line says Draft, and the skill asks for approval of the file
#### Scenario: silence
- GIVEN the user does not answer the approval question
- WHEN the session ends
- THEN the Status line still says Draft

### R13. Saves where the user can find it  [Must]
The skill SHALL save the document at a place the user named, otherwise in a repository under one folder per initiative, otherwise in the current folder, and SHALL tell the user the path.
#### Scenario: in a repository, no place named
- GIVEN a repository and no place named
- WHEN the product plan is written
- THEN it is saved as `product-plan.md` in a dated folder for that initiative under the repository's product documents, and the path is shown
#### Scenario: an existing file
- GIVEN a file already exists at the path
- WHEN the skill is about to write
- THEN it shows what is there and writes nothing until the user says yes

### R14. A host that cannot save  [Must]
IF the host cannot save a file, THEN the skill SHALL print the whole document in the chat, say that it was not saved, and apply the review and the approval to that text.
#### Scenario: no file access
- GIVEN a host with no way to write a file
- WHEN the document is ready
- THEN the chat holds the full document and one line saying it was not saved, and no message claims a path

### R15. Works without helper skills  [Must]
IF a helper skill the skill would use is not installed, THEN the skill SHALL do a short built-in version of that step, say in one line that it did, and SHALL NOT stop, print install commands as a condition, or install anything.
#### Scenario: nothing else installed
- GIVEN a host with only this skill
- WHEN the user asks for a product plan
- THEN the run reaches the approval question, and each built-in step was announced once
#### Scenario: no model skill
- GIVEN `mstack-best-model-for` is not installed
- WHEN the review needs a model
- THEN the host's default model is used, and the skill says so

### R16. Commits nothing  [Must]
The skill SHALL NOT commit, push, open a pull request, or send the document anywhere except to the reviewer of R9, and SHALL say in one line which reviewer reads the document before the review starts.
#### Scenario: after approval
- GIVEN an approved document in a repository
- WHEN the skill ends
- THEN the file is uncommitted, and the skill offers the next step without taking it

### The product plan

### R17. The initiative part  [Must]
`mstack-product-plan` SHALL write an initiative part with these sections: the problem and its evidence, who it is for, the outcome and how it is measured, what is out, fixed limits (dates, budget, legal), and risks and assumptions.
#### Scenario: all sections present
- GIVEN a finished interview
- WHEN the product plan is written
- THEN each of the six sections has content, or the word "None" with a reason
#### Scenario: no evidence
- GIVEN the user has no evidence for the problem
- WHEN the product plan is written
- THEN the evidence line reads "no evidence yet", and the review reports it as a gap

### R18. Epic sections  [Must]
`mstack-product-plan` SHALL write one section per epic with: its outcome, who it is for, what is in and out, one measurable result, a rough size, its dependencies on other epics, and its open questions for developers.
#### Scenario: a result that cannot be measured yet
- GIVEN the user cannot name a measure for one epic
- WHEN the product plan is written
- THEN that epic's result reads "not measurable yet", followed by the reason
#### Scenario: the size
- GIVEN the user says an epic is worth about a quarter of the team's effort
- WHEN the product plan is written
- THEN the size is one of small, medium or large with a one-line reason, and no number of hours or days appears

### R19. The order  [Must]
`mstack-product-plan` SHALL place every epic under now, next or later, with a one-line reason for each, and SHALL use no scoring formula.
#### Scenario: five epics
- GIVEN five agreed epics
- WHEN the product plan is written
- THEN each appears under exactly one of the three groups with its reason

### R20. At most nine epics  [Should]
WHEN an initiative has more than nine epics, `mstack-product-plan` SHALL propose splitting it into two product plans, and IF the user refuses, THEN it SHALL continue with all of them.
#### Scenario: eleven epics
- GIVEN the interview produced eleven epics
- WHEN the skill counts them
- THEN it proposes a split and names which epics would go where
#### Scenario: the user refuses
- GIVEN that proposal
- WHEN the user says no
- THEN one product plan with eleven epics is written

### The epic

### R21. Starts from one epic  [Must]
WHEN the user names an epic of a product plan, `mstack-epic` SHALL read that plan and treat the epic section's content as settled, and WHEN the user describes an epic with no product plan, `mstack-epic` SHALL interview it from the start.
#### Scenario: from a product plan
- GIVEN an approved product plan with an epic about invoices
- WHEN the user asks to detail that epic
- THEN the skill does not ask again who the epic is for or what its outcome is
#### Scenario: from chat
- GIVEN no product plan
- WHEN the user describes one epic
- THEN the skill interviews it and writes an epic that names no product plan

### R22. A Draft product plan needs a yes  [Must]
IF the product plan is not Approved, THEN `mstack-epic` SHALL say so and continue only after the user's explicit yes, and SHALL record in the epic's `Source:` line that it was written from an unapproved plan.
#### Scenario: a Draft plan
- GIVEN a product plan whose Status is Draft
- WHEN the user asks to detail one of its epics
- THEN the skill asks once before any interview question
#### Scenario: the user says no
- GIVEN that question
- WHEN the user says no
- THEN no epic is written

### R23. The detailed content  [Must]
`mstack-epic` SHALL write an epic with: the outcome, who it is for, what is in and out, acceptance as plain statements a product person can check, one measurable result, the rough size, fixed limits, dependencies, at most five user stories, and open questions for developers.
#### Scenario: acceptance
- GIVEN an agreed behavior
- WHEN the epic is written
- THEN each acceptance statement is one plain sentence about what a named kind of user can do or see, and none uses the words GIVEN, WHEN or THEN
#### Scenario: no open questions
- GIVEN the user answered everything
- WHEN the epic is written
- THEN the open questions section reads "None"

### R24. Never edits the product plan  [Must]
`mstack-epic` SHALL NOT change the product plan, and WHEN the interview changes what the plan said about the epic, it SHALL list each difference at the top of the epic.
#### Scenario: the scope shrinks
- GIVEN the plan puts invoice export in scope and the interview moves it out
- WHEN the epic is written
- THEN a line near the top names that difference, and the product plan file is byte-for-byte unchanged

### The spec skill

### R25. An approved epic is a settled source  [Must]
WHEN the source of `mstack-write-specs` is an Approved epic, `mstack-write-specs` SHALL treat its outcome, scope, acceptance, measurable result and fixed limits as settled decisions, SHALL add its open questions for developers to the interview, and SHALL carry its size as context only; it SHALL recognize the epic by its opening line and find each part by the heading the format file fixes, and IF a fixed heading is missing, THEN it SHALL ask that part as an open decision.
#### Scenario: an approved epic
- GIVEN an Approved epic with four acceptance statements and one open question for developers
- WHEN the developer starts the spec from it
- THEN the first round does not ask what is in scope, and it includes the open question
#### Scenario: a Draft epic
- GIVEN an epic whose Status is Draft
- WHEN it is given as the source
- THEN the spec skill says it is not approved, and asks its decisions like any other open decision

### R26. A product plan is not a spec source  [Should]
WHEN the source of `mstack-write-specs` is a product plan, `mstack-write-specs` SHALL say that a spec starts from one epic, name `mstack-epic`, and continue only with one epic section the user picks, as context that is not settled.
#### Scenario: a whole plan given
- GIVEN a product plan with six epics
- WHEN it is given as the source
- THEN the spec skill asks which epic, and does not write one spec for all six

### Obsidian

### R31. A vault is a source and a place to save  [Must]
WHEN the working folder or a folder the user names is an Obsidian vault, the skill SHALL read the vault's notes as sources, as it reads a repository's documents, and SHALL ask where in the vault to save the document.
#### Scenario: started in a vault
- GIVEN a working folder that is a vault holding notes about the initiative
- WHEN the skill starts
- THEN its first message says which notes it read and that it found a vault, and asks where in the vault the document goes
#### Scenario: not a vault
- GIVEN a working folder that is not a vault
- WHEN the document is written
- THEN it contains no Obsidian link and no properties block

### R32. Obsidian links inside a vault  [Must]
WHILE the document is saved in a vault, the skill SHALL write the links between a product plan and its epics as Obsidian links, the plan to the note of each epic and each epic back to its plan, and SHALL write plain paths everywhere else.
#### Scenario: an epic detailed in a vault
- GIVEN a product plan saved in a vault
- WHEN `mstack-epic` writes one of its epics into the same vault
- THEN the epic links to the plan with an Obsidian link, and the product plan file is unchanged
#### Scenario: the plan lists its epics
- GIVEN a product plan written in a vault with four epics
- WHEN it is saved
- THEN each epic section carries an Obsidian link to the note its detailed epic will have

### R33. Properties inside a vault  [Must]
WHILE the document is saved in a vault, the skill SHALL start it with a properties block that holds its type and status, for an epic its size, and for an epic that comes from a product plan its order and a link to that plan, SHALL write that block and the `Status:` line together with the same status, and SHALL keep the title line as the first heading.
#### Scenario: approval in a vault
- GIVEN a Draft document in a vault
- WHEN the user approves it
- THEN the status in the properties block and the `Status:` line both say approved
#### Scenario: the two disagree
- GIVEN a document whose properties say approved and whose `Status:` line says Draft
- WHEN `mstack-write-specs` reads it
- THEN it treats the document as a Draft

### R34. Ready to paste when the vault cannot be reached  [Should]
IF the host cannot save into the vault and the user says the document goes into Obsidian, THEN the skill SHALL print the document with its properties block and Obsidian links, and say that it was not saved.
#### Scenario: a desktop app
- GIVEN a host with no file access and a user who keeps notes in Obsidian
- WHEN the document is ready
- THEN the printed text starts with the properties block and can be pasted into a new note unchanged

### Packaging

### R27. One self-contained folder per skill  [Must]
Each skill folder SHALL hold everything the skill uses, name host tools only in a host table in its `SKILL.md` with a column for each of the four hosts, keep the shared files of R28 free of host tool names, name other skills without pointing at their files, and contain no model name.
#### Scenario: installed alone
- GIVEN only the `mstack-epic` folder is copied to a host
- WHEN the skill runs
- THEN no step fails for a missing file

### R28. Shared files are identical copies  [Must]
The document format file SHALL ship as identical copies in `mstack-product-plan`, `mstack-epic` and `mstack-write-specs`, the interview rules and the review steps SHALL ship as identical copies in the two new skills, and the repository's marketplace check SHALL fail when a copy differs or is missing.
#### Scenario: one copy edited
- GIVEN the format file is changed in one skill only
- WHEN the marketplace check runs
- THEN it fails and names the file and the skills

### R29. Packaged like the other plugins  [Must]
Each new skill SHALL ship as its own plugin for Claude Code and Codex, with both manifests, both registry entries, a copy of the license, a notices file that credits every adapted source, and eval cases.
#### Scenario: the checks
- GIVEN the finished branch
- WHEN the version check and the marketplace check run
- THEN both pass, with 17 Claude plugins and 16 Codex plugins

### R30. The rest of the repository stays true  [Must]
The change SHALL update every place that lists the mstack skills or states a rule this work changes: the README (table, install lists, how the skills fit together, how to upload a skill to the two desktop apps and that they are untested there, the Credits table), `AGENTS.md` (the built-in versions as an exception for these two skills, and the shared format file), `mstack-setup`, `mstack-find-skills`, `mstack-skill-creator` and `mstack-chief-of-staff`.
#### Scenario: the sweep
- GIVEN the finished branch
- WHEN the repository is searched for each place that names `mstack-explain-me-better` in a list of skills
- THEN each such list also names the two new skills, or the report says why not

## Success metrics

- Metric: a product person reaches an approved product plan without help. Target: a product person does so on first use. Threshold: one run in Claude Code or Codex and one in a desktop app. Measured by: the user's report. Checked: after the first use following the merge.
- Metric: a spec started from an approved epic asks no product decision again. Target: zero repeated questions in the eval case. Measured by: the eval's grader. Checked: before the merge.

## Constraints and assumptions

- Claude desktop custom skills: the skill folder is the root of the uploaded ZIP and has the skill's name; `name` is at most 64 characters of lowercase letters, numbers and hyphens and contains neither "claude" nor "anthropic"; code execution must be on (Anthropic's help article "Using skills in Claude" and its platform overview of agent skills, read 2026-11-12 by a lookup). Those two pages disagree on the description limit, 200 or 1,024 characters, so the descriptions stay within 200.
- ChatGPT desktop: a skill needs `SKILL.md` with `name` and `description`; an `agents/openai.yaml` file is optional (OpenAI's "build skills" page, read 2026-11-12 by a lookup). The upload steps come from search snippets only, because the help article refused the lookup.
- The question about further sources is asked in the first message, except when the reason for the initiative is not known yet: then the first message holds only the open question of R5, and the sources question comes with the first numbered round. (agent's call, after the comparison test showed two questions in one message)
- No vendor page confirmed that a skill in either desktop app can read attachments, save a file or call another skill. R14 and R15 cover both outcomes.
- Licenses read 2026-11-12: Anthropic's `write-spec` in `anthropics/knowledge-work-plugins`, Apache-2.0; BMAD Method in `bmad-code-org/BMAD-METHOD`, MIT, with a trademark notice on its names; `prd-development` in `deanpeters/Product-Manager-Skills`, CC BY-NC-SA 4.0, which does not fit this repository, so no text is taken from it. Shape Up and opportunity solution trees are used as ideas only, in this project's words.
- The research's interview findings come from preprints with simulated users; the skills use them as guidance (several rounds, a list of interviewer mistakes, a checklist review, visible open questions).
- `AGENTS.md`: a skill folder holds everything it uses; no personal or company data; model names only in `mstack-best-model-for`; a shared skill is called, not restated. The built-in versions of R15 are an exception to the last rule, and `AGENTS.md` records it.
- Header lines, in this order under the title: `Status:` (the forms `Draft` and `Approved <yyyy-mm-dd> (approved in chat by the user)`, as in the design brief), `Review:` (reviewer, cross-vendor or same-vendor, round and verdict) and `Source:` (what the document was written from; for an epic, the product plan's path and whether it was approved). The spec skill reads only the opening line and the Status line to decide whether a document is settled. (agent's call: separate lines keep the Status forms unchanged)
- Default places in a repository: a product plan at `docs/product/<yyyy-mm-dd>-<slug>/product-plan.md`, its detailed epics beside it as `epics/<nn>-<slug>.md` where `<nn>` is the epic's number in the plan, and an epic with no product plan at `docs/product/epics/<yyyy-mm-dd>-<slug>.md`. (agent's call)
- The shared interview rules and review steps of R28 are the built-in versions of R15, written for a product interview with their own coverage list; they are not copies of `mstack-write-specs`'s or `mstack-receive-review`'s rules, and the `AGENTS.md` exception names them.
- When `mstack-brainstorm` runs, it writes and gets approval for its own design brief by its own rules; the product plan then takes that brief as its source. (agent's call: a skill cannot be run halfway)
- The review sends the document to the reviewer the user installed and logged in to, without asking, as `mstack-plan` does; the user accepted that the review always runs (round 2).
- Obsidian: a properties block is valid YAML between two `---` lines and must start on the first line of the note; an Obsidian link inside a property is written in double quotes (Obsidian's help and forum pages, found by a web search 2026-11-12). A vault is recognized by an `.obsidian` folder at its top (the agent's own knowledge, not confirmed by that search; to be confirmed against Obsidian's help in the plan). The properties block comes before the title line, so the title stays the first heading and the header lines stay under it.
- New plugins `mstack-product-plan` 0.1.0 and `mstack-epic` 0.1.0. Marketplace 0.7.1 rises to 0.8.0, because plugins are added. `mstack-write-specs` 0.3.3 to 0.4.0. `mstack-setup` 0.2.4 to 0.2.5, `mstack-find-skills` 0.2.3 to 0.2.4, `mstack-skill-creator` 0.3.3 to 0.3.4 and `mstack-chief-of-staff` 0.1.2 to 0.1.3, because they list the mstack skills (the files that name `mstack-explain-me-better`, searched 2026-11-12).
- The spec has 34 requirements, above the usual 25. It is not split, because the two skills share twenty of them and ship in one pull request. (agent's call)

## Decisions

D1. Two skills, `mstack-product-plan` and `mstack-epic`. Alternatives: one skill with all detail in one document; a product mode inside the existing skills. Decided by: user. Source: brief.
D2. Four hosts, the desktop apps as a best effort. Decided by: user. Source: brief.
D3. Helper skills are optional, with short built-in versions. Alternative: stop and name `mstack-setup`, which a desktop user cannot act on. Decided by: user. Source: brief.
D4. A review by the other vendor's model before approval, a same-vendor read where none is available. Alternative: also a start file and a status table. Decided by: user. Source: brief.
D5. Epics ordered as now, next and later; one measurable result each; no scoring. Decided by: user. Source: brief.
D6. Sources: the repository's documents without asking, then one question. Decided by: user. Source: brief.
D7. The initiative's six sections. Decided by: user. Source: round 1.
D8. A split is proposed above nine epics. Decided by: user. Source: round 1.
D9. Acceptance as plain statements. Alternative: GIVEN, WHEN, THEN, which is the developer's form. Decided by: user. Source: round 1.
D10. `mstack-epic` never edits the product plan and lists differences. Alternative: update the plan, which makes two writers of one file. Decided by: user. Source: round 1.
D11. The user's language, English headings. Decided by: user. Source: round 1.
D12. Descriptions within 200 characters. Alternative: up to 1,024, at the risk of a refused upload. Decided by: user. Source: round 2.
D13. The review checks usability only, always runs, at most twice. Decided by: user. Source: round 2.
D14. A host that cannot save prints the document. Decided by: user. Source: round 2.
D15. Missing evidence is recorded and does not stop the work. Decided by: user. Source: round 2.
D16. A Draft product plan needs one yes. Decided by: user. Source: round 2.
D17. Two plugins that share reference files as checked copies. Alternatives: one plugin with two skills; no shared files. Decided by: user. Source: approaches message.
D18. The second skill is named `mstack-epic`. Decided by: agent's call. Source: brief.
D19. A rough size per epic, advisory, and no prescribed solution; ideas go in one optional line. Decided by: agent's call. Source: brief; the research's clearest boundary between product and engineering work.
D20. The documents open with `# Product plan: <title>` and `# Epic: <title>` and a Status line in the brief's forms. Decided by: agent's call. Source: brief.
D21. An approved epic's content is settled in the spec skill, and nothing is mapped mechanically. Alternative: map acceptance statements to scenarios, which needs a parsing contract. Decided by: agent's call. Source: brief.
D22. Open questions for developers are whatever the product person does not know or decide; feasibility is never asked. Decided by: agent's call. Source: brief.
D23. `mstack-epic` accepts an epic described in chat. Decided by: agent's call. Source: brief.
D24. Wrap up turns unasked decisions into listed calls or open questions. Decided by: agent's call. Source: the spec skill's own rule.
D25. The user is not asked for a reviewer model; it comes from `mstack-best-model-for` or the host's default. Alternative: ask, as `mstack-plan` does, which a manager cannot answer. Decided by: agent's call.
D26. The short epic section and the detailed epic differ: acceptance statements, user stories and fixed limits appear only in the detailed epic. Alternative: every field in both, which makes the product plan long and repeats content. Decided by: agent's call.
D27. A product plan given to the spec skill is not a source; the skill asks for one epic. Decided by: agent's call.
D28. Where files go without a named place: one dated folder per initiative under the repository's product documents, with detailed epics beside the plan; outside a repository the current folder. Decided by: agent's call. Source: brief.
D30. Obsidian support means a vault as a source and a place to save, found by itself. Alternative: the skills as a host inside Obsidian. Decided by: user. Source: round 3.
D31. Inside a vault, the plan and its epics link with Obsidian links; plain paths elsewhere. Decided by: user. Source: round 3.
D32. Inside a vault, each document carries properties (type, status, order, size); the `Status:` line stays the one the spec skill trusts. Alternative: no properties, which loses the overview table a manager can build in Obsidian. Decided by: user. Source: round 3.
D33. Where the vault cannot be reached, the document is printed ready to paste. Decided by: user. Source: round 3.
D34. The product plan links to each epic's future note when it is written, so `mstack-epic` never has to edit the plan to add a link. Decided by: agent's call. Source: D10.
D29. `mstack-write-specs` rises to 0.4.0, because it gains a source type. Decided by: agent's call.

## Risks

- A desktop app may not load or run the skills as documented -> they are a stated best effort, the README says untested, and the user's upload test decides further work.
- A description of 200 characters may load the skill less often in Claude Code and Codex -> the user can name the skill, and the eval includes a loading case.
- The built-in versions drift from the helper skills' rules -> they are short, each names the helper skill it stands in for, and `AGENTS.md` records the exception.
- A same-vendor review misses more than a cross-vendor one -> the document records which kind it had.
- Three plugins read one format -> identical copies with a failing check (R28).

## Verification

- R1 to R8, R17 to R24: eval cases built with `mstack-skill-creator`, run with and without the skill, including one with no repository and one with no helper skill installed; graded on the written document and the transcript.
- R9 to R11: an eval case with a seeded gap (an epic without acceptance) and one with a seeded wrong finding.
- R12, R13, R16: an eval case that checks the Status line, the path and `git status` after the run.
- R14: cannot be forced in a command-line host; checked by reading the skill text, and by the user's desktop test. Stated as untested until then.
- R15: an eval case in a home folder with no other skill.
- R31 to R33: eval cases in a folder with an `.obsidian` folder and two notes, graded on the links, the properties block and the unchanged plan file; one case outside a vault that expects neither. R34 is checked like R14.
- R25, R26: eval cases for `mstack-write-specs` with an Approved epic, a Draft epic and a whole product plan as the source.
- R27: the skill creator's static check and private-data scan on both folders.
- R28, R29: `node scripts/check-marketplace.mjs` and `node scripts/check-version-bumps.mjs`, plus a test that changes one copy and expects the failure.
- R30: the outside-the-diff sweep of `AGENTS.md`, reported file by file.
- Not covered by any scenario: an initiative with one epic (expected: a product plan with one epic, and a hint that `mstack-epic` alone would do); two epics that depend on each other (expected: the review reports the cycle); a document written by a later format version (expected: the spec skill treats unknown headings as context).

## Open questions

- Do both desktop apps load and run the skills? Owner: the user, by an upload test. Can wait because: the folder format is the same on all four hosts, and the README states the limit.
- Which plans of the ChatGPT desktop app offer custom skills? Owner: the user. Can wait because: it changes a README sentence only.

## Appendix: interview record

- 2026-11-12 Evidence: brief `docs/briefs/2026-11-12-product-plan-skills.md`, Approved / Decision: its user decisions are settled (D1 to D6) and its agent's calls are carried (D18 to D23, D28).
- 2026-11-12 Q: the initiative's sections / Recommended: six sections / Decision: accepted (D7).
- 2026-11-12 Q: a limit of nine epics with a proposed split / Recommended: yes / Decision: accepted (D8).
- 2026-11-12 Q: acceptance as plain statements / Recommended: yes / Decision: accepted (D9).
- 2026-11-12 Q: `mstack-epic` leaves the product plan untouched / Recommended: yes / Decision: accepted (D10).
- 2026-11-12 Q: the user's language with English headings / Recommended: yes / Decision: accepted (D11).
- 2026-11-12 Q: descriptions within 200 characters / Recommended: yes / Decision: accepted (D12).
- 2026-11-12 Q: the review checks usability only / Recommended: yes / Decision: accepted (D13).
- 2026-11-12 Q: print the document when the host cannot save / Recommended: yes / Decision: accepted (D14).
- 2026-11-12 Q: missing evidence does not stop the work / Recommended: yes / Decision: accepted (D15).
- 2026-11-12 Q: a Draft product plan needs a yes / Recommended: yes / Decision: accepted (D16).
- 2026-11-12 Q: Obsidian support as a vault to read from and save into, found by itself, with Obsidian links, properties and a paste-ready printout / Recommended: yes to all five / Decision: accepted (D30 to D33).
- 2026-11-12 Q: how the skills share their rules / Recommended: checked copies / Decision: accepted (D17).
- 2026-11-12 Evidence: vendor pages on desktop skills, by a lookup / Decision: name rules, ZIP layout, description limit conflict, optional `agents/openai.yaml`.
- 2026-11-12 Evidence: four license files, by a lookup / Decision: adapt from the Apache-2.0 and MIT sources only.
- 2026-11-12 Evidence: `.claude-plugin/marketplace.json` and a search for the files that list the mstack skills / Decision: the versions in Constraints.
