# The called message and the result block

Read this before you parse a called message and again before you write the block. These two forms are the contract between `mstack-vendors` and every skill that calls it. Field names, column names and their order are exact: a caller reads them by name and by place.

## The called message

Lines marked optional may be left out. A job group starts at a `Job:` line and holds the lines up to the next `Job:` line; a message may hold several groups, also several of the same job.

```text
Called by: <calling skill>
Host: claude-code | codex | antigravity
Workspace: <path of the repository>
Leader model: <model id or alias>                                   (optional)

Job: code review | plan review | developer
Writers: <vendor>[, <vendor>] | unknown                              (not for developer)
Workflow: review | dev                                               (for code review)
Models: <vendor>=<model id> <effort>[; <vendor>=<model id> <effort>] (from mstack-best-model-for; a vendor without an entry gets no command)
```

The host is the `Host` line, also when you run in another client: answer for that host. Take every line as the caller wrote it. Never fill in a missing line from the conversation, from the repository or from what seems likely, and never ask for it.

## The result block

```text
## mstack-vendors result

Leader: <vendor> | other | unknown
Warnings: none | <one line each>

### <job>
Writers: <vendors> | unknown
| Vendor | Role | State | Reason | Record | Command |
|---|---|---|---|---|---|
| <vendor> | <role> | <state> | <reason> | <record> | <command> |
Recommend: <vendors> | the leader's review | the leader's review + <vendor> | a fallback review | no developer here
Steps: <the numbered steps for this job>
```

What each cell of a row holds. Every row has exactly six cells, and no cell holds the character `|`.

- Vendor: `claude` or `codex` in a row with the role `reviewer` or `developer`. In a row with the role `leader` or `fallback` it is the leader's vendor, as the `Leader` line gives it.
- Role: `reviewer`, `leader`, `fallback` or `developer`.
- State: `available` or `not available`.
- Reason: empty when the row is available; otherwise why not, and what to install or sign in.
- Record: `cross-vendor`, `same-vendor`, `writer unknown`, `reviewer unknown` or `-`.
- Command: the complete command, or empty.

A filled section, as an example of the shape only: a developer job on the host `claude-code`, whose one eligible vendor is not signed in.

```text
### developer
| Vendor | Role | State | Reason | Record | Command |
|---|---|---|---|---|---|
| codex | developer | not available | not signed in: run codex login | - | |
Recommend: no developer here
Steps: no other vendor can develop from this session. Use a review workflow instead: this session writes the code and its review follows the code review rules.
```

An available `reviewer` or `developer` row always has its complete command in its Command cell, and every other section's `Steps:` is followed by its numbered lines.

## Rules of the block

1. Write one block for the whole message: the heading, the `Leader` line and the `Warnings` line once, then the sections. Write it as plain text, with its heading once and with no code fence around it.
2. Write one section per job group, in the caller's order, also when two groups name the same job. The heading is `### ` and the group's job, as the caller wrote it. Number the groups from 1 in the caller's order: a warning about one group starts with `<job> (group <number>): `.
3. `Warnings: none` when there is no warning. Otherwise write `Warnings:` and then one line per warning, each starting with `- `. Write a warning only where a rule of this skill gives one, with the rule's own words, and each one once. Never add a warning, a note or an explanation of your own: that a vendor has no row needs no warning.
4. A `code review` or `plan review` group without a `Writers` line, or with an empty one, gets `Writers: unknown` in its section and the warning `<job> (group <number>): no Writers line, so the writers are unknown`. A line that says `Writers: unknown` is a `Writers` line: the caller said that the writers are unknown, and it gets no warning.
5. A `code review` group whose `Workflow` line is missing, or is neither `review` nor `dev`, is answered as `Workflow: review`, never as `dev`, with the warning `code review (group <number>): no valid Workflow line, answered as review`.
6. A group whose `Job` is none of `code review`, `plan review` and `developer` gets the warning `<job> (group <number>): not a job of mstack-vendors, no rows` and a section that holds its heading and the two header lines of the table, with no row and with no `Writers`, `Recommend` or `Steps` line.
7. A `developer` section has no `Writers` line: a developer job has no writers yet.
8. The block is this skill's last output. Nothing of this skill comes after it: no summary, no advice, no question.
9. The block ends this skill, not the calling skill's work. In called mode, first emit the complete literal `## mstack-vendors result` block as visible assistant text, and only after that block text emit the calling skill's next tool call (such as writing a review prompt file or running a fallback review) or question in the same turn. Never execute a fallback review, write `<prompt file>`, or run any command of `Steps` before the complete literal `## mstack-vendors result` block has been written to the conversation. A called run never ends its turn on the block when the calling skill has a next step.
10. A vendor check that failed gives no row its state. The check failed when it exits with another code than 0, or when a line it printed is not a JSON object. Then use nothing else it printed. Every vendor the host lists (`codex` on the host `claude-code`, `claude` on the host `codex`, both on the host `antigravity`) counts as `not available` for every job, with the reason `availability check failed: <first line>`: the first line the check printed, on its output or on its error stream, with every `|` in it written as `/`, or `no output, exit <code>` when it printed nothing. Add the warning `the availability check failed, so no other vendor is offered`, once per block. The `Leader` line is then `claude` on the host `claude-code`, `codex` on the host `codex`, and `unknown` on the host `antigravity`. Fill the sections by the rules as with any other `not available` row: a review falls back, a developer job says `no developer here`. Never stop or ask because of it.
