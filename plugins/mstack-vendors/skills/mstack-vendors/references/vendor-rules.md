# Vendor rules

Read this after the vendor check ran and before you fill a section of the result block. It decides every row: which vendors get one, with which role, state and record, and what the `Recommend` line says. Work through the parts in order, once per job group.

A vendor is the provider of the model that runs. There are four vendor names: `claude`, `codex`, `antigravity`, and `other` for a model of any other provider. `unknown` is no vendor name: it says that a vendor is not known.

## The leader's vendor

The leader is the session that called. Its vendor is the `leader` line of the vendor check, copied into the block's `Leader` line: `claude`, `codex`, `antigravity`, `other` or `unknown`. Never work it out yourself from a model id, from the model you run on or from the client you run in: the script does it, from the host and from the `Leader model` line you passed to it.

Two values give a warning, each once per block:

- The host is `antigravity` and the leader's vendor is `claude`: `the leader runs a Claude model in Antigravity, so its vendor is claude and claude is not offered as a reviewer or a developer`.
- The leader's vendor is `unknown`: `the leader's vendor is unknown: send the full model id in Leader model`.

No other value gives a warning, `other` included.

## The writers

The writers of a group are the vendors on its `Writers` line. Read the line in two steps.

1. Is the line valid? It is valid when it is a list, separated by commas, in which every member is exactly one of the four vendor names. Then the section's `Writers` line repeats it. In every other case the writers are unknown, and the section says `Writers: unknown`: the line is missing or empty (the warning is rule 4 of `references/result-block.md`), it says `unknown` (no warning), or it holds any other text, also beside a vendor name (the warning `<job> (group <number>): the Writers line is not a list of vendor names, so the writers are unknown`).
2. Which vendors does it name? Every one of `claude` and `codex` that stands on the line as a member is a named writer, also when the line as a whole is not valid. `Writers: claude, unknown` gives writers unknown and the named writer `claude`.

Examples: `Writers: codex` and `Writers: claude, antigravity` are valid. `Writers: other` is valid too, because `other` is one of the four vendor names: it names no writer among `claude` and `codex`. `Writers: openai` is not valid, because `openai` is no vendor name.

## Who gets a row: eligibility

Decide eligibility before you look at what is installed. It depends only on the job, the leader's vendor and the named writers.

- For `code review` and `plan review`, a vendor is eligible when it is `claude` or `codex`, is not the leader's vendor, and is not a named writer.
- For `developer`, a vendor is eligible when it is `claude` or `codex` and is not the leader's vendor.

An eligible vendor gets one row. A vendor that is not eligible gets no row at all, whatever the vendor check printed for it: the check lists every vendor this host can reach, also the leader's own vendor and the writers, so a line of the check for a vendor that is not eligible is left out. `antigravity`, `other` and `unknown` are never the Vendor of a `reviewer` or `developer` row and never stand after `Recommend:`.

Rows of one role stand in the order `claude`, `codex`.

## State and Reason of a reviewer or developer row

Take the State and the Reason from the vendor check's line for that vendor and that job, unchanged, after the three rules of `## Availability` in `SKILL.md` (a run outside the sandbox that was not approved, a check that failed, the agent of a Codex developer in Claude Code): where one of them gives a row its reason, the check's line for that row is not used. "What to install or sign in" says what a reason holds.

