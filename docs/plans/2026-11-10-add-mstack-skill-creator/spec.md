# Add mstack-skill-creator, a skill that creates and improves skills on four hosts

Status: Approved 2026-11-10 (approved in chat by the user)
Size: full    Mode: gated    Type: feature
Source: conversation 2026-11-09 and 2026-11-10. The user asked for a skill creator that follows the workflow used to build the mstack skills, works from Claude Code, Codex, OpenCode and Cursor, and is then used to build new mstack skills and local skills.

## Problem

Every mstack skill so far was built by hand through the same long workflow (research, interview, writing, packaging, checks, comparison tests, a cross-vendor review, version bumps), and the workflow lives only in the maintainer's sessions, so each new skill repeats it from memory and a missed step ships a defect. The existing skill creators do not close the gap. Anthropic's needs `claude -p` and subagents for its tests and optimizer, the Codex one validates only by static linting, Cursor's built-in creator has no test step, and OpenCode has no creator (research notes of 2026-11-10, cited in the appendix). Someone who works on more than one host gets a different process and a different quality bar on each.

## Goals

1. A contributor can build a new mstack plugin skill that passes both repository checks on the first run of those checks, without knowing the packaging rules.
2. A user of any of the four hosts can create a local skill and see evidence, from a comparison test, that an agent does the task better with the skill than without it.
3. A skill created once is found and loaded by all four hosts without a per-host rewrite.
4. An existing skill can be improved with the same process, with evidence that the new version is not worse than the old one.

## Non-goals

- Creating rules, commands, subagents, hooks or plugins of other kinds. Each has a different format on each host, and they can be a later spec.
- Making the other seven mstack skills run on Cursor and OpenCode. That would roughly triple this change, so it is a separate spec.
- Cursor or OpenCode plugin manifests and registries in the mstack repository. Both hosts load the folder the skills CLI installs into, so manifests add work and no reach.
- A verbatim copy of any host's whole skill creator. The repository's rules require adapted guidance to be rewritten, and one of the four sources has no license.
- An automated description optimizer on hosts other than Claude Code. The copied tool depends on `claude -p`.
- Publishing a created skill to a public registry.

Anti-goals, which count as failure even when everything runs:

- A created skill that works on the host it was written on and silently fails to load, or to trigger, on another.
- A skill reported as finished with no comparison test behind it.
- Personal or company data from the author's machine in a skill written into a public repository.
- A process so heavy for a small local skill that users go back to writing the file by hand.

## Users and scenarios

1. As an mstack maintainer on Claude Code or Codex, I want to turn a skill idea or a triaged issue into a finished plugin, so that the registries, manifests, license, notices, README row, version bumps and checks are right without my remembering them.
2. As a developer on Cursor or OpenCode, I want to create a skill for my own repository, so that I get a tested skill even though my host has no creator with a test step.
3. As a developer who uses more than one host, I want one skill folder that all of them load, so that I do not maintain several copies.
4. As the author of an existing skill, I want to improve it and compare the new version with the old one, so that a change that makes it worse is caught before it ships.
5. As a user with ten minutes, I want a short required path for a small local skill, so that the optional steps do not block me.

## Requirements

Terms used below. The **skill creator** is the new skill. The **created skill** is the skill it writes or improves. The **target** is where the created skill goes, either a **plugin target** (a repository laid out like mstack) or a **local target**. The **comparison test** runs the same task once with the created skill and once against a **baseline**. A **supported host** is Claude Code, Codex, OpenCode or Cursor.

### R1. Target detection and confirmation  [Must]
WHEN a session starts creating or improving a skill, the skill creator SHALL detect whether the current repository is a plugin target and SHALL ask the user to confirm the target before it writes any file.
#### Scenario: plugin repository
- GIVEN a repository that has both a Claude Code registry and a Codex registry listing plugin folders
- WHEN the user asks for a new skill
- THEN the skill creator proposes the plugin target and waits for the user's answer
#### Scenario: no confirmation
- GIVEN the user has not answered the target question
- WHEN the skill creator would write the first file
- THEN it does not write, and no file of the created skill exists

