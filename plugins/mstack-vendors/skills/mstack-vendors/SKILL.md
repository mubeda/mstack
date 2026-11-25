---
name: mstack-vendors
description: Use when the user asks which other vendors or models can review code, review a plan or write code from this session, such as "which vendors can I use here", "can Codex review this", "who can review my plan", "what do I need to install or sign in for a second reviewer", or when another mstack skill needs the reviewers or developers of another vendor for its work, or sends a message that starts with "Called by:". Works in Claude Code, Codex and Antigravity. Returns, per job, which of Claude and Codex can be called from here, how each review is recorded, and what to install or sign in.
---

# mstack-vendors

Answers which other vendor's model can review code, review a plan or develop from this session, and how each review is recorded. A vendor is the provider of a model: `claude`, `codex` or `antigravity`. It is the interface that mstack skills call when they want a reviewer or a developer of another vendor, so the rules on who may review whose work live in one place. Its callers are the six mstack workflows, `mstack-plan` (for its plan review and for the start file's inline run) and `mstack-skill-creator` (in Claude Code, Codex and Antigravity), and a person may still ask it directly.

Another vendor is always optional. mstack works with one client installed: when no other vendor can be reached, the answer recommends a fallback review by this session's own vendor, with a warning. That is an answer, never a stop and never an error. Only a developer job can end with "no developer here", and that too is a line of the answer.

This skill names no model and needs no other skill. The models come from the caller's `Models` line.

## Host tools

This file is the same on every host. It names roles, and this table says what plays each role.

| Role | Claude Code | Codex | Antigravity |
|---|---|---|---|
| Loading a skill | The Skill tool | Read the skill's SKILL.md and follow it | Read the skill's `SKILL.md` with `read_file` and follow it |
| Running a script | The shell tool | A shell command | `run_command` |
| The skill folder | The base directory the Skill tool printed for this skill | The folder of the `SKILL.md` you read | The folder of the `SKILL.md` you read |
| The scratch folder | The session's scratch folder | A new temporary folder outside the repository | A new folder beside the working folder and outside the repository, removed at the end of the run |
| `<host>` for the script | `claude-code` | `codex` | `antigravity` |
| The agent that carries a Codex developer | `codex:codex-rescue`, among the agent types this session's subagent tool lists | Not used | Not used |
| A run outside the sandbox | Not needed | Not needed | Request it from the client for that one command; the client asks the user to approve it |
| Where the leader's vendor comes from | The host: always `claude` | The host: always `codex` | The model the session runs on: the caller's `Leader model` line, or in user mode the full id of the session's model when the session knows it |

## Files in this skill

- `references/result-block.md`: the called message and the result block, with the rules of the block. Read it before you parse a called message and before you write the block.
- `references/vendor-rules.md`: who gets a row, each row's state and record, the `Recommend` line, what to install or sign in, and the answer in user mode. Read it after the vendor check ran and before you fill a section or answer a person.
- `references/commands.md`: the command of each reviewer and developer row and the numbered steps of each section, for two reviewers, for a run that fails, for the fallback review and for a developer. Read it after the rows are decided and before you write the block.
- `references/review-prompt.md`: the prompt every reviewer gets. The steps name it for the caller; you do not need to read it to answer.
- `scripts/check-vendors.mjs`: the vendor check. It prints which of `claude` and `codex` this host can reach for each job, and the leader's vendor. It reads only, and it starts no session.

## Two modes

The first line of the message decides the mode, and nothing else does.

- **Called mode**: the message starts with the line `Called by: <skill>`. Ask the user nothing, in any step of this skill. One exception: a question that a line of the block's `Steps` asks belongs to the calling skill, and when you go on as the calling skill, ask it as that line says. In a review section the one question about a rejected model is the only question allowed. Write nothing inside the repository. Answer every job group of the message in one result block.
- **User mode**: every other message. A person asked which vendors they can use here. Run the vendor check as `## Availability` says, then answer by the part "The answer in user mode" of `references/vendor-rules.md`: a table of vendors and jobs, and no result block. Install nothing and sign in nothing: that is the work of `mstack-setup` (in Antigravity it shows the install commands for the user to run), and the answer names it.

## The order of work

These are the steps of called mode. User mode uses step 2 and `## Availability` only.

1. **Parse the message** by `references/result-block.md`: the host, the workspace, the `Leader model` line when there is one, and the job groups in the caller's order. Work from the caller's message itself, line by line, as it was written. A shorter version of it is not the message: when you loaded this skill with a summary of the message, go back to the message and read every line of it again, because a line that a summary dropped (`Leader model`, `Writers`, `Workflow`, `Models`) changes the answer.

   Then write down what you read, as plain text, before you run the vendor check. You may read `references/result-block.md` first; the note comes before the vendor check, and before any other reference file. Copy each line whole from the caller's message itself, never from the arguments you loaded this skill with, and summarise none: first `Host`, `Workspace` and `Leader model`, then for each job group, numbered in the caller's order, its `Job`, `Writers`, `Workflow` and `Models` lines. A line that the message does not hold is written as its name and the word absent, for example `Workflow: absent`. This note is not part of the result block and is no question to anybody: go on with step 2 in the same turn. Fill the sections from this note, and when the note and your memory of the message differ, the note wins.