Two things change an `available` line. When the group's `Models` line has no entry for the vendor, or the group has no `Models` line, the row is `not available` with the reason `no model was given for <vendor> in the Models line`. When the vendor's model or effort on that line holds one of the characters `"`, `$`, `` ` ``, `\` or `|` (a model or effort has no `\` on any system), the row is `not available` with the reason `the Models entry for <vendor> holds a character that is not supported`, because the value would change the command it goes into. Such a vendor is never recommended.

An entry for `antigravity` in a `Models` line is ignored, with the warning `<job> (group <number>): the Models entry for antigravity is ignored: Antigravity is never called as a reviewer or a developer`.

In the rules below, "available" means a row whose State is `available` after this part.

## What to install or sign in

A reason says what is missing and how to get it, and the vendor check writes all of it: a reason that starts with `not installed: ` names the missing client and `mstack-setup`, which installs it in Claude Code and Codex and in Antigravity shows the install command for the user to run; one that starts with `not signed in: ` gives the client's own sign-in command, which is a step for the user; one that starts with `channel missing: ` says what the channel needs. Copy the reason as the check printed it and add no command of your own: this skill holds no install command, because `mstack-setup` is the one place that has them.

This skill installs nothing and signs nobody in, in either mode. A reason that starts with `sign-in not confirmed: ` carries no instruction: the check could not tell whether the client is signed in. Neither does `the run outside the sandbox was not approved` or `availability check failed: `.

## A plan review, or a code review with Workflow review

1. Write one `reviewer` row per eligible vendor.
2. When at least one of those rows is available, `Recommend:` names every available one, in the order of the rows: `Recommend: claude, codex`, `Recommend: claude` or `Recommend: codex`.
3. When none is available, also because no vendor is eligible, add one `fallback` row after the reviewer rows: its Vendor is the leader's vendor, its State is `available`, its Reason is empty. Write `Recommend: a fallback review` and the warning `<job> (group <number>): no other vendor reviews`. This is an answer, not a failure: the skill never stops and never reports an error because no other vendor can be reached.

## A code review with Workflow dev

In a dev workflow another vendor's developer wrote the code and the leader always reviews it.

1. Write one `leader` row first: its Vendor is the leader's vendor, its State is `available`, its Reason is empty.
2. Then write one `reviewer` row per eligible vendor.
3. When a reviewer row is available, write `Recommend: the leader's review + <vendor>` with that vendor. This holds also when the writers are unknown. When two are available, name the first in the order `claude`, `codex` and add the warning `code review (group <number>): <the other vendor> is available as a second reviewer too`.
4. When no reviewer row is available, write `Recommend: the leader's review`, with no warning about it and no `fallback` row: the leader's review is the review.
5. When the leader's vendor is `claude`, `codex` or `antigravity` and stands on the group's `Writers` line as a member, add the warning `code review (group <number>): a dev workflow needs a developer of another vendor`.

## A developer job

1. Write one `developer` row per eligible vendor.
2. When at least one is available, `Recommend:` lists the available ones in the order `claude`, `codex`. The order is no preference: the caller asks the user which vendor develops.
3. When none is available, also because no vendor is eligible, write `Recommend: no developer here` and `Steps: no other vendor can develop from this session. Use a review workflow instead: this session writes the code and its review follows the code review rules.` This is an answer, not a failure of the skill: only the caller decides whether its own work can go on without a developer.

## The Record column

A `developer` row and every row whose State is `not available` get `-`.

