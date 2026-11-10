# Rules for this repository

Every plugin lives in `plugins/<name>/` with `.claude-plugin/plugin.json` and `.codex-plugin/plugin.json` (the Codex one has `"skills": "./skills/"`). Its skill is `plugins/<name>/skills/<name>/` with `SKILL.md`, a `LICENSE` identical to the root one and a `THIRD_PARTY_NOTICES.md`. Add an entry to `.claude-plugin/marketplace.json` and `.agents/plugins/marketplace.json`, and a row to the README table. A new plugin starts at version 0.1.0, the same in all four places.

Before finishing, run `node scripts/check-plugins.mjs`. It must pass.
