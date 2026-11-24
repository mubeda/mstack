---
tags: [mstack-vendors]
max_turns: 60
timeout_seconds: 600
allowed_tools: [Read, Write, Glob, Grep, Skill, Bash]
---

Called by: a test of mstack-vendors
Host: codex
Workspace: workspace

Job: developer
Models: claude=claude-test-model high

(End of the called message. What follows is about this test and is not part of the message.) Load the skill mstack-vendors and answer the called message above. This is a test machine: run every shell command of this task through ./testenv, for example `./testenv node <skill folder>/scripts/check-vendors.mjs --host <host> --workspace workspace`; it sets the home folder and a PATH of the test machine. Never run a command without it. Treat its results as this machine's real state. Write the block first. Then go on as the calling dev workflow in the same turn: the block is not the end of your work, so follow its `Steps` to their end before you stop. You may commit in the workspace. The developer's task: add a function `sub` to calc.mjs. The plan folder of the work is `workspace/docs/plan`. The scratch folder is the folder `scratch` in this folder; give every file of the steps as an absolute path. To run a developer command on this test machine, write it, with every name filled, into the file `dev-<round>.sh` in the folder that `pwd` prints, which holds `testenv` (its parent folder is not writable) and run it as `./testenv sh dev-<round>.sh`.  End with a report in plain sentences, with no table and no heading.
