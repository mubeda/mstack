# Add mstack-chief-of-staff, a skill for owning a long-running goal

Status: Approved 2026-11-12 (approved in chat by the user; edited that day: copyright names moved to the notices file only)
Size: full    Mode: gated    Type: feature
Source: https://github.com/mubeda/mstack/issues/9, and conversation 2026-11-11. Adapts the `chief-of-staff` skill of https://github.com/mattpocock/skills (MIT). Research: `reports/Long running goal agent skills.md` (local, not committed).

## Problem

No mstack skill covers an agent that owns a long-running goal (a release, a backlog, a multi-step project) across many sessions. Issue #9 reports that agents in that role lose decisions at context resets, repeat the same environment problems, and lean on skills outside mstack for procedures mstack already covers. The host documentation read on 2026-11-11 confirms the first cost: Claude Code loses conversation-only instructions at compaction, and Codex does not document what survives.

## Goals

1. A new session picks a goal back up from files alone: it can say what the goal is, what counts as done, and what was last decided, without the earlier conversation.
2. A reader of the wiki can tell when each claim was true, and for a claim about code, at which commit.
3. Each finished task leaves the environment better for the next one when the task exposed a real problem, and never worse.
4. Every procedure the skill needs beyond its own role is run by an mstack skill, named in one table.
5. The skill is short: its `SKILL.md` stays at or under 130 lines, and works unchanged in Claude Code and Codex.

## Non-goals

- A retro procedure (reviewing a share of subagent sessions). The issue leaves it out and mstack has no skill to route it to.
- OpenCode and Cursor support. The issue names Claude Code and Codex.
- A separate wiki skill other mstack skills call. Nobody else needs it yet, and the issue asks for one skill.
- Replacing `mstack-handoff`. The handoff file holds one session's uncommitted state; the wiki holds durable history. The skill points at `mstack-handoff` and restates none of its rules.
- Creating schedules, committing, pushing or posting to a tracker on its own.
- Moving or converting a wiki that already exists.

Anti-goals, which count as failure even if everything else works:

- A wiki page that describes how the code is "now" with no date or commit beside it.
- The goal owner doing large work in its own session instead of delegating or routing it.
- Any file of the skill naming a skill outside mstack as something to run.
- Private data or secrets written into a wiki inside a public repository.

## Users and scenarios

1. As a developer who handed an agent a release that takes weeks, I want each new session to continue from the recorded decisions, so that I do not repeat them after every context reset.
2. As an agent resuming such a goal, I want one page that says what I own and one index that says where everything is, so that I read before I decide.
3. As a second agent or teammate on the same repository, I want the wiki to be dated history in a shared place, so that I can trust or discount each claim by its date and commit.
4. As a developer, I want repeated agent mistakes turned into checks in the repository, so that the next task does not hit them again.

## Requirements

"The skill" is `mstack-chief-of-staff` as loaded by an agent, called the goal owner. "The wiki" is a folder of linked Markdown pages with an index and a goal page. "A claim" is one dated entry on a wiki page. "A brief" is the message that hands work to a subagent. "A route" is one row of the skill's table of mstack skills.

### R1. Loads on a fitting request  [Must]
The skill's description SHALL start with "Use when" and name the situations of owning a long-running goal across sessions (owning a release, a backlog or a multi-step project; acting as chief of staff; picking an owned goal back up), and SHALL NOT summarize the skill's steps.
#### Scenario: a fitting request
- GIVEN a session with the skill installed
- WHEN the user asks the agent to own a release until it ships
- THEN the skill loads without the user typing its name
#### Scenario: a one-session task
- GIVEN the same session
- WHEN the user asks for a single bug fix
- THEN the description gives no reason to load the skill, and its text says a task that fits one session needs no goal owner

