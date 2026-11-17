# Words in the interface

Read this when the work writes words a user reads: buttons, labels, headings, errors, empty states. The project's own voice and style guide win over every default here.

## Say the plain thing

- Write as the owner would say it to a customer: the product's own nouns, a real place, a number the user gave.
- **The swap test.** A heading that would also fit a competitor's page says nothing. Rewrite it with something only this product has.
- One idea per sentence. Verbs before adjectives. No rows of three adjectives.
- No filler: no "Welcome to", no "In today's world", no line that only announces the next one.
- Words that sound generated are a default to avoid, because readers have learned to skip them: "seamless", "robust", "empower", "unlock", "elevate", "effortless", "next-generation", "world-class", "game-changer", "Say goodbye to", "It's not just X, it's Y".
- No invented facts, names or quotes (`direction.md`, nothing invented). Sample data inside a mocked screen reads plainly as a sample and uses a reserved example domain for addresses.

## Buttons and links

- A button says what it does: a verb and its object. "Save changes", "Send invite", "Book a table". Not "Submit", "OK" or "Continue", unless it really is the next step of a flow.
- A link says where it leads. Not "Click here", "Learn more" or "Read more" by itself.
- The main action keeps one wording everywhere it appears on a page.
- A destructive action names what is lost: "Delete project", not "Confirm".
- Keep a label short enough to stay on one line (`layout.md`, screen sizes).

## Errors

- An error says what went wrong and what to do next, in one sentence where it can: "Enter an e-mail address with an @" beats "Invalid input".
- Say it without blame and without alarm: no "Oops", no exclamation marks, no error codes alone.
- Put it where the problem is (`floor.md`, forms), and keep what the user typed.
- When the system failed and the user did nothing wrong, say so, and offer a way on: try again, go back, get help.

## Empty, loading, done

- **Empty:** what is empty, and the one action that fills it. "No invoices yet. Create your first invoice."
- **Loading:** say what is happening when it takes long enough to read: "Saving…", "Loading orders…", with a real ellipsis character.
- **Done:** confirm in the words of the action: after "Send invite", "Invite sent to" and the address. Only after it really happened.

## Labels and headings

- A label is the plain word for the thing: "E-mail address", "Company name". A hint under it gives the format or the reason, not a repeat of the label.
- A section heading says what the reader will find, not a category: "Three plans, billed monthly" beats "Pricing options".
- **Case.** Sentence case for headings, buttons and labels is the default, because it reads as speech and survives translation. A project that uses title case keeps it: be consistent with what is there.
- Address the user as "you". Avoid "we" for the system and "my" for the user's things, unless the project already does.

## Numbers, dates, plurals

- Use numerals for counts: "8 projects", not "eight projects".
- Format numbers, amounts and dates with the platform (`Intl.NumberFormat`, `Intl.DateTimeFormat`) in the user's locale. Never build them by hand.
- Plurals come from the platform too (`Intl.PluralRules`): "1 member", "2 members", and a wording for zero.
- A relative time ("3 hours ago") turns into a date after about a week, when "340 days ago" stops being readable.
- Keep a number and its unit together with a non-breaking space.

## Before you finish

Read every string once as a user in a hurry would: does each button say what happens, does each error say what to do, and is anything on the screen there only to fill space.
