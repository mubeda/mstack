---
name: mstack-handoff
description: Use when the user is running out of context or tokens, wants to pause, wants to hand long-running work to another agent, session or host, or says "write a handoff", "hand this off", "save where we are" or "continue from this handoff". Writes one resumable handoff file (branch, HEAD, uncommitted paths, pull request, issue status, gates green and due with exact commands, approved and blocked decisions, next commands first) without committing, stashing or leaking secrets, verifies it, and stops; or resumes from such a file. Works in Claude Code and Codex. It does not continue the work itself.
---

# mstack handoff

You write one file that lets a fresh agent session, on this host or the other one, continue the current work exactly where it stopped. Or, given such a file, you resume from it. Writing the handoff is the whole job: you do not finish the remaining work, and you stop once the file is written and checked.

The file holds only what no other file holds: the uncommitted work, the live decisions, the gates still due, and the next commands. Everything else (specs, plans, `progress.md`, issues, pull requests, commits) goes in as a path or a link.

## Host tools

| Role | Claude Code | Codex |
|---|---|---|
| Your question tool | `AskUserQuestion` | A numbered question in chat, then wait for the reply |
| The skill folder | The base directory shown when this skill loaded | The folder of this SKILL.md |
| Commands that need network (`gh`) | Run directly | Run as approved (escalated) commands, because the sandbox turns the network off |

On either host, when a sandbox refuses to write the handoff file outside the repository, ask for approval of that one write. Do not move the file into the repository to avoid the prompt.

## Files in this skill

| File | When |
|---|---|
| `references/handoff-template.md` | Step 4, and when resuming |
| `scripts/check-handoff.mjs` | Step 5 |

## Ground rules

1. **Change nothing while handing off.** Never commit, stash, push, pull, rebase, reset, open a pull request, or post to a tracker to make the handoff. Uncommitted work stays where it is, and the file lists it.
2. **Evidence or "assumed".** A status you checked this session says how. Anything else is marked "assumed", because the next session trusts the file.
3. **A gate is green only if it passed this session, after the last edit and at the current HEAD**, with its exact command, the HEAD it ran at, and its result line. A gate that passed before a later edit or commit is due again.
4. **No secrets, no personal data.** Name a secret, never paste its value.
5. **Ask nothing you can look up.** The handoff often happens when context is short, so the only question you may ask is where to write the file, and only when the user has not said and the default does not fit (step 4 says when it does not).

## Write a handoff

### 1. Stop at a safe point

Finish the current small step, or back out of it so the tree is in a state you can describe. Start nothing new. Stop or let finish any subagent, lane or background job you started, and record the ones still running (worktree, branch, job or thread id, what it is doing). Take no step that cannot be undone.

### 2. Snapshot the repository

Run these from the repository root and keep their output for step 4. Each one is read-only.

```bash
git rev-parse --show-toplevel
git branch --show-current                              # prints nothing on a detached HEAD: record "(detached)"
git rev-parse HEAD
git rev-parse --abbrev-ref --symbolic-full-name @{u}   # fails when there is no upstream: record "none"
git status --porcelain=v1 -b -uall                     # the uncommitted work, file by file
git stash list                                         # report existing stashes; never create one
git worktree list --porcelain
node <skill-folder>/scripts/check-handoff.mjs --fingerprint <repository root>   # the Tree fingerprint for the identity line
```

Take the fingerprint last, after the final edit. It hashes the uncommitted changes and untracked files, so it changes whenever their content changes, even when `git status` looks the same. The script exits 2 with a message, and prints no fingerprint, when the path is not a git repository or the repository has no commit yet. A handoff needs a commit to anchor to. In a repository with no commit yet, tell the user, write "none (no commit yet)" for HEAD and Tree in the identity line, and check the file by reading it against the points in step 5, because the script rejects that identity line.

