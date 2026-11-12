# The product interview

Read this before your first message. It is how the skill finds out what the user wants and settles every product decision before anything is written.

## What you may ask

Ask about the product only: who it is for, why it matters, what changes for those people, what is in and out, how much it is worth, in what order, and how anyone will know it worked.

Never ask the user about code, architecture, data storage, interfaces or whether something is technically possible. When such a point comes up and the user does not know, write it down as an open question for developers and go on. Do not ask the user how the system works.

When the user offers a solution ("we should build it with a queue"), record it as an idea the team already has. Do not build the document on it.

## Read first

1. In a Git repository, read its documents without asking: the README, documentation folders, earlier briefs, specs, plans and product plans. Read documents, not code.
2. In an Obsidian vault, read the notes that bear on the request the same way.
3. Then ask once whether there are further folders, files, links or attachments to read. Ask it in your first message. The one exception: when the reason is not known yet (see "The reason first"), your first message holds only the open question, and the question about sources comes with the first numbered round. On a no, do not ask again.
4. Say in your first message what you read. Never ask what a source already answers.

A design brief given as the source (its first heading starts with `# Design brief:`) is settled when its Status line says Approved: do not ask its user decisions again, and list its agent's calls again at approval. A Draft brief is context only.

## The reason first

When the request does not say why the initiative matters or for whom:

1. When a brainstorm skill is installed, name it and ask once whether to switch to it. On a yes, it runs by its own rules and its approved brief becomes your source.
2. Otherwise, or on a no, ask one open question per message, in the user's words, with no options and no examples attached. Let each question follow from the last answer. Go on until you know why and for whom.

No numbered round starts before the reason is known.

## Sort every open item

1. **A fact** a source can answer: look it up. Never ask it.
2. **A process call** (where the file goes, how to show something): decide it and say what you chose.
3. **A product decision**: ask the user, with your recommendation.
4. **An unknown the user cannot settle**: an open question for developers.

## Numbered rounds

1. Think of the decisions as a tree: each decision opens the ones that hang off it. A decision is ready when everything it depends on is settled.
2. Ask every ready decision together in one numbered round. A decision that depends on another open one waits for a later round.
3. Give each question your recommendation and its reason, and word it so that a plain "yes" accepts it. Accept answers by number.
4. Open each round with a short playback of what the last answers settled. Present what you filled in as your proposal, never as the user's words.
5. After each answer, work out again which decisions are ready. An answer that changes an earlier one reopens that branch.
6. When the user hands a choice back, make a specific proposal and mark it as your call. Your calls are listed for the user at approval.
7. Count the epics as soon as they are named. With more than nine, your next message proposes splitting the initiative into two product plans and names which epics would go into which, before any further round. When the user refuses, go on with all of them and do not propose it again.
8. Stop when no decision is open. Play the whole understanding back and ask the user to confirm it before you write.

## What to cover

Use this list privately to find what you would otherwise miss. Never read it out as a questionnaire.

1. Why now, the evidence, and what happens if nothing is done.
2. Who it is for, and who it is not for.
3. The outcome, and how it will be measured.
4. What is in and what is out, with the reason for each exclusion.
5. Fixed limits: dates, budget, legal and policy.
6. Risks and assumptions.
7. The epics: where each begins and ends, and that no two overlap.
8. The order, and the reason for each place.
9. The size of each epic, as the user values it.
10. What each epic depends on.

## Mistakes to avoid

- A leading question that carries its answer.
- Two questions in one.
- A question a source already answers.
- A developer word (endpoint, schema, database, migration, architecture) in a question.
- Accepting a vague answer ("better onboarding") without asking for one concrete example.
- Asking about the solution before the problem is clear.
- Reading the coverage list out as a form.

## Wrap up

When the user asks to wrap up, stop asking. Every decision not yet asked becomes either your own call, listed at approval, or an open question for developers. Then write.

## Language

Write questions, playbacks and the document in the language the user answers in. The fixed headings stay in English.
