# Host: OpenCode

Read this in Phase 0 when the session runs in OpenCode, and whenever a later phase says "the host file". Facts are from https://opencode.ai/docs/skills/ and `opencode run --help` (OpenCode 2.2.6), read on 2026-11-10.

## Tools

- Question tool: a numbered round in chat, then wait for the reply.
- Subagent tool: none that this skill relies on. Use the fresh-session command below for comparison runs and reviews, or do the step in this session and say so.
- Loading a skill: the `skill` tool, by the skill's ID, which comes from its folder path.

## Where skills load from

| Scope | Folders |
|---|---|
| Project | `.opencode/skills/<name>/`, `.claude/skills/<name>/`, `.agents/skills/<name>/`, searched from the working folder up to the project root |
| Global | `~/.config/opencode/skills/<name>/`, `~/.claude/skills/<name>/`, `~/.agents/skills/<name>/` |

Write local skills to `.agents/skills/<name>/` (project) or `~/.agents/skills/<name>/` (global), which Codex and Cursor read too. The skill's ID is its path, and the frontmatter `name` is only a label, so keep the two equal. A skill without a `description` is not shown to the model. OpenCode does not document which copy wins when one ID is found in two folders, so never leave two copies of one skill in folders OpenCode reads.

## Frontmatter fields

- `disable-model-invocation: true` hides the skill from the model's list; it can still be loaded by ID. `metadata.opencode/autoinvoke: false` does the same and wins when both are set.
- `license` and `compatibility` are accepted and not interpreted.
- OpenCode 2 does not enforce the name pattern or the length limits. The static check still applies them, so the skill works on the stricter hosts.

## Fresh-session command

`opencode run` has no working-folder flag, so start it from inside the test repository.

```bash
cd <test repository> && opencode run --auto --format default "<task prompt>" > <run>/outputs/reply.md
```

`--auto` approves permissions that are not explicitly denied, so run it only in a throwaway copy of the repository. For the baseline, run the same command in a copy without the skill. Whether a non-interactive run loads skills from `.agents/skills/` is to be confirmed on first use: ask "List the skills you can load in this repository, by name." first. When the skill is not listed, hand the prompt to the user to run in an interactive session, and wait for the result.

## Native skill creator

None. OpenCode ships no skill creator, so this skill does every step itself.

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

When neither client is installed, warn the user and run the review prompt through `opencode run` in a fresh session, recorded as a same-vendor review.

## mstack skills supported here

As of 2026-11-10, only this skill. The other mstack skills are written for Claude Code, Codex and Antigravity, so every step they cover uses the built-in fallback in `references/workflow-steps.md`.
