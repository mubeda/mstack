# Add mstack-explain-me-better, a mode that explains AI answers in simple language

Status: Approved 2026-11-12 (approved in chat by the user; edited that day: lines aligned with the shipped skill, and copyright names moved to the notices file only)
Size: full    Mode: gated    Type: feature
Source: conversation 2026-11-11. The user asked for a skill named `mstack-explain-me-better` that combines the installed terse-voice skill, the `i-have-adhd` skill and any other skill with the same purpose, to explain AI answers and reports in common, simple language.

## Problem

AI answers and reports are often long and hard to follow: the point is buried, the words are technical, and length is not matched to what the reader needs. The user reports that such answers are "sometimes really long without sense". Two installed skills shape how an agent writes (a terse voice, and an output style for a reader with ADHD), but neither is part of mstack, neither targets plain everyday language, and one of them writes fragments that are harder to follow for a reader who is not a native speaker.

## Goals

1. A reader who could not follow an answer gets the same content again in a form they can act on: the bottom line first, in everyday words.
2. Nothing that matters is lost in the simpler version: every number, warning, risk and decision in the original is still there.
3. The reader can tell a short answer from an incomplete one, because the answer says what it left out.
4. The style holds for the rest of the conversation without being asked for again.
5. The skill is one file of at most 130 lines and works unchanged in Claude Code and Codex.
6. When an explanation has structure a picture shows better, and the diagram skill is installed, the reader is offered a diagram and gets one only after saying yes.

## Non-goals

- A one-shot command that explains once and returns to the normal style. The user chose a mode that stays on.
- Fragments with dropped articles. The user chose full simple sentences.
- A readability score or a checking script. Readability formulas reward short words over clarity, and the user chose the one-file shape.
- Changing anything saved outside the chat (code, commit messages, documents, pull request text, issue comments). Those have their own readers.
- Requiring any other skill. The useful rules of the source skills are rewritten inside this one, and the diagram skill is optional.
- Drawing a diagram without being asked, or drawing one with this skill's own means. The diagram skill does the drawing.
- Reminding the reader that a diagram skill exists when it is not installed.
- OpenCode and Cursor support.

Anti-goals, which count as failure even if everything else works:

- A shorter answer that drops a number, a warning, a risk or a "not".
- Baby talk, or a tone that talks down to the reader.
- An explanation that adds a fact the original did not contain.
- An answer that announces its own style every time ("In simple terms: ...").

## Users and scenarios

1. As a developer who just received a long agent report I could not follow, I want it explained again simply, so that I know what happened and what I must do.
2. As a reader with limited attention for long text, I want every later answer in the same short, ordered shape, so that I do not have to ask each time.
3. As a reader who is not a native speaker of the language the agent writes in, I want full short sentences in common words, in my own language, so that I do not have to decode fragments or jargon.
4. As the same reader, I want to be told what was left out, so that I can ask for it when it matters.

## Requirements

"The skill" is `mstack-explain-me-better` as loaded by an agent. "The mode" is the state in which every answer to the user follows the skill's rules. "The original" is the answer, report, pasted text or file being explained. "Payload" is code, commands, paths, numbers with their units, error text, and names of files, flags and interfaces.

### R1. Loads on a fitting request  [Must]
The skill's description SHALL start with "Use when" and name the situations of not being able to follow an answer (asking to explain something better, more simply or in plain words, or saying an answer is too long, too complex or impossible to follow), and SHALL NOT summarize the skill's rules.
#### Scenario: a fitting request
- GIVEN a session with the skill installed and a long answer on screen
- WHEN the user writes that they did not understand it and asks for a simpler explanation
- THEN the skill loads without the user typing its name

### R2. Explain the thing in front of the reader first  [Must]
WHEN the mode starts, the skill SHALL explain the original the user points at (the previous answer when none is named, otherwise the pasted text or the named file) under the rules below, SHALL then keep the mode on, and SHALL close that first answer with one line saying that the simple style is on and which word turns it off. Loading the skill is what starts the mode; a plain question about the meaning of one word is not a reason to load it.
#### Scenario: started after a long answer
- GIVEN the previous answer was a long report
- WHEN the user starts the mode and names nothing
- THEN the next answer is that report explained again, not a description of the mode, and one closing line says the simple style is on and how to stop it
#### Scenario: nothing to explain
- GIVEN a conversation with no earlier answer and no text named
- WHEN the user starts the mode
- THEN the answer is one line saying the mode is on, and the next answer follows the rules

