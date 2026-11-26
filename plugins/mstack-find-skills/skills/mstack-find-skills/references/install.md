# Installing a candidate

Read the command table in both modes: every candidate in the result block carries its install commands. In called mode, give the skills-command form with `-g` and the host's agent (`-a claude-code`, `-a codex` or `-a antigravity`), plus this host's plugin form when question 2 would offer the plugin route for that candidate (in Antigravity only when the plugin's folder is known by the rule of The Antigravity plugin address; otherwise leave the plugin form out); install nothing and ask nothing, the caller decides. The questions and the install itself are for user mode only, after the report, when the user wants a candidate.

## Ask once

Installing runs third-party code, so the user decides. Ask in one round, with the host's question tool, and recommend one answer per question. Run by an agent, the skills command installs without prompting, so these answers are the user's only way to choose.

**Before the answers arrive, run nothing.** No listing, no `npx skills use`, no version check, no look at the repository, no command of any kind. The questions need none, and a command run before the user chose is a step the user did not allow.

1. Which candidates to install. Accept "install", "skip" or another skill name per gap.
2. The route: with the skills command (`npx skills`), which installs only the skill folder, or as a plugin of this host. Recommend the skills command for a single skill. Offer the plugin route per candidate:
   - In Claude Code or Codex, when the source is a plugin marketplace (the plugin updates with that marketplace).
   - In Antigravity, only when the candidate's repository address is known. A source of the form `<owner>/<repo>` is a GitHub repository, and its address is `https://github.com/<owner>/<repo>`. A source that is a web address of no repository (for example `https://archify.si`) has no repository address: offer the skills command only for that candidate, and say that it has no plugin route. The question names the route and no command: the address to install from depends on where the plugin's manifest lies in the repository, and you look that up only after the user picked this route.
3. For the skills command, the scope: global, for every project (recommended), or this repository only (into `.agents/skills` and `.claude/skills`, recorded in `skills-lock.json`).
4. For the skills command, the method: symlink (recommended, one copy that `npx skills update` refreshes), or copy (independent files, for file systems or sync tools that do not follow symlinks).
5. For the skills command, the agents: this host only (recommended), or any of Claude Code, Codex and Antigravity. This host is `claude-code` in Claude Code, `codex` in Codex and `antigravity` in Antigravity.

## Commands

| Route | Command |
|---|---|
| Skills command | `npx skills add <source> --skill <skill> -a <agents> -y`, adding `-g` for global and `--copy` for copy; symlink and this-repository scope take no flag. `<source>` is the candidate's `<owner/repo>` or web address, as given. `<agents>` is any of `claude-code`, `codex` and `antigravity`, separated by spaces: the agents the user picked and no other |
| Claude Code plugin | `claude plugin marketplace add <owner/repo>`, then `claude plugin install <plugin>@<marketplace>` |
| Codex plugin | `codex plugin marketplace add <owner/repo>`, then `codex plugin add <plugin>@<marketplace>` |
| Antigravity plugin | `agy plugin install <address of the plugin's folder>`, by the next section |

Each plugin row belongs to its own host: never give or run another host's plugin command. Run only the commands the answers select, and only after the answers arrive. The Antigravity plugin command is the one command this skill does not run: show it, whole, for the user to run in a terminal, and say that it is not installed yet. Never use `agy plugin import`, which imports every plugin of another client at once instead of the one candidate.

## The Antigravity plugin address

`agy plugin install` takes the address of the folder that holds the plugin's manifest, which is not always the repository's root. After the user picked the plugin route, and not before, find that folder: the one in the candidate's repository that holds `.antigravity-plugin/plugin.json` (or `.claude-plugin/plugin.json` when the repository has no Antigravity manifest) and whose `skills/` folder holds the skill. Read it from a checkout of the repository or from the repository's pages. This is a read, never an install.

| Where the manifest lies | Address |
|---|---|
| At the repository's root | `https://github.com/<owner>/<repo>` |
| In a subfolder | `https://github.com/<owner>/<repo>/tree/<default branch>/<folder>`, for example `https://github.com/acme/tools/tree/main/plugins/lint` |
| Not known: the repository could not be read, it holds no such manifest, or its default branch is not known | None. Say that you could not find the plugin's folder, and offer the skills command instead. Give no `agy plugin install` command in any form: none with the repository's root, none under a condition ("if the manifest is at the root") and none with a part left to fill in |

Never build the address from the skill's name, from the repository's root by default, or from another repository's layout: a guessed address installs nothing or the wrong plugin.

## After the install

1. Report each install with its command and its result. A failed install is reported with its last output lines. A command shown for the user to run is reported as shown, never as installed.
2. Say that an installed skill loads in a new session, or after the host reloads plugins.
3. A gap the user skipped stays open: report it as an open gap, with no install.
