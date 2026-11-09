# Regression

Read this file when Phase 0 classifies the problem as a regression, meaning something worked at a known commit or version and fails now.

## Build the check

1. Write one check command that exits 0 when the code is good and non-zero when it shows the user's exact symptom. Assert the symptom itself, not a nearby failure.
2. Run the check by hand at the bad commit and at the good commit, and keep both outputs. If either verdict is wrong, the bisect will be wrong too.
3. Make the check exit 125 itself when it cannot run at a commit, for example because a fixture or a dependency did not exist yet. The wrapper below counts every other non-zero code as bad, so an old commit that cannot run the test would otherwise take the blame.
4. Bound a check that can hang. The wrapper has no timeout, and a hung check stalls the whole bisect. If you use a timeout tool, read its help on the machine for the exit status it returns, and decide whether a timeout means bad or untestable for this bug.

## Run the bisect

1. Copy `scripts/bisect-run.sh` from the skill folder to a scratch directory outside the repository. Bisect checks out old commits, which can change or delete files inside the work tree.
2. Start the bisect with `git bisect start <bad> <good> --`.
3. Run it with `git bisect run sh <copy-of-bisect-run.sh> '<build command>' '<check command>'`. Pass `''` as the build command when there is nothing to build.
4. Read the wrapper's mapping. A check exit of 0 stays 0 (good), 125 stays 125 (skip), and any other code becomes 1 (bad). That includes a crash, such as exit 139 from a segfault, which would otherwise abort the bisect. A build command that fails gives 125, so the commit is skipped, never blamed.
5. Add `--first-parent` to `git bisect start` when merged branches contain commits that do not build or test cleanly. Bisect then follows only the first parent and reports the merge commit. Bisect inside that merged branch as a second pass if you need the exact commit.
6. Give several good commits to shrink the search, or add a path after `--` to limit it to commits that touch those paths.
7. When a commit was marked wrongly, save the log with `git bisect log > <file>`, delete the wrong lines from the file, run `git bisect reset`, then `git bisect replay <file>`.
8. Avoid skipping commits next to the culprit. A skip there leaves several candidates instead of one.
9. End every bisect with `git bisect reset`, with no options, and keep the `git bisect log` output as evidence.

## Performance regressions

1. Measure the good and bad commits first, as `references/performance.md` describes, and keep both medians and their ranges.
2. Start with custom terms, `git bisect start --term-old fast --term-new slow <slow commit> <fast commit> --`. Under `git bisect run` the contract does not change, so exit 0 still means old (fast) and the wrapper's mapping still applies.
3. Use as the check a script that runs the benchmark a fixed number of times, reads the median, and exits 0 below a threshold and 1 above it, or 125 when the benchmark fails to run. No tested script ships with this skill, so write it on the machine and check `hyperfine --help` first for the flags and JSON layout of the installed version.
4. Set the threshold between the good and bad medians, well clear of both ranges. When the gap is smaller than the run-to-run spread, a single threshold will mark commits at random, so reduce the noise first.
5. Confirm the commit bisect reports by measuring it and its parent again with wall-clock time.

## History archaeology for Phase 3

1. Find commits that added or removed a string with `git log -S '<string>' -- <file>`.
2. Find commits whose diff matches a pattern with `git log -G '<regex>' -- <file>`.
3. See who last changed a range of lines with `git blame -L <a>,<b> <file>`.
4. Follow a file across renames with `git log --follow --oneline -- <file>`.

## Failures in CI

1. Give a suspected flake one fresh build, never a job retry, and only once. An identical second failure means it was never a flake, so read the logs instead of retrying.
2. When the failure is in code the change never touches, suspect a stale base. Check whether the branch contains the commit that matters with `git merge-base --is-ancestor <commit> <branch>`, which exits 0 when it does. Report a stale base as needing a rebase or merge rather than spending retries.

## What the first bad commit proves

1. It proves which change made the check fail. It does not prove which line in that change is wrong, and the first wrong decision can sit in older code that the change only exposed.
2. It narrows Phase 3 to one diff. Seed the hypotheses from that diff.
3. It earns the tier Supported on its own. It reaches Confirmed when reverting that commit on top of the current code makes the loop pass.
