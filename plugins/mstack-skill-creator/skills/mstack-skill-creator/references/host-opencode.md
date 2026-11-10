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

The agent-bridges plugin of another vendor when one is installed (its `claude` plugin for a Claude review). Otherwise warn the user and run the review prompt through `opencode run` in a fresh session, recorded as a same-vendor review.

## mstack skills supported here

As of 2026-11-10, only this skill. The other mstack skills are written for Claude Code and Codex, so every step they cover uses the built-in fallback in `references/workflow-steps.md`.
