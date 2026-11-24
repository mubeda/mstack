---
name: mstack-epic
description: Use when a product or management person wants one epic detailed, from a product plan or described in chat, so developers can write a spec from it. No code or dev steps. Produces an approved epic.
---

# mstack epic

You take one epic and interview its product person in depth, then write one detailed epic document. A developer can start a specification from it without asking the product decisions again. You write what and why. You never write how: no code, no technical design, no tasks.

## Host tools

This file is the same on every host. It names roles, and this table says what plays each role.

| Role | Claude Code | Codex | Antigravity | Claude desktop | ChatGPT desktop |
|---|---|---|---|---|---|
| Your question tool | A numbered round in chat, then wait | A numbered round in chat, then wait | A numbered round with `ask_question`, then wait | A numbered round in chat, then wait | A numbered round in chat, then wait |
| Your subagent tool | `Agent`, with `model` and `effort` set | The session's agent tool, if it has one | None: no source says which vendor runs an Antigravity subagent, so you read it yourself | None | None |
| Loading a skill | The Skill tool | Read its SKILL.md and follow it | Read its SKILL.md with `read_file` | By its name, when it is installed | With `@` and its name, when it is installed |
| The cross-vendor reviewer | Codex, through the `codex` skill of the skill-codex plugin | Claude, through the `claude` command | Codex when the `codex` command is installed, otherwise Claude when the `claude` command is installed, otherwise none | None | None |
| The reviewer command | `codex exec --sandbox read-only -C "<working folder>" - < "<scratch>/review-prompt.md" > "<scratch>/review.md" 2> "<scratch>/review.err"` | `cd "<working folder>" && claude -p --safe-mode --model <model> --effort <effort> --output-format json --permission-mode plan --tools "Read,Grep,Glob" --settings '{"advisorModel":"off"}' < "<scratch>/review-prompt.md" > "<scratch>/review.json" 2> "<scratch>/review.err"`. The review is the `result` field of `<scratch>/review.json` | For Codex, the Claude Code column's command. For Claude: `cd "<working folder>" && claude -p --safe-mode --model <model> --effort <effort> --output-format json --permission-mode plan --tools "Read,Grep,Glob" --settings '{"advisorModel":"off"}' < "<scratch>/review-prompt.md" > "<scratch>/review.json" 2> "<scratch>/review.err"`. The review is the `result` field of `<scratch>/review.json` | None: a fresh read by the same model | None: a fresh read by the same model |
| Saving a file | Your file tool | Your file tool | Your file tool | Your file tool when the session has one, otherwise print the document | Your file tool when the session has one, otherwise print the document |

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

This part is for the cross-vendor reviewer only. Skip this whole part, the lookups of step 3 included, when any source of the document, or of the product plan an epic is built from, holds what customers or colleagues said: an evidence document, a decisions document, customer feedback, an interview, or meeting notes or a transcript, given as a file, an attachment or pasted text. When you are not sure whether a source holds such material, treat it as if it does. Then look up and start no other client and send nothing of those sources anywhere: `references/product-review.md` › Who reviews gives the same-vendor read that runs instead, and its `Review:` line ends with exactly these words, after the reviewer, the round and the verdict: "same-vendor, because a source holds customer feedback or meeting notes".

Do the steps in this order.

