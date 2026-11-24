# Third-party notices

## Apache-2.0-licensed component

The review prompt in `references/review-prompt.md` and the form of the findings it asks for are adapted, with modifications, from the `claude` plugin of the project at https://github.com/mubeda/agent-bridges (its adversarial review prompt and its review output schema, read on 2026-11-24 at commit `9d843bf`). Every sentence was written anew, and the JSON output of the source became a plain-text form. That project is licensed under the Apache License, Version 2.0, the same license as this repository: its text is in `LICENSE` in this skill's folder.

The `LICENSE` file of that project states:

```
Copyright 2026 mubeda
```

The `NOTICE` file of its `claude` plugin states:

```
Copyright 2026 OpenAI
```

This credit is the only place in this skill that names that project. Nothing of it is read, installed or called when the skill runs.

## From this repository

`scripts/codex-dev.mjs` is adapted from the `mstack-claude-pm-codex-dev` skill of this repository, under the same license. It is not a third-party component. It runs the OpenAI Codex plugin's own script, which the user installs separately; nothing of that plugin is copied into this skill.
