# Intake and reports with no repro

Read this file in Phase 0 for every problem, and again whenever you cannot get a signal in Phase 1.

## The intake record

Write these fields down before you build any loop. Fill each one from what you can find yourself (the repository, the logs, the lockfile, the machine) before you ask anyone. A bug routed here by `mstack-backlog-triage` arrives with the facts its report was missing; start from that list, and read the issue in full anyway.

1. The symptom, verbatim. Copy the error text, exit code, signal, stack or wrong number exactly. Write what was observed and what was expected, side by side.
2. The frequency. Record whether it happens always, sometimes (with a rough rate), or once.
3. The exact steps or command, and the input data, redacted.
4. The versions. Record the project commit or tag, the runtime and compiler, the OS, and the lockfile or key dependency versions.
5. The environment differences. Note CI versus local, container or not, configuration, environment variables and hardware, compared with an environment where it works.
6. The last known good version or commit, and what changed since then (a deploy, a dependency bump, a configuration change). This makes a regression bisectable.
7. Whether it reproduces in a clean environment, such as a fresh clone, an empty cache, a new user profile or a new container.
8. The reporter's own theories, kept apart from the facts.
9. The problem type and the deliverable, as `SKILL.md` Phase 0 defines them.

## Evidence that will not last

Before you analyze anything, ask what a retry, a restart or a cleanup would destroy: a container and its logs, a job's workspace, a rotating host log, a process that is still hung. Copy what you can reach to a fresh `mktemp` path, and for the rest ask the person who can reach it to capture it before anyone retries. This one request does not wait for the "Ask once" round below. Say in the record what was already gone.

## Facts and theories

1. Split every statement in the report into what someone saw and why they think it happened. "The export button does nothing since Tuesday" holds a fact (no visible result), a time window (since Tuesday) and an implied theory (something changed on Tuesday).
2. Put each theory in the record as a hypothesis candidate for Phase 3. A theory is a lead to test, never a conclusion to confirm.
3. Treat the word "intermittent" as "the trigger is not known yet". Most such faults depend on something specific, such as memory pressure, another program touching a file at the wrong moment, or the time of day. Measure the rate with `references/flaky.md` and add those triggers to the candidates.

## Ask once

1. List every field you could not fill yourself.
2. Ask for all of them in one round with your question tool, and say why each one matters.
3. Ask for the extras the problem type needs: a stack trace or crash ID for a crash, a memory report and the steps that make memory grow for a leak, a profile for slowness, and a regression window for something that recently broke.
4. Do not ask again for something the user already gave. Ask a second round only when a new finding raises a new question.

## When it cannot be reproduced here

Try these routes in order. Move to the next one only when the current one cannot work, and record why.

1. Recreate the difference. Match the versions in a container or a virtual machine, then the configuration, then the shape of the data. A clean pass here against a failure on the user's side is itself a differential loop. Remove the differences one at a time until the result flips.
2. Replay a captured record. Run a log, a captured request, a payload, a core or a profile through the real code path. Redact it before any part enters the transcript, and remember that the original belongs to the user.
3. Run a human-in-the-loop script, as described below, when only the user can trigger the failure.
4. Add temporary instrumentation, with the user's permission. Tag every line with one prefix such as `[DEBUG-a4f2]` so that the Phase 6 search finds all of it.
5. Otherwise, stop. Report what you tried, what each route returned, and what would unblock you: access to an environment that fails, a redacted record, or permission to instrument. Do not form hypotheses without a signal.

## The human-in-the-loop contract

You write a short numbered script, and the user runs it on the machine that fails. Each run counts as one iteration of the loop, so keep the script identical between runs.

1. Make every step one of two kinds. An action step tells the user exactly what to do and what they should see, then waits for them to confirm. A capture step asks one question and records the answer as given.
2. Keep sign-in and anything secret as a plain action step. A capture step echoes the answer back to the terminal and into your transcript, so a password or token must never be the answer to one.
3. Place a capture step right after the step that triggers the failure, asking what the user saw, and another for anything the program printed.
4. End the script by printing every captured answer as a labelled list that you can read back.
5. Ask the user's permission before the first run, and redact the captured output before you quote it.
