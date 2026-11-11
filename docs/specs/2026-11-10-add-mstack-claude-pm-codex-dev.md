# Add mstack-claude-pm-codex-dev, a workflow where Claude manages and reviews and Codex writes the code

Status: Approved 2026-11-10 (approved in chat by the user)
Size: full    Mode: gated    Type: feature
Source: conversation 2026-11-10. The user asked for a workflow like `mstack-codex-review-workflow` in which Codex develops the phases through the Codex plugin's rescue command, Claude and the advisor review Codex's code and file changes, Codex can also review as the original workflow does, and the run first asks the Codex developer model and effort, then the Codex reviewer model and effort.

## Problem

In `mstack-codex-review-workflow` every line of code is written by Claude subagents and Codex only reviews (its SKILL.md, read 2026-11-10). A user who wants Codex to do the writing while Claude plans, briefs, reviews and delivers has no mstack workflow for it: the Codex-led sibling runs inside Codex and makes Codex the coordinator too. Driving Codex by hand from Claude Code loses what the workflows guarantee, such as a status table, review of every diff before it is committed, and one pull request with CI run one at a time.

## Goals

1. A user in Claude Code can hand over a plan, a list of issues or one task and get one integration branch in which Codex wrote the code and every phase was reviewed by Claude before it was committed.
2. The user chooses the Codex developer's model and effort once, and the final report shows which model and effort wrote each phase.
3. No phase is accepted on the developer's word: Claude read its diff and ran its validation itself.
4. A plan written by `mstack-plan` can name this workflow as its executor and resume from the same progress file.

## Non-goals

- Parallel Codex developers. The developer cannot commit and review is the bottleneck, so this version runs one developer at a time. A background developer started in an isolated worktree was stranded when the host removed the worktree as the subagent returned (probe of 2026-11-10), so worktree lanes do not work with this channel as it is.
- Claude writing a phase's code when Codex fails. A silent takeover would break what the skill promises; the run stops and asks instead.
- A Codex version of this workflow. It drives Claude Code's subagent tool and the Codex plugin for Claude Code.
- Installing the Codex plugin or any skill itself. `mstack-setup` does that after the user's yes.
- New third-party sources. The workflow reuses the reference files of the two existing workflows unchanged, so their notices stay identical.
- Calling the Codex plugin's own review commands. A model cannot invoke them (their definitions disable model invocation, read 2026-11-10).

Anti-goals, which count as failure even when everything runs:

- A phase committed with a diff Claude did not read, or with validation Claude did not run.
- Text from an issue or a plan executed by a shell on its way to Codex.
- A Codex review of Codex-written code reported as an independent, cross-vendor review.
- Code written by Claude presented as the developer's work.
- A run that waits forever on a developer job that has already failed.

## Users and scenarios

1. As a Claude Code user with a Codex subscription, I want Codex to write the code of each phase while Claude manages and reviews, so that Claude's attention goes to judgment and Codex's to implementation.
2. As a user executing an `mstack-plan` folder, I want to pick this workflow as the executor, so that the plan's phases, criteria and progress file drive the run.
3. As a reviewer of the result, I want to see which reviews were same-vendor and which model wrote what, so that I know how much to trust each phase.
4. As a user whose phase failed twice, I want to be asked what to do, so that the workflow does not quietly change who writes the code.
5. As a user without the Codex plugin, I want the run to stop at once with the install steps, so that I do not answer questions for a run that cannot start.

## Requirements

Terms used below. The **workflow** is the new skill. The **coordinator** is Claude, the session that runs the workflow. The **developer** is a Codex run that writes code, started through the Codex plugin's rescue subagent. A **phase** is the unit of work one developer run receives: one phase of a plan, or one work item when there is no plan. The **developer thread** is the Codex conversation that wrote a phase. The **brief** is the file that tells the developer what to do. The **Codex review** is a read-only Codex run that reviews a diff. The **phase base** is the commit the phase started from. A **round** is one developer run of a phase whose result was reviewed: the first run is round one and a fix run is round two. A **retry** repeats a run that failed before it produced a result to review; a retry is not a round.

### R1. Host guard  [Should]
IF the workflow is loaded in a host other than Claude Code, THEN the workflow SHALL stop, say that it runs in Claude Code only, and name the Codex-led workflow.
#### Scenario: loaded in Codex
- GIVEN a Codex session
- WHEN the workflow is loaded
- THEN it names `mstack-claude-review-workflow` and stops, and it does NOT ask a question or start a run

