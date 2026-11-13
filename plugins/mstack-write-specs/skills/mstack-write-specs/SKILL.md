---
name: mstack-write-specs
description: Use when the user wants to turn an idea, a feature request, a change, a bug class or a refactor into a written, agreed specification before building, such as "write a spec", "spec this out", "PRD", "requirements", "design doc", "let's plan this feature", "grill me on this", or when a request is too vague or too large to build directly. Works in Claude Code and Codex. Use it even when the user only says "I want to build X" and the decisions behind X are not settled yet.
---

# mstack write specs

Turn a request into a written specification the user has approved, with testable requirements. The method is an interview that settles every decision before anything is written, then a spec where every requirement has a scenario that can become a test. This skill writes specs. It never builds what the spec describes.

## Using this skill in Claude Code and Codex

This file is the same for both hosts. It never names a host tool outside the table below. Where it says "your question tool" or "your subagent tool", use the host's equivalent.

| This file says | Claude Code | Codex |
|---|---|---|
| your question tool | `AskUserQuestion` for short choices; a numbered round in chat for longer ones | A numbered round in chat, then wait for the answer |
| your subagent tool | `Agent` with a fresh context | A separate read-only `codex exec` run with the brief, or the session's agent tool if it has one |
| a cheap subagent | `model` and `effort` set to `mstack-best-model-for`'s answer for the tier `cheap` | `-m` and `model_reasoning_effort` set to its answer for the tier `cheap` |
| a standard subagent | `model` and `effort` set to its answer for the tier `standard` | `-m` and `model_reasoning_effort` set to its answer for the tier `standard` |
| the skill folder | The base directory the host showed when it loaded this skill | The folder of the SKILL.md you loaded |
| the user skill folders | `~/.claude/skills/`, `~/.agents/skills/` and the plugin cache `~/.claude/plugins/cache/`, but only under a plugin that `claude plugin list` shows as installed, because the cache keeps leftover copies (`CLAUDE_CONFIG_DIR` replaces `~/.claude`) | `~/.codex/skills/`, `~/.agents/skills/` and the plugin cache `~/.codex/plugins/cache/`, but only under a plugin that Codex has enabled in its `config.toml` (`CODEX_HOME` replaces `~/.codex`) |

Before the first subagent of a run, load `mstack-best-model-for` in called mode once: say which skill is calling, and ask for this host's vendor (`claude` in Claude Code, `codex` in Codex) and the tiers `cheap`, `standard` and `most capable`. A subagent started without a model runs on the session's model, the most expensive choice, so set it every time. A lookup (what the code does today, which version is installed) is a cheap subagent. The independent read of Phase 6 is a standard subagent, or the `most capable` answer for a full spec that touches security, stored data or money, because that reader is the last check before approval.

Without a subagent tool, do the delegated step yourself and say that you did. Refer to the files below by their path inside the skill folder.

## Ground rules

1. **Facts are your job, decisions are the user's.** Look up anything the repository, its docs or a tool can answer, and cite where you found it. Ask the user only for choices that no lookup can settle.
2. **Never answer your own decisions.** A decision you fill in yourself is marked "agent's call" with its reason and is listed for the user at approval. A default the user never saw is one they could not reject.
3. **Behavior, not implementation.** Requirements say what the system does, as observed from outside. Technical choices go under Decisions with the alternatives considered. File paths and code belong to the plan, not the spec.
4. **Every requirement is testable.** It has at least one scenario whose result can be observed, and it passes the lint in `references/requirements.md`.
5. **Write nothing you were not told or did not find.** If the spec states something the user never said and no source supports, that is a defect.
6. **This skill does not build.** No scaffolding, no dependency installs, no implementation, until the user approves the spec and then asks for the next step.

## Phases

**The model skill, first.** Before any other step, check `mstack-best-model-for`, which this skill calls for its subagents' models.

1. It is in this session's skill list (as `mstack-best-model-for` or `<plugin>:mstack-best-model-for`): continue.
2. Its folder exists on disk (in the user skill folders the host table names) but the session has not loaded it: say that a new session is needed, and stop.
3. Otherwise it is not installed. Print this once, then continue without subagents: do every delegated step yourself, one after another, start no subagent in this run, and tell the user so.

   ```text
   mstack-write-specs runs without subagents, because mstack-best-model-for is not installed. To install it:
   Claude Code: claude plugin marketplace add mubeda/mstack, then claude plugin install mstack-best-model-for@mstack
   Codex:       codex plugin marketplace add mubeda/mstack, then codex plugin add mstack-best-model-for@mstack
   Skills CLI:  npx skills add mubeda/mstack --skill mstack-best-model-for -g -a <claude-code|codex> -y
   Or install mstack-setup the same way and run it: it installs everything the mstack skills need.
   A new session picks it up.
   ```

No subagent starts without that skill's answer, because it would run on the session's model, the most expensive choice. The lookups and the independent read of Phase 6 are then yours, and the approval summary says that no fresh reader checked the spec.

Each phase ends at a gate. Do not start the next phase before the gate holds.

