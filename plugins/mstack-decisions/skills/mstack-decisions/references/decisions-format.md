# The decisions document

Read this before you write a decisions document. The opening lines, the places and the Obsidian rules are in `product-format.md`. This file fixes what is inside each part. The check script reads the forms below literally, so write them exactly.

## The forms the script reads

- **A pointer** names one place in the notes: `<file> :: <locator>`. The file is a path relative to the document. The locator is a time such as `00:14:05` or `14:05` (the transcript line that starts with it), or `line <n>`, or `item <n>` (the n-th block of a text file, where blocks are separated by blank lines or by a `---` line), or `row <n>` (the n-th record of a CSV file, counted from 1 after the header).
- **A quote** is one line: `> "<the exact words>" @ <pointer>`, with straight quote marks. The script fails any other line that starts with `>`, so nothing that looks like a quote goes unchecked. A time is the whole number at the start of the transcript line, with or without square brackets. In a CSV file the words must sit inside one field of the row.
  - `[...]` inside a quote marks words you left out. The words on both sides must be at the same place, in order.
  - `[role: <role>]` stands for the name, email address or phone number of a customer or outsider you removed. One mark stands for at most 80 characters of the notes.
  - Outside these two marks, at least 20 characters of the quote must be the notes' own.
- **An entry** starts with a line `### <n>. <text>`, numbered from 1 inside its part.

Notes the script cannot read as text (a recording, a picture of a whiteboard) have no pointer it accepts. Save their text as a text file beside the document and point at that, or check by reading and say so in the Review line.

## Under the header lines

One line for the meeting: its date and who attended, as the notes give it. Then one line per notes file you read, with how much of it there is (its number of lines, or its length in minutes), and one line per file you could not read or skipped, with the reason. When you read only part of the notes, say which part and how much you did not read. When names of outsiders were kept on request, one more line says so.

## The parts

```text
## Decisions
## Seems decided, please confirm
## Open points
## Action items
## Changes other documents need
```

Each of the first, second and fourth holds entries, or one line that starts with `None` and gives the reason, and then nothing else. A decision, a half decision and an action item are always numbered entries: the script fails a list line in these three parts that is outside one.

### Decisions

```text
### <n>. <the decision in one sentence>
- Decided by: <the person, as the notes name them, or "speaker unclear">
- Why: <the reason the notes give, or "not stated in the notes">
- Options set aside: <what was considered and dropped, or "not stated in the notes">
- What follows: <what this changes, when the notes say, or "not stated in the notes">
- Replaces: <an earlier decision this one reverses, when there is one>
> "<quote>" @ <pointer>
```

### Seems decided, please confirm

The same shape, with a question in place of the decider:

```text
### <n>. <what seems to have been decided>
- Question: <what the user has to confirm, and why it is not clear>
> "<quote>" @ <pointer>
```

### Open points

One line per point that was discussed and not closed, each with a pointer in brackets. A quote line here is allowed and is checked.

### Action items

```text
### <n>. <the action, as the notes give it>
- Owner: <one person, or "no owner named">
- Date: <the date the notes give, or "no date">
```

When the notes name two people for one action, write both as the notes do and ask the user which one owns it.

### Changes other documents need

For each decision that changes a product plan or an epic the user named: the document's path, the part, what the part says now, and what the decision implies. With no document named, write "None, no document was named". With nothing to change, write "None", followed by the reason.

## A complete example

```text
# Decisions: Portal planning, 2026-11-03

Status: Draft
Review: none yet
Source: meeting.txt

Meeting on 2026-11-03. Attended, as the notes give it: Ana (product lead), Ben, a customer contact.
Notes read: meeting.txt, 3 lines, all of it. Skipped: none.

## Decisions

### 1. The invoice export waits until next quarter
- Decided by: Ana (product lead)
- Why: the audit needs the invoice list first
- Options set aside: shipping the export together with the list
- What follows: not stated in the notes
> "we go with option B, the export waits until next quarter" @ meeting.txt :: 00:01:00

## Seems decided, please confirm

### 1. The mobile view is dropped for now
- Question: Ben suggested it and nobody answered. Is it decided?
> "maybe we should drop the mobile view for now" @ meeting.txt :: 00:02:10

## Open points
- When the portal ships. One line says March, speaker unclear (meeting.txt :: 00:03:00).

## Action items

### 1. Check the invoice export with the billing team
- Owner: Ben
- Date: no date

## Changes other documents need
- docs/product/2026-11-01-portal/product-plan.md, epic 2 "Invoices", line "In and out". It says now: export of the list is in. Decision 1 implies: export moves out, to a later epic.
```
