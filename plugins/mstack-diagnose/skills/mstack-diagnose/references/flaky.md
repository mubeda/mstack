# Flaky failures

Read this file when Phase 0 classifies the problem as a failure that happens only some of the time, in a test, in CI or in the product.

## Pin and measure

1. Confirm that a failing run shows the user's symptom, with the same assertion or the same stack. A different flake in the same test is a different bug.
2. Pin everything that can be pinned. Fix the seed and the test order, turn off any result cache, use one worker, and pin time, randomness and the filesystem where the code allows it.
3. Run the minimized test N times with the same command and count the failures, k. Choose N large enough to see about ten failures, so the rate is a measurement, not a guess.
4. Record the rate as k of N together with the exact command, the seed policy and the machine. That is the Phase 1 signal for this branch.
5. Do not stop at the first failure while measuring. Options that stop early (such as `-x` or `-failfast`) answer whether it can fail, not how often.

## Repeat and seed flags

1. With pytest and the pytest-repeat plugin, repeat a test with `pytest --count=200 <test id>`. The plugin does not repeat `unittest.TestCase` classes, which run once with a warning.
2. With the pytest-randomly plugin, replay an order with `pytest --randomly-seed=<n>` or `pytest --randomly-seed=last`. Turn the plugin off with `pytest -p no:randomly`.
3. With Go, repeat with `go test -run '^TestX$' -count=200 ./pkg`. `-count=1` bypasses the test cache, and `-shuffle on` randomizes the order and prints the seed, which `-shuffle <n>` replays.
4. With Jest, fix the order with `jest --randomize --seed 1234`, and add `--showSeed` to print it. Jest has no repeat flag, so repeat by running the same Jest command in a shell loop and counting non-zero exits. Check `jest --help` first for the flags of the installed version.
5. With Node's built-in test runner from v26.1.0, use `--test-randomize` to shuffle and `--test-random-seed=<n>` to replay.
6. With Rust, `--shuffle` and `--shuffle-seed` exist only on nightly and need `-Z unstable-options`. Pass them after `--` with `--test-threads 1` to get a random order run in sequence.

## Raise a low rate

A rate near 50% is easy to debug, and a rate near 1% is not. When the rate is low, raise it before you form hypotheses. Change one thing at a time and record the new rate after each change.

1. Shuffle the order with a printed seed. Replay a failing seed, then cut down the set of tests that ran before the failing one.
2. Add parallelism, such as more workers or `go test -cpu 1,2,4`.
3. Run a race tool. `go test -race` costs 2 to 20 times the run time and 5 to 10 times the memory. A ThreadSanitizer build costs 5 to 15 times the run time.
4. Record under rr in chaos mode with `rr record -h <program> <args>` in a loop until one run fails, then debug that recording deterministically with `rr replay`. rr needs Linux 4.7 or later and a supported CPU with performance counters, and it weakens sandboxes on purpose, so ask the user before you run it.
5. Add load or contention, or inject sleeps at the boundary you suspect.

## Seeds for Phase 3

The usual causes are weak isolation, order dependence, a test that does not clean up, global state, assertions that are too strict about floats or timing, and threads that are never joined. Each hypothesis predicts how the rate changes under one specific change.

## Run counts for declaring it fixed

These counts are derived arithmetic, not a rule from any source. If the failure rate before the fix is r, the chance that M runs after the fix all pass while the bug is still there is (1 - r) to the power M. Choose the smallest M that keeps that chance at or below 5%.

| Rate before the fix | Runs after the fix (M) |
|---|---|
| 50% | 5 |
| 20% | 14 |
| 10% | 29 |
| 5% | 59 |
| 1% | 299 |

1. Choose M before the first run after the fix, and never extend it after seeing results.
2. Use the same command, seed policy and machine as the measurement before the fix.
3. A single failure among the M runs means the fix is NOT VERIFIED.
4. Report it in this shape.

```
Before the fix 20 of 200 failed. After the fix 0 of 29 failed. Same command, seed policy and machine.
```

## What never counts as evidence

1. A rerun or retry that passes, including a CI job retry and a test-retry plugin or setting.
2. A test marked as an expected failure that is allowed to pass, such as `xfail(strict=False)`.
3. A green streak stopped as soon as it looked good.

All of these are quarantine. They hide the failure and prove nothing about its cause. For the CI rule of one fresh build, read `references/regression.md`.
