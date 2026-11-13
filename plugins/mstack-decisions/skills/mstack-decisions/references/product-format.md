# The product plan and the epic

Read this before you write or read a product plan or an epic. It fixes the lines and headings that other skills look for. Keep in English and exactly as written: every heading below, the keys `Status:`, `Review:` and `Source:`, the labels of an epic's lines (`- Outcome:` and the others), the words `Draft` and `Approved`, the group names Now, Next and Later, the sizes small, medium and large, and the property keys and values. Write everything else, including what follows each key and label, in the language the user answers in.

## Opening lines

A product plan starts with these lines, in this order:

```text
# Product plan: <title>

Status: Draft
Review: none yet
Source: <what it was written from>
```

An epic starts the same way, with `# Epic: <title>` as its first heading.

- `Status:` is `Draft`, or `Approved <yyyy-mm-dd> (approved in chat by the user)` after the user's explicit yes to the written document. Any later edit sets it back to `Draft`.
- `Review:` names who reviewed the document, whether the review was cross-vendor or same-vendor, the round, and the verdict.
- `Source:` says what the document was written from: a conversation with its date, a design brief with its path, notes that were read. For an epic it names the product plan's path and says whether that plan was approved, or says "no product plan".

A reader decides whether a document is settled from its first heading and its `Status:` line, and from nothing else.

## The product plan

```text
## Problem and evidence
## Who it is for
## Outcome and measure
## Out of scope
## Fixed limits
## Risks and assumptions
## Epics
### Now
### Next
### Later
```

- **Problem and evidence.** Who has the problem and what it costs them, then the evidence. With no evidence, write "no evidence yet" and go on.
- **Who it is for.** The kinds of people, named specifically.
- **Outcome and measure.** What changes for those people, and how anyone will know.
- **Out of scope.** Each item with a one-line reason.
- **Fixed limits.** Dates, budget, legal or policy limits the user gave.
- **Risks and assumptions.** What could make this fail, and what is taken as true without proof.
- **Epics.** Every epic sits under exactly one of `### Now`, `### Next` and `### Later`, with a one-line reason for its place. No scores.

Each epic is a `#### <number>. <name>` heading under its group, followed by these labelled lines:

```text
- Why here: <the reason for now, next or later>
- Outcome: <what changes, for whom>
- Who it is for: <the kinds of people>
- In and out: <what the epic covers, and what it leaves out>
- Measurable result: <one result that can be measured, or "not measurable yet", then the reason>
- Size: <small | medium | large>, <a one-line reason>
- Depends on: <other epics by number, or "nothing">
- Open questions for developers: <what the product person does not know or does not decide, or "none">
- Ideas the team already has: <optional; a solution someone offered>
```

Number the epics once, in the order they were agreed, and never renumber them.

## The epic

```text
## Differences from the product plan
## Outcome
## Who it is for
## In and out
## Acceptance
## Measurable result
## Size
## Fixed limits
## Depends on
## User stories
## Open questions for developers
## Ideas the team already has
```

- **Differences from the product plan.** One line per point where this epic now says something else than the plan's epic section. "None" when nothing differs, or when there is no product plan.
- **Acceptance.** Plain sentences a product person can check, each about what a named kind of person can do or see ("A customer can download any invoice from the last 24 months"). Never the words GIVEN, WHEN or THEN.
- **User stories.** At most five.
- **Ideas the team already has.** Optional. Leave the heading out when there are none.
- The other parts follow the rules of the same parts above.

## Rules for every part of a product plan and an epic

1. A part with nothing to say reads "None", followed by the reason. Never leave a part out, except the optional ideas part.
2. Size is small, medium or large, with a reason in words. No hours, days, weeks or points.
3. No code, technical design or task list anywhere. A solution the user offers goes on the ideas line, and nothing else in the document depends on it.
4. An open question for developers is something the product person does not know or does not want to decide. It is not a place for the skill's own technical guesses.

## The evidence and the decisions document

Two more product documents use the same opening lines and header lines. Each is written by its own skill, which also owns the layout inside its parts.