### R3. The mode stays on  [Must]
WHILE the mode is on, the skill SHALL apply its rules to every answer to the user, across changes of topic, until the user says "stop" for the mode or asks for the normal style, and SHALL then confirm in one line that it is off.
#### Scenario: a new topic
- GIVEN the mode is on and one explanation was given
- WHEN the user asks an unrelated question
- THEN the answer to it follows the same order and word rules
#### Scenario: turned off
- GIVEN the mode is on
- WHEN the user says to stop it
- THEN one line confirms that the mode is off, and the following answers are in the normal style

### R4. One fixed order  [Must]
WHILE the mode is on, the skill SHALL order every answer as: the bottom line in one or two sentences, then what the reader has to do if anything, then the points that matter, at most five unless more are warnings, risks or decisions the reader needs (R5 wins over the cap), and SHALL give further detail only when the reader asks for it or when a point cannot be understood without it.
#### Scenario: a report explained
- GIVEN a report whose conclusion is in its last paragraph
- WHEN the skill explains it
- THEN the conclusion is the first sentence of the answer

### R5. Short, and complete on what matters  [Must]
WHILE the mode is on, the skill SHALL give the shortest answer that still carries every number, warning, risk, limit, decision and stated uncertainty of the original that affects the reader, and SHALL NOT drop a negation or a qualifier ("not", "never", "only", "except", "unless").
#### Scenario: a risk in the middle
- GIVEN a report that mentions, in the middle of a long section, that a migration deletes a column
- WHEN the skill explains the report
- THEN the explanation says the column is deleted, in a sentence of its own
#### Scenario: nothing to cut
- GIVEN an original that is already three short sentences
- WHEN the user asks for it explained
- THEN the answer rewords what is unclear and does not pad it

### R19. Check before sending  [Must]
WHEN the skill explains an original, the skill SHALL compare its draft with the original before answering, item by item for the numbers, warnings, risks, decisions, negations and stated uncertainties, and SHALL restore each one that is missing or changed.
#### Scenario: a hedge that carries information
- GIVEN a report that says a fix "was not tested on Windows"
- WHEN the skill explains the report
- THEN the explanation still says the fix was not tested on Windows

### R6. Payload stays exact  [Must]
The skill SHALL keep payload exactly as in the original, and SHALL NOT translate, round or reword it.
#### Scenario: a command in the report
- GIVEN a report that gives a command and a measured time of 40 seconds
- WHEN the skill explains it
- THEN the command is copied unchanged and the time reads 40 seconds, not "under a minute"

### R7. Everyday words, full sentences  [Must]
WHILE the mode is on, the skill SHALL write complete short sentences with one idea each, in common words and the active voice, SHALL keep a technical term only when the reader needs it and explain it once in a few everyday words with the real name kept, and SHALL NOT write fragments with dropped articles.
#### Scenario: a needed term
- GIVEN a report about a "race condition" that the reader has to fix
- WHEN the skill explains it
- THEN the term appears once with a plain explanation beside it, and is used by that name afterwards

### R8. Say what was left out  [Must]
WHEN an answer leaves out part of the original, the skill SHALL end with one line that names what was left out and that the reader can ask for it.
#### Scenario: alternatives dropped
- GIVEN a report with three rejected alternatives the reader does not need
- WHEN the skill explains it without them
- THEN a closing line says the alternatives were left out
#### Scenario: nothing left out
- GIVEN an explanation that covers everything in the original
- WHEN it ends
- THEN it has no such line

### R9. Nothing added  [Must]
The skill SHALL state only what the original says or what it marks as its own inference, and IF the original is unclear or contradicts itself, THEN the skill SHALL say so instead of choosing a reading.
#### Scenario: a contradiction
- GIVEN a report that says in one place that all tests passed and in another that two failed
- WHEN the skill explains it
- THEN the explanation names both statements and says they disagree

### R10. What is saved elsewhere is untouched  [Must]
WHILE the mode is on, the skill SHALL write code, comments, commit messages, documents, pull request text and tracker comments in the style those have without the mode.
#### Scenario: a commit message
- GIVEN the mode is on
- WHEN the user asks for a commit message for a change
- THEN the commit message follows the repository's usual form, and only the chat text around it follows the mode

