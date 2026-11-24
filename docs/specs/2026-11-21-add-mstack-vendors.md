# Add mstack-vendors, the shared skill for reaching another vendor's model

Status: Approved 2026-11-23
Size: full    Mode: gated    Type: feature
Source: design brief `docs/briefs/2026-11-21-antigravity-host-support.md` (Approved 2026-11-21), amended by the user's re-scope decisions of 2026-11-23 (D19 to D22), which win where the brief says otherwise. This is spec 2 of 3. Spec 1 (`docs/specs/2026-11-21-add-antigravity-host.md`) makes Antigravity a host; spec 3 covers the six workflows and the other callers.

## Problem

Five skills each carry their own copy of "who reviews, and with which command": `mstack-plan`'s plan review and its plan start file, the two review workflows, the developer workflow and `mstack-skill-creator` each name one fixed other vendor and write out its command. With three hosts and two vendors that can be called (`claude` and `codex`; Antigravity is a host and a leader, and is never called) there are four pairings for a review and four for a developer run, a rule for which reviewers to recommend, and a check of what is installed and signed in. Written into every caller, that is one rule in nine places (brief, Approaches considered). Two facts make a wrong copy costly: Antigravity runs models of several providers, so "led from Antigravity" does not mean "written by a Gemini model", and a Claude developer run writes and runs commands without asking for permission, so a developer run could publish code nobody reviewed (brief, Constraints).

## Goals

1. A caller learns from one call which vendors can review, review a plan or develop in this session, which to recommend, and the exact command for each: shown by the result block in called-mode eval cases.
2. A review is recorded as cross-vendor only when no model of the reviewer's vendor wrote the code: shown by cases in which the leader or a lane runs another provider's model.
3. A developer of another vendor cannot publish with a plain push before the leader reviewed its code: a Claude developer works in a copy without a remote, and a Codex developer under a sandbox without network access; shown by developer runs whose push fails. In the copy, a push to an address typed in full is not prevented (see Risks).
4. A vendor that is installed but signed out is left out with a reason before work starts, not discovered in the middle of a run.

## Non-goals

- The callers: the six workflows, `mstack-plan`, the plan start file and `mstack-skill-creator` change in spec 3; this spec defines only what they call and what they get back.
- Choosing models: this skill names no model; the caller takes models from `mstack-best-model-for` and passes them in the `Models` line.
- The built-in review of `mstack-product-plan` and `mstack-epic`, and every read of evidence and decisions documents: spec 1 settled them, and they never call this skill.
- More than one developer per run: the brief decided one.
- Running a workflow from a host other than its leader's: the brief decided each runs in its own host.
- Antigravity as a reviewer or a developer, from any host: no agent and no script starts or drives an Antigravity session, also not from inside a person's own Antigravity session (decided by the user, 2026-11-23). A Gemini review of work led on another provider's model is therefore not offered.

Anti-goals:
- The reviewer rule or a vendor command written out in a caller again.
- A reviewer of the vendor that wrote the code recorded as cross-vendor.
- A Claude developer run in the user's checkout, or in a copy that has a remote or a push address; a Codex developer run with network access on.
- A failed or empty reviewer run counted as a clean review.
- This skill asking the user a question when another skill called it.
- A row, a command or a step of this skill that starts an Antigravity session.

## Users and scenarios

Callers, in order of priority (a shared skill has callers before it has users):

1. As one of the six workflows, I want the reviewers to recommend for the code my lanes or my developer wrote, and their commands, so that I ask the user one question and run what they pick.
2. As a dev workflow, I want the steps that give a developer of another vendor a place to write from which nothing can be pushed, so that I review before anything is published.
3. As `mstack-plan` or an inline plan run, I want the plan reviewers to recommend and their commands, so that the plan review follows the same rule as a code review.
4. As a person in Claude Code, Codex or Antigravity, I want to ask which vendors I can use here for a review or a developer run and what is missing, so that I can install or sign in before I start.

## Requirements