### R2. Check for an existing skill  [Must]
WHEN the purpose of the created skill is known, the skill creator SHALL search the skills installed on the machine and the skills in the target repository for one that already does the job, and SHALL report what it found before writing.
#### Scenario: a match exists
- GIVEN an installed skill whose description covers the requested job
- WHEN the check runs
- THEN the skill creator names that skill and asks whether to use it, improve it or create a new one
#### Scenario: nothing found
- GIVEN no installed or repository skill covers the job
- WHEN the check runs
- THEN the report states where it looked, and the skill creator does not claim that no such skill exists anywhere

### R3. Public search is optional  [Could]
WHERE the user accepts a public search, the skill creator SHALL search the public skills registry and SHALL list the results with their install counts.
#### Scenario: declined
- GIVEN the user declines the public search
- WHEN the existing-skill check runs
- THEN no network request is made for it

### R4. Required path for a local target  [Must]
WHEN the target is local, the skill creator SHALL complete the interview, the existing-skill check, the written skill, the static check and one comparison test before it reports the created skill as finished.
#### Scenario: all required steps done
- GIVEN a local target and a user who declined every optional step
- WHEN the skill creator reports the result
- THEN the report shows the outcome of the static check and of the comparison test
#### Scenario: comparison test not run
- GIVEN the comparison test could not be run by any method in R14, or its prompt was handed to the user and no result has come back
- WHEN the skill creator reports the result
- THEN the report says the created skill is untested, and does not call it finished

### R5. Optional steps offered once  [Should]
WHEN the target is local, the skill creator SHALL offer the optional steps (web research, a written spec and plan, a cross-vendor review, the benchmark and review page) in one question at the start, and SHALL run only the ones the user accepted.
#### Scenario: one question
- GIVEN a local target
- WHEN the session starts
- THEN the optional steps appear together in a single question, and the skill creator does not ask about them again unless the user brings one up

