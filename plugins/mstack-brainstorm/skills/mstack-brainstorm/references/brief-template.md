# The design brief

Read this before you write the brief. The brief records what the user wants, why, and how it will be built, so that `mstack-write-specs` (or a builder) can start without asking the same decisions again.

## Opening lines

The file starts with these two lines, exactly in this form, because `mstack-write-specs` recognizes a brief by them:

```text
# Design brief: <title>

Status: Draft
```

When the user approves the file, change the Status line to `Status: Approved <yyyy-mm-dd> (approved in chat by the user)`. Any later edit sets it back to `Status: Draft` until the user approves again.

## The eight parts, in this order

```text
## Intent
What the user wants and why, in their terms: who it is for and what changes for those people.

## Goals, non-goals and anti-goals
What success looks like; what this work deliberately leaves out; results that would count as failure even if everything runs.

## Constraints
What the existing work, the platform, time or the user fixed, with where each one came from.

## Approaches considered
The two or three whole-shape approaches from the approaches message, what each traded off, the pick and its reason. Or the one sensible way and why the others did not fit.

## Tradeoffs accepted
One line per cost the picked approach brings, with what it buys in exchange, including every design red flag found and kept. Name anything a later reader could mistake for an oversight.

## Decisions
### Decided by the user
One line per decision the user made, with the round or message it came from.
### Agent's calls
One line per choice the agent made and the user did not, each with its reason.

## Open questions
Questions that can safely wait, each with who answers it and why it can wait.

## Left to the spec
What this brief deliberately does not settle: the requirements, scenarios and details the spec will fix.
```

Write "none" in a part that has nothing, rather than leaving the part out. A reader checks that all eight are present.

## A small change

For work sized as a small change, keep all eight parts and write each in one or two lines.

## Decisions and calls

A choice the user never made goes under `### Agent's calls` with its reason, never under `### Decided by the user`, even when the user would very likely agree. Agreement with an idea, a playback or an approach is a decision only for that thing. Anything the user did not see and choose is a call. Never quote the user's words in the brief, because the file is likely to be committed; write each decision as a line of your own.

## Where the file goes

Use the first place that applies, then state the path to the user:

1. A place the user named.
2. A rule in the repository's agent or contributor instructions.
3. An existing `docs/briefs/` or `docs/design/` folder in the repository.
4. Otherwise `docs/briefs/<yyyy-mm-dd>-<slug>.md`, where the slug is two to four words naming the subject, such as `order-notifications`.
5. Outside a repository: a place you pick (the current folder, or the user's notes folder if they keep one). Say where it went, and run no repository step.

When a file already exists at the path, show it to the user and ask before replacing it; never overwrite it without a yes. Never commit, push or open a pull request for the brief: that is the user's call.
