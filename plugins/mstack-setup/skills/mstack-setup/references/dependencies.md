# Dependencies

One row per ID that `scripts/check-setup.mjs` reports. Every install is at user scope, for every project of the user, and writes nothing into the current repository. Every command below runs the same on Linux, macOS and Windows (PowerShell or cmd); none needs a POSIX shell.

Run each command on its own, in the order of the table, and only after the user's yes.

## Mandatory

| ID | For | Claude Code | Codex |
|---|---|---|---|
| `node` | runs every skill's scripts | none: install from https://nodejs.org or the system package manager | same |
| `git` | every repository step | none: install from https://git-scm.com/downloads or the system package manager | same |
| `codegraph-cli` | the code index the code-reading skills use | `npm i -g @colbymchenry/codegraph` | same |
| `codegraph-connected` | lets the host query the index | `codegraph install --yes --target=claude` | `codegraph install --yes --target=codex` |
| `ponytail` | the code style every mstack skill follows | `claude plugin marketplace add DietrichGebert/ponytail`, then `claude plugin install ponytail@ponytail --scope user` | `codex plugin marketplace add DietrichGebert/ponytail`, then `codex plugin add ponytail@ponytail`; then the user trusts its hooks (manual step) |
| `reviewer-plugin` | the cross-vendor reviewer | skill-codex: `claude plugin marketplace add skills-directory/skill-codex`, then `claude plugin install skill-codex@skill-codex --scope user` | agent-bridges `claude`, plugin route only (the skill runs a script the skills command does not install): `codex plugin marketplace add https://github.com/mubeda/agent-bridges.git`, then `codex plugin add claude@agent-bridges` |
| `reviewer-cli` | the reviewer's command-line tool | `npm install -g @openai/codex` | `npm install -g @anthropic-ai/claude-code` |
| `reviewer-login` | the reviewer can run | manual step: `codex login`, then `codex login status` | manual step: `claude auth login`, then `claude auth status` |
| `mstack-find-skills`, `mstack-best-model-for`, `mstack-setup` | skills the other mstack skills call | `claude plugin marketplace add mubeda/mstack` (once), then `claude plugin install <id>@mstack --scope user` | `codex plugin marketplace add mubeda/mstack` (once), then `codex plugin add <id>@mstack` |

What `codegraph install --yes --target=<host>` writes, to tell the user before the yes:

- Claude Code: a `codegraph` entry under `mcpServers` in `.claude.json` in the home folder, a marked codegraph section in the user's `CLAUDE.md`, and an allow rule for the codegraph tools in the user's Claude Code `settings.json`.
- Codex: a `[mcp_servers.codegraph]` entry in `config.toml` in the Codex home folder (`CODEX_HOME`, default `.codex` in the home folder), and a marked codegraph section in the user's `AGENTS.md`.

It indexes no code. The code-reading skills build each repository's index themselves.

## Optional

| ID | For | Claude Code | Codex |
|---|---|---|---|
| `ui-ux-pro-max` | web and UI work | `claude plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill`, then `claude plugin install ui-ux-pro-max@ui-ux-pro-max-skill --scope user` (it also installs six companion design skills) | no plugin: `npm install -g ui-ux-pro-max-cli`, then `uipro init --ai codex --global`. Where that puts the skill was not verified; check with `uipro init --ai codex --global --dry-run` first |
| `gh` | GitHub issues and pull requests | none: install from https://cli.github.com, then the user runs `gh auth login` | same |
| `python3` | `ui-ux-pro-max`'s search script | none: install from https://www.python.org/downloads/ or the system package manager | same |
| `mstack-plan`, `mstack-write-specs`, `mstack-brainstorm`, `mstack-diagnose`, `mstack-backlog-triage`, `mstack-handoff`, `mstack-skill-creator` | the other mstack skills | `claude plugin install <id>@mstack --scope user`, after the marketplace line above | `codex plugin add <id>@mstack`, after the marketplace line above |
| `mstack-codex-review-workflow` | plan execution with Codex review | `claude plugin install mstack-codex-review-workflow@mstack --scope user` | not for this host |
| `mstack-claude-review-workflow` | plan execution with Claude review | not for this host | `codex plugin add mstack-claude-review-workflow@mstack` |
| `mstack-claude-pm-codex-dev` | plan execution with Codex as the developer and Claude reviewing | `claude plugin install mstack-claude-pm-codex-dev@mstack --scope user` | not for this host |
| `codex-plugin` | Codex as the developer in `mstack-claude-pm-codex-dev` | `claude plugin marketplace add openai/codex-plugin-cc`, then `claude plugin install codex@openai-codex --scope user`, then the user runs `/codex:setup` | not for this host |

A skill without a plugin for the host would go through the skills command with its global option (`npx skills add <source> --skill <skill> -g -a <claude-code|codex> -y`). Every skill above has a plugin for the host it is offered on, except `ui-ux-pro-max` on Codex, which has its own installer.

## Manual steps

Only the user can do these. Name each with its command in the final report.

- Logins: `codex login` (Claude Code host), `claude auth login` (Codex host).
- ponytail on Codex: open `/hooks` in Codex and trust ponytail's hooks.
- A new session: every skill or plugin installed during this session loads only in a new session.
- `node`, `git`, `gh`, Python 3: install from the vendor's page or the system package manager.