Every other row is a review and gets its record from the table below, which is the recording rule of `mstack-receive-review`. Read it with these two lines: the `Writers` line is the group's `Writers` line as the caller sent it, and the `Reviewer vendor` line is the row's Vendor cell (in a `leader` or `fallback` row that is the leader's vendor, so it can be `other` or `unknown`). Check the rows from the top and take the first one that matches.

| Row | When | Record |
|---|---|---|
| 1 | The `Writers` line is anything but a list, separated by commas, in which every member is exactly one of the four vendor names. So it matches when the line is missing or empty, when a member is empty (as after a comma at the end), and when a member is `unknown` or any other text, also beside a vendor name | `writer unknown` |
| 2 | The `Reviewer vendor` line is anything but exactly one of `claude`, `codex` and `antigravity`. So it matches when the line is missing or empty, and when it holds `other`, `unknown`, two names or any other text | `reviewer unknown` |
| 3 | The reviewer's vendor is one of the writers | `same-vendor` |
| 4 | Every other case | `cross-vendor` |

Row 1 comes first: with writers unknown every review row of the section says `writer unknown`, the `leader` row included, also when the leader's vendor is unknown too. The record of a `leader` or `fallback` row comes from the table like any other: it is `same-vendor` only when the leader's vendor is one of the writers, and it is never `cross-vendor` when the leader's vendor is `other` or `unknown`.

One exception. On the host `codex`, the `fallback` row counts its `Reviewer vendor` line as `unknown` when the group's `Models` line has no entry for `codex`, because that review then runs on the model the client is configured with, which this skill cannot know before the run. With an entry for `codex` the row follows the table as it stands. The exception holds for the block only: after the run, the hand-over to `mstack-receive-review` takes its `Reviewer vendor` line from the run's own header, as the fallback lines of `references/commands.md` say.

## Before you write the block

Go through the message once more and check each of these, because each is easy to miss:

1. The `Leader` line is the vendor check's `leader` line, and the check got the `Leader model` line when the message has one.
2. Each section's `Writers` line comes from the group's own `Writers` line, read as "The writers" says. A line that is there is never reported as missing.
3. No `reviewer` or `developer` row has the leader's vendor as its Vendor, and no `reviewer` row has a named writer of its group, also when the vendor check listed that vendor as available. A `leader` or `fallback` row has the leader's vendor, as "A plan review" and "A code review with Workflow dev" say.
4. Every `Models` line was read: a vendor without an entry is `not available`, and an entry for `antigravity` gave its warning.
5. Every warning a rule above gives is on the `Warnings` line, and nothing else is.
6. A `leader` row is the first row of its table, and a `fallback` row is the last.
7. No Command cell and no step holds a name in angle brackets other than `<prompt file>` and `<scratch file>`, or in a `developer` section the run-time names that the first part of `references/commands.md` lists, and a vendor without an entry on the `Models` line has no command.
8. The three rules of `## Availability` in `SKILL.md` were applied before the check's lines: after a run outside the sandbox that was not approved no reason says `not installed`, after a failed check no `reviewer` or `developer` row is `available`, and a reason holds no `|`.

## Command and Steps

A `leader` or `fallback` row never has a command: its Command cell is always empty. So is the cell of a row that is `not available`.

The Command cell of an available `reviewer` or `developer` row and the `Steps` of every section are filled as `## Commands and steps` in `SKILL.md` says, after every row is decided: `references/commands.md` gives a developer's command and steps in its parts `## A developer in a copy` (`claude`) and `## A Codex developer` (`codex`). A `developer` section that says `Recommend: no developer here` takes the `Steps` text of "A developer job" above, and its rows have no command.

## The answer in user mode

A person asked which vendors they can use here. Nobody passed a called message, so there are no writers and no models.

1. The host is this session's host (the host table of `SKILL.md`), and the workspace is the repository the session works in. Run the vendor check as step 2 and `## Availability` of `SKILL.md` say; leave out `--leader-model` unless the host is Antigravity and the session knows the full id of its model.
2. Show one table, with one row per vendor the check listed that is not this session's own vendor. After a run outside the sandbox that was not approved the check lists no vendor: then the rows are `claude` and `codex`, without the session's own vendor. There is never a row for `antigravity`.

   ```text
   | Vendor | Code review | Plan review | Developer |
   |---|---|---|---|
   | <vendor> | <cell> | <cell> | <cell> |
   ```

   A cell is `available`, or `not available: ` and the reason. The reason is the row's reason as the part "State and Reason" gives it, without the `Models` rule; it holds no `|`. Write the reason out in every cell, also when three cells of a row have the same one: a cell never says "same reason" or points at another cell.
3. Under the table, say in plain words what to do for each thing that is missing. For a client or a plugin that is not installed, name `mstack-setup`, and say that the user can run it: in Claude Code and Codex it installs the client or plugin, and in Antigravity it shows the install command for the user to run. Give no install command for a client yourself. For a sign-in, give the sign-in command as a step for the user. After a run outside the sandbox that was not approved, say that nothing is known about the clients until that run is approved. When the leader's vendor in Antigravity is `claude`, say in one sentence that `claude` is not listed because the session itself runs a Claude model.
4. Add one sentence: a vendor reviews only work it did not write, and when no other vendor can be reached, the review is a fallback review by this session's own vendor, so the mstack skills still work.
5. Install nothing and sign in nothing, also when the user's question asks for it: name `mstack-setup`. Give no command that starts a review or a developer run, because no model was passed. Write no result block.
