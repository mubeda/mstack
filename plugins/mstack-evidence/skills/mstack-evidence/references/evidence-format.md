# The evidence document

Read this before you write an evidence document. The opening lines, the places and the Obsidian rules are in `product-format.md`. This file fixes what is inside each part. The check script reads the forms below literally, so write them exactly.

## The forms the script reads

- **A pointer** names one place in a source: `<file> :: <locator>`. The file is a path relative to the document. The locator is one of:
  - `row <n>`: the n-th record of a CSV file, counted from 1 after the header;
  - `line <n>`: the n-th line of a text file;
  - `item <n>`: the n-th block of a text file, where blocks are separated by blank lines or by a `---` line;
  - a time such as `00:14:05` or `14:05`: the transcript line that starts with it. The time is the whole number at the start of the line, with or without square brackets.
- **A quote** is one line: `> "<the exact words>" @ <pointer>`, with straight quote marks. The script fails any other line that starts with `>`, so nothing that looks like a quote goes unchecked.
  - In a CSV file the words must sit inside one field of the row. A quote is never joined from two fields.
  - `[...]` inside a quote marks words you left out. The words on both sides must be in the same item, in order.
  - `[role: <role>]` stands for a name, an email address or a phone number you removed, such as `[role: a finance contact]`. One mark stands for at most 80 characters of the source.
  - Outside these two marks, at least 20 characters of the quote must be the source's own.
- **A count** is two lines, one right after the other:

  ```text
  - Count: <n> items
  - Items: <pointer>; <pointer>; <pointer>
  ```

  The number equals the number of pointers. No item appears twice in one list. Count each file by one kind of locator in the whole document (all `row`, or all `line`), because two kinds can name the same item twice. For nothing, write `- Count: 0 items` and `- Items: none`.

A source the script cannot read as text (a spreadsheet file, a PDF, a picture) has no pointer the script accepts. Save its text as a text or CSV file beside the document and point at that, or check by reading and say so in the Review line.

## The parts

```text
## Sources
## Problems
## Not grouped
## What this evidence cannot show
```

### Sources

One line per source: the file, its kind (support tickets, interview notes, survey answers, reviews), and how many items it holds. Then the sources you skipped or could not read, each with the reason. When you read only part of a source, say how many items you read, how you chose them and how many you did not read.

### Problems

One entry per problem, most items first. With no problem at all, write one line that starts with `None` and gives the reason, and nothing else in the part. A problem is always a numbered entry: the script fails a list line under `## Problems` that is outside one. When any item is listed under more than one problem, say so in one line right under the heading: "Items can count for more than one problem."

```text
### <n>. <the problem in one sentence: who could not do what>
- Who has it: <the kinds of people>
- Count: <n> items
- Items: <pointer>; <pointer>
- Distinct people: <a number, and of what: customers, respondents>, or "cannot be told apart"
- Strength: <strong | medium | weak>, <the facts that give the rating>
> "<quote>" @ <pointer>
- What they asked for: <"nothing specific", or leave the line empty and put a quote line under it for each request>
- Contradicting voices: <"none found", or leave the line empty and put a quote line under it for each item that says the opposite>
```

A request and a contradicting voice are always quote lines, never words inside the sentence, so the script checks them too. At most three quotes for the problem itself; requests and contradicting voices carry their own, one each. A problem whose items have no text to quote (ratings only) takes the line `- Quotes: none, <reason>` in place of quote lines.

### Not grouped

The items that mention none of the problems: one count, and one line on what they were about. Every item of every source has exactly one home: under a problem (in its Items list, or quoted as a contradicting voice of it), or here. An item that speaks about a problem, also to say the opposite, is never listed here.

### What this evidence cannot show

- Who is missing from the sample (support tickets hold only people who wrote in; an interview round holds only who agreed to talk).
- What you looked for and did not find, with where you looked.
- Any source you could not check with the script.

## A complete example

```text
# Evidence: Finding invoices

Status: Draft
Review: none yet
Source: tickets.csv (4 support tickets), interviews.md (1 interview note)

## Sources
- tickets.csv: support tickets, 4 items
- interviews.md: interview notes, 1 item
- Skipped: none

## Problems

Items can count for more than one problem.

### 1. Finance contacts cannot find an invoice without asking support
- Who has it: finance contacts at customer companies
- Count: 3 items
- Items: tickets.csv :: row 1; tickets.csv :: row 3; interviews.md :: item 1
- Distinct people: 2 customers and 1 interviewee
- Strength: medium, 3 people and two kinds of source
> "I had to ask three times for the same invoice" @ tickets.csv :: row 1
> "every month I spend an hour hunting for invoices" @ interviews.md :: item 1
- What they asked for:
> "please give us a download all button for invoices" @ tickets.csv :: row 3
- Contradicting voices: none found

### 2. Getting a whole year of invoices means opening them one by one
- Who has it: finance contacts who prepare an audit
- Count: 2 items
- Items: tickets.csv :: row 3; tickets.csv :: row 4
- Distinct people: 2 customers
- Strength: weak, one kind of source and 2 customers
> "our auditor wants every invoice of the year and I open them one by one" @ tickets.csv :: row 4
- What they asked for: nothing specific
- Contradicting voices: none found

## Not grouped
- Count: 1 items
- Items: tickets.csv :: row 2
- About: a request for a dark mode.

## What this evidence cannot show
- The tickets hold only people who wrote to support.
- Nobody was asked how often they need an old invoice.
```

Every item is accounted for: rows 1, 3 and 4 and the interview under a problem, row 2 under Not grouped. Row 3 counts for both problems, which the line under `## Problems` says.
