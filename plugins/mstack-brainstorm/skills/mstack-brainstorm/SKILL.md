---
name: mstack-brainstorm
description: Use when the user asks to brainstorm, think an idea through, or explore what to build, or brings a rough idea whose goal or reason is not stated yet ("add notifications", "something for onboarding", "I have an idea for an app"), or asks for ideas or options ("give me ideas for X", "what could we do about Y"), in software or outside it. Works in Claude Code and Codex. Produces a design brief the user approved, ready for mstack-write-specs.
---

# mstack brainstorm

Find out what the user wants and why before anything is built, then agree how it gets built, and end with a design brief the user approved. The user knows the goal better than you do, even when they have not said it yet; your job is to help them say it, and to settle the many small choices they will never raise in the way they would settle them. This skill writes a brief. It never builds what the brief describes.

## Using this skill in Claude Code and Codex

This file is the same for both hosts. It never names a host tool outside the table below. Where it says "your question tool" or "your subagent tool", use the host's equivalent.

| This file says | Claude Code | Codex |
|---|---|---|
| your question tool | `AskUserQuestion` for a short choice; a numbered round in chat for longer ones | A numbered round in chat, then wait for the answer |
| your subagent tool | `Agent` with a fresh context, `model` and `effort` set | A separate read-only `codex exec` run with `-m` and `model_reasoning_effort` set, or the session's agent tool if it has one |
| loading a skill | The Skill tool | Read the skill's SKILL.md and follow it |
| the user skill folders | `~/.claude/skills/`, `~/.agents/skills/` and the plugin cache `~/.claude/plugins/cache/`, but only under a plugin that `claude plugin list` shows as installed, because the cache keeps leftover copies (`CLAUDE_CONFIG_DIR` replaces `~/.claude`) | `~/.codex/skills/`, `~/.agents/skills/` and the plugin cache `~/.codex/plugins/cache/`, but only under a plugin that Codex has enabled in its `config.toml` (`CODEX_HOME` replaces `~/.codex`) |

Refer to the files below by their path inside this skill's folder.

## Required skill, first

Before the first question, check `mstack-best-model-for`, which gives the model of the builder check.

1. It is in this session's skill list (as `mstack-best-model-for` or `<plugin>:mstack-best-model-for`): continue.
2. Its folder exists on disk (in the user skill folders the host table names) but the session has not loaded it: say that a new session is needed, and stop.
3. Otherwise print this and stop, with no question asked and no subagent started:

   ```text
   mstack-brainstorm needs mstack-best-model-for, which is not installed.
   Claude Code: claude plugin marketplace add mubeda/mstack, then claude plugin install mstack-best-model-for@mstack
   Codex:       codex plugin marketplace add mubeda/mstack, then codex plugin add mstack-best-model-for@mstack
   Skills CLI:  npx skills add mubeda/mstack --skill mstack-best-model-for -g -a <claude-code|codex> -y
   Or install mstack-setup the same way and run it: it installs everything the mstack skills need.
   Then start a new session.
   ```

There is no built-in fallback. When the check passes, load `mstack-best-model-for` in called mode once, before the builder check: say that `mstack-brainstorm` is calling, and ask for this host's vendor (`claude` in Claude Code, `codex` in Codex) and the tier `standard`.

## Ground rules

1. **Nothing is built before the brief is approved.** No product code, scaffolding, dependency install or implementation skill until the user explicitly approved the written brief. Two exceptions: the user opted out of the conversation, or the user said yes to a throwaway prototype (below).
2. **Facts are yours to find, decisions are the user's.** Ask only what the answer would change and nothing the request, the repository or a tool already answers. Process steps (where a file goes, what to read, how to show something) are your calls: make them and say so.
3. **Mark what you filled in.** Anything you assumed is your proposal, with its reason, never something the user said. In the brief it goes under the agent's calls.
4. **Plain language.** Use the user's words, not process jargon, and never explain this skill's process to the user.

## When to start, and when to step aside

- **Start** when the user asks to brainstorm, or brings a request whose goal or reason is not stated. Start the conversation before any building.
- **Step aside** when the request already says everything needed to do it ("make the save button say Save changes"). Ask no interview question. Say in one line that no brainstorm is needed, and go on with the request through the normal workflow.
- **Ideas mode** when the user asks for ideas or options instead of bringing an idea of their own: follow `references/ideas.md`. It ends either in a picked idea, which continues in the default mode below, or in a question about what was missing.

## The default mode

### 1. Read before you ask

In a repository, or with material the user pointed at (a file, a spec, an issue, earlier conversation), read what they referred to and what it connects to before your first message. Read on until you could explain the parts involved, how they behave now, and which of them the request would change. Never ask what that material answers, such as the language or the test command a project's instructions name.

### 2. The first message

Send one message that:

1. restates the request in your own words (what, for whom, why, as far as the user said);
2. says what your reading turned up that matters for it, including anything that may change the request (a constraint, a conflict, a cheaper path);
3. ends with exactly one question, and says what the answer would change.

