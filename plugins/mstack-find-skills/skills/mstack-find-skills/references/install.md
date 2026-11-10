# Installing a candidate

Read the command table in both modes: every candidate in the result block carries its install commands. In called mode, give the skills-command form with `-g` and the host's agent (`-a claude-code` or `-a codex`), plus the plugin form when the source is a plugin marketplace; install nothing and ask nothing, the caller decides. The questions and the install itself are for user mode only, after the report, when the user wants a candidate.

## Ask once

Installing runs third-party code, so the user decides. Ask in one round, with the host's question tool, and recommend one answer per question. Run by an agent, the skills command installs without prompting, so these answers are the user's only way to choose.

1. Which candidates to install. Accept "install", "skip" or another skill name per gap.
2. The route: as a plugin, when the source is a plugin marketplace (it updates with that marketplace), or with the skills command (`npx skills`), which installs only the skill folder. Recommend the skills command for a single skill.
3. For the skills command, the scope: global, for every project (recommended), or this repository only (into `.agents/skills` and `.claude/skills`, recorded in `skills-lock.json`).
4. For the skills command, the method: symlink (recommended, one copy that `npx skills update` refreshes), or copy (independent files, for file systems or sync tools that do not follow symlinks).
5. For the skills command, the agents: this host only (recommended), or Claude Code and Codex.

## Commands

| Route | Command |
|---|---|
| Skills command | `npx skills add <owner/repo> --skill <skill> -a <agents> -y`, adding `-g` for global and `--copy` for copy, where `<agents>` is `claude-code`, `codex`, or `claude-code codex` |
| Claude Code plugin | `claude plugin marketplace add <owner/repo>`, then `claude plugin install <plugin>@<marketplace>` |
| Codex plugin | `codex plugin marketplace add <owner/repo>`, then `codex plugin add <plugin>@<marketplace>` |

Run only the commands the answers select, and only after the answers arrive.

## After the install

1. Report each install with its command and its result. A failed install is reported with its last output lines.
2. Say that an installed skill loads in a new session, or after the host reloads plugins.
3. A gap the user skipped stays open: report it as an open gap, with no install.
