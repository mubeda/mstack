---
name: mstack-write-specs
description: Use when the user wants to turn an idea, a feature request, a change, a bug class or a refactor into a written, agreed specification before building, such as "write a spec", "spec this out", "PRD", "requirements", "design doc", "let's plan this feature", "grill me on this", or when a request is too vague or too large to build directly. Works in Claude Code and Codex. Use it even when the user only says "I want to build X" and the decisions behind X are not settled yet.
---

# mstack write specs

Turn a request into a written specification the user has approved, with testable requirements. The method is an interview that settles every decision before anything is written, then a spec where every requirement has a scenario that can become a test. This skill writes specs. It never builds what the spec describes.

## Using this skill in Claude Code and Codex

This file is the same for both hosts. It never names a host tool. Where it says "your question tool" or "your subagent tool", use the host's equivalent.

| This file says | Claude Code | Codex |
|---|---|---|
| your question tool | `AskUserQuestion` for short choices; a numbered round in chat for longer ones | A numbered round in chat, then wait for the answer |
| your subagent tool | `Agent` with a fresh context | A separate read-only `codex exec` run with the brief, or the session's agent tool if it has one |
| the skill folder | The base directory the host showed when it loaded this skill | The folder of the SKILL.md you loaded |

Without a subagent tool, do the delegated step yourself and say that you did. Refer to the files below by their path inside the skill folder.

## Ground rules

1. **Facts are your job, decisions are the user's.** Look up anything the repository, its docs or a tool can answer, and cite where you found it. Ask the user only for choices that no lookup can settle.
2. **Never answer your own decisions.** A decision you fill in yourself is marked "agent's call" with its reason and is listed for the user at approval. A default the user never saw is one they could not reject.
3. **Behavior, not implementation.** Requirements say what the system does, as observed from outside. Technical choices go under Decisions with the alternatives considered. File paths and code belong to the plan, not the spec.
4. **Every requirement is testable.** It has at least one scenario whose result can be observed, and it passes the lint in `references/requirements.md`.
5. **Write nothing you were not told or did not find.** If the spec states something the user never said and no source supports, that is a defect.
6. **This skill does not build.** No scaffolding, no dependency installs, no implementation, until the user approves the spec and then asks for the next step.

## Phases

Each phase ends at a gate. Do not start the next phase before the gate holds.

| Phase | Work | Gate |
|---|---|---|
| 0. Intake and size | Restate the goal, the problem and the smallest change that meets it. Classify the input (feature, bug class, refactor, vague idea). Size it and pick a mode (below) | The restatement, size and mode are stated to the user. If the evidence already rules the request out, show the evidence and stop |
| 1. Ground | Read the repository's instructions, existing specs and docs, the linked issue (in full, even when it arrives as a row of an `mstack-backlog-triage` table, whose reason and acceptance hint are a starting point, not decisions), and the code the change touches | You can explain how the relevant parts work today and what the change touches, with citations |
| 2. Interview | Grilling rounds over the design tree (below) | The frontier is empty and the user confirms the shared understanding |
| 3. Approaches | Two or three structurally different approaches, in a message of their own, with trade-offs and a recommendation | The user picks one, or hands you the choice and you record it as your call |
| 4. Draft | Write the spec from `references/spec-template.md` at its final path (below) | The file exists |
| 5. Quality check | Run `references/quality-check.md` and the lint in `references/requirements.md`. Fix failures, up to three passes | Every item passes, or the remaining failures are listed for the user |
| 6. Independent read | A fresh reader with your subagent tool, as `references/quality-check.md` describes | The reader reports nothing important left, or the user answered its questions in one round |
| 7. Approval | Show the path, a short summary, and every "agent's call". Ask for approval of this file | The user explicitly approves the written file. Set Status to Approved with the date |
| 8. Hand-off | Offer the next step (below) | The user names it. This skill ends without building |

### Sizes and modes

- **No spec needed.** The change is already decided and fits in one working session. Say so and offer to stop or to go straight to the work the user wants.
- **Small.** One behavior in one component. Each section gets a line or two, about 30 to 80 lines in all. Defaults to quick mode, and the independent read is optional.
- **Full.** Anything larger. Defaults to gated mode. Past about 500 lines or about 25 requirements, propose splitting it into phases and specifying the first one.
- **Gated mode** runs every gate above.
- **Quick mode** merges Phases 2 and 3 into one up-front round that includes the approach choice, then runs Phases 4 to 6 without stopping. Phase 7 approval is never skipped.

If the request grows during the interview, say so and step up a size.

### By input type

- **Feature.** The standard flow.
- **Bug class** (for example "every date parser accepts 31 February"). The cause must be known first. If it is not, hand off to a diagnosis skill before specifying. Requirements are mostly unwanted-behavior sentences (`If ..., then ...`) plus requirements that keep today's correct behavior unchanged.
- **Refactor.** No user stories. Requirements are invariants on observable behavior, and Phase 3 (the approach) comes before most requirements.
- **Vague idea.** Spend longer in Phase 2 on the why, the goals and the anti-goals (results that would count as failure even if everything technically works).

## The interview

Model the subject as a design tree, where each decision branches into the decisions that depend on it. The frontier is every decision whose prerequisites are already settled.

