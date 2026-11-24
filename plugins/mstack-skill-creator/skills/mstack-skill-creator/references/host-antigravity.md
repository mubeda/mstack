# Host: Antigravity

Read this in Phase 0 when the session runs in Antigravity, and whenever a later phase says "the host file". Facts are from the Antigravity documentation (the subagents and build-plugins pages, read on 2026-11-21) and from sessions a person opened with `agy` 1.5.15 on 2026-11-23. When your own session shows a tool under another name, use the session's name.

## Tools

- Question tool: `ask_question`, one numbered round, then wait for the reply.
- Subagent tool: `invoke_subagent`, on the subagent tier that `mstack-best-model-for` names under "How to set" for the vendor `antigravity`. A subagent takes a tier, never a model id or an effort.
- Loading a skill: read its `SKILL.md` with `read_file` and follow it.
- Research: the `mstack-research` skill, in called mode.

## Where skills load from

| Scope | Folder |
|---|---|
| Project | `.agents/skills/<name>/SKILL.md` in the workspace |
| User | `~/.gemini/config/skills/<name>/SKILL.md` |
| Plugin | `<plugin>/skills/<name>/SKILL.md`, in a plugin under `~/.gemini/config/plugins/` or the workspace's `.agents/plugins/`, with the manifest `<plugin>/.antigravity-plugin/plugin.json` |

No source says that Antigravity reads `~/.agents/skills/`. A user-scope skill shared with the other hosts is written to `~/.agents/skills/<name>/` and linked from `~/.gemini/config/skills/<name>`. Whether Antigravity follows a link there was not tried: when a new session does not list the skill, copy the folder and tell the user that the two copies must be kept in step.

The folders come from a summary of the documentation. Two of them were seen at work: a plugin installed into `~/.gemini/config/plugins/` (2026-11-21), and a skill in the workspace's `.agents/skills/` that a subagent loaded (2026-11-23).

## Frontmatter fields

This skill relies on `name` and `description` here. What Antigravity does with any other field was not checked, so tell the user that a host-only field is untested in Antigravity.

## Fresh-session command

None. A skill never starts a second Antigravity session, also not from inside the user's own session, so no `agy` command runs a comparison run or a review.

The comparison test uses the first method of the testing reference: one subagent per run with `invoke_subagent`, both started together, the skill's path given only to the run with the skill. A subagent also sees the skills in the workspace's `.agents/skills/`, so tell the baseline run not to use the new skill when it sits there, and say in the report that the baseline could see it.

When the session has no subagent tool, use the third method: hand the prompt and the two setups to the user, and report the skill as untested until the results come back.

## Native skill creator

None known. This skill does every step itself.

## Cross-vendor reviewer

None in this version. Warn the user and use a fresh subagent with `invoke_subagent`, on the tier `mstack-best-model-for` gives for `most capable`, told to change nothing. No source says which vendor's model runs a subagent tier, so record the review as "a subagent of this session; the vendor of its model is not known", never as cross-vendor and never as same-vendor. Never start a second Antigravity session for a review.

## mstack skills supported here

Twenty-three of the twenty-six mstack skills, as of 2026-11-24: `mstack-auto`, `mstack-research`, `mstack-write-issue`, `mstack-anonymize`, `mstack-web-ui`, `mstack-receive-review`, `mstack-chief-of-staff`, `mstack-explain-me-better`, `mstack-product-plan`, `mstack-epic`, `mstack-evidence`, `mstack-decisions`, `mstack-brainstorm`, `mstack-write-specs`, `mstack-plan`, `mstack-handoff`, `mstack-diagnose`, `mstack-backlog-triage`, `mstack-find-skills`, `mstack-best-model-for`, `mstack-vendors`, `mstack-setup`, and this skill. The three workflow skills, `mstack-codex-review-workflow`, `mstack-claude-review-workflow` and `mstack-claude-pm-codex-dev`, do not run here.