2. **Run the vendor check once**, for the whole message, as a script of this host. Read `## Availability` first: in Antigravity it puts a line to the user and a request in front of this command.

   ```text
   node "<skill folder>/scripts/check-vendors.mjs" --host <host> --workspace "<workspace>" --leader-model "<the Leader model line>"
   ```

   Before you run it, look at the first lines of the message again, above the first `Job:` line: the value of `--leader-model` is the text after `Leader model:` on that one line, and nothing else. A `Models` line is not it: a model id from a `Models` line names a reviewer's or a developer's model, never the leader's. Leave out `--leader-model` and its value only when the message has no `Leader model` line. The script prints one JSON line per vendor and job (`vendor`, `job`, `state`, `reason`, `channel`) and, last, the line `{"leader": ...}`. It lists what this host can reach, not who may review: the rules of the next steps decide that.
3. **Take the leader's vendor** from the script's `leader` line, by the part "The leader's vendor" of `references/vendor-rules.md`.
4. **Fill each section** by `references/vendor-rules.md`, one job group at a time, in the caller's order.
5. **Fill the commands and the steps** as `## Commands and steps` says.
6. **End with the result block** of `references/result-block.md`. Decide every section first, then write the complete literal `## mstack-vendors result` block once into your visible assistant message **before** making any tool call of the calling skill's next step — including before reading `references/review-prompt.md` or any diff or plan file, before writing a review prompt file, before starting a fallback subagent, and before running any reviewer, fallback or developer command. The message that holds the block holds no draft of it, no correction of it and no notes on how you got there. The note of step 1 was written before the vendor check and is not repeated here. Never skip printing the literal `## mstack-vendors result` block because a section recommends `a fallback review` or because you continue as the calling skill in the same turn: output the complete block text first, and only after that text emit the calling skill's next tool call or question in the same turn.

## Availability

A vendor that cannot be reached is a row that says `not available`, with the reason and what to install or sign in. It never stops this skill and is never an error. A row's State and Reason come from the vendor check, as `references/vendor-rules.md` says; the three rules below come first.

1. **In Antigravity only: the check runs outside the sandbox.** The client's sandbox does not show a program installed under the user's home folder, so from inside it the check cannot see the `claude` and `codex` clients. Do these three steps in this order, in both modes:
   1. Before you request the run, write the user this line, as a message of its own: "The vendor check must run outside the sandbox, so the client will ask you to approve that run." Write it every time, also when you expect the run to be refused.
   2. Then request the run of the vendor check outside the sandbox from the client, once. Start the check in no other way before that request, not even to see its usage: the command is the one of step 2 of `## The order of work`. The approval is the client's own prompt and no question of yours, so called mode allows it: do not ask for it with a question of your own, and do not end your turn to wait for it.
   3. Go on only after the run completed and you saw its output. Keep three outcomes apart:
      - Approved, and the check finds a client: the rows are the check's rows.
      - Approved, and the check finds no client: that vendor's rows say `not installed`, as the check printed them.
      - Not approved: nothing is known about any client. Run the command of step 2 of `## The order of work` inside the sandbox, with `--leader-only` added: it prints only the `leader` line and checks no vendor. Every `reviewer` and `developer` row is `not available` with the reason `the run outside the sandbox was not approved`, and the answer carries the warning `the run outside the sandbox was not approved, so no other vendor was checked`. Never report such a row as `not installed` or `not signed in`, and tell the user to install nothing for it. In called mode the warning is all you say about it: the block still ends the answer.
2. **A check that fails is not a check.** When the check exits with another code than 0, or prints a line that is not a JSON object, follow rule 10 of `references/result-block.md`: every `reviewer` and `developer` row is `not available`, and none is filled in from what seems likely. A failed check is an answer too: do not run it again in another form, do not read or copy the script to find the cause, and go on to the block.
3. **In Claude Code only: a Codex developer needs its agent.** A `codex` row of a `developer` job that the check printed as `available` stays `available` only when this session's agent types list the agent of the host table. When they do not, the row is `not available` with the reason `channel missing: this session's agent types do not list codex:codex-rescue; start a new Claude Code session with the Codex plugin enabled`. A caller's or a user's statement about the session's agent types counts as that list.

## Commands and steps

Read `references/commands.md` once the rows of every section are decided: its first part, the part of this host, and of its last parts the ones a section needs (two reviewers, a run that fails and the fallback review for a review; a developer in a copy and a Codex developer for a developer job).

1. Every `reviewer` or `developer` row that is `available` gets the complete command of that file in its Command cell, filled with the row's channel from the vendor check, the model and the effort of the group's `Models` line, and the workspace. Every other row has an empty Command cell: a row that is `not available`, a `leader` row and a `fallback` row.
2. Every `code review`, `plan review` and `developer` section gets its `Steps`: the word `Steps:` and then the numbered lines that file gives for the section's `Recommend` line, each on its own line, copied and filled, never shortened or reworded. They are orders to the calling skill, which runs them after the block. You run none of them while you answer.
3. Only two names in angle brackets stay in a command or a step, `<prompt file>` and `<scratch file>`: the caller fills them when it runs the command. A `developer` section also keeps the run-time names that the first part of `references/commands.md` lists. A block that holds any other one is not finished.

A review by another vendor reads the work and changes nothing: both commands start the reviewer without a way to write a file. A developer of another vendor is kept from publishing its work before the leader reviewed it, as far as each route allows: a `claude` developer works in a copy without a remote, a `codex` developer under its own sandbox, and the leader reviews every change before it commits. On the route of Antigravity the Codex developer's command sets network access off. Through the Codex plugin in Claude Code nothing sets it: the vendor check found no line in the Codex configuration files it reads that turns it on, but a profile or a setting managed in the cloud still can. No command and no step starts a client of the leader's own vendor from a Command cell, and none installs anything.