### R20. Required formats keep their shape  [Must]
WHILE the mode is on, the skill SHALL apply its rules to everything it says to the user in the chat, final reports included, and IF another skill or the repository's instructions require a format (a result block, a hand-over report, a status table), THEN the skill SHALL keep that format's fields and structure and apply only the word rules inside it.
#### Scenario: a required report
- GIVEN the mode is on in a repository whose instructions require a four-line hand-over report
- WHEN the work ends
- THEN the four lines are all there with their labels, written in everyday words

### R11. Short follow-ups work  [Should]
WHILE the mode is on, the skill SHALL treat "simpler", "shorter", "more detail" and "give me an example" as requests about its last answer.
#### Scenario: more detail
- GIVEN an explanation with a closing line that named what was left out
- WHEN the user writes "more detail"
- THEN the next answer adds the left-out part, in the same style

### R12. Plain and adult  [Must]
WHILE the mode is on, the skill SHALL use a matter-of-fact tone for an adult reader, SHALL give one concrete example when an idea is abstract, and SHALL NOT use greetings, praise, recaps, closing offers, or, after the first answer, a line that announces the style.
#### Scenario: an abstract idea
- GIVEN an original that describes caching in general terms
- WHEN the skill explains it
- THEN the explanation includes one concrete example from the reader's own case

### R13. The reader's language  [Must]
The skill SHALL answer in the language of the user's request, including when the original is in another language, and SHALL keep payload in its original form.
#### Scenario: a request in another language
- GIVEN a report in English
- WHEN the user asks in Spanish for it to be explained
- THEN the explanation is in Spanish, and commands and error text stay as written

### R14. Steps are numbered  [Must]
WHEN the reader has more than one thing to do, the skill SHALL give the actions as a numbered list with one action per item, in the order to do them.
#### Scenario: three things to do
- GIVEN a report that asks the reader to back up a database, run a migration and restart a service
- WHEN the skill explains it
- THEN the three actions are items 1 to 3 of a numbered list, in that order

### R15. Some things are never shortened  [Must]
IF an answer contains a security warning, a confirmation before an action that cannot be undone, or a question with options for the reader, THEN the skill SHALL write that part in full sentences with every condition kept.
#### Scenario: an irreversible action
- GIVEN the mode is on and the next step deletes data
- WHEN the skill asks for confirmation
- THEN the question names what is deleted and that it cannot be undone, in full sentences

### R16. Self-contained  [Must]
The skill SHALL work in full without any other skill, SHALL name no other skill except `archify` as the optional diagram skill, and no file SHALL contain a model name.
#### Scenario: the finished skill
- GIVEN the skill folder
- WHEN it is searched for other skills' names outside the notices file
- THEN only `archify` is found

### R21. Offer a diagram when it helps  [Must]
WHILE the mode is on, WHEN an explanation has structure a picture shows better (four or more steps in a flow, several parts that connect, an exchange between systems, states that change, or a timeline) and `archify` is in the session's skill list, the skill SHALL make one question asking whether the reader wants a diagram of it the last line of the answer, after every other closing line and as plain text in the chat, at most once per explanation.
#### Scenario: a flow of six steps
- GIVEN the mode is on, `archify` is installed, and the original describes a request passing through six services
- WHEN the skill explains it
- THEN the last line of the answer is one question offering a diagram, after every other closing line, and no diagram file exists yet
#### Scenario: a single fact
- GIVEN the same session
- WHEN the answer is two sentences about one setting
- THEN there is no diagram question

### R22. A diagram only after a yes  [Must]
WHEN the reader accepts the offer, the skill SHALL load `archify` and follow that skill's own steps to make a diagram that shows only what the explanation said, with labels in the reader's language, and SHALL give the reader the path of the file; IF the reader declines or does not answer the offer, THEN the skill SHALL make no diagram and SHALL NOT offer one again for that explanation.
#### Scenario: the reader says yes
- GIVEN an explanation that ended with the diagram question
- WHEN the reader answers yes
- THEN the diagram skill is loaded, one diagram is made from the explanation's content, and the reply gives its path
#### Scenario: the reader says no
- GIVEN the same explanation
- WHEN the reader answers no and then asks for more detail
- THEN the next answer has no diagram and no diagram question