### R2. Start from the files  [Must]
WHEN the skill starts in a session, or continues after the context was compacted, the skill SHALL read the goal page and the index, and then check what changed in the repository since the date of the newest claim, before it decides or delegates anything.
#### Scenario: a resume
- GIVEN a wiki whose goal page records the goal, the done criteria and a decision dated last week
- WHEN a new session is asked to continue the goal
- THEN its first actions read the goal page and the index, and its first reply states the goal, the done criteria and the newest decision with its date
#### Scenario: a contradicting request
- GIVEN the same wiki, with a recorded decision the user made
- WHEN the new request contradicts that decision
- THEN the skill names the recorded decision and its date and asks which holds, and does not silently follow either

### R3. Find or agree the wiki  [Must]
WHEN no wiki location is known, the skill SHALL look for an existing shared wiki first (a pointer in the repository's agent instructions, then a wiki folder that has an index), SHALL follow that wiki's own conventions where they differ from the skill's, and IF none exists, THEN the skill SHALL ask the user once for the location, recommending a folder inside the repository, before the first write.
#### Scenario: no wiki yet
- GIVEN a repository with no wiki and no pointer to one
- WHEN the skill has its first durable fact to record
- THEN it asks where the wiki goes, recommends a folder in the repository, and writes nothing until the user answers
#### Scenario: a public repository
- GIVEN the same repository, and it is public or its visibility cannot be read
- WHEN the skill recommends the in-repository folder
- THEN the question says that the wiki becomes public once committed, and offers a location outside the repository as the other option

### R4. Make the wiki findable  [Should]
WHEN a new wiki location inside the repository is agreed, the skill SHALL offer to add one line that points at the wiki, by its path relative to the repository root, to the repository's agent instructions, and SHALL add it only after the user's yes. IF the agreed location is outside the repository, THEN the skill SHALL write no pointer into any file of the repository, and SHALL tell the user the location to keep in their own instructions.
#### Scenario: the user declines
- GIVEN a newly agreed wiki location
- WHEN the user says no to the pointer line
- THEN the repository's agent instructions are unchanged
#### Scenario: a wiki outside the repository
- GIVEN a wiki agreed at a folder outside the repository
- WHEN the location is settled
- THEN no file in the repository gains a line with that folder's path

### R5. The goal page  [Must]
The skill SHALL keep one goal page in the wiki that states the goal, what counts as done as checkable criteria, and the status as claims, and SHALL create it, with the user confirming the goal and the done criteria, before any other page.
#### Scenario: a first session
- GIVEN an agreed wiki location and no goal page
- WHEN the user hands over a goal
- THEN the skill plays back the goal and proposed done criteria, and writes the goal page after the user confirms them

### R6. Done needs evidence  [Must]
The skill SHALL mark the goal or a work item done only with evidence recorded beside it (a command and its result, a commit, or a link), and SHALL treat a subagent's statement that work is finished as a claim to check, not as evidence.
#### Scenario: an unproven finish
- GIVEN a subagent reports a work item finished and names no test run
- WHEN the skill records the result
- THEN the item is recorded as reported, not done, until a check the skill ran or can cite passes

### R7. Claims are dated history  [Must]
The skill SHALL write every claim with the date it was true, SHALL cite the repository and commit beside every claim about code, and SHALL NOT use "currently", "now" or an undated present tense about code.
#### Scenario: a code claim
- GIVEN the skill learns that a module validates its input in one function
- WHEN it ingests that fact
- THEN the claim carries the date and `<repository>@<commit>`
#### Scenario: a tempting shortcut
- GIVEN the same fact
- WHEN the skill writes the page
- THEN no sentence says how the code is "currently" without a date and commit beside it

### R8. Superseded, never rewritten  [Must]
WHEN a new fact overtakes a claim, the skill SHALL add a new dated claim and mark the old one superseded with a pointer to the new one, and SHALL NOT edit or delete the old claim's text.
#### Scenario: a changed decision
- GIVEN a claim that a release ships behind a feature flag
- WHEN the user decides to ship it without the flag
- THEN the page holds both claims, the old one marked superseded with the new claim's date, and the old text unchanged

### R9. Ingest reaches every page  [Must]
WHEN the skill learns something durable (a decision, a user correction, a subagent's finding, a recurring problem), the skill SHALL update every page the fact touches and the index, SHALL cite sources instead of copying them, and SHALL then report which wiki files are uncommitted.
#### Scenario: a fact that touches two pages
- GIVEN a decision that concerns both a subsystem page and the goal page
- WHEN the skill ingests it
- THEN both pages gain the claim, the index lists every page, and the reply names the uncommitted wiki files
#### Scenario: a secret in a source
- GIVEN a subagent report that contains an access token
- WHEN the skill ingests the report's finding
- THEN the wiki names the secret without its value, and no token appears in any page

### R10. Query before deciding  [Must]
WHEN the skill is about to make a decision that the goal depends on, the skill SHALL read the index and the pages it points to for that subject first.
#### Scenario: a decision with history
- GIVEN an index that lists a page on the release branch policy
- WHEN the skill is about to choose a branch strategy
- THEN it reads that page before choosing, and its reply cites the page's claim with its date

### R11. Lint finds, the user decides  [Must]
WHEN the skill lints the wiki, the skill SHALL report contradictions, orphan pages, broken links, pages missing from the index, undated claims and claims that newer sources overtook, and SHALL NOT delete a claim or settle a contradiction without the user's yes.
#### Scenario: a contradiction
- GIVEN two pages whose claims disagree and neither is marked superseded
- WHEN the skill lints
- THEN it reports both claims with their dates and asks which holds, and changes neither

### R12. The mechanical lint  [Must]
The lint script SHALL, given a wiki folder, report each orphan page, broken link, page missing from the index, claim without a date, and present-tense word about the present ("currently", "now", "at the moment", "at present") outside a superseded claim, with its file and line, and SHALL exit non-zero when it reports anything.
#### Scenario: a clean wiki
- GIVEN a wiki that follows the skill's page format
- WHEN the script runs
- THEN it prints a passing result line and exits zero
#### Scenario: not a wiki
- GIVEN a folder with no index
- WHEN the script runs
- THEN it says the folder has no index, exits non-zero, and reports nothing else

### R13. Schedules are suggested  [Must]
The skill SHALL suggest a recurring lint, naming the kind of scheduling each host offers, and SHALL create a schedule only after the user's explicit yes.
#### Scenario: a suggestion
- GIVEN a wiki that has grown over several sessions
- WHEN the skill suggests a weekly lint
- THEN no schedule exists until the user says yes

### R14. Delegate substantial work  [Must]
WHEN work needs reading several files or writing code, the skill SHALL hand it to a subagent with a fresh context, and SHALL keep small lookups in its own session.
#### Scenario: no subagent tool
- GIVEN a host session without a way to start subagents
- WHEN substantial work comes up
- THEN the skill does the work itself and says that it did

### R15. Briefs point, they do not copy  [Must]
The skill SHALL write each brief to stand on its own with the objective, the done criteria, the constraints and the decisions that bind the work stated in the brief, SHALL pass everything long as a pointer (a wiki page, a note, a commit, a file) with one line on what it answers, and SHALL ask the subagent to return pointers and a short summary.
#### Scenario: a long spec
- GIVEN work that depends on a long specification file
- WHEN the skill briefs a subagent
- THEN the brief names the file's path and what to read it for, and does not paste its content

### R16. Models come from mstack-best-model-for  [Must]
WHEN the skill starts a subagent, the skill SHALL take the model and effort from `mstack-best-model-for`, and no file of the skill SHALL contain a model name.
#### Scenario: the finished skill
- GIVEN the skill folder
- WHEN it is searched for the model names in `mstack-best-model-for`'s table
- THEN there is no match

### R17. Procedures are routed  [Must]
The skill SHALL run each of these through the named mstack skill instead of doing it inline: an unformed idea (`mstack-brainstorm`), large work (`mstack-write-specs`, then `mstack-plan`), executing a plan (the mstack workflow for the host and the chosen writer), a backlog (`mstack-backlog-triage`), something broken (`mstack-diagnose`), review feedback (`mstack-receive-review`), a session that ends with work left (`mstack-handoff`), and a missing dependency (`mstack-setup`).
#### Scenario: a large request
- GIVEN an owned goal and a request that needs a multi-day feature
- WHEN the skill handles it
- THEN it starts `mstack-write-specs` and names `mstack-plan` as the next step, and writes no implementation itself

### R18. A missing route does not stop the goal  [Must]
IF a route's skill is not in the session's skill list, THEN the skill SHALL say which skill is missing and that `mstack-setup` installs it, SHALL skip only that route, and SHALL keep owning the goal.
#### Scenario: no triage skill
- GIVEN a session without `mstack-backlog-triage`
- WHEN backlog work comes up
- THEN the reply names the missing skill and `mstack-setup`, and the session's other work continues

### R19. Two tracks  [Must]
WHEN a task finishes, the skill SHALL consider whether a problem the task actually hit is preventable for the next task, SHALL make a small fix inside the repository as part of the task, and SHALL record and propose to the user, without making it, any larger fix or any fix outside the repository.
#### Scenario: a repeated mistake
- GIVEN a subagent twice wrote code that breaks a project convention
- WHEN the skill closes the task
- THEN it adds or proposes a check that fails on that mistake, preferring a check over a written rule, and records the fix in the wiki
#### Scenario: a tempting workaround
- GIVEN a failing step that a one-off bypass would get past
- WHEN the skill handles it
- THEN it fixes the cause or routes it to `mstack-diagnose`, and adds no bypass

### R20. No skills outside mstack  [Must]
No file of the skill SHALL name a skill outside mstack as something to run or load.
#### Scenario: the finished skill
- GIVEN the skill folder
- WHEN every skill name in it is listed
- THEN each one starts with `mstack-`, apart from the credit in the notices file

### R21. Packaged like the other plugins  [Must]
The repository SHALL ship the skill as the plugin `mstack-chief-of-staff` for Claude Code and Codex, with its license copy, its notices file crediting the adapted source, both manifests, both registry entries and a README entry, so that the repository's two checks pass.
#### Scenario: the checks
- GIVEN the finished branch
- WHEN `check-marketplace.mjs` and `check-version-bumps.mjs` run
- THEN both pass

### R22. The rest of the repository stays true  [Must]
The repository SHALL update every text that counts or lists the mstack skills so that it includes the new skill, and SHALL raise the version of every plugin whose files change.
#### Scenario: the skill count
- GIVEN the finished branch
- WHEN the repository is searched for "fourteen"
- THEN no text still gives the old count of mstack skills

### R23. Found by the skill search  [Should]
The `mstack-find-skills` table of preferred mstack skills SHALL list `mstack-chief-of-staff` for owning a long-running goal across sessions.
#### Scenario: a search
- GIVEN the finished branch
- WHEN that table is read
- THEN it has a row naming `mstack-chief-of-staff`

## Constraints and assumptions

- The adapted source is `mattpocock/skills`, MIT (license file read 2026-11-11). Its rules are rewritten in this project's words, and the notices file carries the copyright line and the MIT text, as `AGENTS.md` requires.
- The ingest, query and lint idea comes from a gist with no license (read 2026-11-11 by a research subagent). No text from it is used.
- `AGENTS.md`: model names appear only in `mstack-best-model-for`; every instruction must work against the real tool; no personal or company data.
- Claude Code names a subagent tool and Codex documents none (host documentation, 2026-11-11), so the skill speaks of roles and carries a host table only where a step needs a host tool.
- New plugin version `0.1.0`, as the newest plugin started. Marketplace version `0.5.2` rises to `0.6.0`, because a plugin is added.
- The lint script runs on Node with no dependencies, like the other mstack scripts. Without Node the skill lints by reading and says so. (agent's call: matches the other skills)
- The skill's page format, which the reference file defines and the lint script checks: the index is `index.md` and lists every page with a link and one line; the goal page is `goal.md`; a claim is a list entry that starts with an ISO date (`- 2026-11-11: ...`); a claim about code carries `<repository>@<commit>` in the entry; a superseded claim keeps its text and ends with `(superseded <date>, see <link or date of the new claim>)`. (agent's call: the script needs one fixed format)
- A wiki that already exists with other conventions keeps them (R3). The lint script is then not run on it, and the skill lints by reading. (agent's call: a strict script on a foreign wiki would report every page)
- The evals are committed in the skill's `evals/` folder, three cases with their files and graders, as in every other mstack plugin. (evidence: the other plugins' folders)
- The lint script reads a Markdown folder only. For a wiki kept in another system the skill follows that system's conventions and lints by reading. (agent's call: the script cannot read other systems)

## Decisions

D1. A thin `SKILL.md`, one reference file for the wiki rules, and a lint script. Alternatives considered: one file as the source has it (about 200 lines, every session pays for the wiki rules); two skills (a contract nobody else needs yet). Decided by: user. Source: interview, approach choice.
D2. Routes cover every other mstack skill, not only the four in the issue. Alternative: the issue's four, which leaves plans unexecuted. Decided by: user.
D3. With no wiki, ask once and recommend a folder in the repository, with a warning in a public one. Alternatives: recommend a folder outside the repository (not shared across machines); no recommendation. Decided by: user.
D4. A missing routed skill is named with `mstack-setup` and only that route is skipped. Alternative: a preflight that stops the skill. Decided by: user.
D5. The skill loads on a fitting request. Alternative: command-only, as the source. Decided by: user.
D6. Small work stays in the goal owner's session. Alternative: all work in subagents, as the source. Decided by: user.
D7. A goal page next to the index. Alternative: the index only, as the source. Decided by: user.
D8. A script does the mechanical lint. Alternative: lint by reading only. Decided by: user.
D9. Schedules are suggested and created only after a yes. Decided by: user.
D10. Environment fixes are split by size and place. Alternative: always fix first, as the source. Decided by: user.
D11. The skill never commits wiki pages and reports them as uncommitted. Decided by: user.
D12. No retro procedure. Decided by: user.
D13. Done needs recorded evidence. Alternative: trust the report. Decided by: agent's call. Source: both vendors' long-running guidance in the research report.
D14. Lint reports and never deletes or settles on its own. Decided by: agent's call. Source: the research report's maintenance findings.
D15. An environment fix follows a problem the task actually hit, in this order of preference: a check that fails with a message the agent can act on, then a script or tool, then one line in the repository's instructions with its reason. Alternative: look for improvements on every message, as the source. Decided by: agent's call. Source: the research report; no source ranks the order, so it is a default.
D16. A brief states the binding decisions and constraints itself and points at everything long. Alternative: pointers only. Decided by: agent's call. Source: the research report.
D17. When `mstack-best-model-for` is missing, the subagent runs on the host's default model and the reply says so, under D4. Decided by: agent's call.
D18. The wiki is found through a line in the repository's agent instructions, offered after the location is agreed. Alternative: search for it every session. Decided by: agent's call.
D19. The start routine also runs after compaction. Decided by: agent's call. Source: host documentation on what compaction loses.
D21. The wiki pointer line is offered only for a wiki inside the repository, as a relative path. Alternative: a pointer to an outside location, which would put a machine path into a committed file. Decided by: agent's call. Source: independent read, and `AGENTS.md` on home paths.
D22. The start routine checks repository history since the date of the newest claim. Alternative: a separate last-checked marker on the goal page. Decided by: agent's call. Source: independent read.
D20. `mstack-find-skills` gains a row for the new skill. Decided by: agent's call. Source: its table lists the mstack skill for each kind of work.

## Risks

- The dated-history format and the fix order are assembled from adjacent practice, not proven for agent wikis -> the evals compare runs with and without the skill, and the spec calls both defaults.
- The description triggers on ordinary multi-step tasks -> it names owning a goal across sessions, and the skill's text turns away one-session work.
- A wiki in a public repository leaks private data -> the public warning in R3, the no-secrets rule in R9, and the private-data scan in packaging.
- The lint script's present-tense check reports false positives in quoted text -> it reports only, and superseded claims are exempt.

## Verification

- R1, R20: read the frontmatter and list the skill names in the folder; the static skill check passes.
- R2, R5, R6, R10: an eval where a fresh session resumes from a prepared wiki, graded on reading the goal page and index first and on stating the goal, criteria and newest decision.
- R7, R8, R9: an eval that ingests a changed decision about code into a prepared wiki, graded by the lint script and by checks that the old claim's text is unchanged and marked superseded and that the new claim cites a commit.
- R12: unit tests for the script, one failing fixture per reported problem, a clean fixture and a folder without an index.
- R14, R15, R17, R18: an eval where a large request arrives during an owned goal, graded on routing to the spec skill and on no implementation written; and a read of the brief rules.
- R3, R4, R11, R13, R16, R19: read against the skill's text; R3's question and R19's proposal appear in the eval transcripts where they arise.
- R21, R22, R23: the two repository checks, and a search for the old skill count and for every list of mstack skills.
- Not covered by a scenario: a wiki shared by two agents writing at once. Expected behavior: each ingest re-reads the page before writing; conflicts are left to Git.

## Open questions

- Should a later version add a retro route once mstack has a skill for it? Owner: the user. Can wait because: the issue leaves retro out and no requirement depends on it.

## Appendix: interview record

- 2026-11-11 Evidence: issue #9 body / Decision: the four proposal points and three acceptance lines are the base of R1 to R20.
- 2026-11-11 Evidence: `mattpocock/skills@chief-of-staff` text and license file / Decision: it is the adapted source; credit it in the notices file.
- 2026-11-11 Q: plugin here or local skill / Recommended: plugin / Decision: plugin in this repository.
- 2026-11-11 Q: route to the other mstack skills too / Recommended: yes / Decision: yes (D2).
- 2026-11-11 Q: wiki location default / Recommended: ask, suggest in-repository / Decision: accepted (D3).
- 2026-11-11 Q: a missing routed skill / Recommended: name mstack-setup and go on / Decision: accepted (D4).
- 2026-11-11 Q: load on a fitting request / Recommended: yes / Decision: yes (D5).
- 2026-11-11 Q: small work in the main session / Recommended: yes / Decision: yes (D6).
- 2026-11-11 Q: a goal page read first / Recommended: yes / Decision: yes (D7).
- 2026-11-11 Q: a Node script for mechanical lint / Recommended: yes / Decision: yes (D8).
- 2026-11-11 Q: schedules suggested only / Recommended: yes / Decision: yes (D9).
- 2026-11-11 Q: environment fixes split by size / Recommended: yes / Decision: yes (D10).
- 2026-11-11 Q: never commit wiki pages / Recommended: yes / Decision: yes (D11).
- 2026-11-11 Q: leave retro out / Recommended: yes / Decision: yes (D12).
- 2026-11-11 Q: shape of the skill, A, B or C / Recommended: A / Decision: A (D1).
- 2026-11-11 Evidence: `scripts/check-marketplace.mjs` / Decision: license copy, notices file, manifests and registry entries are required (R21).
- 2026-11-11 Evidence: `mstack-skill-creator` host files say "fourteen mstack skills" / Decision: R22.
- 2026-11-11 Evidence: host documentation read by a research subagent / Decision: role wording, D19, R13's per-host naming.
- 2026-11-11 Evidence: independent read by a fresh reader, four questions / Decision: all four settled without asking: D21, D22, the page format and the evals under Constraints.
