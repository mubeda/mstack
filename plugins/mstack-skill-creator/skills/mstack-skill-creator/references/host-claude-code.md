# Host: Claude Code

Read this in Phase 0 when the session runs in Claude Code, and whenever a later phase says "the host file". Facts are from https://code.claude.com/docs/en/skills and `claude --help`, read on 2026-11-10.

## Tools

- Question tool: `AskUserQuestion` for short choices, a numbered round in chat for longer ones.
- Subagent tool: `Agent`, with a fresh context. Set `model` and `effort` on every call, from `mstack-best-model-for`'s answer for the task's tier, because a subagent without them runs on the session's model.
- Loading a skill: the Skill tool, by its listed name (`<plugin>:<name>` for a plugin skill, `<name>` otherwise).
- Research: the `mstack-research` skill, in called mode.

## Where skills load from

| Scope | Folder |
|---|---|
| Project | `.claude/skills/<name>/SKILL.md`, and `<subdir>/.claude/skills/<name>/` when working below `<subdir>` |
| User | `~/.claude/skills/<name>/SKILL.md` |
| Plugin | `<plugin>/skills/<name>/SKILL.md` |

Claude Code does not read `.agents/skills/`. A local skill shared with the other hosts is written to `.agents/skills/<name>/` and linked from `.claude/skills/<name>` (`ln -s ../../.agents/skills/<name> .claude/skills/<name>` at project level). Where links do not work, copy the folder and tell the user that the two copies must be kept in step.

A skill added during a session loads only in a new session, or after `/reload-plugins` for a plugin.

## Frontmatter fields

Claude Code reads many fields beyond `name` and `description`. The ones users ask for most, and what the other hosts do with them:

| Field | Claude Code | Codex, Antigravity, OpenCode, Cursor |
|---|---|---|
| `disable-model-invocation: true` | Only the user can start the skill, with `/<name>` | OpenCode and Cursor honor it. Codex ignores it and uses `policy.allow_implicit_invocation` in `agents/openai.yaml`. Antigravity: not checked |
| `paths` | Limits when the skill loads to matching files | Cursor honors it. Codex and OpenCode ignore it. Antigravity: not checked |
| `context: fork` | Runs the skill in a forked subagent | Ignored. Antigravity: not checked |
| `allowed-tools` | Tools allowed without a prompt while the skill runs | Experimental in the standard; not relied on elsewhere. Antigravity: not checked |
| `argument-hint`, `arguments`, `model`, `effort`, `hooks`, `user-invocable` | Read | Ignored. Antigravity: not checked |

## Fresh-session command

Run each comparison run from the folder that holds the test repository, so the project skills of that folder load.

```bash
cd "<test repository>" && claude -p --setting-sources project --model <model> --effort <effort> --output-format json --permission-mode acceptEdits --allowedTools "Bash" --settings '{"advisorModel":"off"}' < "<run>/prompt.md" > "<run>/outputs/result.json"
```

Write the task prompt to `<run>/prompt.md` with your file tool and pass it on stdin, so no shell expands anything in it. The reply is the `result` field of the JSON; `is_error` must be `false`, and `modelUsage` should name only `<model>`. For the run with the skill, the skill sits in that repository's `.claude/skills/<name>/`. For the baseline, run the same command in a copy of the repository without it. Prefer the subagent tool when the session has it; this command is the fallback.

Every part of the command is required. `<model>` is the full model id and `<effort>` the effort that `mstack-best-model-for` names under "How to set" for the tier `standard`, never the alias of its Model column: in a headless run an alias can run another model, and the alias is for the subagent tool. `--setting-sources project` loads the project skill and leaves the user's own setup out; a plain `claude -p` loads that whole setup. The `--settings` part switches off a second advisor model that the user's settings may hold. These flags let the run edit files and run shell commands without asking, so use them only in a throwaway copy of the test repository. The flags were confirmed on 2026-11-23 with Claude Code 2.1.330, started from a clean shell.

## Native skill creator

Anthropic's `skill-creator` is often installed (as `skill-creator:skill-creator` or a synced `anthropic-skills:skill-creator`). When it is listed, offer its description optimizer, which needs `claude -p` and runs only here. This skill already carries that creator's benchmark and review page in `scripts/vendor/anthropic-skill-creator/`.

## Cross-vendor reviewer

From `mstack-vendors`, as `plugin-packaging.md` › Cross-vendor review says.

## mstack skills supported here

Twenty-six of the thirty mstack skills, as of 2026-11-26: `mstack-auto`, `mstack-research`, `mstack-write-issue`, `mstack-anonymize`, `mstack-web-ui`, `mstack-resolve-merge-conflicts`, `mstack-receive-review`, `mstack-chief-of-staff`, `mstack-explain-me-better`, `mstack-product-plan`, `mstack-epic`, `mstack-evidence`, `mstack-decisions`, `mstack-brainstorm`, `mstack-write-specs`, `mstack-plan`, `mstack-claude-led-review`, `mstack-claude-led-dev`, `mstack-handoff`, `mstack-diagnose`, `mstack-backlog-triage`, `mstack-find-skills`, `mstack-best-model-for`, `mstack-vendors`, `mstack-setup`, and this skill. `mstack-codex-led-review`, `mstack-codex-led-dev`, `mstack-antigravity-led-review` and `mstack-antigravity-led-dev` are the Codex and Antigravity workflows and do not run here.
