# Add three shared skills and codegraph support

Status: Approved 2026-11-10 (approved in chat by the user, by asking to execute the plan)
Size: full    Mode: gated    Type: feature (with a refactor of the existing skills)
Source: conversation 2026-11-10. Add `mstack-find-skills`, `mstack-setup` and `mstack-best-model-for`, make the other skills use them, and add codegraph indexing to the skills that read code.

## Problem

The eight mstack skills each carry their own copy of three jobs. Skill search lives in full in `mstack-plan` and in shorter copies in both review workflows and `mstack-skill-creator`. Install tables and the route, scope, method and agents questions appear in four skills, next to three near-identical requirement-check scripts. Model choice is two tier tables in the workflows plus a hard-coded "cheap and standard subagent" pair in four other skills. A change to any of the three jobs has to be made in up to six places, and the copies already differ (evidence: `rg -n 'skills find|model: "haiku"|plugin marketplace add' plugins/`, read 2026-11-10). The skills also read code with plain search even when a code index is installed on the machine.

## Goals

1. A change to how skills are found, how dependencies are installed, or which model fits a task is made in one skill, and every other skill follows it without an edit.
2. A user with a fresh machine gets every dependency the mstack skills need, at user scope, from one skill and one confirmation.
3. A user can ask which model and effort fit a task, for Claude or Codex, and get an answer with the way to set it.
4. The skills that read code use a current codegraph index when codegraph is installed, and work exactly as before when it is not.

## Non-goals

- Support for OpenCode and Cursor in the three new skills. The other mstack skills support Claude Code and Codex, and `mstack-skill-creator` keeps its built-in steps on the other two hosts.
- Installing anything without the user's yes. Installing runs third-party code.
- Choosing a model by measuring the user's own tasks. The table gives starting points from the vendors' guidance.
- A search of skills.sh through its documented API. That API needs a token a local agent does not have.
- Indexing lane worktrees with codegraph. Each worktree would build its own index for a short-lived lane.
- Anti-goal: a caller that silently falls back to its old built-in logic when a new skill is missing. The user chose a hard requirement, so a silent fallback would hide a broken install.
- Anti-goal: text copied from a source without a license. The model table is written from the facts in the vendors' guides, with links, not from their wording.

## Users and scenarios

1. As a developer planning work with `mstack-plan`, I want every task to name the installed skills that fit it, so that the executor loads the right ones.
2. As a developer on a new machine, I want one skill to install what the mstack skills need, so that no workflow stops at its preflight.
3. As a developer starting a subagent or a review, I want the model and effort that fit the task, so that I do not pay for the most expensive model on a log search.
4. As a developer looking for a skill for a job, I want installed matches first and vetted public candidates second, so that I do not install something unsafe or redundant.
5. As a maintainer of this repository, I want each of the three jobs in one skill, so that a correction does not need a sweep of eight plugins.

Callers of the refactored parts: `mstack-plan`, `mstack-codex-review-workflow`, `mstack-claude-review-workflow`, `mstack-diagnose`, `mstack-write-specs`, `mstack-backlog-triage` and `mstack-skill-creator`. `mstack-handoff` changes nothing.

## Requirements

### Finding skills

### R1. Input of mstack-find-skills  [Must]
WHEN the user invokes it without a task text, `mstack-find-skills` SHALL ask what the user needs to do and wait, and WHEN a task text is given it SHALL use that text without asking for one.
#### Scenario: invoked with a text
- GIVEN the user invokes the skill with "add Playwright tests to a React app"
- WHEN the skill starts
- THEN it reports matches for that text and does not ask what the user needs
#### Scenario: invoked with nothing
- GIVEN the user invokes the skill with no text
- WHEN the skill starts
- THEN it asks one question about the job and searches nothing until the answer arrives

### R2. Called mode of mstack-find-skills  [Must]
WHEN another skill calls it with one or more work items, `mstack-find-skills` SHALL return one result block per item, in the order given, without asking the user anything and without installing anything.
#### Scenario: a plan with three tasks
- GIVEN `mstack-plan` passes three tasks with their goals and files
- WHEN the skill runs
- THEN it returns three blocks, each with the matched installed skills, a reason per skill, and the gaps with their candidates
#### Scenario: a call that would need a question
- GIVEN a called run finds a public candidate for a gap
- WHEN the skill finishes
- THEN the candidate and its install commands are in the result block, and no install ran and no question was asked

