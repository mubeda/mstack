# Production incidents

Read this when users are affected right now, such as a service that is down, errors that are climbing, or data that is going wrong in production. The phases in `SKILL.md` still apply, but stopping the harm comes before finding the cause.

## Order of work

1. **Grade the severity.** Use the team's own scale when it has one. Otherwise use these four levels.

   | Level | Meaning |
   |---|---|
   | SEV1 | The service is down for everyone, or data is being lost or exposed |
   | SEV2 | A major feature is broken, or many users are affected, with no workaround |
   | SEV3 | Some users are affected, or a workaround exists |
   | SEV4 | Cosmetic or minor, with no real impact |

2. **Mitigate.** Pick the fastest safe way to stop the harm, such as rolling back the last deploy, turning off a feature flag, scaling up, failing over, or blocking the bad input. Every one of these changes production, so propose it to the user with its undo and wait for approval. Never apply it unasked.
3. **Communicate.** Tell the user what is known, what is being done, and when the next update will come. Keep that rhythm until the incident is closed. Separate facts from guesses in every update.
4. **Diagnose.** Run Phases 0 to 4 from `SKILL.md`. Work from records the incident left (logs, metrics, traces, crash reports) and from a reproduction outside production, never by experimenting on production.
5. **Fix.** Run Phase 5. The mitigation stays in place until the fix is verified.
6. **Write the postmortem** (below), then run Phase 6.

## Gather the timeline

When the session has tools for these, use them. When it does not, ask the user for the data once, in one list.

1. Monitoring around the start time, such as error rates, latency, saturation and the logs of the failing service.
2. Deploys, configuration changes and feature-flag changes shortly before the start.
3. Recent commits and pull requests that touched the failing code paths.
4. Known bugs and earlier incidents in the tracker that match the symptom.

Line each one up against the first error. A change that lands just before the first error is a strong lead, not a proof. It still has to pass Phase 4.

## Postmortem

Write it blameless. Ask what conditions allowed the failure, not who caused it.

```
Summary: <what happened, in two sentences>
Impact: <who was affected, how many, for how long, data lost or exposed>
Severity: <level>
Timeline (UTC): <detection, mitigation, fix, close, each with its source>
Root cause: <tier from SKILL.md>. <file:symbol:line and the mechanism>
Why chain:
  1. Why <...>? Because <...>. Evidence: <...>
  2. Why <...>? Because <...>. Evidence: <...>
  (stop at the first wrong decision, not at a person)
Contributing conditions: <what made it possible, harder to detect or slower to fix>
Detection: <how it was found, and the always-on signal that would have shown the cause at first look>
What went well / what went poorly: <...>
Action items: <action, owner, priority, due date>
```

Give every "why" its own evidence. A link in the chain with no evidence is a guess, so label it that way.
