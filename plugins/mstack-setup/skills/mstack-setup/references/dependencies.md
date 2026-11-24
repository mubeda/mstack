# Dependencies

One row per ID that `scripts/check-setup.mjs` reports. Every install is at user scope, for every project of the user, and writes nothing into the current repository. Every command below runs the same on Linux, macOS and Windows (PowerShell or cmd); none needs a POSIX shell.

Run each command on its own, in the order of the table, and only after the user's yes.

In Antigravity a plugin is installed with `agy plugin install <address>`, one plugin per command, at user scope. The status looks for skills in `~/.gemini/config/skills/` and in the plugin folders under `~/.gemini/config/plugins/`, and nowhere else: `~/.agents/skills/` is no global folder for Antigravity. Never propose or run `agy plugin import`: it imports every Claude Code plugin of the machine, which the user did not ask for.

## Mandatory

| ID | For | Claude Code | Codex | Antigravity |
|---|---|---|---|---|
| `node` | runs every skill's scripts | none: install from https://nodejs.org or the system package manager | same | same |
| `git` | every repository step | none: install from https://git-scm.com/downloads or the system package manager | same | same |
| `codegraph-cli` | the code index the code-reading skills use | `npm i -g @colbymchenry/codegraph` | same | same |
| `codegraph-connected` | lets the host query the index | `codegraph install --yes --target=claude` | `codegraph install --yes --target=codex` | `codegraph install --yes --target=antigravity` |
| `ponytail` | the code style every mstack skill follows | `claude plugin marketplace add DietrichGebert/ponytail`, then `claude plugin install ponytail@ponytail --scope user` | `codex plugin marketplace add DietrichGebert/ponytail`, then `codex plugin add ponytail@ponytail`; then the user trusts its hooks (manual step) | `agy plugin install https://github.com/DietrichGebert/ponytail` (its skills only: its hooks do not run in Antigravity) |
| `mstack-find-skills`, `mstack-best-model-for`, `mstack-receive-review`, `mstack-research`, `mstack-setup` | skills the other mstack skills call | `claude plugin marketplace add mubeda/mstack` (once), then `claude plugin install <id>@mstack --scope user` | `codex plugin marketplace add mubeda/mstack` (once), then `codex plugin add <id>@mstack` | `agy plugin install https://github.com/mubeda/mstack/tree/main/plugins/<id>`: one whole command per missing plugin, with the plugin's name in place of `<id>` (for `mstack-research` the line ends in `/plugins/mstack-research`); there is no marketplace line |

What `codegraph install --yes --target=<host>` writes, to tell the user before the yes:

- Claude Code: a `codegraph` entry under `mcpServers` in `.claude.json` in the home folder, a marked codegraph section in the user's `CLAUDE.md`, and an allow rule for the codegraph tools in the user's Claude Code `settings.json`.
- Codex: a `[mcp_servers.codegraph]` entry in `config.toml` in the Codex home folder (`CODEX_HOME`, default `.codex` in the home folder), and a marked codegraph section in the user's `AGENTS.md`.
- Antigravity: a `codegraph` entry under `mcpServers` in Antigravity's MCP settings file. Which file that is depends on the machine, so run `codegraph install --print-config antigravity` first (it writes nothing) and name the file its first line gives: `mcp_config.json` in `~/.gemini/config/`, or in the older folder `~/.gemini/antigravity/` on a machine that has not moved to the new one. When the tool is not installed yet, so that command cannot run, name both folders as the possible places. Say also these two things. When the command writes the file in `~/.gemini/config/`, it removes a `codegraph` entry it finds in the older file. A settings file it cannot read as JSON is replaced, after a copy with `.backup` added to its name is left beside it. (Read in the source of codegraph 1.6.3 on 2026-11-24; no install was run for it.)

It indexes no code. The code-reading skills build each repository's index themselves.

## What a calling skill needs

A skill that calls `mstack-setup` names the rows it needs in a `Needs:` line (`SKILL.md` › Two modes). A name is a row ID of the two tables in this file, or one of two groups:

| Group | Rows | For a caller that |
|---|---|---|
| `reviewer` | the vendor rows of the host: `codex-cli` and `codex-login` in Claude Code, `claude-cli` and `claude-login` in Codex, all four in Antigravity | starts a reviewer of another vendor |
| `codegraph` | `codegraph-cli`, `codegraph-connected` | reads code through the code index |

A channel is ready when a vendor's `-cli` row and its `-login` row are both `ok`. One ready channel meets the group `reviewer`: the rows of the first ready channel block, and the other vendor rows are reported and block nothing. When no channel is ready, no vendor row blocks either: the rows are reported as they are, and the caller reviews with its fallback, a fresh subagent of its own vendor. So the group `reviewer` never stops a caller. A ready channel says only that the client is installed and signed in. Whether that vendor can review a given piece of work depends on who leads and who wrote it, and `mstack-vendors` answers that; this skill never does.

The vendor rows are optional on every host: the mstack skills work with one client installed, and a review by another vendor falls back to a fresh subagent of the same vendor. Without a `Needs:` line the vendor rows block nothing and never fail the status; only a caller that names a vendor row by its ID is stopped by it, and only a skill built for one pairing does that (one in which that vendor writes the code). A general caller that starts a reviewer of another vendor names the group `reviewer`, which never stops it. `node` always blocks, because the check itself runs on it. A caller that starts no reviewer and reads no code names neither group, and a client that is not signed in then does not stop it. When a row of a group is renamed or added, the group changes here and in `scripts/check-setup.mjs`, and no caller changes.

## Optional

