# Quality check and independent read

Read this in Phases 5 and 6. Run the checklist on the written spec, fix what fails for up to three passes, then hand the file to a fresh reader.

## Checklist

Content

1. Every required section is present, and optional sections that do not apply are deleted.
2. Requirements contain no implementation detail, and Decisions contain no file paths.
3. Every goal is an outcome with a way to tell that it succeeded.
4. Every non-goal has a reason. Anti-goals are stated, or the section says "None, because ...".

Requirements

5. Every requirement passes the lint in `references/requirements.md`.
6. Every requirement has a scenario, and every one that accepts input or crosses a boundary has a negative scenario.
7. The error, empty and limit cases from `references/coverage.md` are either specified or listed as non-goals.
8. Success metrics, if present, each have a target, a threshold, a method and a date.
9. Not everything is Must, and every Must passes "if we cut this, does the change still solve the problem?".

Traceability

10. Every decision and requirement traces to an interview record line, an evidence line or a source criterion.
11. Nothing states a decision the user did not make unless it is marked as the agent's call.
12. Each concept has one name across the whole file.

Readiness

13. No `[NEEDS CLARIFICATION]` marker remains.
14. Every open question can wait, has an owner, and cannot be answered from the repository.
15. The scope is bounded: every requirement serves the problem statement.
16. The length fits the size (`references/spec-template.md`).

After three passes, list whatever still fails for the user instead of looping.

## Independent read

Give a fresh-context reader, through your subagent tool and on the model `SKILL.md` names for the independent read, only the spec's path and this brief. Fill in the domain.

```text
You are an experienced <domain> engineer. You have been handed the spec at <path>
and asked to plan its implementation. You cannot talk to its author or the user.
Read the file. List only the places where you would have to guess and a wrong
guess would change what gets built. For each one, give the question and say
what it would change. Rank them, most important first. Skip anything the spec
explicitly leaves to the implementer, anything you could reasonably decide
yourself, and wording nitpicks. If nothing important is left, reply
"nothing important left".
```

Before the read, tell the user that a reviewer will read the draft and that you may come back with one round of questions.

Sort each of the reader's questions into one of three kinds.

1. **Already answered.** The conversation or the repository answers it. Put the answer into the spec.
2. **Minor.** A sensible builder could settle it without changing what gets built. Settle it, and mark it as the agent's call.
3. **The user's.** Only the user can answer it, and the answer changes what gets built. Ask these in one round, most important first. This is the only round of questions the read produces.

Without a subagent tool, read the spec yourself as that builder and say that you did. The reader's report never counts as approval.
