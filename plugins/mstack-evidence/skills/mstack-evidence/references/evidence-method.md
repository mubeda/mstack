# From feedback to evidence

Read this before you read the sources. It is how the skill reads feedback, counts it and judges how far it can be trusted.

## Before you start

Ask in one numbered round, skipping what the user already said:

1. Which files, folders or pasted text are the sources? A connected tool the session already has may be read when the user names it. Never fetch feedback from anywhere the user did not name.
2. May names stay? The default is no.

Pasted text has no file. Save it as a text file beside the document first, so quotes can point at it.

## Read everything, and say where you stopped

1. Read every source in full. Work out what one item is in each: one ticket, one answer, one note, one review.
2. Count the items of each source before you interpret anything.
3. A source too large to read in full: read a part you can describe (the newest 200 rows, every tenth row), and write down how many items you read, how you chose them and how many you did not read. Never present a sample as the whole.
4. A source you cannot read is listed as skipped, with the reason. Never fill in what it might have said.

## Two steps: notes, then counts

1. **Notes.** Go through the items one by one. For each, note the problems it mentions, in a few words, and its pointer. An item can mention several problems, or none.
2. **Problems.** Only then group the notes. Word each problem as what a kind of person could not do, or what cost them time or money. Keep two problems apart when different people have them or different things cause them, even when they sound alike.
3. **Counts.** Count each problem's items from your notes. Count distinct people too, when the source says who wrote each item: six tickets from one customer are one voice, not six.
4. **The rest.** Items that mention none of the problems are counted as not grouped. An item that contradicts a problem belongs to that problem, as a contradicting voice, and not to the rest. Check that every item is somewhere, and that none is both under a problem and not grouped.
5. **One problem or two.** Two problems are two different things people could not do. One item may name both, and then it counts for both. But when you are about to split one complaint into a problem and the fix people asked for ("cannot get a year of invoices" and "no download-all button"), with the same items under both, it is one problem, and the second half is what they asked for.

## Numbers

- Write the number. Never "many", "most", "several", "a few", "often" or "frequently" in its place.
- Say what the number counts: items, or distinct customers, or respondents.
- When a source does not say who wrote an item, say that people cannot be told apart, and do not guess.

## How strong the evidence is

Rate each problem by this rule, and write the facts beside the rating.

- **Strong:** at least two kinds of source (for example tickets and interviews), and at least five distinct people.
- **Weak:** one person; or one kind of source with fewer than three distinct people; or people that cannot be told apart and fewer than five items.
- **Medium:** everything else.

A source that does not tell people apart is never strong on its own, because repeated items may come from one person. These thresholds are a convention. The reader should be able to disagree with the rating from the facts you show.

## Choosing quotes

- A quote stands for its problem. Pick words that are typical of the items, not the most dramatic ones.
- Copy the words exactly: spelling mistakes, capitals and punctuation stay. Leave words out only with `[...]`.
- Never translate a quote. When it is in another language than the document, you may add a translation on the next line, starting with "Translation:".
- A statement about a quote ("customers are frustrated") is yours, not theirs. Keep it out of quote marks.

## Problems, not solutions

When an item asks for a feature or a fix, record the problem behind it, and put the request under "What they asked for" in the person's words. Recommend nothing, rank no solution, and estimate no effort.

## What the evidence does not say

- **Keep contradictions.** When some items say the opposite of a problem, list them under it with their own quotes.
- **Silence is not evidence.** A topic nobody mentioned does not show that nobody cares. Say what you looked for and did not find.
- **Name the sample's limits.** Tickets show people who complained. Interviews show people who agreed to talk. A survey shows who answered.
- **No causes you were not told.** When the sources do not say why something happens, write "not stated".

A document with no limits and no contradictions is suspect. Look again before you write "none found".

## Personal data

Unless the user said names may stay, replace the names, email addresses and phone numbers of customers and other outsiders, wherever you write them: inside a quote as `[role: <role>]`, elsewhere as the role. Colleagues of the user keep their names. When names stay, say so in one line under the header lines.

## The check

Run `scripts/check-evidence.mjs` on the draft. For each line it reports, go back to the source: correct the quote or the pointer, correct the count or its list, or remove the passage. Never edit a quote toward what you remember. Run it again until it passes.

Where no script can run, do by reading what the script does: open each pointer and compare the quote character by character, then count each list. Write in the Review line which of the two checks ran.

## The review

After the check, the document gets one fresh read. Use your subagent tool with a fresh context when the host has one, and give it only the document, the sources and the checklist below. Otherwise read the document again yourself against the checklist, one item at a time. Never send the document or the sources to another vendor's model.

The checklist:

1. Is each problem worded as a problem, with no solution inside it?
2. Does any sentence use a quantity word where a number belongs?
3. Does each strength follow the rule, from the facts shown?
4. Are two problems really one, or one really two?
5. Is a contradicting item missing, or a limit of the sample?
6. Does a name, an email address or a phone number of an outsider remain?
7. Does any sentence state a cause or a wish the sources do not hold?

Fix what the read finds, run the check again when a quote or a count changed, and write the Review line: for example "script check passed; a fresh read by the same model, same-vendor, round 1".

The review is not the user's approval. Ask for an explicit yes to the written document.