| Phase | Work | Gate |
|---|---|---|
| 0. Intake and size | Restate the goal, the problem and the smallest change that meets it. Classify the input (feature, bug class, refactor, vague idea). Size it and pick a mode (below) | The restatement, size and mode are stated to the user. If the evidence already rules the request out, show the evidence and stop |
| 1. Ground | Read the repository's instructions, existing specs and docs, the linked issue (in full, even when it arrives as a row of an `mstack-backlog-triage` table, whose reason and acceptance hint are a starting point, not decisions), a design brief or a product epic given as the source (see "A brief as the source" and "An epic as the source"), and the code the change touches, after following `references/codegraph.md` | You can explain how the relevant parts work today and what the change touches, with citations |
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
- **Vague idea.** When `mstack-brainstorm` is in this session's skill list, name it as the better start, because it works out the goal and the reason before any spec, and ask once whether to switch; on a no, continue here. Otherwise spend longer in Phase 2 on the why, the goals and the anti-goals (results that would count as failure even if everything technically works).
- **A design brief.** A source file whose first heading starts with `# Design brief:` is a brief, usually from `mstack-brainstorm`. See "A brief as the source" below.
- **A product epic.** A source file whose first heading starts with `# Epic:` is an epic, usually from `mstack-epic`, written by a product person. See "An epic as the source" below.
- **An evidence or a decisions document.** A source file whose first heading starts with `# Evidence:` or `# Decisions:` comes from `mstack-evidence` or `mstack-decisions`. See "Evidence and decisions as sources" below.
- **A product plan.** A source file whose first heading starts with `# Product plan:` is not a spec source. See the last paragraph of "An epic as the source".

## A brief as the source

Whatever its Status, name the brief's path as the source in your first message and in the spec's Source line. When its `Status:` line says Approved:

1. Every decision under its `### Decided by the user` is settled. Never ask it again; record it in the interview record as decided in the brief, with the brief's path.
2. Every item under its `### Agent's calls` is an agent's call in the spec too: carry it with its reason and list it for the user at approval, so the user can still reject it.
3. Its open questions and its "Left to the spec" part join the frontier of the interview.

When its `Status:` line says Draft, read it as context only. Its decisions are not settled: say that the brief is not approved yet, and ask its decisions like any other open decision (or offer to finish it with `mstack-brainstorm` first).

## An epic as the source

An epic is one piece of an initiative, written by a product person: what it is for and how anyone will know it worked, with no code. `references/product-format.md` gives its lines and headings. Whatever its Status, name the epic's path as the source in your first message and in the spec's Source line.

Only the `Status:` line under its title decides whether it is settled. An epic kept in an Obsidian vault also has a properties block above the title; when that block's `status` differs from the `Status:` line, tell the user in one line that the two differ, and go by the `Status:` line.

When the `Status:` line says Approved:

1. Its outcome, who it is for, what is in and out, its acceptance statements, its measurable result and its fixed limits are settled. Never ask them again; record each in the interview record as decided in the epic, with the epic's path. Turn the acceptance statements into requirements and scenarios through your own interview and drafting; nothing is copied over mechanically.
2. Its open questions for developers join the open items of the interview. Sort them like any other: look up the ones the code answers, and ask the rest when they are ready.
3. Its size is context only. It never becomes a requirement or a limit. The spec's own size (small or full) is decided by this skill's rules, never taken from the epic's size.
4. A line under "Ideas the team already has" is one option for Phase 3, not a decision.
5. Before your first round, hold the epic's headings against the list in `references/product-format.md`, one by one. A part the format requires that is missing has not been decided: name it to the user and ask it as soon as it is ready, in the first round when nothing blocks it. A heading the format does not know is context.

When the `Status:` line says Draft, read the epic as context only: say that it is not approved yet, and ask its decisions like any other open decision (or offer to finish it with `mstack-epic` first).

A product plan (first heading `# Product plan:`) holds several epics in short form and is not a spec source. Say that a spec starts from one epic, name `mstack-epic` as the skill that details one, and ask which epic the user means. Continue only with that one epic section, as context that is not settled. Never write one spec for a whole product plan.

## Evidence and decisions as sources

Both are product documents; `references/product-format.md` gives their opening lines and parts. Either can come beside an epic or a brief, and you name each one's path in your first message and in the spec's Source line. Only the `Status:` line decides whether one is settled.

1. An Approved evidence document feeds the spec's Problem part: state the problem with a count from it, and cite its path. Do not ask for the evidence again, and do not copy the document.
2. An Approved decisions document settles what is under its `## Decisions` part. Never ask those again; record each in the interview record as decided in that document, with its path. What is under `## Seems decided, please confirm` and `## Open points` joins the open items of the interview.
3. A Draft of either is context only: say that it is not approved yet, and treat nothing in it as settled.

## The interview

Model the subject as a design tree, where each decision branches into the decisions that depend on it. The frontier is every decision whose prerequisites are already settled.

1. Before asking anything, sort every open item into one of four kinds.
   - **Fact.** What the code does today, which library is installed, the current limit. Look it up and cite it. Never ask it. Use your subagent tool for lookups that take a while, and keep asking the questions that do not depend on them.
   - **Look and feel.** A question whose answer is how something looks or feels cannot be settled by talking. Offer a throwaway prototype as a question in the round. Build it in a scratch folder only after a yes, and record the result under Decisions.
   - **Process call.** Where the file goes, how to show something, whether to look further. Make the call yourself and say what you chose.
   - **Decision.** Ask the user, with a recommendation.
2. Use the coverage list in `references/coverage.md` privately, to find branches you would otherwise miss. Never read it out as a questionnaire, and mark branches that do not apply instead of asking about them.
3. Ask the whole frontier in one round, leaving out what an approved brief or an approved epic already settled (see "A brief as the source" and "An epic as the source"). Number the questions. Give a recommendation for each and word the question so a plain "yes" accepts it. A question that depends on another open question in the same round waits for a later round.
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