### R23. Silent without the diagram skill  [Must]
IF `archify` is not in the session's skill list, THEN the skill SHALL make no diagram offer and SHALL NOT mention the diagram skill.
#### Scenario: not installed
- GIVEN a session without `archify`, and an explanation of a six-step flow
- WHEN the skill explains it
- THEN the answer has no diagram question and no line about a diagram skill

### R24. The setup skill knows the diagram skill  [Must]
The `mstack-setup` skill SHALL report `archify` as an optional dependency with its install command for each host, so that no mstack skill stops when it is missing.
#### Scenario: a machine without it
- GIVEN a machine where `archify` is not installed
- WHEN `mstack-setup`'s status check runs
- THEN it prints an optional row for `archify` marked missing, and the run's result is not a failure because of it

### R17. Packaged like the other plugins  [Must]
The repository SHALL ship the skill as the plugin `mstack-explain-me-better` for Claude Code and Codex, with its license copy, its notices file crediting every adapted source, both manifests, both registry entries and a README entry, so that the repository's two checks pass.
#### Scenario: the checks
- GIVEN the finished branch
- WHEN `check-marketplace.mjs` and `check-version-bumps.mjs` run
- THEN both pass

### R18. The rest of the repository stays true  [Must]
The repository SHALL update every text and list that counts or lists the mstack skills so that it includes the new skill, and SHALL raise the version of every plugin whose files change.
#### Scenario: the skill count
- GIVEN the finished branch
- WHEN the repository is searched for "fifteen"
- THEN no text still gives the old count of mstack skills

## Constraints and assumptions

