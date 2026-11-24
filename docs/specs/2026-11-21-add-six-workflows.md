# Six workflows named by their leader, and the callers of mstack-vendors

Status: Approved 2026-11-23
Size: full    Mode: gated    Type: feature
Source: design brief `docs/briefs/2026-11-21-antigravity-host-support.md` (Approved 2026-11-21). This is spec 3 of 3. Spec 1 (`docs/specs/2026-11-21-add-antigravity-host.md`) makes Antigravity a host; spec 2 (`docs/specs/2026-11-21-add-mstack-vendors.md`) defines `mstack-vendors`. All three specs were re-scoped by the user's decisions of 2026-11-23 (D20 to D23, D26 and D28 to D30), which win where the brief says otherwise.

## Problem

mstack has three workflows, each a fixed pair: Claude leads and Codex reviews, Codex leads and Claude reviews, Claude manages and Codex writes. A person who leads from Antigravity has none, although both Codex and Claude could review there, and a person with a different pair than the fixed one gets a fallback review instead of a real one. The three workflow texts are 279, 317 and 271 lines of separate prose with the same ten numbered sections, so a rule changed in one has to be re-written in the others by hand, and `mstack-plan`, its plan start file and `mstack-skill-creator` each carry their own copy of the reviewer choice (repository, read 2026-11-21).

## Goals

1. From each of the three hosts a person can run a review workflow and a dev workflow that use whichever other vendors are installed: shown by one end-to-end run of each of the four Claude-led and Codex-led workflows with the real clients, and, for each of the two Antigravity-led workflows, by one end-to-end run in a self-test that a person starts in their own Antigravity session.
2. A rule of a workflow kind is written once: shown by a check that fails when two copies of one kind's text differ.
3. Every place that picks a reviewer or a developer asks `mstack-vendors`: shown by a search that finds no reviewer rule or vendor command outside it, apart from the exceptions the brief names.
4. Nobody gets an expensive model for a lane or a phase without having said yes to it.

## Non-goals

- Mapping old plan folders or keeping the three old workflow names as aliases: the user decided old plan folders are not carried over (brief).
- Running a workflow from another host than its leader's (brief).
- More than one developer per run (brief).
- An Antigravity session that an agent or a script starts or drives: Antigravity as a reviewer or a developer of any workflow, a second Antigravity session started from inside a person's own, and a test run of an Antigravity-led workflow that a script or another agent starts (decided by the user, 2026-11-23).
- Changing what a workflow does once its vendors are chosen (lanes, phases, fix rounds, integration, delivery) beyond what three hosts and the new reviewer rule require.
- The built-in steps of `mstack-product-plan` and `mstack-epic`, and `mstack-skill-creator`'s steps for OpenCode and Cursor, apart from their cross-vendor reviewer, which becomes a direct `claude -p` or `codex exec` run there too (brief; spec 1; D30).

Anti-goals:
- The reviewer rule or a vendor command written out in a workflow, in `mstack-plan` or in the plan start file.
- Two copies of one workflow kind that differ.
- A new workflow that reads a value an old version saved and silently runs with a reviewer or developer the user never chose.
- A lane or a phase on an expensive model the user did not approve for it.
- A workflow listed for a host in which no real run of it passed; for an Antigravity-led workflow the real run is the self-test's run in a session a person opened.
- A self-test row recorded as `pass` that was not run.
- A workflow, `mstack-plan` or `mstack-skill-creator` that checks for, installs or calls a bridge of the agent-bridges repository.

## Users and scenarios

1. As a developer in Claude Code, Codex or Antigravity with at least one other vendor installed, I want a review workflow in which my host's lanes write and the other vendors review, so that every lane gets a review from a vendor that did not write it.
2. As that developer, I want a dev workflow in which another vendor writes each phase and my session reviews and commits it, so that I manage instead of write.
3. As a person who approved a plan, I want its start file to offer the workflows of the host I open it in, so that I do not have to know their names.
4. As a contributor, I want to fix a workflow rule in one place per kind, so that the three hosts cannot drift apart.

## Requirements

A **kind** is `review` or `dev`. A **workflow** is one of `mstack-claude-led-review`, `mstack-claude-led-dev`, `mstack-codex-led-review`, `mstack-codex-led-dev`, `mstack-antigravity-led-review` and `mstack-antigravity-led-dev`. A **lane** is one parallel writer of a review workflow; a **phase** is one unit a dev workflow has developed and reviewed. In all six workflows a reviewer or a developer of another vendor is `claude` or `codex`, minus the provider of the leader's model and, for a review, minus the writers; this one rule is applied before availability is looked at, and the writers are excluded always, also when the leader is unknown (spec 2). `antigravity` is the vendor of an Antigravity leader, of its lanes and of its own fallback review only, and an Antigravity-led workflow runs in a session a person opened (D20).

### R1. Six workflows, each in its leader's host  [Must]
The repository SHALL ship the six workflows, each as a plugin for its leader's host only.
#### Scenario: a Codex workflow
- GIVEN the plugin `mstack-codex-led-dev`
- WHEN a reader looks at its manifests and registry entries
- THEN it has the Codex manifest and the Codex registry entry, and NO manifest or entry of another host
#### Scenario: an Antigravity workflow
- GIVEN the plugin `mstack-antigravity-led-review`
- WHEN a reader looks at it
- THEN it has the Antigravity manifest and no registry entry, because no Antigravity registry exists
#### Scenario: the checks accept them
- GIVEN the six plugins
- WHEN the marketplace check and the version-bump check run
- THEN both pass

### R2. One text per kind  [Must]
The three workflows of one kind SHALL carry the same workflow text after their name and description, with a three-column host table, and each SHALL add one host file, outside the folder of shared reference files, that says which host it is.
#### Scenario: identical bodies
- GIVEN the three `review` workflows
- WHEN the marketplace check compares their text below the name and description
- THEN the three are identical
#### Scenario: a copy drifts
- GIVEN one `dev` workflow whose text was edited alone
- WHEN the marketplace check runs
- THEN it exits non-zero and names the kind and the plugin that differs
#### Scenario: host-specific content
- GIVEN a step that differs by host (how a lane starts, which commands a sandbox blocks)
- WHEN a reader looks for it
- THEN it is a cell of the host table or a line of the host file, and the shared text does NOT name a host tool outside its table

### R3. The three old workflows are removed  [Must]
The repository SHALL no longer ship `mstack-codex-review-workflow`, `mstack-claude-review-workflow` and `mstack-claude-pm-codex-dev`: no plugin folder, registry entry, routing-table row, setup row or install command SHALL name them.
#### Scenario: gone from what runs
- GIVEN the repository after this spec
- WHEN a search for the three names runs over the plugin folders, the registries and the check scripts
- THEN it finds them only in the stop message of R4 and in that message's test data
#### Scenario: still explained
- GIVEN the README and the repository's agent instructions
- WHEN a reader searches them for an old name
- THEN each names its replacement
#### Scenario: marketplace version
- GIVEN plugins were added and removed
- WHEN the registries are read
- THEN the marketplace version has a minor bump, equal in both registries

### R4. A plan folder of a removed workflow  [Must]
IF a workflow is started on a plan folder whose progress file or start file names one of the three removed workflows, THEN it SHALL stop before any work, say which new workflows replace it and that the plan must be made again in a new folder, and change nothing.
#### Scenario: an old progress file
- GIVEN a plan folder whose progress file records a run of `mstack-claude-pm-codex-dev`
- WHEN `mstack-claude-led-dev` is started on it
- THEN it stops with that message, and it does NOT resume the run or pick a reviewer for it
#### Scenario: an old plan that never ran
- GIVEN a plan folder whose start file names the removed workflows and whose progress file records no run
- WHEN a new workflow is started on it
- THEN it stops with the same message
#### Scenario: a new plan
- GIVEN a plan folder written by the new `mstack-plan`
- WHEN a workflow is started on it
- THEN it runs

### R5. Preflight  [Must]
WHEN a workflow starts, it SHALL check its host's required tools and skills, `mstack-vendors` and `mstack-receive-review` among them, and stop with the install commands for a missing one, and, once a developer of another vendor is chosen, check that developer's side, treating a third-party dependency that has no Antigravity install as one warning line when the host is Antigravity, and in Antigravity it SHALL tell the user first and then ask for a run outside the client's sandbox for the check of another vendor's client and for each run of that client, keeping apart a client that was found, a client that is not installed and a run that was not approved.
#### Scenario: a client the sandbox hides
- GIVEN an Antigravity-led workflow on a machine whose `claude` and `codex` clients are not visible inside the client's sandbox
- WHEN the availability of the other vendors is checked
- THEN the user is told before the request, the check runs outside the sandbox once approved, and the workflow reports one of three outcomes per client (approved and found; approved and not installed; not approved) and does NOT report a client as not installed because the sandbox hid it or the approval was declined
#### Scenario: mstack-vendors missing
- GIVEN a session without `mstack-vendors`
- WHEN a workflow starts
- THEN it stops with the install commands for its host and the name `mstack-setup`
#### Scenario: ponytail in Antigravity
- GIVEN an Antigravity-led workflow with ponytail's skills installed and no hooks
- WHEN the preflight runs
- THEN it passes and says once that ponytail's hooks do not run there
#### Scenario: the developer's side
- GIVEN a Codex-led dev workflow in which the user chose `claude` as the developer, and a tool that the Claude side requires is missing
- WHEN the second part of the preflight runs
- THEN it stops with the install commands for that tool, starts NO developer run, and does NOT check for or install a bridge: the Claude side is the Claude Code client, signed in
#### Scenario: other hosts unchanged
- GIVEN a third-party dependency that has no Antigravity install, missing in a Claude Code or Codex session
- WHEN the preflight runs
- THEN it stops as it does today

