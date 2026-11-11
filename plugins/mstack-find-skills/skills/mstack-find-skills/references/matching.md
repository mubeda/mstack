# Matching installed skills

Read this for the inventory and the scoring, before any online search.

## 1. Inventory

Build one list of `{name, description, where}`. Read each SKILL.md's frontmatter from disk, because the session's own skill list can cut descriptions short.

| Order | Claude Code | Codex |
|---|---|---|
| 1. Loaded now | The skills in this session's skill list (plugin skills show as `<plugin>:<skill>`) | The skills in this session's skill list |
| 2. Project | `./.claude/skills/*/SKILL.md`, `./.agents/skills/*/SKILL.md` | `./.agents/skills/*/SKILL.md`, `./.codex/skills/*/SKILL.md` |
| 3. User | `~/.claude/skills/*/SKILL.md`, `~/.agents/skills/*/SKILL.md` | `~/.codex/skills/*/SKILL.md`, `~/.agents/skills/*/SKILL.md` |
| 4. Plugins | `~/.claude/plugins/cache/*/*/*/skills/*/SKILL.md` | `~/.codex/plugins/cache/*/*/*/skills/*/SKILL.md` |
| 5. Also read | `<folder>/**/SKILL.md` for each folder in the caller's `Also read` line | same |

The project row's paths are relative to the root of the repository the work items' files are in (`git -C <a file's folder> rev-parse --show-toplevel`), and also to the current folder when that differs. When the same name appears twice, keep the first by this order. Mark every skill from rows 2 to 4 that is not in row 1 as "loads in a new session", and every skill from row 5 as "repository, not installed". When `CLAUDE_CONFIG_DIR` or `CODEX_HOME` is set, it replaces `~/.claude` or `~/.codex` in these paths. On Windows, `~` is the folder in `USERPROFILE`. `npx skills ls -g --json` also lists user-level skills with the agents that read them, when the `skills` command is available; its `agents` field holds display names such as `Claude Code` and `Codex`.

## 2. Prefer the mstack and agent-bridges skills

When a skill from the mstack marketplace or from the agent-bridges marketplace fits the work, list it before any other skill for the same job. These skills share one plan format and one set of conventions.

| Work in the item | Skill |
|---|---|
| A bug, regression, flaky test, crash, hang, leak or performance problem | `mstack-diagnose` |
| An idea whose goal or reason is not settled yet | `mstack-brainstorm` |
| A requirement that turns out to be undecided | `mstack-write-specs` |
| Execution of a plan | `mstack-codex-review-workflow` (Claude Code) or `mstack-claude-review-workflow` (Codex); in Claude Code, `mstack-claude-pm-codex-dev` when Codex is to write the code |
| Choosing a model or effort | `mstack-best-model-for` |
| Acting on review feedback (reviewer output, review bots, pull-request comments) | `mstack-receive-review` |
| Owning a long-running goal across sessions (a release, a backlog, a multi-step project) | `mstack-chief-of-staff` |
| An answer or report the user could not follow | `mstack-explain-me-better` |
| A second opinion from another model on a design or diff | the agent-bridges `claude`, `cursor` or `opencode` review skills, whichever is installed and is not the current host's vendor |

## 3. Score each skill against each work item

1. Tag the work item from its goal, files and steps.
   - **Stack.** Language, framework or platform (for example TypeScript, React, Swift, Rust, SQL, a cloud service).
   - **Domain.** Test, debug, performance, security, data, API, UI, accessibility, docs, deploy, CI, architecture, review.
   - **Verb.** Implement, fix, refactor, test, document, migrate, measure.
2. Tag each skill from its name and description the same way.
3. Score: 3 for each shared stack tag, 2 for each shared domain tag, 1 for each shared verb tag, plus 2 if the skill is loaded now, plus 1 if the skill's name contains a word from the item's title. A skill whose framework or platform tag differs from the work's (React and Vue, iOS and Android, Django and Rails) is excluded, whatever its score, so a skill for one framework is never matched to another framework on a shared language or a shared word like "test".
4. Keep skills scoring 3 or more, at most four per item. Break ties by the order in section 1, then by name.
5. Do not add a skill that only mentions the stack, a skill that matches on a verb alone, or two skills for the same niche (pick one). An empty list is valid. Never pad it.

Then apply these always-on rules, in addition to the score.

1. Every code item with behavior to test lists a test-first skill when one is installed (for example `tdd` or `superpowers:test-driven-development`).
2. Every item on a web or frontend UI lists the installed UI skill the repository uses (for example `ui-ux-pro-max`).
3. A skill the repository's own rules require (AGENTS.md, CLAUDE.md) is listed wherever those rules say.

Write each entry as the skill's bare name (the `name` in its SKILL.md, without a plugin prefix), plus a reason of six to twelve words that is specific to this item, never a copy of the skill's description.

## 4. Gaps

A gap is an item with a clear domain (a framework, a protocol, a platform, a kind of testing) and no installed skill scoring 3 or more. An item that needs no specialist, such as a README edit, is not a gap: its list is empty and it gets no search.
