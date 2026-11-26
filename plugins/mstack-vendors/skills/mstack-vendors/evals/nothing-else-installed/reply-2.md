Called by: a test of mstack-vendors
Host: antigravity
Workspace: workspace
Leader model: gemini-test-flash-low

Job: code review
Writers: antigravity
Workflow: review
Models: claude=claude-test-model high; codex=gpt-test-codex high

Job: developer
Models: claude=claude-test-model high; codex=gpt-test-codex high

(End of the called message. What follows is about this test and is not part of the message.) Answer the called message above with the skill mstack-vendors, as a new call. This is a test machine: run every shell command of this task through ./testenv, for example `./testenv node <skill folder>/scripts/check-vendors.mjs --host <host> --workspace workspace`; it sets the home folder and a PATH of the test machine. Never run a command without it. Treat its results as this machine's real state. When a step needs a run outside the sandbox, request it with `./ask-outside ./testenv <command>`, which stands for the client's approval prompt: it prints the user's answer and, when the answer is yes, runs the command.
