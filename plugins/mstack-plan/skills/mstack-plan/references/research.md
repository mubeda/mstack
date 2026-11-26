# Research outside the repository

Read this in phase 1, step 6 of SKILL.md, once the two kinds of item are listed. Its rules bind.

With no item, write "Research: none needed" under `plan.md` › Sources and continue. Otherwise load `mstack-research` with a message in exactly this form, at most 8 items per call and a second call for more:

```text
Called by: mstack-plan
Project: <path of the repository>
Online search: off (<reason>)        (only when the user or the session says the network is off)
Depth: quick                         (only when every item is a single package fact)

<ID>: <question>
Package: <name>                      (under each item about a package)
```

Read its result block, which ends with a `Search:` line. Read that line whole: check for `Search: ran, pages not opened (<reason>)` before you take it as `Search: ran`, because both begin the same way.
- A claim whose fourth field says `not opened` is open, not confirmed, under either closing line: the claim's own field decides. It goes under `plan.md` › Sources with its address and the words `not opened`, and never into a step or a Global constraint as a fact. Every task that needs it gets the line `unconfirmed: <claim> (<address>)` in Read first, and its steps leave that value to be confirmed.
- Every other claim, whether from an opened page or from a file, goes under `plan.md` › Sources with its link or file path, the version it holds for and the date, and into the Read first line of every phase and task it affects. A claim read from a file keeps that file as its source, also when the pages were not opened. For a package, the `Version:` line of the block (the version in use and the file it was read from) goes into Global constraints.
- A conflict, or a "Not found" that changes a task, becomes a question of phase 2, with the evidence.
- When the block says `Search: not run`, continue, write "Research: not run (<reason>)" under Sources, and name it in the approval summary of phase 8.
- When the block says `Search: ran, pages not opened (<reason>)`, continue, write "Research: pages not opened (<reason>)" under Sources, and name `pages not opened (<reason>)` in the approval summary of phase 8.