- An **evidence document** turns customer feedback into problems with counts and exact quotes. Its first heading is `# Evidence: <title>`. Its parts are `## Sources`, `## Problems`, `## Not grouped` and `## What this evidence cannot show`.
- A **decisions document** turns the notes of one meeting into decisions, action items and open points. Its first heading is `# Decisions: <title>`. Its parts are `## Decisions`, `## Seems decided, please confirm`, `## Open points`, `## Action items` and `## Changes other documents need`.

Reading one as a source:

1. Its `Status:` line decides, as for every product document. A Draft is context only: say that it is not approved, and treat nothing in it as settled.
2. An Approved evidence document gives the problem and its evidence. Summarize its problems with their counts, keep at most one quote per problem, and point at the document. Never copy it whole, and do not ask for the evidence again.
3. An Approved decisions document settles what is under `## Decisions`. Take each decision in its own words: add no date, scope or meaning it does not state ("next quarter" stays "next quarter"). What is under `## Seems decided, please confirm` and `## Open points` is not settled: add it to the open items.
4. Name the document on the `Source:` line of whatever you write from it.
5. When two Approved sources disagree, the later decision wins. A decision made after a product plan or an epic was approved overrides what it changes there (when the plan puts something in scope and a later decision says it waits, it is out, and you do not ask again or keep it as a later part), and inside a decisions document an entry with a `Replaces:` line overrides the one it names. Say in one line which source you followed, and record the difference where your document has a place for it (an epic lists it under `## Differences from the product plan`). When you cannot tell which is later, ask.

Never edit either document from another skill.

## Where the file goes

Use the first that applies, and tell the user the path:

1. A place the user named.
2. In a Git repository: the product plan at `docs/product/<yyyy-mm-dd>-<slug>/product-plan.md`, each of its epics beside it at `epics/<nn>-<slug>.md` (where `<nn>` is the epic's number in the plan), and an epic with no product plan at `docs/product/epics/<yyyy-mm-dd>-<slug>.md`. An evidence document goes beside its product plan as `evidence.md`, and a decisions document as `decisions/<yyyy-mm-dd>-<slug>.md`, one per meeting. With no product plan they go to `docs/product/evidence/<yyyy-mm-dd>-<slug>.md` and `docs/product/decisions/<yyyy-mm-dd>-<slug>.md`.
3. In an Obsidian vault: the folder the user picks when asked, with the same file names.
4. Otherwise the current folder.

When a file already exists at the path, show what is there and write nothing until the user says yes.

When you cannot save a file at all, print the whole document in the chat, say in one line that it was not saved, and apply the review and the approval to that text. Never name a path you did not write.

## In an Obsidian vault

A folder is a vault when it has an `.obsidian` folder at its top, or when the user says it is one (the name of that folder can be changed in Obsidian).

Inside a vault, and only there:

1. The file starts on its first line with a properties block. The title line stays the first heading, right after the block.

   ```text
   ---
   type: product-plan
   status: draft
   ---
   # Product plan: <title>
   ```

   An evidence document uses `type: evidence`, and a decisions document `type: decisions` with `date: <yyyy-mm-dd>` for the day of the meeting. An epic uses `type: epic` and adds `size: <small | medium | large>`. An epic that comes from a product plan also adds `order: <now | next | later>` and `plan: "[[<the plan's note name>]]"`; an epic with no product plan has neither. A link inside a property is written in double quotes.
2. `status` is `draft` or `approved`. Write it in the same edit as the `Status:` line, with the same meaning. When the two ever disagree, the `Status:` line is the one that counts.
3. Links between a plan and its epics are Obsidian links. In the plan, each epic's heading line is followed by `- Detail: [[<the epic's note name>]]`, written when the plan is written, also for an epic that has no note yet. An epic that comes from a product plan links back to it with `[[<the plan's note name>]]` on its `Source:` line.
4. Everywhere else, and always outside a vault, write plain paths, no properties block and no `[[`.

When the document goes into a vault you cannot reach, print it as above with its properties block and links, so the user can paste it into a new note unchanged.

## Reading a document

1. Find each part by its heading or its label, exactly as written here.
2. A part that is missing has not been decided. Ask it.
3. A heading you do not know is context. Read it, and treat nothing in it as decided.
