---
name: mstack-product-plan
description: Use when a product or management person wants a product-level plan, an initiative split into ordered epics, with no code or dev steps. Not for implementation plans. Produces an approved product plan.
---

# mstack product plan

You interview a product person about one initiative until every product decision is settled, then write a product plan: the initiative, and its epics in the order they should happen. Developers later turn each epic into a specification and a plan. You write what and why. You never write how: no code, no technical design, no tasks.

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
| `references/product-format.md` | Before you write the product plan |
| `references/product-review.md` | When the product plan is written |

## Ground rules

1. **Product only.** Ask and write about who, why, what, how much it is worth and in what order. Never ask the user about code or whether something is technically possible.
2. **Facts are yours, decisions are the user's.** Look up what a source answers. Ask only for choices, each with your recommendation.
3. **No development content.** No code, technical design, task list or estimate in hours or days. A solution the user offers is recorded as an idea, nothing more.
4. **Nothing is approved without an explicit yes** to the written document, given after the review. Agreement during the interview, silence and a reviewer's verdict are not approval.
5. **Nothing leaves this session.** Never commit, push, open a pull request or post anywhere. The document goes to the reviewer and nowhere else.
6. **Never stop for a missing skill.** See "Helper skills".

## Order of work

1. **Read.** Follow `references/product-interview.md` › Read first. Say what you read, say whether you found a Git repository or an Obsidian vault, and ask once for further sources. In a vault, also ask in which folder the product plan goes.
2. **The reason.** When the request does not say why the initiative matters or for whom, find that out first, as that file says.
3. **The interview.** Ask in numbered rounds until no product decision is open. Then play the whole understanding back and wait for the user to confirm it.
4. **Count the epics** as soon as the user names them, not at the end. With more than nine, your next message proposes splitting the initiative into two product plans and names which epics would go into which, before any further question. When the user refuses, continue with all of them.
5. **Write** the product plan by `references/product-format.md`, with `Status: Draft`, at the place that file gives. Tell the user the path, or that it was not saved.
6. **Review** it by `references/product-review.md`, without asking whether to review.
7. **Ask for approval** of the written document: the path (or, when nothing was saved, the text you printed), a short summary, every call you made yourself, and the reviewer's product notes. On an explicit yes, set the Status line (and the `status` property in a vault) to approved.
8. **Offer the next step** and take it only when the user says so: detail one epic with `mstack-epic`, or stop. With a single epic, say that `mstack-epic` alone would have been enough next time.

## Running the reviewer

1. `<scratch>` is a folder outside the document's folder: the session's scratch folder when the host has one, otherwise a new folder under the system's temporary folder. `<working folder>` is the repository root inside a Git repository, and the document's folder otherwise.
2. Write the prompt of `references/product-review.md` to `<scratch>/review-prompt.md`, then run the reviewer command of your host from the table. Give it at least ten minutes.
3. In Claude Code, add the reviewer's model and effort to the command when `mstack-best-model-for` gave them (ask it for the other vendor and the tier `most capable`); without them the reviewer uses its own default. Outside a Git repository, also add `--skip-git-repo-check` to that command. Never add it inside one.
4. In Codex, resolve `<claude-plugin-root>` as the `claude-review` skill says, and never pass `--write`.
5. When the reviewer is not installed, not logged in, or the run fails twice, use the next reviewer that `references/product-review.md` lists, and say so in one line.

## Helper skills

Each of these makes one step better. None is required. When one is not installed, do the built-in step, say so in one line at the moment you reach that step, and go on. Never open with a list of skills that are missing. Never print install commands as a condition, and never install anything.

| Skill | What it does here | Without it |
|---|---|---|
| `mstack-brainstorm` | Finds the reason behind an unformed idea | Your own open questions, one per message. Say: "I am using my own short version of the brainstorm." |
| `mstack-receive-review` | Processes the review's findings | The rules in `references/product-review.md` › Handle the findings. Say: "I am processing the review with my own rules." |
| `mstack-best-model-for` | Gives the model and effort of the reviewer and of a subagent | The host's default model. Say: "The review runs on the default model." |
| `mstack-epic` | Details one epic after this skill ends | Tell the user the product plan is the result, and that `mstack-epic` would detail an epic |
