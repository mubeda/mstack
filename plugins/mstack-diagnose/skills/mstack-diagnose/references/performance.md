# Performance problems

Read this file when Phase 0 classifies the problem as slowness, high CPU or memory use, or a performance regression.

## Before you measure

1. Write the claim you expect to ship, such as "the export is 30% faster at the median on the 60k-row file". Name the result that would change a decision, and the noise floor.
2. Read the measurement script and note what it times and what it ignores.
3. Check the load with `uptime` and the core count with `getconf _NPROCESSORS_ONLN` (POSIX, unlike `nproc`, which macOS lacks). If you cannot stop what keeps the machine busy, interleave the sides and say so in the report.
4. Give every side the same minimized input and the same machine.

## The benchmark questions

Answer all seven before you report a number.

1. Why is the result not twice as good? Name the limiter (a core, a lock, the disk, the network) from a profile taken in a run you do not report, because profilers slow the work.
2. Was every side tuned? A side left on defaults compares configurations, not code.
3. Does the result break a limit? If the part you removed took 10% of the run, the run can get at most about 11% faster.
4. Did it error? Count failures and check outputs, because a rejected request returns quickly and a retried one slowly.
5. Does it reproduce? Use the run rules below.
6. Does it matter end to end? Report a micro result as a share of the whole path.
7. Did the work happen? Confirm it ran inside the timed region and was not skipped, cached or lazy.

## Run rules

1. Fix the run count in advance at 10 per side, or 20 when the effect is within twice the spread.
2. Warm up with 3 runs unless cold start is the symptom.
3. Interleave the sides (A, B, A, B) so drift and caches favor neither.
4. Report the median and the range for each side.
5. Test significance once, with benchstat's rank-sum test or hyperfine's `welch_ttest` script, at p below 0.05. Rerunning until significant is multiple testing.
6. When the gap is smaller than the run-to-run spread, the verdict is "no measurable difference".
7. Lead with the verdict (faster, slower, no measurable difference, or inconclusive). It is inconclusive when the limiter is unnamed, a side ran untuned, or questions 4 and 7 went unchecked.

```
Median 41 ms before, 33 ms after, 10 runs per side, range 32 to 35 ms after, p 0.002, bound by JSON parsing on one core.
```

A ballpark the user asked for may be one run, if questions 4 and 7 are still checked and the report says so. A choice between options is never a ballpark.

## Tools

1. With hyperfine 2.x, benchmark with `hyperfine -N --warmup 3 --runs 10 --export-json out.json '<cmd>'`. Version 2 runs commands without a shell by default, so add `-S` when the command needs pipes or globs (check `hyperfine --help` first).
2. Compare branches with `--parameter-list branch main,fix --setup 'git switch {branch}'`. hyperfine finishes all runs of one command before the next, so it does not interleave. On a noisy machine, alternate single runs yourself and say so.
3. Test significance with `uvx --from 'git+https://github.com/sharkdp/hyperfine' welch_ttest out.json` on a file that holds exactly two benchmarks. It downloads and runs code, so ask the user first.
4. hyperfine 2.x JSON keeps the median at `results[i].summary.time_wall_clock.median`, so older recipes that read `results[0].median` break. Check `hyperfine --version`.
5. With Go, run `go test -run='^$' -bench=. -count=10 > old.txt`, the same after the change into `new.txt`, then `benchstat old.txt new.txt`. Build both test binaries first with `go test -c` so that you can alternate them.
6. Read hardware counters with `perf stat -r 10 <cmd>`. Instruction counts are steadier than wall time but miss I/O and lock waits.

## Profiles and flame graphs

1. On Linux, record with `perf record -F 99 -p <pid> -g -- sleep 60`, then `perf script > out.perf`. `perf` does not exist on macOS or Windows. There, record with the profiler the platform provides, and name the tool and the command in the report.
2. With an installed FlameGraph copy, run `stackcollapse-perf.pl out.perf > out.folded` and `flamegraph.pl out.folded > out.svg`. The x-axis is sorted by name, not time, and width is how often a frame was sampled.
3. Compare before and after with `difffolded.pl before.folded after.folded | flamegraph.pl > diff.svg`. Red marks growth and blue marks shrinkage.
4. For Python, use `py-spy record -o profile.svg --pid <pid>`. Attaching to a process you did not start usually needs root or a ptrace change.
5. For Node, run `node --cpu-prof app.js`, which writes a `.cpuprofile` file at exit.

## Cheapest fix first

Try these in order, and stop at the first that meets the target.

1. Don't do it. Remove work whose result nothing uses.
2. Do it, but not again.
3. Do it less.
4. Do it later.
5. Do it when nobody is waiting.
6. Do it concurrently.
7. Do it cheaper.

## Machine-wide noise controls

Disabling address-space randomization, setting the CPU governor to `performance`, shielding cores, taking SMT siblings offline and turning off turbo all need root and change the whole machine. Offer them, never apply them unasked. On Linux, before each one, read and save the current value of its file under `/proc/sys/kernel/` or `/sys/devices/system/cpu/`, and give writing that value back as the undo. Other systems keep these settings elsewhere, so name the setting and its saved value in the report before changing it. Report which were applied. On shared CI runners, use more runs and interleave instead.

To bisect a performance regression, read `references/regression.md`.
