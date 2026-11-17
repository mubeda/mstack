# What is replaced, and what is not

Read this when the user asks what a result covers, what can still be in it, how to write the terms file, or whether the result is anonymous. The word lists themselves are in `scripts/anonymize.mjs`; this file describes them.

## Three ways a value is found

| Way | What it finds | Placeholder types |
|---|---|---|
| The terms file | Every term the user listed, as a whole word, in any case | `PERSON`, `CUSTOMER`, `COMPANY`, `TERM` |
| The name of a column or a JSON key | Every value under a name that means a person, a customer, a company, an e-mail address, a phone number, a postal address or a part of it, a birth date, an identifier or number, a user name, a credential or a money amount | `NAME`, `COMPANY`, `EMAIL`, `PHONE`, `ADDRESS`, `BIRTHDATE`, `ID`, `USER`, `SECRET`, `AMOUNT` |
| The form of the value, anywhere | E-mail addresses; phone numbers in international form or grouped by spaces or hyphens; card numbers that pass the Luhn check and have the first digits and the length of a large card scheme (Visa, Mastercard, American Express, Diners, Discover, JCB, UnionPay, Maestro); IBANs with right check digits; IPv4 and IPv6 addresses; URLs; host names; the user name in a home path; credentials (key blocks, bearer tokens, web tokens, tokens with a known prefix, the value after a key such as password, token or API key); amounts with a currency sign or code, with a sign and with spaces between groups of three; a number, or a code with a digit or in capitals (one letter is enough; `I`, and `BY` and `WHEN` as in `ORDER BY` and `CASE WHEN`, are kept), after a word such as order, ticket, invoice, account or customer; a code of capital letters, a hyphen and digits; a date after a word that means born | `EMAIL`, `PHONE`, `CARD`, `IBAN`, `IP`, `URL`, `HOST`, `USER`, `SECRET`, `AMOUNT`, `ID`, `BIRTHDATE` |

- Column names, key names and trigger words are known in English, German and Spanish. A name is split into words and matched by whole words: `customer_name` and `customerEmail` match, `product_name`, `filename` and `email_status` do not.
- When two ways find the same value, the terms file wins, then the column or key, then the form.
- A value replaced because of its column or key is also replaced, as a whole word, wherever else it stands in the same input. That is how a customer's name in a free-text column is caught without a terms file. It holds for short values too: an identifier `42` is then also replaced where `42` is a quantity. A value that is only digits is not taken out of a longer number, so `11` leaves `2026-11-17`, `08:11:02` and `3.11.2` as they are. A comma does not make a longer number: in `11,5` the `11` is replaced, because a comma also separates the identifiers of a list.
- A match that holds a smaller one takes its place, so a term inside an e-mail address or a token does not leave the rest of it visible.
- A value keeps the type it got first, so the same value under two columns has one placeholder.
- The same value has the same placeholder everywhere in one result. Two runs do not share placeholders, and no file links a placeholder to its original.
- The first row of a table is taken as its header only when none of its cells is a number, a date or a value that would be replaced. Otherwise every row is data, the columns are called "Column 1", "Column 2", and no column is replaced whole.
- Two rules replace more than a credential or a code, so that none is missed: after `Bearer` the next word is always replaced, also in ordinary text ("Bearer token"), and a word in capitals after a trigger word is replaced even when it is no code ("ORDER CONFIRMED" in a heading written in capitals).

## What stays in the result

- A name of a person or a company in free text that is in no named column or key and not in the terms file.
- Dates, except birth dates. Order dates and timestamps are kept.
- Numbers without a trigger word: quantities, measurements, bare numbers. A plain word after a trigger word stays too ("order confirmed").
- A token after the word `Basic` that stands alone, without an `Authorization` key in front, when it is shorter than 16 characters and holds no digit.
- File names, version numbers, and well-known technical names that look like a code, such as `UTF-8` or `SHA-256`.
- A phone number written without any grouping, or grouped by dots only.
- What only a reader can know: a job title that points at one person, a rare illness, a nickname, a description of a place.
- The path of the result file, as the user gave it. A file named after a customer keeps that name.

A column whose name the script does not know is still cleaned by form and by terms, cell by cell.

## The terms file

One file for the user, outside every repository: `anonymize-terms.txt` in the folder `mstack` of the user's configuration folder. `--print-terms-path` prints the full path. `--terms '<file>'` uses another file for one run.

```text
# one term per line; a line that starts with # is a comment
customer: Lakeside Example Traders
company: Example Holdings
person: Jane Example
Project Bluebird
```

A term without a type gets the placeholder `TERM`. A line with a type the script does not know is skipped and counted in the report. The file holds real names, so it is the user's to write and to keep; the agent never opens it.

## Not anonymous in the legal sense

Replacing values with placeholders that stay the same for the same value is pseudonymisation. The European Data Protection Board's Guidelines 01/2025 on pseudonymisation treat such data as information on an identifiable person, as long as it can be attributed to a person with additional information. The Article 29 Working Party's Opinion 05/2014 says that pseudonymisation is not a method of anonymisation: it lowers the link to a person and is a useful security measure. So a result of this skill lowers what a model or a reader sees, and can still be personal data. Whether it may be shared is the user's decision, and for a legal answer the user asks whoever is responsible for data protection at their organization.
