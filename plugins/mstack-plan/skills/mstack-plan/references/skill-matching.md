# Skill matching

Read this in Phase 5. Every phase and every task names the skills that help with exactly that work, so the executor loads the right ones without guessing. Matching runs on what is installed first. Online search fills only the gaps, and the user decides every install.

## 1. Inventory the installed skills

Build one list of `{name, description, where}`. Read each SKILL.md's frontmatter from disk, because the session's own skill list can cut descriptions short.

| Order | Claude Code | Codex |
|---|---|---|
| 1. Loaded now | The skills in this session's skill list (plugin skills show as `<plugin>:<skill>`) | The skills in this session's skill list |
| 2. Project | `./.claude/skills/*/SKILL.md`, `./.agents/skills/*/SKILL.md` | `./.agents/skills/*/SKILL.md`, `./.codex/skills/*/SKILL.md` |
| 3. User | `~/.claude/skills/*/SKILL.md`, `~/.agents/skills/*/SKILL.md` | `~/.codex/skills/*/SKILL.md`, `~/.agents/skills/*/SKILL.md` |
| 4. Plugins | `~/.claude/plugins/cache/*/*/*/skills/*/SKILL.md` | `~/.codex/plugins/cache/*/*/*/skills/*/SKILL.md` |

When the same name appears twice, keep the first by this order. Mark every skill that is not in row 1 as "installed, loads in a new session". When `CLAUDE_CONFIG_DIR` or `CODEX_HOME` is set, it replaces `~/.claude` or `~/.codex` in these paths. `npx skills ls -g --json` also lists user-level skills with the agents that read them, when the `skills` CLI is available.

## 2. Prefer the mstack and agent-bridges skills

When a skill from the mstack marketplace or from the agent-bridges marketplace fits the work, use it before any other skill for the same job. These skills share this plan's format and conventions.

| Work in the task | Skill |
|---|---|
| A bug, regression, flaky test, crash, hang, leak or performance problem | `mstack-diagnose` |
| A requirement that turns out to be undecided while planning | `mstack-write-specs` (back to the spec, not a guess in the plan) |
| Execution of the plan | `mstack-codex-review-workflow` (Claude Code) or `mstack-claude-review-workflow` (Codex) |
| A second opinion from another model on a design or diff | the agent-bridges `claude`, `cursor` or `opencode` review skills, whichever is installed and is not the current host's vendor |

## 3. Score each skill against each phase and task

Tag the work and the skill, then score.

1. Tag the phase or task from its Goal, Files and steps.
   - **Stack.** Language, framework or platform (for example TypeScript, React, Swift, Rust, SQL, a cloud service).
   - **Domain.** Test, debug, performance, security, data, API, UI, accessibility, docs, deploy, CI, architecture, review.
   - **Verb.** Implement, fix, refactor, test, document, migrate, measure.
2. Tag each skill from its name and description the same way.
3. Score: 3 for each shared stack tag, 2 for each shared domain tag, 1 for each shared verb tag, plus 2 if the skill is loaded now, plus 1 if the skill's name contains a word from the task title. Subtract 5 when the skill has a stack tag the work does not have and the work has one the skill does not have, so a skill for one framework is never matched to another framework on a shared word like "test".
4. Keep skills scoring 3 or more, at most four per task. Break ties by the order in section 1, then by name.
5. Do not add a skill that only mentions the stack, a skill that matches on a verb alone, or two skills for the same niche (pick one). An empty list is valid. Never pad it.

Then apply these always-on rules, in addition to the score.

1. Every code task with behavior to test lists a test-first skill when one is installed (for example `tdd` or `superpowers:test-driven-development`), because the plan is red-green.
2. Every task on a web or frontend UI lists the installed UI skill the repository uses (for example `ui-ux-pro-max`).
3. A skill the repository's own rules require (AGENTS.md, CLAUDE.md) is listed wherever those rules say.

Write each entry as the skill's bare name (the `name` in its SKILL.md, without a plugin prefix), plus a reason of six to twelve words that is specific to this task, never a copy of the skill's description. Put a skill every task in a phase needs on the phase, not on each task.

## 4. Fill the gaps online

A gap is a phase or task with a clear domain (a framework, a protocol, a platform, a kind of testing) and no installed skill scoring 3 or more. Search for each gap, but only for gaps. A task that needs no specialist is not a gap.

1. Search the skills.sh directory with the `skills` CLI. Try the most specific query first, then one broader query.

   ```bash
   npx --yes skills find "<stack and domain words>"
   npx --yes skills find "<words>" --owner <trusted owner>
   ```
   Each result line is `owner/repo@skill  <N> installs`, followed by its skills.sh link. When `npx` is not available, search https://skills.sh and the host's plugin marketplaces instead.
2. Vet every candidate before recommending it. Prefer more than 1,000 installs and be careful under 100. Prefer official owners (the framework's own organization, anthropics, openai, vercel-labs, microsoft, github) and known authors. Prefer a source repository with 100 or more stars. Check that the repository has a license.
3. Read the candidate's SKILL.md before recommending it, because popularity does not show fit. List a repository's skills without installing anything with `npx --yes skills add <owner/repo> -l`, then open the SKILL.md on GitHub. Recommend a skill only when its instructions fit the task.
4. Keep at most two candidates per gap, best first.

## 5. Ask the user to install

Ask in one round, with the host's question tool, after the outline is approved and before the files are written. Install only what the user approves, the way the user chooses. Installing runs third-party code, so the user decides.

For each candidate, give: the gap it fills (the phases and tasks), what the skill does in one line, installs, owner, stars, license, the skills.sh link, and the install command for this host.

In the same round, ask how to install what the user approves. Run by an agent, the skills CLI installs without prompting, so these answers are the user's only way to choose.

1. The route: as a plugin, when the source is a plugin marketplace (it updates with that marketplace), or with the skills CLI (`npx skills`), which installs only the skill folder. Recommend the skills CLI for a single skill.
2. For the skills CLI, the scope: global, for every project (recommended), or this repository only (into `.agents/skills` and `.claude/skills` in the repository, recorded in `skills-lock.json`).
3. For the skills CLI, the method: symlink (recommended, one copy that `npx skills update` refreshes), or copy (independent files, for file systems or sync tools that do not follow symlinks).
4. For the skills CLI, the agents: this host only (recommended), or Claude Code and Codex.

| Route | Command |
|---|---|
| Skills CLI | `npx skills add <owner/repo> --skill <skill> -a <agents> -y`, adding `-g` for global and `--copy` for copy, where `<agents>` is `claude-code`, `codex`, or `claude-code codex` |
| Claude Code plugin | `claude plugin marketplace add <owner/repo>`, then `claude plugin install <plugin>@<marketplace>` |
| Codex plugin | `codex plugin marketplace add <owner/repo>`, then `codex plugin add <plugin>@<marketplace>` |

Recommend one answer per gap. Accept "install", "skip" or another skill name. Then:

1. A skill the user installs goes into the plan with the note "installed <yyyy-mm-dd>, loads in a new session".
2. A skill the user skips stays out of the task's Skills. Record the gap in `plan.md` › Decisions, so the executor knows the task runs without a specialist.
3. A newly installed skill loads only in a new session or after the host reloads plugins. The plan is still valid, because the executor runs in a later session.
