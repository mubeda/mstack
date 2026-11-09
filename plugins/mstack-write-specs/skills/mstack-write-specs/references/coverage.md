# Coverage list

Read this before the first interview round. Walk it privately to seed the design tree, so you find the branches you would otherwise miss. Never read it out to the user as a questionnaire. Mark a branch that does not apply as not applicable instead of asking about it, and answer every factual branch from the repository before it reaches a round.

1. **Why.** The problem, who has it, the evidence, and what happens if nothing is done.
2. **Goals, non-goals and anti-goals.** What success looks like, what is deliberately left out, and what would count as failure even if everything technically works.
3. **Scope.** What is in, what is out, and where the boundary with neighboring features or systems sits.
4. **Actors and roles.** Who uses it, who administers it, and what each role may and may not do.
5. **Domain.** The entities involved, how each is identified, their lifecycle states, and the one name each concept goes by.
6. **Journeys.** The main path, then the error, empty, loading and partial-success states of each step.
7. **Data.** What is created, changed or deleted, what must persist, what migrates, and what happens to existing data.
8. **Limits and concurrency.** Sizes, rates, quotas, timeouts, two people editing the same thing, and retries.
9. **Quality attributes.** Performance, scale, reliability, observability, security, privacy and compliance, each with a number or a named threat.
10. **External dependencies.** Services, libraries and teams involved, and what happens when each one fails or is slow.
11. **Compatibility.** Existing callers, stored data, configuration, APIs and clients that must keep working.
12. **Constraints and rejected alternatives.** Platform, version or policy limits, and options already ruled out with the reason.
13. **Rollout.** Flags, migration order, rollback, and who needs to know.
14. **Acceptance.** How each goal and requirement will be checked, and by whom.