### R6. Full workflow for a plugin target  [Must]
WHEN the target is a plugin target, the skill creator SHALL run every step of the workflow (research, spec, plan, writing, packaging, static check, comparison tests, cross-vendor review, version bumps and the repository's checks) and SHALL report each step's outcome.
#### Scenario: a step is skipped
- GIVEN a plugin target and a step that could not run
- WHEN the skill creator writes its report
- THEN the step is listed as not run with the reason, and the created skill is not reported as ready to commit

### R7. Use of mstack skills  [Must]
WHEN a step is covered by an installed mstack skill that supports the current host, the skill creator SHALL run that skill for the step instead of its own version.
#### Scenario: skill installed
- GIVEN the spec-writing mstack skill is installed on Claude Code
- WHEN the workflow reaches the spec step
- THEN that skill runs, and the report names it
#### Scenario: skill installed but host unsupported
- GIVEN an mstack skill is installed on OpenCode, which it does not support
- WHEN the workflow reaches its step
- THEN the skill creator runs its built-in fallback and says so

### R8. Missing mstack skill  [Must]
IF a step's mstack skill is not installed on a host it supports, THEN the skill creator SHALL offer to install it, asking the install route and, for the skills CLI, the scope, the method and the agents, and SHALL run its built-in fallback for that step when the user declines.
#### Scenario: declined
- GIVEN the planning skill is missing and the user declines the install
- WHEN the workflow reaches the plan step
- THEN the built-in fallback runs, and the report says the step used the fallback
#### Scenario: no silent install
- GIVEN a missing mstack skill
- WHEN the user has not accepted the install
- THEN nothing is installed

### R9. Frontmatter of a created skill  [Must]
The skill creator SHALL write a created skill whose frontmatter holds only a name and a description, unless the user asked for a host-only field.
#### Scenario: default
- GIVEN no request for a host-only field
- WHEN the created skill is written
- THEN its frontmatter has exactly two fields, and its name equals its folder name

### R10. Description rule  [Must]
The skill creator SHALL write every description so that it starts with "Use when", states the trigger situations and phrases before anything else, ends with one clause on what the skill produces, contains no summary of the skill's steps, and is at most 1024 characters.
#### Scenario: step summary rejected
- GIVEN a draft description that lists the skill's steps in order
- WHEN the skill creator reviews the description before the comparison test
- THEN it rewrites the description, and the created skill is not reported as finished with the draft description
#### Scenario: wrong opening or length
- GIVEN a description that does not start with "Use when", or is longer than 1024 characters
- WHEN the static check runs
- THEN the check fails and names the rule that was broken

### R11. Host-only field on request  [Should]
WHEN the user asks for a behavior that only some supported hosts provide, the skill creator SHALL add it and SHALL tell the user which supported hosts ignore it.
#### Scenario: a Cursor-only field
- GIVEN the user asks to limit the created skill to files matching a pattern
- WHEN the skill creator adds the field
- THEN its reply names the hosts where the limit has no effect

### R12. Host table in a created skill  [Should]
WHEN the steps of a created skill need a host tool (a question tool, a subagent tool or a reviewer), the skill creator SHALL give the created skill one host table with a column for each supported host the user chose, and SHALL name no host tool outside that table.
#### Scenario: instruction-only skill
- GIVEN a created skill whose steps need no host tool
- WHEN it is written
- THEN it has no host table

### R13. Location of a local skill  [Must]
WHEN the target is local, the skill creator SHALL ask for project or user scope and for the hosts, and SHALL place the created skill where every chosen host loads it.
#### Scenario: all four hosts, project scope
- GIVEN project scope and all four hosts
- WHEN the created skill is placed
- THEN Codex, Cursor and OpenCode find it in the shared agents skills folder of the repository, and Claude Code finds it in its own project skills folder
#### Scenario: existing folder
- GIVEN a folder with the same name already exists at the location
- WHEN the skill creator would place the created skill
- THEN it shows what is there and asks, and it does not overwrite the folder without a yes

### R14. Comparison test  [Must]
The skill creator SHALL test a created skill by running at least one realistic task in a fresh context with the skill and once against the baseline, using the host's subagent tool where one exists, the host's non-interactive command where it does not, and a prompt handed to the user as the last resort.
#### Scenario: no subagent tool
- GIVEN a host session without a subagent tool and with a working non-interactive command
- WHEN the comparison test runs
- THEN both runs happen through that command, and the report shows which method was used and the result of each run
#### Scenario: the skill makes no difference
- GIVEN the baseline run does the task as well as the run with the skill
- WHEN the results are compared
- THEN the skill creator tells the user so and asks whether the skill is needed, and does not report an improvement

### R15. Baseline for an improvement  [Must]
WHEN the user asks to improve an existing skill, the skill creator SHALL copy the current version before changing it and SHALL use that copy as the baseline of the comparison test.
#### Scenario: regression
- GIVEN the changed skill does worse than the copy on a test task
- WHEN the results are compared
- THEN the report shows the regression, and the change is not reported as an improvement

### R16. Static check  [Must]
WHEN a created skill is written or changed, the skill creator SHALL run a static check on its folder and SHALL fix every failure, or list it for the user, before the comparison test.
#### Scenario: a file it names does not exist
- GIVEN the created skill's text names a reference or script file that is not in its folder
- WHEN the static check runs
- THEN the check fails and names the missing file
#### Scenario: a clean skill
- GIVEN a created skill that meets every rule
- WHEN the static check runs
- THEN it reports a pass and exits successfully

### R17. Self-contained created skill  [Must]
The skill creator SHALL write a created skill so that everything it uses is inside its own folder or is named as another skill, and never as a path into another install.
#### Scenario: dependency on another skill
- GIVEN a created skill that relies on another skill
- WHEN it is written
- THEN it names that skill and says what to do when it is not installed, and it contains no path outside its folder

### R18. Benchmark and review page  [Should]
WHERE the benchmark step is accepted or the target is a plugin target, the skill creator SHALL produce a benchmark for each configuration (the pass rate, and the time and tokens where the host reports them) and a review page of the outputs.
#### Scenario: the tools cannot run
- GIVEN the machine lacks the runtime the bundled benchmark tools need
- WHEN the benchmark step is reached
- THEN the skill creator grades the runs inline, says the page was not produced and why, and does not fail the whole session

### R19. Cross-vendor review  [Must]
WHEN the target is a plugin target, or the user accepted the review for a local target, the skill creator SHALL get a read-only review of the created skill from a model of another vendor, and SHALL verify each finding against the files before acting on it.
#### Scenario: no other vendor available
- GIVEN no reviewer of another vendor is installed
- WHEN the review step is reached
- THEN the skill creator warns the user, runs the review in a fresh read-only context of the same vendor, and records it as a same-vendor review
#### Scenario: a wrong finding
- GIVEN a finding the files contradict
- WHEN the review is processed
- THEN the finding is rejected with the reason, and no change is made for it

### R20. Plugin packaging  [Must]
WHEN the target is a plugin target, the skill creator SHALL add everything the repository requires of a plugin (manifests, both registry entries, the license copy, the notices file, the README entry and the version changes) and SHALL run the repository's own checks until they pass or the failures are listed for the user.
#### Scenario: checks pass
- GIVEN a finished created skill in a plugin target
- WHEN the repository's checks run
- THEN both pass, and the report quotes their result lines
#### Scenario: a check fails
- GIVEN a repository check that still fails after the skill creator's fixes
- WHEN the report is written
- THEN it shows the failing output, and the created skill is not reported as ready to commit

### R21. Third-party material  [Must]
IF the user asks to base a created skill on text from a source that has no license, THEN the skill creator SHALL copy nothing from it and SHALL say why, and for a licensed source it SHALL record the credit the license requires inside the created skill's folder.
#### Scenario: unlicensed source
- GIVEN the user points at a skill with no license
- WHEN the created skill is written
- THEN no passage of that source appears in it, and the reply explains the reason

### R22. No private data in a public repository  [Must]
WHEN the target is a repository that is public, the skill creator SHALL scan the created skill for names of people and companies, home paths, private hosts and credential shapes before reporting it as finished, and SHALL list every hit.
#### Scenario: a home path
- GIVEN the created skill contains an absolute path under a user's home folder
- WHEN the scan runs
- THEN the path is reported, and the created skill is not reported as finished until it is removed

### R23. No outward action without a request  [Must]
The skill creator SHALL NOT commit, push, open a pull request or publish a created skill unless the user asks for that step.
#### Scenario: finished skill
- GIVEN a created skill that passed every step
- WHEN the skill creator ends its work
- THEN the changes are uncommitted, and the reply offers the next step without taking it

### R24. Native creator of the host  [Could]
WHERE the current host has its own skill creator installed, the skill creator SHALL name it and offer its host-only tools for the steps they cover.
#### Scenario: none installed
- GIVEN a host with no creator of its own
- WHEN the session starts
- THEN no offer is made, and no step depends on one

## Success metrics

- Metric, the share of grader assertions passed in the skill creator's own comparison tests. Target, 90% with the skill. Success threshold, at least 80% with the skill and at least 20 percentage points above the baseline. Measured by the skill's eval cases, run with and without it. Checked before the pull request is opened.
- Metric, a plugin skill built with the skill creator in a fixture repository passes both repository checks. Target and threshold, pass on the first run. Measured by running the two checks on the fixture. Checked before the pull request is opened.
- Metric, hosts on which a created local skill is listed by the host. Target, four of four. Success threshold, four of four, with any host that could not be tested named in the pull request. Measured by one manual run per host. Checked before the pull request is opened.

## Constraints and assumptions

- The mstack repository is licensed Apache-2.0 (root `LICENSE`, read 2026-11-10). Every skill folder carries an identical copy and its own notices file (AGENTS.md).
- Skill folders loaded by each host, from the hosts' documentation fetched 2026-11-10. Cursor loads project `.agents/skills/` and `.cursor/skills/`, user `~/.agents/skills/` and `~/.cursor/skills/`, and the Claude and Codex folders for compatibility. OpenCode loads global `~/.config/opencode/skills`, `~/.claude/skills` and `~/.agents/skills`, and project `.opencode/skills`, `.claude/skills` and `.agents/skills`. Codex loads `.agents/skills` from the working directory up to the repository root and `$HOME/.agents/skills`. Claude Code loads `~/.claude/skills/` and `.claude/skills/`.
- The Agent Skills standard requires `name` (at most 64 characters, lowercase letters, digits and hyphens, equal to the folder name) and `description` (at most 1024 characters).
- Sources that may be copied or adapted, with their licenses checked on 2026-11-10. Anthropic's skill creator, Apache-2.0, license file inside the skill folder, last changed upstream at commit `b9e19e6f44773509fbdd7001d77ff41a49a486c1`. The Codex skill creator, Apache-2.0. superpowers `writing-skills`, MIT. Cursor's built-in `create-skill` has no license and is not copied.
- The repository's marketplace check rejects a second `SKILL.md` inside a skill folder and any `references/` or `scripts/` file named in a skill's text that does not exist. A skill that teaches skill writing has to word its examples so that they pass.
- Non-interactive commands present on the research machine are `claude -p`, `codex exec`, `opencode run` and `cursor-agent -p`. That each of the last two loads a skill from the shared agents folder in that mode is assumed from the documentation and is to be confirmed by the first comparison test on that host (agent's call: the documentation is explicit, and a failed assumption only moves that host to the hand-the-prompt method of R14).
- The copied benchmark tools need Python 3 (their source). The skill creator's own scripts use the runtime the other mstack scripts use (agent's call: one runtime to require).
- On Cursor and OpenCode no mstack skill is supported today, so every delegated step uses the built-in fallback there (host tables of the seven skills, read 2026-11-10).
- The cross-vendor reviewer on Cursor and OpenCode is an agent-bridges plugin when one is installed (decided in Round 1). The skill names it by role and does not require it.

## Decisions

D1. One skill runs the whole workflow, with a short main file and the detail in reference files. Alternatives considered: a separate eval skill, which lost because the creator's test step would fail whenever the second skill was not installed; a thin router to each host's own creator, which lost because OpenCode has none and Cursor's has no test step. Decided by: user. Source: approaches message, 2026-11-10.

D2. The copy of other creators is limited to Anthropic's eval scripts and review page, taken verbatim from the public repository at the pinned commit, with the notice. All guidance is rewritten, one reference file per host. Alternatives considered: full verbatim copies of the two Apache-2.0 creators, which lost because the repository's rules ask for rewritten guidance and the marketplace check rejects a nested skill file. Decided by: user. Source: Round 1, question 1.

D3. Scope is the skill creator on four hosts. The other mstack skills are not widened. Decided by: user. Source: Round 1, question 2.

D4. Cursor and OpenCode users install through the skills CLI only. Alternatives considered: Cursor and OpenCode registries with an install script, which lost because both hosts already load the folder the CLI writes. Decided by: user. Source: Round 1, question 3, and the host documentation.

D5. Two targets, detected and then confirmed. Decided by: user. Source: Round 1, question 4.

D6. A small local skill has a required path and optional steps. A plugin target always runs the full workflow. Decided by: user. Source: Round 1, question 5.

D7. The comparison test uses, in order, the subagent tool, the non-interactive command, and a prompt handed to the user. Decided by: user. Source: Round 1, question 6.

D8. Only `SKILL.md` folders are created. Decided by: user. Source: Round 1, question 7.

D9. One description rule for every host. Alternatives considered: Anthropic's "what plus when, a little pushy" and superpowers' "triggers only". The chosen rule keeps the triggers first and allows one closing clause on the result. Decided by: user. Source: Round 2, question 1.

D10. Default frontmatter is the name and the description. Decided by: user. Source: Round 2, question 2.

D11. Improving an existing skill is in scope. Decided by: user. Source: Round 2, question 3.

D12. The existing-skill check is local, and the public search is optional. Decided by: user. Source: Round 2, question 4.

D13. Created skills target four hosts by default, and a host table appears only when the steps need host tools. Decided by: user. Source: Round 2, question 5.

D14. A local skill for several hosts is written once, into the shared agents skills folder, and linked from the Claude Code skills folder. It is copied where links are not available. Alternatives considered: two independent copies, which lost because they drift. Decided by: agent's call, following what the skills CLI does. Source: the CLI's install code, read 2026-11-10.

D15. A plugin skill ships its eval cases inside its folder, in the case-folder layout the mstack skills already use. For a local skill the cases are kept only when the user ran the benchmark step. Decided by: agent's call, because it matches the seven existing skills. Source: the repository's skill folders.

D16. The static check covers the frontmatter fields, the name and description rules, a warning above 500 lines in the main file, files named but missing, a nested skill file, and host tool names outside the host table. Decided by: agent's call. Source: the Agent Skills standard, the Codex validator and the marketplace check.

D19. The static check script enforces the rules a script can decide (fields, name, the opening words and length of the description, missing files, a nested skill file). Whether a description summarizes the steps is judged by the skill creator when it reviews the description, not by the script. Decided by: agent's call, because no mechanical rule separates a step summary from a list of triggers. Source: the independent read.

D20. A handed-over test prompt counts as a comparison test only once the user has returned its result. Until then the created skill is reported as untested. Decided by: agent's call, from the anti-goal on untested skills. Source: the independent read.

D21. Whether a repository is public is read from the hosting service's command-line tool when one is available, and asked of the user otherwise. An unknown answer is treated as public. Home paths, private hosts and credential shapes are found by a script. Names of people and companies are found by the skill creator, which compares the text with the names it met in the session and in the repository's author settings. Decided by: agent's call. Source: the independent read.

D22. A plugin target is any repository with both registries, not only mstack. The packaging rules and the checks to run are read from that repository's agent instructions and scripts. Where the repository names no check, the report says packaging was not verified by a check. Decided by: agent's call, because the user accepted "an mstack-style repository" in Round 1, question 4. Source: the independent read.

D23. The steps and the mstack skills that cover them are fixed in the skill creator, with the hosts each skill supported on the date of writing. The spec step uses `mstack-write-specs`, the plan step `mstack-plan`, the build with reviews `mstack-codex-review-workflow` on Claude Code and `mstack-claude-review-workflow` on Codex, an interrupted session `mstack-handoff`, a failing script `mstack-diagnose`, and a skill idea taken from a tracker `mstack-backlog-triage`. Alternatives considered: reading each installed skill's host table, which lost because the tables follow no format a reader can rely on. Decided by: agent's call. Source: the host tables of the seven skills.

D24. The benchmark reports the pass rate on every host. Time and tokens are reported where the host returns them and are marked as not available elsewhere. Decided by: agent's call. Source: the independent read.

D17. The new plugin starts at version 0.1.0 and the marketplace version moves from 0.2.1 to 0.3.0. Decided by: agent's call, from the versioning rule in AGENTS.md.

D18. Research inside the workflow uses the host's multi-agent research tool where it exists and plain web search elsewhere. Decided by: agent's call, because only Claude Code has such a tool.

## Risks

- The main file grows past what agents read carefully -> keep it a map of phases and gates, with every detail in a reference file that a phase names, and let the static check warn on its length.
- Host folder rules change, as OpenCode's did between its versions -> state the date and source of each path in the host reference file, and have the comparison test confirm that the host listed the skill.
- The copied Anthropic tools change upstream or break -> they are pinned to one commit, and R18 keeps the session working without them.
- Example paths in the teaching text trip the marketplace check -> word examples so that they do not match the check, and run the check as part of the build.
- Users skip the comparison test because it costs time -> R4 forbids the word "finished" without it, and one task is enough.
- A cross-vendor reviewer is missing on Cursor and OpenCode more often than on the other hosts -> the same-vendor fallback of R19, with the warning.

## Verification

- R1, R2, R4, R5, R9, R10, R13, R14, R16, R23. An eval case on Claude Code that asks for a small local skill in a fixture repository. Graders check the confirmation question, the existing-skill report, the two-field frontmatter, the description shape, the placement, the static check result and the comparison test evidence, and that nothing was committed.
- R6, R7, R8, R17, R20. An eval case in a fixture repository laid out like mstack. Graders check that both repository checks pass on the result and that every workflow step has an outcome in the report.
- R15. An eval case that improves a fixture skill. Graders check that a copy of the old version exists and was used as the baseline.
- R2 (a match exists). An eval case where a fixture skill already covers the request.
- R21. An eval case that points at an unlicensed fixture skill. Graders check that none of its text was copied.
- R22. An eval case whose input contains a home path and a company name, in a fixture marked public.
- R10, R16. Unit self-tests of the static check script on passing and failing fixture folders.
- R3, R11, R12, R18, R19, R24. Read in the session transcript of the cases above, plus one manual run that accepts the benchmark step.
- Four hosts. One manual run per host of the small local case, with the method of R14 that the host allowed, recorded in the pull request with the command, the result and the date.

Input classes no scenario covers, and their expected behavior:

- A request to create something that is not a skill (a rule, a command, a hook). The skill creator says it is out of scope and names what it can do instead.
- A name that breaks the naming rule, or is longer than 64 characters. The skill creator proposes a valid name and asks.
- A target folder the session cannot write to. The skill creator reports the error and writes nothing elsewhere without asking.
- A host that is none of the four. The skill creator says which parts are untested there and continues with the portable path.
- No network. The steps that need it (public search, research, install offers, a reviewer of another vendor) are reported as not run, and the local steps continue.
- An interrupted session. The work continues from the files already written, and the handoff skill is offered when it is installed.

## Open questions

- Do links between the two skill locations work for every chosen host on Windows? Owner: engineering. Can wait because: D14 already falls back to a copy, so the answer changes no requirement.

## Appendix: interview record

- 2026-11-09 Q: how much of the existing mstack skills to reuse / Recommended: call them by name / Decision: the skill creator may reference and use the existing mstack skills.
- 2026-11-10 Evidence: gh api, repository and skill-folder license files / Decision: Anthropic and Codex creators are Apache-2.0, superpowers is MIT; star counts recorded in the research notes.
- 2026-11-10 Evidence: files on the research machine / Decision: Cursor's built-in creator has no license; OpenCode has no creator.
- 2026-11-10 Evidence: cursor.com/docs/context/skills and opencode.ai/docs/skills / Decision: both load the shared agents skills folder at project and user level.
- 2026-11-10 Evidence: skills CLI 1.7.6 install code / Decision: a global install for Cursor, OpenCode and Codex writes only the shared agents folder; Claude Code gets a link.
- 2026-11-10 Evidence: the marketplace check script / Decision: no nested skill file, and named reference and script files must exist.
- 2026-11-10 Evidence: web research run, 24 verified claims / Decision: techniques worth keeping are the paired comparison run, the failing baseline before writing, progressive disclosure, and the existing-skill check before creating.
- 2026-11-10 Q: copy each host's creator / Recommended: copy only Anthropic's eval scripts and viewer, rewrite guidance per host / Decision: accepted.
- 2026-11-10 Q: widen the other mstack skills to four hosts / Recommended: no, reduced path on Cursor and OpenCode / Decision: accepted.
- 2026-11-10 Q: Cursor and OpenCode install route / Recommended: skills CLI only / Decision: accepted.
- 2026-11-10 Q: target / Recommended: detect, then confirm; plugin or local / Decision: accepted.
- 2026-11-10 Q: optional steps for a small local skill / Recommended: research, spec and plan, review and benchmark page optional, offered once / Decision: accepted.
- 2026-11-10 Q: minimum test without subagents / Recommended: the host's non-interactive command, else the user runs the prompt / Decision: accepted.
- 2026-11-10 Q: artifact types / Recommended: skill folders only / Decision: accepted.
- 2026-11-10 Q: description rule / Recommended: "Use when", triggers first, one closing clause on the result, no step summary / Decision: accepted.
- 2026-11-10 Q: default frontmatter / Recommended: name and description only / Decision: accepted.
- 2026-11-10 Q: improve existing skills / Recommended: yes, old version as baseline / Decision: accepted.
- 2026-11-10 Q: existing-skill check / Recommended: local, public search optional / Decision: accepted.
- 2026-11-10 Q: default hosts of a created skill / Recommended: all four, host table only when needed / Decision: accepted.
- 2026-11-10 Evidence: `npx skills find` run without a login / Decision: the public search works and returns install counts.
- 2026-11-10 Q: structure / Recommended: one skill (approach A) / Decision: accepted with the user's approval of the direction.
