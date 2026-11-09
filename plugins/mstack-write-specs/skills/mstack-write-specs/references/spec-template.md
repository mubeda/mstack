# Spec template

Read this in Phase 4, before you write the spec. Copy the template, fill every required section, and delete the optional sections that do not apply. A required section with nothing to say reads "None", followed by the reason. Never leave "N/A".

## Length

These are guidance, not limits from any source.

- A **small** spec covers one behavior in one component. Give each section a line or two, about 30 to 80 lines in all.
- A **full** spec typically runs 150 to 400 lines.
- Past about 500 lines or about 25 requirements, propose splitting the work into phases and specify the first one.

The interview record at the end does not count toward the length.

## Template

```markdown
# <Spec title in plain words>

Status: Draft | Approved <yyyy-mm-dd> (approved in chat by the user)
Size: small | full    Mode: gated | quick    Type: feature | bug class | refactor
Source: <issue link, request quote, or "conversation <yyyy-mm-dd>">

## Problem                                        (required)
Who has the problem, what it costs them, and the evidence, in 2 to 3 sentences.
For a bug class, the current behavior with a reproduction or a citation.

## Goals                                          (required)
Outcomes, not outputs. Each one answers "how will we know this worked?"
(1 to 2 for a small spec, 3 to 5 for a full one.)

## Non-goals                                      (required)
Each with a one-line reason. Add anti-goals: results that count as failure
even if everything technically works.

## Users and scenarios                            (required for user-facing work)
User stories in the form "As a <specific actor>, I want <capability>, so that
<benefit>", ordered by priority. A refactor names its callers instead.

## Requirements                                   (required)
### R1. <short name>  [Must | Should | Could]
<One requirement sentence with SHALL, written per references/requirements.md.>
#### Scenario: <name>
- GIVEN <state>
- WHEN <action>
- THEN <observable outcome>
#### Scenario: <negative case name>
- GIVEN <state>
- WHEN <invalid or unexpected action>
- THEN <observable outcome>, and <what must NOT happen>

## Success metrics                                (optional: features with a measurable outcome)
Metric, target, success threshold, how it is measured, and when it is checked.

## Constraints and assumptions                    (required)
Exact values copied from their source (versions, limits, compatibility).
Assumptions you made are marked "(agent's call: <reason>)".

## Decisions                                      (required; one line each when small)
D1. <decision>. Alternatives considered: <option, and why it lost>.
Decided by: user | agent's call. Source: <interview line or evidence>.

## Risks                                          (optional: full specs)
- <Risk> -> <Mitigation>

## Verification                                   (required)
How each requirement is checked (test seam, command, observable result).
Input classes the spec implies but no scenario covers, and their expected behavior.

## Open questions                                 (optional; only ones that can wait)
- <Question> Owner: <who>. Can wait because: <reason>.

## Appendix: interview record                     (required; last in the file)
- <yyyy-mm-dd> Q: <question> / Recommended: <answer> / Decision: <outcome in one line>
- <yyyy-mm-dd> Evidence: <file or source> / Decision: <resolved without asking>
```

## Section rules

1. **Problem.** State the cost and the evidence, not the solution.
2. **Goals.** An outcome a user or operator can observe ("checkout completes after a card decline") beats an output ("add a retry button").
3. **Non-goals.** Every won't-have item lands here with its reason, so nobody re-adds it later without a decision.
4. **Users and scenarios.** Name a specific actor, never "the user" in general. Order the stories by priority, and each story should be testable on its own.
5. **Requirements.** Number them R1, R2 and so on, and never renumber after approval. Tag each Must, Should or Could. Not everything is Must: a Must passes the test "if we cut this, does the change still solve the problem?". When behavior that already has a spec changes, group the requirements under ADDED, MODIFIED and REMOVED headings against the current spec.
6. **Success metrics.** Measurable and technology-agnostic. "Users see results in under one second" passes. "Cache hit rate above 80%" fails, because it describes the implementation.
7. **Constraints and assumptions.** Copy exact values from their source, and say where each came from.
8. **Decisions.** Technical choices belong here, with the alternatives and why they lost. Paths and code do not, because they go stale quickly and belong to the plan.
9. **Risks.** Needed when the change crosses components, adds a dependency, changes stored data, or carries security, performance or migration risk.
10. **Verification.** Map every requirement to how it will be checked. The line about uncovered input classes exists because a spec's silence on an input is not permission for that input to break the program.
11. **Open questions.** Only questions whose answer would not change the requirements, the approach or the scope. Each has an owner (engineering, design, legal, data, or a named role) and a reason it can wait.
12. **Interview record.** One line per decision and per fact that resolved something without asking. It keeps precise answers (ordering guarantees, negative requirements, numeric defaults) from softening into vaguer prose later, and it lets an interrupted session resume. Never quote the user. Acceptance criteria copied from a source issue go into the requirements verbatim, and criteria the interview surfaced are labelled as such.