- Adapted sources, all rewritten and credited in the skill's notices file as the repository's rules require: the terse-voice project at https://github.com/juliusbrussee/caveman (Apache-2.0, with a NOTICE file; it claims its name, which is used only to identify the source); `i-have-adhd` at https://github.com/ayghri/i-have-adhd (MIT). The copyright lines are in the notices file only. Both are already credited this way in `mstack-codex-review-workflow`'s notices (read 2026-11-11).
- `mstack-codex-review-workflow`'s `references/writing.md` already holds this project's own rewording of rules from those two sources and from pstack (MIT). Rules taken from that file carry the same credits. (agent's call: reuse the repository's own wording where it fits)
- The terse-voice project's skill text was MIT before its version 3.0.0 and Apache-2.0 after (its licensing notes, read 2026-11-11 by the research), so the notices file carries both its Apache-2.0 NOTICE lines with a statement that the rules were changed, and its MIT notice.
- Research on 2026-11-11 (`reports/Plain explanation skill research.md`, local and not committed) found that the US Federal Plain Language Guidelines, GOV.UK's content guidance and the W3C cognitive-accessibility patterns agree on the rules this spec uses: the most important information first, one idea per sentence, common words, the active voice, lists and numbered steps, and a specialist term explained on first use. Their numeric limits (sentences of 20 to 25 words, short paragraphs) are conventions, not research findings, so the skill states them as guides. These sources are used as ideas only; no text is taken from them.
- The same research found that none of the existing skills protects caveats, uncertainty or risks when shortening, and one of them removes hedging. R5 and R19 add that protection. The only verified way to test understanding, paraphrase testing, needs human readers; R19 is what an agent can do in its place.
- A skill named `eli5` contributes one idea ("simplify the wording, never the claims"); its upstream license was not established, so no text is taken from it.
- Any further source is used only when it has a license, and is then credited; a source without a license contributes ideas only.
- `AGENTS.md`: no personal or company data; model names only in `mstack-best-model-for`; every instruction must work against the real tool.
- The diagram offer needs one host tool, loading another skill, so the skill carries a small host table for that role and names roles outside it. The diagram question is plain text in the chat, so the explanation stays on screen while the reader decides.
- `archify` is https://github.com/tt-a1i/archify, Apache-2.0, a skill that makes diagrams as one standalone HTML file and needs Node. Its own install file gives one command for every agent: `npx -y skills@latest add https://archify.si --skill archify --agent <agent> --global --copy --yes`, with the agent ids `claude-code` and `codex` (its `llms.txt`, read 2026-11-11). Nothing of its text is copied; it is named and loaded, so it needs no entry in the notices file.
- The line limit rises from 120 to 130 for the host table and the diagram rules. (agent's call)
- New plugin version `0.1.0`. Marketplace `0.6.2` rises to `0.7.0`, because a plugin is added. `mstack-skill-creator` 0.3.1 to 0.3.2, `mstack-find-skills` 0.2.1 to 0.2.2 and `mstack-setup` 0.2.2 to 0.2.3, because they list the mstack skills. `mstack-chief-of-staff` 0.1.0 to 0.1.1, because its route table lists the other mstack skills.
- A host re-loads a skill's main file after its context is compacted, but not its reference files (Claude Code documentation, read 2026-11-11), which is why the rules live in one file.

## Decisions

D1. A plugin in this repository for Claude Code and Codex. Alternative: a local skill. Decided by: user.
D2. A mode that stays on until stopped. Alternatives: once only; both. Decided by: user.
D3. Full simple sentences. Alternative: fragments with dropped articles, as the terse-voice source writes. Decided by: user.
D4. Answers in the language of the user's request. Alternatives: the original's language; always English. Decided by: user.
D5. On start, explain the previous answer or the named text first. Decided by: user.
D6. One fixed order: bottom line, what to do, the points that matter, detail on request. Decided by: user.
D7. Short by default; numbers, warnings, risks and decisions are never dropped. Decided by: user.
D8. A needed term is kept and explained once; other jargon is replaced. Decided by: user.
D9. One closing line names what was left out. Decided by: user.
D10. Text saved outside the chat keeps its usual style. Decided by: user.
D11. Short follow-ups work as requests about the last answer. Decided by: user.
D12. Plain adult tone, one concrete example for an abstract idea. Decided by: user.
D13. Self-contained, with the source skills' rules rewritten and credited. Decided by: user.
D14. One file, no reference file and no script. Alternatives: a reference file (lost after compaction); a readability script (formulas reward short words over clarity). Decided by: user.
D15. At most five points in the middle part. Alternative: no cap. Decided by: agent's call. Source: the ADHD source's rule on visible list size; a list where completeness matters stays whole.
D16. Nothing is added to the original, and a contradiction is named, not resolved. Decided by: agent's call. Source: the goal of a faithful explanation.
D17. Security warnings, confirmations before irreversible actions and questions with options are written in full. Decided by: agent's call. Source: both source skills make these exceptions.
D18. `mstack-find-skills` and `mstack-setup` list the new skill, as they list the others. Decided by: agent's call.
D20. Loading the skill starts the mode, the description leaves out single-word questions, and the first answer closes with one line on how to stop. Alternative: ask before turning the mode on, which adds a question to the moment the reader is already lost. Decided by: agent's call. Source: independent read, and D2.
D21. The five-point cap never removes a warning, risk or decision. Decided by: agent's call. Source: independent read, and D7.
D22. A format that another skill or the repository requires keeps its shape; the mode changes only the words inside. Decided by: agent's call. Source: independent read.
D23. Before answering, the draft is compared with the original for numbers, warnings, risks, decisions, negations and stated uncertainty. Alternative: trust the rewrite. Decided by: agent's call. Source: research 2026-11-11 (no existing skill protects caveats; no automated fidelity check was verified).
D24. A diagram is offered only for an explanation with structure a picture shows better, by one closing question, at most once per explanation, and never again after a no. Decided by: user (2026-11-11, round 2).
D25. Without `archify` the skill is silent about diagrams. Alternative: one reminder per session. Decided by: user.
D26. The diagram shows only what the explanation said, in the reader's language, and `archify` makes it by its own steps. Decided by: user.
D27. `archify` is an optional dependency in `mstack-setup`, and its maintainers' review skill is left out. Decided by: user.
D28. The skill never installs `archify`; it names `mstack-setup` nowhere in an answer, because D25 keeps it silent, and only the setup skill offers the install. Decided by: agent's call. Source: `AGENTS.md` (every other skill names `mstack-setup` instead of installing) and D25.
D19. "Stop" also covers "normal mode" and the same request in the user's language. Decided by: agent's call.

## Risks

- The skill loads when the user only wants a normal clarification -> the description names not being able to follow an answer, and one word turns the mode off.
- Shortening loses a fact -> R5 and R8, and an eval that plants a risk in the middle of a long report.
- The simple style leaks into commits and documents -> R10 and an eval that asks for a commit message with the mode on.
- The mode fades after many turns or a compaction -> all rules are in the one file the host re-loads, and the text says the mode is on until stopped.

## Verification

- R1, R16: read the frontmatter and search the folder; the static skill check passes.
- R2, R4, R5, R6, R7, R8, R12: an eval that explains a long technical report holding exact numbers, a command and one risk in the middle, graded on the first sentence, the kept numbers, command and risk, the explained term, and the left-out line.
- R3, R11: an eval whose prompt carries an earlier turn with the mode on, then an unrelated question, then a stop request, graded on the style of the second answer and the one-line confirmation.
- R10: an eval that asks for a commit message while the mode is on, graded on the commit message's form.
- R19: the first eval plants "not tested on Windows" in the report and grades that it survives.
- R9, R20, R13, R14, R15: read against the skill's text.
- R21, R22, R23: an eval with `archify` installed that explains a six-step flow, graded on the closing question and on no diagram file existing; R22's making of the diagram and R23 are read against the skill's text, because the comparison runs cannot remove an installed skill and one run is one turn.
- R24: a unit test in `mstack-setup`'s tests for the optional row on both hosts.
- R17, R18: the two repository checks, the plugin tests, and a search for the old skill count and for every list of mstack skills.
- Not covered by a scenario: an original longer than the context can hold. Expected behavior: the skill explains what it could read and says where it stopped.

## Open questions

None, because every decision that changes what gets built is settled above.

## Appendix: interview record

- 2026-11-11 Evidence: installed skills read (the terse-voice skill, `i-have-adhd`, a skill that removes AI writing habits) / Decision: none explains a finished answer again; the first two are the adapted sources.
- 2026-11-11 Evidence: `mstack-codex-review-workflow`'s notices file / Decision: the licenses and credit form of both sources.
- 2026-11-11 Q: plugin here or local / Recommended: plugin / Decision: plugin (D1).
- 2026-11-11 Q: once, a mode, or both / Recommended: both / Decision: always a mode (D2).
- 2026-11-11 Q: full sentences or fragments / Recommended: full sentences / Decision: full sentences (D3).
- 2026-11-11 Q: which language / Recommended: the user's / Decision: the user's (D4).
- 2026-11-11 Q: explain the previous answer on start / Recommended: yes / Decision: yes (D5).
- 2026-11-11 Q: one fixed order / Recommended: yes / Decision: yes (D6).
- 2026-11-11 Q: short by default, never dropping numbers and risks / Recommended: yes / Decision: yes (D7).
- 2026-11-11 Q: explain a needed term once / Recommended: yes / Decision: yes (D8).
- 2026-11-11 Q: a closing line for what was left out / Recommended: yes / Decision: yes (D9).
- 2026-11-11 Q: leave text saved elsewhere alone / Recommended: yes / Decision: yes (D10).
- 2026-11-11 Q: short follow-ups / Recommended: yes / Decision: yes (D11).
- 2026-11-11 Q: plain adult tone with one example / Recommended: yes / Decision: yes (D12).
- 2026-11-11 Q: self-contained / Recommended: yes / Decision: yes (D13).
- 2026-11-11 Q: three test tasks / Recommended: accept / Decision: accepted.
- 2026-11-11 Q: shape A, B or C / Recommended: A / Decision: A (D14).
- 2026-11-11 Evidence: independent read by a fresh reader, three questions / Decision: all three settled without asking: D20, D21, D22 and R20.
- 2026-11-11 Evidence: deep research, 105 agents, claims verified by three-vote checks / Decision: R5 gains stated uncertainty, R19 is added (D23), and the Constraints record what the plain-language sources agree on and the licensing of the terse-voice source.
- 2026-11-11 Q: add an optional diagram through the installed diagram skill, listed in mstack-setup / Decision: requested by the user after approval; the spec returned to Draft.
- 2026-11-11 Q: when to offer, how to ask, silence without the skill, diagram content, setup tier / Recommended: as in D24 to D27 / Decision: all five accepted.
- 2026-11-11 Evidence: `archify`'s `llms.txt`, license field and installed SKILL.md / Decision: the install command and the optional tier in R24.
- 2026-11-11 Evidence: plan review 1 by Codex / Decision: the two lettered requirement ids were renumbered R19 and R20, because the plan checker ignores lettered ids; `mstack-chief-of-staff`'s route table is added to R18's lists.
