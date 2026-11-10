# Host: Cursor

Read this in Phase 0 when the session runs in Cursor or `cursor-agent`, and whenever a later phase says "the host file". Facts are from https://cursor.com/docs/context/skills and `cursor-agent --help`, read on 2026-11-10.

## Tools

- Question tool: a numbered round in chat, then wait for the reply.
- Subagent tool: none that this skill relies on. Use the fresh-session command below for comparison runs and reviews, or do the step in this session and say so.
- Loading a skill: Cursor loads a skill when its description matches, or when the user types `/<name>`.

## Where skills load from

| Scope | Folders |
|---|---|
| Project | `.agents/skills/<name>/`, `.cursor/skills/<name>/`, and for compatibility `.claude/skills/<name>/` and `.codex/skills/<name>/` |
| User | `~/.agents/skills/<name>/`, `~/.cursor/skills/<name>/`, and for compatibility `~/.claude/skills/<name>/` and `~/.codex/skills/<name>/` |

Write local skills to `.agents/skills/<name>/` (project) or `~/.agents/skills/<name>/` (user), which Codex and OpenCode read too. Never write into `~/.cursor/skills-cursor/`, which Cursor manages.

## Frontmatter fields

- `name` must equal the folder name; `description` says what the skill does and when to use it.
- `paths`: glob patterns that limit the skill to matching files. Claude Code honors it too; Codex and OpenCode ignore it.
- `disable-model-invocation: true`: the skill loads only when the user types `/<name>`. OpenCode and Claude Code honor it; Codex ignores it.
- `icon`, `color`: the badge when the skill is used as a custom mode. Cursor only.
- `metadata`: a free key-value map.

## Fresh-session command

```bash
cursor-agent -p --workspace <test repository> --trust --output-format text "<task prompt>" > <run>/outputs/reply.md
```

Add `--force` only in a throwaway copy of the repository, because it allows commands without asking. For the baseline, run the same command on a copy without the skill. On 2026-11-10, with `cursor-agent` 2026.10.01 logged in, this command printed nothing and did not end within five minutes, even for a one-word prompt. So run it with a time limit (`timeout 300`), and first ask "List the skills you can load in this repository, by name." When it does not answer in time, or does not list the skill, hand the prompt to the user to run in the Cursor app, and wait for the result. Until then the skill is untested on Cursor.

## Native skill creator

Cursor ships a built-in `create-skill` skill. Name it to the user when they want Cursor's own guidance. Copy nothing from it: it carries no license.

## Cross-vendor reviewer

The agent-bridges plugin of another vendor when one is installed. Otherwise warn the user and run the review prompt through `cursor-agent -p` in a fresh session with a model of another vendor when the account offers one, or the same vendor, recorded as same-vendor.

## mstack skills supported here

As of 2026-11-10, only this skill. The other mstack skills are written for Claude Code and Codex, so every step they cover uses the built-in fallback in `references/workflow-steps.md`.
