# The builder check

Read this after you wrote a brief for work sized as a project, and before you ask the user to approve it. The check finds the places where someone building from the brief would have to guess.

## Who reads

Start a fresh subagent with your subagent tool, on the standard tier's model and effort from `mstack-best-model-for`. Give it the brief's path and the prompt below, and nothing from the conversation: it must see only what a later builder sees.

```text
You are about to plan and build the work described in <brief path>. You cannot ask anyone a question.
Read the brief, and the files it names. List only the places where you would have to guess, and where a
wrong guess would change what gets built (behavior, scope, who it serves, how it fits what exists).
For each place give: the part of the brief, the question you would have to guess at, and what two
different answers would change. Do not list style, wording or details a spec would normally settle.
If nothing like that is left, say "nothing important left". Change no file.
```

Without a subagent tool, read the brief yourself as that builder, following the same prompt, and tell the user that you did the read yourself.

## Sorting the questions

Put each question the reader returns into one of three piles:

1. **Already answered.** The conversation settled it, but the brief does not say so. Write the answer into the brief.
2. **Minor.** A wrong guess would cost little and is easy to change later. Settle it yourself and add it under `### Agent's calls` with the reason.
3. **The user's.** Nobody but the user can settle it, and a different answer would change the result. Ask all of these in one numbered round, the most important first, each with a recommendation a plain yes accepts. Write the answers into the brief.

## Not an approval

The reader's report is never the user's approval, even when it says nothing important is left. After the check, always show the user the brief's path and ask for approval of that file.
