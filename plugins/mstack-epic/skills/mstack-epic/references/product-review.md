# The review before approval

Read this when the document is written. Every product plan and every epic is reviewed before the user is asked to approve it. The author of a document is a poor reviewer of it. The review always runs, the user is never asked whether to run it, and it runs at most twice per document.

## Who reviews

Use the first that this host has:

1. **The cross-vendor reviewer**: a model from another vendor, when your host table names one and it is installed and logged in. The `Review:` line records the reviewer and "cross-vendor".
2. **A fresh read by your subagent tool**: a subagent with a fresh context that gets only the prompt below. The `Review:` line records "same-vendor".
3. **Your own second read**: when the host has neither, or when you cannot write files at all, read the document yourself against the checklist, one item at a time, and write down a finding for each item that fails. The `Review:` line records "same-vendor, by the author".

A same-vendor review tends to miss more than a cross-vendor one, which is why the line says which kind ran.

Before the review starts, tell the user in one line who will read the document. The document goes to that reviewer and nowhere else.

## The prompt

Write the prompt to a scratch folder outside the document's folder. (For your own second read there is no prompt file: use the instructions below as your checklist, on the text in the chat when nothing was saved.) It has three parts.

1. **Reading list.** The document's path, and the sources it names (the product plan for an epic, a brief, notes that were read). Then paste the whole of `references/product-format.md` into the prompt, because the reviewer cannot read this skill's folder and the epic's rules build on the product plan's.
2. **Instructions.**

   ```text
   You are reviewing a product document, read-only. Do not edit, create or delete any file.
   The question is one: could a developer write a specification from this document without
   asking the product decisions again? Do not judge whether the initiative, its priorities
   or its scope are right; those are the product person's decisions. If you disagree with
   one, say so in one line under "Product notes" and do not count it as a finding.

   Check:
   1. Every part the format requires is present and filled, or says "None" with a reason.
   2. A product plan: every epic has a measurable result (or "not measurable yet" with a
      reason), an in-and-out line, a size with a reason, and a place under now, next or
      later with a reason.
   3. An epic: it has acceptance statements, each a plain sentence someone can check, and
      a measurable result (or "not measurable yet" with a reason).
   4. No solution is prescribed outside the ideas part. No code, technical design, task
      list or estimate in hours or days.
   5. No two parts contradict each other.
   6. Missing evidence for the problem, more than nine epics, and epics that depend on
      each other in a circle are reported.
   7. Each open question for developers is a real unknown. A product decision the document says
      the user left open on purpose is fine; one that looks forgotten goes under "Product notes".
   ```
3. **Output format.**

   ```text
   Verdict: Ready | Ready with changes | Not ready, and one or two sentences why.
   Findings, most severe first: the part, what is missing or wrong, and the line that shows it.
   Product notes: disagreements with product decisions, one line each.
   ```

## Run it

Use the reviewer command in your host table. The working folder is the repository root inside a Git repository, and the document's folder otherwise. Write the output to the scratch folder, never beside the document.

An empty output or a failed run is never a clean review. Read the error, and when you cannot fix it, fall back to the next reviewer in the list above and say so.

## Handle the findings

These rules apply on every host. When a review-processing skill is installed, load it for rule 1, the checking of each finding, and tell it that the document is a product document, so a fix is a change to its text and never a test. Its own rule to ask the user nothing does not apply to rule 4.

1. Check each finding against the document and its sources before you accept it.
2. A finding that is wrong is rejected: log it with the line that disproves it, and change nothing.
3. A gap of fact you can close from the conversation or the sources: close it.
4. A gap only the user can close: ask it in one numbered round, with your recommendation. After the user asked to wrap up, do not ask: write it as an open question for developers or as your own call, and list it at approval.
5. Anything under "Product notes", and any finding that argues against a decision the user made, changes nothing. List it for the user at approval as a product decision.
6. Run the review a second time only when the fixes changed the epics, their order or their scope. Never a third time.
7. Update the `Review:` line with the reviewer, the kind, the round and the verdict.

## Not an approval

The review is never the user's approval, even when it says "Ready". After it, show the user the path (or, when nothing was saved, say so and point at the text you printed), a short summary, your own calls and the product notes, and ask for an explicit yes to the written document.
