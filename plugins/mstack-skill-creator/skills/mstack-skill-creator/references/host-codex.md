# Host: Codex

Read this in Phase 0 when the session runs in Codex CLI, and whenever a later phase says "the host file". Facts are from https://learn.chatgpt.com/docs/build-skills (formerly developers.openai.com/codex/skills) and `codex exec --help`, read on 2026-11-10.

## Tools

- Question tool: a numbered round in chat, then wait for the reply.
- Subagent tool: the session's agent tool when it has one, otherwise a separate `codex exec` run with the brief on stdin.
- Loading a skill: read its `SKILL.md` and follow it. The user mentions one with `$<name>` or picks it from `/skills`.
- Commands that need network (`gh`, `npx`, a nested `codex exec`) run as approved commands, because the sandbox turns the network off.
- Writing a skill into `.agents/skills/` needs an approved command too. On 2026-11-10 the `workspace-write` sandbox mounted `.agents` read-only ("Read-only file system"), so a plain write there fails. Ask the user to approve the write, or write the draft elsewhere in the workspace and give the user the command that moves it into place.

## Where skills load from

| Scope | Folder |
|---|---|
| Project | `.agents/skills/<name>/SKILL.md` in the working folder, its parent, and up to the repository root |
| User | `~/.agents/skills/<name>/SKILL.md` |
| Admin | `/etc/codex/skills/<name>/SKILL.md` |
| Plugin | `<plugin>/skills/<name>/SKILL.md`, with `"skills": "./skills/"` in `.codex-plugin/plugin.json` |
| System | Bundled with Codex, including `skill-creator` and `skill-installer` |

## Frontmatter fields

Codex reads `name` and `description` and nothing else from the frontmatter. Codex-only settings go in an optional file beside `SKILL.md`, `agents/openai.yaml`, which the other hosts ignore:

- `interface`: `display_name`, `short_description`, `icon_small`, `icon_large`, `brand_color`, `default_prompt` (how the skill shows in the app).
- `policy`: `allow_implicit_invocation`, `true` by default. Set it to `false` for a skill only the user may start, the Codex form of `disable-model-invocation: true`.
- `dependencies`: `tools`, each with `type`, `value`, `description`, `transport` and `url`.

## Fresh-session command

Run each comparison run with the test repository as the working folder, so its `.agents/skills/` loads.

```bash
codex exec -C <test repository> --sandbox workspace-write -o <run>/outputs/reply.md - < <run>/prompt.md 2> <run>/stderr.txt
```

Write the prompt to a file with the file tool and pass it on stdin, so no shell expands anything in it. For the baseline, run the same command in a copy of the repository without the skill. Keep `--skip-git-repo-check` off inside a Git repository.

## Native skill creator

`skill-creator` is a system skill on every Codex install. Its `init_skill.py` scaffolds a folder and its `quick_validate.py` lints frontmatter. When the user wants the `agents/openai.yaml` file, offer the Codex creator's script that generates it. This skill's own `scripts/check-skill.mjs` replaces the linter for the four-host rules.

## Cross-vendor reviewer

Claude, through the `claude-review` skill of the agent-bridges `claude` plugin, run as an approved command. When it is missing, warn the user and use a separate read-only `codex exec --sandbox read-only` run on the model and effort `mstack-best-model-for` returns for the tier `most capable`, recorded as a same-vendor review.

## mstack skills supported here

Twelve of the fourteen mstack skills, as of 2026-11-10: `mstack-receive-review`, `mstack-brainstorm`, `mstack-write-specs`, `mstack-plan`, `mstack-claude-review-workflow`, `mstack-handoff`, `mstack-diagnose`, `mstack-backlog-triage`, `mstack-find-skills`, `mstack-best-model-for`, `mstack-setup`, and this skill. `mstack-codex-review-workflow` and `mstack-claude-pm-codex-dev` drive Claude Code tools and do not run here.
