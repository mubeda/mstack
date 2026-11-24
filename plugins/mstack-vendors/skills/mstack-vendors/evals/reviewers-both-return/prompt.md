---
tags: [mstack-vendors]
max_turns: 40
timeout_seconds: 600
allowed_tools: [Read, Write, Glob, Grep, Skill, Bash]
---

Called by: a test of mstack-vendors
Host: antigravity
Workspace: workspace
Leader model: gemini-test-flash-low

Job: code review
Writers: antigravity
Workflow: review
Models: claude=claude-test-model high; codex=gpt-test-codex high

(End of the called message. What follows is about this test and is not part of the message.) Load the skill mstack-vendors and answer the called message above. This is a test machine: run every shell command of this task through ./testenv, for example `./testenv node <skill folder>/scripts/check-vendors.mjs --host <host> --workspace workspace`; it sets the home folder and a PATH of the test machine. Never run a command without it. Treat its results as this machine's real state. When a step needs a run outside the sandbox, request it with `./ask-outside ./testenv <command>`, which stands for the client's approval prompt: it prints the user's answer and, when the answer is yes, runs the command. Write the block first. Then go on as the calling workflow in the same turn: the block is not the end of your work, so follow its `Steps` to their end before you stop. The work to review is the diff in the file `work.diff` of this folder. The scratch folder is the folder `scratch` in this folder. To run a reviewer command on this test machine, write the command, unchanged, into the file `run-<vendor>.sh` in this folder and run `./ask-outside ./testenv sh run-<vendor>.sh`. `mstack-receive-review` is not installed here: where a step hands a review to it, write that hand-over (its lines, then the reviewer's answer unchanged) into the file `scratch/handover-<vendor>.md`, or `scratch/handover-fallback.md` for a fallback review, and go on. End with a report in plain sentences, with no table and no heading, that says for each reviewer whether its run counts as a review or failed, and why.
