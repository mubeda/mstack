# mstack

Daily-driver agent skills, packaged as a plugin marketplace that **Claude Code** and **OpenAI Codex CLI** both read natively.

One marketplace, one canonical `SKILL.md` per skill, two manifest types per plugin.

The repository is [`github.com/mubeda/mstack`](https://github.com/mubeda/mstack).

## What's inside

| Plugin | What it does | Hosts |
|---|---|---|
| [`mstack-codex-review-workflow`](./plugins/mstack-codex-review-workflow) | Claude-led coordinator for any task, from a list of issues, an execution plan, or one larger task. Parallel worktree agents or one agent in sequence, a live open, in progress and closed status table, advisor and read-only Codex reviews, one PR, serialized CI. | Claude Code |
| [`mstack-claude-review-workflow`](./plugins/mstack-claude-review-workflow) | The same workflow with the roles swapped. Codex leads and implements in parallel `codex exec` lanes in git worktrees (or alone, one item after another), and Claude reviews every lane read-only. | Codex CLI |
| [`mstack-diagnose`](./plugins/mstack-diagnose) | Find and prove the cause of a crash, bug, regression, flaky failure, slowdown, hang or leak, with graded evidence and a regression test before any fix. One skill, shared by both hosts. | Claude Code and Codex CLI |
| [`mstack-write-specs`](./plugins/mstack-write-specs) | Interview until every decision is settled, then write an approved, testable spec: EARS requirements with a scenario each, a quality checklist and an independent read. One skill, shared by both hosts. | Claude Code and Codex CLI |
| [`mstack-plan`](./plugins/mstack-plan) | Turn an approved spec into a reviewed, test-first implementation plan: phases and red-green tasks sized for one agent session, the best skills named for every task, a cross-vendor review, a shared progress file, and an `execute-plan.md` that starts inline or workflow execution. One skill, shared by both hosts. | Claude Code and Codex CLI |

Each plugin can be installed on its own. The two workflows share their reference files, and `scripts/check-marketplace.mjs` fails if the copies drift apart.

The plugins also work together. `mstack-write-specs` writes the spec, `mstack-plan` turns it into a plan folder, and either workflow executes that folder, task by task, writing progress into the plan's `progress.md`, so execution can switch between inline and a workflow and resume where it stopped. All three plugins ship the same `plan-format.md`.

`mstack-plan` needs `node` and `git`, plus the cross-vendor reviewer of its host: in Claude Code the `codex` skill from skill-codex with a logged-in `codex` CLI, and in Codex the agent-bridges `claude` plugin with a logged-in `claude` CLI.

`mstack-codex-review-workflow` carries its working rules (style, writing, review, grilling, external research, web UI checks) in its own reference files, and bug lanes use `mstack-diagnose`. It needs `ponytail`, `mstack-diagnose` and the `codex` skill from [skill-codex](https://github.com/skills-directory/skill-codex) with a logged-in `codex` CLI, plus `gh` for GitHub work and `ui-ux-pro-max` with Python 3 for web UI work. Its preflight checks them and prints install commands.

`mstack-claude-review-workflow` carries the same reference files. It needs `ponytail`, `mstack-diagnose`, the `claude-review` skill from the `claude` plugin of [agent-bridges](https://github.com/mubeda/agent-bridges), `node`, and a logged-in `claude` CLI, plus `gh` for GitHub work and `ui-ux-pro-max` with Python 3 for web UI work. Codex's sandbox blocks some of its commands (git writes, and network for lanes and reviews), so the run asks you to approve them.

## Install in Claude Code

```bash
/plugin marketplace add mubeda/mstack
```

Then install the plugins you want and reload:

```bash
/plugin install mstack-codex-review-workflow@mstack
/plugin install mstack-diagnose@mstack
/plugin install mstack-write-specs@mstack
/plugin install mstack-plan@mstack
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

## Install in Codex CLI

The native Codex manifest is [`.agents/plugins/marketplace.json`](.agents/plugins/marketplace.json).

```bash
codex plugin marketplace add mubeda/mstack
codex plugin add mstack-claude-review-workflow@mstack
codex plugin add mstack-diagnose@mstack
codex plugin add mstack-write-specs@mstack
codex plugin add mstack-plan@mstack
```

The Claude reviewer of the workflow and of `mstack-plan` comes from another marketplace:

```bash
codex plugin marketplace add https://github.com/mubeda/agent-bridges.git
codex plugin add claude@agent-bridges
```

Or launch `codex` and browse with `/plugins`. Codex has no auto-update; refresh with `codex plugin marketplace upgrade mstack`, then run `codex plugin add` again for each plugin you use.

`mstack-codex-review-workflow` is not published for Codex, because it drives Claude Code's subagent tools. Codex users install `mstack-claude-review-workflow` instead.

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

A project install goes into `.agents/skills/` and `.claude/skills/` and is recorded in `skills-lock.json`. A global install goes into `~/.agents/skills/`, which Codex reads, with a link in `~/.claude/skills/` for Claude Code. Keep skills current with `npx skills update`, list them with `npx skills ls`, and remove one with `npx skills remove <skill>`.

Install the workflow that matches the agent: `mstack-codex-review-workflow` for Claude Code, `mstack-claude-review-workflow` for Codex. The Codex workflow's Claude reviewer, the agent-bridges `claude` plugin, has to be installed as a plugin, because its skill runs a script from the plugin's root folder.

When a skill finds a missing dependency, it asks whether to install it as a plugin or with the skills CLI, and for the skills CLI it asks the scope, the method and the agents before it runs anything.

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
