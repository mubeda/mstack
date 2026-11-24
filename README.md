# mstack

Daily-driver agent skills, packaged as a plugin marketplace that **Claude Code** and **OpenAI Codex CLI** read natively as a marketplace. **Antigravity** has no marketplace for this repository: it installs each plugin by its address, one `agy plugin install` command per plugin.

One marketplace, one canonical `SKILL.md` per skill, one manifest per host a plugin supports.

The repository is [`github.com/mubeda/mstack`](https://github.com/mubeda/mstack).

## What's inside

| Plugin | What it does | Hosts |
|---|---|---|
| [`mstack-codex-review-workflow`](./plugins/mstack-codex-review-workflow) | Claude-led coordinator for any task, from a list of issues, an execution plan, or one larger task. Parallel worktree agents or one agent in sequence, a live open, in progress and closed status table, advisor and read-only Codex reviews, one PR, serialized CI. | Claude Code |
| [`mstack-claude-review-workflow`](./plugins/mstack-claude-review-workflow) | The same workflow with the roles swapped. Codex leads and implements in parallel `codex exec` lanes in git worktrees (or alone, one item after another), and Claude reviews every lane read-only. | Codex CLI |
| [`mstack-claude-pm-codex-dev`](./plugins/mstack-claude-pm-codex-dev) | Claude manages and Codex writes the code. Claude briefs one Codex developer per phase through the OpenAI Codex plugin, reads each diff, reruns the validation, gets the advisor's and a read-only Codex review (labelled same-vendor, since Codex wrote the code), sends findings back to the same Codex thread, and commits each accepted phase. One PR, serialized CI. | Claude Code |
| [`mstack-diagnose`](./plugins/mstack-diagnose) | Find and prove the cause of a crash, bug, regression, flaky failure, slowdown, hang or leak, with graded evidence and a regression test before any fix. One skill, shared by every host. | Claude Code, Codex CLI and Antigravity |
| [`mstack-brainstorm`](./plugins/mstack-brainstorm) | Turn an unformed idea into a design brief you approved: reads first, asks open questions until the reason is known, then numbered rounds, lays out whole-shape approaches, and has an ideas mode that generates before it judges. Hands the brief to `mstack-write-specs`. One skill, shared by every host. | Claude Code, Codex CLI and Antigravity |
| [`mstack-write-specs`](./plugins/mstack-write-specs) | Interview until every decision is settled, then write an approved, testable spec: EARS requirements with a scenario each, a quality checklist and an independent read. One skill, shared by every host. | Claude Code, Codex CLI and Antigravity |
| [`mstack-plan`](./plugins/mstack-plan) | Turn an approved spec into a reviewed, test-first implementation plan: phases and red-green tasks sized for one agent session, the best skills named for every task, a cross-vendor review (with a same-vendor fallback), a shared progress file, and an `execute-plan.md` that starts inline or workflow execution. One skill, shared by every host. | Claude Code, Codex CLI and Antigravity |
| [`mstack-handoff`](./plugins/mstack-handoff) | Write one resumable handoff file (branch, HEAD, uncommitted paths, pull request, gates with exact commands, decisions, next commands first) so a fresh session continues long work, and resume from it. Never commits, stashes or leaks secrets. One skill, shared by every host. | Claude Code, Codex CLI and Antigravity |
| [`mstack-backlog-triage`](./plugins/mstack-backlog-triage) | Read every open issue, classify each with evidence, check for duplicates, and sort them into now, next and defer, as a table the workflows accept. Drafts comments and labels, and posts only approved text. One skill, shared by every host. | Claude Code, Codex CLI and Antigravity |
| [`mstack-skill-creator`](./plugins/mstack-skill-creator) | Create or improve a skill that Claude Code, Codex, Antigravity, OpenCode and Cursor all load: an interview, a check for an existing skill, portable writing rules, a static check and a test with and without the skill. In a repository like this one it also packages the plugin, runs the checks and gets a cross-vendor review. | Claude Code, Codex CLI, Antigravity, OpenCode and Cursor (the last two with the skills CLI) |
| [`mstack-find-skills`](./plugins/mstack-find-skills) | Find the skills that fit a job: installed skills scored per task first, then vetted public candidates from skills.sh for the gaps only (audits, installs, license, the skill's own text), installed only after your yes (in Antigravity a plugin command is shown for you to run, never run for you). The other skills call it for their tasks. | Claude Code, Codex CLI and Antigravity |
| [`mstack-best-model-for`](./plugins/mstack-best-model-for) | Pick the model and effort for a task or a tier, for Claude, Codex or Antigravity, from one dated table, with the exact setting, a reason and the next step if the result falls short. The other skills call it before they start a subagent, a lane or a reviewer. | Claude Code, Codex CLI and Antigravity |
| [`mstack-vendors`](./plugins/mstack-vendors) | Says which other vendor's model, Claude or Codex, can review code, review a plan or write code from this session: per job, who may do it, whether its client is installed and signed in, how each review is recorded, and the command and steps to call it, or what to install or sign in. It names no model and needs no other skill. It is made for the other skills to call before they start a reviewer or a developer of another vendor; none calls it yet, so today you ask it yourself. A Claude developer works in a copy of the repository with no remote (a repository with submodules is refused), but a push to an address it types out in full is not prevented. A Codex developer works in your checkout under Codex's own sandbox: the `codex exec` command sets network access off, while through the Codex plugin in Claude Code nothing sets it, and the check only found no line in the Codex configuration files it reads that turns it on, so a profile or a setting managed in the cloud can still turn it on. | Claude Code, Codex CLI and Antigravity |
| [`mstack-receive-review`](./plugins/mstack-receive-review) | Process any code review as claims to check: label and merge findings, verify each against the code, fix what holds test-first and everywhere the same mistake sits, reject what does not with evidence, keep your recorded decisions, and log every outcome with a drafted reply. Posts nothing. The other skills call it for every review (`mstack-product-plan` and `mstack-epic` use it when it is installed). | Claude Code, Codex CLI and Antigravity |
| [`mstack-setup`](./plugins/mstack-setup) | Check and install what the mstack skills need, at user scope, on Linux, macOS and Windows: codegraph, ponytail, the other vendors' clients and the mstack skills, from one list after one yes. In Antigravity it runs only its `agy plugin install` lines and the code-index install and connect commands, and shows every other command for you to run. | Claude Code, Codex CLI and Antigravity |
| [`mstack-chief-of-staff`](./plugins/mstack-chief-of-staff) | Own a long-running goal (a release, a backlog, a multi-step project) across many sessions: a wiki of dated claims that every session starts from, a commit beside every claim about code, superseded claims kept, a lint script, work delegated through briefs that point at files, and every procedure run through the other mstack skills. One skill, shared by every host. | Claude Code, Codex CLI and Antigravity |
| [`mstack-explain-me-better`](./plugins/mstack-explain-me-better) | A mode that explains AI answers and reports in everyday language: the bottom line first, full short sentences, your language, nothing that matters dropped (numbers, commands, warnings, stated uncertainty), and a line that says what was left out. It stays on until you stop it, and offers a diagram through the optional `archify` skill when an explanation has real structure. One skill, shared by every host. | Claude Code, Codex CLI and Antigravity |
| [`mstack-product-plan`](./plugins/mstack-product-plan) | Planning for product and management people, one level above the spec. An interview in numbered rounds until every product decision is settled, then a product plan: the initiative and its epics ordered as now, next and later (above nine it proposes a split), each with a measurable result and a rough size. No code, no dev steps. Needs no repository and no other skill, reads and writes an Obsidian vault, and is reviewed before approval. | Claude Code, Codex CLI and Antigravity (Claude and ChatGPT desktop apps: untested) |
| [`mstack-epic`](./plugins/mstack-epic) | Detail one epic of a product plan, or one described in chat, into a document developers can write a spec from: outcome, scope, acceptance as plain statements, a measurable result, fixed limits and open questions for developers. Never edits the product plan and lists what changed. `mstack-write-specs` takes the approved epic as its source. | Claude Code, Codex CLI and Antigravity (Claude and ChatGPT desktop apps: untested) |
| [`mstack-evidence`](./plugins/mstack-evidence) | Turn customer feedback (support tickets, interview notes, survey answers) into evidence a product plan can rest on: problems with a count whose items are listed, exact quotes with their place, and a strength by a written rule. No solutions. A script checks every quote and count against the sources, customers' personal data becomes roles, and nothing goes to another vendor's model. | Claude Code, Codex CLI and Antigravity (Claude and ChatGPT desktop apps: untested) |
| [`mstack-decisions`](./plugins/mstack-decisions) | Turn the notes or transcript of one meeting into decisions with their decider and reason, what only seems decided, open points, and action items as they were given. Never guesses a speaker, an owner or a date, lists what the decisions change in a product plan or epic without editing it, and checks every quote against the notes with a script. | Claude Code, Codex CLI and Antigravity (Claude and ChatGPT desktop apps: untested) |
| [`mstack-auto`](./plugins/mstack-auto) | A router for the skills above. Give it any prompt ("use mstack for this") and it starts the one mstack skill that fits, after one line that says which and why. It picks the earliest missing step of a chain, asks one question on a real tie, names a fitting skill that is missing, and when the fitting skill runs only on another host it says so and offers the one for this host (in Antigravity, where no delivery workflow runs yet, it names the Claude Code and Codex workflows instead), and hands a job no mstack skill covers to `mstack-find-skills`. It starts only when asked and never does the job itself. | Claude Code, Codex CLI and Antigravity |
| [`mstack-research`](./plugins/mstack-research) | Research outside the repository with sources you can check. It answers a question from official documentation, source code, changelogs, issue trackers and forums, and every claim names the page or the local file it came from. For a package or SDK it starts from the version in your lockfile: the documentation for that version, what changed since, known issues with their fix versions, and security advisories. Text in a fetched page is never followed as an instruction, and a run that could not search says so instead of answering from memory. In Antigravity, which has no tool that opens a page, a restricted reader reads pages that the session fetched into a temporary folder, and the answer says when pages could not be opened. | Claude Code, Codex CLI and Antigravity |
| [`mstack-write-issue`](./plugins/mstack-write-issue) | Well-formed tracker issues from what the session already knows. Say "file an issue for this" and it searches open and closed issues first, turns a match into a comment with only the new evidence, and otherwise drafts one issue per finding in the repository's own issue template, or in a fixed outline for a bug, a feature or a follow-up. A bug that does not happen every time gets its counts and conditions, never steps that pretend to reproduce it. Every issue ends with a line that says when it is done, and credentials, private hosts, names and home paths are replaced before anything is shown. It shows the exact text and posts only after you approve it in a later message: with `gh` on GitHub, through a connected tool on another tracker, or as a draft to paste. A security vulnerability is never drafted as a public issue. | Claude Code, Codex CLI and Antigravity |
| [`mstack-anonymize`](./plugins/mstack-anonymize) | Identifying values replaced before data goes to an AI model or to other people. Say "anonymize this file" and a script in the skill folder cleans it on your machine: the agent never opens the raw file or your list of names, opens a result written to disk only for a review you asked for, and reports a count per kind. Values are found by their form (e-mail addresses, phone numbers, cards, IBANs, IP addresses, hosts, credentials, amounts, identifiers), by the name of a column or a JSON key in English, German and Spanish, and by a terms file you keep. The same value gets the same placeholder, such as `[EMAIL_1]`, and no file links a placeholder to its original. Text, Markdown, logs, CSV, TSV and JSON in, Markdown out, as a file or in the chat. Text you paste is cleaned too, with the note that the model has already seen it. Every result says that it may still be personal data: this is pseudonymisation, not legal anonymization. Needs Node.js 18 or later and nothing else. | Claude Code, Codex CLI and Antigravity |
| [`mstack-web-ui`](./plugins/mstack-web-ui) | Web interfaces built and reviewed. Say "add a settings screen" or "review this UI" and what it builds works with a keyboard and on a phone, has its empty, loading and error states, and holds with long content. A new page gets a direction that is chosen and stated, with nothing invented in it; an existing project keeps its design system, components and stack. In a React project it adds rules matched to the installed React version. A review returns ranked findings with file and line and changes nothing. Text only, with no script and nothing to install. | Claude Code, Codex CLI and Antigravity |

Each plugin can be installed on its own. The three workflows share their reference files (the review rules live in `mstack-receive-review`), and `scripts/check-marketplace.mjs` fails if the copies drift apart.

The plugins also work together. `mstack-backlog-triage` picks what to work on and routes each issue, `mstack-brainstorm` turns an unformed idea into an approved design brief, `mstack-write-specs` writes the spec (from that brief, without asking its settled decisions again), `mstack-plan` turns it into a plan folder, and any of the three workflows executes that folder, task by task, writing progress into the plan's `progress.md`, so execution can switch between inline and a workflow and resume where it stopped. When a session runs out before the work does, `mstack-handoff` writes the file the next session starts from. For a goal that takes many sessions, `mstack-chief-of-staff` owns it: it keeps the goal, its decisions and its history in a wiki of dated claims, starts every session from that wiki, and runs each procedure through the skills above. It requires none of them: when one is missing it says so, names `mstack-setup`, skips only that route and keeps going. When an answer from any of them is too long or too hard to follow, `mstack-explain-me-better` explains it again in everyday language and keeps answering that way until you stop it. It requires no other skill; with the optional `archify` skill installed it also offers a diagram. For product and management people the chain starts one level higher: `mstack-product-plan` interviews about a whole initiative and cuts it into ordered epics, `mstack-epic` details one of them, and `mstack-write-specs` takes the approved epic as its source without asking the product decisions again. Those two skills contain no code or dev steps, require no other skill (each does a short built-in version of a step whose helper skill is missing, and says so), and read from and save into an Obsidian vault with links and properties. Two more skills feed them. `mstack-evidence` turns customer feedback into problems with counts and exact quotes, so a product plan rests on evidence instead of "no evidence yet". `mstack-decisions` turns meeting notes into decisions, which a product plan, an epic or a spec then takes as settled. Both check their quotes against the source with a script, need no other skill, and send nothing to another vendor's model. `mstack-skill-creator` builds new skills with the same chain: it uses each of these skills for its step when it is installed, and a short built-in version when it is not, except the shared skills `mstack-find-skills`, `mstack-best-model-for` and `mstack-research`, which it requires in Claude Code, Codex and Antigravity. `mstack-plan` and the three workflows ship the same `plan-format.md`. When you do not know which of these skills fits a job, start `mstack-auto` with your prompt: it picks the skill from its own routing table, says which one and why, and starts it. It requires `mstack-find-skills`, to which it hands every job no mstack skill covers, and it names `mstack-setup` when the skill it picked is not installed. Research outside the repository has one home, `mstack-research`: `mstack-plan` calls it for every package, SDK or external API a plan uses and for every fact the spec and the repository do not give, the three workflows call it for research that several lanes depend on, and `mstack-skill-creator` calls it for its research step; all of these require it. `mstack-write-specs` and `mstack-diagnose` call it when it is installed and look things up themselves when it is not. In Claude Code, a broad question you ask it yourself goes to Claude's deep-research when that skill is installed; in every other case its own readers run (when `mstack-best-model-for` is not installed it runs each question as a quick one, with no reader): in Claude Code, as a plugin, an agent with search and reading tools only; in Codex a nested read-only run; in Antigravity, as a plugin, its Antigravity reader agent, which reads only pages fetched into a temporary folder. Issues have one home too, `mstack-write-issue`: you start it yourself, and the three workflows offer it at the end of a run for the follow-ups they deferred, when it is installed. They ask once, show its drafts, and post only what you approve. Nothing requires it, and it requires no other skill. `mstack-anonymize` stands alone as well: you run it on a file or a text before you hand that data to `mstack-evidence`, `mstack-decisions` or any model, and no skill calls it. So does `mstack-web-ui`: you start it for a page, a screen or a review of one, it needs nothing else, and the three workflows keep their own helper for web work.

Six shared skills do the jobs the others have in common. `mstack-receive-review` processes every review, `mstack-research` researches what the repository cannot answer, `mstack-find-skills` finds the skills for each task, `mstack-best-model-for` picks every subagent's, lane's and reviewer's model and effort (`mstack-chief-of-staff` falls back to the host's default model when it is not installed, and says so), `mstack-vendors` says which other vendor can review or develop from this session and how to call it (no skill calls it yet), and `mstack-setup` installs dependencies. `mstack-product-plan` and `mstack-epic` are the exception: they use these skills when installed and do a short built-in version of the step when not. `mstack-evidence` and `mstack-decisions` use none of them. `mstack-plan`, the three workflows and `mstack-skill-creator` (in Claude Code, Codex and Antigravity) require `mstack-find-skills` and `mstack-best-model-for`, `mstack-plan` and the three workflows also require `mstack-receive-review`, and all five require `mstack-research`; `mstack-diagnose`, `mstack-write-specs`, `mstack-brainstorm` and `mstack-backlog-triage` take their subagents' models from `mstack-best-model-for`; when it is not installed they print its install commands, name `mstack-setup` and go on without starting any subagent. A skill whose required shared skill is missing stops before any work and prints the install commands and the name `mstack-setup`.

The skills that read code (`mstack-plan`, `mstack-write-specs`, `mstack-diagnose`, `mstack-backlog-triage` and the three workflows) refresh a [codegraph](https://github.com/colbymchenry/codegraph) index of the repository when codegraph is installed, and use it to find code. Without codegraph they read code as before. They never install it; `mstack-setup` does.

`mstack-plan` needs `node`, `git`, `mstack-find-skills`, `mstack-best-model-for`, `mstack-receive-review` and `mstack-research`, and recommends the cross-vendor reviewer of its host: in Claude Code the `codex` skill from skill-codex with a logged-in `codex` CLI, and in Codex a logged-in `claude` CLI. Antigravity has no cross-vendor reviewer for it: the review runs as a fresh same-vendor read and says so.

`mstack-codex-review-workflow` carries its working rules (style, writing, grilling, external research, web UI checks) in its own reference files, processes every review with `mstack-receive-review`, and bug lanes use `mstack-diagnose`. It needs `ponytail`, `mstack-diagnose`, `mstack-find-skills`, `mstack-best-model-for`, `mstack-receive-review` and `mstack-research`, plus `gh` for GitHub work and `ui-ux-pro-max` with Python 3 for web UI work, and recommends the `codex` skill from [skill-codex](https://github.com/skills-directory/skill-codex) with a logged-in `codex` CLI. Its preflight checks them and names `mstack-setup` for whatever is missing.

`mstack-claude-review-workflow` carries the same reference files. It needs `ponytail`, `mstack-diagnose`, `mstack-find-skills`, `mstack-best-model-for`, `mstack-receive-review`, `mstack-research` and `node`, plus `gh` for GitHub work and `ui-ux-pro-max` with Python 3 for web UI work, and recommends the `claude-review` skill from the `claude` plugin of [agent-bridges](https://github.com/mubeda/agent-bridges) with a logged-in `claude` CLI. Codex's sandbox blocks some of its commands (git writes, and network for lanes and reviews), so the run asks you to approve them.

`mstack-claude-pm-codex-dev` carries the same reference files too. It needs the [OpenAI Codex plugin for Claude Code](https://github.com/openai/codex-plugin-cc) (its `codex:codex-rescue` agent is the developer channel) with a logged-in `codex` CLI, `ponytail`, `mstack-diagnose`, `mstack-best-model-for` and `mstack-receive-review` on the Codex side (the developer loads them), and `mstack-find-skills`, `mstack-best-model-for`, `mstack-receive-review` and `mstack-research` on the Claude side, `node`, plus `gh` for GitHub work and `ui-ux-pro-max` on the Codex side for web UI work. Its preflight checks them and names `mstack-setup` for whatever is missing. It runs one developer at a time in your checkout, and it commits only phases it reviewed.

When a skill's cross-vendor reviewer is not installed, the skill warns you and runs the same review with a fresh, read-only subagent of the AI you are using. That same-vendor review tends to miss more, so every report marks it (`mstack-skill-creator` in Antigravity, where no source says which vendor a subagent's model is from, records that the vendor is not known, never cross-vendor). `mstack-product-plan` and `mstack-epic` do the same without a warning step, and use the same-vendor read on purpose whenever a source holds customer feedback, an interview, meeting notes or a transcript, in any form, and when they are unsure (`mstack-evidence` and `mstack-decisions` never use a reviewer of another vendor, because their sources are customer feedback and meeting transcripts), and on a host with no subagent the skill reads its own document again against a checklist and marks that too. A review that `mstack-receive-review` processes is recorded by one rule, from who wrote the work and which vendor reviewed it, as one of five values: `cross-vendor`, `same-vendor`, `writer unknown`, `reviewer unknown`, or `-` for a review by a person.

## Install in Claude Code

```bash
/plugin marketplace add mubeda/mstack
```

Then install the plugins you want and reload:

```bash
/plugin install mstack-codex-review-workflow@mstack
/plugin install mstack-claude-pm-codex-dev@mstack
/plugin install mstack-diagnose@mstack
/plugin install mstack-brainstorm@mstack
/plugin install mstack-write-specs@mstack
/plugin install mstack-plan@mstack
/plugin install mstack-handoff@mstack
/plugin install mstack-backlog-triage@mstack
/plugin install mstack-skill-creator@mstack
/plugin install mstack-find-skills@mstack
/plugin install mstack-best-model-for@mstack
/plugin install mstack-vendors@mstack
/plugin install mstack-setup@mstack
/plugin install mstack-receive-review@mstack
/plugin install mstack-chief-of-staff@mstack
/plugin install mstack-explain-me-better@mstack
/plugin install mstack-product-plan@mstack
/plugin install mstack-epic@mstack
/plugin install mstack-evidence@mstack
/plugin install mstack-decisions@mstack
/plugin install mstack-auto@mstack
/plugin install mstack-research@mstack
/plugin install mstack-write-issue@mstack
/plugin install mstack-anonymize@mstack
/plugin install mstack-web-ui@mstack
/reload-plugins
```

Each skill then appears in `/skills` and is invoked when Claude matches a task to the skill's description.

### Updating

Run `/plugin`, open the **Marketplaces** tab, select `mstack` and enable auto-update. Or update by hand:

```bash
/plugin marketplace update mstack
/plugin update <plugin-name>@mstack
/reload-plugins
```

From marketplace version 0.4.0 `mstack-plan`, the three workflows and `mstack-skill-creator` require the shared skills `mstack-find-skills` and `mstack-best-model-for`, and stop until they are installed. From marketplace version 0.6.1, `mstack-diagnose`, `mstack-write-specs`, `mstack-brainstorm` and `mstack-backlog-triage` no longer stop without `mstack-best-model-for`: they work without subagents (`mstack-chief-of-staff` requires none: it names a missing skill and goes on). Install them with the lines above, or install `mstack-setup` and run it, which installs what is missing after one yes (`node`, `git`, `gh`, Python and logins stay steps for you). From marketplace version 0.5.0, `mstack-plan` and the three workflows also require `mstack-receive-review`. From marketplace version 0.11.0, `mstack-plan`, the three workflows and `mstack-skill-creator` also require `mstack-research`; `mstack-write-specs` and `mstack-diagnose` use it when it is installed.

## Install in Codex CLI

The native Codex manifest is [`.agents/plugins/marketplace.json`](.agents/plugins/marketplace.json).

```bash
codex plugin marketplace add mubeda/mstack
codex plugin add mstack-claude-review-workflow@mstack
codex plugin add mstack-diagnose@mstack
codex plugin add mstack-brainstorm@mstack
codex plugin add mstack-write-specs@mstack
codex plugin add mstack-plan@mstack
codex plugin add mstack-handoff@mstack
codex plugin add mstack-backlog-triage@mstack
codex plugin add mstack-skill-creator@mstack
codex plugin add mstack-find-skills@mstack
codex plugin add mstack-best-model-for@mstack
codex plugin add mstack-vendors@mstack
codex plugin add mstack-setup@mstack
codex plugin add mstack-receive-review@mstack
codex plugin add mstack-chief-of-staff@mstack
codex plugin add mstack-explain-me-better@mstack
codex plugin add mstack-product-plan@mstack
codex plugin add mstack-epic@mstack
codex plugin add mstack-evidence@mstack
codex plugin add mstack-decisions@mstack
codex plugin add mstack-auto@mstack
codex plugin add mstack-research@mstack
codex plugin add mstack-write-issue@mstack
codex plugin add mstack-anonymize@mstack
codex plugin add mstack-web-ui@mstack
```

Or launch `codex` and browse with `/plugins`. Codex has no auto-update; refresh with `codex plugin marketplace upgrade mstack`, then run `codex plugin add` again for each plugin you use. From marketplace version 0.4.0 `mstack-plan`, `mstack-claude-review-workflow` and `mstack-skill-creator` require `mstack-find-skills` and `mstack-best-model-for` (`mstack-diagnose`, `mstack-write-specs`, `mstack-brainstorm` and `mstack-backlog-triage` work without subagents when `mstack-best-model-for` is missing, and `mstack-chief-of-staff` requires none), and from 0.5.0 `mstack-plan` and `mstack-claude-review-workflow` also require `mstack-receive-review`, and from 0.11.0 they and `mstack-skill-creator` also require `mstack-research`; `mstack-setup` installs what it can of whatever is missing.

`mstack-codex-review-workflow` and `mstack-claude-pm-codex-dev` are not published for Codex, because they drive Claude Code's subagent tools (the second also drives the Codex plugin for Claude Code). Codex users install `mstack-claude-review-workflow` instead.

## Install in Antigravity

Antigravity has no marketplace for this repository, so each plugin installs by the address of its folder. Run one command per plugin you want, in a terminal:

```bash
agy plugin install https://github.com/mubeda/mstack/tree/main/plugins/mstack-diagnose
agy plugin install https://github.com/mubeda/mstack/tree/main/plugins/mstack-brainstorm
agy plugin install https://github.com/mubeda/mstack/tree/main/plugins/mstack-write-specs
agy plugin install https://github.com/mubeda/mstack/tree/main/plugins/mstack-plan
agy plugin install https://github.com/mubeda/mstack/tree/main/plugins/mstack-handoff
agy plugin install https://github.com/mubeda/mstack/tree/main/plugins/mstack-backlog-triage
agy plugin install https://github.com/mubeda/mstack/tree/main/plugins/mstack-skill-creator
agy plugin install https://github.com/mubeda/mstack/tree/main/plugins/mstack-find-skills
agy plugin install https://github.com/mubeda/mstack/tree/main/plugins/mstack-best-model-for
agy plugin install https://github.com/mubeda/mstack/tree/main/plugins/mstack-vendors
agy plugin install https://github.com/mubeda/mstack/tree/main/plugins/mstack-setup
agy plugin install https://github.com/mubeda/mstack/tree/main/plugins/mstack-receive-review
agy plugin install https://github.com/mubeda/mstack/tree/main/plugins/mstack-chief-of-staff
agy plugin install https://github.com/mubeda/mstack/tree/main/plugins/mstack-explain-me-better
agy plugin install https://github.com/mubeda/mstack/tree/main/plugins/mstack-product-plan
agy plugin install https://github.com/mubeda/mstack/tree/main/plugins/mstack-epic
agy plugin install https://github.com/mubeda/mstack/tree/main/plugins/mstack-evidence
agy plugin install https://github.com/mubeda/mstack/tree/main/plugins/mstack-decisions
agy plugin install https://github.com/mubeda/mstack/tree/main/plugins/mstack-auto
agy plugin install https://github.com/mubeda/mstack/tree/main/plugins/mstack-research
agy plugin install https://github.com/mubeda/mstack/tree/main/plugins/mstack-write-issue
agy plugin install https://github.com/mubeda/mstack/tree/main/plugins/mstack-anonymize
agy plugin install https://github.com/mubeda/mstack/tree/main/plugins/mstack-web-ui
```

A new session loads what you installed. Do not use `agy plugin import` for this: it imports every Claude Code plugin you have at once. The three workflows are not published for Antigravity. Antigravity loads only the first 24,000 bytes of a skill's body, and `scripts/check-marketplace.mjs` fails a longer body in any plugin that has an Antigravity manifest.

## Install with the skills CLI

Every skill also installs with the [skills CLI](https://github.com/vercel-labs/skills) (`npx skills`), for Claude Code, Codex, Antigravity and the other agents it supports. It installs only the skill folder, which carries everything the skill needs, including its license and third-party notices. The one exception is `mstack-research`: its reader agents for Claude Code and Antigravity come only with the plugin, and without it the skill says so: in Claude Code its readers ran without a tool restriction, and in Antigravity it opens no page.

```bash
npx skills add mubeda/mstack
```

In a terminal it asks which skills to install, for which agents, whether to install them in this project or globally, and whether to symlink or copy them. To choose up front instead:

| Choice | Flag |
|---|---|
| Only some skills | `--skill mstack-plan mstack-write-specs` |
| The agents | `-a claude-code`, `-a codex`, `-a antigravity`, or several, such as `-a claude-code codex antigravity` |
| Global (your home folder) instead of this project | `-g` |
| Copy instead of symlink | `--copy` |
| No prompts | `-y` |

```bash
npx skills add mubeda/mstack --skill mstack-plan mstack-diagnose -a claude-code codex antigravity -g -y
```

Add the shared skills the others require, `mstack-find-skills`, `mstack-best-model-for`, `mstack-receive-review` and `mstack-research`, and `mstack-setup` for the other dependencies:

```bash
npx skills add mubeda/mstack --skill mstack-find-skills mstack-best-model-for mstack-receive-review mstack-research mstack-setup -a claude-code codex antigravity -g -y
```

A project install goes into `.agents/skills/` and `.claude/skills/` and is recorded in `skills-lock.json`. A global install goes into `~/.agents/skills/`, which Codex reads, with a link in `~/.claude/skills/` for Claude Code. Antigravity looks for global skills in `~/.gemini/config/skills/` and not in `~/.agents/skills/`, so for Antigravity prefer the plugin install above. OpenCode and Cursor install mstack skills this way only. Both load the shared `.agents/skills/` folder at project level and `~/.agents/skills/` globally, where the skills CLI writes:

```bash
npx skills add mubeda/mstack --skill mstack-skill-creator -a opencode cursor
```

`mstack-skill-creator` runs on all five hosts. The other skills except the three workflows are written for Claude Code, Codex and Antigravity; `mstack-product-plan`, `mstack-epic`, `mstack-evidence` and `mstack-decisions` are also written for the Claude and ChatGPT desktop apps (below).

Keep skills current with `npx skills update`, list them with `npx skills ls`, and remove one with `npx skills remove <skill>`.

Install the workflow that matches the agent: `mstack-codex-review-workflow` or `mstack-claude-pm-codex-dev` for Claude Code, `mstack-claude-review-workflow` for Codex. The Codex workflow's Claude reviewer, the agent-bridges `claude` plugin, has to be installed as a plugin, because its skill runs a script from the plugin's root folder.

When a skill finds a missing dependency, it names `mstack-setup`, which installs skills, plugins and their command-line tools at user scope after one yes, and lists `node`, `git`, `gh`, Python and logins as steps for you. There are three exceptions. `archify`, the optional diagram skill of `mstack-explain-me-better`: when it is missing, no diagram is offered and nothing is said about it. And `mstack-product-plan` and `mstack-epic`, which never stop for a missing skill: they do a short built-in version of that step and say so. And `mstack-anonymize`, whose only dependency is Node.js: when it is missing, the skill says so and stops, because `mstack-setup` does not install Node.js. `mstack-evidence` and `mstack-decisions` use no other skill at all. `mstack-find-skills` installs a skill it found only after asking whether to install it as a plugin or with the skills CLI, and for the skills CLI the scope, the method and the agents. In Antigravity it prints the plugin command for you to run and does not run it.

## Use in the Claude and ChatGPT desktop apps

`mstack-product-plan`, `mstack-epic`, `mstack-evidence` and `mstack-decisions` are written to work as plain skill folders in the Claude and ChatGPT desktop apps, for people who have no code checkout. This project has not tested either app yet, so treat this as a best effort.

- **Claude:** zip the skill folder (`plugins/<name>/skills/<name>/`, so that the folder is the root of the ZIP and has the skill's name), then upload it under Customize › Skills › Create skill › Upload a skill. Code execution has to be on, and custom skills need a paid plan.
- **ChatGPT:** upload the same folder as a skill (Create, then upload from your computer) and call it with `@` and its name. Skills added in the desktop app do not appear on the web.

There the skills ask their questions in the chat, review their own document with a fresh read by the same model, and print the document when they cannot save a file. `mstack-evidence` and `mstack-decisions` run their check script only where the app can run code, and otherwise check by reading and say so. The other mstack skills are not needed.

## Repository layout

```
mstack/
├── .claude-plugin/marketplace.json   # Claude Code marketplace (also legacy-readable by Codex)
├── .agents/plugins/marketplace.json  # Codex CLI native marketplace
├── plugins/<plugin>/
│   ├── .claude-plugin/plugin.json    # Claude Code manifest
│   ├── .codex-plugin/plugin.json     # Codex manifest (omitted for Claude-only plugins)
│   ├── .antigravity-plugin/plugin.json  # Antigravity manifest (omitted for single-host plugins)
│   ├── agents/reader.md              # mstack-research only: its Claude Code reader agent, which the skills CLI does not install
│   ├── agents/antigravity-reader/agent.md  # mstack-research only: its Antigravity reader agent
│   └── skills/<skill>/               # self-contained: the skills CLI installs only this folder
│       ├── SKILL.md                  # open Agent Skills format
│       ├── LICENSE                   # copy of the repository license
│       ├── THIRD_PARTY_NOTICES.md    # credits for adapted third-party text
│       ├── references/…              # optional supporting docs
│       └── scripts/…                 # optional helper scripts
├── skills.sh.json                    # tells the skills CLI (npx skills) where the skills live
├── scripts/                          # marketplace and version-bump checks (Node 18+, no dependencies)
├── AGENTS.md                         # rules for AI agents working in this repo
├── CLAUDE.md                         # imports AGENTS.md for Claude Code
└── LICENSE                           # Apache-2.0
```

## Why one repo works for every host

`SKILL.md` follows the open [Agent Skills](https://agentskills.io) format (a folder with `name:` and `description:` frontmatter plus optional `scripts/`, `references/`, `assets/`), which Claude Code, Codex CLI, Antigravity and many other agents read without translation. Each plugin is a thin wrapper around one or more skill folders, and the manifest files tell each host where to find them. `skills.sh.json` points the skills CLI at the same folders, so a skill installed either way is the same files. A plugin can also carry an agent definition in its `agents/` folder, which only the plugin install brings; `mstack-research`'s two readers, one for Claude Code and one for Antigravity, are the one case.

## Adding a skill

1. Put the skill at `plugins/<plugin>/skills/<skill>/SKILL.md`, with a copy of the root `LICENSE` and a `THIRD_PARTY_NOTICES.md` next to it. Keep everything the skill needs inside that folder, because the skills CLI installs only the folder, and name any `SKILL.md` used as test data `SKILL.md.fixture`. An agent definition is the one thing that must sit in the plugin's `agents/` folder instead; a skill that uses one says what it does without it (see `AGENTS.md`).
2. Create `plugins/<plugin>/.claude-plugin/plugin.json`, `plugins/<plugin>/.codex-plugin/plugin.json` (with `"skills": "./skills/"` and an `interface` block) if it works in Codex, and `plugins/<plugin>/.antigravity-plugin/plugin.json` (name, version, description, license, author) if it works in Antigravity. A plugin has all three manifests, except a plugin that the `singleHost` table in `scripts/check-marketplace.mjs` names: that one has only its host's manifest, and only that host's steps below apply to it.
3. Register it in `.claude-plugin/marketplace.json` (when it has a Claude Code manifest) and, for Codex, `.agents/plugins/marketplace.json` (`version`, `source: {source: "local", path: ...}`, `policy`, `category`), and add a row to the table above and, for an adapted source, to Credits below.
4. Run the checks listed in [`AGENTS.md`](./AGENTS.md) › Before every commit. They run `agy plugin validate` on each Antigravity plugin when a file named `agy` is found on `PATH`, and print a skipped line otherwise (on Windows an `agy.exe` or `agy.cmd` is not looked for, so the step is skipped there).

Skills here are for anyone: no personal names, machine paths, company or project data. See `AGENTS.md`.

## Credits

Many of these skills build on other open-source projects. Their rules are rewritten in this project's words (the one exception is `mstack-skill-creator`, which ships three of Anthropic's benchmark files unchanged), and each skill's `THIRD_PARTY_NOTICES.md` says what it took from where, with the copyright lines and license texts those projects require. That file is the record; this list is a thank-you.

| Project | License | Used by |
|---|---|---|
| [superpowers](https://github.com/obra/superpowers) | MIT | `mstack-brainstorm`, `mstack-write-specs`, `mstack-plan`, `mstack-diagnose`, `mstack-handoff`, `mstack-receive-review`, `mstack-skill-creator`, the three workflows |
| [pstack](https://github.com/cursor/plugins/tree/main/pstack) | MIT | `mstack-brainstorm`, `mstack-write-specs`, `mstack-plan`, `mstack-diagnose`, `mstack-handoff`, `mstack-receive-review`, `mstack-explain-me-better`, `mstack-evidence`, `mstack-decisions`, the three workflows |
| [mattpocock/skills](https://github.com/mattpocock/skills) | MIT | `mstack-brainstorm`, `mstack-write-specs`, `mstack-plan`, `mstack-diagnose`, `mstack-handoff`, `mstack-backlog-triage`, `mstack-chief-of-staff`, `mstack-research`, `mstack-write-issue`, the three workflows |
| [juliusbrussee/caveman](https://github.com/juliusbrussee/caveman) | Apache-2.0 (MIT before its version 3.0.0) | `mstack-explain-me-better`, the three workflows |
| [i-have-adhd](https://github.com/ayghri/i-have-adhd) | MIT | `mstack-explain-me-better`, the three workflows |
| [spec-kit](https://github.com/github/spec-kit) | MIT | `mstack-write-specs`, `mstack-plan` |
| [OpenSpec](https://github.com/Fission-AI/OpenSpec) | MIT | `mstack-write-specs` |
| [Anthropic knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins) | Apache-2.0 | `mstack-brainstorm`, `mstack-write-specs`, `mstack-diagnose`, `mstack-product-plan`, `mstack-epic`, `mstack-evidence` |
| [BMad Method](https://github.com/bmad-code-org/bmad-method) | MIT | `mstack-brainstorm` |
| [Omarchy](https://github.com/omacom/omarchy), [awesome-copilot](https://github.com/github/awesome-copilot), [wshobson/agents](https://github.com/wshobson/agents) | MIT | `mstack-diagnose` |
| [chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp) | Apache-2.0 | `mstack-diagnose` |
| [beagle](https://github.com/existential-birds/beagle), [streamlit](https://github.com/streamlit/streamlit) | Apache-2.0 | `mstack-receive-review` |
| [archify](https://github.com/tt-a1i/archify), the Atlassian `triage-issue` skill | Apache-2.0 | `mstack-backlog-triage` |
| [Anthropic skills](https://github.com/anthropics/skills) and [OpenAI skills](https://github.com/openai/skills) (their `skill-creator`) | Apache-2.0 | `mstack-skill-creator` |
| [Anthropic skills](https://github.com/anthropics/skills) (the deep-researcher template of its `claude-api` skill) | Apache-2.0 | `mstack-research` |
| [MiMo-Code](https://github.com/XiaomiMiMo/MiMo-Code), [daymade/claude-code-skills](https://github.com/daymade/claude-code-skills), [samber/cc-skills](https://github.com/samber/cc-skills), [open_deep_research](https://github.com/langchain-ai/open_deep_research) | MIT | `mstack-research` |
| [open-seo](https://github.com/every-app/open-seo) (its `simple-issue-description` skill), [zlliang/skills](https://github.com/zlliang/skills) | MIT | `mstack-write-issue` |
| [glebis/claude-skills](https://github.com/glebis/claude-skills) (the `anon` skill of its `confide` plugin) | MIT | `mstack-anonymize` (ideas only) |
| [digital-stoic-org/agent-skills](https://github.com/digital-stoic-org/agent-skills) (its `anonymize-doc` skill) | MIT | `mstack-anonymize` (an idea only) |
| [hallmark](https://github.com/Nutlope/hallmark), [emilkowalski/skills](https://github.com/emilkowalski/skills), [make-interfaces-feel-better](https://github.com/jakubkrehel/make-interfaces-feel-better), [ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill), [taste-skill](https://github.com/Leonxlnx/taste-skill), [web-interface-guidelines](https://github.com/vercel-labs/web-interface-guidelines), [benjitaylor/skills](https://github.com/benjitaylor/skills) (its `stageshow` skill) | MIT | `mstack-web-ui` (ideas only) |
| [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) (its `react-best-practices` and `composition-patterns` skills) | MIT, stated in its README; no license file | `mstack-web-ui` (ideas only, the React part) |
| [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/) and [Understanding WCAG 2.2](https://www.w3.org/WAI/WCAG22/Understanding/), by W3C | W3C Software and Document License (2023) | `mstack-web-ui` (the roles and keys of components, moving content; rewritten) |
| [magicui](https://github.com/magicuidesign/magicui), [anime](https://github.com/juliangarnier/anime) | MIT | `mstack-web-ui` (ideas only, the motion part) |
| [react-bits](https://github.com/DavidHDev/react-bits) | MIT with the Commons Clause | `mstack-web-ui` (ideas only, no code) |
| [component-gallery](https://github.com/inbn/component-gallery) | No license stated | `mstack-web-ui` (the idea of a part on component choice; nothing copied) |
| [SkillForge](https://github.com/tripleyak/SkillForge) | MIT | `mstack-skill-creator` (an idea only) |
| [ui-ux-pro-max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | MIT | the three workflows (usage notes only) |

The skills also use, without copying from them: [codegraph](https://github.com/colbymchenry/codegraph), [ponytail](https://github.com/DietrichGebert/ponytail), [skill-codex](https://github.com/skills-directory/skill-codex), the [OpenAI Codex plugin for Claude Code](https://github.com/openai/codex-plugin-cc), the [skills CLI](https://github.com/vercel-labs/skills) and [archify](https://github.com/tt-a1i/archify). `mstack-setup` installs them, except the skills CLI and skill-codex.

## License

Apache-2.0. See [LICENSE](./LICENSE).
