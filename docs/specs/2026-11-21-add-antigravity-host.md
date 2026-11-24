# Add Antigravity as a third host for the mstack skills

Status: Approved 2026-11-23
Size: full    Mode: gated    Type: feature
Source: design brief `docs/briefs/2026-11-21-antigravity-host-support.md` (Approved 2026-11-21). This is spec 1 of 3: the host. Spec 2 covers `mstack-vendors`, spec 3 the six workflows. Where the brief and the decisions of 2026-11-23 (D26 to D28 and D34 to D37) disagree, the decisions win.

## Problem

The mstack skills install as plugins in Claude Code and Codex only (one skill, `mstack-skill-creator`, also runs in OpenCode and Cursor through the skills CLI). For a person who works in the Antigravity CLI (`agy`), no plugin of this repository is an Antigravity plugin (`agy plugin validate` reports "no plugin.json found"; `agy plugin install` only gets one in by converting the Claude Code plugin, probed 2026-11-21), and every skill's host table, install message and model advice names two hosts. The repository's checks know two manifests and two registries, so a plugin for Antigravity would fail them or be skipped.

## Goals

1. A person in Antigravity installs any mstack skill covered by this spec with one command and runs it: shown by a passed case of the self-test that a person starts in their own Antigravity session, per skill.
2. The repository's checks catch a missing or broken Antigravity manifest on any machine, with or without `agy`.
3. A skill that needs a model, a subagent, a question to the user or a web page in Antigravity names the Antigravity tool for it, so nobody has to translate from another host's column.
4. A person in Claude Code or Codex sees the same behavior as today, except for the changes this spec marks MODIFIED (R9, R14's result form, R16, R23, R24) and two additions that show there too: the Antigravity line in install messages (R7) and the Antigravity manifest that `mstack-skill-creator` adds (R19).
5. Nobody gets an expensive model assigned to a stage of a plan without having said yes to it.

## Non-goals

- The six workflows, `mstack-vendors`, the reviewer rule, the workflow preflights (ponytail and third-party dependencies there) and the removal of the three old workflows: specs 2 and 3 cover them, because they rest on the host support specified here.
- What spec 3 inherits from this one: the question at run time when a workflow maps a tier to a flagged model, and the workflows' handling of the `Expensive` column and of the `pages not opened` line.
- The reviewer and workflow rows of `mstack-setup` for Antigravity: spec 2 and spec 3 add them with the vendors and workflows they check.
- An Antigravity marketplace file or release archives: Antigravity documents no third-party marketplace, and its binary accepts a `marketplace.json` only with a download address and a checksum per entry (brief, Constraints).
- `agy plugin import`: it imports every Claude Code plugin of the machine at once, not one plugin (probed 2026-11-21), so no skill or document recommends it.
- Persisting ponytail's level in Antigravity: its hooks do not run there (ponytail's install notes).
- Starting or driving an Antigravity session from another agent or a script, for a test, a review or a task, also as a second session from inside a person's own: a person opens Antigravity and uses the skills there (decided by the user, 2026-11-23, D26).

Anti-goals:
- A skill that says it works in Antigravity without a passed case of the Antigravity self-test.
- A check that passes on a machine without `agy` and hides a manifest that is missing or whose name or version is wrong.
- An `mstack-research` answer in Antigravity that cites a page nobody opened as if it had been opened, or page text read in Antigravity by a process that can run commands.
- A privacy check of `mstack-anonymize` that passes because it could not read the trace, or one that reads an Antigravity session's transcript and leaves out a subagent's.
- A document that rests on customer evidence or meeting decisions leaving the session's own model in Antigravity.

## Users and scenarios

1. As a developer who works in the Antigravity CLI, I want to install an mstack skill with one command, so that I can use it without converting anything.
2. As that developer, I want `mstack-setup` to tell me what is missing for Antigravity and install it after one yes, so that I do not find out in the middle of a task.
3. As a contributor to this repository without `agy` installed, I want the checks to still verify the Antigravity manifests, so that I cannot merge a broken one.
4. As a contributor with `agy` installed, I want the checks to run Antigravity's own validator, so that what the loader would skip is caught before a commit.

## Requirements