Terms. A **vendor** is the provider of the model that runs: `claude` (Anthropic models), `codex` (OpenAI's Codex models through the Codex client) and `antigravity` (Gemini models through the Antigravity client); `antigravity` is only ever the vendor of a leader, of a writer or of the leader's own fallback review: it is never listed as a reviewer or a developer, and no channel leads to it; a model of any other provider counts as `other`, which is never offered as a reviewer or a developer; a leader of vendor `other` or `unknown` still does a leader's review, recorded as R17 says. A **job** is one of `code review`, `plan review` and `developer`. A **channel** is what carries a job to a vendor from a host: a command-line client, a plugin or a skill; the channel of `claude` from another host is the Claude Code client itself, run headless with `claude -p`, and no channel is a bridge. The **leader** is the session that called. The **writers** of a piece of work are the vendors whose models wrote it. A vendor is **eligible** for a review when it is `claude` or `codex`, is not the leader's vendor and is not among the writers, and for the developer job when it is `claude` or `codex` and is not the leader's vendor; eligibility is decided before availability, so a vendor that is installed and signed in but not eligible gets no row. The writer exclusion always applies, also when the leader's vendor is `unknown`: then each of `claude` and `codex` that is not among the writers is eligible, its Record follows R17 from the writers, and the leader's own review is `reviewer unknown`.

### The contract

A called message has this form. Lines marked optional may be left out; a job group may repeat.

```text
Called by: <calling skill>
Host: claude-code | codex | antigravity
Workspace: <path of the repository>
Leader model: <model id or alias>                                   (optional)

Job: code review | plan review | developer
Writers: <vendor>[, <vendor>] | unknown                              (not for developer)
Workflow: review | dev                                               (for code review)
Models: <vendor>=<model id> <effort>[; <vendor>=<model id> <effort>] (from mstack-best-model-for; a vendor without an entry gets no command)
```

The reply ends with this block and nothing after it.

```text
## mstack-vendors result

Leader: <vendor> | other | unknown
Warnings: none | <one line each>

### <job>
Writers: <vendors> | unknown
| Vendor | Role | State | Reason | Record | Command |
|---|---|---|---|---|---|
| <vendor> | reviewer | leader | fallback | developer | available | not available | <why, and what to install or sign in> | cross-vendor | same-vendor | writer unknown | reviewer unknown | - | <complete command, or empty> |
Recommend: <vendors> | the leader's review | the leader's review + <vendor> | a fallback review | no developer here
Steps: <the numbered steps for this job: how to run, wait, collect and what to do on a failure>
```

Changed 2026-11-23 against the form approved on 2026-11-22, which the callers of spec 3 read. Two lines left the contract: `Antigravity sign-in: confirmed | failed (<reason>)` left the called message, and `Antigravity sign-in: confirmed | failed (<reason>) | not checked` left the result block. One line of the result block gained a form: `Recommend:` now also reads `the leader's review + <vendor>`, for a dev workflow in which a second vendor joins the leader's review (R6). No other line or column of either form changed. Four values changed: the Command cell of a row with the role `leader` or `fallback` is always empty, and its action is in `Steps` (R8); an `antigravity` entry of the `Models` line is ignored with a warning (R9); the Vendor cell of a row with the role `reviewer` or `developer` is `claude` or `codex` only; and a vendor named after `Recommend:` is `claude` or `codex` only. `antigravity` is still a value of `Leader`, of `Writers`, and of the Vendor cell of a row with the role `leader` or `fallback`, where it names the calling session itself.

### R1. Called mode  [Must]
WHEN a message starts with the line `Called by: <skill>`, `mstack-vendors` SHALL answer every job group of the message in one result block of the form above, ask the user nothing, and write nothing inside the repository.
#### Scenario: a complete call
- GIVEN a called message with two job groups
- WHEN the skill answers
- THEN its reply ends with one block that has a section per job, in the caller's order
#### Scenario: a missing field
- GIVEN a `code review` group without a `Writers` line
- WHEN the skill answers
- THEN that section says `Writers: unknown`, every review row says `writer unknown` under Record, a warning names the missing field, and the skill does NOT ask the user

### R2. The leader's vendor  [Must]
`mstack-vendors` SHALL take the leader's vendor from the host in Claude Code and Codex, and in Antigravity from the provider of the model named in `Leader model`, counting an Antigravity session on another provider's model as that provider's vendor with one warning line, and as `unknown` when the line is missing.
#### Scenario: the usual case
- GIVEN an Antigravity host and a Gemini leader model
- WHEN the skill answers
- THEN the block says `Leader: antigravity` and holds no warning about it
#### Scenario: another provider's model
- GIVEN an Antigravity host, a Claude leader model and writers `claude`
- WHEN the skill answers a `code review` job
- THEN the leader is `claude`, one warning says so, `claude` is NOT offered as a reviewer, `antigravity` is NOT offered, and `codex` is offered when it is available
#### Scenario: a model of no listed vendor
- GIVEN an Antigravity host and the open-weight GPT model
- WHEN the skill answers
- THEN the block says `Leader: other`
#### Scenario: no model named in Antigravity
- GIVEN an Antigravity host and a message without `Leader model`
- WHEN the skill answers
- THEN the block says `Leader: unknown` with a warning, and NO row is marked `cross-vendor` on the strength of the leader's vendor

### R3. Availability per job  [Must]
`mstack-vendors` SHALL report each vendor it lists for a job with the role `reviewer` or `developer` as available only when that vendor's client is on the machine, the channel that job uses from this host loads, and its sign-in is confirmed, and otherwise as not available with the reason and what to install or sign in.
#### Scenario: review yes, developer no
- GIVEN Claude Code with a signed-in Codex client and without the Codex plugin that carries a developer run there
- WHEN a caller asks for `code review` and `developer`
- THEN `codex` is available as a reviewer and not available as a developer, and the block names the plugin to install
#### Scenario: signed out
- GIVEN a vendor whose client is installed and whose sign-in check fails
- WHEN the skill answers
- THEN that vendor is not available for any job, with the reason "not signed in" and how to sign in, and the call does NOT fail
#### Scenario: nothing else installed
- GIVEN a machine with only the leader's client
- WHEN the skill answers
- THEN each of `claude` and `codex` that is not the leader's vendor is not available, with its reason, and NO row lists `antigravity` as a vendor to call
#### Scenario: the sandbox of an Antigravity session
- GIVEN an Antigravity session whose sandbox does not find the `claude` and `codex` clients
- WHEN the skill checks availability
- THEN its steps have the session say to the user first that the check must run outside the sandbox and that the client will ask them to approve it, and then ask for that run; the three outcomes are kept apart: approved and the client found is the normal check, approved and no client found is "not installed", and not approved is "the run outside the sandbox was not approved", which is NOT reported as "not installed"
#### Scenario: a row for the session itself
- GIVEN an Antigravity host and a section with a row of the role `leader` or `fallback`
- WHEN the skill answers
- THEN that row is available without a check, and NO client check and NO sign-in check ran for `antigravity`

### R4. Confirming Antigravity's sign-in once per run  [Removed]
Removed 2026-11-23: `antigravity` is never called as a reviewer or a developer, so no run needs its sign-in confirmed (D20).

### R5. Reviewers of a review workflow or a plan  [Must]
WHEN a call asks for `plan review`, or for `code review` with `Workflow: review`, `mstack-vendors` SHALL offer as reviewers the eligible vendors, recommend both when two are available, the one when one is, and a fallback review (R14) with a warning when none is.
#### Scenario: two available
- GIVEN an Antigravity host with a Gemini leader model and writers `antigravity`, with `claude` and `codex` available
- WHEN the skill answers `plan review`
- THEN it recommends both, and both rows say `cross-vendor`
#### Scenario: mixed lanes
- GIVEN an Antigravity host and writers `claude, antigravity`, with `codex` available
- WHEN the skill answers `code review`
- THEN `codex` is the only reviewer offered, and neither `claude` nor `antigravity` is
#### Scenario: the leader's provider is left out first
- GIVEN an Antigravity host with a Claude leader model and writers `antigravity`, with `claude` and `codex` available
- WHEN the skill answers `code review`
- THEN `codex` is the only reviewer offered, and `claude` has NO row although it is installed and signed in
#### Scenario: none available
- GIVEN no eligible vendor is available
- WHEN the skill answers
- THEN it recommends a fallback review, and a warning says no other vendor reviews
#### Scenario: writers unknown
- GIVEN `Writers: unknown`
- WHEN the skill answers
- THEN it offers the available vendors other than the leader's, and each row says `writer unknown`, NOT `cross-vendor`
#### Scenario: leader unknown
- GIVEN an Antigravity host, a message without `Leader model` and `Writers: unknown`, with `claude` and `codex` available
- WHEN the skill answers `plan review`
- THEN both are offered, and each row says `writer unknown`, NOT `cross-vendor`

### R6. Reviewers of a dev workflow  [Must]
WHEN a call asks for `code review` with `Workflow: dev`, `mstack-vendors` SHALL list the leader with the role `leader` as the review that always happens, offer the eligible vendors that are available as second reviewers, and recommend the leader's review alone when there is none and in the form `the leader's review + <vendor>` when there is one.
#### Scenario: two vendors
- GIVEN a leader of vendor `claude` and writers `codex`
- WHEN the skill answers
- THEN the section says `Recommend: the leader's review`, the leader's row says `cross-vendor`, and the block holds no warning about a missing reviewer
#### Scenario: three vendors
- GIVEN an Antigravity host with a Gemini leader model, writers `codex`, and `claude` available
- WHEN the skill answers
- THEN the section says `Recommend: the leader's review + claude`, and `codex` is NOT offered
#### Scenario: the leader's vendor wrote it
- GIVEN `Workflow: dev` with writers equal to the leader's vendor
- WHEN the skill answers
- THEN the leader's row says `same-vendor`, and a warning says a dev workflow needs a developer of another vendor
#### Scenario: writers not named
- GIVEN `Workflow: dev` without a `Writers` line
- WHEN the skill answers
- THEN every review row says `writer unknown`, with the warning of R1, and an eligible vendor that is available is still recommended in the form `the leader's review + <vendor>`, NOT left out because the writers are unknown
#### Scenario: leader unknown, writer known
- GIVEN an Antigravity host, a message without `Leader model`, writers `codex`, and `claude` and `codex` available
- WHEN the skill answers
- THEN `codex` is NOT offered, the `claude` row says `cross-vendor`, the leader's row says `reviewer unknown`, and the section says `Recommend: the leader's review + claude`

### R7. The developer job  [Must]
WHEN a call asks for `developer`, `mstack-vendors` SHALL list with the role `developer` each of `claude` and `codex` that is not the leader's vendor, with its state, recommend none over another, and say `Recommend: no developer here` with the leader's review workflow as the alternative when none is available.
#### Scenario: two candidates
- GIVEN an Antigravity host with a Gemini leader, and `claude` and `codex` available to develop
- WHEN the skill answers
- THEN both are listed with their commands and steps
#### Scenario: an Antigravity leader on a Claude model
- GIVEN an Antigravity host whose leader is `claude`
- WHEN the skill answers `developer`
- THEN `codex` is the only candidate, and `antigravity` is NOT listed, because Antigravity is never called as a developer
#### Scenario: no second vendor
- GIVEN only the leader's vendor
- WHEN the skill answers `developer`
- THEN the block says `Recommend: no developer here` and names the review workflow, and it gives NO developer command

### R8. One command per vendor, job and host  [Must]
For each available vendor it lists with the role `reviewer` or `developer`, `mstack-vendors` SHALL give the complete command for this host, filled with the model and effort of the `Models` line, and steps that say how to wait for the run and collect its result, a review command running the vendor without permission to change the workspace.
#### Scenario: a read-only review
- GIVEN any pairing of host and reviewer vendor
- WHEN the skill gives the `code review` or `plan review` command
- THEN the command runs the vendor read-only, and its steps say where the findings arrive
#### Scenario: Claude from another host
- GIVEN a Codex or an Antigravity host and `claude` available as a reviewer
- WHEN the skill gives the command
- THEN it is a `claude -p` run with the model and effort of the `Models` line and with the flags that keep the user's own Claude Code customizations from loading, so that the run's JSON names the model that was asked for and its `result` holds only the answer, its steps saying to compare the JSON's `modelUsage` with the model asked for and to report a run on another model as failed, with no tool that writes a file and no tool that runs a command beyond what the review needs, its steps say not to report or finish before the command's completion and its output were seen, and NO command or step calls, checks or installs a bridge
#### Scenario: the review prompt
- GIVEN a review command for `claude` or for `codex`
- WHEN the skill gives it
- THEN the prompt it carries is the skill's own review prompt, which says what the reviewer is asked and the form in which the findings must come back, the same for both vendors; the skill's `THIRD_PARTY_NOTICES.md` credits the project it was adapted from; and NO prompt and NO output form is read from another repository or plugin at run time
#### Scenario: a call from an Antigravity session
- GIVEN an Antigravity host and a `claude` or `codex` row with a command
- WHEN the skill gives the steps
- THEN they tell the session to ask for a run outside the client's sandbox for each run of `claude -p` or `codex exec`, to tell the user before the first run that the client will ask them to approve each one, and to report a run the user did not approve as failed with that reason (R13), NOT as a clean review and NOT as a missing client
#### Scenario: a row without a command
- GIVEN a section with a row of the role `leader` or `fallback`
- WHEN the skill answers
- THEN that row's Command cell is empty, the `Steps` say what the session or its subagent does, and NO command starts a client of the leader's own vendor from that cell
#### Scenario: every pairing has a command
- GIVEN the pairings of each host with each of `claude` and `codex` that it can list with the role `reviewer` or `developer`, for each job, with a model supplied
- WHEN the skill is built
- THEN each has a command backed by a recorded real run (R19), NO pairing ships as "not verified", and a row with the role `leader` or `fallback` is NOT one of them

### R9. Models  [Must]
`mstack-vendors` SHALL give a command only for a vendor that the `Models` line names, and IF that line names `antigravity`, THEN it SHALL ignore that entry and say in one warning line that Antigravity is never called as a reviewer or a developer.
#### Scenario: an entry for Antigravity
- GIVEN a `Models` line that names `antigravity` and `codex`, with `codex` available
- WHEN the skill answers
- THEN the `codex` command carries its model, one warning names the ignored entry, and NO row and NO command names `antigravity` as a reviewer or a developer
#### Scenario: a vendor without a model
- GIVEN a job group whose `Models` line does not name an available vendor
- WHEN the skill answers
- THEN that vendor's row has no command, its reason says no model was given, and NO command carries a placeholder for the model

### R10. A copy for a developer without a sandbox  [Must]
WHEN the developer is `claude`, the steps of `mstack-vendors` SHALL have the developer work in a local copy outside the repository that holds the tracked files of the current commit and the plan folder of the run, has no remote and no push address, lives for the whole phase so that a fix round continues in it by resuming the developer's session, and is removed once the phase is committed, the leader taking the developer's changes after each round as one diff from that commit to everything in the copy, new files included.
#### Scenario: a plain push fails
- GIVEN a developer run in the copy that tries to push
- WHEN the push runs
- THEN it fails because no remote exists, and nothing reaches the user's remotes
#### Scenario: nothing ignored is copied
- GIVEN a checkout with a `.env` file that Git ignores
- WHEN the copy is made
- THEN the copy does NOT hold that file
#### Scenario: uncommitted changes in the checkout
- GIVEN a checkout with uncommitted changes to tracked files
- WHEN the steps start
- THEN they stop and say to commit or stash first, and NO copy is made
#### Scenario: committed and new files both arrive
- GIVEN a developer that committed one change in the copy and left one new file uncommitted
- WHEN the leader takes the diff
- THEN the diff holds both
#### Scenario: a fix round
- GIVEN accepted findings on a phase a Claude developer wrote
- WHEN the developer is run again
- THEN it is run with `claude -p --resume <session id>`, the id being the `session_id` of the earlier run's JSON result that the leader kept, works in the same copy, which still holds its earlier changes, and the copy is removed only after the phase was committed
#### Scenario: where the developer writes
- GIVEN a Claude developer run
- WHEN the steps start it
- THEN it is a `claude -p` run whose working folder is the copy, with no other folder added to it, and the user's checkout is NOT its working folder
#### Scenario: a remote appears
- GIVEN the copy has a remote or a push address after the developer's run
- WHEN the leader checks it before taking the diff
- THEN the steps stop and report it, and the diff is NOT applied without the user's decision

### R11. A Codex developer under its sandbox  [Must]
WHEN the developer is `codex`, the steps of `mstack-vendors` SHALL run it in the user's checkout under Codex's own sandbox with network access off, through the Codex plugin with its job, phase and thread checks in Claude Code and through the Codex client with a workspace-write sandbox in the other hosts.
#### Scenario: Claude Code
- GIVEN a Claude Code leader and `codex` as the developer
- WHEN the steps are followed
- THEN the developer's result is accepted only when its job finished, names the phase it was given and, on a fix round, continues the earlier thread
#### Scenario: a push from the sandbox
- GIVEN a Codex developer told to push
- WHEN it tries
- THEN the push fails for lack of network access, and the steps do NOT turn network access on for a developer

### R12. Two reviewers  [Must]
WHEN two vendors review the same work, the steps of `mstack-vendors` SHALL run both in parallel and hand both sets of findings, unmerged and each with its vendor, to `mstack-receive-review`.
Which reviewers can be called follows from the leader's vendor (R2). A Claude Code leader has `codex` only. A Codex leader has `claude` only. An Antigravity leader on a Gemini model, or one whose vendor is `other` or `unknown`, has `claude` and `codex`. An Antigravity leader on a Claude model has `codex` only. So two called reviewers happen only when the host is Antigravity, in a plan review or a review workflow whose writers include neither `claude` nor `codex`. In a dev workflow the developer's vendor never reviews: at most one vendor joins the leader's review, and none does when the host is Claude Code or Codex.
#### Scenario: both return
- GIVEN two reviewers that both return findings
- WHEN the steps end
- THEN the receiving skill gets every finding with its source, and no finding was merged or dropped before it
#### Scenario: one fails
- GIVEN one reviewer returns findings and the other still fails after the one repair R13 allows
- WHEN the steps end
- THEN the failed run is reported as failed, the work counts as reviewed by one vendor, and the failed run is NOT counted as a clean review
#### Scenario: a leader with one other vendor
- GIVEN a Claude Code or a Codex host and any review job
- WHEN the skill answers
- THEN the section holds at most one row with the role `reviewer`, `Recommend` names at most one vendor, and NO row names `antigravity` as a reviewer

### R13. A reviewer run that fails  [Must]
IF a reviewer's run ends with an error or an empty answer, THEN the steps of `mstack-vendors` SHALL say to repair the cause once when an agent can (a rejected effort: the next lower level when one exists; a rejected model: ask the user once), and, when no offered reviewer has returned an answer after that, to run the fallback review of R14 with a warning in a plan review or a review workflow, and in a dev workflow to let the finished leader's review stand and report the failed run.
#### Scenario: an effort the model rejects
- GIVEN a reviewer run rejected for an effort above the model's lowest
- WHEN the steps are followed
- THEN the run is repeated once at the next lower effort
#### Scenario: no lower effort
- GIVEN a reviewer run rejected at the model's lowest effort
- WHEN the steps are followed
- THEN the run counts as failed, and NO retry is made
#### Scenario: both reviewers fail
- GIVEN two reviewers that both fail after their one repair, in a review workflow
- WHEN the steps are followed
- THEN the fallback review runs with a warning, and the failed runs are NOT counted as reviews
#### Scenario: the second reviewer of a dev workflow fails
- GIVEN a dev workflow whose leader finished its review and whose second reviewer fails after its one repair
- WHEN the steps are followed
- THEN the leader's review stands, the failed run is reported as failed, and NO fallback review is started for it

### R14. The fallback review  [Must]
WHEN a section recommends a fallback review, its steps SHALL describe a fresh, read-only review by the leader's own vendor, on the session's own model where the host guarantees it (a subagent in Claude Code, a subagent on the tier that inherits the session's model in Antigravity) and in Codex by a separate read-only Codex run that names no model option and so runs the client's configured model, listed with the role `fallback` and recorded by the rule of R17.
#### Scenario: a review workflow
- GIVEN a Claude Code leader, writers `claude`, and no other vendor available
- WHEN the steps are followed
- THEN a fresh-context read-only subagent reviews, and its row says `same-vendor`
#### Scenario: a Codex leader
- GIVEN a Codex leader, writers `codex`, no other vendor available and no entry for `codex` in `Models`
- WHEN the steps are followed
- THEN the fallback is a read-only `codex exec` run without a model option, the steps say that the client's configured model may differ from the session's, and its record says `reviewer unknown` unless the run's own output names the model
#### Scenario: a model the caller supplies
- GIVEN the same call with an entry for `codex` in `Models` that names another model than the session's
- WHEN the steps are followed
- THEN the run carries that model, the steps say it is a separately chosen model that falls under the caller's question for an expensive model, and NO step calls it the leader's model
#### Scenario: never upgraded
- GIVEN that review
- WHEN it is recorded
- THEN NO record calls it cross-vendor
#### Scenario: an Antigravity leader without another vendor
- GIVEN a called message with `Host: antigravity`, a Claude leader model, writers `claude`, and `codex` not available
- WHEN the steps are followed
- THEN a subagent of the same session reviews, its row says `same-vendor`, and NO step starts a second Antigravity session for a Gemini review: in a session a person opened, neither the session's transcript nor the subagent's holds a `run_command` call whose `CommandLine` starts the Antigravity client
#### Scenario: what shows that the subagent reviewed
- GIVEN the self-test's fallback case: a fixture diff with one planted defect, writers `antigravity`, and a `PATH` prepared for the case's subagent that hides the `claude` and `codex` clients
- WHEN the case is graded from the saved files
- THEN the parent's transcript holds an `invoke_subagent` call whose `Prompt` names the diff and asks for a read-only review; the child that the subagent record links to that call holds `read_file` calls on the diff's files, NO `write_file` call, NO `edit_file` call and NO `run_command` call whose `CommandLine` writes; and the returned review names the planted defect. A child without a read of the diff fails the case
#### Scenario: the files are missing
- GIVEN a fallback case whose subagent record or transcript was not saved
- WHEN the evidence is listed
- THEN the case says `not run` and holds the pull request until it is repeated, and it is NOT recorded as `not checked in Antigravity`

### R15. User mode  [Should]
WHEN a person asks which vendors they can use, `mstack-vendors` SHALL show, per vendor and job, whether it is available in this session and what to install or sign in when it is not, and SHALL install nothing.
#### Scenario: a question in chat
- GIVEN a person in Codex who asks which reviewers they can use
- WHEN the skill answers
- THEN it shows a table of vendors and jobs with a state and a reason per cell
#### Scenario: nothing is installed for them
- GIVEN no other vendor installed
- WHEN the skill answers
- THEN it names `mstack-setup` as the way to install, and it installs NOTHING itself

### R16. The model skill is required  [Removed]
Removed 2026-11-23: the only reason this spec gave for it was the sign-in prompt of R4, which is removed; the skill names no model and sends no prompt, and its callers pass the models in (D24).

### R17. One rule for how a review is recorded  [Must]  (MODIFIED: a rule of `mstack-receive-review`)
The review rules of `mstack-receive-review`, and the Record column of `mstack-vendors`, SHALL record a review as `writer unknown` when the writers are unknown, as `reviewer unknown` when the reviewer's vendor is `other` or `unknown`, as `same-vendor` when the reviewer's vendor is among the writers, and as `cross-vendor` otherwise.
#### Scenario: a dev workflow
- GIVEN code written by a developer of vendor `codex` and reviewed by the leader of vendor `claude`
- WHEN the review is recorded
- THEN it is recorded as cross-vendor, whether the leader read it itself or through a fresh run of its own vendor
#### Scenario: the writer's vendor reviews
- GIVEN code written by `codex` lanes and reviewed by a fresh Codex run, whose output names an OpenAI model, because no other vendor was available
- WHEN the review is recorded
- THEN every record calls it same-vendor, and it is NOT recorded as cross-vendor
#### Scenario: writers unknown
- GIVEN a review of work whose writers were not named
- WHEN it is recorded
- THEN the record says the writer is unknown, and NOT cross-vendor
#### Scenario: a leader on a model of no listed vendor
- GIVEN a leader of vendor `other` that reviews a developer's code
- WHEN the review is recorded
- THEN the record says the reviewer's vendor is unknown, and NOT cross-vendor

### R18. Vendor rows in mstack-setup  [Must]
`mstack-setup` SHALL report, in each of the three hosts, the client and its sign-in, and in Claude Code the plugin that carries a Codex developer run, of each of `claude` and `codex` that is not the host's own, with no row for a bridge, and SHALL count a caller's need for a reviewer as met when at least one channel is ready, reporting that the channel is ready and naming `mstack-vendors` as what answers, from the leader and the writers, whether that vendor can review a given piece of work.
#### Scenario: Antigravity host
- GIVEN an Antigravity session with the Codex client signed in and the Claude Code client signed out
- WHEN `mstack-setup` runs its status step
- THEN the Codex rows say ok, the Claude sign-in row says how to sign in, and NO row names a bridge
#### Scenario: one of two ready
- GIVEN an Antigravity session and a caller that needs a reviewer, with `codex` ready and `claude` not installed
- WHEN `mstack-setup` reports to that caller
- THEN the need counts as met, the report says the `codex` channel is ready, and the missing vendor is listed as optional
#### Scenario: only the session's own provider is ready
- GIVEN an Antigravity session with `claude` ready and `codex` not installed
- WHEN `mstack-setup` reports to a caller that needs a reviewer
- THEN the report says the `claude` channel is ready and that `mstack-vendors` decides from the leader's model whether `claude` reviews, and it does NOT say that `claude` can review this session's work
#### Scenario: a resumed plan
- GIVEN an Antigravity session with only `codex` ready, and a plan continued from Codex whose writers include `codex`
- WHEN `mstack-setup` reports to the caller and the caller then calls `mstack-vendors` for that plan
- THEN setup says the `codex` channel is ready and does NOT say `codex` can review that plan, and the result block has NO `codex` reviewer row for it
#### Scenario: nothing before the yes
- GIVEN a status with missing rows
- WHEN the user has not answered
- THEN nothing is installed
#### Scenario: no vendor rows for Antigravity
- GIVEN a Claude Code or a Codex session
- WHEN `mstack-setup` runs its status step
- THEN the vendor rows are those of the one other vendor, and NO row reports an Antigravity client or sign-in as a way to reach a reviewer or a developer, and NO row names a bridge

### R19. Real-client evidence  [Must]
Each pairing of host, vendor and job for which `mstack-vendors` gives a command SHALL have one recorded run with the real clients and the called vendor on the cheap tier's model, made by an agent when the host is Claude Code or Codex, and when the host is Antigravity made by the self-test: a session that a person opened runs the case itself and saves the reply and a run log.
#### Scenario: recorded
- GIVEN the 12 pairings: Claude Code with `codex`, Codex with `claude`, and Antigravity with `claude` and with `codex`, for the three jobs each
- WHEN the pull request is opened
- THEN its description lists the command, the date and the outcome for each, and says for each whether an agent ran it or the self-test did
#### Scenario: a case of the self-test
- GIVEN one of the 6 pairings whose host is Antigravity
- WHEN the session a person opened has run its case
- THEN the saved files hold the command the block gave, the reply that came back from Codex or Claude, and a run log with the date, the `agy` version and the session's model, the transcript of the session or of the case's subagent holds a `run_command` call whose `CommandLine` is that command, a case that calls Claude also holds the JSON result of its `claude -p` run with its `session_id`, without an error and naming the model that was asked for, and the case is graded afterwards from those files alone, NOT from what the session says about itself
#### Scenario: a developer told to push
- GIVEN one of the two developer pairings whose host is Antigravity, the developer told to push
- WHEN its case is graded
- THEN the saved files hold the developer's own push attempt: the Git command it ran, its error and its exit status (no remote in the copy for `claude`, no network access for `codex`); the leader's launch command, unchanged refs or the developer's own account of it do NOT count as the attempt, and a case without it does NOT pass
#### Scenario: a case not run yet
- GIVEN a case whose host is Antigravity and whose saved files are missing or incomplete
- WHEN the evidence is listed
- THEN its row says `not run`, NOT `pass`, and the pull request is NOT opened while a row says `not run`
#### Scenario: a claim the self-test cannot show
- GIVEN a single claim about an Antigravity run that the agreed self-test cannot establish, whatever it saves
- WHEN the evidence is listed
- THEN the claim is recorded as `not checked in Antigravity`, which holds nothing, and the skill's text does NOT state it as checked for that host
#### Scenario: a pairing that fails
- GIVEN a pairing whose run fails
- WHEN the failure is found
- THEN the command or its steps are fixed in the skill and the run is repeated, and the pull request is NOT opened with that pairing failing

## Constraints and assumptions

- Channels: a Codex review is a read-only `codex exec` run; the brief decided that the third-party `codex` skill is an optional helper for it (today the Claude-led review workflow falls back to a Claude review when that skill is missing); a Claude review or developer run from another host is a `claude -p` run of the Claude Code client (D28); a Codex developer in Claude Code goes through the OpenAI Codex plugin, and elsewhere through `codex exec` with a workspace-write sandbox (repository). No channel leads to Antigravity (D20), and none is a bridge (D28).
- `claude -p`, read from the installed client (Claude Code 2.1.330, `claude --help`) and one small run, 2026-11-23: print mode takes the prompt on stdin or as an argument and exits when done; `--output-format json` prints one JSON object whose fields include `result` (the answer text), `session_id`, `is_error`, `permission_denials`, `stop_reason` and `num_turns`; `--model <model>` and `--effort <low|medium|high|xhigh|max>`; `--permission-mode <acceptEdits|auto|bypassPermissions|manual|dontAsk|plan>`; `--tools <list>` sets which built-in tools exist; `--allowedTools` and `--disallowedTools` allow or deny by name with patterns; `--restricted` removes the tools that run commands or code; `-r, --resume <session id>` continues a session, `--session-id <uuid>` names one, `--add-dir` adds folders. Seen in the run: with a model option, `--output-format json`, `--permission-mode plan` and three read-only tools it returned an answer, a `session_id` and `is_error: false`. Not probed: a review of a real diff, a developer run that writes, a resume, and any run started from Codex or from Antigravity; the first runs of R19 confirm them, and the complete commands of a reviewer run and of a developer run are confirmed by one task of spec 1's plan (below). The rules are this spec's: a reviewer run gets no tool that writes and none that runs a command beyond what the review needs; a developer run writes only inside its copy and is continued by `--resume` with the `session_id` the leader kept.
- From inside an Antigravity session, a shell call ran `codex login status` (signed in; probed 2026-11-21, before the rule of 2026-11-23, kept as what was seen). A `claude -p` run from inside an Antigravity session was not probed; the self-test of R19 shows it.
- Sign-in checks: `claude auth status` and `codex login status` exist.
- `agy` runs Gemini, Claude and an open-weight GPT model (`agy models`, 2026-11-21).
- No agent and no script starts or drives an Antigravity session: not in print mode, not over ACP, not through the `antigravity` bridge in any direction, and not as a second session started from inside a person's own session (decided by the user, 2026-11-23; this withdraws the decision of 2026-11-22 that other agents reach Antigravity through ACP). A person opens Antigravity. From inside that session a skill uses the session's own tools and subagents, and calls the other vendors: Codex with `codex exec`, Claude with `claude -p`. What this spec recorded about driving a session from outside (the ACP bridge's commands, its version floor, its line for an incomplete review, its session mode) is removed, because nothing uses it (D23).
- A long `claude -p` or `codex exec` command is run as it is, with no background job and no job id. In Antigravity the session is told when a command completes, and the steps do not report or finish before the command's completion and its output were seen (the self-test's first case with `claude` confirms it).
- Seen in one session a person opened (`agy` 1.5.15, 2026-11-23, session mode `auto`): a subagent of the session loaded a skill installed under the workspace's `.agents/skills/` and replied with the skill's exact line; a subagent ran a shell command, and in mode `auto` the client did not ask the person; a subagent started a subagent of its own, which answered and has its own record on disk. The session's subagent record (`~/.gemini/antigravity-cli/brain/<session id>/.system_generated/subagents/<subagent id>.json`) and the subagent's transcript (`~/.gemini/antigravity-cli/brain/<subagent id>/.system_generated/logs/transcript.jsonl`) both exist, and the session itself read them: the transcript names the model (the session's own) and the tools called (`read_file`, `run_command`, `invoke_subagent`, `send_message`). A subagent reported this tool list: `ask_question`, `define_subagent`, `edit_file`, `invoke_subagent`, `manage_subagents`, `manage_task`, `read_file`, `run_command`, `run_workflow`, `schedule`, `search_web`, `send_message`, `swarm`, `write_file`. Read afterwards from that session's files, without running a client: a transcript's `tool_calls` entries carry the name and the arguments (`read_file` with `Path`, `run_command` with `CommandLine`, `write_file` with `Path`, `invoke_subagent` with `Prompt`, `Role`, `TypeName` and, in a subagent's own call, `Model`, `send_message` with `Message` and `Recipient`); the session's own transcript (`~/.gemini/antigravity-cli/brain/<session id>/.system_generated/logs/transcript.jsonl`) records its own calls the same way; a subagent record holds `conversationId`, `spawnStepIndex`, `state`, `subagentDescriptor` (`typeName`, `role`) and `workspaceUris`, and for a subagent started without an agent type `typeName` was `self`. So which file was read or written, which command ran and which model a subagent ran can be shown from the transcripts, for a case's subagent and for the session itself.
- Seen in a second session a person opened (`agy` 1.5.15, 2026-11-23): the session's own id is in its context, so a session can write its id into a file. A subagent's `ask_question` goes to the person, not to the session that started it: the subagent waited until the person answered, and a message the session sent it meanwhile stayed queued. A skill of a plugin under the workspace's `.agents/plugins/<plugin>/` loaded for a subagent. A plugin's agent started when the session named it as the agent type, and its subagent record says `subagentDescriptor.typeName` with the agent's name, where a subagent without an agent type says `self`. `claude -p` and `codex exec`, run by the session as shell commands, failed inside the client's sandbox with exit 127 (command not found); after the person approved a run outside the sandbox both completed in the same turn, about 20 seconds each with the approval. So every call of another vendor's client from an Antigravity session needs the person's approval of an unsandboxed run, at least as that session was set up. `codex exec --skip-git-repo-check -s read-only '<prompt>'` printed a header (model, sandbox, session id), the answer after a line `codex`, and `tokens used`.
- The same session's `claude -p` call (a model option, `--output-format json`, `--permission-mode plan`, three read-only tools, a one-word prompt) loaded the person's whole Claude Code setup: the JSON reported about 196,000 cache-creation tokens and about 0.79 USD for one word, its `modelUsage` named another model than the one asked for, and `result` held the word plus sentences from the person's own hooks and plugins. So a plain `claude -p` is costly, may run another model than asked, and does not give a clean result. The skill's text says that Claude Code loads the user's own setup unless the flags below are used (D29).
- `claude -p` run from a clean environment (Claude Code 2.1.330, 2026-11-23; a one-word prompt, `--output-format json --permission-mode plan` and three read-only tools): plain, about 149,000 cache-creation tokens, 0.60 USD and extra text from the person's customizations in `result`; with `--bare` it fails with `Not logged in`, so it is unusable with a subscription sign-in; with `--safe-mode` the sign-in works, the run takes about 4,700 tokens and 0.02 USD, and `result` is exactly the answer. The help text of `--safe-mode`: all customizations are disabled (the instruction files, skills, installed plugins, hooks, MCP servers), file tools are confined to the working directories (`--add-dir` included), `bypassPermissions` is refused, and only a person or the configured permission handler approves writes. Corrected 2026-11-23 by the task that confirmed the commands (15 real runs): the confinement of file tools, the refusal of `bypassPermissions` and the rule on who approves writes are in the help text of `--restricted`, not of `--safe-mode`; under `--safe-mode` a reviewer run read a file outside its working folder and a developer run under `--permission-mode auto` wrote one outside its copy, each with no denial, so neither recorded command confines a run to its folder. The developer command uses `--permission-mode acceptEdits --allowedTools "Bash"`: `acceptEdits` alone was denied the shell and could not run the tests, and `--permission-mode auto` is not needed; with the shell allowed by rule a write and its resume ran with no denial and only the model asked for. A second model, not asked for, appeared in one run: it was the advisor tool, which the user's own setting `advisorModel` switches on and which neither `--safe-mode` nor `--tools` removes, so every recorded command (reviewer, developer, resume) also carries `--settings '{"advisorModel":"off"}'`, with which three runs reported no such tool and only the model asked for. That command lets the developer run any shell command, so the throwaway copy without a remote is its only limit. Model names: the cheap model's alias ran another, larger model in all three runs, the full model id ran the model asked for, and another alias ran its own family; so a `claude` entry of the `Models` line is a full model id wherever the alias is not proven, and every run's `modelUsage` is checked. Not tried: `--effort`, a review of a real diff, a write, a resume, `--plugin-dir` under `--safe-mode`.
- Who confirms the Claude commands: one task of spec 1's plan, before any `claude` command of this skill is written. It confirms the complete commands the callers ship, for a reviewer and for a developer: with `--safe-mode` (the candidate; `--bare` is out), `--model <full id>`, `--effort`, `--output-format json` and the tool and permission flags; it checks `modelUsage`, the cost and a clean `result`, and confirms a write and a resume as a pair under the same flags. Because `--safe-mode` refuses `bypassPermissions`, how a developer run writes without a person is part of what that task finds; if no way exists, it stops and reports, and this spec's `claude` developer pairings do not ship. `mstack-vendors` carries the confirmed commands in its own text and gives them in its result; no installed skill or host file cites a path of a plan.
- The review prompt and the form of the findings are this skill's own, written in mstack's words after reading the review prompt and the review output schema of the agent-bridges `claude` plugin (Apache-2.0), and credited in this skill's `THIRD_PARTY_NOTICES.md` (D30, D32).
- Seen in a third and a fourth session a person opened (`agy` 1.5.15, 2026-11-23): a batch of three cases, one subagent each with `Role` equal to the case id, ran on the cheap Gemini model in 2 minutes 45 seconds; each subagent took its answers from the list in its prompt and did not call the question tool, and wrote its files in its case's folder when told to start every shell command with `cd <absolute folder> && `; the session wrote its reply and session files as told and reported the client's version and mode as `unknown`, because it cannot see them. Inside the client's sandbox `node`, `git` and `curl` are found, for the session and for each subagent; `claude` and `codex` are not, also with their folder on `PATH`, because on that machine they are installed under the person's home folder, which the sandbox does not show; a write to a folder next to the workspace succeeded. A subagent that asked for a run outside the sandbox got it, and `claude -p` and `codex exec` then completed; a subagent that did not ask reported command not found (exit 127). Whether the person is shown an approval each time was not recorded: the steps plan for one approval per run.
- The self-test (decided by the user, 2026-11-23): a person opens Antigravity in a checkout and pastes one prompt per start, four starts in all (the skills batch, the pairings batch, the review workflow, the dev workflow; each workflow is a session of its own); in a batch the session runs the cases itself, one subagent per case in a throwaway folder, and saves each reply and a run log; the saved files are graded afterwards (by an agent in Claude Code or Codex: agent's call, D25). The batch's prompt names the model the person starts the session on; a case's subagent ran the session's own model, and the `Model` argument of `invoke_subagent`, which no person's session has tried, is not relied on. A case never relies on the session answering a subagent's question tool, because that question goes to the person: each case's subagent gets its prepared answers up front in its prompt and says in its reply which question got which answer. The batch tells the person at its top what they will be asked to approve: every helper a case starts outside the sandbox, which is each run of `claude -p` or `codex exec` and a fixture's own Git server. The four sessions are run in one sitting at the end, after all three plans are built; until then this spec's Antigravity rows say `not run` (D31). This spec's start is the pairings batch, in which each case's subagent calls Codex or Claude. A case that needs a client absent runs with a `PATH` prepared for that case's subagent that hides the client, also for a run outside the sandbox; a case about a leader on another provider's model is a routing case with a prepared `Leader model`, graded for the routing only, and this spec runs those as fixtures, so nothing here claims which provider really ran a session. The prompt files of the batch and the form of what it saves belong to the plan.
- Model names belong in `mstack-best-model-for`'s table, apart from the few places the repository agent instructions allow (reviewer questions and defaults, a rule that excludes one model, eval cases); this skill names none: every model in a command it gives comes from the caller's `Models` line; the fallback subagents of Claude Code and Antigravity take the session's model without naming it, and a Codex fallback run names no model option unless the caller's `Models` line gives one for `codex` (R14). That a `codex exec` run without a model option runs the client's configured model is the client's documented default (agent's call: not probed for this spec; the Codex fallback case of R14 shows it). Spec 1 gives the Antigravity models and flags the expensive ones.
- Today's same-vendor fallback is a fresh read-only subagent in Claude Code and a separate read-only `codex exec` run in Codex (the two review workflows). An Antigravity subagent takes a tier, not a model id (spec 1).
- A change to this skill's called message or result block is a change to every caller (repository agent instructions, sweep rule 1).
- `mstack-vendors` does not require `mstack-best-model-for`: it names no model and sends no prompt to one, and its callers take the models from that skill and pass them in the `Models` line (R16 removed, D24).
- The Codex client's sandbox runs a developer with network access off, so a push fails there; the developer workflow of today keeps Git read-only for the developer and accepts a result only after checking its job, phase and thread (today's developer workflow and its script).
- `mstack-setup` requires no other mstack skill and sends no prompt to a model.
- Today `mstack-setup` has three reviewer rows and a `reviewer` group that a caller can name in its needs.

## Decisions

D1. One shared skill owns availability, the reviewer rule and the commands. Alternatives: inline in each caller; a host file per skill. Decided by: user. Source: brief, approaches.
D2. The skill is named `mstack-vendors`. Alternatives: `mstack-cross-vendor`, `mstack-reviewers`. Decided by: user. Source: interview 2026-11-21.
D3. A vendor is the provider of the model that runs; an Antigravity leader on another provider's model is warned and counted as that vendor. Alternative: stop such a workflow. Decided by: user. Source: interview.
D4. A Claude developer writes in a local copy with no remote, holding the tracked files of the current commit and the run's plan folder. A Codex developer needs no copy: its sandbox has no network access. Alternatives: the user's checkout with a check before and after (detects a push, does not prevent it); a copy of every file (ignored secrets would reach another vendor's client); a copy for Codex too (drops the tested plugin path). Decided by: user. Source: interview, two rounds; an Antigravity developer left this decision on 2026-11-23 (D20).
D5. Withdrawn 2026-11-23 by D20. Was: Antigravity's sign-in is confirmed by one small run per workflow run. Decided by: user. Source: interview; decisions of 2026-11-23.
D6. The reviewer rule: both when two are eligible, one when one is, same-vendor with a warning when none; in a dev workflow the leader reviews and a vendor that is neither the leader's nor the developer's joins, which since 2026-11-23 can happen only when the host is Antigravity (R12). Decided by: user. Source: brief.
D7. The three vendors are named `claude`, `codex` and `antigravity`, the last meaning Gemini models through the Antigravity client, since 2026-11-23 only as the vendor of a leader or a writer (D20). Alternative: `gemini` (a separate Gemini bridge exists in the bridge repository and is not part of this work). Decided by: agent's call. Source: brief's wording.
D8. In called mode the skill never asks; the caller asks the user which recommended vendors to use. Alternative: the skill asks (two skills would then talk to the user in one step). Decided by: agent's call. Source: the pattern of the other shared skills.
D9. The caller takes models from `mstack-best-model-for` and passes them in the `Models` line; the skill returns filled commands, gives none for a vendor without a model, and ignores an `antigravity` entry with a warning (changed 2026-11-23 by D20). Alternative: placeholders the caller fills afterwards (a command with an unfilled model could then be run). Decided by: agent's call. Source: review finding.
D10. Every pairing has a recorded real run before the pull request; none ships as unverified; the pairings whose host is Antigravity are run by the self-test (D22). Alternative: report an unverified pairing as not available (the brief's release decision ruled out shipping with partial support). Decided by: user. Source: brief, release gate.
D11. The developer's commits in the copy never enter the user's history; the leader applies a diff and commits itself. Alternative: fetch the developer's commits. Decided by: agent's call, because the leader commits only what it reviewed. Source: today's developer workflow.
D12. For the dev job the block recommends no vendor over another. Alternative: a fixed preference order. Decided by: agent's call, because the brief says the workflow asks which vendor develops.
D13. `mstack-vendors` is a plugin for all three hosts and gets its row in the routing table for the user-mode question. Decided by: agent's call. Source: repository agent instructions on added skills.
D14. The skill ships scripts in its own folder for the availability check, the copy (make, check for remotes, diff, remove) and the Codex developer's job checks, which move here from the developer workflow; the caller launches the reviewers and developers with the commands of the block. Alternative: prose steps only (the copy and the checks would be re-derived by every caller). Decided by: agent's call.
D15. One recording rule (R17) for every review row: writers unknown, or a reviewer whose vendor is `other` or `unknown`, is never recorded as cross-vendor. In Claude Code and Codex the host tells the leader's vendor; only Antigravity needs the leader's model. Decided by: agent's call, because a false cross-vendor record is the failure the vendor rule exists to prevent.
D16. The fallback review is a fresh read-only review by the leader's vendor, in each host's own way (R14), on the session's model only where a subagent inherits it (in Codex the separate run's model may differ, changed 2026-11-23), recorded by R17 like any other review, and is not one of the pairings of R19. Decided by: agent's call.
D17. When an Antigravity leader runs another provider's model, no Gemini review is available: it would need a second Antigravity session started by an agent. The review goes to `codex`, to `claude` when it is not among the writers, or to the fallback review by a subagent of the same session (R14), and `antigravity` is never a developer. Alternative: a Gemini review through the `antigravity` bridge as a separate session (the agent's call of 2026-11-22, withdrawn). Decided by: user. Source: decisions of 2026-11-23 (D20).
D18. A need for a reviewer is met by one ready channel (which says nothing about one piece of work: D26), and `mstack-setup` has no row for Antigravity's sign-in (changed 2026-11-23 by D20). Alternative: require every vendor (would block a review the rule allows with one). Decided by: agent's call.
D19. Scope after the rule that no agent and no script starts or drives an Antigravity session: host support only. What a person uses inside their own Antigravity session stays (the skill there, an Antigravity leader, its calls to Codex and Claude); everything that reaches Antigravity from another host or from a script leaves. Alternative: keep the ACP route of 2026-11-22 (withdrawn). Decided by: user. Source: decisions of 2026-11-23.
D20. A skill never starts a second Antigravity session, also not from inside a person's Antigravity session. `antigravity` is never a reviewer vendor and never a developer vendor in any pairing; the `antigravity` bridge and the sign-in check leave this spec (R4 removed, the `Antigravity sign-in` line leaves the contract); an Antigravity leader and its own subagents, the fallback review among them, stay. Alternative: allow the bridge from inside a session a person opened (it is the same mechanism: a script opens a session and drives it). Decided by: user. Source: decisions of 2026-11-23.
D21. `mstack-vendors` is still built, smaller: no sign-in check for Antigravity (the sign-in checks of `claude` and `codex` stay, R3), and `antigravity` never a vendor to call. Alternatives: write the reviewer choice into the workflow texts and `mstack-plan` (the rule in nine places again); ship only the scripts. Decided by: user. Source: decisions of 2026-11-23.
D22. Evidence for Antigravity comes from a self-test that a person starts in their own Antigravity session: one prompt per start, four starts in all, of which the pairings batch is this spec's; the session runs each case with its own tools and saves each reply and a run log, the grading happens afterwards from the saved files, and the pull request waits for the batch to pass. A single claim the self-test cannot establish is recorded as `not checked in Antigravity`; a case whose files are missing is `not run`. Alternative: one run by hand per pairing, the reply pasted in (the decision of earlier the same day, replaced). Decided by: user. Source: decisions of 2026-11-23.
D23. Facts from the probes made before 2026-11-23 stay in the Constraints, dated, as what was seen; every fact about how to drive an Antigravity session from outside (the ACP bridge's commands, its version floor, its line for an incomplete review, its session mode) is removed, because nothing uses it. Alternative: remove every such fact and have a person confirm each (the dated facts about what a session can call are still needed). Decided by: agent's call.
D24. R16 is removed: `mstack-vendors` does not require `mstack-best-model-for`. The only reason this spec gave for the requirement was R4's sign-in prompt on the cheap tier's Antigravity model. Alternative: keep it so that user mode could show models (this skill names none). Decided by: agent's call.
D25. The details of the evidence: a run log holds the date, the `agy` version and the session's model, which is the one the batch's prompt names to start on (the session cannot see its client's version or mode and says `unknown` for them); an agent in Claude Code or Codex grades the saved files; that a command ran, or did not, is read from the `run_command` calls of the transcripts; the pairings whose host is Claude Code or Codex are run by an agent; the plan keeps one list of the self-test's cases, in which a case not yet run says `not run`, never `pass`; and a claim about a subagent names the two files that show it, the session's subagent record and the subagent's transcript (R14). Alternative: no list (a missing case would not show). Decided by: agent's call.
D26. One eligibility rule, applied before availability: a reviewer or a developer vendor is `claude` or `codex`, minus the leader's provider, minus the writers for a review; the writers are left out always, also when the leader is unknown. `mstack-setup` reports only that a channel is ready; whether the vendor can review a given piece of work is the answer of `mstack-vendors` for that work (R18). Alternatives: let R5 exclude only the writers (a session on a Claude model would be offered a Claude reviewer for its Gemini lanes' code, and R12 would disagree with R5); let setup promise a reviewer (a plan continued from Codex would be promised a Codex review of Codex's own work). Decided by: agent's call. Source: review findings.
D27. The requirements on sign-in and commands apply only to rows with the role `reviewer` or `developer`; a `leader` or `fallback` row has an empty Command cell and its action in `Steps`. A dev workflow's recommendation with a second reviewer reads `the leader's review + <vendor>`, and when that second reviewer fails the leader's review stands and no fallback review starts. Alternative: a vendor list after `Recommend:` that would have to name the leader's own vendor. Decided by: agent's call. Source: review finding.
D28. `mstack-vendors` does not depend on the bridge repository: Claude is reached from Codex and from Antigravity with the Claude Code client's own headless mode (`claude -p`), as Codex is reached with `codex exec`, and no skill checks for, installs or calls a bridge. This replaces the brief's "bridges per vendor". Alternative: the `claude` bridge and its background jobs (a second repository to install, version and package for Antigravity). Decided by: user. Source: decisions of 2026-11-23.
D29. What follows from D28: a Claude reviewer run gets no tool that writes and none that runs a command beyond what the review needs; a Claude developer's fix round continues by `--resume` with the `session_id` of the JSON result; a long command is run as it is and awaited; the complete commands are confirmed by one task of spec 1's plan, starting from `--safe-mode` and full model ids, which finds the flags that keep the user's Claude Code customizations out, run the model asked for and give a clean result, records tokens and cost per call, and confirms a write and a resume as a pair; in Antigravity the steps tell the session and the user that each call of another vendor's client needs the user's approval of a run outside the sandbox (R3, R8). Decided by: agent's call.
D30. agent-bridges is removed from mstack completely, in every host and every file; where a skill needs another vendor's model it calls that vendor's own client (`claude -p`, `codex exec`). What mstack needs to know about calling a client (the shape of a review prompt, the output it asks for, the read-only settings) is written in mstack's own files and words, and text adapted from agent-bridges is credited in the skill's `THIRD_PARTY_NOTICES.md`. This widens D28 from this skill to the whole repository. Decided by: user. Source: decisions of 2026-11-23.
D31. The self-test's four sessions are run by the person in one sitting at the end, after everything of the three plans is built; the plan of this spec prepares its cases and closes with its Antigravity rows `not run`, and the pull request still waits for them (R19). Alternative: a session per plan as each one ends (rows would go stale and need repeat sessions). Decided by: user. Source: decisions of 2026-11-23.
D32. The review prompt and the form of the findings that a reviewer command carries are `mstack-vendors`' own, the same for `claude` and `codex`, adapted in mstack's words from the agent-bridges `claude` plugin and credited in this skill's `THIRD_PARTY_NOTICES.md`. Alternative: each caller's own brief with no common findings form (the receiving skill would get two shapes). Decided by: agent's call, following D30.

## Risks

- A copy without a remote still shares the machine and the user's credentials: a developer that types a full address can still push. This is not prevented. The steps of R10 check the copy for remotes afterwards, the developer's prompt forbids pushing, and the leftover risk is stated in the skill's text and in the pull request; closing it needs a sandbox that a `claude -p` developer run does not have today.
- A caller in Antigravity may not know its session's model -> the leader counts as `unknown`, and R17 keeps that from producing a cross-vendor record.
- The copy holds no ignored file except the run's plan folder, so a build or test that needs local configuration can fail in it -> the developer reports it, and the leader runs the checks in the user's checkout after applying the diff.
- The 6 pairings whose host is Antigravity, and the Antigravity cases of R3, R14 and R15, need a person to open a session and paste the batch's prompt, and no agent can start them -> they are one of the self-test's four starts, the pairings batch (D22), and the rules behind them are covered by eval cases an agent runs with `Host: antigravity` in the called message.
- The facts about subagents, and the need to approve a run outside the sandbox, were seen in two sessions as those were set up -> the self-test records the mode it ran in, and behaviour under another mode or sandbox setting is recorded as `not checked in Antigravity`.
- In Antigravity every call of `claude -p` or `codex exec` waits for the person's approval, so a run nobody watches stalls -> the steps tell the user before the first call (R8), and a run that was not approved is reported as failed, never as clean.
- An Antigravity leader on a Claude model with `codex` missing gets no review by another vendor -> the fallback review runs with its warning and is recorded `same-vendor` (R14, R17).
- 12 pairings (Claude Code with `codex`, Codex with `claude`, Antigravity with `claude` and with `codex`, three jobs each) need real runs, and one that fails holds the pull request -> the command or its steps are fixed and the run repeated before the pull request (R19).
- A plain `claude -p` run loaded the user's whole Claude Code setup, cost about 0.79 USD for one word and ran another model than asked -> no `claude` command ships before the confirming task of spec 1's plan has confirmed the complete commands under `--safe-mode`; if none work, that task stops and reports. `--safe-mode` refuses `bypassPermissions`, so a Claude developer run may have no way to write without a person -> the same task finds one or stops, and then the `claude` developer pairings do not ship. Also, of `claude -p` only a small read-only run was seen; a review of a real diff, a developer run that writes, a resume and a run from Codex or Antigravity were not -> that task and the first runs of R19 confirm them, and the steps for `claude` are not final before.

## Verification

- R1, R2, R5, R6, R7, R9: called-mode eval cases with a stand-in for each client (states: missing, signed out, ready), covering a leader on another provider's model, a model of no listed vendor, mixed lane writers, unknown writers, an unknown leader with a known writer, both workflow kinds and an `antigravity` entry in `Models`. The host of a case is the `Host` line of its called message, so the cases for an Antigravity host are run by an agent in Claude Code or Codex and start no Antigravity session.
- R3: tests of the availability script against stand-in clients, plus one real run per host, in Antigravity as a case of the self-test (D22).
- R8, R19: one recorded real run per pairing, 12 in all: the 6 whose host is Claude Code or Codex by an agent, the 6 whose host is Antigravity by the self-test; the table goes into the pull request description.
- R10: tests of the copy script (ignored file not copied, uncommitted changes stop it, committed and new files both in the diff, a remote added to the copy stops it) and one real developer run told to push, a Claude developer called from Codex, with one fix round resumed by its session id.
- R11: the moved job-check tests of today's developer workflow, and one real Codex developer run told to push.
- R12, R13, R14: eval cases with two stand-in reviewers and `Host: antigravity` in the called message (both return, one fails, both fail, a rejected effort, the second reviewer of a dev workflow fails), a case for a Claude Code and for a Codex host that never gets two, a case for an Antigravity leader without another vendor, and the two Codex fallback cases (no model option; a model the caller supplies that differs). A stand-in case shows the steps the skill returned; that a subagent really reviewed is shown by the self-test's fallback case (R14). This spec has no live case with two reviewers: that both start before either is awaited is shown in spec 3's review workflow run.
- R15: an eval case per host in user mode; in Antigravity a case of the self-test (D22).
- The Antigravity evidence of this spec, in one list:
  - Starts by the person: 1 of the self-test's four, the pairings batch, in a session started on the Gemini model the batch's prompt names, so that both `claude` and `codex` are eligible; it is run with the other three starts in one sitting at the end (D31), and the person approves each run outside the sandbox that the batch's notice lists.
  - Pairings: 12 of host, vendor and job; 6 are run by an agent (Claude Code with `codex`, Codex with `claude`), 6 by the self-test (Antigravity with `claude` and with `codex`).
  - Runtime cases the self-test must pass, 9, each holding the pull request: the 6 pairings, each called from its case's subagent with both clients present (the two developer cases told to push; the `claude` cases save the JSON result of their `claude -p` run); the availability run of R3, with both clients present; the fallback review of R14, with a `PATH` that hides both clients; the user-mode question of R15, with both clients present. Spec 3's dev workflow run exercises one of the two developer pairings from the session itself; the other is called only from a case's subagent.
  - Fixture-only assertions, checked in Claude Code or Codex with stand-in clients and needing no Antigravity session, 65 of this spec's 74 scenarios: every scenario of R1 to R3, R5 to R7, R9 to R13, R15, R17 and R18, five of R8's six and five of R14's seven (the other nine are R19's six evidence rules, R8's "every pairing has a command" and R14's two on the live fallback case), the routing scenarios for a leader on another provider's model and for an unknown leader among them.
  - Not checked in Antigravity, 2 claims, holding nothing: the behaviour of the commands under a session mode or a sandbox setting other than the one the self-test ran in; and whether the client gave the fallback subagent more context than its prompt. That a skill asks with the question tool is not a claim of this spec: `mstack-vendors` asks nothing in called mode, and its cases get their answers in the prompt.