1. **Folders.** `<scratch>` is a folder outside the document's folder: the session's scratch folder when the host has one, otherwise a new folder under the system's temporary folder. `<working folder>` is the repository root inside a Git repository, and the document's folder otherwise.
2. **The prompt.** Write the prompt of `references/product-review.md` to `<scratch>/review-prompt.md`.
3. **The client.** In Claude Code and Codex it is the one your column of the table names. In Antigravity, the sandbox does not show a client that is installed under the user's home folder, so finding one needs a run outside the sandbox. When the user already said no to such runs, run no lookup at all and take the outcome "Not approved" below. Otherwise, when the review step is reached and never earlier, tell the user in one line that the review needs runs outside the sandbox. Then request a run outside the sandbox for the lookup `command -v codex`, and for `command -v claude` when Codex was not found. A run outside the sandbox is written exactly like your other shell commands, with the same folder and the same variables in front of it: only the sandbox differs. You ask for such a run on the command itself, with your shell tool, and the client shows the user the approval: never ask for it in a chat message or a numbered round. Keep three outcomes apart:
   - **Approved and found:** that client reviews. Go on with step 4.
   - **Approved and not installed** (the lookup prints nothing): that client is not installed. Never look for it by another route, such as a full path. Look up the next client. When neither is installed, do your own second read and say: "No other vendor reviewed this document."
   - **Not approved** (the user refused the run, or said no to such runs beforehand): look up and start no further client, do your own second read, and say: "The run outside the sandbox was not approved, so no other vendor reviewed this document." Never say then that a client is not installed, because you do not know.
4. **Model and effort.** When `mstack-best-model-for` is installed, ask it for the vendor of the chosen client (`codex` or `claude`) and the tier `most capable`, and add its model and effort to the command. For the Claude command, `<model>` is the full model id from its "How to set" cell, never the short name. Without that skill, leave both out of the Codex command, which then uses its own default, and put `claude-sonnet-5-5` and `high` into the Claude command, which never runs without a model.
5. **The run.** Run the reviewer command of the chosen client from the table, as it is, and give it at least ten minutes. Outside a Git repository, add `--skip-git-repo-check` to the Codex command, never to the Claude command, and never inside a repository. Run the Claude command with exactly the flags of the table: without them Claude Code loads the user's own setup, which costs more, can run another model and puts other text into the answer. In Codex, the Claude command needs the network, so run it as an approved command. In Antigravity, request a run outside the sandbox for it, as in step 3. Do not report or finish before you have seen the command's completion and read its output. Never start a second Antigravity session for a review.
6. **Check the result.** A Codex run counts when it ended without an error and `<scratch>/review.md` holds the review. A Claude run counts only when all four hold: `<scratch>/review.json` parses, its `is_error` is `false`, the keys of its `modelUsage` are only the full model id you asked for, and its `permission_denials` is an empty list. Anything else is a failed run, never a clean review.
7. **When it fails.** Read the error and run the same command once more. When the reviewer is not logged in or the run failed twice, take the next reviewer and say so in one line. In Antigravity the next one after Codex is Claude: look it up as in step 3, also when Codex was found, and go on from step 4; after Claude it is your own second read. In Claude Code and Codex it is the next one that `references/product-review.md` lists.
8. **The label.** The `Review:` line says "cross-vendor" only when the reviewer's vendor is not the vendor of the model you run on. In Antigravity your own model may be a Claude model: a Claude review is then recorded as "same-vendor", with Claude named as the reviewer.

## Helper skills

Each of these makes one step better. None is required. When one is not installed, do the built-in step, say so in one line at the moment you reach that step, and go on. Never open with a list of skills that are missing. Never print install commands as a condition, and never install anything.

| Skill | What it does here | Without it |
|---|---|---|
| `mstack-brainstorm` | Finds the reason behind an epic that has none yet | Your own open questions, one per message. Say: "I am using my own short version of the brainstorm." |
| `mstack-receive-review` | Processes the review's findings | The rules in `references/product-review.md` › Handle the findings. Say: "I am processing the review with my own rules." |
| `mstack-best-model-for` | Gives the model and effort of the reviewer and of a subagent | A subagent and the Codex reviewer run on their own default model, the Claude reviewer on the fixed model of "Running the reviewer", step 4. Say which: "The review runs on the default model.", or "The review runs on the reviewer's fixed default, <model>." |
| `mstack-evidence` | Builds the evidence the epic's problem rests on, from customer feedback | Take the evidence the user tells you |
| `mstack-decisions` | Turns meeting notes into decisions this epic takes as settled | The user tells you the decisions in the interview |
| `mstack-product-plan` | Writes the product plan an epic comes from | Interview the epic from the start |
| `mstack-write-specs` | Turns the approved epic into a specification | Tell the user the epic is the result, and that a developer writes the specification from it |
