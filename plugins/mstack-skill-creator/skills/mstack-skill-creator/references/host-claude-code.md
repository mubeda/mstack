# Host: Claude Code

Read this in Phase 0 when the session runs in Claude Code, and whenever a later phase says "the host file". Facts are from https://code.claude.com/docs/en/skills and `claude --help`, read on 2026-11-10.

## Tools

- Question tool: `AskUserQuestion` for short choices, a numbered round in chat for longer ones.
- Subagent tool: `Agent`, with a fresh context. Set `model` and `effort` on every call, from `mstack-best-model-for`'s answer for the task's tier, because a subagent without them runs on the session's model.
- Loading a skill: the Skill tool, by its listed name (`<plugin>:<name>` for a plugin skill, `<name>` otherwise).
- Research: the multi-agent research workflow when the session lists one, otherwise web search and fetch.

## Where skills load from

| Scope | Folder |
|---|---|
| Project | `.claude/skills/<name>/SKILL.md`, and `<subdir>/.claude/skills/<name>/` when working below `<subdir>` |
| User | `~/.claude/skills/<name>/SKILL.md` |
| Plugin | `<plugin>/skills/<name>/SKILL.md` |

Claude Code does not read `.agents/skills/`. A local skill shared with the other hosts is written to `.agents/skills/<name>/` and linked from `.claude/skills/<name>` (`ln -s ../../.agents/skills/<name> .claude/skills/<name>` at project level). Where links do not work, copy the folder and tell the user that the two copies must be kept in step.

A skill added during a session loads only in a new session, or after `/reload-plugins` for a plugin.

## Frontmatter fields

Claude Code reads many fields beyond `name` and `description`. The ones users ask for most, and what the other three hosts do with them:

| Field | Claude Code | Codex, OpenCode, Cursor |
|---|---|---|
| `disable-model-invocation: true` | Only the user can start the skill, with `/<name>` | OpenCode and Cursor honor it. Codex ignores it and uses `policy.allow_implicit_invocation` in `agents/openai.yaml` |
| `paths` | Limits when the skill loads to matching files | Cursor honors it. Codex and OpenCode ignore it |
| `context: fork` | Runs the skill in a forked subagent | Ignored |
| `allowed-tools` | Tools allowed without a prompt while the skill runs | Experimental in the standard; not relied on elsewhere |
| `argument-hint`, `arguments`, `model`, `effort`, `hooks`, `user-invocable` | Read | Ignored |

## Fresh-session command

Run each comparison run from the folder that holds the test repository, so the project skills of that folder load.

```bash
claude -p "<task prompt>" --output-format text > <run>/outputs/reply.md
```

For the run with the skill, the skill sits in that repository's `.claude/skills/<name>/`. For the baseline, run the same command in a copy of the repository without it. Add `--permission-mode acceptEdits` when the task writes files. Prefer the subagent tool when the session has it; this command is the fallback.

## Native skill creator

Anthropic's `skill-creator` is often installed (as `skill-creator:skill-creator` or a synced `anthropic-skills:skill-creator`). When it is listed, offer its description optimizer, which needs `claude -p` and runs only here. This skill already carries that creator's benchmark and review page in `scripts/vendor/anthropic-skill-creator/`.

## Cross-vendor reviewer

Codex, through the `codex` skill of the skill-codex plugin, or `codex exec --sandbox read-only` with the prompt on stdin from a file. When neither is available, warn the user and use a fresh read-only `Agent` subagent on the model and effort `mstack-best-model-for` returns for the tier `most capable`, recorded as a same-vendor review.

## mstack skills supported here

Seventeen of the eighteen mstack skills, as of 2026-11-12: `mstack-receive-review`, `mstack-chief-of-staff`, `mstack-explain-me-better`, `mstack-product-plan`, `mstack-epic`, `mstack-brainstorm`, `mstack-write-specs`, `mstack-plan`, `mstack-codex-review-workflow`, `mstack-claude-pm-codex-dev`, `mstack-handoff`, `mstack-diagnose`, `mstack-backlog-triage`, `mstack-find-skills`, `mstack-best-model-for`, `mstack-setup`, and this skill. `mstack-claude-review-workflow` is the Codex workflow and does not run here.
