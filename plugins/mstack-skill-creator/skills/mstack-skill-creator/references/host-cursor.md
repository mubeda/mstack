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

A read-only run of another vendor's own client that is installed, of a vendor other than the one this session's model comes from. Check with `command -v codex` and `command -v claude`.

Codex first, with the prompt on stdin from a file:

```bash
codex exec --sandbox read-only --skip-git-repo-check -C "<working folder>" - < "<prompt file>" > "<result file>"
```

`--skip-git-repo-check` lets the run start in a folder that is not a Git repository, such as a local skill's folder; leave it out inside one. Keep the quotes: a folder name may hold a space.

Else Claude, by a read-only run of the Claude Code client:

```bash
cd "<working folder>" && claude -p --safe-mode --model <model> --effort <effort> --output-format json --permission-mode plan --tools "Read,Grep,Glob" --settings '{"advisorModel":"off"}' < "<prompt file>" > "<result file>"
```

`<model>` is a full Claude model id and `<effort>` an effort, both named by the user: ask once, and never pass an alias, because an alias can run another model. Put what the reviewer reads in the working folder. The review is the `result` field of the JSON in `<result file>`; `is_error` must be `false`, and `modelUsage` should name only `<model>`. Wait for the command to end and read its output before you report. Claude Code loads the user's own setup (settings, plugins, hooks, a second advisor model) unless these flags are used, so copy the command whole. The flags were confirmed on 2026-11-23 with Claude Code 2.1.330 from a clean shell; a run started from this host was not confirmed.

When neither client is installed, warn the user and run the review prompt through `cursor-agent -p` in a fresh session with a model of another vendor when the account offers one, or the same vendor, recorded as same-vendor.

## mstack skills supported here

As of 2026-11-10, only this skill. The other mstack skills are written for Claude Code, Codex and Antigravity, so every step they cover uses the built-in fallback in `references/workflow-steps.md`.