In this spec, "a covered plugin" is each of the 22 plugins the repository holds today that are not workflow plugins. The three existing workflow plugins, which spec 3 replaces, are not covered, and a plugin that spec 2 or spec 3 adds gets its hosts, its manifests and its evidence from that spec (in spec 3 each workflow ships for its leader's host only); the manifest check reads those host assignments. "The host" of a run is the client the session runs in.

### R1. Antigravity manifest  [Must]
Every covered plugin SHALL ship an Antigravity manifest that carries the plugin's name, its version, its description and its license.
#### Scenario: validator accepts a covered plugin
- GIVEN a machine with `agy`
- WHEN `agy plugin validate` runs on a covered plugin's folder
- THEN it reports no error and lists the plugin's skills
#### Scenario: no logo
- GIVEN a covered plugin without a logo
- WHEN the validator runs
- THEN its logo notice is the only message, and the checks do NOT fail because of it

### R2. Manifest check without agy  [Must]
The marketplace check SHALL fail for a covered plugin that has no Antigravity manifest, and SHALL verify for every Antigravity manifest that its name equals the plugin's folder name, that its version equals the version of the plugin's other manifests, and that its description and license are present.
#### Scenario: versions agree
- GIVEN a plugin whose three manifests carry the same version
- WHEN the marketplace check runs on a machine without `agy`
- THEN it exits 0
#### Scenario: version differs
- GIVEN a plugin whose Antigravity manifest carries another version than its Claude Code manifest
- WHEN the marketplace check runs
- THEN it exits non-zero with a message that names the plugin and the Antigravity manifest, and it does NOT report success
#### Scenario: manifest deleted
- GIVEN a covered plugin whose Antigravity manifest was removed
- WHEN the marketplace check runs
- THEN it exits non-zero and names the plugin, and the plugin's other manifests do NOT satisfy the check
#### Scenario: a plugin another spec assigns to other hosts
- GIVEN a plugin that is not covered and that its own spec assigns to Claude Code only, without an Antigravity manifest
- WHEN the marketplace check runs
- THEN it does NOT fail for the missing Antigravity manifest, and it still checks the manifests of the hosts the plugin is assigned to

### R3. Antigravity's validator in the checks  [Must]
WHERE `agy` is on the machine, the marketplace check SHALL run Antigravity's plugin validator on every plugin with an Antigravity manifest and fail on any validator error.
#### Scenario: validator error
- GIVEN a machine with `agy` and a plugin whose agent file the validator rejects
- WHEN the marketplace check runs
- THEN it exits non-zero and prints the validator's message with the plugin's name
#### Scenario: agy absent
- GIVEN a machine without `agy`
- WHEN the marketplace check runs
- THEN it prints one line saying the validator step was skipped because `agy` was not found, and it does NOT fail for that reason

### R4. Plugins for Antigravity only  [Must]
The marketplace check and the version-bump check SHALL treat a plugin that has only an Antigravity manifest as a plugin: its folder, its manifest and its routing-table row are checked, and its version must be higher than the base branch's when it changed.
#### Scenario: changed without a bump
- GIVEN a plugin with only an Antigravity manifest whose skill text changed on the branch
- WHEN the version-bump check runs
- THEN it exits non-zero and names the plugin, and it does NOT skip the plugin as removed
#### Scenario: routing row
- GIVEN that plugin and a row for it in `mstack-auto`'s routing table
- WHEN the marketplace check runs
- THEN it exits 0

### R5. Host table  [Must]
Every skill of a covered plugin that has a host table SHALL give, in an Antigravity column, the tool for each role the table names, with tool names taken from the dated probes in this spec's Constraints or from what a person saw in their own Antigravity session.
#### Scenario: roles are filled
- GIVEN a skill whose host table names a question tool, a subagent tool, loading a skill and the user skill folders
- WHEN a reader looks up the Antigravity column
- THEN it names `ask_question`, `invoke_subagent` with a model tier, reading the skill's `SKILL.md` with `read_file`, and the folders `~/.gemini/config/skills/`, `~/.gemini/config/plugins/` and the workspace's `.agents/skills/`
#### Scenario: a role Antigravity lacks
- GIVEN a role with no Antigravity tool (opening a page by address)
- WHEN the column is written
- THEN the cell says what the skill does instead, and it is NOT left empty
#### Scenario: a name a person's session shows differently
- GIVEN a tool name in this spec that a person's own Antigravity session shows under another name
- WHEN the column is written
- THEN the session's name is used, and the spec's name is NOT

### R6. Host statements  [Must]
Every description, heading or sentence of a covered plugin that states the hosts a skill works in SHALL add Antigravity to the hosts it already names.
#### Scenario: a skill of two hosts
- GIVEN a description that says the skill works in Claude Code and Codex
- WHEN this spec is built
- THEN it names Claude Code, Codex and Antigravity
#### Scenario: a skill of more hosts
- GIVEN a description that already names four hosts
- WHEN this spec is built
- THEN it names five, and NO host it named before is dropped

### R7. Install lines for a missing skill  [Must]
WHEN a skill of a covered plugin prints install commands for a missing mstack skill, the skill SHALL print an Antigravity line for the plugin route and include `antigravity` among the agents of the skills CLI line.
#### Scenario: missing helper in Antigravity
- GIVEN an Antigravity session without `mstack-best-model-for`
- WHEN a skill that needs it prints its install block
- THEN the block holds a line that installs it with `agy plugin install` from the repository address
#### Scenario: other hosts
- GIVEN the same message in Claude Code
- WHEN it is printed
- THEN the Claude Code and Codex lines are unchanged

### R8. Antigravity models in mstack-best-model-for  [Must]
The model skill SHALL answer a request for the vendor `antigravity` with a model id that carries its effort, the effort, and in its existing "How to set" column both the command-line setting and the subagent tier, for the tiers `cheap`, `standard` and `most capable` and for each task row.
#### Scenario: tiers
- GIVEN a called request with vendor `antigravity` and the three tiers
- WHEN the skill answers
- THEN the rows name `gemini-3.8-flash-medium` (subagent tier `flash`), `gemini-4-hydrogen-medium` (subagent tier `flash`) and `gemini-4-neon-high` (subagent tier `pro`), and the result block has today's columns in today's order, followed only by R23's column
#### Scenario: task rows follow the Claude column
- GIVEN a task row other than the general starting point and code review, whose Claude cell names the cheap tier's model, the standard tier's model, or a model above it
- WHEN the skill answers for `antigravity`
- THEN it names `gemini-3.8-flash-medium`, `gemini-4-hydrogen-medium`, or `gemini-4-neon-high` in that order of cases
#### Scenario: default and review
- GIVEN a request for the general starting point or for a code review
- WHEN the skill answers for `antigravity`
- THEN it names `gemini-4-neon-high`
#### Scenario: unknown vendor
- GIVEN a called request with a vendor the table does not hold
- WHEN the skill answers
- THEN the row says `no model fits` with the reason, and it does NOT substitute another vendor's model

### R9. The vendor values `both` and `all`  [Must]  (MODIFIED: a new value; today's values keep their meaning)
The model skill SHALL answer a called request that names the vendor `both`, or no vendor, for Claude and Codex as it does today, and a request that names the vendor `all` for Claude, Codex and Antigravity.
#### Scenario: an existing caller
- GIVEN a caller that sends `both` and reads two rows per request
- WHEN the skill answers
- THEN it returns two rows per request, and NOT three
#### Scenario: all
- GIVEN a caller that sends `all`
- WHEN the skill answers
- THEN it returns three rows per request, one per vendor
#### Scenario: a caller that needs its own host's row
- GIVEN a covered skill that asks for several vendors and then uses the row of the host it runs in
- WHEN it runs in Antigravity
- THEN it asks for `all`, and it does NOT read a missing row as an answer

### R10. Effort steps for Antigravity  [Should]
WHEN a request for `antigravity` carries a `max effort` limit below the row's effort, the model skill SHALL answer with the same model family at the limit's effort and mark the row as capped, and its "Next step" SHALL name the next effort of the same family before the next family in the order Flash, Hydrogen, Neon, Carbon.
#### Scenario: capped
- GIVEN the tier `most capable` with `max effort: medium`
- WHEN the skill answers for `antigravity`
- THEN it names `gemini-4-neon-medium` and Capped `yes`
#### Scenario: next step
- GIVEN the tier `standard`
- WHEN the skill answers for `antigravity`
- THEN Next step names `gemini-4-hydrogen-high`, then `gemini-4-neon-medium`
#### Scenario: effort the family lacks
- GIVEN a limit the model family has no id for
- WHEN the skill answers
- THEN it takes the family's nearest lower effort, and it does NOT return an id that `agy models` does not list

### R23. Expensive models are flagged  [Must]  (MODIFIED: one new column in the result block, for every vendor)
The model skill SHALL mark in its table which models are expensive for each vendor, and SHALL say in a last column `Expensive` of its result block, `yes` or `no`, whether the model of each row is one of them.
#### Scenario: flagged models
- GIVEN requests whose answers are `fable` and `gpt-6.2-astra`, and requests that name the models `gemini-4-carbon-high` and `gemini-4-argon-high`
- WHEN the skill answers
- THEN each of those rows says Expensive `yes`
#### Scenario: not flagged
- GIVEN requests whose answers are `opus`, `gpt-6.2-sol` and `gemini-4-neon-high`
- WHEN the skill answers
- THEN each row says Expensive `no`
#### Scenario: an existing caller
- GIVEN a caller that reads the columns the block has today
- WHEN the block arrives with the new last column
- THEN every column it read before is in the same place, and NO earlier column changed its name or order

### R24. Asking before an expensive model in a plan  [Must]  (MODIFIED: applies in every host)
WHEN `mstack-plan` would give a phase or a task a tier whose model is flagged as expensive for at least one vendor, or would write a flagged model into the plan's files (the reviewer, or a model the start file names), it SHALL ask the user about that stage in a question of its own, naming the flagged model and the alternative (the next tier down, or the next model down that is not flagged), and SHALL record the expensive choice only after a yes to that question, unless the user named that choice for that stage in the conversation.
#### Scenario: one question per stage
- GIVEN a plan in which two phases would get such a tier, and the user named no model or tier for them
- WHEN `mstack-plan` assigns tiers
- THEN it asks two questions, one per phase, each with the alternative
#### Scenario: declined
- GIVEN the user answers no for a phase
- WHEN the plan is written
- THEN that phase records the next tier down, and the declined tier does NOT appear for it
#### Scenario: no answer
- GIVEN the question is open
- WHEN the user has not answered
- THEN the plan does NOT record the expensive choice, and a default or preselected option does NOT count as a yes
#### Scenario: the user named it
- GIVEN the user named the tier or the reviewer model for that stage in the conversation
- WHEN `mstack-plan` assigns it
- THEN it records it without a further question and notes that the user chose it

### R11. mstack-setup in Antigravity  [Must]
WHEN `mstack-setup` runs in an Antigravity session, it SHALL report the state found for each dependency that applies to Antigravity (node, git, the code index and its connection to Antigravity, ponytail, the covered mstack skills) and, after one yes, install the missing ones at user scope.
#### Scenario: status
- GIVEN an Antigravity session with the code index installed but not connected, and no mstack skill installed
- WHEN `mstack-setup` runs its status step
- THEN the index row says installed, the connection row says missing, and the mstack skills say missing
#### Scenario: nothing before the yes
- GIVEN that status
- WHEN the user has not answered yet
- THEN `mstack-setup` has installed and connected nothing, and it does NOT run `agy plugin import`

### R12. ponytail in mstack-setup for Antigravity  [Must]
WHILE the host is Antigravity, `mstack-setup` SHALL count ponytail as present when its skills are installed there, install it with Antigravity's plugin install from ponytail's repository address, and say once that its hooks do not run in Antigravity.
#### Scenario: skills installed
- GIVEN an Antigravity session with ponytail's skills installed and no hooks
- WHEN the status step runs
- THEN the ponytail row says ok
#### Scenario: missing
- GIVEN an Antigravity session without ponytail's skills
- WHEN the status step runs
- THEN the row says missing and is among the mandatory rows, and setup does NOT report itself complete

### R13. Dependencies without an Antigravity install  [Must]
IF a third-party dependency in `mstack-setup`'s list has no install route for Antigravity, THEN `mstack-setup` SHALL show it as one warning row that names it, and SHALL NOT count it against a complete setup.
#### Scenario: warning row
- GIVEN an Antigravity session and a dependency with no Antigravity install route
- WHEN the status step runs
- THEN one row names it with the state "not available in Antigravity", and setup can still report itself complete
#### Scenario: other hosts unchanged
- GIVEN the same dependency missing in Claude Code
- WHEN the status step runs
- THEN the row is what it is today, and the warning rule does NOT apply

### R14. Opening pages in Antigravity  [Must]  (MODIFIED: one new result form)
WHILE the host is Antigravity, `mstack-research` SHALL open a page only by fetching it into the scratch folder with a shell command, without reading it in the session, and having its restricted reader read that file, and IF search is on and shell commands are denied or no restricted reader exists, THEN it SHALL open no page, write `not opened` in place of the opened date of each claim about a page, with low confidence, and end with the last line `Search: ran, pages not opened (<reason>)`, the reason being `shell commands denied` when that applies and `no restricted reader` otherwise.
#### Scenario: shell allowed, restricted reader
- GIVEN an Antigravity session that permits shell commands, with the research plugin installed as a plugin
- WHEN `mstack-research` answers a quick question
- THEN every claim about a page names a page that was fetched in this run and carries its opened date, the reader's transcript names no `run_command` call and a `read_file` call whose `Path` is the fetched file (an opened date is NOT accepted without it), and the transcript of the session that ran the skill shows no read of the fetched file by it (self-test, see Verification)
#### Scenario: shell denied
- GIVEN an Antigravity run that denies shell commands, with search on
- WHEN `mstack-research` answers
- THEN the last line is `Search: ran, pages not opened (shell commands denied)`, every claim about a page says `not opened` with low confidence, and NO claim carries an opened date; the self-test cannot refuse a command, so this scenario rests on the skill's text (a repository check) and is not checked in Antigravity
#### Scenario: no restricted reader
- GIVEN an Antigravity session in which `mstack-research` has no reader agent (a skills CLI install) or starts no reader (the model skill is missing)
- WHEN it answers
- THEN the last line is `Search: ran, pages not opened (no restricted reader)`, and NO page text was fetched or read: the transcript of the session that ran the skill shows no command that fetched a page and no read of one, and for the skills CLI install the loaded skill's path is the loose skill folder and no agent of the research plugin is in the session's subagent records; what a search result put into the model's context is not checked in Antigravity
#### Scenario: a fact from a local file
- GIVEN a question about a package whose version is in the project's lockfile
- WHEN `mstack-research` answers in any of the cases above
- THEN the version claim names the file as its source, as it does today
#### Scenario: search switched off
- GIVEN a called message with `Online search: off`
- WHEN `mstack-research` answers in Antigravity, whatever the shell setting
- THEN the last line starts with `Search: not run`, and NOT with `Search: ran`
#### Scenario: a covered caller
- GIVEN a covered skill that called `mstack-research` and got `Search: ran, pages not opened`
- WHEN it uses the result
- THEN it treats each claim about a page as still open and does NOT cite it as confirmed, while a claim read from a local file keeps its source

### R15. Reader agents per host  [Must]
The research plugin SHALL ship one reader agent for Claude Code and one for Antigravity, each allowed only its host's search and file-reading tools (and the message tool Antigravity always adds), in a form both hosts' validators accept, and `mstack-research` SHALL start its host's reader by name.
#### Scenario: both validators
- GIVEN the research plugin
- WHEN `agy plugin validate` and Claude Code's plugin validator run on it
- THEN neither reports an error
#### Scenario: Antigravity run
- GIVEN the research plugin installed in Antigravity as a plugin
- WHEN `mstack-research` starts a reader
- THEN the answer says `Readers: restricted`, the `invoke_subagent` call of the session that ran the skill names the Antigravity reader in its `TypeName`, the child's subagent record names that agent as its agent type, and the child's transcript names no `run_command` call (self-test, see Verification)
#### Scenario: skills CLI install
- GIVEN `mstack-research` installed in Antigravity with the skills CLI, so no reader agent exists
- WHEN it answers a question
- THEN it searches without opening pages, as R14 says, and the answer does NOT say `Readers: restricted`; the self-test runs this case in the dev workflow session of spec 3, where the plugin is installed as a loose skill
#### Scenario: the allowlist does not hold
- GIVEN a reader whose transcript shows a shell call
- WHEN the run is checked
- THEN it counts as a run without a restricted reader, and its page claims are NOT accepted as opened

### R16. Privacy check of mstack-anonymize  [Must]  (MODIFIED: stricter wherever the check runs; it also reads Antigravity transcripts)
The trace check of `mstack-anonymize` SHALL read Claude Code traces and the transcripts of an Antigravity session and of every subagent below it, apply its path and command rules to every tool call, a subagent's like the session's own, and fail on a tool name it has no rule for, on a record it cannot parse, on a file in which it recognizes no trace record, and on a trace without any tool call unless the caller declared that the case makes none.
#### Scenario: clean run
- GIVEN the trace of a run that reached the raw data only through the skill's script
- WHEN the trace check runs
- THEN it passes and prints the number of tool calls it read
#### Scenario: clean Antigravity session
- GIVEN the saved transcripts of a privacy case that the self-test ran in Antigravity and that reached the raw data only through the skill's script
- WHEN the trace check runs on the session's transcript and on every descendant's, with the case's protected inputs named (the raw file by every path form, the terms file; a case with pasted input has no raw file and says so)
- THEN it passes and prints the number of tool calls it read; that no data left by a route no tool call records is not checked in Antigravity
#### Scenario: a subagent reads the raw file
- GIVEN an Antigravity session transcript without a forbidden call and a transcript of one of its subagents in which `read_file` names the raw file in its `Path`
- WHEN the trace check runs
- THEN it exits non-zero and names the call, and the session's own transcript does NOT make it pass
#### Scenario: a known tool reads the raw file
- GIVEN a trace in which a file-reading tool the check has a rule for opens the raw file
- WHEN the trace check runs
- THEN it exits non-zero and names the call, and it does NOT pass because the tool is known
#### Scenario: unknown tool
- GIVEN a trace that holds a call to a tool the check has no rule for
- WHEN the trace check runs
- THEN it exits non-zero and names the tool
#### Scenario: partly unreadable
- GIVEN a trace with one valid harmless call and one record that cannot be parsed
- WHEN the trace check runs
- THEN it exits non-zero, and the valid call does NOT make it pass
#### Scenario: no tool call
- GIVEN a trace in a known format that holds no tool call
- WHEN the trace check runs without a declaration
- THEN it exits non-zero
#### Scenario: a case that asks in chat
- GIVEN the same trace, from an eval case declared as making no tool call (the skill only asks its question)
- WHEN the trace check runs with that declaration
- THEN it passes

### R17. Install questions of mstack-find-skills  [Must]
WHEN `mstack-find-skills` installs a skill it found while running in Antigravity, it SHALL ask the route and, for the skills CLI, the scope, the method and the agents, offer `antigravity` among the agents, and offer the plugin route only for a candidate whose repository address it knows.
#### Scenario: skills CLI route
- GIVEN an Antigravity session and a found skill
- WHEN the user picks the skills CLI, global scope, symlink and the agent `antigravity`
- THEN the command it runs names the agent `antigravity` and no agent the user did not pick
#### Scenario: plugin route
- GIVEN a candidate with a known repository address
- WHEN the user picks the plugin route
- THEN the command is Antigravity's plugin install with that address; the self-test does not run this install, because a prepared answer is not the user's yes (D27), so this scenario rests on the skill's text (a repository check) and is not checked in Antigravity
#### Scenario: no answer yet
- GIVEN the questions are open
- WHEN the user has not answered
- THEN nothing is installed; a case of the self-test gets its answers up front and does not call the question tool, so this scenario and the asking through the question tool rest on the skill's text (a repository check) and are not checked in Antigravity

### R18. Routing table  [Must]
The routing table of `mstack-auto` SHALL list Antigravity among the hosts of every skill it has a row for that belongs to a covered plugin.
#### Scenario: a covered skill
- GIVEN the row of a skill of a covered plugin
- WHEN a reader looks at its hosts
- THEN Antigravity is among them
#### Scenario: a workflow
- GIVEN the row of one of the three existing workflows
- WHEN a reader looks at its hosts
- THEN it is unchanged by this spec

### R19. mstack-skill-creator and Antigravity  [Should]
`mstack-skill-creator` SHALL follow in Antigravity the rules it follows in Claude Code and Codex (the shared mstack skills, no built-in substitutes), and SHALL add an Antigravity manifest to every skill it packages as a plugin of an mstack-style marketplace, in any host, saying whether Antigravity's validator checked it.
#### Scenario: packaged with agy
- GIVEN a new skill packaged as a plugin on a machine with `agy`
- WHEN the packaging step ends
- THEN the plugin holds an Antigravity manifest that `agy plugin validate` accepts
#### Scenario: agy absent
- GIVEN a machine without `agy`
- WHEN the packaging step ends
- THEN the report says the Antigravity manifest was not validated, and it does NOT claim an Antigravity test

### R20. Repository documents  [Must]
The repository's README and its agent instructions SHALL describe three hosts: the Antigravity install commands for both routes, the Antigravity manifest among the places a version is bumped, and the checks' behavior with and without `agy`.
#### Scenario: install section
- GIVEN the README's install section
- WHEN a reader looks for Antigravity
- THEN it gives the `agy plugin install` command with the repository address of a plugin, and the skills CLI command with the agent `antigravity`
#### Scenario: bump rule
- GIVEN the agent instructions' rule on version bumps
- WHEN a contributor reads where a version appears
- THEN the Antigravity manifest is listed, and a contributor who follows the list does NOT leave it behind

### R21. Real-client evidence  [Must]
Each skill of a covered plugin SHALL have one recorded run per host on the cheap tier's model in which the skill loaded and produced its result form: in Claude Code and Codex with the real `claude` and `codex` clients, and in Antigravity a case of the self-test that a person starts in their own session, with the reply saved and a run log that names the model the case ran on.
#### Scenario: recorded runs
- GIVEN a covered skill
- WHEN the pull request is opened
- THEN its description lists, per skill and host, the date and the outcome, with the command for Claude Code and Codex, and with `self-test`, the `agy` version and the model for Antigravity
#### Scenario: a self-test case not run yet
- GIVEN a covered skill whose case of the Antigravity self-test has not run
- WHEN the table of runs is written
- THEN its Antigravity row says `not run` and NOT `pass`, and the pull request is NOT opened while a row says `not run`; a case whose saved files or transcripts are missing counts as `not run` until it is repeated
#### Scenario: a run that fails
- GIVEN a skill whose run in one host does not produce its result form
- WHEN the pull request would be opened
- THEN the failure is fixed first, and the pull request is NOT opened with that skill failing in any of its hosts

### R22. Built-in review of product plans and epics in Antigravity  [Must]
WHILE the host is Antigravity, the review step of a product document skill SHALL send a product plan or an epic read-only to Codex through its command-line client when that client is installed, otherwise to Claude through its command-line client when that client is installed, or reread it in the session when neither is installed, telling the user first and asking for a run outside the sandbox for the check for each client and for each client run, and IF the document is an evidence or a decisions document or rests on one, directly or through a parent, THEN the step SHALL review it in the session itself, with no other client and no subagent.
#### Scenario: Codex installed
- GIVEN an Antigravity session, a product plan with no evidence or decisions source, and the Codex client installed
- WHEN the review step runs
- THEN Codex reviews the document read-only
#### Scenario: nothing installed
- GIVEN the same plan and neither client installed
- WHEN the review step runs
- THEN the session rereads the document itself and says in one line that no other vendor reviewed it
#### Scenario: Claude installed, no Codex
- GIVEN the same plan, no Codex client, and the Claude client installed
- WHEN the review step runs
- THEN Claude reviews the document in a read-only headless run: the session's transcript shows a `run_command` call whose `CommandLine` is that run, the saved JSON result holds the review, the command's flags are the ones the confirming task recorded (Constraints), the run got no tool that writes or runs commands beyond what the review needs, and the session does NOT report before it has seen the command's completion and its output
#### Scenario: a run outside the sandbox is not approved
- GIVEN the same plan and a person who does not approve the run outside the sandbox
- WHEN the review step runs
- THEN the session rereads the document itself and says that the run was not approved, and it does NOT say that no client is installed; the self-test's person approves every listed run, so this scenario rests on the skill's text (a repository check) and is not checked in Antigravity
#### Scenario: evidence among the sources
- GIVEN an epic whose parent plan rests on an evidence document
- WHEN the review step runs in Antigravity
- THEN the reply holds the review, and the transcript of the session that ran the case shows no `invoke_subagent` call and no command of another client (self-test, see Verification); that the document did NOT leave the session by a route no tool call records is not checked in Antigravity

### R25. No bridge of another repository  [Must]
No file of a covered plugin, no repository document and no repository check SHALL name the agent-bridges repository, one of its plugins or one of its commands, and WHERE a covered skill needs another vendor's model, the skill SHALL call that vendor's own client directly.
#### Scenario: nothing names a bridge
- GIVEN the covered plugins (skills, references, scripts, tests, eval cases, and the host files of `mstack-skill-creator` for each of its hosts), the README, the agent instructions and the check scripts
- WHEN a search for the bridge repository's name, its plugin names and its commands runs over them
- THEN it finds nothing outside a `THIRD_PARTY_NOTICES.md` that credits adapted text, and the Codex plugin's own companion does NOT count as a hit
#### Scenario: a review by another vendor
- GIVEN a covered skill that sends work to another vendor's model, in any of its hosts
- WHEN a reader looks up the command
- THEN it is a `claude -p` or a `codex exec` run that sends the skill's own reviewer brief and states the output form the skill needs, NO step checks for, installs or calls a bridge, and where the text gives a `claude -p` command it says that Claude Code loads the user's own setup unless the recorded flags are used

## Constraints and assumptions

- `agy` 1.5.13 (installed, probed 2026-11-21). `agy plugin install <folder>` and `agy plugin install https://github.com/<owner>/<repo>/tree/<branch>/<path>` both install one plugin into `~/.gemini/config/plugins/<name>`; the address form converts a Claude Code plugin on the way. A skill of an installed plugin loaded in a session whose settings denied writes and commands (a session an agent drove).
- The manifest is `.antigravity-plugin/plugin.json` and wins over a root `plugin.json`; fields include name, version, description, logo, author, homepage, repository, license and keywords (Antigravity docs, build-plugins page, opened 2026-11-21).
- The validator rejects an agent file whose `tools` is a comma-separated string. With `tools` as a YAML list it accepts a file with Claude Code tool names and a second agent at `agents/<name>/agent.md` with Antigravity tool names; Claude Code's plugin validator accepts the same folder (both probed 2026-11-21).
- A subagent's model is one of `inherit`, `flash_lite`, `flash`, `pro`; no source gives the model or the provider behind a tier, an exact model id or an effort for a subagent (Antigravity docs, subagents and build-plugins pages).
- Tool names seen in real runs (2026-11-21 in print mode, 2026-11-22 over ACP; both in sessions an agent drove, before the decision of 2026-11-23, and no further such probe is made): `read_file`, `write_file`, `run_command`, `ask_question`, `invoke_subagent`. `search_web` is in a session's tool list and was allowed in an agent file, but not yet seen in a call. A session's first event lists `read_url_content`, but the model reported it as not available and did not call it, so no page-opening tool is assumed.
- No agent and no script starts or drives an Antigravity session: not for a test, a review or a task, and not as a second session from inside a person's own (decided by the user, 2026-11-23, D26). A person opens Antigravity and uses the skills there; inside that session a skill uses the session's own tools (subagents, shell, files) and calls Codex with `codex exec` and Claude with `claude -p`, each client's own headless mode; no skill checks for, installs or calls a bridge of another repository (D35). A long `claude -p` or `codex exec` command is run as it is; in Antigravity the session is told when a command completes, and a skill does not report or finish before it has seen the command's completion and its output. Scripts and checks may run `agy models`, `agy --version` and `agy plugin validate`; `agy plugin install` runs only after the user's yes, or is printed for the user to run (D27). This spec has no machine-made trace of an Antigravity session; the evidence for Antigravity is defined under Verification.
- Skills load from `~/.gemini/config/skills/` and the workspace's `.agents/skills/`; plugins from `~/.gemini/config/plugins/` and the workspace's `.agents/plugins/` (Antigravity docs, medium confidence: read from a summary; the plugin folder was confirmed by the install probe).
- What a subagent did is in its own transcript file in Antigravity's data folder, which names its model in a `model` field: `~/.gemini/antigravity-cli/brain/<sessionId>/.system_generated/subagents/<subagent id>.json` lists a session's subagents and `~/.gemini/antigravity-cli/brain/<subagent id>/.system_generated/logs/transcript.jsonl` is each one's transcript, with `tool_calls[].name` in its model-turn records (probed 2026-11-22 in sessions an agent drove; confirmed on 2026-11-23 in a session a person opened, next line). A transcript's `tool_calls` entries carry the `name` and the `args` of a call: `read_file` with `Path`, `run_command` with `CommandLine`, `write_file` with `Path` and `Content`, `invoke_subagent` with `Prompt`, `Role`, `TypeName` and, in a subagent's own call, `Model`, `send_message` with `Message` and `Recipient`. The main session records its own tool calls the same way in `~/.gemini/antigravity-cli/brain/<session id>/.system_generated/logs/transcript.jsonl`. A subagent record holds `conversationId`, `spawnStepIndex`, `state`, `subagentDescriptor` (`typeName`, `role`) and `workspaceUris`; for a subagent started with no agent type, `typeName` was `self` and `role` the name the caller gave, and for a plugin's agent it holds the agent's name (all read on 2026-11-23 from the files of the person's two sessions of the next lines). So in a person's own session a transcript shows which file was read or written and which command ran, for the session and for each subagent.
- Seen on 2026-11-23 in one session a person opened (`agy` 1.5.15, session mode `auto`): a subagent of the session loaded a skill installed under the workspace's `.agents/skills/` and replied with the skill's exact line; a subagent ran a shell command, and in the mode `auto` the client did not ask the person; a subagent started a subagent of its own, which answered and has its own record on disk; the session's subagent record and the subagent's transcript (the two paths above) both exist, and the session itself read them: the transcript names the model (`gemini-4-neon-medium`, the session's own model) and the tools called (`read_file`, `run_command`, `invoke_subagent`, `send_message`). A subagent's tool list as it reported it: `ask_question`, `define_subagent`, `edit_file`, `invoke_subagent`, `manage_subagents`, `manage_task`, `read_file`, `run_command`, `run_workflow`, `schedule`, `search_web`, `send_message`, `swarm`, `write_file`.
- Seen on 2026-11-23 in a second session a person opened (`agy` 1.5.15): the session's own id is in its context and names its folder under `~/.gemini/antigravity-cli/brain/`, so a session can write its id into a file. A subagent's `ask_question` goes to the person, not to the session that started it: the record showed the subagent waiting until the person answered, and a message the session sent meanwhile stayed queued and did not answer the question. A skill of a plugin under the workspace's `.agents/plugins/<plugin>/` (with `.antigravity-plugin/plugin.json`) loaded for a subagent and replied with its exact line. A plugin's agent (`agents/<name>/agent.md`, `tools: [read_file]`) started when the session named it as the agent type, and answered; its subagent record says `subagentDescriptor: {"typeName": "<agent name>", "role": "<agent name>"}`. `claude -p` and `codex exec`, run by the session as shell commands, failed inside the client's sandbox with exit 127 (`command not found`); after the person approved a run outside the sandbox, both completed in the same turn, in about 20 seconds each with the approval. So every call of another vendor's client from an Antigravity session needs the person's approval for a run outside the sandbox, at least as that session was set up. `codex exec --skip-git-repo-check -s read-only '<prompt>'` printed a header (model, sandbox, session id), the answer after a line `codex`, and `tokens used`.
- In the default mode a subagent's shell command did not run (probed 2026-11-22 in sessions an agent drove; not confirmed for a session a person opened); in the session mode `auto` ("Approve edits and safe commands; ask before irreversible actions") a subagent's read-only command ran in those sessions, and a subagent's shell command ran without a question to the person in the person's session of 2026-11-23.
- Prices per 1M tokens, input and output, from each vendor's pricing page (opened 2026-11-21): Claude Fable 5.2 $8 and $40, Opus 5.5 $4 and $20, Sonnet 5.5 $2 and $10, Haiku 5.5 from $0.10 and $0.50; `gpt-6.2-astra` $8 and $40, `gpt-6.2-sol` $2 and $10, `gpt-6.1-terra` $1 and $5, `gpt-6-luna` $0.10 and $0.50; Gemini 4 Carbon and Argon $2 and $10 until 2026-11-30 and $4 and $20 from 2026-12-01, Neon $3 and $15, Hydrogen $1.50 and $7.50, Gemini 3.8 Flash $0.75 and $3.75 until 2026-12-31 and $1.50 and $7.50 after (the Google page was read through a summary: medium confidence). Whether Antigravity bills by plan quota instead was not checked.
- Google's pricing page calls Carbon its most capable reasoning model, Argon a lighter one, Neon frontier-level and fast, Hydrogen the model for everyday coding; it gives no explicit ranking, so the capability order Flash, Hydrogen, Neon, Carbon is this project's own, by price and those descriptions, dated in the table; it serves both the effort steps and the walk past an excluded model, and Argon is listed and flagged but is not a step in it.
- `codegraph install` accepts the target `antigravity` (codegraph 1.6.3); the skills CLI accepts the agent `antigravity`; ponytail documents `agy plugin install https://github.com/DietrichGebert/ponytail`, skills only, no hooks.
- Claude Code 2.1.330 (`claude --help` and one small run, 2026-11-23): `claude -p` (print mode) takes the prompt on stdin or as an argument and exits when done. `--output-format json` prints one JSON object whose fields include `result` (the answer text), `session_id`, `is_error`, `permission_denials`, `stop_reason` and `num_turns`; a small run with `--model haiku --output-format json --permission-mode plan --tools "Read,Grep,Glob"` returned `result: "ok"`, a `session_id` and `is_error: false`. Further options: `--model <model>`, `--effort <low|medium|high|xhigh|max>`, `--permission-mode <acceptEdits|auto|bypassPermissions|manual|dontAsk|plan>`, `--tools <list>` (which built-in tools exist, `""` for none), `--allowedTools` and `--disallowedTools` (by name, with patterns such as `Bash(git *)`), `--restricted` (removes the tools that run commands or code), `-r, --resume <session id>`, `--session-id <uuid>`, `--add-dir`. In the person's second session of 2026-11-23 the same call with a one-word prompt reported about 196,000 cache-creation tokens and a cost of about 0.79 USD, its `modelUsage` named `claude-sonnet-5-5` and not the `haiku` asked for, and `result` held the word plus sentences from the person's own Claude Code customizations: a plain `claude -p` loads the person's whole Claude Code setup, so it is costly, may run another model than asked, and its output is not clean. `claude --help` lists `--bare` and `--safe-mode`, not yet tried. Not probed, and for the first runs to confirm: a review of a real document or diff. The task that confirms the Claude commands is a task of this spec's plan (spec 2 names the same task): it confirms the complete commands callers ship, for a reviewer and for a developer, with `--safe-mode`, `--model <full id>`, `--effort`, `--output-format json` and the tool and permission flags, checks `modelUsage`, the cost and a clean `result`, and confirms a write and its resume as a pair under the same flags; where no flag set gives a clean, cheap run, or no way exists for a developer to write without a person under `--safe-mode`, it stops and reports. Every `claude -p` command, R22's read-only run included, takes its flags from that record; an installed skill carries the confirmed command itself and never cites a path of a plan, and skill text that tells a user's session to run `claude -p` says that Claude Code loads the user's own setup unless those flags are used.
- `claude -p` run from a clean environment on 2026-11-23 (Claude Code 2.1.330, a one-word prompt, `--output-format json --permission-mode plan --tools "Read,Grep,Glob"`): plain, about 149,000 cache-creation tokens, 0.60 USD, and extra text from the person's customizations in `result`; with `--bare` it fails with `Not logged in`, so it is unusable with a subscription sign-in; with `--safe-mode` the sign-in works, about 4,700 tokens, 0.02 USD, and `result` is exactly `ok`. The help text of `--safe-mode`: all customizations disabled (CLAUDE.md, skills, installed plugins, hooks, MCP servers and more), file tools confined to the working directories (`--add-dir` included), `bypassPermissions` refused, and only a person or the configured permission handler approves writes. Corrected 2026-11-23 by the task that confirmed the commands (15 real runs): the confinement of file tools, the refusal of `bypassPermissions` and the rule on who approves writes are in the help text of `--restricted`, not of `--safe-mode`; under `--safe-mode` a reviewer run read a file outside its working folder and a developer run under `--permission-mode auto` wrote one outside its copy, each with no denial, so neither recorded command confines a run to its folder. The developer command uses `--permission-mode acceptEdits --allowedTools "Bash"`: `acceptEdits` alone was denied the shell and could not run the tests, and `--permission-mode auto` brought a second model, not asked for, into one run to judge permissions; with the shell allowed by rule a write and its resume ran with no denial and only the model asked for. That command lets the developer run any shell command, so the throwaway copy without a remote is its only limit. Model names: the alias `haiku` ran `claude-sonnet-5-5` in all three runs, `--model claude-haiku-5-5` ran Haiku (0.001 USD), and `--model opus` ran `claude-opus-5-5`; so a command uses a full model id where the alias is not proven, and its `modelUsage` is checked. Not tried: `--effort`, a review of a real diff, a write, a resume, `--plugin-dir` under `--safe-mode`.
- Seen on 2026-11-23 in a third and a fourth session a person opened (`agy` 1.5.15): the batch protocol works on the cheap tier's model (`gemini-3.8-flash-medium`): three cases, one subagent each with `Role` set to the case id, took 2 minutes 45 seconds; each subagent took its answers from the list in its prompt and did not call the question tool, and wrote its files in its case's work folder when told to start every shell command with `cd <absolute folder> && `. The session wrote its reply and metadata files as told and reported the client's version and mode as `unknown`, because it cannot see them. Inside the client's sandbox `node`, `git` and `curl` are found, for the session and for each subagent; `claude` and `codex` are not, also with their folder put on `PATH`, because on that machine they are installed under the person's home folder, which the sandbox does not show; a write to a folder next to the workspace succeeded. A subagent that asked for a run outside the sandbox got it, and `claude -p` and `codex exec` then completed (exit 0); one that did not ask reported `command not found` (exit 127). Whether the person is shown an approval each time was not recorded, so an approval per run is planned for.
- Today the trace check passes a trace with no tool call and passes tools it has no rule for (its tests assert both, the second for `Glob` and `Skill`); R16 changes both: a trace without calls needs a declaration, and every accepted tool gets an explicit rule.
- An Antigravity agent's `tools` list is enforced: a probe reader allowed `search_web` and `read_file` had only those and `send_message`, could not run a shell command, and a plugin in the workspace's `.agents/plugins/` loaded (probed 2026-11-21 in a session an agent drove). The validator does not check tool names, so it proves nothing about the restriction. Antigravity cannot start an agent whose `tools` names a tool it does not have (`tool "Bash" not found in registry`, seen on 2026-11-21 with an agent file written for Claude Code's tools): the Claude Code reader is registered in Antigravity but cannot start there, which is harmless because R15 has `mstack-research` start its own host's reader by name. Whether Claude Code starts an agent that names an Antigravity tool was not tested.
- `codegraph.md` and `plan-format.md` are shared files with identical copies in the three workflow plugins; when this spec changes a shared file, every copy changes with it, the workflow plugins' included, and those plugins are bumped.
- `mstack-plan` asks the model skill for `both` and then uses the row of the host it runs in.
- A plan records a tier per phase and task, never a model name; the plan's files also record model names: the plan reviewer, and in the plan start file the helper and fallback-reviewer models that `mstack-plan` takes from the model skill per tier at planning time. The executor maps a task's tier to a model at run time (the plan format and the start file's template). Today the `most capable` tier's Codex model is `gpt-6.2-astra`, which D18 flags.
- Only the three workflow plugins have a preflight that checks ponytail; no covered skill does.
- The descriptions of the four product skills name no host, so R6 does not change them; they stay within 200 characters (repository agent instructions).
- The marketplace version gets a minor bump when plugins are added or removed, and every changed plugin is bumped in each manifest it has (repository agent instructions).
- The validator's logo notice is accepted; no plugin gets a logo (agent's call: a logo per plugin is artwork nobody asked for).

## Decisions

D1. A manifest per plugin, no marketplace file. Alternatives: a marketplace with archives and checksums (needs a release process), the skills CLI only (drops the plugin route). Decided by: user. Source: brief, packaging decision.
D2. Both install routes for Antigravity, the plugin route by repository address and the skills CLI. Alternatives: plugin only, skills CLI only. Decided by: user. Source: interview 2026-11-21.
D3. The checks verify manifests in Node on every machine and run `agy plugin validate` only where `agy` exists. Alternatives: require `agy` (breaks CI and contributors without it), a separate script (easy to forget). Decided by: user. Source: interview.
D4. In Antigravity the session fetches pages into scratch files and the reader only reads them; without shell access the answer is search-only and marked. Alternatives: a reader with shell access (page text reaches a process that can run commands), stopping without shell access, never opening pages. Decided by: user. Source: interview, two rounds.
D5. A second reader agent for Antigravity beside the Claude Code one. Alternative: no reader agent in Antigravity. Decided by: user. Source: interview.
D6. ponytail is required in Antigravity as skills. Alternative: a warning only. Decided by: user. Source: interview.
D7. Antigravity tiers: cheap `gemini-3.8-flash-medium`, standard `gemini-4-hydrogen-medium`, most capable, default and review `gemini-4-neon-high`; the step order is Flash, Hydrogen, Neon, Carbon, so Carbon is the step up when Neon falls short, and Argon is listed in the table without being a step; each task row except the general starting point and code review takes the model of the tier its Claude cell belongs to. Alternatives: Carbon as the most capable tier (every such stage would need the expensive-model question); Argon or Neon-medium as standard; Neon-high for every task row. Decided by: user. Source: interview, three rounds; an earlier order with Carbon below Neon was corrected by the price lookup.
D18. Flagged as expensive: `fable`, `gpt-6.2-astra`, `gemini-4-carbon` and `gemini-4-argon`, the top-priced models of each vendor (for the two Gemini models from 2026-12-01; until then Neon costs more, and the flags are set for the prices that hold from that date). Alternatives: everything at $3 input or more (would flag the default review model and `opus`); adding effort `xhigh` and `max`. Decided by: user. Source: interview, after the price lookup.
D19. `mstack-plan` asks one question per stage before it records an expensive model. Alternative: one question per plan. Decided by: user. Source: interview.
D20. The flag reaches callers as a new last column of the result block. Alternatives: a mark inside the Model cell (callers copy that cell into commands), a separate block. Decided by: agent's call. Source: the result block's contract.
D21. In a plan the question hangs on what the plan records: a tier per phase and task, and the reviewer's model. A tier is asked about when its model is flagged for at least one vendor, and a choice the user named needs no second question. The question at run time, when a workflow maps a tier to a flagged model, belongs to spec 3. Decided by: agent's call, because plans never record model names for stages. Source: the plan format.
D22. In Antigravity, `mstack-research` opens pages only with its restricted reader; a skills CLI install, or a run without the model skill, searches without opening pages. Alternative: an unrestricted subagent or the session reads page text (a process that can run commands would read it). Decided by: agent's call, following the user's choice that page text never reaches a process that can run commands. Source: interview.
D23. A trace without any tool call fails the privacy check unless the eval case declares that it makes none. Alternative: zero calls always pass, as today (an unread trace could pass). Decided by: agent's call. Source: brief, Left to the spec.
D8. In Antigravity, `mstack-product-plan` and `mstack-epic` send a document to the first installed of the Codex and Claude clients (amended 2026-11-23, D33 and D35: Codex first, then Claude, each through its own client), else the session rereads it; documents resting on evidence or decisions stay in the session. Alternative: author reread only. Decided by: user. Source: interview.
D9. Subagent tiers: cheap and standard use `flash`, most capable uses `pro`. Alternative: `inherit`, which runs on the session's model. Decided by: agent's call, because no documented tier sits between `flash` and `pro` and `inherit` is the expensive default the model rule exists to avoid. Source: Antigravity docs.
D10. A fresh read of customer evidence or meeting decisions in Antigravity is done by the session itself, never by a subagent. Alternative: a `flash` or `pro` subagent. Decided by: agent's call, because no source says which provider runs a tier, and those documents must stay with one vendor. Source: repository agent instructions; Antigravity docs.
D11. `both` and a missing vendor keep meaning Claude and Codex, and `all` is new. Alternative: `both` means every vendor (changes the row count for today's callers). Decided by: agent's call. Source: the model skill's called-mode contract.
D12. An effort change for Antigravity changes the id's effort suffix inside the same model family. Alternative: pass `--effort` beside an id that already names an effort (two sources of one value). Decided by: agent's call. Source: `agy models` lists every family per effort.
D13. `mstack-skill-creator` treats Antigravity like Claude Code and Codex and adds the Antigravity manifest when it packages a plugin. Alternative: leave created skills at four hosts. Decided by: agent's call, because a skill made by mstack should install where mstack installs. Source: brief goal.
D14. The trace check gets explicit rules for every tool it accepts, in every trace format it reads (amended 2026-11-23: an Antigravity session's transcripts are one of them, D34). Alternative: stricter rules for Antigravity traces only (two standards for one privacy claim). Decided by: agent's call. Source: review finding, checked against the check's tests.
D15. In `mstack-setup`, a dependency with no Antigravity install route is a warning row. Decided by: user. Source: brief (third-party warning rule).
D16. The workflow plugins, their preflights and `mstack-setup`'s reviewer and workflow rows are left to specs 2 and 3. Decided by: agent's call. Source: the three-spec split.
D25. Withdrawn 2026-11-23 and replaced by D26. Decided by: user.
D26. No agent and no script starts or drives an Antigravity session; this spec keeps host support only: what a person uses inside their own Antigravity session (install, host tables, the skills). A skill never starts a second Antigravity session either, also not from inside a person's own; the session's own subagents (the reader of R15) stay, and a review by another vendor goes to Codex or Claude (R22). Alternative: driving Antigravity from another agent or a script for tests, reviews and tasks (D25, withdrawn). Decided by: user, 2026-11-23. Source: interview 2026-11-23.
D27. Scripts and checks may run `agy models`, `agy --version` and `agy plugin validate`; `agy plugin install` runs only after the user's yes, or is printed for the user to run. Alternatives: every `agy` command typed by a person (a broken manifest would be found only at install); no limit on `agy plugin install`. Decided by: user, 2026-11-23. Source: interview 2026-11-23.
D28. Evidence for Antigravity comes from a self-test that a person starts in their own Antigravity session: the person pastes one prompt per start, the session runs the cases itself with its own tools, and the replies are saved and graded afterwards. The pull request waits for the self-test to pass; a case not yet run is `not run`, never `pass`. What the self-test cannot show is recorded as not checked in Antigravity. No script-made trace of an Antigravity session exists. Alternatives: one run per case that a person makes by hand (decided earlier on 2026-11-23 and replaced the same day); a machine-made trace of a session a script drives (ruled out by D26). Decided by: user, 2026-11-23. Source: interview 2026-11-23.
D29. Withdrawn 2026-11-23 and replaced by D34. Decided by: user.
D30. Facts from the probes an agent made before 2026-11-23 stay in the Constraints, dated, as history of what was seen; every fact about how to drive a session from outside is removed, because nothing uses it. Alternative: remove all of them and have a person confirm each (R5's host tables need the tool names now). Decided by: agent's call. Source: D26.
D31. The self-test has four starts by the person: the skills batch of this spec, the pairings batch of spec 2, and the review workflow and the dev workflow of spec 3, each workflow in a session of its own, because a workflow has to be the session itself and start fresh. Its run log holds the date, the `agy` version, the model, the prompt and the reply; a claim about what the session or a subagent read, wrote, ran or started, or which model a subagent ran, is read from the session's transcript, its subagent record and the subagent's transcript; an agent in Claude Code or Codex grades the saved files afterwards; the batch's prompt names the model the person starts the session on (the cheap tier's model for this spec's batch), and no case relies on the `Model` argument of `invoke_subagent`, which no person has tried. The batch's prompt file and its output format belong to the plan. Alternatives: a log of the outcome only (the grader could not see what was asked); grading by the session itself (it would grade its own work). Decided by: agent's call. Source: D28; the facts of 2026-11-23 in Constraints.
D32. "Not checked in Antigravity" is written into a requirement only for a single claim the self-test cannot establish, and such a claim holds nothing: the shell-denied case, because the self-test cannot refuse a command, and what a search result put into the model's context (R14); that no data left by a route no tool call records (R16); a run outside the sandbox that is not approved, because the self-test's person approves every listed run (R22); the plugin route's install, because a prepared answer is not the user's yes, and that a skill asks through the question tool or waits for an answer, because a case's subagent gets its answers up front (R17); and that a document did not leave the session by a route no tool call records (R22). Every other claim about what a session or a subagent read, ran or started is checked from the transcripts, and a case whose evidence files are missing is `not run`, which holds the pull request. Alternative: a line in the session's reply that states it (a new behavior, and the session's own word is no check). Decided by: agent's call. Source: D28.
D33. In Antigravity the built-in review of a product plan or an epic goes to a read-only `codex exec` run first, then to a read-only `claude -p` run when the Claude client is installed, then to the session's own reread. First written with Claude reached through a bridge; changed in place by D35. Alternative: the first installed client in no stated order (D8 as first written). Decided by: agent's call, following D26 and D35. Source: review finding 2026-11-23.
D34. `mstack-anonymize` gets a privacy check for Antigravity: the check's script also reads the session's own transcript and each subagent's, which record every file read and every command run, and the self-test runs the privacy cases. The statement that the check was not run in Antigravity leaves the skill's text. This replaces D29. Alternative: no check in Antigravity and a statement in the skill's text (D29). Decided by: user, 2026-11-23. Source: interview 2026-11-23.
D35. (Widened to every host and every file by D37.) mstack does not depend on the agent-bridges repository: Claude is reached from Antigravity with Claude Code's own headless mode (`claude -p`), the same way Codex is reached with `codex exec`, and no skill checks for, installs or calls a bridge. Alternative: the `claude` bridge of agent-bridges (an earlier preference of the user, replaced by this decision). Decided by: user, 2026-11-23. Source: interview 2026-11-23.
D36. The four self-test sessions are run by the person in one sitting at the end, after everything of the three specs is built; until then this spec's Antigravity rows say `not run`, and no session is repeated only because a row went stale. Alternative: a session per spec as each is built (three sittings, and rows that later changes make stale). Decided by: user, 2026-11-23. Source: interview 2026-11-23.
D37. agent-bridges is removed from mstack completely, in every host (Claude Code, Codex, Antigravity, OpenCode, Cursor) and every file (skills, references, scripts, checks, README, agent instructions, setup rows, routing, eval cases); a skill that needs another vendor's model calls that vendor's own client (`claude -p`, `codex exec`), and what mstack needs to know about calling a client (the review prompt's shape, the output contract, read-only settings) is written in mstack's own files and words, with the credit the agent instructions require for adapted text. This spec carries it as R25 for the covered plugins and the repository's documents and checks; the vendor rows of `mstack-setup` and the reviews of `mstack-plan` and `mstack-skill-creator` are rewritten by specs 2 and 3. Alternative: keep the bridges in Claude Code and Codex (D35 as first written covered Antigravity only). Decided by: user, 2026-11-23. Source: interview 2026-11-23.
D17. Real-client evidence is one run per skill and host; the Antigravity run is a case of the self-test (D28). Decided by: user. Source: brief (tests with the real clients; the pull request waits until every skill passes).

## Risks

- `search_web` was not yet seen in a call (`ask_question` and `invoke_subagent` were, in the dated probes) -> R5's third scenario makes the name a person's session shows win, and the name stays marked as unconfirmed until a session shows it in a call (a subagent's own tool list named it on 2026-11-23).
- The two-step page fetch needs the reader to return addresses and be started again -> one extra round per question; R14's first scenario reads from the reader's transcript that it made no shell call.
- Model names age fast -> the table carries its date, and R10 never returns an id that `agy models` does not list.
- R16 tightens a check that guards a privacy claim wherever it runs, and adds a second format -> its existing tests are updated in the same change, and the eval graders that call it are swept.
- 21 host tables change by hand -> the build greps for a host table without the third column.
- One run per skill and host is 66 runs, 44 with the `claude` and `codex` clients and 22 cases of the Antigravity self-test, whose batch for this spec holds 34 cases in all (Verification) -> they use the cheap tier's models, the existing eval cases are reused where one exists, and the self-test runs its cases from one pasted prompt (D28).

## Verification

- Evidence in Antigravity is a self-test (D28, D31): a person opens Antigravity in a checkout and pastes one prompt for this spec's batch, and the session runs the cases itself, one subagent per case where that works, in a throwaway folder, saving each reply and a run log (the date, the `agy` version, the model, the prompt and the reply). In a case the subagent that runs the skill stands for the session, and a subagent it starts (a reader) is a nested one; where a case cannot run that way, the session runs it itself. The person starts the session on the model the batch's prompt names, the cheap tier's model for this spec's batch. Grading happens afterwards from the saved files, by an agent in Claude Code or Codex. What the session or a subagent read, wrote, ran or started, and which model a subagent ran, is read from the session's transcript, its subagent record and the subagent's transcript (Constraints). The four starts happen in one sitting after everything of the three specs is built (D36). A case's subagent gets its prepared answers up front in its prompt and does not call the question tool, because a subagent's question goes to the person; so that a skill asks through the question tool is not shown by a case of this spec's batch. The batch tells the person at its top what they will be asked to approve: each run of `claude -p` or `codex exec` outside the sandbox. Each case states the availability it needs and how the batch prepares it: a client that has to be absent is hidden by a `PATH` prepared for that case's subagent, which also holds for a run outside the sandbox. The batch's notice lists every helper a case starts outside the sandbox. The session cannot see the client's version or mode and writes `unknown` for both in its run log. A case not yet run, or one whose saved files or transcripts are missing, says `not run`, never `pass`, and the pull request waits until every case passes. "Not checked in Antigravity" is only for a single claim the self-test cannot establish, and holds nothing. No script-made trace of an Antigravity session exists, and no script or agent starts one. An eval case of any requirement that runs in Antigravity is a case of the self-test.
- The counts of this spec. Starts by the person: 1 of the self-test's four (the skills batch; the pairings batch of spec 2 and the two workflow sessions of spec 3 are the other three). Pairings of host and skill: 66 (the 22 covered skills in three hosts), 22 of them in Antigravity. Runtime cases the self-test must pass, which hold the pull request: 34, namely 22 for R21 (one per covered skill), 1 for R11 to R13 (the status table), 3 for R14 and R15 (shell allowed with the restricted reader; a skills CLI install, which runs in the dev workflow session of spec 3 because one session holds one install shape per plugin; `Online search: off`), 3 for R16 (the skill's privacy cases, whose saved transcripts the trace check reads afterwards), 1 for R17 (the skills CLI route in the throwaway folder) and 4 for R22 (Codex installed; nothing installed; Claude installed and no Codex; evidence among the sources). Fixture-only assertions, checked in Claude Code or Codex or by a repository check, without Antigravity: 64 scenarios (R22's run that is not approved; all of R1 to R13, R18 to R21 and R23 to R25; R16 except its clean Antigravity session; R14's covered caller; R15's two validators and its allowlist rule; R17's plugin route and its open questions). Claims not checked in Antigravity, which hold nothing: 7 (R22 a run outside the sandbox that is not approved; R14 the shell-denied case; R14 what a search result put into the model's context; R16 that no data left by a route no tool call records; R17 the plugin route's install; R17 that the skill asks through the question tool and installs nothing before an answer; R22 a route no tool call records).
- R1, R3, R15: `agy plugin validate` per plugin through the marketplace check on a machine with `agy`; Claude Code's plugin validator on the research plugin.
- R2, R4: tests of the two check scripts against fixture plugins (versions agree, version differs, manifest deleted, a plugin another spec assigns to other hosts, Antigravity-only plugin changed without a bump), run without `agy` on the path.
- R3 (absent): the marketplace check with `agy` removed from the path prints the skipped line and exits 0.
- R5, R6, R7, R18, R20: a grep over every `SKILL.md`, the routing table, README and the agent instructions; the dated probes in Constraints for R5's names.
- R8, R9, R10, R23: called-mode eval cases of the model skill (vendor `antigravity`, `both`, no vendor, `all`, a cap, a next step, an unknown vendor, flagged and unflagged models); R9's third scenario by a grep of the covered skills' text for the vendor value they ask for (a repository check, not a run in Antigravity).
- R24: eval cases of `mstack-plan` (two phases on a flagged tier, a decline, a tier the user named, a flagged reviewer).
- R11, R12, R13: tests of the setup status script with a stand-in `agy` and stand-in folders, plus one case of the self-test in Antigravity.
- R14: three cases of the self-test: one with shell allowed (the reader's calls, the path it read and the session's reads taken from their transcripts; the reader's agent type from the session's `invoke_subagent` call, matched to the child's record), one from a skills CLI install (run in the dev workflow session of spec 3 as a loose skill; the loaded skill's path and the absence of the plugin's agent in the subagent records are checked), and one with `Online search: off`; the shell-denied scenario by a grep of the skill's text (not checked in Antigravity); a called-mode eval case per covered caller for the `pages not opened` line.
- R16: the trace check's tests with a clean trace, a known tool on the raw file, an unknown tool, a partly unreadable trace, a file with no trace record, and a trace without calls with and without the declaration; fixture transcripts of an Antigravity session and a subagent (clean, and a subagent that reads the raw file); each case names its protected inputs, and relative paths are resolved against the recorded working folder; in Codex no trace check exists today and this work adds none; the skill's privacy cases run by the self-test, with the trace check run afterwards on the saved transcripts.
- R17, R19, R22: eval cases of the skills; for R17 one case of the self-test and the skill's text for the plugin route and for the open questions; for R22 four cases of the self-test: Codex installed, nothing installed (both clients hidden from the case), Claude installed and no Codex (the Codex client hidden; the `claude -p` command line and the saved JSON result are read), and evidence among the sources, whose transcript is read for `invoke_subagent` and for a command of another client.
- R25: a search over the covered plugins, the README, the agent instructions and the check scripts for the bridge repository's name, its plugin names and its commands; it also runs over the files that specs 2 and 3 rewrite.
- R21: the table of runs in the pull request description; its Antigravity rows are filled from the self-test's run log and say `self-test`.
- Not covered by a scenario: Antigravity on Windows (expected: the same commands; not tested), an `agy` older than 1.5.13 (expected: the checks still run their Node part; the validator's messages may differ), and a workspace-level plugin install (expected: works, not documented by mstack).

## Open questions

- Is `gemini-3.8-flash-medium` the cheapest model that runs every skill? Owner: engineering. Can wait because: R21's runs use it, and a failure there changes one table cell, not a requirement.

## Appendix: interview record

- 2026-11-21 Evidence: brief `docs/briefs/2026-11-21-antigravity-host-support.md`, Decided by the user / Decision: three hosts, a manifest per plugin, both checks, third-party warning rule, real-client tests, one pull request (decided in the brief).
- 2026-11-21 Q: three specs or one / Recommended: host, vendors, workflows / Decision: three specs in that order, one pull request.
- 2026-11-21 Q: probe `agy plugin install` in the global configuration / Recommended: yes, then clean up / Decision: yes. Evidence: folder and address installs work; the list was empty again afterwards.
- 2026-11-21 Q: install routes for Antigravity / Recommended: both / Decision: both.
- 2026-11-21 Q: page reading in Antigravity / Recommended: shell fetch, else search-only / Decision: as recommended.
- 2026-11-21 Q: who runs the fetch / Recommended: the session fetches, the reader only reads / Decision: as recommended.
- 2026-11-21 Q: checks without `agy` / Recommended: Node check always, validator when present / Decision: as recommended.
- 2026-11-21 Q: models per tier / Recommended: Flash, Hydrogen, Neon / Decision: as recommended, Carbon in the table too, `gemini-4-neon-high` the default.
- 2026-11-21 Q: Carbon's place and the task rows / Recommended: Carbon between Hydrogen and Neon; task rows follow the Claude column / Decision: as recommended; Carbon's place was later corrected.
- 2026-11-21 Evidence: vendor pricing pages through `mstack-research` (three readers) / Decision: prices in Constraints; Carbon and Argon are the top-priced Gemini models.
- 2026-11-21 Q: Gemini order and tiers after the price lookup / Recommended: Neon default, Carbon on top / Decision: as recommended.
- 2026-11-21 Q: which models are flagged expensive / Recommended: the top price per vendor / Decision: as recommended.
- 2026-11-21 Q: how `mstack-plan` asks before an expensive model / Recommended: one question per plan / Decision: one question per stage.
- 2026-11-21 Q: reader agent in Antigravity / Recommended: a second agent file / Decision: as recommended.
- 2026-11-21 Q: ponytail in Antigravity / Recommended: required as skills / Decision: as recommended.
- 2026-11-21 Q: built-in review of product plans and epics in Antigravity / Recommended: Codex or Claude if installed, else reread; evidence-based documents stay in the session / Decision: as recommended.
- 2026-11-21 Evidence: `agy plugin validate` and `claude plugin validate` on a probe plugin / Decision: both accept two reader files when `tools` is a YAML list; a missing logo is a notice.
- 2026-11-21 Evidence: a real run's stream-json trace / Decision: tool names and the record form in Constraints; no page-opening tool is assumed.
- 2026-11-21 Evidence: Antigravity docs (models, subagents, build-plugins, plugins, skills pages) through `mstack-research` / Decision: subagents take a tier only; no ranking or prices exist; folders and manifest fields as listed.
- 2026-11-21 Evidence: `codegraph install --target`, `npx skills add -a antigravity`, ponytail's install notes / Decision: all three have an Antigravity route.
- 2026-11-21 Evidence: `scripts/check-marketplace.mjs`, `scripts/check-version-bumps.mjs`, the trace check's tests, `mstack-plan`'s model call, the workflow preflight scripts / Decision: R2 to R4, R9's third scenario, R16's last two scenarios, and the move of preflights to spec 3.
- 2026-11-21 Evidence: a probe reader agent in a workspace plugin / Decision: the tool allowlist is enforced; R15's last scenario covers a reader for which it does not hold.
- 2026-11-21 Evidence: reviews by Codex, Antigravity and an independent reader, two rounds / Decision: 50 findings processed; one rejected (a read-only run can load a skill: the probe skill answered with commands denied).
- 2026-11-21 Evidence: a bridge's rescue agent started in Antigravity / Decision: one agent file cannot serve both hosts; recorded under Constraints, no requirement changes. Status back to Draft for this added fact.
- 2026-11-22 Q: how other agents and this repository's test runs reach Antigravity / Decision by the user: only through ACP. Evidence: probes of an ACP session (tool calls, permission requests, a question, a subagent). The Constraints on tool names, the trace format and what a run can refuse were rewritten, and D25 added. Status back to Draft for this change.
- 2026-11-22 Evidence: further ACP probes after two reviews of the amendment (a session continues after a turn's end; a subagent's shell command needs the mode `auto`; the place of a subagent's transcript; `--gemini-dir`) / Decision: the Constraints state them, and R15's scenario reads the reader's calls from its transcript. Agent's call, for the user to see at approval: test runs whose subagents run commands use the session mode `auto`.
- 2026-11-22 Approval: the user approved the ACP amendment, and chose the session mode `auto` for test runs whose subagents run commands (the agent's call is now the user's decision).
- 2026-11-22 Amendment approved by the user (documents stay Approved): bridge 0.2.2 facts. A review's `Incomplete review:` line also names files skipped as too large, binary or a link; a bridge write task runs in Antigravity's mode `auto`, and a stuck subagent makes its job fail; every bridge task waits for 30 seconds of quiet before it ends (the 120-second sign-in limit still fits: real runs took 34 to 51 seconds).
- 2026-11-23 Q: may an agent or a script start or drive an Antigravity session, and what stays in scope / Decision by the user: no; host support only. What a person uses inside their own Antigravity session stays (install, host tables, the skills), and everything that reaches Antigravity from another host or from a script goes. D25 withdrawn, D26 added; the Constraints on driving a session (the protocol runner, its log, the wait rule, the mode for test runs) were removed.
- 2026-11-23 Q: may a skill inside a person's Antigravity session start a second Antigravity session / Decision by the user: no; a review goes to Codex, to Claude or to a subagent of the same session, and the session's own subagents stay (D26).
- 2026-11-23 Q: which `agy` commands may scripts and checks run / Decision by the user: scripts and checks may run `agy models`, `agy --version` and `agy plugin validate`; `agy plugin install` runs only after the user's yes, or is printed for the user to run (D27).
- 2026-11-23 Q: what counts as evidence for Antigravity / Decision by the user: a self-test that a person starts in their own Antigravity session with one pasted prompt per batch; the session runs the cases with its own tools and saves the replies, grading happens afterwards from the saved files, the pull request waits for it, and what it cannot show is recorded as not checked in Antigravity (D28). An earlier answer of the same day, one run by hand per case, was replaced by this one. R5, R14, R15, R21 and R22 were rewritten to it.
- 2026-11-23 Q: what the privacy check of `mstack-anonymize` does in Antigravity / Decision by the user: the skill works there and says in its text that the check was not run in that host; the Antigravity trace format leaves the spec, and the stricter check for Claude Code and Codex stays (D29, R16). Replaced the same day, see the line on D34.
- 2026-11-23 Evidence: one session a person opened (`agy` 1.5.15, mode `auto`) / Decision: a subagent loads a workspace skill, runs shell commands and starts its own subagent; the subagent record and transcript exist and name the model and the tools called. Recorded in Constraints; the open question on those files is closed.
- 2026-11-23 Evidence: the files of that session, read without running a client / Decision: a transcript holds each call's arguments, the main session has a transcript of its own, and a subagent record holds an agent type. Claims about what a session or a subagent read, ran or started are checked from the transcripts (R14, R15, R22); the shell-denied case of R14 rests on the skill's text; a privacy check for Antigravity is an open question for the user.
- 2026-11-23 Evidence: a second review by Codex of the amended specs / Decision: the covered plugins are the 22 of today for every host requirement, and the manifest check reads another spec's host assignments (R2); graders check the path the reader read and the agent type the caller asked for (R14, R15); R22 gains the case of Claude through its bridge; one list of counts in Verification; a case with missing evidence files is `not run`; D29's reason corrected.
- 2026-11-23 Evidence: a workflow has to be the session itself and start fresh / Decision: the self-test has four starts by the person, the skills batch, the pairings batch and one session for each of the two Antigravity-led workflows (D31, agent's call).
- 2026-11-23 Attribution: the user decided that grading happens afterwards from the saved files; that an agent in Claude Code or Codex does it is an agent's call (D31), because the question put to the user did not name the grader.
- 2026-11-23 Evidence: a review by Codex of the amended specs / Decision: R22's order of routes and its case for a Claude client without its bridge (D33); the covered plugins named by rule; D27 in the user's wording; what stays not checked in Antigravity narrowed to what no file shows.
- 2026-11-23 Agent's calls, for the user to see at approval: dated facts from the earlier agent-driven probes stay as history and the facts about driving a session go (D30); what the self-test's run log holds, that an agent in Claude Code or Codex grades it, and that the batch's prompt names the model to start on (D31); "not checked in Antigravity" only where no file can show a claim, in R14, R15, R16, R17 and R22 (D32); the order Codex, Claude, reread for R22, each vendor through its own client (D33); the self-test's four starts (D31). Status back to Draft for this change.
- 2026-11-23 Q: should `mstack-anonymize` get a privacy check for Antigravity / Decision by the user: yes; the check's script also reads the session's transcript and each subagent's, and the self-test runs the privacy cases (D34, R16). D29 withdrawn, the open question closed.
- 2026-11-23 Q: how Claude is reached from another host / Decision by the user: with Claude Code's own headless mode (`claude -p`), as Codex is reached with `codex exec`; mstack no longer depends on agent-bridges, and no skill checks for, installs or calls a bridge (D35). R22 lost its case for a Claude client without its bridge, and D33 was changed in place.
- 2026-11-23 Evidence: `claude --help` and one small run of Claude Code 2.1.330 / Decision: the print-mode facts in Constraints; a review of a real document and a run started from Antigravity are for the first runs to confirm.
- 2026-11-23 Approval: the user approved the re-scoped spec (host support only, the self-test, no bridge of agent-bridges, Claude through `claude -p`).
- 2026-11-23 Status back to Draft for this change. Evidence: a second session a person opened / Decision: a subagent's question goes to the person, so a case gets its answers up front and asking through the question tool is not checked in Antigravity (R17); a plugin agent's record names it, so R15's reader identity is checked; another vendor's client needs the person's approval for a run outside the sandbox; a plain `claude -p` loads the person's own setup, so its flags come from a confirming task.
- 2026-11-23 Q: when the self-test sessions run / Decision by the user: in one sitting at the end, after everything of the three specs is built; until then the Antigravity rows say `not run` (D36).
- 2026-11-23 Q: how much of agent-bridges stays in mstack / Decision by the user: none, in every host and every file; a skill calls the other vendor's own client, and what mstack needs to know about calling it is written in mstack's own words with the required credit (D37, R25).
- 2026-11-23 Evidence: a third and a fourth session a person opened, and `claude -p` runs from a clean environment / Decision: the batch protocol works on the cheap tier's model; the sandbox hides `claude` and `codex`, so R22 asks for a run outside it for the check and for each run and keeps a run that was not approved apart from a client that is not installed; `--safe-mode` is the candidate for every `claude -p` command, which this spec's plan confirms; the skills CLI case of R14 and R15 runs in the dev workflow session as a loose skill; the privacy check covers every descendant's transcript.
- 2026-11-23 Approval: the user approved the spec as re-scoped (the self-test in one sitting at the end, no bridge of another repository, Claude through `claude -p`), and decided that scripts may also run `agy --version`, which starts no session, so the run log names the client's version.
- 2026-11-23 Evidence: plan 1's task 1.3 (15 runs of `claude -p`, Claude Code 2.1.330) / Correction of a fact, made under the user's standing permission to fix and approve: the confinement text belongs to `--restricted`; `--safe-mode` does not confine a run; the developer command uses `--permission-mode acceptEdits --allowedTools "Bash"` (`auto` brought in a second model). Status stays Approved.
