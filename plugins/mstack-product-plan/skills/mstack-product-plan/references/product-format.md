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

## Rules for every part

1. A part with nothing to say reads "None", followed by the reason. Never leave a part out, except the optional ideas part.
2. Size is small, medium or large, with a reason in words. No hours, days, weeks or points.
3. No code, technical design or task list anywhere. A solution the user offers goes on the ideas line, and nothing else in the document depends on it.
4. An open question for developers is something the product person does not know or does not want to decide. It is not a place for the skill's own technical guesses.

## Where the file goes

Use the first that applies, and tell the user the path:

1. A place the user named.
2. In a Git repository: the product plan at `docs/product/<yyyy-mm-dd>-<slug>/product-plan.md`, each of its epics beside it at `epics/<nn>-<slug>.md` (where `<nn>` is the epic's number in the plan), and an epic with no product plan at `docs/product/epics/<yyyy-mm-dd>-<slug>.md`.
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

   An epic uses `type: epic` and adds `size: <small | medium | large>`. An epic that comes from a product plan also adds `order: <now | next | later>` and `plan: "[[<the plan's note name>]]"`; an epic with no product plan has neither. A link inside a property is written in double quotes.
2. `status` is `draft` or `approved`. Write it in the same edit as the `Status:` line, with the same meaning. When the two ever disagree, the `Status:` line is the one that counts.
3. Links between a plan and its epics are Obsidian links. In the plan, each epic's heading line is followed by `- Detail: [[<the epic's note name>]]`, written when the plan is written, also for an epic that has no note yet. An epic that comes from a product plan links back to it with `[[<the plan's note name>]]` on its `Source:` line.
4. Everywhere else, and always outside a vault, write plain paths, no properties block and no `[[`.

When the document goes into a vault you cannot reach, print it as above with its properties block and links, so the user can paste it into a new note unchanged.

## Reading a document

1. Find each part by its heading or its label, exactly as written here.
2. A part that is missing has not been decided. Ask it.
3. A heading you do not know is context. Read it, and treat nothing in it as decided.
