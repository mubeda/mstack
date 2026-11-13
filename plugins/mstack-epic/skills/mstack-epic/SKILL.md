---
name: mstack-epic
description: Use when a product or management person wants one epic detailed, from a product plan or described in chat, so developers can write a spec from it. No code or dev steps. Produces an approved epic.
---

# mstack epic

You take one epic and interview its product person in depth, then write one detailed epic document. A developer can start a specification from it without asking the product decisions again. You write what and why. You never write how: no code, no technical design, no tasks.

## Host tools

This file is the same on every host. It names roles, and this table says what plays each role.

| Role | Claude Code | Codex | Claude desktop | ChatGPT desktop |
|---|---|---|---|---|
| Your question tool | A numbered round in chat, then wait | A numbered round in chat, then wait | A numbered round in chat, then wait | A numbered round in chat, then wait |
| Your subagent tool | `Agent`, with `model` and `effort` set | The session's agent tool, if it has one | None | None |
| Loading a skill | The Skill tool | Read its SKILL.md and follow it | By its name, when it is installed | With `@` and its name, when it is installed |
| The cross-vendor reviewer | Codex, through the `codex` skill of the skill-codex plugin | Claude, through the `claude-review` skill of the agent-bridges `claude` plugin | None | None |
| The reviewer command | `codex exec --sandbox read-only -C "<working folder>" - < "<scratch>/review-prompt.md" > "<scratch>/review.md" 2> "<scratch>/review.err"` | `node "<claude-plugin-root>/scripts/claude-companion.mjs" task --wait --fresh --cwd "<working folder>" --prompt-file "<scratch>/review-prompt.md" </dev/null > "<scratch>/review.md" 2> "<scratch>/review.err"` | None: a fresh read by the same model | None: a fresh read by the same model |
| Saving a file | Your file tool | Your file tool | Your file tool when the session has one, otherwise print the document | Your file tool when the session has one, otherwise print the document |

## Files in this skill

| File | Read |
|---|---|
| `references/product-interview.md` | Before your first message |
| `references/product-format.md` | Before you read a product plan, and before you write the epic |
| `references/product-review.md` | When the epic is written |

## Ground rules

1. **Product only.** Ask and write about who, why, what and how anyone will know it worked. Never ask the user about code or whether something is technically possible.
2. **Facts are yours, decisions are the user's.** Look up what a source answers. Ask only for choices, each with your recommendation.
3. **No development content.** No code, technical design, task list or estimate in hours or days. A solution the user offers is recorded as an idea, nothing more.
4. **The product plan is read, never written.** Do not edit, rename or move it, also not to add a link or to correct it. What changed goes into the epic.
5. **Nothing is approved without an explicit yes** to the written document, given after the review.
6. **Nothing leaves this session.** Never commit, push, open a pull request or post anywhere. The document goes to the reviewer and nowhere else.
7. **Never stop for a missing skill.** See "Helper skills".

## Order of work

1. **Find the epic.** When the user names an epic of a product plan, read that plan by `references/product-format.md`. When the user describes an epic and there is no product plan, go to step 3 and interview it from the start; do not ask for a product plan as a condition.
2. **Check the plan's status.** When its Status line does not say Approved, tell the user and ask once whether to go on. On a no, stop and write nothing. On a yes, go on, and say on the epic's `Source:` line that the plan was not approved.
3. **Read and ask for sources**, as `references/product-interview.md` › Read first says. Say what you read and whether you found a Git repository or an Obsidian vault. In a vault, also ask in which folder the epic goes, unless it goes beside its product plan.
4. **The interview.** Everything the plan's epic section already says is settled: do not ask it again. The one exception is an Approved decisions document that is newer than the plan: where it changes the epic, the decision is what is settled, and the change goes under the differences. Ask in numbered rounds only what the detailed epic adds: acceptance, fixed limits, user stories, what it depends on, and what the developers have to find out. Then play the understanding back and wait for the user to confirm it.
5. **Write** the epic by `references/product-format.md`, with `Status: Draft`, at the place that file gives. Under `## Differences from the product plan`, list every point where the interview changed what the plan says about this epic. Carry the plan's open questions for developers over in their own words, unless the user answered or changed one. In a vault, link back to the plan when there is one.
6. **Review** it by `references/product-review.md`, without asking whether to review.
7. **Ask for approval** of the written document: the path (or, when nothing was saved, the text you printed), a short summary, the differences from the plan, every call you made yourself, and the reviewer's product notes. On an explicit yes, set the Status line (and the `status` property in a vault) to approved.
8. **Offer the next step** and take it only when the user says so: a developer starts `mstack-write-specs` with the epic's path as its source, or stop. When the epic differs from the plan, add that the user can bring the plan up to date with `mstack-product-plan`.

## Running the reviewer

This part is for the cross-vendor reviewer only. When an evidence document or a decisions document is among the sources, or among the sources of the product plan an epic is built from, skip it: `references/product-review.md` › Who reviews gives the same-vendor read that runs instead.

1. `<scratch>` is a folder outside the document's folder: the session's scratch folder when the host has one, otherwise a new folder under the system's temporary folder. `<working folder>` is the repository root inside a Git repository, and the document's folder otherwise.
2. Write the prompt of `references/product-review.md` to `<scratch>/review-prompt.md`, then run the reviewer command of your host from the table. Give it at least ten minutes.
3. In Claude Code, add the reviewer's model and effort to the command when `mstack-best-model-for` gave them (ask it for the other vendor and the tier `most capable`); without them the reviewer uses its own default. Outside a Git repository, also add `--skip-git-repo-check` to that command. Never add it inside one.
4. In Codex, resolve `<claude-plugin-root>` as the `claude-review` skill says, and never pass `--write`.
5. When the reviewer is not installed, not logged in, or the run fails twice, use the next reviewer that `references/product-review.md` lists, and say so in one line.

## Helper skills

Each of these makes one step better. None is required. When one is not installed, do the built-in step, say so in one line at the moment you reach that step, and go on. Never open with a list of skills that are missing. Never print install commands as a condition, and never install anything.

| Skill | What it does here | Without it |
|---|---|---|
| `mstack-brainstorm` | Finds the reason behind an epic that has none yet | Your own open questions, one per message. Say: "I am using my own short version of the brainstorm." |
| `mstack-receive-review` | Processes the review's findings | The rules in `references/product-review.md` › Handle the findings. Say: "I am processing the review with my own rules." |
| `mstack-best-model-for` | Gives the model and effort of the reviewer and of a subagent | The host's default model. Say: "The review runs on the default model." |
| `mstack-evidence` | Builds the evidence the epic's problem rests on, from customer feedback | Take the evidence the user tells you |
| `mstack-decisions` | Turns meeting notes into decisions this epic takes as settled | The user tells you the decisions in the interview |
| `mstack-product-plan` | Writes the product plan an epic comes from | Interview the epic from the start |
| `mstack-write-specs` | Turns the approved epic into a specification | Tell the user the epic is the result, and that a developer writes the specification from it |
