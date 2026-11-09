# Handoff template

Read this in step 4. Copy the template, fill every section, and keep the section order: the next session reads top to bottom and starts working after the first section. A section with nothing to say reads "None", followed by the reason. `scripts/check-handoff.mjs` checks the headings, the identity line, the gate lines and the absence of secrets.

## Rules for every section

1. **Point, do not copy.** Specs, plans, `progress.md`, issues, pull requests, commits and diffs go in as paths or links. The handoff holds only what no other file holds: uncommitted work, live decisions, gates still due, and the next commands.
2. **Mark what you verified.** A claim you checked this session says how (the command and its result). A claim you only assumed says "assumed". The next session trusts the file, so an unmarked guess becomes a false premise.
3. **A gate is green only with evidence.** Write it as green only when its exact command ran in this session, passed, and ran after the last edit to the working tree, so it tested exactly the state the Tree fingerprint records. Record the command, the HEAD it ran against, and the last line of its output. Everything else is due.
4. **No secrets.** Refer to a secret by its name (`the GITHUB_TOKEN environment variable`), never by its value. Never paste environment values, tokens, passwords, private keys, connection strings or command output that contains them. Leave personal data out.
5. **Exact commands.** Every command is copy-paste ready, from the repository root unless it says otherwise.

## Template

````markdown
# Handoff: <one-line description of the work>

Repository: <absolute path of the repository root> | Branch: <branch> | HEAD: <full SHA> | Tree: <16-hex fingerprint> | Written: <yyyy-mm-dd hh:mm timezone>

## Start here

1. `cd <repository root>`
2. Run `node <mstack-handoff skill folder>/scripts/check-handoff.mjs <this file> --resume`, or without that skill compare `git branch --show-current` and `git rev-parse HEAD` with the identity line. If anything changed, follow "If the state changed" at the end of this file before anything else.
3. `git status --porcelain=v1 -b -uall` matches the uncommitted work listed below.
4. `<the cheapest gate that proves the tree still works>`. Expected: <its passing result line>.
5. Resume point: <the exact next action, one sentence>.
6. Then: <the next two or three actions, in order>.

## Goal

<What the work is for, in one or two sentences, and where its source of truth lives (an issue, a spec, a plan folder).>

## State

- Base branch: <base> | Upstream: <remote branch, or "none"> | Ahead/behind: <n ahead, m behind, or "no upstream">
- Pull request: <link, state and draft flag, or "none">
- Plan: <plan folder and progress.md path, or "none">. Its progress.md is the status record for plan tasks; this file does not repeat it.
- Uncommitted work (not stashed, not committed):
  - `<status code> <path>`: <what the change is, and whether it is finished>
- Existing stashes: <from git stash list, or "none">. This handoff created none.
- Worktrees and background jobs: <worktree paths, lane branches, job or thread ids and what each is doing, or "none">
- Tree health: <"builds and tests pass at HEAD with the dirty paths applied", or one line on what is broken>

## Scope

| Item | Title | State | Note |
|---|---|---|---|
| <#41 or task 1.2> | <title> | <Open, In progress or Closed> | <evidence or what is left> |

## Gates

- Green: `<command>` at <short SHA>, result: `<last output line>`
- Due: `<command>`, because <why it has not run or must run again>

## Decisions

- Approved by the user: <decision>, approved <where: chat date, issue comment, PR review>.
- Blocked on the user: <question>. Recommended: <answer and one-line reason>.
- The agent's calls: <decision>, because <reason>. The next session may revisit these.

## Gotchas

- <Something the next session would otherwise trip over: a flaky test, a slow command, a misleading error, a file that must not be touched.>

## Suggested skills

- <skill name>: <why the next session needs it, in a few words>

## If the state changed

- Branch differs: stop and ask the user before changing anything.
- HEAD moved and the recorded HEAD is an ancestor of the new one (`git merge-base --is-ancestor <recorded SHA> HEAD`): list the new commits with `git log --oneline <recorded SHA>..HEAD`, treat every gate above as due, and continue.
- Only the Tree fingerprint changed (the uncommitted work was edited): treat every gate above as due, and continue.
- HEAD moved and the recorded HEAD is not an ancestor: stop and ask the user, because history was rewritten.
- The uncommitted work differs from the list above: report the difference, and do not discard or restore anything.
````

## Paste prompt

When the user wants one, give this, filled in, and nothing longer. It points at the file instead of carrying its content, because a shell or a chat box can mangle backticks and `$(...)` in pasted text.

```text
Read <absolute path of the handoff file> in full, then follow its "Start here" section. Treat it as the record of the previous session: do not redo work it marks done, but re-run its first gate before trusting it.
```
