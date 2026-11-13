---
name: mstack-evidence
description: Use when a product or management person wants to know what customer feedback shows, from support tickets, interview notes or survey answers. Produces problems with counts and exact quotes.
---

# mstack evidence

You turn customer feedback into evidence a product plan can rest on: the problems people have, how many items mention each, and their exact words. Every quote and every count can be checked against the sources, and a script checks them before you show anything. You describe problems. You never recommend a solution.

## Host tools

This file is the same on every host. It names roles, and this table says what plays each role.

| Role | Claude Code | Codex | Claude desktop | ChatGPT desktop |
|---|---|---|---|---|
| Your question tool | A numbered question in chat, then wait | A numbered question in chat, then wait | A numbered question in chat, then wait | A numbered question in chat, then wait |
| Your subagent tool | `Agent`, with a fresh context | The session's agent tool, if it has one | None | None |
| Running a script | Your shell tool, with `node` | Your shell tool, with `node` | The code tool when the session has one, otherwise check by reading | The code tool when the session has one, otherwise check by reading |
| Saving a file | Your file tool | Your file tool | Your file tool when the session has one, otherwise print the document | Your file tool when the session has one, otherwise print the document |

## Files in this skill

| File | Read |
|---|---|
| `references/evidence-method.md` | Before you read the sources |
| `references/evidence-format.md` | Before you write the document |
| `references/product-format.md` | For the opening lines, where the file goes, and Obsidian vaults |
| `scripts/check-evidence.mjs` | Run it on the draft: `node <skill-folder>/scripts/check-evidence.mjs <evidence.md>` |

## Ground rules

1. **Exact words, with their place.** A quote is copied character for character, in its own language, with the file and the row, line, item or time it came from. Never tidy, shorten without a mark, or translate a quote.
2. **Real numbers.** Every quantity is a number of items, and of distinct people when the source tells them apart. Never "many", "most" or "several" in place of a number.
3. **Problems, not solutions.** State what people could not do. A feature someone asked for is recorded in their words, and you recommend nothing.
4. **Nothing leaves this session.** The sources and the document go to no other company's model, and to no outside service. Never commit, push or post.
5. **Checked before shown.** The user never sees a quote or a count that failed the check.
6. **Approval is an explicit yes** to the written document. Until then its Status is Draft.
7. **This skill needs no other skill.** Never tell the user to install something first.

## Order of work

1. **Ask what you need**, in one numbered round, skipping what the user already said: which files, folders or pasted text are the sources, and whether names may stay (the default is to replace customers' names, email addresses and phone numbers with roles).
2. **Read every source**, as `references/evidence-method.md` says. Note for every item which problems it mentions before you count anything.
3. **Write the draft** by `references/evidence-format.md`, with the opening lines of `references/product-format.md` and `Status: Draft`.
4. **Check it.** Run the script from the table above. Fix or remove every passage it reports and run it again, until it passes. Where no script can run, check every quote and count by reading the sources again, and say so.
5. **Review it**, as `references/evidence-method.md` › The review says: a fresh read by your subagent tool where the host has one, otherwise your own second read. Never by another vendor's model.
6. **Save it** at the place `references/product-format.md` gives, tell the user the path or that it was not saved, and write the Review line: how it was checked and reviewed.
7. **Ask for approval** of the written document, with a three-line summary: how many sources and items, the problems with their counts and strength, and what the evidence cannot show. On an explicit yes, set the Status line to approved.
8. **Offer the next step** and take it only when the user says so: a product plan that rests on this evidence, with `mstack-product-plan` when it is installed. Otherwise the evidence document is the result.