### R3. Installed skills first  [Must]
`mstack-find-skills` SHALL list the skills installed for the current host (the session's list, the project folders, the user folders and the plugin cache) before any online search, and SHALL mark each one that the session has not loaded as loading in a new session.
#### Scenario: a skill installed mid-session
- GIVEN a skill folder exists at user level and is not in the session's skill list
- WHEN the inventory runs
- THEN the skill appears with the note that it loads in a new session

### R4. Matching rule  [Must]
`mstack-find-skills` SHALL score each installed skill against each work item by shared stack, domain and verb, keep at most four skills per item, prefer an mstack or agent-bridges skill over another skill for the same job, and return an empty list when nothing reaches the threshold.
#### Scenario: wrong framework on a shared word
- GIVEN a task about Vue component tests and an installed skill for React testing
- WHEN the task is scored
- THEN the React skill is not listed for the task
#### Scenario: nothing fits
- GIVEN a task with no matching installed skill
- WHEN the task is scored
- THEN its list is empty, and no skill is added to fill it

### R5. Online search for gaps only  [Must]
WHEN a work item has a clear domain and no installed skill reaching the threshold, `mstack-find-skills` SHALL search the skills.sh directory for that item, and SHALL make no online request for an item that has a match or needs no specialist.
#### Scenario: a gap
- GIVEN a task on a protocol with no installed skill
- WHEN matching ends
- THEN the skill runs the directory search for that task and reports what it searched
#### Scenario: no network
- GIVEN the search command fails for lack of network
- WHEN the skill reports
- THEN it returns the installed matches and states that the online search did not run, and does not claim that no public skill exists

### R6. Search without the skills CLI  [Should]
IF `npx` is not available, THEN `mstack-find-skills` SHALL read the skills.sh pages for the search and SHALL NOT call a skills.sh endpoint that the site's `robots.txt` disallows.
#### Scenario: no npx
- GIVEN a machine without `npx`
- WHEN a gap is searched
- THEN the skill reads skills.sh pages, and makes no request to the site's `/api/search` path

### R7. Vetting a public candidate  [Must]
`mstack-find-skills` SHALL recommend a public candidate only after reading its skills.sh audit verdicts with their categories from the skill's public pages, its install count and first-seen date, its repository's license, and its SKILL.md, and SHALL report at most two candidates per gap with those values.
#### Scenario: a failed audit
- GIVEN a candidate with a `fail` verdict from one audit vendor
- WHEN candidates are reported
- THEN the candidate is not recommended, and the verdict is shown if it is listed at all
#### Scenario: no audit yet
- GIVEN a candidate whose skill page has no audit verdicts
- WHEN candidates are reported
- THEN it is labelled "not audited", never "passed"
#### Scenario: no license
- GIVEN a candidate whose repository has no license
- WHEN candidates are reported
- THEN it is not recommended

### R8. Installing a candidate  [Must]
WHEN the user invokes `mstack-find-skills` and accepts a candidate, it SHALL ask the route, and for the skills CLI the scope, the method and the agents, in one round, and SHALL run the install only after those answers.
#### Scenario: accepted
- GIVEN the user says to install one candidate with the skills CLI, globally, as a symlink, for this host
- WHEN the install runs
- THEN the command carries those four choices, and the report says the skill loads in a new session
#### Scenario: declined
- GIVEN the user declines every candidate
- WHEN the skill ends
- THEN no install command ran, and the gap is reported as open

### Setup

### R9. Status report of mstack-setup  [Must]
WHEN it starts, `mstack-setup` SHALL report every dependency in the table under Constraints for the host it runs in, each as installed, missing, installed but loading in a new session, or not logged in, and SHALL offer the other host only when that host's command-line tool is on PATH.
#### Scenario: a complete machine
- GIVEN every dependency is installed and logged in
- WHEN the skill runs
- THEN every row reads installed, and the skill proposes no command
#### Scenario: Codex not present
- GIVEN the skill runs in Claude Code and `codex` is not on PATH
- WHEN it reports
- THEN the Codex command-line tool is listed as missing, and the Codex host's own dependencies are not offered

### R10. One confirmation  [Must]
`mstack-setup` SHALL show the full list of commands it would run, grouped as mandatory and optional, and SHALL run none of them before the user's yes to that list.
#### Scenario: the user removes an item
- GIVEN the list has six commands and the user accepts all but one
- WHEN the installs run
- THEN five commands run and the sixth is reported as skipped by the user
#### Scenario: no answer
- GIVEN the list is shown
- WHEN the user has not answered
- THEN no command has run

### R11. User scope  [Must]
`mstack-setup` SHALL install each dependency for every project of the user, by the host's plugin command where the dependency has a plugin for that host and by the skills CLI with its global option otherwise, and SHALL NOT write into the current repository.
#### Scenario: a plugin exists
- GIVEN `ponytail` is missing in Claude Code
- WHEN the user accepts
- THEN it is installed with the plugin commands at user scope
#### Scenario: run inside a repository
- GIVEN the skill runs in a Git repository
- WHEN all installs finish
- THEN `git status` shows no file added or changed by the installs

### R12. codegraph in mstack-setup  [Must]
WHEN codegraph is missing and the user accepts it, `mstack-setup` SHALL install the codegraph command-line tool and then connect it to the host it runs in, and SHALL tell the user which agent configuration files that connection writes before the yes.
#### Scenario: tool present, not connected
- GIVEN `codegraph` is on PATH and the host's configuration has no codegraph entry
- WHEN the skill reports
- THEN only the connect command is proposed

### R13. Failures and the final check  [Must]
IF an install command fails, THEN `mstack-setup` SHALL continue with the remaining commands, and after the last one SHALL run the status check again and report each dependency's new state, the failed commands with their last output lines, and every step left to the user.
#### Scenario: one install fails
- GIVEN the second of four commands exits with an error
- WHEN the run ends
- THEN commands three and four ran, the report shows the second as failed with its output, and the skill does not say the setup is complete
#### Scenario: manual steps
- GIVEN a dependency needs a login or a trust step only the user can do
- WHEN the run ends
- THEN the report names that step and its command

### R14. No dependency on the other new skills  [Must]
`mstack-setup` SHALL run with none of the other mstack skills installed.
#### Scenario: first skill on a machine
- GIVEN only `mstack-setup` is installed
- WHEN it runs
- THEN it completes its report and offers the other mstack skills as installs

### R27. Platforms of mstack-setup  [Must]
`mstack-setup` SHALL produce its status report and its command list on Linux, macOS and Windows, with the install command of each dependency chosen for the platform it runs on.
#### Scenario: Windows
- GIVEN the skill runs on Windows with codegraph missing
- WHEN the command list is shown
- THEN the codegraph command is one that runs on Windows, and no command in the list needs a POSIX shell
#### Scenario: an unknown platform
- GIVEN the skill runs on a platform other than the three
- WHEN it starts
- THEN it reports the status it can read, proposes no install command, and says the platform is not covered

### Model choice

### R15. Answer of mstack-best-model-for  [Must]
WHEN it is given a task description and a vendor (Claude, Codex, or both), `mstack-best-model-for` SHALL return for each vendor a model, an effort level, the way to set both in that vendor's tool, a one-line reason, the next step to take if the result falls short, and the date its table was last verified.
#### Scenario: a log search for Claude
- GIVEN the task "a subagent that reads CI logs and summarizes failures" and the vendor Claude
- WHEN the skill answers
- THEN the model is the smallest tier's model with its effort and the subagent setting, not the session's model
#### Scenario: an unclear task
- GIVEN a task that fits no row of the table
- WHEN the skill answers
- THEN it returns the vendor's general starting point and says that it is the default
#### Scenario: no task given by the user
- GIVEN the user invokes the skill with no task
- WHEN the skill starts
- THEN it asks what the task is and for which vendor, and waits

### R16. Called mode and caps  [Must]
WHEN another skill calls it with a task or a tier and that caller's limits (models never to use, a highest effort), `mstack-best-model-for` SHALL answer without asking the user and SHALL return the best choice inside those limits, marked as capped when the table's own choice was outside them.
#### Scenario: a workflow lane
- GIVEN a workflow passes "most capable" for Claude with the limits "never fable, effort at most medium"
- WHEN the skill answers
- THEN the model is not `fable`, the effort is not above `medium`, and the answer says whether it was capped
#### Scenario: limits that exclude everything
- GIVEN limits that leave no model for the vendor
- WHEN the skill answers
- THEN it says no model fits the limits and names the limits, and returns no model

### R17. Tiers  [Must]
`mstack-best-model-for` SHALL map the three tier names cheap, standard and most capable to a model and effort for each vendor, and those tier names SHALL stay as plans written before this change use them.
#### Scenario: an old plan
- GIVEN a plan written before this change with a task line "Tier: standard"
- WHEN a workflow executes it
- THEN the task runs on the standard row's model without any edit to the plan

### The existing skills

### R18. Delegation  [Must]
Each existing skill SHALL obtain skill matches from `mstack-find-skills` and model and effort choices from `mstack-best-model-for` wherever it needs them, and SHALL carry no scoring rule, public-search step, install table or model table of its own in Claude Code and Codex.
#### Scenario: the plan's skill phase
- GIVEN `mstack-plan` reaches its skill-matching phase
- WHEN it names skills per task
- THEN the names come from `mstack-find-skills` in called mode, in one call for the whole outline
#### Scenario: a repository search
- GIVEN the repository after this change
- WHEN a maintainer searches the existing skills for the scoring rule, an install table or a model name table
- THEN the only hits are in the three new skills, and the workflows' own limits and reviewer questions

### R19. A missing new skill  [Must]
IF a skill it requires among the three is not installed, THEN an existing skill SHALL stop before any other work and print the install commands for that skill by plugin and by skills CLI, and the name `mstack-setup`.
#### Scenario: best-model-for missing
- GIVEN `mstack-diagnose` starts and `mstack-best-model-for` is not installed
- WHEN its first step runs
- THEN it prints the two install routes and stops, and starts no subagent
#### Scenario: installed mid-session
- GIVEN the required skill's folder exists and the session has not loaded it
- WHEN the caller checks
- THEN it says a new session is needed, and does not continue with built-in logic

### R20. Workflow limits and reviewer defaults  [Must]
Each review workflow SHALL keep its own limits when it asks for a model (no `fable` for a Claude lane, no lane effort above `medium` except the one replanned most capable lane at `high`), and SHALL keep its current recommended reviewer model and effort while offering the model table's review values as the alternative.
#### Scenario: the reviewer question in Claude Code
- GIVEN the Codex-review workflow asks which model and effort Codex reviews with
- WHEN the options are shown
- THEN the recommended answer is the one recommended before this change, and the table's review values are offered next

### R21. The lane check follows the table  [Should]
WHEN a review workflow checks its lane table, the workflow SHALL take the models allowed per tier from the answers `mstack-best-model-for` gave in that run, and SHALL name no lane model of its own.
#### Scenario: the table changes
- GIVEN the standard model for Codex changes in `mstack-best-model-for`
- WHEN a workflow next runs with no edit to the workflow
- THEN its lanes of the standard tier use the new model, and the lane check passes
#### Scenario: a lane off its tier
- GIVEN a lane table gives a cheap-tier lane the most capable model with no reason
- WHEN the lane check runs
- THEN it fails and names the lane

### R22. mstack-skill-creator on four hosts  [Must]
WHILE it runs in Claude Code or Codex, `mstack-skill-creator` SHALL use `mstack-find-skills` for its existing-skill check and public search, and WHILE it runs in OpenCode or Cursor it SHALL use its built-in steps and require none of the three new skills.
#### Scenario: Cursor
- GIVEN the skill creator runs in Cursor with none of the new skills installed
- WHEN it reaches the existing-skill check
- THEN it runs its built-in check and does not stop

### codegraph

### R23. Refreshing the index  [Must]
WHEN one of the six code-reading skills (`mstack-plan`, `mstack-write-specs`, `mstack-diagnose`, `mstack-backlog-triage` and both review workflows) starts work in a repository and `codegraph` is on PATH, the skill SHALL bring the repository's index up to date before it reads code, building it when the repository has none, and SHALL then use the index to locate code before falling back to text search.
#### Scenario: an indexed repository
- GIVEN the repository has an index
- WHEN the skill starts
- THEN it updates the index and does not rebuild it
#### Scenario: no index yet
- GIVEN the repository has no index
- WHEN the skill starts
- THEN it builds one without prompting the user
#### Scenario: a build that takes time
- GIVEN the index build or update is running
- WHEN the user looks at the session
- THEN a message says the index is being built or updated, and the skill reads no code until the command has ended
#### Scenario: a workflow with lanes
- GIVEN a review workflow runs in Workflow mode
- WHEN lanes start in their worktrees
- THEN the coordinator refreshed the main checkout's index once at intake, and no lane builds an index

### R24. codegraph absent or failing  [Must]
IF `codegraph` is not on PATH or its command fails, THEN the code-reading skill SHALL continue with its previous way of reading code, state that in one line of its report, and SHALL NOT install codegraph.
#### Scenario: not installed
- GIVEN `codegraph` is not on PATH
- WHEN the skill starts
- THEN it reads code as before, and its report names `mstack-setup` as the way to add codegraph
#### Scenario: the index command fails
- GIVEN the update command exits with an error
- WHEN the skill continues
- THEN the work is not stopped, and the error's last line is in the report

### R25. The index folder in Git  [Should]
WHEN the index folder shows as untracked in `git status`, the code-reading skill SHALL offer once to hide it through the repository's local exclude list, and SHALL change no tracked file for it.
#### Scenario: accepted
- GIVEN the user accepts the offer
- WHEN `git status` runs again
- THEN the index folder is not listed, and `git diff` shows no change
#### Scenario: in a called or lane context
- GIVEN the skill runs where it cannot ask the user
- WHEN the folder is untracked
- THEN it adds nothing to any exclude list and notes the folder in its report

### Packaging

### R26. Three plugins  [Must]
The repository SHALL ship each of the three new skills as its own plugin for Claude Code and Codex and for the skills CLI, each with a comparison test with and without the skill, and the repository's checks SHALL pass.
#### Scenario: install by skills CLI
- GIVEN a user installs only `mstack-best-model-for` with the skills CLI
- WHEN the skill runs
- THEN it finds every file it uses inside its own folder
#### Scenario: a setup test
- GIVEN the comparison test for `mstack-setup` runs
- WHEN it finishes
- THEN nothing was installed or configured in the real user folders of the machine running it

## Constraints and assumptions

- Hosts for the three new skills: Claude Code and Codex. Decided in the interview.
- Tool versions the facts below were read from, on 2026-11-10: skills CLI 1.7.6, Claude Code 2.1.322, Codex CLI 0.167.0, codegraph 1.6.2. Source: `reports/Skills directory and installer facts.md` and commands run in this session.
- codegraph: `codegraph init` on an initialized project exits 0 and prints "Already initialized" (run in a scratch repository). `codegraph status -j` exits 0 with `"initialized": false` when there is no index, so the field decides, not the exit code. `codegraph init -y` skips every prompt. The connect command is `codegraph install --yes --target=<host>`, and it writes the host's MCP configuration, a marked section in the host's user instructions file and, for Claude Code, tool permissions.
- The index folder `.codegraph/` holds its own ignore file and still shows as one untracked folder (run in a scratch repository). In a worktree `.git` is a file, so the local exclude path comes from `git rev-parse --git-path info/exclude`.
- skills.sh: the documented `/api/v1` search needs a bearer token; `/api/search` works without one and is disallowed by `robots.txt`; `robots.txt` disallows all of `/api/`, including the audit lookup `/api/v1/skills/audit/<owner>/<repo>/<skill>`, so the skill reads audits from the skill page's Security Audits part and the vendor pages `/<owner>/<repo>/<skill>/security/<vendor>` (verdict, risk level, categories), which `robots.txt` allows; a page for an unknown skill still answers 200 (read 2026-11-10). A `pass` verdict can still list a risk category. `npx skills find` has no JSON output.
- Dependencies `mstack-setup` covers, with the tiers decided in the interview:

  | Tier | Dependency | Claude Code | Codex |
  |---|---|---|---|
  | Mandatory | `node`, `git` | reported only; the skill does not install them (agent's call: system packages differ per machine) | same |
  | Mandatory | codegraph | command-line tool, then connect | command-line tool, then connect |
  | Mandatory | `ponytail` | plugin | plugin, then a hook trust step by the user |
  | Mandatory | the cross-vendor reviewer | skill-codex plugin and the `codex` tool, logged in | agent-bridges `claude` plugin (plugin route only) and the `claude` tool, logged in |
  | Mandatory | the three new skills | plugin | plugin |
  | Optional | `ui-ux-pro-max` | plugin | its own installer, global |
  | Optional | `gh`, Python 3 | reported only | reported only |
  | Optional | the other mstack skills | plugin | plugin |

- The exact install and detection commands per dependency and host are in `reports/Skills directory and installer facts.md` (read 2026-11-10); the plan re-runs each one before it enters a skill.
- Who requires what (round 1, Q2):

  | Existing skill | Requires `mstack-find-skills` | Requires `mstack-best-model-for` |
  |---|---|---|
  | `mstack-plan` | yes | yes |
  | both review workflows | yes | yes |
  | `mstack-skill-creator` (in Claude Code and Codex) | yes | yes |
  | `mstack-diagnose`, `mstack-write-specs`, `mstack-backlog-triage` | no | yes |
  | `mstack-handoff` | no | no |

- How a call works (agent's call: it is how skills name each other today). The caller loads the other skill the way its host loads any skill, says which skill is calling, and gives the input. The called skill then asks nothing and ends with its result block. A lane never calls a skill: the coordinator makes the calls before it starts lanes and puts the answers in the briefs. `mstack-skill-creator` picks its branch (R22) from the host it identified at its start.
- Result blocks (agent's call). `mstack-find-skills`: per work item, its ID, then the matched skills (name, where installed, loads now or in a new session, a reason), then the gaps (what is missing, up to two candidates with source, installs, first seen, audit verdicts, license and install commands), then whether the online search ran. `mstack-best-model-for`: per vendor, the tier or task, model, effort, how to set it, reason, capped yes or no, and the table's date; or "no model fits" with the limits.
- Each caller's own requirement check treats a missing new skill as a hard failure (R19) and keeps its other checks. Its install table and install questions are removed; for any other missing dependency it names `mstack-setup` (agent's call: one place for installs, D10).
- A workflow's own rules on tiers stay in the workflow: the highest tier in a lane, cheap helpers, moving up one tier after a failed round, and the one `high` exception, which the workflow passes as its limit. The "next step" in a model answer informs a user; it does not replace those rules (agent's call).
- The plan format does not change. A plan's Skills lines keep their shape; only where the names come from changes.
- Lanes do not build an index, so a lane worktree never holds the index folder and the workflows' checks of a worktree's status are unaffected.
- The model table's starting content, from the supplied guides (verified 2026-11-09):

  | Tier or task | Claude | Codex |
  |---|---|---|
  | cheap tier: docs, mechanical edits, log reading, searches | `haiku`, or `sonnet` when the edit needs judgment; low to medium | `gpt-6-luna`; low to medium |
  | standard tier: contained, well-specified code | `sonnet`; medium | `gpt-6.1-sol`; medium |
  | most capable tier: root causes, concurrency, cross-package design | `opus`; medium | `gpt-6-astra`; medium |
  | general starting point, or unsure | `opus`; medium | `gpt-6.1-sol`; medium |
  | well-scoped coding, repeated review or drafting | `sonnet`; medium, then high | `gpt-6.1-sol`; medium |
  | quick, fully specified edits | `haiku` or `sonnet`; low to medium | `gpt-6-luna` or `gpt-6.1-terra`; low |
  | debugging | `opus`; medium, then high | `gpt-6.1-sol`; high |
  | code review | `sonnet`; medium | `gpt-6.1-sol`; xhigh |
  | classification, routing, extraction | `haiku`; medium | `gpt-6-luna`; low |
  | major refactors, migrations, architecture, deep research, long unattended runs | `fable`; medium, then high | `gpt-6-astra`; low to medium, then higher |
  | computer use and vision-heavy work | `opus`; medium | `gpt-6.1-terra`; client default |

  The three tier rows are the workflows' current rows, unchanged. The skill also carries the guides' rules for a result that falls short (give the model a way to verify, raise effort one level, then move up a model at lower effort) and the levels each model rejects.
- A login is never done by the skill; it is reported as a step for the user (agent's call: logins are interactive).
- The model table is the repository's own wording of facts from the two vendor guides the user supplied (Anthropic's guide of 2026-11-09 and the OpenAI sources verified on 2026-11-09), with links and the verification date. The supplied files name private machines; none of that is carried over.
- The repository is public, so no private name, host or path enters any file.
- Existing installs: after this change an updated skill stops until the new skills it requires are installed (R19). Accepted in the interview.
- Assumption (agent's call: nothing in the repository tracks it otherwise): a plan folder written before this change needs no migration, because the plan format and its tier names do not change.

## Decisions

D1. Three plugins, one skill each. Alternatives considered: one plugin holding the three skills, which breaks the rule that plugin and skill names are equal; identical reference copies in every caller, ruled out by D3. Decided by: user. Source: approaches round.
D2. One spec and one plan for the three skills, the refactor and codegraph. Alternatives considered: one spec per skill, which splits contracts the callers share. Decided by: user. Source: interview Q2.
D3. The new skills are hard requirements of their callers. Alternatives considered: a built-in fallback in each caller; shared identical copies. Decided by: user. Source: interview Q3.
D4. `mstack-best-model-for` owns the task-to-model table for both vendors, and the workflows keep their limits as overriding rules. Alternatives considered: limits that follow the guides, which would allow `fable` lanes and efforts above `medium`. Decided by: user. Source: interview Q4.
D5. The index is refreshed by reading the status, then updating or building. Alternatives considered: build and update on failure, which never updates because the build command exits 0 on an indexed project. Decided by: user. Source: interview Q5 and the scratch test.
D6. `mstack-setup` installs the codegraph tool and connects it to the host after one yes. Alternatives considered: the tool only. Decided by: user. Source: interview Q6.
D7. The index folder is hidden through the local exclude list, on offer. Alternatives considered: the repository's ignore file, which changes a tracked file; leaving it. Decided by: user. Source: interview Q7.
D8. Each new skill has a user mode that asks and a called mode that never asks and returns a fixed block. Alternatives considered: one interactive mode, which a plan phase with many tasks and a lane without a user cannot use. Decided by: user. Source: round 1, Q1.
D9. Each caller requires only the new skills it delegates to, and `mstack-setup` is required by none. Decided by: user. Source: round 1, Q2.
D10. Each caller keeps a check of its own hard requirements; install tables and install questions exist only in `mstack-setup` and, for a found candidate, in `mstack-find-skills`. Alternatives considered: one shared check script, which a skill cannot reach in another skill's folder. Decided by: user. Source: round 1, Q8.
D11. Reviewer defaults stay, with the table's review values as the alternative. Alternatives considered: the guides' review values as defaults. Decided by: user. Source: round 1, Q6.
D14. The workflows take lane models from `mstack-best-model-for` at run time and keep no lane model names. Alternatives considered: model names kept in each workflow's lane check with a repository check comparing them to the table, which keeps a second copy. Decided by: agent's call. Source: goal 1 and the independent read.
D12. The model table is written in the repository's own words with links and a date. Alternatives considered: shipping the supplied guide files, which embed an article without a license. Decided by: agent's call. Source: the repository's rule on unlicensed sources.
D15. Audits are read from the public skill and vendor pages, never from `/api/`. Alternatives considered: the audit lookup under `/api/`, which `robots.txt` disallows (R6). Decided by: user, 2026-11-10, after execution showed the conflict.
D13. Tier names stay cheap, standard and most capable. Decided by: agent's call. Source: the plan format is shared by three plugins, and old plans carry these names.

## Risks

- Model names age quickly. -> The table carries its verification date, every answer shows it, and a rejected model moves to the next row as the workflows already do.
- The skill pages may change their layout. -> Audits that cannot be read are reported as "not audited", and the candidate's SKILL.md is still read.
- A caller cannot verify that the session loaded a new skill from a file check alone. -> R19's second scenario: a folder that exists without a loaded skill means a new session.
- The index folder changes what `git status` shows, which the handoff fingerprint and the workflows' unchanged-status checks read. -> The exclude offer of R25, and the plan sweeps every check that reads `git status`.
- A setup test could change the machine that runs it. -> R26's second scenario: tests run against throwaway user folders with installs stubbed.
- Existing users are stopped after an update. -> The stop message carries the commands, and the README's install sections say so.

## Verification

- R1 to R8: comparison tests with fixture skill folders (named so they do not install as skills) and a stubbed directory search; the negative scenarios check that no install command and no disallowed request appears in the transcript.
- R9 to R14, R27: the status check, with the platform passed in so all three are tested from one machine; no run on real macOS or Windows is planned. The status check as a script with unit tests over throwaway user folders; a comparison test with stubbed install commands that records what would run.
- R15 to R17: a comparison test over a fixed list of tasks and limits, with the expected model and effort per vendor.
- R18, R19, R22: a repository search for the removed sections; one run per caller with the required skill absent, expecting the stop message.
- R20, R21: the lane check's tests, a repository search showing no lane model name in either workflow, and one workflow run whose lane table is checked against the answers of that run.
- R23 to R25: runs in a scratch repository with codegraph present, absent, and failing, reading `git status` and `git diff` after each.
- R26: `check-marketplace.mjs`, `check-version-bumps.mjs`, the skill creator's static check and private-data scan, and a cross-vendor review.
- Input classes no scenario covers: a task text in a language other than English (matched on its meaning, same rules); a repository that is not a Git repository (codegraph steps still run, the exclude offer does not apply); a host where both Claude Code and Codex tools exist (each host's setup is a separate offer).

## Open questions

- What do `claude auth status` and `codex login status` print when logged out? Owner: engineering. Can wait because: the status check treats any non-success as "not logged in", which is the safe reading.

## Appendix: interview record

- 2026-11-10 Q: Which branch? / Recommended: a new branch / Decision: pending work merged to main first (PR #5), new branch `shared-skills` from main.
- 2026-11-10 Q: One spec or several? / Recommended: one / Decision: one spec and one plan.
- 2026-11-10 Q: What when a new skill is not installed? / Recommended: built-in fallback / Decision: hard requirement, the caller stops.
- 2026-11-10 Q: Who owns model policy? / Recommended: the new skill owns the table, workflows keep limits / Decision: as recommended.
- 2026-11-10 Q: codegraph rule? / Recommended: status, then update or build, never stop the skill / Decision: as recommended.
- 2026-11-10 Q: codegraph in setup? / Recommended: tool and connect after one yes / Decision: as recommended.
- 2026-11-10 Q: Untracked index folder? / Recommended: offer the local exclude list / Decision: as recommended.
- 2026-11-10 Q: Which skills get codegraph? / Recommended: plan, write-specs, diagnose, backlog-triage, both workflows / Decision: as recommended.
- 2026-11-10 Q: Setup tiers? / Recommended: the table under Constraints / Decision: agreed, with the three new skills mandatory.
- 2026-11-10 Q: Hosts? / Recommended: Claude Code and Codex / Decision: as recommended.
- 2026-11-10 Q: Find-skills scoring and installs? / Recommended: keep the plan's scoring, install only after a yes / Decision: agreed.
- 2026-11-10 Q: Research scope? / Recommended: skills.sh and install commands / Decision: agreed.
- 2026-11-10 Q: Two modes per new skill? / Recommended: yes / Decision: yes.
- 2026-11-10 Q: Who requires what? / Recommended: only what each delegates / Decision: yes.
- 2026-11-10 Q: Stop message with commands and `mstack-setup`? / Recommended: yes / Decision: yes.
- 2026-11-10 Q: Skill creator on OpenCode and Cursor? / Recommended: built-in steps there / Decision: yes.
- 2026-11-10 Q: What "check skills.sh" means? / Recommended: search, audits, page values, SKILL.md and license; pages without npx; no disallowed endpoint / Decision: yes.
- 2026-11-10 Q: Reviewer defaults? / Recommended: keep, guide values as alternative / Decision: yes.
- 2026-11-10 Q: Setup per run? / Recommended: this host, other host when its tool exists, one list, one yes / Decision: yes.
- 2026-11-10 Q: The requirement-check scripts? / Recommended: each caller keeps its own, installs move to setup / Decision: yes.
- 2026-11-10 Q: codegraph in workflows? / Recommended: coordinator once at intake, lanes do not index / Decision: yes.
- 2026-11-10 Q: Approach? / Recommended: A, three plugins / Decision: A.
- 2026-11-10 Evidence: `codegraph init` twice in a scratch repository / Decision: the rule reads status instead of waiting for a failure.
- 2026-11-10 Evidence: `codegraph init -y` and `codegraph sync` in a second scratch repository, process count before and after / Decision: neither leaves a background process, so no environment setting is needed.
- 2026-11-10 Q: What does the skill do while the index builds? / Decision: it says so and waits for the command to end.
- 2026-11-10 Q: Which platforms does setup cover? / Decision: Linux, macOS and Windows (added during planning as R27; the numbering of R1 to R26 is unchanged).
- 2026-11-10 Evidence: the handoff fingerprint hashes untracked files that are not ignored; the index folder contributes one fixed file / Decision: no change to `mstack-handoff`.
- 2026-11-10 Evidence: `reports/Skills directory and installer facts.md` / Decision: no token-free supported search API; audits and pages are the trust signals.
- 2026-11-10 Evidence: `mstack-plan/references/skill-matching.md` / Decision: its inventory, scoring and vetting rules are the base of `mstack-find-skills`.