On GitHub, find the pull request with `gh pr list --head '<branch>' --state all --json number,url,state,isDraft` (the branch in single quotes, where a shell expands nothing). It prints `[]` when there is none. Do not use `gh pr view` for this, because it fails when the branch has no pull request. For another host, use its CLI or connected tool, or write "unknown".

### 3. Collect the rest of the state

1. **Scope.** The issues or tasks in scope and the state of each. When the work is a workflow run, copy its status table. When it is an `mstack-plan` execution, point at the plan folder and its `progress.md` instead of copying the task table, and name the plan's `execute-plan.md` as how to continue.
2. **Gates.** Every check that decides whether the work is done (tests, typecheck, lint, build, the plan's or repository's completion checklist). Each one is green (it passed this session, with evidence) or due (with its exact command and why).
3. **Decisions.** Split them three ways: approved by the user (say where), blocked on the user (the question and your recommendation), and your own calls (with the reason).
4. **Gotchas.** What the next session would otherwise trip over.
5. **Suggested skills.** The skills the next session should load, by name (the mstack skill that was running first, then `mstack-diagnose` for an open bug, and so on).

### 4. Write the file

Follow `references/handoff-template.md`, section by section and in its order, with "Start here" first.

Write the file outside the repository, so it can never be committed by accident. Use the path the user named; otherwise `~/.mstack/handoffs/<repository folder name>/<yyyy-mm-dd-hhmm>-<slug>.md` (on Windows, under `%USERPROFILE%\.mstack\handoffs\`). Do not default to the system temp folder, because some hosts and every reboot clear it. The default does not fit when the home folder does not outlive the session (a cloud session, a container that is thrown away): say so and ask the user where to write the file, because a handoff nobody can reach afterwards is worth nothing. Write the file with your file tool, not with `echo` or a heredoc, so nothing in it is expanded by a shell.

### 5. Check the file

```bash
node <skill-folder>/scripts/check-handoff.mjs <handoff-file>
```

It checks the title, the identity line against the repository's current branch (or `(detached)`), HEAD and Tree fingerprint, that no section is empty, the sections and their order, that every green gate has its command, result and the identity HEAD, every leftover template placeholder, secret-looking strings (with their line numbers), and that the file is not an unignored file inside the repository. Fix every line it prints and run it again. If the repository has a secret scanner installed (for example `gitleaks`), run it on the file as well. Without `node`, check the same points by reading the file, and say so.

Then read the whole file once as the next session would. Downgrade anything you only assumed, and fill any step a cold reader could not follow.

### 6. Hand over and stop

Reply with:

1. The absolute path of the file.
2. What is saved only in the working tree (the uncommitted paths), and that nothing was committed, stashed or pushed.
3. The resume point in one sentence.
4. The paste prompt from `references/handoff-template.md`, when the user asked for one or the next session runs on another host.

Then stop. Do not continue the work in this session.

## Resume from a handoff

When the user says to continue from a handoff file:

1. Read the whole file before running anything.
2. Check it with `node <skill-folder>/scripts/check-handoff.mjs <handoff-file> --resume`. It fails on a damaged or incomplete file, and it reports whether the branch, HEAD and Tree fingerprint are the same as recorded. It also prints a `gate    DUE` line for each green gate that ran at a commit other than the recorded HEAD, which handoffs written by version 0.1.0 may contain: treat that gate as due and continue.
3. Run its "Start here" steps in order. When anything changed, follow its "If the state changed" section: a different branch or rewritten history stops you until the user decides; a HEAD that moved forward, or changed uncommitted work, turns every green gate into a due one.
4. Treat the file as the record of the previous session. Do not redo work it marks done, but re-run its first gate before you trust it, and re-check any claim marked "assumed" before you build on it.
5. When it points at an `mstack-plan` folder, follow that plan's `execute-plan.md` and its resume rules, which take precedence for plan tasks.
6. Tell the user where the previous session stopped, what you re-verified, and the resume point, then continue the work with the skills it suggests.