### R6. The start of a review workflow  [Must]
WHEN a review workflow starts, it SHALL call `mstack-vendors` for `code review` with `Workflow: review`, the writers of R8 and, per vendor, the model skill's code-review model, and ask the user once which offered vendors review and whether to keep those models, the recommendation of the result being the default, and SHALL use the answer for the whole run, except that a vendor that wrote a lane does not review that lane (R8).
#### Scenario: two vendors offered
- GIVEN an Antigravity-led review workflow whose user named a Gemini model (R21), with `claude` and `codex` available
- WHEN it asks
- THEN the question recommends both with the model of each, and a yes runs both reviewers on every lane
#### Scenario: the user picks one, with another model
- GIVEN the same question
- WHEN the user picks `codex` alone and names another model
- THEN only Codex reviews, on that model, and the run does NOT add the other reviewer later
#### Scenario: a Claude-led or Codex-led workflow
- GIVEN a Claude-led review workflow with `codex` available
- WHEN it asks
- THEN the question offers `codex` alone, and it does NOT offer `antigravity`
#### Scenario: none offered
- GIVEN no other vendor available
- WHEN the workflow starts
- THEN it warns that the leader's own vendor reviews and runs the fallback review of the result, recorded as the result's Record column says

### R7. Lanes in each host  [Must]
A review workflow SHALL run its parallel lanes with its host's own means: subagents in Claude Code, separate Codex runs in Codex, and in Antigravity the lane agent that its plugin ships, whose tool list is limited to file reading, file editing and shell commands, on the model tier spec 1 gives for the lane's plan tier; IF that lane agent is not installed, THEN the Antigravity workflow SHALL do the items one after another in the session and say so.
#### Scenario: Antigravity lanes
- GIVEN an Antigravity-led review workflow installed as a plugin, with two lanes
- WHEN the lanes start
- THEN each is that lane agent in its own worktree, shown by the `TypeName` of the session's `invoke_subagent` call for each lane, by `subagentDescriptor.typeName` of the subagent record that the call matches, which holds the lane agent's name, and by each lane's transcript (its commands, the files it read and wrote, its model); each lane's record and transcript are found by the conversation id that the lane's `invoke_subagent` call returned, or by the record's `spawnStepIndex`, and NOT by the role alone, which two lanes of one type share
#### Scenario: a lane cannot do more
- GIVEN an Antigravity lane told to search the web
- WHEN it tries
- THEN the lane's reply says it has no such tool, its transcript shows no web search call, and the lane agent's file in the plugin lists no web tool (a repository check)
#### Scenario: installed without the lane agent
- GIVEN the Antigravity workflow installed with the skills CLI, so no lane agent exists
- WHEN it runs work with two independent items
- THEN it does them one after another in the session, says that lanes need the plugin install, and does NOT start a subagent without a tool list (shown by the path of the skill that was loaded, a loose skill folder and not the plugin, by the session's subagent records, which hold no agent of that plugin, and by the transcript of the subagent that ran the case, which holds no `invoke_subagent` call for those items)
#### Scenario: no lanes
- GIVEN a run in the mode without lanes
- WHEN the work is done
- THEN the session did it itself, and the writers are the leader's vendor alone

### R8. Who wrote a review workflow's code  [Must]
A review workflow SHALL name as writers the leader's vendor and, when it runs lanes, the vendor of its lanes, counting Antigravity lanes as `antigravity` at the start, SHALL read each Antigravity lane's transcript, found by the conversation id its start returned and verified by the record's agent type, before it launches a reviewer of that lane and leave out of that lane's reviewers a vendor whose model the transcript names, and IF the session cannot read an Antigravity lane's transcript, or that transcript names no model or a model that is not a Gemini model, THEN it SHALL call `mstack-vendors` again with `Writers: unknown` before that lane's review is recorded.
#### Scenario: Gemini lanes
- GIVEN an Antigravity-led workflow whose user named a Gemini model and whose session read its lanes' transcripts (a `read_file` call with each lane transcript's path in the session's own transcript), which name Gemini models
- WHEN the reviews are recorded
- THEN the writers are `antigravity`, and a Codex review is recorded as cross-vendor
#### Scenario: a leader on a Claude model, with lanes
- GIVEN an Antigravity-led workflow with lanes whose session runs a Claude model
- WHEN it calls `mstack-vendors` at the start
- THEN it names both `claude` and `antigravity` as writers
#### Scenario: a transcript without a Gemini model
- GIVEN a lane whose transcript the session cannot read, or whose transcript names no model or names a Claude model
- WHEN its review is recorded
- THEN the record says `writer unknown`, and NOT cross-vendor
#### Scenario: a lane written by a chosen reviewer's vendor
- GIVEN an Antigravity-led workflow with `claude` and `codex` chosen as reviewers, and a lane whose transcript names a Claude model
- WHEN that lane finishes
- THEN the transcript is read before any reviewer of the lane starts, Claude is NOT launched for that lane, Codex reviews it (the fallback review when no chosen reviewer is left), and the record says `writer unknown`
#### Scenario: the session does not know its model
- GIVEN an Antigravity-led review workflow whose user answered R21's question with "I do not know"
- WHEN the workflow calls `mstack-vendors`
- THEN it sends no `Leader model` line, and the result's leader is `unknown`

### R9. Reviews of a lane  [Must]
WHEN a lane of a review workflow finishes, the workflow SHALL follow the steps of the `mstack-vendors` result for the chosen reviewers: both in parallel when there are two, the one repair of a failed run, the fallback review when no chosen reviewer returned an answer, and every set of findings handed to `mstack-receive-review` unmerged with its vendor.
#### Scenario: two reviewers
- GIVEN a finished lane and two chosen reviewers
- WHEN the review step runs
- THEN both reviews start before either is awaited (in an Antigravity session's transcript both launches, each a `run_command` call with its command line, come before the first result is read), and the receiving skill gets both sets of findings with their sources
#### Scenario: one of two fails
- GIVEN one reviewer's run fails after its one repair and the other returns findings
- WHEN the review step ends
- THEN the lane counts as reviewed by the vendor that answered, and the report names the failed run
#### Scenario: the only reviewer fails
- GIVEN one chosen reviewer whose run fails after its one repair
- WHEN the review step ends
- THEN the fallback review runs with a warning, and the failed run is NOT counted as a review

### R10. The start of a dev workflow  [Must]
WHEN a dev workflow starts, it SHALL call `mstack-vendors` for `developer` and ask the user which listed vendor develops and on which of the model skill's models for it, then call it for `code review` with `Workflow: dev` and that vendor as the writer and ask whether each offered second reviewer reviews too, and IF no vendor can develop, THEN stop, say that a dev workflow needs a second vendor, and name its host's review workflow.
#### Scenario: two candidates
- GIVEN an Antigravity-led dev workflow whose user named a Gemini model (R21), with `claude` and `codex` available to develop
- WHEN it asks
- THEN it names both without preferring one, and the one the user picks develops every phase on the model picked
#### Scenario: a third vendor
- GIVEN an Antigravity-led dev workflow whose user named a Gemini model (R21), in which the developer is `codex` and the result says `Recommend: the leader's review + claude`
- WHEN the workflow asks
- THEN a yes adds Claude's review to every phase, and a no leaves the leader's review alone
#### Scenario: a Claude-led or Codex-led workflow
- GIVEN a Claude-led dev workflow with `codex` available
- WHEN it asks
- THEN `codex` is the only developer it names, no second reviewer is offered, and `antigravity` is NOT named as a developer or as a reviewer
#### Scenario: no second vendor
- GIVEN a machine with only the leader's vendor
- WHEN a dev workflow starts
- THEN it stops with that message and starts NO developer run

### R11. A phase of a dev workflow  [Must]
WHEN a phase of a dev workflow is developed, the workflow SHALL run the developer by the steps of the `mstack-vendors` result, on the model the user picked, with only the effort varying by phase as it does today, review the result itself in parallel with the second reviewer when one was chosen, keep its own finished review and report the failure when that second reviewer's run fails, send accepted findings back to the same developer session, and commit the phase only after its reviews were processed.
#### Scenario: the leader always reviews
- GIVEN a finished phase
- WHEN the review step runs
- THEN the leader reviews the diff itself, whether or not a second reviewer was chosen
#### Scenario: the second reviewer fails
- GIVEN a phase whose result said `Recommend: the leader's review + claude`, the user's yes to it, and a Claude review that still fails after its one repair
- WHEN the review step ends
- THEN the leader's finished review stands, the report names the failed run, and NO fallback review is started for it
#### Scenario: the developer never reviews its own code
- GIVEN a dev workflow with `codex` as the developer
- WHEN reviewers are offered or run
- THEN `codex` is NOT among them
#### Scenario: a fix round in a copy
- GIVEN a Claude developer whose phase drew accepted findings
- WHEN the workflow sends them back
- THEN the developer continues in the same copy, which still holds its first changes, in the same Claude session, resumed by the session id that its first run returned, and the phase is reviewed again before a commit
#### Scenario: nothing unreviewed is committed
- GIVEN a phase whose developer run ended and whose review has not happened
- WHEN the workflow would commit
- THEN it does NOT commit that phase

### R12. Asking before an expensive model at run time  [Must]
WHEN a workflow is about to run a lane, a developer or a reviewer on a model that the model skill flags as expensive, it SHALL ask the user about it in a question of its own (per lane, and once at the start for the developer's and each reviewer's model) with the next model down as the alternative, unless the plan records the user's approval of that model for every task of that lane or the user named that model for that lane or that role; the fallback review asks nothing where it runs on the session's own model (a subagent that inherits it), and a model that the caller's `Models` line supplies for a fallback run falls under this question like any other.
#### Scenario: a most capable lane in Codex
- GIVEN a Codex-led review workflow and a lane on the tier `most capable`, whose Codex model is flagged
- WHEN the workflow assigns the lane's model
- THEN it asks one question for that lane before starting it
#### Scenario: the plan approved another model
- GIVEN a plan whose record approves a flagged Claude model for a task, and a Codex lane that holds that task
- WHEN the workflow assigns the Codex model
- THEN it asks, because the approval names another model
#### Scenario: a lane with a declined task
- GIVEN a lane that joins a task with an approval and a task without one
- WHEN the workflow assigns the lane's model
- THEN it asks for the lane, and the one approval does NOT cover it
#### Scenario: named for another lane
- GIVEN the user named a flagged model for lane A
- WHEN the workflow assigns the same model to lane B
- THEN it asks for lane B
#### Scenario: a flagged model offered for a reviewer or a developer
- GIVEN a workflow at its start, and the model skill's model for a `codex` or `claude` reviewer or developer is flagged
- WHEN the workflow reaches that role's model
- THEN it asks one question of its own about that model, with the next model down as the alternative, before the first run of that role, and a model the user typed for that role draws NO question
#### Scenario: a fallback run on a supplied model
- GIVEN a Codex-led workflow whose fallback review is a fresh Codex run, and a flagged model supplied for it that differs from the session's model
- WHEN the fallback review is about to run
- THEN the workflow asks about that model first; a fallback run that names no model option runs the client's configured model, which may differ from the session's, draws NO question, and is recorded as the result says (`reviewer unknown` unless the run's own output names the model)
#### Scenario: declined
- GIVEN the user answers no
- WHEN the lane starts
- THEN it runs on the next model down that is not flagged
#### Scenario: not flagged
- GIVEN a model the model skill does not flag
- WHEN the workflow assigns it
- THEN it asks nothing

### R13. The approval of an expensive model in the plan format  [Must]
The plan format SHALL give a task whose expensive tier the user approved a line that names the approved models, and a plan without that line SHALL count as holding no approval.
#### Scenario: written by mstack-plan
- GIVEN a task for which the user said yes to a flagged model in `mstack-plan`
- WHEN the plan is written
- THEN the task carries the approval line with that model's name, and the plan check accepts it
#### Scenario: a plan without the line
- GIVEN a plan whose tasks carry no approval line
- WHEN a workflow reads it
- THEN no task counts as approved, and the workflow asks as R12 says

### R14. The plan review in mstack-plan  [Must]
WHEN `mstack-plan` reviews a plan, it SHALL call `mstack-vendors` for `plan review` with the vendors its progress file records as having written the plan, or `unknown` when it records none for part of it, and ask the user which offered reviewers review and on which model as R6 does.
#### Scenario: two reviewers
- GIVEN `mstack-plan` in an Antigravity session with `claude` and `codex` available
- WHEN the plan review starts
- THEN it offers both, each row says `writer unknown` because `mstack-plan` does not ask for the session's model (D18), and after a yes both review the plan in parallel
#### Scenario: one other vendor
- GIVEN `mstack-plan` in Claude Code with `codex` available
- WHEN the plan review starts
- THEN `codex` is the only reviewer offered, and `antigravity` is NOT offered
#### Scenario: a plan continued in another host
- GIVEN a plan begun in Claude Code and continued in Codex
- WHEN the plan review starts in Codex
- THEN the writers are `claude` and `codex`, and neither is offered as a reviewer
#### Scenario: mstack-vendors missing
- GIVEN a session without `mstack-vendors`
- WHEN `mstack-plan` starts
- THEN it stops with the install commands, as for its other required skills

### R15. The plan start file  [Must]
The start file that `mstack-plan` writes SHALL offer, in whichever of the three hosts it is opened, inline execution and that host's two workflows by name, and SHALL have an inline run take its final review from `mstack-vendors`, naming as writers the vendors the progress file records as having executed the plan's tasks, this session's included, and running the user's pick of the offered reviewers, or, when the result offers none, the fallback review by the result's Steps with its warning and its Record value, stopping with the install commands when that skill is missing.
#### Scenario: opened in Antigravity
- GIVEN a start file opened in an Antigravity session
- WHEN it offers the ways to execute
- THEN it names `mstack-antigravity-led-review` and `mstack-antigravity-led-dev`, and NOT a workflow of another host
#### Scenario: an inline run's review
- GIVEN an inline run that reached its final review with two reviewers offered
- WHEN it picks
- THEN it asks the user once, runs what the user picks with the result's commands, and the start file holds NO reviewer command of its own
#### Scenario: no reviewer offered
- GIVEN an inline run in an Antigravity session whose result, a prepared one in the self-test, says `Recommend: a fallback review`
- WHEN the final review starts
- THEN a subagent of the session on the tier that inherits its model reviews, shown by the session's subagent record and that subagent's transcript, the warning is shown, and the review is recorded with the result's Record value, NOT as cross-vendor
#### Scenario: planned in one host, executed in another
- GIVEN a plan written in Claude Code and executed inline in Codex
- WHEN the final review starts
- THEN the writers are `codex`, and `codex` is NOT offered as a reviewer of that code
#### Scenario: an old start file
- GIVEN a start file written before this spec
- WHEN it is opened for inline execution
- THEN it behaves as it was written, and the new skills do NOT rewrite it

### R16. The cross-vendor review in mstack-skill-creator  [Must]
WHEN `mstack-skill-creator` starts in Claude Code, Codex or Antigravity, it SHALL require `mstack-vendors` and `mstack-receive-review`, and its cross-vendor review SHALL take the reviewers and their commands from the first, or run the fallback review by the result's Steps with its warning and its Record value when the result offers no reviewer, and process the findings with the second, while in OpenCode and Cursor it SHALL keep its built-in steps, with a direct `claude -p` or `codex exec` run as their cross-vendor reviewer.
#### Scenario: Claude Code
- GIVEN a new skill packaged in Claude Code with `codex` available
- WHEN the review step runs
- THEN the reviewers come from the `mstack-vendors` result, and `antigravity` is NOT among them
#### Scenario: no reviewer offered
- GIVEN the review step with a result that says `Recommend: a fallback review`
- WHEN it runs
- THEN it follows the result's Steps for the fallback review, shows the warning, and does NOT record the review as cross-vendor
#### Scenario: missing in Codex
- GIVEN a Codex session without `mstack-vendors`
- WHEN `mstack-skill-creator` starts
- THEN it stops with the install commands
#### Scenario: Cursor
- GIVEN the same step in Cursor
- WHEN it runs
- THEN it follows the built-in steps, whose cross-vendor reviewer is a direct `claude -p` or `codex exec` run, and it does NOT stop for a missing `mstack-vendors` and does NOT call or install a bridge

### R17. Shared reference files  [Must]
The six workflows SHALL ship identical copies of every shared reference file and of the third-party notices, the plan format SHALL be identical in them and in `mstack-plan`, the code-index steps SHALL be identical in them and in the four other skills that ship them, and the shared file on external facts SHALL treat a research result that says pages were not opened as leaving its page claims open.
#### Scenario: a copy differs
- GIVEN one workflow whose copy of a shared reference file was edited alone
- WHEN the marketplace check runs
- THEN it exits non-zero and names the file and the plugin
#### Scenario: pages not opened
- GIVEN a research result whose last line is `Search: ran, pages not opened (shell commands denied)` or `Search: ran, pages not opened (no restricted reader)`
- WHEN a workflow uses it
- THEN it treats each claim about a page as unconfirmed and keeps a claim read from a local file

### R18. Workflow and vendor rows in mstack-setup and mstack-auto  [Must]
`mstack-setup` SHALL report, in each host, that host's two workflows as it reports today's, and `mstack-vendors` among its mandatory rows, and the routing table of `mstack-auto` SHALL have a row for each of the six workflows, naming its host and its counterparts in the other hosts, and a row for `mstack-vendors` with all three hosts.
#### Scenario: setup in Codex
- GIVEN a Codex session without `mstack-vendors`
- WHEN `mstack-setup` runs its status step
- THEN it lists `mstack-codex-led-review` and `mstack-codex-led-dev`, shows `mstack-vendors` as missing among the mandatory rows, does NOT report setup as complete, and shows NO row for a bridge
#### Scenario: routing
- GIVEN a person in Antigravity who asks mstack to run a plan with a developer of another vendor
- WHEN `mstack-auto` picks
- THEN it picks `mstack-antigravity-led-dev`

### R19. Repository documents  [Must]
The README and the repository's agent instructions SHALL describe the six workflows, the two shared texts and their check, the callers of `mstack-vendors`, and what replaced the three removed workflows, and no file of the repository, in any host (skills, reference files, scripts, checks, tests, eval cases, setup rows, the routing table, the README and the agent instructions), SHALL name agent-bridges, one of its bridges or its install line, apart from the credit in a skill's third-party notices for text adapted from it.
#### Scenario: agent instructions
- GIVEN the section on the files the workflows share
- WHEN a contributor reads it
- THEN it says six workflows, one text per kind, and which check fails when copies differ
#### Scenario: replaced workflows
- GIVEN a person who knows an old workflow's name
- WHEN they search the README for it
- THEN they find which new workflow replaces it and that old plan folders are made again
#### Scenario: no bridge
- GIVEN every file of the repository that ships or runs after this work, the OpenCode and Cursor host files of `mstack-skill-creator` included (specs, briefs and plan folders are a record of the work and do not count)
- WHEN a search runs over them for agent-bridges, the names of its bridges, their companions and skills, and their install lines
- THEN it finds them only as a credit in a third-party notices file, Claude is reached with `claude -p` and Codex with `codex exec`, and the OpenAI Codex plugin's own companion, which is not part of agent-bridges, does NOT count

### R20. Real-client evidence  [Must]
Each of the four Claude-led and Codex-led workflows SHALL have one recorded end-to-end run that an agent made in its host with the real clients on the cheap tier's models, and each of the two Antigravity-led workflows SHALL have one end-to-end run in a self-test that a person started in an Antigravity session they opened, in which that session itself runs the workflow, one session per workflow, puts its questions to the person, and saves its replies and a run log, every run going from start to a reviewed commit on a small fixture plan, and a run that was not made SHALL be recorded as `not run`.
#### Scenario: recorded
- GIVEN the four Claude-led and Codex-led workflows
- WHEN the pull request is opened
- THEN its description lists, per workflow, the reviewer or developer vendors used, the date and the outcome
#### Scenario: the self-test
- GIVEN the two Antigravity-led workflows, each run by a session a person opened on the model the self-test's prompt names and started with that prompt, the review workflow with both `codex` and `claude` as reviewers and the dev workflow with one of them as the developer and the other as the second reviewer
- WHEN the runs are graded afterwards from the saved files
- THEN each run's saved files hold the date, the client's version, the session's model as the person's answer from the self-test's answer sheet states it and as the transcript of a subagent on the inheriting tier names it, the prompt, the session's replies and the reviewed commit, and the pull request's description lists each run with the vendors used and the outcome
#### Scenario: what the person is asked
- GIVEN a workflow's self-test session
- WHEN the person starts it
- THEN the self-test's text has told them, before the first question, which runs they will be asked to approve (the availability check and each `claude -p` or `codex exec` run outside the client's sandbox, and every other helper a case starts there, such as a fixture's Git server) and which answer to give to each question of the workflow, and a short case's subagent takes its answers from the list in its prompt and does NOT call the question tool
#### Scenario: a self-test run not made yet
- GIVEN an Antigravity-led workflow whose self-test run has no saved files
- WHEN the table of runs is read
- THEN its row says `not run`, and NOT `pass`, and the pull request is NOT opened while a row of the self-test, a short case of Verification included, says `not run` or fails; a case whose evidence files are missing is `not run` and holds it until the case is repeated, and only a single claim that the agreed test cannot establish is recorded as "not checked in Antigravity", which does NOT hold it
#### Scenario: no session started for a test
- GIVEN the scripts, tests and eval cases that this work adds
- WHEN a search runs over them for a command that starts an Antigravity session (the client run with a prompt or as a server for another program, or a call of a bridge of the agent-bridges repository)
- THEN it finds none; `agy models` and `agy plugin validate` start no session and do NOT count, and the self-test's prompt is pasted by a person, NOT sent by a script
#### Scenario: a run that fails
- GIVEN a workflow whose run does not reach a reviewed commit
- WHEN the failure is found
- THEN it is fixed first, and the pull request is NOT opened with that workflow failing

### R21. The leader's model in an Antigravity-led workflow  [Must]
WHEN an Antigravity-led workflow starts, it SHALL ask the user once, before its first `mstack-vendors` call, which model the session runs on, offering the ids of the client's own model listing and "I do not know", SHALL send an answer that is exactly one of the offered ids as `Leader model` in every call of the run, and SHALL send no `Leader model` line when the user does not know, gives any other answer, cannot be asked, or the listing cannot be read, and its final report SHALL say that the leader's model was stated by the user, or that it is unknown and why.
#### Scenario: the user names a Gemini model
- GIVEN an Antigravity-led review workflow
- WHEN the user picks a Gemini id from the listing
- THEN every call of the run carries that id as `Leader model`, the result's leader is `antigravity`, and the final report says the leader's model was stated by the user
#### Scenario: the user names a Claude model
- GIVEN the same question in an Antigravity-led dev workflow
- WHEN the user picks a Claude id
- THEN the leader is `claude`, the result warns once that the session runs another provider's model, `claude` is NOT offered as a developer or as a second reviewer, and NO review by a Gemini model is offered, because that would need a second Antigravity session
#### Scenario: the user does not know, review workflow
- GIVEN the question in a review workflow
- WHEN the user answers "I do not know"
- THEN the workflow sends no `Leader model` line, the leader is `unknown`, and every review of the run is recorded `writer unknown`
#### Scenario: the user does not know, dev workflow
- GIVEN the question in a dev workflow whose developer is `codex`
- WHEN the user answers "I do not know"
- THEN `codex` is NOT offered as a reviewer, because it wrote the code, the leader's own review is recorded `reviewer unknown`, a `claude` second reviewer is recorded from the known writer as the result says (`cross-vendor`), and NO review is recorded as cross-vendor on the strength of the leader's vendor
#### Scenario: an answer that is not an offered id
- GIVEN the question
- WHEN the user types an id the listing does not hold
- THEN the workflow treats it as "I do not know", says so once, and does NOT send the typed text as `Leader model`
#### Scenario: the listing cannot be read
- GIVEN a run in which the client's model listing fails or is empty
- WHEN the workflow starts
- THEN it sends no `Leader model` line, records the reason in its final report, continues under the rules for an unknown leader, and does NOT guess an id (checked by a fixture of the shared workflow text; not checked in Antigravity, because the self-test does not make the client's listing fail)
#### Scenario: nobody can answer
- GIVEN a run that cannot put a question to the user
- WHEN the workflow starts
- THEN it sends no `Leader model` line, records the reason in its final report, continues under the rules for an unknown leader, and does NOT guess an id (checked by a fixture of the shared workflow text; not checked in Antigravity, because a session a person opened, and its subagents, can always ask)
#### Scenario: asked once
- GIVEN a run with several `mstack-vendors` calls
- WHEN the workflow makes a later call
- THEN it reuses the answer, and it does NOT ask again
#### Scenario: other hosts
- GIVEN a Claude-led or Codex-led workflow
- WHEN it starts
- THEN it asks nothing about the model, because the host tells the leader's vendor

## Constraints and assumptions

- No agent and no script starts or drives an Antigravity session; a person opens it and uses the workflows there. From inside that session a workflow uses the session's own subagents, shell and files, and reaches Codex with `codex exec` and Claude with `claude -p`. Scripts and checks may run `agy models`, `agy --version` and `agy plugin validate`; `agy plugin install` runs only after the user's yes, or is printed for the user to run (decided by the user, 2026-11-23).
- mstack does not depend on the agent-bridges repository: Claude is reached from Codex and from Antigravity with Claude Code's own headless mode, `claude -p`, as Codex is reached with `codex exec`; the channel of `claude` is the Claude Code client itself, signed in (decided by the user, 2026-11-23). Read from the installed client (Claude Code 2.1.330, `claude --help`, and one small run, 2026-11-23): `claude -p` takes the prompt on stdin or as an argument and exits when done; `--output-format json` prints one JSON object with, among others, `result`, `session_id`, `is_error`, `permission_denials`, `stop_reason` and `num_turns`; a run with `--model haiku --output-format json --permission-mode plan --tools "Read,Grep,Glob"` returned `result: "ok"`, a `session_id` and `is_error: false`; the client has `--model`, `--effort <low|medium|high|xhigh|max>`, `--permission-mode <acceptEdits|auto|bypassPermissions|manual|dontAsk|plan>`, `--tools`, `--allowedTools` and `--disallowedTools`, `--restricted`, `-r, --resume <session id>`, `--session-id <uuid>` and `--add-dir`. Not probed, and for the first runs to confirm: a review of a real diff, a developer run that writes, a resume, and any run started from Codex or from Antigravity. A reviewer run is read-only, a developer run writes only inside the developer's copy and continues a fix round with `--resume <session id>`, the caller keeping the `session_id` of the JSON result (spec 2; the exact flags are confirmed by one task of spec 1's plan, the line after next).
- Seen in a second session that a person opened (`agy` 1.5.15, 2026-11-23): the session's own id is in its context, so a session can write its id into a file; a subagent's `ask_question` goes to the person, not to the session that started it, and a message the session sent meanwhile stayed queued and did not answer it; a skill of a plugin under the workspace's `.agents/plugins/<plugin>/` loaded for a subagent; a plugin's agent (an agent file with `tools: [read_file]`) started when the session named it as the agent type, and its subagent record says `subagentDescriptor: {"typeName": "<agent name>", "role": "<agent name>"}`, where a subagent with no agent type says `typeName: "self"`; `claude -p` and `codex exec`, run by the session as shell commands, failed inside the client's sandbox with exit 127 (`command not found`), and after the person approved a run outside the sandbox both completed in the same turn, in about 20 seconds each. So every call of another vendor's client from an Antigravity session needs the person's approval for an unsandboxed run, at least as that session was set up. That `claude -p` call (`--model haiku --output-format json --permission-mode plan --tools "Read,Grep,Glob"`, a one-word prompt) reported about 196,000 cache-creation tokens and a cost of about 0.79 USD, its `modelUsage` named `claude-sonnet-5-5` and not the model asked for, and its `result` held extra sentences from the person's own Claude Code customizations: a plain `claude -p` loads the person's whole Claude Code setup, so it is costly, may run another model than asked, and its output is not clean. `claude --help` lists `--bare` and `--safe-mode`, tried afterwards (the line below). `codex exec --skip-git-repo-check -s read-only '<prompt>'` printed a header (model, sandbox, session id), the answer after a line `codex`, and `tokens used`.
- Seen in a third and a fourth session that a person opened (`agy` 1.5.15, 2026-11-23): on the cheap model (`gemini-3.8-flash-medium`) three cases, one subagent each with its `Role` equal to the case id, took 2 minutes 45 seconds; each subagent took its answers from the list in its prompt and did not call the question tool, and wrote its files in its case's folder when told to start every shell command with `cd <absolute folder> && `; the session wrote its reply and session files as told and reported the client's version and its mode as `unknown`, because it cannot see them. Inside the client's sandbox `node`, `git` and `curl` are found, for the session and for each subagent; `claude` and `codex` are not, also with their folder put on `PATH`, because on that machine they are installed under the person's home folder, which the sandbox does not show; a write to a folder next to the workspace succeeded. A subagent that asked for a run outside the sandbox got it, and `claude -p` and `codex exec` then completed (exit 0); a subagent that did not ask reported `command not found` (exit 127). Whether the person is shown an approval each time was not recorded: the work plans for one approval per run.
- `claude -p` run from a clean environment (Claude Code 2.1.330, 2026-11-23, a one-word prompt, `--output-format json --permission-mode plan --tools "Read,Grep,Glob"`): plain, about 149,000 cache-creation tokens, 0.60 USD, and extra text from the person's customizations in `result`; with `--bare`, it fails with `Not logged in`, so it is unusable with a subscription sign-in; with `--safe-mode`, the sign-in works, about 4,700 tokens, 0.02 USD, and `result` is exactly `ok`. The help text of `--safe-mode` says that all customizations are disabled, file tools are confined to the working directories (`--add-dir` included), `bypassPermissions` is refused, and only a person or the configured permission handler approves writes. Corrected 2026-11-23 by the task that confirmed the commands (15 real runs): the confinement of file tools, the refusal of `bypassPermissions` and the rule on who approves writes are in the help text of `--restricted`, not of `--safe-mode`; under `--safe-mode` a reviewer run read a file outside its working folder and a developer run under `--permission-mode auto` wrote one outside its copy, each with no denial, so neither recorded command confines a run to its folder. The developer command uses `--permission-mode acceptEdits --allowedTools "Bash"`: `acceptEdits` alone was denied the shell and could not run the tests, and `--permission-mode auto` brought a second model, not asked for, into one run to judge permissions; with the shell allowed by rule a write and its resume ran with no denial and only the model asked for. That command lets the developer run any shell command, so the throwaway copy without a remote is its only limit. The alias `haiku` ran `claude-sonnet-5-5` in all three runs, `--model claude-haiku-5-5` ran Haiku and `--model opus` ran `claude-opus-5-5`, so a command uses a full model id where the alias is not proven, and the caller checks `modelUsage`. Not tried: `--effort`, a review of a real diff, a write, a resume, `--plugin-dir` under `--safe-mode`. One task of spec 1's plan confirms the complete commands that callers ship, for a reviewer and for a developer (with `--safe-mode`, a full model id, the effort, the JSON output and the tool and permission flags; the model that ran, the cost and a clean `result`; a write and its resume as a pair under the same flags; and the developer's way to write without a person, because `--safe-mode` refuses `bypassPermissions`), and stops and reports if no such command exists. A workflow and its host file take the command from the `mstack-vendors` result and never name a file of a plan folder.
- A long `claude -p` or `codex exec` command is run as it is, with no background job. In Antigravity the session is told when a command completes, and a workflow does not report or finish before it has seen the command's completion and its output.
- The three workflows today have the same ten numbered sections (0 to 9) and eight shared reference files; two ship a lane check script, the developer workflow ships the Codex job script, which spec 2 moves into `mstack-vendors` (repository, read 2026-11-21).
- The repository's agent instructions require the workflows' section numbers to stay the same, because the shared files point at them; with one text per kind this holds within a kind, and the shared files keep pointing at numbers both kinds use.
- A Codex leader's sandbox blocks some of its commands (Git writes, network for lanes and reviews), so a Codex-led run asks the user to approve them (today's Codex-led workflow).
- An Antigravity subagent takes a tier, not a model id or an effort, and its `tools` list is enforced (spec 1; probes of 2026-11-22). This and the other probes of 2026-11-21 and 2026-11-22 named below were made in sessions an agent started; they stay as a dated record of what was seen, no further probe of that kind is made, and what a person sees in a session they opened wins over them.
- Seen in one session that a person opened (`agy` 1.5.15, 2026-11-23, session mode `auto`): a subagent of the session loaded a skill installed under the workspace's `.agents/skills/` and replied with the skill's exact line; a subagent ran a shell command, and in mode `auto` the client did not ask the person; a subagent started a subagent of its own, which answered and has its own record on disk; the session's subagent record and the subagent's transcript (the two paths named below) both exist, and the session itself read them: the transcript names the model (`gemini-4-neon-medium`, the session's own model) and the tools called (`read_file`, `run_command`, `invoke_subagent`, `send_message`). A subagent reported this tool list: `ask_question`, `define_subagent`, `edit_file`, `invoke_subagent`, `manage_subagents`, `manage_task`, `read_file`, `run_command`, `run_workflow`, `schedule`, `search_web`, `send_message`, `swarm`, `write_file`. Read from that session's files afterwards (2026-11-23, no client run): a transcript's `tool_calls` entries carry `name` and `args` (`read_file` with `Path`; `run_command` with `CommandLine`; `write_file` with `Path` and `Content`; `invoke_subagent` with `Prompt`, `Role`, `TypeName` and, in a subagent's own call, `Model`; `send_message` with `Message` and `Recipient`); the main session's own transcript (`~/.gemini/antigravity-cli/brain/<session id>/.system_generated/logs/transcript.jsonl`) records its own tool calls the same way; a subagent record holds `conversationId`, `spawnStepIndex`, `state`, `subagentDescriptor` (`typeName`, `role`) and `workspaceUris`, and for a subagent started with no agent type `typeName` was `self` and `role` the name the caller gave. What `typeName` holds for a plugin's agent was not seen. So which file a subagent or the session itself read or wrote, which command it ran, which subagent it started and which model a subagent ran can be shown from the transcripts of a session a person opened; what a model was given as context cannot.
- An Antigravity session cannot name its own model: started without a model option, and started with a Gemini or a Claude id, it answered UNKNOWN each time (probed 2026-11-22). A subagent's own transcript does name its model in a `model` field (a subagent on the tier `flash` showed a Gemini Hydrogen id that the client's listing lacks; probed 2026-11-22).
- No source says which provider runs an Antigravity subagent tier; the tier names `flash` and `pro` are names of Gemini models. `~/.gemini/antigravity-cli/brain/<sessionId>/.system_generated/subagents/<subagent id>.json` lists a session's subagents and `~/.gemini/antigravity-cli/brain/<subagent id>/.system_generated/logs/transcript.jsonl` is each one's transcript, which names the model in a `model` field (probed 2026-11-22). A session that a person opened writes both files and read them itself (seen 2026-11-23, the line above); R8 still covers a transcript that cannot be read or names no model.
- An agent file that ships with an Antigravity plugin has a `tools` list that is enforced, and its agent always gets the message tool as well (probe reader of 2026-11-21). The tool that defines a subagent while a session runs takes on and off switches for groups of tools, not a tool list (reported by an Antigravity session about its own tool; not seen in a call). A skills CLI install has no agent file.
- Today a dev run has one developer model for the whole run; its effort starts from the user's choice, is lowered when every task of a phase is cheap and raised on a second round; the workflows ask the user at the start for the reviewer's model and effort, each with its own default (today's workflows).
- `mstack-plan` accepts a plan folder at any path and resumes a draft plan in another session or host (its skill text).
- `mstack-vendors` gives commands only for vendors the caller names models for, and its steps cover waiting, collecting, the developer's copy and failures (spec 2).
- The model skill flags expensive models in a last column, and `mstack-plan` asks per stage before recording an expensive choice (spec 1, R23 and R24).
- A plan records a tier per phase and task, never a model name (the plan format); R13 adds the approval line.
- Plugins added and removed need a minor bump of the marketplace version; a plugin of one host has only that host's manifest, and its registry entry where a registry exists: none does for Antigravity (repository agent instructions; brief).
- Old plan folders are not carried over (brief). Today `mstack-plan`, when it resumes a folder with a start file of an earlier version, replaces two passages of that file about a rejected reviewer model; that small migration stays, and nothing else rewrites an old start file.

## Decisions

D1. Six workflows named by their leader, each in its own host, each asking which installed vendor reviews or develops. Decided by: user. Source: brief.
D2. One text per kind, shipped in the three plugins of that kind with a short host file, compared by the marketplace check. Alternatives: six separate texts (every rule six times); two plugins for all hosts (drops the six names). Decided by: user. Source: interview 2026-11-21.
D3. Antigravity lanes are subagents with a fixed tool list and a tier. Alternatives: separate `agy` runs with permissions skipped; no parallel lanes. Decided by: user. Source: interview.
D4. The three old workflows are removed without aliases, and old plan folders are not mapped. Decided by: user. Source: brief.
D5. The user's pick of reviewers at the start holds for the whole run. Alternative: ask per lane. Decided by: agent's call, because the brief has the workflow ask once.
D6. Antigravity lanes count as written by Gemini when the lane's transcript names a Gemini model; a transcript that the session cannot read, or one with another provider's model or none, makes that lane's reviews `writer unknown`. Alternatives: always `writer unknown`; lanes that inherit the session's model. Decided by: user. Source: interview.
D7. At run time the expensive-model question is asked per lane, and once at the start for the developer's and each reviewer's model; it is skipped only when the plan's approval line names that very model for all of the lane's tasks, or the user named the model in this run. Decided by: agent's call, following the user's choice of one question per stage in spec 1.
D8. An old start file opened for inline execution is left as it is, and no skill rewrites it; a new workflow started on a folder whose progress file or start file names a removed workflow stops with a message. Alternative: `mstack-plan` rewrites old start files (the user decided against carrying old plans over). Decided by: agent's call.
D9. `mstack-vendors` is a required skill of the six workflows, `mstack-plan`, the plan start file's inline run and, in three hosts, `mstack-skill-creator`. Decided by: user. Source: brief.
D10. The two lane check scripts of today's review workflows become one script shipped identically in the three review workflows, which accepts a tier in place of a model and effort for an Antigravity lane. Decided by: agent's call, because one text per kind needs one script per kind.
D11. The reviewer's and developer's default models come from the model skill and are shown in the start question, where the user can name another. Alternatives: each workflow's own default; no question. Decided by: user. Source: interview.
D12. A dev run keeps one developer model for the whole run, and its effort varies by phase and round as today. Decided by: agent's call, because the brief changes who develops, not how a phase is sized.
D13. A Claude developer's copy lives for the whole phase, fix rounds included, and is removed when the phase is committed; spec 2's R10 is amended to say so. Alternative: a new copy per round (the developer's session would lose its earlier changes). Decided by: agent's call.
D14. The progress file records which vendor wrote the plan and which vendor executed each task; the plan review names the plan's writers, and an inline run's final review names the vendors that executed. Decided by: agent's call, because a plan can be written in one host and continued or executed in another.
D15. The Antigravity review workflow ships its lane agent as an agent file of its plugin; a skills CLI install has no lane agent and does its items one after another. Alternative: define lanes at run time (that tool takes no tool list, so a lane would not be limited as the user decided). Decided by: agent's call, following D3 and the brief's rule for a host without lanes.
D16. Withdrawn 2026-11-23: Antigravity is never a plan reviewer (D20), so the rule for a plan folder outside the repository has nothing to apply to.
D17. The preflight has two parts, the host's side at the start and the developer's side after the developer is chosen. Decided by: agent's call.
D18. An Antigravity-led workflow asks the user once at its start which model the session runs on. Alternatives: keep the leader `unknown` (no review of an Antigravity-led run would ever be recorded as cross-vendor). Decided by: user. Source: question of 2026-11-22, after probes showed that an Antigravity session cannot name its model. The other Antigravity callers of `mstack-vendors` do not ask and keep the leader `unknown` (decided by the user, 2026-11-22).
D19. Details of R21. Only an exact id of the listing counts as an answer; anything else, an unreadable listing or a run that cannot ask is treated as unknown; the final report says the model was stated by the user, so a record that rests on it is qualified there and not in the record's value. Alternatives: accept typed text (a mistyped id with a known prefix would be classified); require evidence from the session before a cross-vendor record (the session has none). Decided by: agent's call.
D20. No agent and no script starts or drives an Antigravity session, also not from inside a person's own Antigravity session. So `antigravity` is never a reviewer and never a developer in any of the six workflows: a Claude-led or Codex-led workflow has one other vendor, and an Antigravity-led workflow runs in a session a person opened, with that session's subagents as its lanes and Codex (`codex exec`) and Claude (`claude -p`, D28) as its reviewers and developers. A Gemini review of a session that runs another provider's model is not available; the review goes to Codex, to Claude or to the fallback review. Alternative: Antigravity reached from other agents through its bridge (decided 2026-11-22, withdrawn). Decided by: user. Source: decisions of 2026-11-23.
D21. All six workflows stay, two per host, with one text per kind. Alternatives: ship four workflows now and the two Antigravity-led ones later; keep today's three. Decided by: user. Source: decisions of 2026-11-23.
D22. Evidence for Antigravity comes from a self-test that a person starts in their own Antigravity session: the person pastes a prompt at each start, and the session runs the cases with its own tools (a subagent per case where that works, a throwaway folder, prepared answers) and saves each reply and a run log; in the two workflow sessions the session itself asks the person (D31). The self-test has four starts by the person: the skills batch (spec 1), the pairings batch (spec 2), the review workflow and the dev workflow. The last two are this spec's: each workflow runs on a fixture plan as the session itself, in a session of its own, because a workflow has to start fresh. Grading happens afterwards from the saved files. What the self-test cannot show is recorded as "not checked in Antigravity". No trace of an Antigravity session that a script made is used as evidence. Alternative: runs a person makes by hand, one by one (the first answer of 2026-11-23, replaced the same day). Decided by: user. Source: decisions of 2026-11-23.
D23. Scripts and checks may run `agy models`, `agy --version` and `agy plugin validate`; `agy plugin install` runs only after the user's yes, or is printed for the user to run. Decided by: user. Source: decisions of 2026-11-23. R21's listing is `agy models`.
D24. The facts that an agent's probes of 2026-11-21 and 2026-11-22 showed stay in the Constraints, dated, as a record of what was seen; every fact about how to drive a session from outside (the route through the bridge, what a driven session's stream shows, the session mode for test runs, a read-only run's workspace limit) is removed, because nothing uses it. Decided by: agent's call.
D25. This spec says what the self-test must show (R20 and Verification); the self-test's prompt files and the format of what it saves belong to the plan. The saved files of a run name the date, the client's version, the prompt and the session's model (the answer given, and the model that the transcript of a subagent on the inheriting tier names, because a session cannot name its own); the self-test's prompt names the model the person starts the session on, and nothing relies on a model argument of a subagent call, which no person has tried; an agent in Claude Code or Codex grades the saved files afterwards; the four runs in Claude Code and Codex are made by an agent; a row not yet run says `not run`, never `pass`. Decided by: agent's call.
D26. The pull request waits for the self-test to pass, the two end-to-end runs and the short cases of Verification: a row that says `not run` holds it as a failing run does, by one rule for all three specs; a case whose evidence files are missing is `not run`; only a single claim the agreed test cannot establish is recorded as "not checked in Antigravity", and that does not hold it. Alternative: open it with the Antigravity-led rows at `not run`. Decided by: user. Source: decisions of 2026-11-23.
D27. A behaviour that needs the Antigravity host and that the self-test cannot produce, or that no saved file and no file of the session shows, is checked by a fixture of the shared workflow text and recorded as "not checked in Antigravity"; stand-in eval cases run in Claude Code and Codex, where an agent can run them, because the text of a kind is the same in the three hosts (R2); a claim about what a subagent of an Antigravity session did names the file that shows it (the session's own transcript, its subagent record, the subagent's transcript); the self-test's short cases run through their first review, so that the review's record can be graded. Decided by: agent's call, following D22.
D28. mstack does not depend on the agent-bridges repository. A workflow, `mstack-plan` and `mstack-skill-creator` reach Claude from Codex and from Antigravity with `claude -p`, as they reach Codex with `codex exec`; none checks for, installs or calls a bridge, a Claude developer's fix round continues by `--resume <session id>`, and no background job or job id is used. Alternative: the `claude` bridge of agent-bridges (the earlier preference, replaced). Decided by: user. Source: decisions of 2026-11-23.
D29. The person runs the four self-test sessions in one sitting at the end, after everything of the three specs is built, in the order skills, pairings, dev workflow, review workflow; until then this spec's Antigravity rows say `not run`. A failed or `not run` case is repaired, only those cases are rebuilt, and one more start runs them; no session is repeated because a row has gone stale. Decided by: user. Source: decisions of 2026-11-23.
D30. agent-bridges leaves mstack completely, in every host (Claude Code, Codex, Antigravity, OpenCode, Cursor) and every file. Where a skill needs another vendor's model it calls that vendor's own client (`claude -p`, `codex exec`), so the cross-vendor reviewer of `mstack-skill-creator` in OpenCode and Cursor is such a run too; what mstack needs of agent-bridges' knowledge of calling a client (the review prompt's shape, the output contract, the read-only settings) is written in mstack's own files and words, with the credit the repository's agent instructions require in the skill's third-party notices (agent-bridges is Apache-2.0). This widens D28. Decided by: user. Source: decisions of 2026-11-23.
D31. In a workflow's self-test session the session itself puts the workflow's questions to the person, and the self-test's text gives the person an answer sheet and names the approvals they will be asked for; a short case's subagent gets its prepared answers in its prompt and does not call the question tool, because a subagent's question goes to the person and the session cannot answer it. So that a question is put with the question tool is shown only in the two workflow sessions. Decided by: agent's call, from what the second session of 2026-11-23 showed.

## Risks

- Folding three texts of about 300 lines into two loses a host-specific rule on the way -> the build diffs each old text against the new one section by section and lists every sentence it dropped, and the four end-to-end runs by an agent and the two of the self-test exercise each host.
- The provider behind an Antigravity tier is not documented; a lane's own transcript names its model (probed 2026-11-22), and a session a person opened read it (seen 2026-11-23); a lane agent's transcript may still name another provider's model, or none -> R8 then records that lane's reviews as `writer unknown`.
- Six end-to-end runs with real clients cost time and tokens, and the two Antigravity-led ones are two of the self-test's four starts by a person -> they use the cheap tier and one small fixture plan, and the session runs the cases itself with prepared answers (D22).
- A self-test run cannot be started by an agent, and a session grading its own run could pass itself -> grading happens afterwards from the saved files, in Claude Code or Codex, and a claim no file shows is recorded as not checked (D22, D27).
- An Antigravity-led workflow needs the person's approval for each `claude -p` or `codex exec` run outside the client's sandbox, and a plain `claude -p` loads the person's own Claude Code setup -> the Antigravity host file says which runs need approval, as the Codex host file does for its sandbox, and every `claude -p` command reaches a workflow through the `mstack-vendors` result, whose commands are the ones that one task of spec 1's plan confirmed as a clean, cheap run on the model asked for (`--safe-mode` is the candidate; if it leaves a developer no way to write without a person, that task stops and reports).
- A workflow run inside a subagent of the self-test may behave differently from one run by the session itself -> the two end-to-end runs are made by the session itself, one session per workflow; only the short cases run in a subagent, after the session's own run has ended.
- Two reviewers at once are reachable only from an Antigravity leader, so no agent-made run with real clients exercises them -> the stand-in eval cases of R9 run in Claude Code and Codex, and the self-test's review run uses both reviewers.
- `claude -p` was seen only in one small read-only run from a shell; a review of a real diff, a developer run that writes, a resume, and a run started from Codex or from Antigravity were not -> the Codex-led end-to-end runs and the self-test's two runs of R20 are the first to show them, and a fault found there is fixed before the pull request.
- A Codex-led dev workflow needs the user to approve network and Git commands for a developer of another vendor -> the host file lists them, as today's Codex-led workflow does.
- Removing three plugins breaks sessions that still have them installed only when they update -> the README names the replacements.

- A user who names the wrong model of the listing gets a wrong leader, and a review can then be recorded as cross-vendor although the leader's vendor wrote the code -> nothing checks the answer; the final report says the leader's model was stated by the user, the question offers "I do not know", and a later check against the model of a subagent on the inheriting tier is possible but not built here.

## Verification

- Who runs what: an agent runs every test, every fixture check, every eval case with a stand-in and the four end-to-end runs in Claude Code and Codex, and grades the self-test afterwards from its saved files. No agent and no script starts an Antigravity session. The counts of this spec:
  - Starts by the person: 2 of the self-test's 4 (the dev workflow's session and the review workflow's session; the other two starts are the batches of specs 1 and 2). The four run in one sitting at the end, in the order skills, pairings, dev workflow, review workflow (D29).
  - Pairings: 6, each workflow in its leader's host: 4 run by an agent, 2 by the self-test. This spec adds no pairing of a host with a called vendor to spec 2's 12; the review run calls both review pairings from the session itself, and the dev run one developer pairing and one review pairing.
  - Runtime cases the self-test must pass, 12, each with its own outcome, all holding the pull request: the review workflow's run; the dev workflow's run, in both of which the session itself asks the person, who answers from the answer sheet and approves the runs outside the sandbox; and ten short cases, each in a subagent of one of the two sessions after its own run has ended, with its prepared answers in its prompt and no call of the question tool, and run through its first review where it claims a record: (1) R7, a lane told to search the web; (2) R7, a skills CLI install, which runs in the dev workflow's session, where the review workflow's skill is installed loose and without its plugin, because one session holds one install shape per plugin; (3) R8 and R21, a Claude id in the review kind; (4) R21, a Claude id in the dev kind; (5) R21, "I do not know" in the review kind; (6) R21, "I do not know" in the dev kind; (7) R21, an answer that is not an offered id; (8) R14, a plan review; (9) R15, a start file's offer; (10) R15, an inline run with no reviewer offered. Case 4 runs through its first recorded review like case 3. The answer sheet follows each workflow's real order of questions: R21's question comes before the first `mstack-vendors` call and is not always the first question. Cases 3 and 4 are routing cases: the prepared answer is graded for the routing only, and which provider really ran the session is not claimed.
  - Fixture-only assertions, 9, checked in Claude Code or Codex without an Antigravity session: R5, the three outcomes of a client check in Antigravity; R8, a lane transcript that cannot be read or names no model; R8, a lane transcript that names a chosen reviewer's vendor; R11, a second reviewer that fails; R12, a flagged lane and a flagged model offered for a reviewer or a developer; R12, a fallback run on a supplied model; R16, no reviewer offered; R21, the `Leader model` line in every called message; R21, an unreadable listing and a run that cannot ask.
  - Claims "not checked in Antigravity", 8, which hold nothing: R5's not-installed and not-approved outcomes in a live run; that a short case's question is put with the question tool (shown only in the two workflow sessions); that the client refuses a tool outside the lane agent's list; R8's two fixture cases in a live run; R12's question in a live run; R21's unreadable listing; R21's run that cannot ask; R21's `Leader model` line inside called messages.
- R1, R2, R3, R17: tests of the marketplace check against fixtures (a kind's copies identical, one copy drifted, a shared file drifted, a plugin of one host, an Antigravity plugin without a registry entry), and the two searches of R3.
- R4: an eval case per kind with an old progress file and with an old start file that never ran.
- R5: tests of the preflight script per host with stand-in tools, for both parts, with Claude and Codex as the developer's side; the three outcomes of a client check in Antigravity (found, not installed, not approved) are a fixture of the Antigravity host file, and the two self-test runs show the approved-and-found one.
- R6, R9, R10, R11: eval cases with a stand-in `mstack-vendors` result (two reviewers, one picked with another model, none; one of two fails, the only one fails; two developers, a second reviewer accepted and declined, no developer; a fix round; a Claude-led workflow that offers `codex` alone), run in Claude Code and Codex, and the four agent-made runs and the two self-test runs of R20; the `Recommend: the leader's review + <vendor>` form and a failed second reviewer are stand-in cases, and the self-test's dev run shows the form with real clients; that both reviews of a lane start before either is awaited is shown in Antigravity by the session's transcript: both launches, each a `run_command` call with its command line, come before the first result is read. That a `claude -p` run happened is shown by that `run_command` call and by the saved JSON result, whose `session_id` a fix round's `--resume` repeats.
- R7, R8: the self-test's Antigravity-led review run and its short cases (a lane told to search the web, a skills CLI install, a leader on a Claude model with lanes). What shows each claim: that lanes ran and that a case started none, the session's own transcript and its subagent records; the commands a lane ran, the files it read and wrote and its model, the lane's transcript; what the session recorded, its final report and the review records; the lane agent's tool list, a repository check of its file. That a lane is the lane agent is checked from the `TypeName` of the session's `invoke_subagent` call and from `subagentDescriptor.typeName` of the lane's record, which holds the agent's name (seen 2026-11-23). A lane's record and transcript are found by the conversation id its start returned, or by `spawnStepIndex`, and the review run has two lanes of the same type to show that the role alone does not pick one. That the session read each lane's transcript before a reviewer started is a `read_file` call with that transcript's path in the session's transcript, ahead of the review's launch. A lane transcript that cannot be read, names no model or names a chosen reviewer's vendor cannot be produced in a live run, so both are fixture cases in Claude Code or Codex and are not checked in Antigravity. And that the client refuses a tool outside the list rests on the probe of 2026-11-21: the transcript shows only that the lane did not call one.
- R12, R13: eval cases in Claude Code and Codex (a flagged model offered for a reviewer or a developer by a stand-in result of the model skill, a fallback run on a supplied model that differs from the session's, a flagged lane, an approval for another model, a lane with one unapproved task, a decline, an unflagged model), and tests of the plan check with and without the approval line. Neither question can be reached in a live Antigravity run: a lane takes a tier and no tier maps to a flagged model (spec 1), the model skill's table of today offers no flagged model for a code review (read 2026-11-23), and a model the user names draws no question. Both are fixture checks of the shared text and are not checked in Antigravity.
- R14, R15, R16: eval cases of `mstack-plan` (one other vendor, a plan continued in another host, and two reviewers from a stand-in result), of a start file opened in Claude Code and in Codex, self-test cases of a plan review, of a start file opened in Antigravity and of an inline run with no reviewer offered (a prepared result, because the machine of the self-test has both clients; the fallback review, shown by the session's subagent record and the subagent's transcript), a stand-in case of `mstack-skill-creator` with no reviewer offered, and of `mstack-skill-creator` in Claude Code, Codex without `mstack-vendors`, and Cursor (its reviewer a direct `claude -p` or `codex exec` run).
- R18, R19: tests of the setup status script per host (no bridge row), a grep over the routing table, README and the agent instructions, and a search of every file of the repository that ships or runs, which finds agent-bridges only as a credit in a third-party notices file.
- R20: the table of runs in the pull request description, the saved files of the two self-test runs, and a search of the scripts, tests and eval cases this work adds for a command that starts an Antigravity session.
- R21: the two self-test runs of R20, in which the person's answer from the answer sheet is a Gemini id and the run makes several calls, and whose rows say whether the leader's model was stated by the user or is unknown; self-test cases that run through the first review, so that its record is graded (a Claude id in each kind, "I do not know" in each kind, an answer that is not an offered id); a caller fixture in Claude Code or Codex that checks the `Leader model` line inside every called message of a run, which is not checked in Antigravity, because a called message is context given to a model and no tool call records it; one case in Claude Code or Codex that asks nothing; and a search of the texts of `mstack-plan`, the start file and `mstack-skill-creator` that finds no question about the model the session itself runs on. An unreadable listing and a run that cannot ask are checked by a fixture of the shared workflow text and are not checked in Antigravity.
- Not covered by a scenario: Windows (expected: the same steps), a plan with more lanes than the host runs at once (expected: today's limits per host apply), a user who changes the reviewer pick mid-run (expected: not supported; restart the run).

## Open questions

None. A session that a person opened writes its subagents' transcripts and can read them (seen 2026-11-23, Constraints), which was the one question the re-scope had left open.

## Appendix: interview record

- 2026-11-21 Evidence: brief, Decided by the user / Decision: six workflows by leader, own host only, reviewer rule, one developer, leader plus third vendor review in dev workflows, old workflows removed and old plans not mapped, `mstack-vendors` called by the workflows, `mstack-plan`, the start file and `mstack-skill-creator`, third-party warning rule, real-client end-to-end runs (decided in the brief).
- 2026-11-21 Evidence: specs 1 and 2 / Decision: the host support, the model flags, the per-stage question in plans, and the `mstack-vendors` contract are taken as given.
- 2026-11-21 Q: how the six workflows' text is organized / Recommended: two texts, three hosts each / Decision: as recommended.
- 2026-11-21 Q: how Antigravity runs lanes / Recommended: subagents with a tool list / Decision: as recommended.
- 2026-11-21 Evidence: the three workflows' sections, reference files and scripts / Decision: one text per kind is feasible; the ten numbered sections are the same in all three today.
- 2026-11-21 Q: how reviews of Antigravity lanes are recorded / Recommended: Gemini, checked from the trace / Decision: as recommended.
- 2026-11-21 Q: where the reviewer's and developer's default models come from / Recommended: the model table, changeable in the start question / Decision: as recommended.
- 2026-11-21 Evidence: reviews by Codex, Antigravity and an independent reader, first round / Decision: 34 findings processed: the dev workflow's two calls, the copy's lifetime, the approval line in the plan format, writers recorded by `mstack-plan`, the two-part preflight, the scope of the old-name search.
- 2026-11-21 Evidence: second review round by Codex and Antigravity / Decision: 22 findings processed: lanes are the plugin's lane agent (a run-time subagent takes no tool list), a trace without a Gemini model means writer unknown, an inline run's review names who executed, an approval covers one lane or role, the routing row of `mstack-vendors` has three hosts.
- 2026-11-22 Evidence: a default `agy -p` session answered UNKNOWN for its own model and its trace holds no model name / Decision: asked the user.
- 2026-11-22 Q: what an Antigravity-led workflow does when the session cannot name its model / Recommended: ask the user once at the start / Decision: as recommended (R21, D18). Status back to Draft for this change.
- 2026-11-22 Evidence: sessions started with a Gemini id and with a Claude id also answered UNKNOWN; a review of the amendment by Codex and Antigravity (17 findings) / Decision: R21 asks in every Antigravity-led run, accepts only an offered id, and names what happens when nobody can answer (D19).
- 2026-11-22 Q: should the other Antigravity callers of `mstack-vendors` (`mstack-plan`, an inline run, `mstack-skill-creator`) ask for the model too / Recommended: only the two workflows / Decision: only the two workflows.
- 2026-11-22 Q: how other agents and the end-to-end test runs reach Antigravity / Decision by the user: only through ACP (spec 1, D25). Two lines that described print mode were reworded; in the end-to-end runs of R20, a run whose leader is Antigravity is driven by spec 1's runner, and a Claude-led or Codex-led run reaches an Antigravity reviewer or developer through the `antigravity` bridge. Status back to Draft for this change.
- 2026-11-22 Evidence: ACP probes after two reviews of the amendment / Decision: the Constraints name where a subagent's transcript lies. Agent's call, for the user to see at approval: an end-to-end test run whose lanes run commands uses the session mode `auto`, because in the default mode a subagent's shell command does not run in a session driven over ACP (spec 1, Constraints).
- 2026-11-22 Approval: the user approved the ACP amendment, and chose the session mode `auto` for test runs whose subagents run commands (the agent's call is now the user's decision).
- 2026-11-22 Amendment approved by the user (documents stay Approved): bridge 0.2.2 facts. A review's `Incomplete review:` line also names files skipped as too large, binary or a link; a bridge write task runs in Antigravity's mode `auto`, and a stuck subagent makes its job fail; every bridge task waits for 30 seconds of quiet before it ends (the 120-second sign-in limit still fits: real runs took 34 to 51 seconds).
- 2026-11-23 Decision by the user: no agent and no script starts or drives an Antigravity session, also not from inside a person's own session; `antigravity` is never a reviewer or a developer (D20). The lines of 2026-11-22 above about the runner, ACP, the bridge and the session mode for test runs are superseded. R5, R6, R10, R11, R14, R16 and R21 changed; Status back to Draft.
- 2026-11-23 Decision by the user: all six workflows stay; the two Antigravity-led ones are shown by two end-to-end runs a person makes by hand (D21, R20).
- 2026-11-23 Decision by the user: Antigravity evidence is a run log per by-hand run, plus the session's own files for what a subagent did, after one check by a person that they exist; otherwise the claim is not checked (D22; R7, R8, Verification).
- 2026-11-23 Decision by the user: scripts and checks may run `agy models`, `agy --version` and `agy plugin validate`; `agy plugin install` runs only after the user's yes, or is printed for the user to run (D23; R21 unchanged).
- 2026-11-23 Evidence: the Constraints against the decisions above / Decision: probe facts stay as a dated record, facts about driving a session are removed (D24, agent's call).
- 2026-11-23 Evidence: the number of by-hand runs and cases (two runs, ten short cases) / Decision: one checklist file per plan, a row not run says `not run` (D25, agent's call).
- 2026-11-23 Evidence: the anti-goal on a workflow listed without a real run, and the brief's release gate / Decision: the pull request waits for the two by-hand runs (D26, agent's call, for the user to see at approval).
- 2026-11-23 Evidence: what a session a person opened can be made to do / Decision: an unreadable model listing, a run that cannot ask, and a subagent's calls where no file shows them are "not checked in Antigravity" (D27, agent's call).
- 2026-11-23 Decision by the user: evidence for Antigravity is a self-test that a person starts in their own session, not runs made by hand one by one; the session runs the cases itself and saves its replies and a run log, grading happens afterwards from the saved files, and the pull request waits for it (D22, D26; R20). The four lines above of 2026-11-23 that speak of by-hand runs, a checklist file and an agent's call on the pull request are superseded by this one.
- 2026-11-23 Evidence: one session a person opened (`agy` 1.5.15) / Decision: a subagent loads a skill, runs a shell command and starts its own subagent; the session reads its subagents' records and transcripts, which name the model and the tools called. R7 and R8 name the file that shows each claim, and the open question on lane transcripts is closed.
- 2026-11-23 Evidence: a review of the re-scoped specs by Codex, 12 findings, 8 of them on this spec / Decision: one eligibility rule before availability, and a Gemini leader in R10's two-candidate case; R10 and R11 read `Recommend: the leader's review + <vendor>`, and a failed second reviewer leaves the leader's review standing; R15 and R16 follow the fallback review when no reviewer is offered; the flagged-lane case becomes a fixture check; the model-question cases run through the first review; the command permission is recorded word for word; the fields of the saved files and who runs the Claude Code and Codex runs are agent's calls (D25).
- 2026-11-23 Evidence: the files of the person's session, read afterwards / Decision: a transcript's tool calls carry their arguments, the main session has a transcript of its own, and a subagent record holds `subagentDescriptor.typeName`. R7's claims are checked from the transcripts; that a lane is the lane agent reads `typeName`, not checked until the first self-test batch records its value for a plugin's agent. Agent's calls (D25): an agent in Claude Code or Codex grades the saved files, and the self-test's prompt names the model to start on.
- 2026-11-23 Evidence: a second review of the re-scoped specs by Codex, 14 findings, 8 of them on this spec / Decision: writers are excluded also under an unknown leader (R21); a lane's transcript is read before its reviewers start, and a vendor it names does not review that lane (R6, R8); a fallback run on a supplied model falls under R12's question; the self-test has four starts by the person, two of them this spec's (D22); Verification gives one list with separate counts; a case with missing evidence files is `not run` (R20, D26); lane identity is checked from the caller's `TypeName` now, and parallel reviews from launches before the first wait (R7, R9).
- 2026-11-23 Evidence: the question put to the user about the self-test did not name who grades / Decision: that grading happens afterwards from the saved files is the user's decision (D22); that an agent in Claude Code or Codex does it stays an agent's call (D25).
- 2026-11-23 Decision by the user: mstack does not depend on agent-bridges; Claude is reached with `claude -p` from Codex and from Antigravity (D28). The `claude` bridge, its background job and its job id leave R9, R20, the Constraints and Verification; R5, R11, R18 and R19 say so; the `claude -p` facts read from the installed client are in Constraints, with what the first runs still have to confirm.
- 2026-11-23 Approval: the user approved the re-scoped spec (host support only, the self-test, no bridge of agent-bridges, Claude through `claude -p`).
- 2026-11-23 Evidence: a second session a person opened, and two decisions by the user / Decision: the four self-test sessions run in one sitting at the end (D29); agent-bridges leaves every host and every file, so R16's OpenCode and Cursor reviewer is a direct `claude -p` or `codex exec` run and R19's search covers every file (D30); the workflow sessions ask the person, with an answer sheet and a notice of the approvals, and a case's subagent takes its answers from its prompt (D31, agent's call); R7's lane identity is checked from the record's `typeName`. Status back to Draft for this change.
- 2026-11-23 Evidence: a third and a fourth session a person opened, `claude -p` runs with `--bare` and `--safe-mode`, and a review of the specs and plans by Codex (17 findings; one names this spec, on R21's question order, and its text stood) / Decision: the facts are in Constraints; in Antigravity a workflow tells the user and asks for a run outside the sandbox for the client check and each client run, with three outcomes kept apart (R5); a lane's transcript is found by its conversation id, not by its role (R7, R8); one task of spec 1's plan confirms the complete `claude -p` commands; the skills CLI case runs in the dev workflow's session; the answer sheet follows the workflow's order of questions. Status stays Draft.
- 2026-11-23 Approval: the user approved the spec as re-scoped (the self-test in one sitting at the end, no bridge of another repository, Claude through `claude -p`), and decided that scripts may also run `agy --version`, which starts no session, so the run log names the client's version.
- 2026-11-23 Evidence: plan 1's task 1.3 (15 runs of `claude -p`, Claude Code 2.1.330) / Correction of a fact, made under the user's standing permission to fix and approve: the confinement text belongs to `--restricted`; `--safe-mode` does not confine a run; the developer command uses `--permission-mode acceptEdits --allowedTools "Bash"` (`auto` brought in a second model). Status stays Approved.