No list of questions, and no description of how this conversation will go. One exception: when the request already states why the user wants it and leaves open decisions with choices you can name, the message ends with the numbered round of step 4 instead of a single question, because the open question of step 3 is already answered. When the user did not ask to brainstorm (they brought an idea, they did not ask for a conversation), add one line offering to skip the questions, for example "If you would prefer to skip the questions, tell me and I will start right away."

When the user takes that offer, or says at any point to skip the questions and just do it: say the brainstorm is over, state any significant choice about how it gets made (platform, language, medium) in one line, and go on through the normal workflow.

### 3. Open questions until the reason is known

While you do not know why the user wants the thing, ask one open question per message, in their terms, with no example answers and no options attached. A menu of options steers the answer; the user's own description shows what they mean. Let each question follow from the user's previous reply or from something your reading turned up.

### 4. Numbered rounds once choices have names

Once the reason is known, treat the open decisions as a **design tree**: each decision opens the decisions that hang off it. The **frontier** is every open decision whose prerequisites are already settled.

1. Ask the whole frontier together in one numbered round, in your question tool. Each question carries your recommendation and its reason, worded so that a plain yes accepts it. A question that depends on another open question is not on the frontier yet, so it waits for a later round.
2. After each answer, work the frontier out again from the start: a settled decision opens the ones that hung off it, and a later answer that changes an earlier one reopens that branch.
3. Facts are never on the frontier. When a decision needs a fact (what the code does today, what a file says), look it up yourself, with a subagent when it takes a while, and keep asking the questions that do not wait on it.
4. When the user hands a choice back ("you decide"), make a specific proposal and mark it as your call.
5. The interview ends once no open decision is left on the frontier, each branch of the tree was walked, and no choice rests on a silent assumption. Ask the user to confirm the shared understanding before the approaches message.

### 5. Play it back

Once one part is clear to you (who it serves, what one piece does), play that part back in 300 words or fewer. Only what the user said goes in as theirs; what you filled in appears as your proposal with its reason ("I assumed email, because the app already sends receipts that way"). End with a question asking what is wrong or missing. Playback and questions alternate until every part is covered.

### 6. Offer a throwaway prototype when looking beats talking

When a question is about how something looks or feels, or a short run would answer it faster than a discussion, offer a throwaway prototype in one line. Build it only after a yes, in a scratch folder outside the repository, and bring what it showed back into the conversation. When the prototype is a screen or a page and `mstack-find-skills` is in the session's skill list, load it in called mode: say that `mstack-brainstorm` is calling, and give the prototype as the one work item. Load the first installed skill its result lists for that item, and ignore its public candidates: nothing is installed here. Without `mstack-find-skills`, or when it lists no installed skill, build the prototype without one. Say which skill you used. When the user declines, build nothing and do not offer it again unless they raise it. A request to keep building on the prototype is a new request that needs an approved brief.

### 7. Approaches, in a separate message

When you understand what the user wants, and before writing anything up, send the approaches in a separate message that holds nothing else:

1. Think of several real alternatives that differ in their whole shape (where the thing lives, what owns it, how it is reached), not variants of one shape, and drop the ones the existing work rules out or that work against the user's reason.
2. Lay out the two or three that remain, each concretely enough to picture and with what it trades off. Where the subject is something code or people call (a library, an interface, a command), show for each approach how a caller would use it: the call, the command line and what they would see.
3. Recommend one with its reason, and ask which way to go. When the existing work rules out all but one, say there is one sensible way and why the others do not fit; do not invent variants to reach a count.
4. Wait for the pick. Write no brief before it, unless the user handed you the choice, which you then record as your call.

### 8. Size the work

Size it as a **small change** (one behavior in one component that fits one working session) or a **project** (anything larger). Say the size in one line; the user can override it.

## The brief

1. Write the brief from `references/brief-template.md`: its opening lines, the eight parts in order, its rule for the agent's calls, and where the file goes. For a small change, every part gets one or two lines. Never commit it.
2. For a project, run the builder check in `references/builder-check.md` before asking for approval, with a subagent on the standard tier's model and effort.
3. For software, screen the picked approach with `references/design-red-flags.md` and record each flag found.
4. Show the path, a short summary, and every agent's call, and ask the user to approve that file.

## The approval gate

Approval is the user's explicit yes to the written brief at its path, given after they could read it. None of these count: agreement with the idea, a playback or an approach ("sounds good" before the brief exists means: write the brief, then ask); silence; the builder check's report; "whatever you think". On approval, set the Status line as the template says. Any later edit sets it back to Draft until the user approves again.

## The hand-off

After approval, offer the next step and take it only on the user's go. Until then, start no spec, plan or code.

- **A project:** offer `mstack-write-specs` with the brief's path as its source. When it is in the session's skill list and the user accepts, load it and give it that path. When it is not installed, name it and `mstack-setup` as the way to install it, offer to stop here, and install nothing.
- **A small change:** say that no spec is needed, and offer to go straight to the work through the normal workflow.
- Either way, the user may also stop with the brief.
