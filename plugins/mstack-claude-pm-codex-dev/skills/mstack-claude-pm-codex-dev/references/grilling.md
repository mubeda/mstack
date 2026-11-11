# Grilling

Read this file when a plan, design or requirement has more than one defensible answer. The coordinator follows it to settle those decisions with the user before any lane builds on them. Design-heavy lanes follow its fact-finding half, because a lane cannot talk to the user. The only output is a clearer plan that the user has confirmed.

## Facts versus decisions

1. A fact is anything the repository, a tool, the work item or an outside source can answer. Settle it by looking it up. Never ask the user for a fact you could find yourself.
2. A decision is a choice between defensible options, and it belongs to the user. Put it to the user and wait for the answer.
3. An agent that answers its own decision has broken the process, even when the answer looks obvious. A round that nobody answers records the agent's opinion, not the user's, so there is no asynchronous mode.

## Live rounds for the coordinator

1. Model the subject as a design tree. Each decision is a node, and the decisions that depend on it branch from it.
2. The frontier is every decision whose prerequisites are already settled. Ask the whole frontier in one numbered round. Do not ask one question at a time, and do not ask everything at once.
3. A question whose answer depends on another question still open in the same round waits for a later round.
4. Give a recommendation for every question, and word the question so that "yes" accepts it. Accept answers by number, and accept free-form answers too.
5. Send every fact lookup to a helper with a fresh context (a subagent, or a separate read-only CLI run), not a fork. Do not hold the round for it. A running lookup is an unsettled prerequisite, so only the questions downstream of it wait, and you ask the rest of the frontier now.
6. When the answers arrive, recompute the frontier from scratch. Settled decisions push it outward and unblock the questions that hung on them.
7. Stop when the frontier is empty, with every branch visited and nothing silently assumed. Then ask the user to confirm the shared understanding, and do not act until they do.
8. Write no files while grilling. Carry the settled decisions into the lane table and the briefs afterwards.
9. A question about how something should look or feel cannot be settled by talking. Stop that branch, commission a throwaway prototype, show it to the user, and come back to the branch with their reaction.
10. There is no cap on the number of questions. A session that keeps growing means the scope is too large, so split it and grill each piece on its own.
11. When several lanes return questions, merge the independent ones into one round and keep rule 3 across lanes. Send each answer back to the lane that asked, with the number of the question it answers.

## Round format

Write each round as plain text. Each item is numbered, its first sentence is the question, a short body gives the context and lettered options, and its last sentence is the recommendation. Leave a blank line between items. Use no emoji, no bold labels followed by a colon, and no dashes as punctuation. A round with two items looks like this:

```
1. Should the export command keep writing the old file name for one release?
   Two CI scripts in other repositories read the old name, and the issue asks for the new name only.
   (a) Rename now and let those scripts break.
   (b) Write both names for one release and print a deprecation notice.
   (c) Keep the old name and close the issue as not planned.
   I recommend (b), because it meets the issue without breaking callers we cannot edit, so a yes accepts it.

2. Should the new retry setting be off by default?
   Turning it on changes timing for every existing user, and the issue names no default.
   (a) Off by default, documented in the changelog.
   (b) On by default, with a changelog warning.
   I recommend (a), because it keeps current behavior for existing users, so a yes accepts it.
```

When an answer unblocks later questions, say so in the body, for example "Question 4 waits on this one."

## The fact-finding half for lanes

A lane cannot reach the user, so it does only the half of grilling that needs no user.

1. Map the design tree for your own design.
2. Settle every fact yourself, by reading code, running tools or building a throwaway prototype.
3. Treat a branch as settled only when the work item's acceptance criteria, the coordinator's brief or a repository rule decides it, and cite which one.
4. Return every remaining decision to the coordinator in the round format above, numbered, each with options and a recommendation. For each one, name the later branches that depend on its answer.
5. Never build on an unsettled decision. Report its downstream branches as blocked on that question, and keep working on the parts that do not depend on it.

When the coordinator reads a lane's report, it rejects every returned question that a lookup could answer and sends it back as a fact to find. It also checks that no lane answered one of its own decisions and built on it.
