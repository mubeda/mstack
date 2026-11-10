---
name: mstack-setup
description: Use when the user wants to set up, install or check what the mstack skills need, such as "set up mstack", "install the dependencies", "what is missing for mstack", "install codegraph", "my workflow stopped at its preflight", on a new machine, or when another mstack skill stopped and named mstack-setup. Works in Claude Code and Codex, on Linux, macOS and Windows. Reports each dependency's state and installs the missing ones at user scope after one confirmation.
---

# mstack-setup

Checks everything the mstack skills need for the host it runs in, and installs what is missing for every project of the user, after one yes. It needs no other mstack skill, and it writes nothing into the current repository.

| Role | Claude Code | Codex |
|---|---|---|
| Question tool | AskUserQuestion | a numbered question in chat, then wait |
| `<host>` for the script | `claude` | `codex` |
| The scratch folder | The session's scratch folder | A folder `mstack-setup` under the folder `node -p "require('os').tmpdir()"` prints |

## Two modes

- **User mode**: the user invoked the skill. Run sections 1 to 4.
- **Called mode**: another skill loaded this one and said which skill is calling. Ask nothing and install nothing. Run section 1 without its step 5 (the offer to check the other host), and section 2 steps 1 and 2, then end with this block:

  ```text
  ## mstack-setup result

  | ID | Tier | State | Detail |
  |---|---|---|---|
  | <id> | <mandatory or optional> | <ok, MISSING, LOGIN, SKIP, or installed, loads in a new session> | <detail> |

  Commands to run after the user's yes: <the numbered list, or none>
  Steps for the user: <logins and other manual steps, or none>
  ```

## 1. Status

1. Run `node <skill-folder>/scripts/check-setup.mjs --host <host> --json`, where `<skill-folder>` is this skill's folder. If `node` itself is missing, say so, point at https://nodejs.org, and stop: nothing else can be checked.
2. If the JSON says `"supported": false`, show the status it read, say that this platform is not covered, and propose no command. Stop after the report.
3. For each skill row the script reports `ok`, check whether it is in this session's skill list (a plugin skill shows as `<plugin>:<skill>`). When it is not, show it as "installed, loads in a new session". The script reads the disk; only the session list tells what is loaded.
4. Show the status as a table: ID, tier, state, detail.
5. When the other host's command-line tool is `ok` (`reviewer-cli`), offer once to check that host too, by running the script again with the other `--host`. Each host is its own list.

When no row has a command to propose (every row is `ok`, or the rest are manual steps), say so and propose nothing. Missing optional rows are proposed too, in their own group.

## 2. One list, one yes

1. Read `references/dependencies.md`. For every `MISSING` row, mandatory or optional, take the command for this host. A row whose cell is "none" or a manual step gets no command, and every `LOGIN` or `SKIP` row is a manual step too (a login, or a tool to install first): list them under manual steps.
   Before a `marketplace add` line, check the host's marketplace list (`claude plugin marketplace list --json`, or `codex plugin marketplace list`). When the marketplace is already there, replace the line with its update (`claude plugin marketplace update <name>`, or `codex plugin marketplace upgrade <name>`), so a newly published plugin is found.
2. For codegraph: when `codegraph-cli` is `ok` and only `codegraph-connected` is `MISSING`, propose only the connect command. Whenever the connect command is in the list, name before the question the files it writes, from the reference file.
3. Write the full list to `setup-commands.md` in the scratch folder of the host table (outside the repository), grouped as mandatory then optional, one numbered command per line, with the files the connect command writes when it is listed. Then show the same list to the user in your reply. Only commands in that file can run.
4. Ask once with your question tool, about that list: run all, run some (by number), or none. Wait for the answer. Run nothing before it. A "run all" written before the list existed is not an answer to it: ask again. An answer the user gave for the list once it is shown ("when you show the list, run all") counts. When no answer can reach you, stop after showing the list and report it.

## 3. Run

1. Run only the accepted commands, each on its own and once, in the list's order. Do not run an install again to investigate a result; the final check below shows what changed. A command that fails does not stop the others: note its exit code and its last output lines, and go on.
   A plugin install can stop to ask for confirmation of a command the marketplace declares (Claude Code says to pass `-y` when not interactive). Then show that command to the user and ask; rerun the install with `-y` only after their yes, and otherwise record it as skipped by the user.
2. Record each command the user left out as "skipped by the user".

## 4. Final check and report

1. Run the script again with the same `--host` and `--json`.
2. Report each dependency's new state; each failed command with its last output lines; each skipped command; each manual step with its command (logins, ponytail's hook trust in Codex, the tools without an installer); and every skill or plugin installed now, which loads in a new session.
3. Never say the setup is complete while a mandatory row is not `ok`. Say which rows are left and the step for each.

Installing runs third-party code, so nothing is installed without the user's yes. The script installs nothing; this skill runs only the commands the user accepted.
