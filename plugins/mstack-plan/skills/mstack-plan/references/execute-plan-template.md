# execute-plan.md template

Read this in Phase 5. Copy the template into `<plan-folder>/execute-plan.md` and fill every planning-time placeholder: the title (`<plan title>`), the plan folder (`<path of the plan folder, relative to the repository root>`), the date (`<yyyy-mm-dd>`), the base branch (`<base>`), the slug (`<slug>`), the planning host (`<Claude Code | Codex | Antigravity>`), the recommended mode and its reason (`<Inline | Workflow>`, `<one sentence from the plan>`, `<a | b>`, `<the reason above>`), and the helper models (`<cheap helper: claude>`, `<cheap helper: codex>`, `<standard helper: claude>`, `<standard helper: codex>`, each written as the model and its effort from `mstack-best-model-for`'s answers for `cheap` and `standard`, and `<cheap helper: antigravity>`, `<standard helper: antigravity>`: for a plan made in Antigravity each is written as "the subagent tier `<tier>`" settled by rule 8 of `SKILL.md` phase 3, and for a plan made in Claude Code or Codex each is written as `none (planned in <host>)`, with `Claude Code` or `Codex` as the host). Set `- Plan reviewed by: pending (Phase 7 plan review)` in Phase 5 so Phase 6's `check-plan.mjs` passes, then replace it in Phase 7 once the plan review completes (one entry per reviewer: vendor, model and effort when set, and Record value, separated by `; ` when two reviewers ran; or `fallback review (<Record>)`). Rule 8's principle of `SKILL.md` phase 3 holds for every value you fill in: the start file names no flagged model that has no yes for its slot. Leave every runtime placeholder in code spans or code blocks (`<branch>`, `<repository root>`, `<prompt file>`, `<scratch file>`, `<workflow>`, `<name>`) untouched, because the executing session fills them at run time, possibly on another host. The file must work on its own: the session that executes it may not have `mstack-plan` installed, so everything the executor needs is in the file, and nothing points back into this skill's folder.

Pick the recommended mode from the plan itself.

- Recommend **Workflow** when a round has two or more phases, or when the plan has more than about eight tasks, or when a shipped mistake would be costly (security, stored data, money, a public API). Lanes run in parallel and every task or phase gets its own review.
- Recommend **Inline** otherwise. One session implements the tasks in order, and one review covers the whole branch. It costs the fewest tokens.

Write the reason as one sentence that names the fact from the plan that decided it.

## Template

````markdown
# Execute plan: <plan title>

You are about to execute an approved implementation plan. Read this whole file before doing anything.

- Plan folder: <path of the plan folder, relative to the repository root>
- Spec: <plan-folder>/spec.md (binding authority; the plan argues from it)
- Planned on: <Claude Code | Codex | Antigravity>, <yyyy-mm-dd>
- Plan reviewed by: <reviewer and model>
- Base branch: <base>
- Recommended mode: <Inline | Workflow>, because <one sentence from the plan>

## 1. Check the plan

1. Read `progress.md`, `plan.md`, `spec.md` and every file in `phases/`.
   Check that the three shared skills `mstack-vendors`, `mstack-best-model-for` and `mstack-receive-review` are in this session's skill list (each as `<name>` or `<plugin>:<name>`). When any of them is missing, stop before any work or file change, print this install block once per missing skill (every line, never running any command), and end your turn:

   ```text
   This start file needs <name>, which is not installed.
   Claude Code: claude plugin marketplace add mubeda/mstack, then claude plugin install <name>@mstack
   Codex:       codex plugin marketplace add mubeda/mstack, then codex plugin add <name>@mstack
   Antigravity: agy plugin install https://github.com/mubeda/mstack/tree/main/plugins/<name>
   Skills CLI:  npx skills add mubeda/mstack --skill <name> -g -a <claude-code|codex|antigravity> -y
   Or install mstack-setup the same way and run it: it installs everything the mstack skills need.
   Then start a new session.
   ```

2. If `progress.md` says `Plan status: Draft`, stop. Tell the user the plan is not approved and ask them to approve it, or to finish it with `mstack-plan`.
3. Compute the sha256 of `spec.md` (`sha256sum spec.md` or `shasum -a 256 spec.md`). If its first 12 hex digits differ from the `Spec` line of `progress.md`, the spec changed after planning. Stop and ask the user whether to re-plan or continue on the old plan.
4. When `progress.md` has a `Branch` line, continue on that branch. Tasks marked Closed are never redone, but check first that each one's last logged commit is on the branch (`git merge-base --is-ancestor <commit> HEAD`). When it is not, because a workflow closed the task and stopped before integrating it, cherry-pick the logged commits from the logged branch. When that branch is gone, set the task back to In progress and log why.
5. A task marked In progress was interrupted. Read its log lines and `git log` on the branch, then finish it from where the evidence stops.

## 2. Ask the user first

Before any other work, ask the user these two questions in one message, using the host's question tool (in Claude Code `AskUserQuestion`; in Codex a numbered list in chat, then wait; in Antigravity `ask_question`, then wait). Skip a question only when the user's opening message already answers it. In Antigravity this run sends no `Leader model` line and does not ask for it.

1. How should the plan be executed? Show only option (a) and the two workflows of the host this session runs in — never offer or name another host's workflows in your question:
   - (a) Inline. This session implements every task in order, red-green, then gets one review of the whole branch through `mstack-vendors` (or its fallback review when it offers none).
   - (b) Review workflow: parallel writer lanes on this host, a review per lane through `mstack-vendors`, one integrated branch. Offer only this host's review workflow: `mstack-claude-led-review` in Claude Code, `mstack-codex-led-review` in Codex, `mstack-antigravity-led-review` in Antigravity.
   - (c) Dev workflow: a developer of another vendor writes each phase, and this host reviews, validates and commits it. Offer only this host's dev workflow: `mstack-claude-led-dev` in Claude Code, `mstack-codex-led-dev` in Codex, `mstack-antigravity-led-dev` in Antigravity.
   I recommend (<a | b>), because <the reason above>.
2. May this run commit each finished task to the branch in `progress.md`'s `Branch` line, or, when there is none, create the branch `plan/<slug>` from `<base>` and commit to it? Pushing and opening a pull request happen only when the user asks.

## 3. Workflow execution

1. Load the workflow skill the user picked for this host from question 1. If it is not installed, print its install lines for this host (never run `agy plugin install`) and offer inline execution instead:
   - Claude Code: `claude plugin marketplace add mubeda/mstack`, then `claude plugin install <workflow>@mstack`, then start a new session.
   - Codex: `codex plugin marketplace add mubeda/mstack`, then `codex plugin add <workflow>@mstack`, then start a new session.
   - Antigravity: `agy plugin install https://github.com/mubeda/mstack/tree/main/plugins/<workflow>`, then start a new session.
   - Any host, with the skills CLI: print `npx skills add mubeda/mstack --skill <workflow> -g -a <claude-code | codex | antigravity> -y` for the user to run (or hand the install to `mstack-find-skills` or `mstack-setup`; never run installs yourself).
   - Or run `mstack-setup`, which reports and installs missing skills and tools for this host.
2. Give the workflow this plan folder as its work items, and tell it that every review is processed with `mstack-receive-review` without asking the user. It reads the folder as an `mstack-plan` plan: every task is a work item, `progress.md` is its status file, and each task's Skills, Read first and Done when go into the lane or phase brief.
3. The answer to question 2 above answers the workflow's own commit question. The workflow asks its remaining setup questions (such as execution mode, models, and in Antigravity its leader-model setup question).

## 4. Inline execution

### Rules for the whole run

1. Work on the branch from question 2. Never work directly on the default branch without the user's consent.
2. Set `Executor: inline` and `Branch: <branch>` in `progress.md`. On every task you close, record every vendor whose models changed that task's files in its Closed log line: write `Executed by: claude.` in Claude Code and `Executed by: codex.` in Codex when this session did the whole task; when closing a resumed In progress task that another vendor also edited, list all distinct writers (for example `Executed by: claude, codex.`), or write `Executed by: unknown.` when the interrupted work's writer is not recorded; in Antigravity omit `Executed by:` completely (a missing `Executed by:` means `unknown`; never guess a vendor).
3. Keep going without status check-ins. Stop and ask only for: an irreversible or destructive operation, a security-sensitive action, a side effect outside this repository (a push, a publish, a merge), a reviewer model that was rejected (the review step below), or a plan so broken that every way forward is a guess. When the context or the session is running out, stop at a safe point, make sure `progress.md` is current, write a handoff with `mstack-handoff` when it is installed, and give its path; the next session continues from `progress.md` and the handoff.
4. When the plan is wrong in a small way (a renamed function, a moved file), make the smallest change that still satisfies the spec, and log it in `progress.md` as `Ruling: <what>, because <why>. Cost if wrong: <impact>.`
5. Never claim a task is done without fresh evidence: run its Done when command in this session, read the whole output and the exit code, and copy the evidence into the log.
6. This session's model does every task, so a task's Tier line does not change it. The tier limits what you delegate: a read-only helper (a search, a log read) runs on the cheapest model this host offers, set explicitly, and no helper runs on a model above the task's tier. In Claude Code that is `Agent` with the model and effort of <cheap helper: claude> for a cheap helper and of <standard helper: claude> for a standard one. In Codex, pass them as `-m` and `model_reasoning_effort` on the helper run: <cheap helper: codex> for a cheap helper, <standard helper: codex> for a standard one. In Antigravity, start the helper with `invoke_subagent` on <cheap helper: antigravity> for a cheap helper and on <standard helper: antigravity> for a standard one; when that says `none (planned in <host>)`, start no helper, do the step yourself and say so. A helper started without them runs on this session's model.

### Per task

Pick the next task by dependencies. A task is ready when every task in its Depends on line is Closed and every phase its phase depends on is Closed. Among ready tasks, take the lowest phase, then the lowest ID. Skip Closed tasks and tasks marked removed or dropped. A task that depends on a removed or dropped task stays Open, and the final report lists it as blocked.

1. Set the task to In progress in `progress.md` and add a log line.
2. Load every skill the phase and the task list (in Claude Code with the Skill tool; in Codex by reading the skill's SKILL.md; in Antigravity by reading it with `read_file`). The plan names skills without a plugin prefix, so use whichever form this host lists, `<plugin>:<name>` or `<name>`. For a skill this host does not have, follow the task's steps without it and note that in the log.
3. Read every file and source in the phase's and the task's Read first.
4. Follow the steps in order. After each command, compare the output with its `Expected:` line.
   - Red-green tasks: see the test fail for the expected reason before writing the code, then see it pass. Do the "prove the test can fail" step, and always restore the code afterwards.
   - The output does not match because the code is wrong: debug it before changing anything (load `mstack-diagnose` when it is installed). Never patch the symptom.
   - The output does not match because the plan is wrong: apply rule 4.
5. Run the task's Done when command and the phase's lint and format commands.
6. Commit the task's files together with `progress.md`, where the task is now Closed and the log line carries `Executed by: <writers>.` (for example `claude`, `codex`, `claude, codex` on a resumed task, or `unknown` when prior writers are not recorded) before `Evidence:` in Claude Code and Codex (and no `Executed by:` in Antigravity), then `Evidence:` with the command, the result and the commit range.

After a phase's last task, run its Checkpoint and log the result. A failing checkpoint reopens the task that owns the failure.

### After the last task

1. Run every check in `plan.md` › End-to-end verification and log each result.
2. Get one read-only review of the whole branch through `mstack-vendors`. Never invent or write a reviewer command, flag or model of your own: copy the command from the `mstack-vendors` result block and follow its `Steps`.
   - **Collect `Writers:`** from the `Executed by:` field of every Closed task log line in `progress.md` (plus this session's own vendor if this session edited code: `claude` in Claude Code, `codex` in Codex, `unknown` in Antigravity). Use only task executors, never `Written by:` from the plan header. If every Closed task has a known vendor (`claude`, `codex`, `antigravity`, `other`) and none is `unknown`, list the distinct vendors separated by commas (for example `codex`). If any Closed task has no `Executed by:` or holds `unknown`, or if this session edited code in Antigravity, set `Writers: unknown`.
   - **Look up reviewer models** once with `mstack-best-model-for` in called mode for `Task: code review` (`Vendor: both`). Build the `Models:` line for `claude` and `codex` without this host's own vendor (`codex` alone in Claude Code, `claude` alone in Codex, both `claude` and `codex` in Antigravity), always converting any Claude model to its full headless id from `Claude headless id` / `How to set`, never an alias.
   - **Call `mstack-vendors`** with this exact literal message kept verbatim in the conversation (never a summary). `mstack-plan` wrote this start file, so this inline run calls on `mstack-plan`'s behalf (`Called by: mstack-plan`). In Antigravity this run sends no `Leader model` line and does not ask for it:

     ```text
     Called by: mstack-plan
     Host: <claude-code | codex | antigravity>
     Workspace: <repository root>

     Job: code review
     Writers: <vendors from Executed by | unknown>
     Workflow: review
     Models: <vendor>=<model id> <effort>[; <vendor>=<model id> <effort>]
     ```

     Write the `mstack-vendors` result block into the conversation before running any command.
   - **Offer or fall back:**
     - When `Recommend:` names one or more reviewers: ask the user once with your question tool which offered reviewers should review and on which model (the recommendation is the default; never offer `antigravity`). If any chosen default model is flagged as expensive in `mstack-best-model-for`, ask a question of its own naming the next non-flagged model down (a model the user explicitly typed draws no question; a session that cannot ask runs the recommendation on non-flagged models). Whenever the user's chosen reviewer subset or any model or effort differs from the discovery block's `Recommend:` and `Models:`, send one more literal message to `mstack-vendors` with `Models:` holding only the chosen reviewer(s) and their final model and effort (full headless id for Claude), and run only that execution block's commands.
     - When `Recommend:` says `a fallback review`: ask no pick question and no model question, warn the user that no other vendor is reviewing and this is a fallback review, and follow the block's `Steps` for the fallback review.
   - **Run the final block:** First check that the branch diff exists and is non-empty (`git -C <repository root> diff <base>...HEAD > <scratch>/branch.diff && test -s <scratch>/branch.diff`, where `<scratch>` is a folder outside the repository). If `git diff` exits non-zero (for example a base branch that does not exist) or `<scratch>/branch.diff` is empty, launch no reviewer: fix the base branch and rerun, or report an empty diff as nothing to review, never as a clean review. When the diff is non-empty, write the review prompt below to `<prompt file>` in `<scratch>` using your file tool (never `echo` or a heredoc), together with that branch diff (or its path when the block's `Steps` ask for one):

     ```text
     Read-only code review. Do not edit or run anything that changes files. Review branch <branch> against <base> (git diff <base>...HEAD). The plan is in <plan-folder> and the spec it implements is <plan-folder>/spec.md. Check that every requirement in the spec is met, and check correctness, regressions, missing tests and scope. Number the findings. For each one give where it is (file and line), what fails, and how to see it fail. End with one verdict line that says whether the branch can be merged as it is. No findings is a valid result.
     ```

     Execute the commands and `Steps` of the final block in full: fill only the run-time placeholders the block names (`<prompt file>` and `<scratch file>`); with two reviewers, run them one after the other so the second starts only after the first completes (each with its own approval outside the sandbox in Antigravity, keeping each exit code and output apart); wait for every command to complete and read its output before going on; handle failures and any rejected model exactly as the `Steps` say.
3. Process each reviewer's output unchanged and unmerged with `mstack-receive-review`, once per review, sending the three caller lines (`Review:`, `Writers:`, `Reviewer vendor:`) that the block's `Steps` specify, without asking the user anything. Verify every finding against the code and reproduce it before accepting it. Fix each real finding with a test you saw fail and then pass. Send an unclear finding back to the reviewer once. Reject a finding that is wrong, cannot be verified, or contradicts a decision the user already made, with the reason. Log every review (its vendor or fallback, model when set, and exact Record value from `mstack-receive-review`, never upgrading it to `cross-vendor`) and every finding with its outcome in `progress.md`.
4. Report to the user: the goal and the outcome in the first line, then the final `progress.md` table, the end-to-end results, every Ruling, every review with its Record value and every review finding with what happened to it (fixed, rejected and why, deferred), and what was not run and why. Offer to open a pull request. Do not push without the user's request.
````
