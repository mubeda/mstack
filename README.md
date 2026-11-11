# mstack

Daily-driver agent skills, packaged as a plugin marketplace that **Claude Code** and **OpenAI Codex CLI** both read natively.

One marketplace, one canonical `SKILL.md` per skill, two manifest types per plugin.

The repository is [`github.com/mubeda/mstack`](https://github.com/mubeda/mstack).

## What's inside

| Plugin | What it does | Hosts |
|---|---|---|
| [`mstack-codex-review-workflow`](./plugins/mstack-codex-review-workflow) | Claude-led coordinator for any task, from a list of issues, an execution plan, or one larger task. Parallel worktree agents or one agent in sequence, a live open, in progress and closed status table, advisor and read-only Codex reviews, one PR, serialized CI. | Claude Code |
| [`mstack-claude-review-workflow`](./plugins/mstack-claude-review-workflow) | The same workflow with the roles swapped. Codex leads and implements in parallel `codex exec` lanes in git worktrees (or alone, one item after another), and Claude reviews every lane read-only. | Codex CLI |
| [`mstack-claude-pm-codex-dev`](./plugins/mstack-claude-pm-codex-dev) | Claude manages and Codex writes the code. Claude briefs one Codex developer per phase through the OpenAI Codex plugin, reads each diff, reruns the validation, gets the advisor's and a read-only Codex review (labelled same-vendor, since Codex wrote the code), sends findings back to the same Codex thread, and commits each accepted phase. One PR, serialized CI. | Claude Code |
| [`mstack-diagnose`](./plugins/mstack-diagnose) | Find and prove the cause of a crash, bug, regression, flaky failure, slowdown, hang or leak, with graded evidence and a regression test before any fix. One skill, shared by both hosts. | Claude Code and Codex CLI |
| [`mstack-brainstorm`](./plugins/mstack-brainstorm) | Turn an unformed idea into a design brief you approved: reads first, asks open questions until the reason is known, then numbered rounds, lays out whole-shape approaches, and has an ideas mode that generates before it judges. Hands the brief to `mstack-write-specs`. One skill, shared by both hosts. | Claude Code and Codex CLI |
| [`mstack-write-specs`](./plugins/mstack-write-specs) | Interview until every decision is settled, then write an approved, testable spec: EARS requirements with a scenario each, a quality checklist and an independent read. One skill, shared by both hosts. | Claude Code and Codex CLI |
| [`mstack-plan`](./plugins/mstack-plan) | Turn an approved spec into a reviewed, test-first implementation plan: phases and red-green tasks sized for one agent session, the best skills named for every task, a cross-vendor review (with a same-vendor fallback), a shared progress file, and an `execute-plan.md` that starts inline or workflow execution. One skill, shared by both hosts. | Claude Code and Codex CLI |
| [`mstack-handoff`](./plugins/mstack-handoff) | Write one resumable handoff file (branch, HEAD, uncommitted paths, pull request, gates with exact commands, decisions, next commands first) so a fresh session continues long work, and resume from it. Never commits, stashes or leaks secrets. One skill, shared by both hosts. | Claude Code and Codex CLI |
| [`mstack-backlog-triage`](./plugins/mstack-backlog-triage) | Read every open issue, classify each with evidence, check for duplicates, and sort them into now, next and defer, as a table the workflows accept. Drafts comments and labels, and posts only approved text. One skill, shared by both hosts. | Claude Code and Codex CLI |
| [`mstack-skill-creator`](./plugins/mstack-skill-creator) | Create or improve a skill that Claude Code, Codex, OpenCode and Cursor all load: an interview, a check for an existing skill, portable writing rules, a static check and a test with and without the skill. In a repository like this one it also packages the plugin, runs the checks and gets a cross-vendor review. | Claude Code, Codex CLI, OpenCode and Cursor (the last two with the skills CLI) |
| [`mstack-find-skills`](./plugins/mstack-find-skills) | Find the skills that fit a job: installed skills scored per task first, then vetted public candidates from skills.sh for the gaps only (audits, installs, license, the skill's own text), installed only after your yes. The other skills call it for their tasks. | Claude Code and Codex CLI |
| [`mstack-best-model-for`](./plugins/mstack-best-model-for) | Pick the model and effort for a task or a tier, for Claude or Codex, from one dated table, with the exact setting, a reason and the next step if the result falls short. The other skills call it before they start a subagent, a lane or a reviewer. | Claude Code and Codex CLI |
| [`mstack-receive-review`](./plugins/mstack-receive-review) | Process any code review as claims to check: label and merge findings, verify each against the code, fix what holds test-first and everywhere the same mistake sits, reject what does not with evidence, keep your recorded decisions, and log every outcome with a drafted reply. Posts nothing. The other skills call it for every review. | Claude Code and Codex CLI |
| [`mstack-setup`](./plugins/mstack-setup) | Check and install what the mstack skills need, at user scope, on Linux, macOS and Windows: codegraph, ponytail, the cross-vendor reviewer and the mstack skills, from one list after one yes. | Claude Code and Codex CLI |
| [`mstack-chief-of-staff`](./plugins/mstack-chief-of-staff) | Own a long-running goal (a release, a backlog, a multi-step project) across many sessions: a wiki of dated claims that every session starts from, a commit beside every claim about code, superseded claims kept, a lint script, work delegated through briefs that point at files, and every procedure run through the other mstack skills. One skill, shared by both hosts. | Claude Code and Codex CLI |

Each plugin can be installed on its own. The three workflows share their reference files (the review rules live in `mstack-receive-review`), and `scripts/check-marketplace.mjs` fails if the copies drift apart.

The plugins also work together. `mstack-backlog-triage` picks what to work on and routes each issue, `mstack-brainstorm` turns an unformed idea into an approved design brief, `mstack-write-specs` writes the spec (from that brief, without asking its settled decisions again), `mstack-plan` turns it into a plan folder, and any of the three workflows executes that folder, task by task, writing progress into the plan's `progress.md`, so execution can switch between inline and a workflow and resume where it stopped. When a session runs out before the work does, `mstack-handoff` writes the file the next session starts from. For a goal that takes many sessions, `mstack-chief-of-staff` owns it: it keeps the goal, its decisions and its history in a wiki of dated claims, starts every session from that wiki, and runs each procedure through the skills above. It requires none of them: when one is missing it says so, names `mstack-setup`, skips only that route and keeps going. `mstack-skill-creator` builds new skills with the same chain: it uses each of these skills for its step when it is installed, and a short built-in version when it is not, except the shared skills `mstack-find-skills` and `mstack-best-model-for`, which it requires in Claude Code and Codex. `mstack-plan` and the three workflows ship the same `plan-format.md`.

Four shared skills do the jobs the others have in common. `mstack-receive-review` processes every review, `mstack-find-skills` finds the skills for each task, `mstack-best-model-for` picks every subagent's, lane's and reviewer's model and effort (`mstack-chief-of-staff` falls back to the host's default model when it is not installed, and says so), and `mstack-setup` installs dependencies. `mstack-plan`, the three workflows and `mstack-skill-creator` (in Claude Code and Codex) require `mstack-find-skills` and `mstack-best-model-for`, and `mstack-plan` and the three workflows also require `mstack-receive-review`; `mstack-diagnose`, `mstack-write-specs`, `mstack-brainstorm` and `mstack-backlog-triage` require `mstack-best-model-for`. A skill whose required shared skill is missing stops before any work and prints the install commands and the name `mstack-setup`.

The skills that read code (`mstack-plan`, `mstack-write-specs`, `mstack-diagnose`, `mstack-backlog-triage` and the three workflows) refresh a [codegraph](https://github.com/colbymchenry/codegraph) index of the repository when codegraph is installed, and use it to find code. Without codegraph they read code as before. They never install it; `mstack-setup` does.

`mstack-plan` needs `node`, `git`, `mstack-find-skills`, `mstack-best-model-for` and `mstack-receive-review`, and recommends the cross-vendor reviewer of its host: in Claude Code the `codex` skill from skill-codex with a logged-in `codex` CLI, and in Codex the agent-bridges `claude` plugin with a logged-in `claude` CLI.

`mstack-codex-review-workflow` carries its working rules (style, writing, grilling, external research, web UI checks) in its own reference files, processes every review with `mstack-receive-review`, and bug lanes use `mstack-diagnose`. It needs `ponytail`, `mstack-diagnose`, `mstack-find-skills`, `mstack-best-model-for` and `mstack-receive-review`, plus `gh` for GitHub work and `ui-ux-pro-max` with Python 3 for web UI work, and recommends the `codex` skill from [skill-codex](https://github.com/skills-directory/skill-codex) with a logged-in `codex` CLI. Its preflight checks them and names `mstack-setup` for whatever is missing.

`mstack-claude-review-workflow` carries the same reference files. It needs `ponytail`, `mstack-diagnose`, `mstack-find-skills`, `mstack-best-model-for`, `mstack-receive-review` and `node`, plus `gh` for GitHub work and `ui-ux-pro-max` with Python 3 for web UI work, and recommends the `claude-review` skill from the `claude` plugin of [agent-bridges](https://github.com/mubeda/agent-bridges) with a logged-in `claude` CLI. Codex's sandbox blocks some of its commands (git writes, and network for lanes and reviews), so the run asks you to approve them.

`mstack-claude-pm-codex-dev` carries the same reference files too. It needs the [OpenAI Codex plugin for Claude Code](https://github.com/openai/codex-plugin-cc) (its `codex:codex-rescue` agent is the developer channel) with a logged-in `codex` CLI, `ponytail`, `mstack-diagnose`, `mstack-best-model-for` and `mstack-receive-review` on the Codex side (the developer loads them), and `mstack-find-skills`, `mstack-best-model-for` and `mstack-receive-review` on the Claude side, plus `gh` for GitHub work and `ui-ux-pro-max` on the Codex side for web UI work. Its preflight checks them and names `mstack-setup` for whatever is missing. It runs one developer at a time in your checkout, and it commits only phases it reviewed.

When a skill's cross-vendor reviewer is not installed, the skill warns you and runs the same review with a fresh, read-only subagent of the AI you are using. That same-vendor review tends to miss more, so every report marks it.

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
/plugin install mstack-setup@mstack
/plugin install mstack-receive-review@mstack
/plugin install mstack-chief-of-staff@mstack
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

From marketplace version 0.4.0 the other skills require the shared skills `mstack-find-skills` and `mstack-best-model-for`, and stop until they are installed (`mstack-chief-of-staff` requires none: it names a missing skill and goes on). Install them with the lines above, or install `mstack-setup` and run it, which installs everything missing after one yes. From marketplace version 0.5.0, `mstack-plan` and the three workflows also require `mstack-receive-review`.

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
codex plugin add mstack-setup@mstack
codex plugin add mstack-receive-review@mstack
codex plugin add mstack-chief-of-staff@mstack
```

The Claude reviewer of the workflow and of `mstack-plan` comes from another marketplace:

```bash
codex plugin marketplace add https://github.com/mubeda/agent-bridges.git
codex plugin add claude@agent-bridges
```

Or launch `codex` and browse with `/plugins`. Codex has no auto-update; refresh with `codex plugin marketplace upgrade mstack`, then run `codex plugin add` again for each plugin you use. From marketplace version 0.4.0 the other skills require `mstack-find-skills` and `mstack-best-model-for` (`mstack-chief-of-staff` requires none), and from 0.5.0 `mstack-plan` and `mstack-claude-review-workflow` also require `mstack-receive-review`; `mstack-setup` installs whatever is missing.

`mstack-codex-review-workflow` and `mstack-claude-pm-codex-dev` are not published for Codex, because they drive Claude Code's subagent tools (the second also drives the Codex plugin for Claude Code). Codex users install `mstack-claude-review-workflow` instead.

## Install with the skills CLI

Every skill also installs with the [skills CLI](https://github.com/vercel-labs/skills) (`npx skills`), for Claude Code, Codex and the other agents it supports. It installs only the skill folder, which carries everything the skill needs, including its license and third-party notices.

```bash
npx skills add mubeda/mstack
```

In a terminal it asks which skills to install, for which agents, whether to install them in this project or globally, and whether to symlink or copy them. To choose up front instead:

| Choice | Flag |
|---|---|
| Only some skills | `--skill mstack-plan mstack-write-specs` |
| The agents | `-a claude-code`, `-a codex`, or `-a claude-code codex` |
| Global (your home folder) instead of this project | `-g` |
| Copy instead of symlink | `--copy` |
| No prompts | `-y` |

```bash
npx skills add mubeda/mstack --skill mstack-plan mstack-diagnose -a claude-code codex -g -y
```

Add the shared skills the others require, `mstack-find-skills`, `mstack-best-model-for` and `mstack-receive-review`, and `mstack-setup` for the other dependencies:

```bash
npx skills add mubeda/mstack --skill mstack-find-skills mstack-best-model-for mstack-receive-review mstack-setup -a claude-code codex -g -y
```

A project install goes into `.agents/skills/` and `.claude/skills/` and is recorded in `skills-lock.json`. A global install goes into `~/.agents/skills/`, which Codex reads, with a link in `~/.claude/skills/` for Claude Code. OpenCode and Cursor install mstack skills this way only. Both load the shared `.agents/skills/` folder at project level and `~/.agents/skills/` globally, where the skills CLI writes:

```bash
npx skills add mubeda/mstack --skill mstack-skill-creator -a opencode cursor
```

`mstack-skill-creator` runs on all four hosts. The other skills are written for Claude Code and Codex.

Keep skills current with `npx skills update`, list them with `npx skills ls`, and remove one with `npx skills remove <skill>`.

Install the workflow that matches the agent: `mstack-codex-review-workflow` or `mstack-claude-pm-codex-dev` for Claude Code, `mstack-claude-review-workflow` for Codex. The Codex workflow's Claude reviewer, the agent-bridges `claude` plugin, has to be installed as a plugin, because its skill runs a script from the plugin's root folder.

When a skill finds a missing dependency, it names `mstack-setup`, which installs everything at user scope after one yes. `mstack-find-skills` installs a skill it found only after asking whether to install it as a plugin or with the skills CLI, and for the skills CLI the scope, the method and the agents.

## Repository layout

```
mstack/
├── .claude-plugin/marketplace.json   # Claude Code marketplace (also legacy-readable by Codex)
├── .agents/plugins/marketplace.json  # Codex CLI native marketplace
├── plugins/<plugin>/
│   ├── .claude-plugin/plugin.json    # Claude Code manifest
│   ├── .codex-plugin/plugin.json     # Codex manifest (omitted for Claude-only plugins)
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

## Why one repo works for both hosts

`SKILL.md` follows the open [Agent Skills](https://agentskills.io) format (a folder with `name:` and `description:` frontmatter plus optional `scripts/`, `references/`, `assets/`), which Claude Code, Codex CLI and many other agents read without translation. Each plugin is a thin wrapper around one or more skill folders, and the two manifest files tell each host where to find them. `skills.sh.json` points the skills CLI at the same folders, so a skill installed either way is the same files.

## Adding a skill

1. Put the skill at `plugins/<plugin>/skills/<skill>/SKILL.md`, with a copy of the root `LICENSE` and a `THIRD_PARTY_NOTICES.md` next to it. Keep everything the skill needs inside that folder, because the skills CLI installs only the folder, and name any `SKILL.md` used as test data `SKILL.md.fixture`.
2. Create `plugins/<plugin>/.claude-plugin/plugin.json`, and `plugins/<plugin>/.codex-plugin/plugin.json` (with `"skills": "./skills/"` and an `interface` block) if it works in Codex.
3. Register it in `.claude-plugin/marketplace.json` and, for Codex, `.agents/plugins/marketplace.json` (`source: {source: "local", path: ...}`, `policy`, `category`), and add a row to the table above.
4. Run the checks listed in [`AGENTS.md`](./AGENTS.md) › Before every commit.

Skills here are for anyone: no personal names, machine paths, company or project data. See `AGENTS.md`.

## License

Apache-2.0. See [LICENSE](./LICENSE).
