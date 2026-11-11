# A past CI failure that cannot be rerun

Read this file in Phase 0 when the problem is a CI job that already failed and you cannot rerun it on demand: the runner is shared, the trigger is gone, a rerun is someone else's call, or a rerun would not hit the same conditions. The signal is a saved record, so Phase 1 reads what the job left behind instead of building a loop.

When the same job fails again and again and you can rerun it, this is not your branch: use `references/flaky.md`, or `references/regression.md` when it started at a known change.

## 1. Secure the evidence a retry destroys

Do this before any analysis. A retry, by you or by anyone else, can recreate the job's container, clear its workspace and overwrite its logs, and shared runners clean up on their own schedule.

1. List what exists and how long it lives: the job log, the test-result files and other artifacts, the workspace, the logs of the container or virtual machine the job ran in, and the host's own logs for that time (system log, kernel messages, container runtime, out-of-memory kills, disk and memory figures).
2. Copy what you can reach to a fresh `mktemp` path. Ground rule 4 applies: logs and workspaces can hold tokens.
3. For what you cannot reach, ask once with your question tool, and name each item and why it matters. Ask the person who can reach the runner to capture the container and host logs before anyone retries the job, and say which retry would destroy what.
4. Write down what was already gone when you arrived. It bounds what the diagnosis can claim.

The commands depend on the CI system and the container runtime. Use the system's own interface or command-line tool, look each command up on the machine (`--help`), and never guess a flag.

## 2. Read the records

1. **The job log.** Read all of it, not only the last error. Find the first line that went wrong, the last line that went right, and their timestamps. Note where the log stops: a log that ends in the middle of a step, with no failure message from the test runner, points at something outside the tests (a killed process, a lost runner, a timeout from above).
2. **The test-result files.** Count what passed, failed, errored and never ran. Tests that never ran are as telling as tests that failed: a suite cut off partway is a different failure from a suite that finished with failures. Compare the list with a passing run of the same job when one exists.
3. **The exit status and who set it.** A test runner's own non-zero exit, a signal (for example a kill), and a status the CI system set for a timeout or a lost connection are three different stories.
4. **The job's definition at that commit.** The runner label or pool, the image, the resource limits, the timeout, and what the job shares with others (a cache, a workspace path, a port, a database, a container name).

## 3. What else ran on the same machine

On shared infrastructure this is usually the most telling probe, and the job's own log cannot show it.

1. Find which runner or host ran the job, from the job log or the CI system's record of the run.
2. From the scheduler's record, list every job that ran on that runner or host in the window from the job's start to its failure, with start and end times, repository or pipeline, and what each one does.
3. Lay the failure's timestamps over that list. Look for a job that started, peaked or cleaned up just before the first bad line, and for anything the two jobs share: a fixed port, a container or network name, a workspace or cache path, a database or service, the disk, memory or CPU of the host.
4. Check the other direction: did the overlapping jobs fail too, at the same time? Several unrelated jobs failing together on one host points at the host. One job failing while its neighbors pass points at a specific collision or at the job itself.
5. Compare with history: the same job on the same runner without that neighbor, and on another runner. A failure that follows the neighbor or the runner, and not the commit, is infrastructure.

Each overlap is a hypothesis for Phase 3, with its prediction: "If job B's cleanup removed the shared container, the failure appears only in runs where B ends while A is in its test step."

## 4. Decide what kind of failure it was

| What the records show | Points at |
|---|---|
| The test runner reported failing assertions, and the suite finished | The change under test, or a test that depends on order, time or data. Continue as a normal failing test, on a machine where you can rerun it |
| The log stops partway, tests never ran, the exit is a signal or a CI timeout | Something outside the tests: an out-of-memory kill, a full disk, a recreated or removed container, a lost runner, a job timeout |
| Connection, port, name or lock errors against something shared | A collision with an overlapping job |
| Several jobs on the same host failed in the same minutes | The host or a shared service |

## 5. What the diagnosis can claim

A past failure that cannot be rerun reaches the tier Supported at best: the records point at a cause and nothing contradicts it. Say which record supports each claim, which records were missing, and what was only inferred from timing. Two jobs overlapping in time is a correlation until a shared resource and a mechanism are named.

Then say what would raise the tier: a rerun arranged with the overlapping job held back or deliberately started, a reproduction of the collision on a machine you control, or the missing host or container logs. Offer the fix that removes the shared resource (a unique name, port or path per job, a lock, a resource limit) as a proposal, and mark it NOT VERIFIED until a run shows it.

## 6. Report

Add these to the report in `SKILL.md`:

- Signal: each record with its path or link, its format, and how complete it is (whole, cut off at a time, or missing).
- The runner or host, the window, and the list of overlapping jobs with their times.
- What was secured before a retry, what was already gone, and what you asked for.
