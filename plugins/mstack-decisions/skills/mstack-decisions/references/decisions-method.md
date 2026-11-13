# From meeting notes to decisions

Read this before you read the notes. It is how the skill tells a decision from talk, and how it avoids the mistakes meeting summaries usually make.

## Before you start

Ask in one numbered round, skipping what the user already said:

1. Where are the notes or the transcript? Pasted text has no file: save it as a text file beside the document first, so quotes can point at it.
2. May the names of customers and outsiders stay? The default is roles. Colleagues always keep their names.
3. Is there a product plan or an epic to compare with?

Never fetch notes from anywhere the user did not name.

Read the notes in full, and write down how much there was: each file with its number of lines or its length. A file you cannot read is listed as skipped, with the reason. When the notes are too long to read in full, read a part you can name (the first hour, lines 1 to 800), say which part and how much you did not read, and never present a part as the whole meeting.

## What counts as a decision

Something is a decision only when the notes show one of these:

- the person who has the say stated it ("we go with option B");
- the notes record it as decided ("Decision: ..."), or the group closed it in so many words.

It is not a decision when:

- someone suggested it and nobody answered. Silence is not agreement;
- people agreed in passing and nobody confirmed it;
- it was discussed and left open;
- someone reported an opinion, a wish or a plan of their own.

The first two go under "Seems decided, please confirm", each with the question the user has to answer. The third goes under "Open points". The fourth goes nowhere, unless it is an action someone took on.

Keep the person who decided apart from the people who gave input. A recommendation is not a decision, however strong.

## What you may not add

- **A speaker.** When a line has no speaker, or you cannot tell who "he" or "they" is, write "speaker unclear". A good guess is still a guess.
- **A reason.** When the notes give none, write "not stated in the notes". Do not supply the obvious one.
- **A number or a date** the notes do not hold. "Soon" stays "soon", in quotes.
- **Agreement.** "Everyone agreed" appears only when the notes say so.
- **An owner or a date for an action.** Write "no owner named" or "no date". An action item is copied as it was given, not sharpened.
- **Finality.** Words like "will" and "has decided" belong to decisions. For the rest, keep the notes' own tentative words.

## Later decisions

When a decision reverses an earlier one in the same notes, record both in order, and give the later one a `Replaces:` line. Never drop the earlier one. When the user names an older decisions document that this meeting reverses, say so under "Changes other documents need". Do not edit the older document.

## Comparing with a product plan or an epic

1. Read the document by `product-format.md`: its parts, and for a plan its epics.
2. For each decision, find the part it touches: an epic's "In and out" line, a fixed limit, the order, an acceptance statement.
3. Write what the part says now and what the decision implies. Do not rewrite the part.
4. A decision that touches nothing in the document is not listed there.
5. Never write to that document, rename it or move it.

## Personal data

Replace the names, email addresses and phone numbers of customers and other outsiders unless the user said they may stay: inside a quote as `[role: <role>]`, elsewhere as the role. Colleagues of the user keep their names, because a decision needs its decider and an action its owner. The user can ask for roles everywhere.

## The check

Run `scripts/check-decisions.mjs` on the draft. For each line it reports, go back to the notes: correct the quote or the pointer, add the missing line, or remove the entry. Never edit a quote toward what you remember. Run it again until it passes.

Where no script can run, do by reading what the script does: open each pointer and compare the quote character by character, and see that every decision has a quote and every action item an owner line and a date line. Write in the Review line which of the two checks ran.

## The review

After the check, the document gets one fresh read. Use your subagent tool with a fresh context when the host has one, and give it only the document, the notes and the checklist below. Otherwise read the document again yourself against the checklist, one item at a time. Never send the document or the notes to another vendor's model.

The checklist:

1. Is anything under Decisions really a suggestion, an unconfirmed agreement or a discussion?
2. Is a speaker, a decider or an owner named whom the notes do not name at that place?
3. Does any reason, number, date or "agreed" appear that the notes do not hold?
4. Is a decision in the notes missing from the document?
5. Is an action item sharper than the notes (an owner or a date that was added)?
6. Does a name, an email address or a phone number of an outsider remain?
7. Does each listed change name a part that exists in the named document, and quote it correctly?

Fix what the read finds, run the check again when a quote changed, and write the Review line: for example "script check passed; a fresh read by the same model, same-vendor, round 1".

The review is not the user's approval. Ask for an explicit yes to the written document.
