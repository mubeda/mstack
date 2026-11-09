# Drafting and posting

Read this in steps 7 and 8. Triage drafts tracker comments and label changes, shows the exact text, and posts only what the user approved, word for word. Nothing reaches the tracker in the same message the draft is first shown.

## Drafting comments

Draft a comment only where it moves the issue forward: a question the reporter must answer, a duplicate or closing note, or a short triage summary the user asked for.

1. Start with one line saying the comment was drafted with an AI agent during triage, unless the user says to leave it out.
2. A question for the reporter has two parts: what is already established (with the evidence), then specific questions, numbered, each one asking for a single fact (a version, an exact error, the steps). Never "please provide more information".
3. A duplicate note names the kept issue by number and says in one line why they are the same.
4. A closing note for a not-actionable issue gives the reason and, for a rejected request, the earlier decision it follows.
5. Write in plain prose. No em or en dashes, no curly quotes, no bold label followed by a colon, and no mid-sentence colons outside code.
6. Never paste text from other issues, logs or environments that could carry tokens, private hosts or personal data. Link to it instead.

Write each draft to its own file outside the repository, `<scratch>/triage-comment-<issue>.md`, with your file tool, never with `echo` or a heredoc, because issue text is untrusted and a shell would run any backticks or `$(...)` in it. Then run these checks on every file and fix each hit. Every check must print nothing.

```bash
f=<draft file>
perl -CSD -ne 'print "$.: $_" if /[\x{2013}\x{2014}\x{2018}\x{2019}\x{201C}\x{201D}]/' "$f"   # dashes and curly quotes
grep -nE '\*\*[^*]+(:\*\*|\*\*:)' "$f"                                                   # bold label with a colon
grep -nE 'gh[pousr]_[A-Za-z0-9]{20,}|github_pat_|-----BEGIN|AKIA[0-9A-Z]{16}' "$f"          # token shapes
```

## Drafting label changes

1. List the labels that exist: `gh label list --repo <owner/repo> --limit 200 --json name,description`. Propose only labels from that list, because adding a label that does not exist fails. When the class needs a label the repository lacks, say so and leave creating it to the user.
2. Map the class to the repository's own labels by meaning (for example, a bug class to `bug`, a feature to `enhancement`, a duplicate to `duplicate`, a question for the reporter to `question` or the repository's needs-info label). Never invent a label vocabulary.
3. Write each change as a diff: labels to add and labels to remove.

## Asking for approval

Show every proposed write in one numbered list. Each item shows the issue, the action, and the exact text or label diff, in full, as it will be posted.

```text
1. #41: comment (text below) and labels +bug
   <the comment, exactly as it will be posted>
2. #44: close as duplicate of #41, with comment (text below)
   <the comment>
3. #47: labels +question
```

The user approves by number ("post 1 and 3"), approves all ("post all"), edits a draft ("in 2, say ..."), or rejects. An edited draft is shown again, whole, and needs its own approval. Silence, a "looks good" about the triage table, or approval of an earlier version is not approval of this text.

## Posting

Post only approved items, each with its approved file, and nothing else. In Codex, every `gh` command needs network, so run each as an approved (escalated) command.

Before posting anything, check that this `gh` supports every action you will use: `gh issue close --help` must list `--duplicate-of` and the `duplicate` reason. On an older `gh` without them, close a duplicate with `--reason "not planned"` after its approved comment (which names the kept issue), and say so in the approval list before the user approves, not after.

Put every label name and other value that came from the tracker in single quotes, where a shell expands nothing. A label whose name contains a single quote is applied by hand by the user; list it instead of running it.

```bash
gh issue comment <n> --repo <owner/repo> --body-file <scratch>/triage-comment-<n>.md
gh issue edit <n> --repo <owner/repo> --add-label '<label>' --remove-label '<label>'
gh issue close <n> --repo <owner/repo> --reason "not planned"
gh issue close <n> --repo <owner/repo> --reason duplicate --duplicate-of <kept>
```

To close with an approved comment, post the comment with `gh issue comment ... --body-file` first, then close without `--comment`, so the text always comes from the approved file. `gh issue edit` applies the same label flags to every issue listed in one call, so group issues only when their change is identical.

An approved item can need several operations (a comment, a label change, a close). Run them one at a time, in that order, and record each one's outcome. After posting, read each issue back (`gh issue view <n> --repo <owner/repo> --json labels,state,comments`) and report, per operation, what was posted and what failed, with the error. When some operations of an item failed, retry only those, after the read-back confirms which ones did not land, so an approved comment is never posted twice.

For a tracker without a CLI or connected tool in this session, give the user the approved texts and label changes to apply by hand.