| ID | For | Claude Code | Codex | Antigravity |
|---|---|---|---|---|
| `codex-cli` | the channel to `codex`: a second opinion from another vendor for the planning and review workflows, which review with a fresh subagent of the same vendor without one | `npm install -g @openai/codex` | not for this host | a step for the user, which this skill never runs in Antigravity: `npm install -g @openai/codex` |
| `codex-login` | the `codex` client is signed in | manual step: `codex login`, then `codex login status` | not for this host | manual step: `codex login`, then `codex login status` |
| `claude-cli` | the channel to `claude`, for the same use | not for this host | `npm install -g @anthropic-ai/claude-code` | a step for the user, which this skill never runs in Antigravity: `npm install -g @anthropic-ai/claude-code` |
| `claude-login` | the `claude` client is signed in | not for this host | manual step: `claude auth login`, then `claude auth status` | manual step: `claude auth login`, then `claude auth status` |
| `ui-ux-pro-max` | web and UI work | `claude plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill`, then `claude plugin install ui-ux-pro-max@ui-ux-pro-max-skill --scope user` (it also installs six companion design skills) | no plugin: `npm install -g ui-ux-pro-max-cli`, then `uipro init --ai codex --global`. Where that puts the skill was not verified; check with `uipro init --ai codex --global --dry-run` first | none: not available in Antigravity (a warning row that does not count against the setup) |
| `archify` | the diagrams `mstack-explain-me-better` offers | no plugin: `npx -y skills@latest add https://archify.si --skill archify --agent claude-code --global --copy --yes` | no plugin: `npx -y skills@latest add https://archify.si --skill archify --agent codex --global --copy --yes` | a step for the user, which this skill never runs in Antigravity (the yes covers only the code-index install, its connect command and `agy plugin install`): `npx -y skills@latest add https://archify.si --skill archify --agent antigravity --global --copy --yes` |
| `gh` | GitHub issues and pull requests | none: install from https://cli.github.com, then the user runs `gh auth login` | same | same |
| `python3` | `ui-ux-pro-max`'s search script | none: install from https://www.python.org/downloads/ or the system package manager | same | same |
| `mstack-plan`, `mstack-write-specs`, `mstack-brainstorm`, `mstack-diagnose`, `mstack-backlog-triage`, `mstack-handoff`, `mstack-skill-creator`, `mstack-chief-of-staff`, `mstack-explain-me-better`, `mstack-product-plan`, `mstack-epic`, `mstack-evidence`, `mstack-decisions`, `mstack-auto`, `mstack-write-issue`, `mstack-anonymize`, `mstack-web-ui`, `mstack-vendors` | the other mstack skills | `claude plugin install <id>@mstack --scope user`, after the marketplace line above | `codex plugin add <id>@mstack`, after the marketplace line above | `agy plugin install https://github.com/mubeda/mstack/tree/main/plugins/<id>`, one whole command per missing plugin as above |
| `mstack-codex-review-workflow` | plan execution with Codex review | `claude plugin install mstack-codex-review-workflow@mstack --scope user` | not for this host | not for this host |
| `mstack-claude-review-workflow` | plan execution with Claude review | not for this host | `codex plugin add mstack-claude-review-workflow@mstack` | not for this host |
| `mstack-claude-pm-codex-dev` | plan execution with Codex as the developer and Claude reviewing | `claude plugin install mstack-claude-pm-codex-dev@mstack --scope user` | not for this host | not for this host |
| `codex-plugin` | Codex as the developer in `mstack-claude-pm-codex-dev` | `claude plugin marketplace add openai/codex-plugin-cc`, then `claude plugin install codex@openai-codex --scope user`, then the user runs `/codex:setup` | not for this host | not for this host |

A skill without a plugin for the host would go through the skills command with its global option (`npx skills add <source> --skill <skill> -g -a <agent> -y`, where `<agent>` is `claude-code`, `codex` or `antigravity`). Every skill above has a plugin for the host it is offered on, except `ui-ux-pro-max` on Codex, which has its own installer, and `archify`, which installs with the skills command on all three hosts (in Antigravity as a step for the user) (the command is the one its own install file gives, read 2026-11-11).

## Manual steps

Only the user can do these. Name each with its command in the final report.

- Logins: `codex login` for a `codex-login` row (Claude Code and Antigravity hosts), `claude auth login` for a `claude-login` row (Codex and Antigravity hosts).
- ponytail on Codex: open `/hooks` in Codex and trust ponytail's hooks.
- A new session: every skill or plugin installed during this session loads only in a new session. In Antigravity that holds after every `agy plugin install`.
- In Antigravity, a vendor row that was not checked because the run outside the sandbox was not approved (`SKILL.md` section 1; the script is then run with `--vendors not-checked`): no step and no command; its state is `not checked`.
- A `LOGIN` row whose detail starts with "sign-in could not be checked": the client's status command did not complete (it could not start, gave no answer in time or was ended), or it exited 0 with an answer the script could not read. The script counts a client as signed in only when `codex login status` exits 0 and says "logged in", or `claude auth status` exits 0 and prints JSON with `"loggedIn": true`. No login step; the user runs `codex login status` or `claude auth status` to see why.
- In Antigravity, every install that is not the code-index install, its connect command or an `agy plugin install` (the skills command for `archify`, the `npm` install of the `claude` or the `codex` client): show its command under "Steps for you" and do not run it.
- ponytail in Antigravity: nothing to do; its hooks do not run there, and only its skills load.
- `node`, `git`, `gh`, Python 3: install from the vendor's page or the system package manager.
