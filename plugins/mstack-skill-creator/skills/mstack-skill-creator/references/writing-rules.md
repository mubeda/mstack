# Writing rules

Read this in Phase 3, before you write or change any file of the created skill, and again at "Before you finish". `scripts/check-skill.mjs` checks the rules marked "checked". The rest you check by reading.

## Frontmatter

1. Write only `name` and `description` by default. They are the two fields all four hosts read the same way. (checked: any other field gives a warning)
2. `name` is lowercase letters, digits and single hyphens, at most 64 characters, and equal to the folder name. (checked)
3. Add a host-only field only when the user asks for the behavior it gives. Then tell the user which hosts ignore it, from the "Frontmatter fields" section of each host file. Examples: limiting the skill to some files (`paths`, Cursor and Claude Code), only the user may start it (`disable-model-invocation: true`, or `agents/openai.yaml` for Codex), running it in a forked subagent (`context: fork`, Claude Code only).

## The description

The description is the only text an agent sees before it decides to load the skill. Write it for that decision.

1. Start with "Use when". (checked)
2. Put the trigger situations and the phrases a user would type first, including the cases where the user does not name the skill.
3. End with one short clause on what the skill produces.
4. Never summarize the steps. An agent that reads a step summary in the description tends to follow the summary and skip the body.
5. At most 1024 characters. (checked)
6. Read the finished description once. If it lists steps or phases in order, rewrite it.

Good:

```text
Use when the user wants a changelog entry, release notes, or "what changed since the last tag",
or has just merged a change and asks to document it. Produces one entry in the project's format.
```

Bad, because it summarizes the steps and hides the triggers:

```text
Reads git log, groups commits by type, formats them, then writes CHANGELOG.md.
```

## Size and layout

1. Keep `SKILL.md` short: what the skill does, the host table when needed, the ground rules, and the phases with their gates. Aim for under 300 lines; the check warns over 500. (checked)
2. Put detail in `references/`, one file per subject, and say in `SKILL.md` which phase reads which file. References are one level deep: a reference file does not send the reader to another reference for a step.
3. Put anything deterministic (a check, a format conversion, a calculation) in a script under `scripts/`, with a usage line and an exit code, instead of asking the agent to do it by hand.
4. Write each instruction as an action with an observable result. Explain why when a rule would otherwise look arbitrary; an agent follows a reason better than a capital MUST.

## The host table

A skill that only gives instructions needs no host table and is portable as written.

Add one when a step needs a host tool: a question tool, a subagent tool, a way to load another skill, or a reviewer. Rows are roles, columns are the hosts the user chose:

```text
| Role              | Claude Code       | Codex                         | OpenCode            | Cursor              |
|-------------------|-------------------|-------------------------------|---------------------|---------------------|
| Question tool     | AskUserQuestion   | numbered round in chat, wait  | numbered round      | numbered round      |
| Subagent tool     | Agent (set model) | session agent tool, or codex exec | none: do it yourself | none: do it yourself |
| Loading a skill   | Skill tool        | read its SKILL.md             | skill tool          | by description or /<name> |
```

Take each cell from the "Tools" section of the host file. Outside the table, the skill names roles ("your question tool"), never a host's tool. (checked for the tool names the check knows)

The check reads only `SKILL.md`, and only for the names `AskUserQuestion`, `codex exec`, `claude -p`, `opencode run` and `cursor-agent`, skipping table rows. A host file in `references/` may name its host's tools, because only an agent on that host reads it. Words such as "Agent" or "Skill" are not checked, because they are ordinary words in skill text; read for them yourself.

## Self-contained folders

1. Everything the skill uses is inside its own folder. An install copies only that folder. (checked: a link or code path that climbs out of the folder fails)
2. Every `references/<file>` and `scripts/<file>` the text names exists. (checked) Write an example path that is not a real file with a placeholder in front, such as `<skill>/scripts/x.py`, which the check skips.
3. Another skill is named, never pointed at by path, and the text says what to do when it is not installed.
4. No second `SKILL.md` anywhere inside the folder. A skill file used as test data is named `SKILL.md.fixture`, and the test renames it. (checked)

## Third-party material

1. Before you adapt text from another skill, find its license: a `LICENSE` file in its folder or repository, or a `license` field. No license means you copy nothing from it. Say so to the user, and write the skill in your own words from the idea.
2. With a license, rewrite adapted rules in your own words. Copy a file unchanged only when the user wants it, and keep its license file beside it.
3. Record every source in a notices file inside the skill folder: the source, its license, what was used and where, and the text the license requires (for MIT, the copyright line and the permission notice; for Apache-2.0, the license text and any NOTICE file).

## Before you finish

1. The description starts with "Use when", leads with triggers, and lists no steps.
2. Every host-only field was asked for, and the user was told which hosts ignore it.
3. Every step names its observable result.
4. Nothing in the folder points outside it, and every named file exists.
5. Every adapted passage is rewritten and credited, and nothing comes from an unlicensed source.
6. No name of a person, company, customer or internal product, no home path, private host or credential, unless the user wrote the skill for their own private use and said so.