1. Before asking anything, sort every open item into one of four kinds.
   - **Fact.** What the code does today, which library is installed, the current limit. Look it up and cite it. Never ask it. Use your subagent tool for lookups that take a while, and keep asking the questions that do not depend on them.
   - **Look and feel.** A question whose answer is how something looks or feels cannot be settled by talking. Offer a throwaway prototype as a question in the round. Build it in a scratch folder only after a yes, and record the result under Decisions.
   - **Process call.** Where the file goes, how to show something, whether to look further. Make the call yourself and say what you chose.
   - **Decision.** Ask the user, with a recommendation.
2. Use the coverage list in `references/coverage.md` privately, to find branches you would otherwise miss. Never read it out as a questionnaire, and mark branches that do not apply instead of asking about them.
3. Ask the whole frontier in one round. Number the questions. Give a recommendation for each and word the question so a plain "yes" accepts it. A question that depends on another open question in the same round waits for a later round.
4. Open each round with a short playback of what the last answers settled. Present anything you filled in as your proposal with your reason, never as the user's words.
5. Wait for the answers. Then recompute the frontier from scratch, because settled answers unblock new decisions. If a later answer changes an earlier one, reopen that branch in the next round.
6. When the user's words contradict the code, ask about the contradiction directly ("Your code cancels whole orders, but you said partial cancellation is possible. Which is right?").
7. There is no cap on questions. A very long interview means the scope is too big, so propose splitting it. When the user says "wrap up", every branch not yet asked becomes either an agent's call (listed at approval) or an open question that can safely wait.
8. Stop when the frontier is empty, every branch has been visited and nothing is silently assumed. Then ask the user to confirm the shared understanding before Phase 3.
9. Record each answered decision as one line in the interview record (see the template). Never quote the user's words there, because the file is likely to be committed.

Rounds are the default. When the user or the repository's instructions ask for one question at a time, still compute the frontier and ask its most blocking question first.

### Round format

Write rounds as plain numbered prose, without emoji or bold labels.

```text
Round 2. Your last answers settled that reset links go by email only and that
admins cannot send them for other people. Three decisions are open. Answer by
number. A plain "yes" accepts my recommendation.

1. Should a reset link stop working after its first use?
   I recommend yes. A reusable link lets anyone who sees a forwarded email take
   over the account.

2. Should a link expire 30 minutes after it is sent?
   I recommend yes. The app already ends idle sessions after 30 minutes (session
   settings, read this morning), so users meet one limit instead of two.

3. Should the expired-link page offer a button that sends a new link?
   I recommend yes. Without it the user has to find the reset form again.

Once question 2 is settled I will ask about the wording of the expiry message.
```

## Unresolved items

While drafting, mark anything still undecided inline as `[NEEDS CLARIFICATION: <specific question>]`. No marker may remain at approval. Each one is answered in a round, decided as a recorded agent's call when it is a process or minor matter, or moved to Open questions. An item moves to Open questions only if it can safely wait, which means its answer would not change the requirements, the approach or the scope. It then names an owner and the reason it can wait. A question the repository can answer is never an open question.

## Approval

Approval is the user's explicit yes to the written spec at its path, given after they could read it. None of these count as approval:

- agreement with the idea, the playback or an approach;
- an earlier "just write it" or "that's enough";
- silence, or a default or preselected option in your question tool;
- approval of an outline, a plan or an approach;
- a reviewer's report or the independent reader's report;
- "whatever you think is best". Give your recommendation and get an explicit yes to it.

Any edit to an approved spec sets Status back to Draft until it is approved again. An addition after approval comes with a removal or a timeline change, or it is the start of a new spec.

## Where the spec goes

Choosing the location is a process call. Decide, state the path, and do not ask. Use the first that applies.

1. A location the user named.
2. A rule in the repository's agent or contributor instructions.
3. An existing spec convention: an `openspec/` folder (use its change-folder layout), a `specs/` or `.specify/` folder (use its numbered feature folders), or whichever of `docs/specs/`, `docs/rfcs/` or `docs/design/` already exists.
4. The default, `docs/specs/<yyyy-mm-dd>-<slug>.md`, where the slug is a two-to-four-word action-noun name such as `fix-payment-timeout`.

Before writing, read any existing file at that path. A Draft resumes from its first unresolved item. An Approved spec changes only through a new approval. For a long interview, write the interview record to the file as it grows, so an interrupted session can resume. Never commit, push or open a pull request unless the user asks.

## Hand-off

Offer the next step, and take it only on the user's explicit go.

1. **A step-by-step plan.** Use `mstack-plan` when it is installed. It asks where the plan goes, copies the spec into the plan folder as `spec.md`, and writes a reviewed, test-first plan that the mstack review workflows can execute. Otherwise put the spec's path at the top of the plan, so the plan argues from the spec.
2. **Tickets cut as vertical slices.** Each ticket is a narrow end-to-end path that can be demonstrated on its own and fits one working session, with checkbox acceptance criteria taken from the spec's scenarios.
3. **Direct implementation**, when the approved change fits one session.
4. **Stop.**

When a planning or ticket skill is installed, name it by its role and use it. Otherwise follow the short descriptions above. The approved spec is the binding authority for whatever comes next.