- R17: the receiving skill's eval cases for a dev workflow, a writer's-vendor fallback and unknown writers; a sweep of every text that states the old rule.
- R18: tests of the setup status script per host with stand-in clients, including a caller's reviewer need with one channel ready, with only the session's own provider ready in Antigravity, and with a resumed plan whose writers include the ready vendor.
- Not covered by a scenario: Windows (expected: the same commands and Git steps), a repository with submodules or large files in the copy (expected: the copy step works; not tested), two runs at once in one repository (expected: each makes its own copy).

## Open questions

- Can a `claude -p` developer run be confined so that it cannot push to an address typed in full? Owner: engineering. Can wait because: R10 holds without it, and such a confinement would only remove the residual risk named under Risks.

## Appendix: interview record

- 2026-11-21 Evidence: brief, Decided by the user / Decision: shared skill, reviewer rule, one developer per run, each workflow in its own host, bridges per vendor, real-client tests (decided in the brief).
- 2026-11-21 Evidence: brief, Agent's calls / Decision: carried as agent's calls: vendor by provider with Gemini-only bridge runs, eligibility by writer, availability per job, no dev workflow with one vendor.
- 2026-11-21 Q: how to keep a developer from publishing / Recommended: a local copy without a remote / Decision: as recommended.
- 2026-11-21 Q: an Antigravity leader on another provider's model / Recommended: warn and count as that vendor / Decision: as recommended.
- 2026-11-21 Q: when to confirm Antigravity's sign-in / Recommended: one small run per workflow start / Decision: as recommended; later calls of the same run reuse the result.
- 2026-11-21 Q: the skill's name / Recommended: mstack-vendors / Decision: mstack-vendors.
- 2026-11-21 Evidence: probes from inside an Antigravity session (Claude bridge companion, `codex login status`, a workspace plugin) / Decision: the channels work from Antigravity; packaging is tracked in the bridge repository.
- 2026-11-21 Evidence: the review commands in `mstack-plan` and the three workflows / Decision: the channels listed in Constraints.
- 2026-11-21 Q: what the developer's copy contains / Recommended: tracked files plus the plan / Decision: as recommended.
- 2026-11-21 Q: does a Codex developer use the copy / Recommended: no, its sandbox already blocks a push / Decision: as recommended.
- 2026-11-21 Evidence: reviews by Codex, Antigravity and an independent reader, first round / Decision: 32 findings processed: the contract, the dev-workflow review, the Antigravity-with-itself pairing, the required model skill, the failed-reviewer cases and the setup rows were specified.
- 2026-11-21 Evidence: second review round by Codex and Antigravity / Decision: 20 findings processed: one recording rule per review row (R17), the leader's vendor from the host outside Antigravity, no developer through the host's own client, the fallback review per host, models required for a command.
- 2026-11-21 Evidence: spec 3's review (a fix round needs the developer's earlier changes) / Decision: R10's copy lives for the whole phase. Status back to Draft for this change.
- 2026-11-22 Q: how other agents reach Antigravity / Decision by the user: only through ACP. R8's scenario for Gemini from inside Antigravity and D17 now go through the bridge; a Constraints line records what the ACP bridge does. Status back to Draft for this change.
- 2026-11-22 Evidence: two reviews of the ACP amendment and a probe of the nested sequence (background review, status, result) / Decision: the Constraints line on the ACP bridge states the route from inside Antigravity, the version rule, the cut-evidence rule and the effort rule.
- 2026-11-22 Evidence: a probe of the bridge's write task with a 25-second command (it returned at the first turn end, nothing written) / Decision: the bridge's version floor is 0.2.2, the version that carries the fix of issue 16 of the bridge repository.
- 2026-11-22 Approval: the user approved the ACP amendment, and chose the session mode `auto` for test runs whose subagents run commands (the agent's call is now the user's decision).
- 2026-11-22 Amendment approved by the user (documents stay Approved): bridge 0.2.2 facts. A review's `Incomplete review:` line also names files skipped as too large, binary or a link; a bridge write task runs in Antigravity's mode `auto`, and a stuck subagent makes its job fail; every bridge task waits for 30 seconds of quiet before it ends (the 120-second sign-in limit still fits: real runs took 34 to 51 seconds).
- 2026-11-23 Q: the scope after the rule that no agent and no script starts or drives an Antigravity session / Decision by the user: host support only; what a person uses in their own Antigravity session stays, every reach into Antigravity from another host or a script leaves (D19).
- 2026-11-23 Q: may a skill inside a person's Antigravity session start a second one for a Gemini review / Recommended: no / Decision by the user: no. `antigravity` is never a reviewer or a developer vendor; the `antigravity` bridge and the sign-in check leave the spec; R4 is removed and D17 is replaced (D20).
- 2026-11-23 Q: is `mstack-vendors` still built / Recommended: yes, smaller / Decision by the user: as recommended (D21).
- 2026-11-23 Q: what counts as evidence for Antigravity / Decision by the user: first a run log per run a person makes, replaced the same day by the self-test recorded below; R19 has 12 pairings, 6 of them hosted in Antigravity (D22).
- 2026-11-23 Evidence: the Constraints lines on the ACP bridge / Decision (agent's call): dated facts of earlier probes stay as what was seen; the facts about driving a session from outside are removed (D23).
- 2026-11-23 Evidence: this spec's own reason for R16 (the Constraints line that named R4's check) / Decision (agent's call): R16 is removed (D24).
- 2026-11-23 Evidence: the number of Antigravity cases / Decision (agent's call): the plan keeps one list of them, and a case not yet run says `not run` (D25).
- 2026-11-23 Evidence: the `claude` bridge's companion source, version 0.2.5 (its `--background`, `status --wait` and `result` commands) / Decision: the background sequence stays in Constraints as seen with another bridge and not confirmed for `claude` until the self-test's first case with it.
- 2026-11-23 Amendment: the contract loses the `Antigravity sign-in` line in the called message and in the result block; R2, R3, R5 to R10, R12, R14, R18 and R19 changed; R4 and R16 removed. Status back to Draft for this change.
- 2026-11-23 Q: how Antigravity evidence is made / Decision by the user: a self-test the person starts in their own session, one prompt per start (four starts in all, recorded later the same day), graded afterwards from the saved files; the pull request waits for it; what it cannot show is recorded as not checked in Antigravity. This replaces the runs made one by one by a person (D22).
- 2026-11-23 Evidence: one session a person opened (`agy` 1.5.15, mode `auto`) / Decision: the facts about subagents (skills, shell, nested subagents, the record and the transcript on disk) are in Constraints, and a claim about a subagent names those two files.
- 2026-11-23 Evidence: review by Codex of the re-scoped specs, findings 1, 2, 3, 10 and 12 / Decision: all five hold for this spec and are fixed: sign-in and command rules only for reviewer and developer rows (D27); one eligibility rule before availability, and setup's line for `claude` as the only ready vendor in Antigravity (D26); the form `the leader's review + <vendor>` in the result block, and a failed second reviewer of a dev workflow starts no fallback (D27); the files that show a same-session subagent reviewed (R14); the run log's fields, who runs the Claude Code and Codex pairings and the case list are agent's calls (D25).
- 2026-11-23 Evidence: the repository's rule on model names, checked after R16 left / Decision: the skill names no model; a Codex fallback run takes its model from the caller's `Models` line or carries no model option.
- 2026-11-23 Evidence: the files of the person's session, read without running a client (tool calls with their arguments, the session's own transcript, the fields of a subagent record) / Decision: that a pairing's command ran, and that no command started a second Antigravity session, is checked from `run_command` calls; the batch's prompt names the model to start on; who grades is an agent's call (D25); not checked in Antigravity are only a session mode nobody ran and the context a subagent was given.
- 2026-11-23 Evidence: second review by Codex of the re-scoped specs, findings 1, 4, 5, 6, 8, 9, 10, 11 and 13 / Decision: all hold for this spec and are fixed: the writers are left out also with an unknown leader (D26); R8's pairings are the callable rows with a model; a Codex fallback names no model option and may run another model than the session's (R14, D16); setup reports a channel, not a reviewer for a piece of work (R18); one list with counts in Verification; missing files mean `not run`; each live case names the clients it needs; the fallback is graded from the parent's call, the child's reads and commands, and the review's content; a background job is tied by its job id and a push case holds the attempt (R19). Finding 7: the self-test has four starts, one of them this spec's.
- 2026-11-23 Evidence: the question put to the user about the self-test / Decision: the user decided that grading happens afterwards from the saved files; the question did not name the grader, so that an agent in Claude Code or Codex grades stays an agent's call (D25).
- 2026-11-23 Q: does mstack still depend on the bridge repository / Decision by the user: no; Claude is reached with the Claude Code client's headless mode, and no skill checks for, installs or calls a bridge (D28). The lines above about the `claude` bridge, its background sequence and its packaging are superseded; the background job and its job id leave the spec, a fix round continues by the session id (D29).
- 2026-11-23 Evidence: the installed Claude Code client's help text and one small headless run / Decision: the facts are in Constraints with what was not probed; the reviewer and developer flags belong to the plan.
- 2026-11-23 Approval: the user approved the re-scoped spec (host support only, the self-test, no bridge of agent-bridges, Claude through `claude -p`).
- 2026-11-23 Evidence: a second session a person opened (sandbox and approval for `claude -p` and `codex exec`, a subagent's question goes to the person, a plain `claude -p` loads the user's setup) and two more decisions by the user (the four sessions in one sitting at the end; agent-bridges removed from mstack completely) / Decision: the facts are in Constraints; in Antigravity the steps tell the session and the user about the approval (R3, R8); a `claude -p` command keeps the user's customizations out, runs the model asked for and gives a clean result, with flags from the plan's confirming task (D29); D30 and D31 record the user's decisions. The contract is unchanged. Status back to Draft for this change.
- 2026-11-23 Evidence: a third and a fourth session a person opened, three `claude -p` runs from a clean environment, and the review by Codex of the specs and plans (findings 2, 3, 4 and 14 name this spec) / Decision: the facts are in Constraints; the complete Claude commands are confirmed by one task of spec 1's plan, with `--safe-mode` and full model ids (finding 2, D29); the availability check and each client run ask for a run outside the sandbox, with three outcomes kept apart (finding 3, R3, R8); R6's case for unknown writers states its recommendation (finding 4: the spec's rule held, the scenario now says it); a push case holds the Git command, its error and its exit status (finding 14, R19); the review prompt and findings form are this skill's own, credited (D32). The contract is unchanged.
- 2026-11-23 Approval: the user approved the spec as re-scoped (the self-test in one sitting at the end, no bridge of another repository, Claude through `claude -p`), and decided that scripts may also run `agy --version`, which starts no session, so the run log names the client's version.
- 2026-11-23 Evidence: plan 1's task 1.3 (15 runs of `claude -p`, Claude Code 2.1.330) / Correction of a fact, made under the user's standing permission to fix and approve: the confinement text belongs to `--restricted`; `--safe-mode` does not confine a run; the developer command uses `--permission-mode acceptEdits --allowedTools "Bash"` (a second model seen once was the user's advisor tool; every recorded command switches it off with `--settings '{"advisorModel":"off"}'`). Status stays Approved.
