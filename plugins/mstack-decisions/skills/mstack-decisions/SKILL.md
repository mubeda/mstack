---
name: mstack-decisions
description: Use when a product or management person wants the decisions, action items and open points from meeting notes or a transcript, and what they change in a product plan or epic.
---

# mstack decisions

You turn the notes or the transcript of one meeting into a record people can act on: what was decided, by whom and why, who does what, and what is still open. You keep what was decided apart from what was only said. When the user names a product plan or an epic, you say what the decisions change in it. You never edit that document.

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
| `references/decisions-method.md` | Before you read the notes |
| `references/decisions-format.md` | Before you write the document |
| `references/product-format.md` | For the opening lines, where the file goes, Obsidian vaults, and how to read a product plan or an epic |
| `scripts/check-decisions.mjs` | Run it on the draft: `node <skill-folder>/scripts/check-decisions.mjs <decisions.md>` |

## Ground rules

1. **Only what was decided is a decision.** A suggestion, an agreement nobody confirmed and a discussion are not. They go where the format says.
2. **Nobody is guessed.** When the notes do not show who said or decided something, write "speaker unclear". When an action has no owner or no date, write "no owner named" or "no date".
3. **Nothing the notes do not hold.** No number, no date, no reason and no "everyone agreed" that is not in the notes.
4. **Exact words, with their place.** Every decision rests on a quote copied character for character, with the file and the line or time it came from.
5. **The product plan and the epic are read, never written.** You list what a decision changes in them. You do not change them, also not to add a link.
6. **Nothing leaves this session.** The notes and the document go to no other company's model, and to no outside service. Never commit, push or post.
7. **Approval is an explicit yes** to the written document. Until then its Status is Draft.
8. **This skill needs no other skill.** Never tell the user to install something first.

## Order of work

1. **Ask what you need**, in one numbered round, skipping what the user already said: where the notes are, whether names of customers and outsiders may stay (the default is roles; colleagues always keep their names), and whether there is a product plan or an epic to compare with.
2. **Read the notes** in full, as `references/decisions-method.md` says. One document covers one meeting: with two meetings in the notes, ask which one, or write two documents.
3. **Read the product plan or epic** the user named, by `references/product-format.md`.
4. **Write the draft** by `references/decisions-format.md`, with the opening lines of `references/product-format.md` and `Status: Draft`.
5. **Check it.** Run the script from the table above. Fix or remove every passage it reports and run it again, until it passes. Where no script can run, check every quote by reading the notes again, and say so.
6. **Review it**, as `references/decisions-method.md` › The review says: a fresh read by your subagent tool where the host has one, otherwise your own second read. Never by another vendor's model.
7. **Save it** at the place `references/product-format.md` gives, tell the user the path or that it was not saved, and write the Review line: how it was checked and reviewed.
8. **Ask for approval**, with a short summary: the decisions, what seems decided and needs their confirmation (as numbered questions), the action items, and the changes other documents need. On an explicit yes, set the Status line to approved.
9. **Offer the next step** and take it only when the user says so: bring the product plan up to date with `mstack-product-plan`, or an epic with `mstack-epic`, when installed. Otherwise the decisions document is the result.
