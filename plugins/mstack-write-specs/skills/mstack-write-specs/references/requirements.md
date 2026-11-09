# Writing requirements

Read this when you write or check requirements (Phases 4 and 5). Every requirement is one sentence in EARS form with SHALL, followed by at least one scenario that can become a test.

## The five EARS patterns

EARS (the Easy Approach to Requirements Syntax) has five base patterns.

| Pattern | Form | Use it for |
|---|---|---|
| Ubiquitous | The `<system>` SHALL `<response>`. | Behavior that always holds |
| Event-driven | WHEN `<trigger>`, the `<system>` SHALL `<response>`. | A response to an event |
| State-driven | WHILE `<state>`, the `<system>` SHALL `<response>`. | Behavior that holds during a state |
| Optional feature | WHERE `<feature is included>`, the `<system>` SHALL `<response>`. | Behavior that exists only with a feature or configuration |
| Unwanted behavior | IF `<trigger>`, THEN the `<system>` SHALL `<response>`. | Errors, faults and invalid input |

A complex requirement combines them in a fixed order: zero or more WHILE preconditions, at most one WHEN trigger, exactly one named system, and one or more SHALL responses. The unwanted-behavior pattern matters most, because errors and faults are what specs most often leave out.

Examples:

- The export service SHALL include every column of the visible table in the CSV file.
- WHEN a user submits the reset form, the auth service SHALL send one reset email within 60 seconds.
- WHILE the account is locked, the auth service SHALL reject every sign-in attempt for that account.
- IF a reset link has been used once, THEN the auth service SHALL reject it and show the expired-link page.

## The lint

Run this on every requirement.

1. One requirement per heading, one EARS sentence, and exactly one named system or component.
2. The sentence matches one of the five patterns, or a combination in the order WHILE (0 or more), WHEN (0 or 1), system (1), SHALL (1 or more).
3. The verb is SHALL or MUST. "should", "may", "will" and "can" never appear in a requirement sentence. Weaker wishes use the Should or Could tag, not weaker verbs.
4. Error, fault and invalid-input behavior uses the IF ... THEN pattern.
5. At least one named GIVEN/WHEN/THEN scenario follows. Its THEN names an observable result, such as an output, a status, a message, a stored value, a log line or a screen state.
6. Every requirement that accepts input or crosses a boundary has a negative scenario that says what must NOT happen.
7. No implementation detail in the sentence: no framework, table, class or file names.
8. No vague word unless a number or an observable test follows in the same line (list below).
9. The requirement traces to an interview record line, an evidence line or a source acceptance criterion.

## Vague words

These words fail the lint unless a number or an observable test follows in the same line.

- fast, quick, quickly, responsive, efficient, performant
- easy, simply, simple, intuitive, user-friendly, seamless
- robust, reliable, secure (without a named threat), scalable, flexible
- appropriate, reasonable, as needed, where possible, etc., and so on
- "support X" without the behavior it means
- "handle edge cases", "add appropriate validation", "TBD"

"The search page SHALL show results within 1 second for 95% of queries" passes. "The search page SHALL be fast" fails.
