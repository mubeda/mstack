# The wiki

Read this before the first read or write of the wiki in a session. The wiki is a folder of linked Markdown pages that outlives every session. It is a record of history: each line says what was true on a date, and nothing in it claims to describe the present, because a wiki cannot keep up with the code.

## Pages

| Page | Holds |
|---|---|
| `index.md` | Every page, as a link and one line, grouped by kind. The first place to look |
| `goal.md` | The goal, what counts as done, and the status |
| A subject page | One subject and nothing else: for example a decision with its reasons, a problem that keeps coming back, how one part of the system works, or how the user wants something done. Where two subjects bear on each other, a claim on each page links to the other |

The wiki points at its sources and does not hold them. An issue, a pull request, a transcript, a spec or a subagent's report stays where it is, unedited, and the claim that rests on it gives its link, path or commit. Name a secret, never write its value, and keep personal data out.

## Claims

A claim is one top-level list entry, and indented lines under it belong to it. On every page except `index.md`, each top-level list entry is read as a claim, so put a link to a related page inside a claim or a sentence, never in a bare list of links. Checkbox entries are the one exception: they are the goal page's criteria.

1. Every claim starts with the date it was true: `- 2026-11-10: <text>`.
2. A claim about code carries the repository and commit it was true at: `shop@4f2a9c1`. Take the commit from `git rev-parse --short HEAD` after checking that the code is in that commit.
3. Words that claim the present ("currently", "now", "at the moment", "at present", a bare "is") have no place in a claim about code, because the claim will outlive the code it describes. Give the date and the commit instead. Code quoted in backticks is not read as such a word.
4. When a fact changes, add a new claim. Leave the old claim's text as it is and end it with `(superseded <date>, see <link or the new claim's date>)`. Never rewrite or delete it: the old claim is how the next reader learns that the decision changed, and why.

A subject page:

```markdown
# Export flag

- 2026-11-03: The user decided the export ships behind the flag `EXPORT_V2` until the load test passes. Source: issue 41.
  (superseded 2026-11-10, see the 2026-11-10 claim)
- 2026-11-10: The user decided the export ships without the flag. See [the goal](goal.md).
- 2026-11-10: As of shop@4f2a9c1, `export_csv` does not read `EXPORT_V2`.
```

The goal page. Its criteria are checkboxes, and a ticked one carries its evidence:

```markdown
# Goal: ship the CSV export in release 2.4

## Done when

- [ ] The load test passes at 500 rows per second
- [x] Every export path has a test (`pytest tests/export`, 2026-11-02, 14 passed, shop@9b1d2e0)

## Status

- 2026-11-01: The user handed over the goal and confirmed the criteria above.
```

## Ingest

Ingest is how a fact reaches the next session. Do it as soon as something will still matter then: the user decided or corrected something, a subagent established a fact, a problem showed up a second time.

1. Read `index.md`, and re-read each page right before you write it, because another agent or person may have changed it.
2. A fact rarely belongs on one page. Write it on each page whose subject it changes: a decision about one part of the system usually goes on that part's page and into the goal page's status.
3. Add a page for a new subject, and link it from `index.md` and from the pages it relates to.
4. Mark what the fact overtakes as superseded (rule 4 above).
5. Tell the user which wiki files are new or changed and uncommitted. Never commit them yourself.

## Query

Before a decision the goal depends on, read `index.md` and the pages it points to for that subject, and say which claim you are relying on, with its date. When the answer you worked out is worth keeping, ingest it.

## Lint

Lint finds problems. It never deletes a claim and never settles a contradiction: report what you found, propose a fix for each, and wait for the user's answer.

1. Run the script for the mechanical part:

   ```bash
   node <skill-folder>/scripts/lint-wiki.mjs <wiki-folder>
   ```

   It prints one line per problem, `<file>:<line>  <kind>  <detail>`. The kinds are `orphan` (no page links to it), `not-in-index`, `broken-link`, `undated-claim`, `present-word` and `no-goal-page`. It exits 0 when the wiki is clean, 1 when it reported a problem, and 2 when the folder has no `index.md`. Without `node`, check the same points by reading, and say so.
2. Read for what no script sees: two claims that contradict each other with neither superseded, and claims that newer sources overtook (compare code claims with `git log` since their commit).
3. Report each finding with its file, line and date, and ask the user which claim holds before changing anything.

A wiki that existed before this skill and follows other conventions keeps them. Do not run the script on it, because it would report every page: lint it by reading.

## A lint schedule

A wiki nobody lints drifts. Once it has more than a handful of pages, suggest a recurring lint, weekly by default, and name the scheduling your host offers (the host table in `SKILL.md`). Create the schedule only after the user says yes.