### R2. Preflight  [Must]
IF a dependency is missing (the two shared skills `mstack-find-skills` and `mstack-best-model-for`, the Codex plugin's rescue subagent, a logged-in Codex command-line tool, `ponytail` or `mstack-diagnose` on the Codex side, or, when the work needs them, a logged-in GitHub command-line tool or the web UI skill on the Codex side), THEN the workflow SHALL stop before any developer run, name each missing item, and name `mstack-setup`.
#### Scenario: Codex plugin missing
- GIVEN a Claude Code session whose agent list has no Codex rescue subagent
- WHEN the workflow starts
- THEN it prints what is missing and how to install it, names `mstack-setup`, and does NOT ask the start questions
#### Scenario: a skill missing on the Codex side
- GIVEN the Codex plugin is installed and `ponytail` is not among the skills Codex loads
- WHEN the preflight runs
- THEN the workflow stops and names `ponytail` and `mstack-setup`, and no developer run starts
#### Scenario: an item the work does not need
- GIVEN work items that touch no web UI and a repository that is not on GitHub
- WHEN the preflight runs without the web UI skill and without the GitHub tool
- THEN the run is NOT stopped for them
#### Scenario: installed after the session started
- GIVEN a required skill is on disk but not in the session's skill list
- WHEN the workflow starts
- THEN it says that a new session is needed and stops

### R3. The start questions  [Must]
WHEN a run starts, the workflow SHALL ask in one message, in this order, the developer model, the developer effort, the reviewer model and the reviewer effort, skipping each one the request already answers.
#### Scenario: nothing answered
- GIVEN a request that names no model and no effort
- WHEN the run starts
- THEN one message asks the four questions in that order, after the check of R2's session-visible items (the shared skills and the rescue subagent) and before intake
#### Scenario: the request names the developer model
- GIVEN a request that names the developer model
- WHEN the run starts
- THEN the developer-model question is NOT asked and the other three are

### R4. The developer's options  [Must]
WHEN it asks for the developer model and effort, the workflow SHALL offer the standard tier's Codex model as the recommended answer and the most capable tier's as the alternative, both taken from `mstack-best-model-for` at run time, SHALL accept another model name the user types, and SHALL offer the efforts low, medium, high and xhigh with medium recommended.
#### Scenario: an effort the channel rejects
- GIVEN the user answers the developer effort with `max`
- WHEN the workflow reads the answer
- THEN it says the developer channel accepts efforts up to xhigh and asks again, and it does NOT start a run with `max`
#### Scenario: no model name in the skill
- GIVEN the finished skill folder
- WHEN its files are searched for the developer question's options
- THEN no developer model name is written in them

### R5. Inputs and phases  [Must]
The workflow SHALL accept tracker issues, a plan or one task as its work items, SHALL give the developer one plan phase per run with that phase's tasks in the plan's order, and SHALL give it one work item per run when there is no plan.
#### Scenario: a plan with two phases
- GIVEN a plan folder with two phases of two tasks each
- WHEN the run executes
- THEN exactly two first-round developer runs start, one per phase, and NOT one per task, and the status table still has four rows
#### Scenario: an untriaged backlog
- GIVEN many open issues and no triage table
- WHEN intake runs and `mstack-backlog-triage` is installed
- THEN the workflow recommends triage first and asks once

### R6. A clean start  [Must]
IF the working tree has uncommitted changes at intake, THEN the workflow SHALL stop and ask the user what to do with them before the first developer run.
#### Scenario: uncommitted work
- GIVEN a repository with a modified, uncommitted file
- WHEN intake runs
- THEN the workflow lists the uncommitted paths and asks, and it does NOT start a developer run, stash or discard anything

### R7. One developer at a time  [Must]
WHILE a developer run or the review of its phase is in progress, the workflow SHALL start no other developer run.
#### Scenario: two independent phases
- GIVEN two phases whose files do not overlap
- WHEN the first is in review
- THEN the second has not started

### R8. The brief is a file  [Must]
The workflow SHALL write each brief as a file outside the repository with its file tool, and SHALL pass to the rescue subagent only a fixed sentence that names the file and the developer's model, effort and thread choice.
#### Scenario: hostile text in a criterion
- GIVEN an issue whose acceptance text contains a command substitution
- WHEN the brief is written and the developer run starts
- THEN the text reaches the developer unchanged inside the brief file, and the substitution is NOT executed by any shell
#### Scenario: the brief was read
- GIVEN a developer run that finished
- WHEN the coordinator reads its report
- THEN the report names the phase ID from the brief, and a report without it is treated as a failed run

### R9. What the brief contains  [Must]
The workflow SHALL put in every brief the user's goal, the phase's item IDs and full acceptance criteria, the files to read first, the files the developer is allowed and forbidden to change, the command and expected result that prove the phase done, the validation to run, the skills to load, an instruction not to commit, push or open a pull request, and the report format.
#### Scenario: a plan task
- GIVEN a phase from a plan folder
- WHEN its brief is written
- THEN the brief holds each task's whole block, the phase's goal and ownership lines and the plan's global constraints
#### Scenario: a bug phase
- GIVEN a phase whose item is a bug
- WHEN its brief is written
- THEN the brief tells the developer to load `mstack-diagnose` and to report its evidence
#### Scenario: no nameable evidence
- GIVEN a phase for which the coordinator cannot name a proving command
- WHEN the brief would be written
- THEN the phase is not sent to the developer until it is scoped

### R10. Starting and waiting  [Must]
WHEN a phase is ready, the workflow SHALL start the developer through the Codex plugin's rescue subagent as a write-capable background job with the chosen model and effort, and SHALL wait for that job until it reports completed or failed, however long it runs.
#### Scenario: a long phase
- GIVEN a developer job that runs longer than one shell call may last
- WHEN the coordinator waits
- THEN it waits again until the job reports completed, and it does NOT report the phase as finished or failed while the job is still running
#### Scenario: the chosen model and effort
- GIVEN the user chose a developer model and effort
- WHEN the first developer run of a phase starts
- THEN the run uses that model and that effort
#### Scenario: a cheap-tier phase
- GIVEN a phase whose tasks all carry the cheap tier (from the plan's tier lines, or from the coordinator's own classification when there is no plan)
- WHEN its first developer run starts
- THEN the run uses one effort level lower than the chosen one, never below low, and a phase with any task above the cheap tier does NOT get the lower effort

### R11. A failed or empty developer run  [Must]
IF a developer run fails, returns nothing or returns a report without the phase ID, THEN the workflow SHALL NOT treat the phase as done and SHALL retry that run by cause at most twice, at the same effort, before stopping the phase.
#### Scenario: rejected model
- GIVEN Codex rejects the developer model
- WHEN the run fails
- THEN the workflow reruns with the other of the two tier models (the standard tier's model when the user chose the most capable one or typed a name), uses it for the rest of the run, and says so in the final report
#### Scenario: the second model is rejected too
- GIVEN Codex rejects the fallback model as well
- WHEN the run fails
- THEN the workflow stops and asks the user for a model, and does NOT try a third model on its own
#### Scenario: a retry is not a round
- GIVEN a first run that failed on a dropped connection and succeeded when retried
- WHEN its result is reviewed and sent back with findings
- THEN the fix run is round two, and the retry did NOT raise the effort
#### Scenario: empty output
- GIVEN the rescue subagent returns no text
- WHEN the coordinator reads the result
- THEN it reads the job's status before deciding, and it does NOT write the phase's code itself

### R12. Three reviews per phase  [Must]
WHEN a developer run reports a phase finished, the workflow SHALL review the phase's diff against the phase base three ways before accepting it: the coordinator's own read with the validation commands rerun by the coordinator, the advisor's review, and a read-only Codex review with the reviewer model and effort, and SHALL label that Codex review as a same-vendor review in the status table, the phase's record and the final report.
#### Scenario: the developer says green
- GIVEN a report that says all tests pass
- WHEN the coordinator reviews the phase
- THEN the coordinator's own run of the validation commands is in the phase's record, and the report's claim alone does NOT close the phase
#### Scenario: a new file
- GIVEN a phase in which the developer created a file that Git does not track yet
- WHEN the coordinator reviews the phase
- THEN the new file's content is part of what the coordinator and the Codex review read, and the phase is NOT accepted on the tracked changes alone
#### Scenario: no advisor in the session
- GIVEN a session without the advisor tool
- WHEN a phase is reviewed
- THEN the workflow says so and continues with its own read and the Codex review
#### Scenario: the Codex review cannot run
- GIVEN a Codex review run that fails in a way an agent cannot fix
- WHEN the phase is reviewed
- THEN a fresh read-only Claude subagent reviews instead, and the record calls it a fallback review by Claude and NOT a same-vendor review, because same-vendor means the vendor that wrote the code
#### Scenario: an edit outside the phase
- GIVEN a diff that changes a file the brief forbade
- WHEN the coordinator reads it
- THEN the change is sent back as a finding, and the phase is NOT accepted with it

### R13. Processing findings  [Must]
WHEN a review returns findings, the workflow SHALL verify each one against the code before acting on it, reject the ones the code contradicts with a reason, and log every finding with what happened to it.
#### Scenario: an unreproduced finding
- GIVEN a Codex review finding that the coordinator cannot reproduce
- WHEN findings are triaged
- THEN the finding is rejected with the reason and listed in the final report, and it is NOT sent to the developer

### R14. Fix rounds  [Must]
WHEN a phase has accepted findings, the workflow SHALL send them to the same developer thread, SHALL run a phase's second round one effort level higher than its first, never above xhigh, and SHALL review the fix itself with the validation rerun, repeating the Codex review only when the fix touches a file or a function the findings did not name.
#### Scenario: second round
- GIVEN a phase whose first run used medium and whose review found a real defect
- WHEN the fix round starts
- THEN it resumes the same developer thread at high, the coordinator reads the fix and reruns the validation, and the phase's record says which reviews ran in that round
#### Scenario: only the fix
- GIVEN round one's reviewed state of the working tree and a finished round two, with no commit between them
- WHEN the coordinator reviews round two
- THEN it can show what round two changed since the state it reviewed, and does NOT have to re-read the whole phase to find the fix
#### Scenario: the wrong thread
- GIVEN a fix round whose job reports a thread other than the phase's recorded developer thread
- WHEN the coordinator reads the result
- THEN the round is treated as a failed run and its changes are reviewed as unrequested edits, and the result is NOT accepted as the fix
#### Scenario: no patching
- GIVEN a real finding in a phase's code
- WHEN the coordinator handles it
- THEN the fix comes from the developer, and the coordinator does NOT edit the phase's files

### R15. Two failed rounds  [Must]
IF two rounds of a phase end without accepted evidence, THEN the workflow SHALL stop that phase, keep its items out of the Closed state, and ask the user how to continue.
#### Scenario: still failing
- GIVEN a phase whose second round still fails its acceptance check
- WHEN the round is reviewed
- THEN the workflow shows what failed and offers to retry with the other model, to re-scope the phase, or to stop the run, and it does NOT start a third round or write the code itself

### R16. Who writes and who commits  [Must]
The workflow SHALL commit each accepted phase to the integration branch itself, SHALL NOT commit a phase that is not accepted, and SHALL NOT edit a phase's owned files, limiting its own edits to the shared files it reserved (a plan's status file, changelog lines, docs indexes) and to merge conflicts.
#### Scenario: accepted phase
- GIVEN a phase that passed its reviews
- WHEN it is accepted
- THEN one commit on the integration branch holds its changes, made by the coordinator
#### Scenario: commits restricted by the repository
- GIVEN a repository whose rules allow commits only on request
- WHEN intake runs
- THEN the workflow asks the user once to approve the phase commits, the integration branch and the pull request, and follows the answer
#### Scenario: rejected phase
- GIVEN a phase with open findings
- WHEN the next action is chosen
- THEN no commit holds that phase's changes
#### Scenario: some tasks of a phase pass
- GIVEN a phase of three tasks in which two meet their criteria and one does not
- WHEN the phase is reviewed
- THEN all three stay In progress, the finding goes back to the developer, and the phase is committed as a whole only once every task is accepted
#### Scenario: a stopped phase
- GIVEN a phase stopped after two failed rounds
- WHEN the user is asked how to continue
- THEN the question names the uncommitted changes the phase left in the working tree, and the workflow does NOT commit, stash or discard them on its own

### R17. The status table  [Should]
WHEN a work item changes state, the workflow SHALL print the whole status table with the three states Open, In progress and Closed.
#### Scenario: nothing changed
- GIVEN a message in which no item changed state
- WHEN it is sent
- THEN the table is NOT printed

### R18. Running a plan folder  [Must]
WHEN the work items are an `mstack-plan` folder, the workflow SHALL follow the shared plan format: run its resume and staleness checks, record itself as the executor, skip Closed tasks whose work is on the integration branch, and update the progress file with evidence each time an item changes state.
#### Scenario: resume
- GIVEN a plan folder whose progress file shows one phase Closed and one Open
- WHEN the workflow starts on it
- THEN it starts no developer run for the Closed phase and continues on the recorded integration branch
#### Scenario: a plan written before this change
- GIVEN a plan folder written by an earlier `mstack-plan`
- WHEN the user starts the workflow on it by name
- THEN the plan runs, and the workflow writes its own name into the executor line

### R19. Offered by the plan skill  [Must]
WHEN it writes a plan's execution file, `mstack-plan` SHALL offer this workflow as a way to run the plan in Claude Code, beside inline execution and the existing workflow, and the shared plan format SHALL list this workflow among the executor values.
#### Scenario: Claude Code
- GIVEN a plan written in Claude Code after this change
- WHEN the user opens its execution file
- THEN it offers three ways to run
#### Scenario: an old value is not consent
- GIVEN a plan whose execution file records an earlier choice of the existing workflow
- WHEN the plan is resumed
- THEN it runs with the recorded executor, and this workflow is NOT started unless the user asks

### R20. Integration review and delivery  [Must]
WHEN every item is Closed or reported as not completable here, the workflow SHALL run the repository's full checks on the integration branch, review the whole diff with the advisor and a Codex review, run the sensitive-data gate, and deliver one pull request with one CI run in flight at a time.
#### Scenario: no remote for pull requests
- GIVEN a repository without a remote that takes pull requests
- WHEN the run finishes
- THEN it stops at the validated integration branch and reports its name, and does NOT push
#### Scenario: CI in progress
- GIVEN a CI run for the pull request is in progress
- WHEN a fix is ready
- THEN the workflow does NOT push until that run has finished

### R21. The final report  [Must]
WHEN a run ends, the workflow SHALL report the goal and outcome, the final status table, per phase the developer model, effort, number of rounds and every switch with its reason, which reviews were same-vendor, the findings it did not apply with reasons, and the validation commands with results.
#### Scenario: a run that stops early
- GIVEN a run that stops with work left
- WHEN it ends
- THEN it writes a handoff with `mstack-handoff` when that is installed and puts its path in the report, or puts the same content in the report

### R22. Shared reference files  [Must]
The repository's marketplace check SHALL fail when a reference file or the notices file of this workflow differs from the copy in the two existing workflows.
#### Scenario: drift
- GIVEN one changed sentence in this workflow's copy of a shared reference file
- WHEN the marketplace check runs
- THEN it fails and names the file

### R23. Offered by the setup skill  [Should]
WHEN it reports dependencies in Claude Code, `mstack-setup` SHALL report whether the Codex plugin is installed and SHALL offer to install it as an optional item.
#### Scenario: not installed
- GIVEN a Claude Code machine without the Codex plugin
- WHEN `mstack-setup` runs
- THEN its report lists the plugin as missing and optional, and installs it only after the user's yes

### R24. Packaging  [Must]
The mstack repository SHALL ship the workflow as a plugin for Claude Code only that passes the repository's checks.
#### Scenario: registries
- GIVEN the finished plugin
- WHEN the marketplace check and the version-bump check run
- THEN both pass, the plugin is in the Claude Code registry and NOT in the Codex registry, and the skills CLI still finds the skill folder with its own license copy and notices

## Constraints and assumptions

- Host: Claude Code. The developer channel is the rescue subagent of the OpenAI Codex plugin for Claude Code, verified with plugin version 1.0.6 on 2026-11-10.
- Verified on 2026-11-10 through the rescue subagent itself: the model and effort flags reach Codex (read from the Codex session record); a foreground run of 2 minutes 57 seconds returned its text; a write-capable background run answered at once with one line that holds the job ID, its job record was write-capable, it read a brief file outside the repository, and its report carried the brief's phase ID; a background run with the resume flag and a higher effort continued the same thread at that effort.
- Verified on 2026-11-10 by calling the plugin's script directly, in a scratch repository: a write-capable run edits files and runs tests but `git add` fails with `.git/index.lock: Read-only file system`; the status command waits for a job and the result command returns the final message, the thread ID and the touched files.
- A file the developer creates is untracked, and a plain diff against the phase base does not show it (seen in the probes), so the review reads untracked files too.
- Verified on 2026-11-10 in the plugin's hooks and by a run: the plugin's session-start hook exports its data folder to the session's shell, which is how the coordinator's shell finds the jobs the subagent started; its session-end hook stops the session's running jobs and removes their records, so a developer job never outlives its session. An isolated session with the plugin loaded by path ran the whole cycle (start, wait, result) in a scratch repository.
- Not verified: a developer run longer than 10 minutes.
- The channel accepts the efforts none, minimal, low, medium, high and xhigh (the plugin's own error text), and the mstack model table says the current Codex models reject none and minimal, so the developer question offers low to xhigh. The effort `max` exists only on the reviewer's path.
- Developer threads are kept per Git root (the plugin's code, read 2026-11-10).
- A single shell call in Claude Code lasts at most 10 minutes, and the plugin's status wait defaults to 240 seconds, so waiting on a long job takes repeated waits.
- The plugin's status and result commands cannot be invoked by a model, so the coordinator calls the plugin's own script through the plugin's install record. This interface is not documented by the plugin.
- Reviewer defaults stay as in the existing workflow: `gpt-6.1-sol` at `high`, the sandbox always read-only.
- Repository rules: model names appear only in `mstack-best-model-for`'s table and in reviewer questions and defaults; the two workflows' SKILL.md files keep the same section numbers because the shared reference files point at them, and this workflow keeps them too; a new plugin starts at 0.1.0 and the marketplace version rises by a minor number.
- The Codex review runs as in the existing workflow, through the `codex` skill when it is installed. When that skill is missing the review still runs with the same read-only command, because this workflow already requires a logged-in Codex command-line tool (agent's call: falling back to a Claude review for a missing helper skill would drop a review the machine can run).
- A dirty working tree stops the run (agent's call: the developer writes in the main working tree, so earlier uncommitted changes would mix into the phase's diff).
- After two failed rounds the offered choices are the other model, a new scope, or stopping (agent's call: the user decided only that the run stops and asks, and that Claude does not write the code).
- A developer run is retried by cause at most twice, and a retry is not a round and does not raise the effort (agent's call: the existing workflow's retry rule; the independent reader asked how the two counts relate).
- A phase is accepted and committed as a whole: its tasks stay In progress until all are accepted, and a stopped phase leaves its changes uncommitted for the user to decide on (agent's call: the user decided that Claude commits each accepted phase; the reader asked about partial completion).
- The fallback for a rejected developer model is the other of the two tier models, and a second rejection stops and asks (agent's call: the reader asked what the alternative is when the user chose the most capable model or typed a name).
- A phase gets the lower cheap-tier effort only when all its tasks are cheap, because a phase takes the highest tier among its tasks, as a lane does in the existing workflow (agent's call, same reader).
- In a fix round the coordinator's read and validation rerun always happen, and the Codex review repeats only when the fix reaches beyond what the findings named, as in the existing workflow (agent's call, same reader).
- Between two rounds of a phase there is no commit, so the coordinator records the state it reviewed in round one and compares round two against it; how it records that state is left to the plan (agent's call: the advisor's review of this spec asked how a fix is told apart from round one).
- The label same-vendor is defined by the writer: a review is same-vendor when the reviewer's vendor wrote the code. The shared review rules gain one sentence that says so, which leaves the two existing workflows' meaning unchanged and makes this workflow's Codex review the same-vendor one (agent's call: without it the shared rules would call this workflow's Claude fallback same-vendor).
- After each resumed run the coordinator compares the job's thread ID with the phase's recorded one, because the channel resumes the latest thread of the Git root and another session may have used the checkout (agent's call, from the advisor's review).
- Start order: the session-visible dependencies, then the start questions, then the rest of the preflight, then intake, which holds the dirty-tree check and the commit approval (agent's call: the order of the existing workflow).

## Decisions

D1. The workflow is a sibling of the two existing workflows: its own SKILL.md with the same section numbers, and identical copies of their reference files and notices, enforced by the marketplace check. Alternatives considered: its own trimmed reference files, which drift into three rule sets; a third mode inside the existing workflow, which the user ruled out by choosing a separate plugin and which would give every user of that workflow the Codex-plugin requirement. Decided by: user. Source: approaches message.
D2. The developer is started through the rescue subagent as a background job, and the coordinator waits with the plugin's status command and reads the result command. Alternatives considered: a foreground call, verified only to three minutes and limited by the 10-minute shell ceiling; calling the plugin's script for everything, which is not the channel the user asked for. Decided by: user. Source: approaches message; the path was then run end to end through the subagent (interview record).
D3. The brief travels as a file and the subagent receives a fixed sentence. Alternatives considered: passing the brief as prompt text, which sends issue text through a shell command the forwarding subagent builds. Decided by: user. Source: approaches message.
D4. One developer at a time on one integration branch. Alternatives considered: parallel developers in worktrees, untested with the rescue channel. Decided by: user. Source: round 1, question 12.
D5. The Codex review runs on every phase and on the final diff and is labelled same-vendor; Claude and the advisor are the cross-vendor check. Alternatives considered: a Codex review of the final diff only. Decided by: user. Source: round 1, question 13.
D6. Findings return to the same developer thread, the second round runs one effort level higher, and two failed rounds stop the phase and ask the user; Claude never writes a phase's code. Alternatives considered: a Claude takeover after two rounds. Decided by: user. Source: round 1, question 14.
D7. One developer model and effort per run, a cheap-tier phase one level lower, with the question's options read from `mstack-best-model-for` at run time. Alternatives considered: one model per plan tier; model names written into the skill, which the repository's rules forbid. Decided by: user. Source: round 1, question 15.
D8. The Codex plugin is a hard requirement, and `mstack-setup` gains an optional item for it. Alternatives considered: a fallback to a plain Codex command-line run, which is a different channel with different behavior. Decided by: user. Source: round 1, question 16.
D9. The workflow becomes an executor value in the shared plan format and a choice in the plan's execution file. Alternatives considered: no change to the plan skill, which leaves a plan's progress file without a valid value for this executor. Decided by: user. Source: round 1, question 17.
D10. `ponytail` and `mstack-diagnose` are required on the Codex side. Alternatives considered: recommending them only, which lets the promised code style and diagnosis method silently not apply. Decided by: user. Source: round 2, question 7.
D11. The coordinator reruns each phase's validation itself, and a rejected developer model or effort switches to the alternative without asking. Alternatives considered: trusting the developer's report; asking the user on every rejection. Decided by: user. Source: round 2, proposals.
D12. Delivery is unchanged from the existing workflow: the coordinator commits each accepted phase after one approval at intake, one pull request, serialized CI. Decided by: user. Source: round 1, question 18.
D13. No rule is adapted from the public Codex-orchestration skills found in the search. Alternatives considered: adapting their worker contract and status line, which would add sources to a notices file that must stay identical in three plugins, for rules the shared reference files already state. Decided by: agent's call. Source: the vetting evidence (one candidate removed, one unlicensed, one with a warning audit).

## Risks

- The plugin's status and result script is undocumented and may change -> the preflight checks that the script answers, the skill states the verified plugin version, and a failed status call tells the user to check the job with the plugin's own status command.
- The forwarding subagent may reword the prompt before it reaches Codex -> the brief is a file, so rewording cannot lose content, and a report without the phase ID counts as a failed run.
- A same-vendor Codex review misses what the developer missed -> the coordinator's own read and the advisor review are mandatory, and the label is shown wherever the review is reported.
- A developer run longer than 10 minutes was never observed -> the wait is a loop of bounded waits on the job's status, each piece of which was verified, and the end-to-end test's report states the longest run it saw.
- Another session starts a Codex task in the same checkout, and a resume lands on its thread -> the thread ID is checked after every resumed run (R14).
- A session that ends stops its running developer job and drops that session's job records (the plugin's session-end hook) -> the phase stays In progress with its uncommitted changes in the working tree, the handoff names the phase and its base, and the next session reviews what is there and starts a fresh developer run.
- The end-to-end test needs a real Codex run and a session with the Codex plugin loaded -> the plan decides how to run it in isolation; the report names any case that could not run.
- Detecting skills on the Codex side from Claude Code can be wrong when a custom Codex home is set -> the preflight honors the Codex home setting, as the existing checker does.

## Verification

- R1: read against the skill's first paragraph in review.
- R2: a stop case with the Codex plugin absent, graded on the printed message and on no start question; unit tests of the preflight checker for each missing item and for the new-session case.
- R3, R4: the first message of a run on a sample plan, graded on the four questions, their order and the absence of a developer model name in the skill folder (a search); the `max` answer checked in review.
- R5, R7, R8, R9, R10, R12, R16, R17, R18: an end-to-end run of a two-phase plan on a sample repository with a real Codex developer, graded on two first-round developer runs, the brief files, the phase records with the coordinator's own validation output, the same-vendor labels, one coordinator commit per phase, and the progress file.
- R6: a case with a dirty working tree, graded on no developer run and no stash.
- R8 (hostile text): a brief built from an item containing a command substitution, checked for a marker file that must not exist.
- R11, R13, R14, R15: a case whose first diff fails review, graded on the resumed thread, the higher effort, the finding log and no coordinator edit of phase files; the two-round stop checked in review and by a forced second failure where practical.
- R19: `mstack-plan`'s existing cases rerun, with the execution file checked for the third choice, and the plan checker run on a plan naming the new executor.
- R20, R21: the end-to-end run's final report, with delivery stopped at the local integration branch.
- R22, R24: the repository's marketplace check (including a deliberate one-line drift seen failing), the version-bump check, the skill creator's static check and private-data scan.
- R23: `mstack-setup`'s status script tests for the new row.
- Input classes no scenario covers: a target that is not a Git repository (the workflow stops and asks, as the existing workflow does); a phase with no code change (accepted on its evidence, with an empty commit never made); the user stopping a run while a developer job is active (the job ID is reported so it can be read or cancelled in the same session; ending the session stops the job); a developer effort already at xhigh in the first round (the second round stays at xhigh).

## Appendix: interview record

- 2026-11-10 Q: should the workflow be a plugin in this repository, for Claude Code only? / Recommended: yes / Decision: yes (recorded in the previous session's handoff).
- 2026-11-10 Evidence: the Codex plugin's rescue command, subagent and runtime skill, version 1.0.6 / Decision: a skill reaches the developer by calling the rescue subagent with routing flags at the start of the prompt; no question needed.
- 2026-11-10 Evidence: live probes in a scratch repository (flags, write run, commit failure, background job, status wait, result, resume, a 2 minute 57 second foreground run, a brief file outside the repository) / Decision: the constraints above; the coordinator commits.
- 2026-11-10 Evidence: three more runs through the rescue subagent after the advisor's review (a background write run with a brief file, the same in an isolated worktree, a background resume at a higher effort) / Decision: the launch path of D2 works as specified; worktree isolation strands the job; the thread and the effort of a resume were confirmed.
- 2026-11-10 Evidence: the advisor's review of this draft / Decision: untracked files, the round-two comparison, the writer-relative label, the thread check and the conditional preflight items were added.
- 2026-11-10 Evidence: the plugin's session hooks and a pilot in an isolated session, during planning / Decision: a job ends with its session, so the risk line on a job outliving the session was corrected; the status went back to Draft for that edit.
- 2026-11-10 Evidence: the plugin's status and result command definitions / Decision: a model cannot invoke them, so the coordinator calls the plugin's script.
- 2026-11-10 Evidence: the plan skill's plan checker / Decision: it rejects an executor value outside its list, so the new value has to be added there for a plan run by this workflow to pass (R19 is a Must).
- 2026-11-10 Evidence: skills.sh results for Codex orchestration skills / Decision: none adapted (D13).
- 2026-11-10 Q (round 1, 11): the same three inputs, one plan phase or one item per developer run? / Recommended: yes / Decision: yes.
- 2026-11-10 Q (round 1, 12): one developer at a time, no parallel lanes? / Recommended: yes / Decision: yes.
- 2026-11-10 Q (round 1, 13): Codex review on every phase and the final diff, labelled same-vendor? / Recommended: yes / Decision: yes.
- 2026-11-10 Q (round 1, 14): fixes on the same thread, second round one effort higher, stop and ask after two failed rounds, Claude never writes the code? / Recommended: yes / Decision: yes.
- 2026-11-10 Q (round 1, 15): one developer model and effort per run, options from the shared model skill at run time? / Recommended: yes / Decision: yes.
- 2026-11-10 Q (round 1, 16): the Codex plugin required, with an optional item in the setup skill? / Recommended: yes / Decision: yes.
- 2026-11-10 Q (round 1, 17): a fourth executor value and a choice in the plan's execution file? / Recommended: yes / Decision: yes.
- 2026-11-10 Q (round 1, 18): delivery as in the existing workflow? / Recommended: yes / Decision: yes.
- 2026-11-10 Q (round 1, 19): the three test tasks? / Recommended: yes / Decision: yes.
- 2026-11-10 Proposal (round 2): the coordinator reruns validation itself; a rejected developer model or effort switches without asking / Decision: accepted.
- 2026-11-10 Q (round 2, 7): `ponytail` and `mstack-diagnose` required on the Codex side? / Recommended: yes / Decision: yes.
- 2026-11-10 Q (approaches): a sibling with shared reference files, driven by a background job and the plugin's status command? / Recommended: yes / Decision: yes; the shared understanding was confirmed in the same answer.
