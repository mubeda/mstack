# Searching skills.sh for gaps

Read this only when `references/matching.md` left a gap. Make no online request for an item that has a match or needs no specialist.

## 1. Search

With `npx` available, search the skills.sh directory through the `skills` command. Try the most specific query first, then one broader query; add `--owner <owner>` to look at one trusted owner.

```bash
npx --yes skills find "<stack and domain words>"
npx --yes skills find "<broader words>"
```

Each result is a line `<owner>/<repo>@<skill>  <N> installs`, followed by its link `https://skills.sh/<owner>/<repo>/<skill>`. There is no JSON output.

Without `npx`, read the directory's pages with a plain HTTP client instead: `https://www.skills.sh/` (the leaderboard), `https://www.skills.sh/<owner>` and `https://www.skills.sh/<owner>/<repo>`. Never request a path under `/api/`: the site's `robots.txt` disallows it, and its documented search API needs a token a local agent does not have. Everything below comes from the public pages, which `robots.txt` allows.

If the search command or the pages fail (no network, a timeout, an error), stop the online part. Report `Online search: not run (<the error's last line>)` and never say that no public skill exists.

## 2. Vet each candidate

Read all of these before recommending a candidate:

1. **Audits.** Read the Security Audits part of the skill page `https://www.skills.sh/<owner>/<repo>/<skill>` (`curl -sSL`): one verdict per audit vendor, such as `Socket Pass` or `Snyk Fail`. Then open each vendor's page, linked from there as `https://www.skills.sh/<owner>/<repo>/<skill>/security/<vendor>`, for its risk level and categories. Report every verdict with its categories, because a pass can still list a risk such as indirect prompt injection.
   - Any fail: do not recommend the candidate. If you list it, show the failing verdict.
   - A page with no Security Audits part, a vendor page that does not load, an error, or no answer: label the candidate `not audited`, never `passed`. Audits only exist after a skill's first install, and the site answers even for a skill it does not know, so check that the page names the skill.
2. **Installs and age.** From the skill page `https://www.skills.sh/<owner>/<repo>/<skill>`: Installs and First Seen. Prefer more than 1,000 installs; be careful under 100 and with a skill first seen in the last weeks. Low counts and duplicate names in one repository are warning signs.
3. **License.** The repository's `LICENSE` file or the `license` field of the SKILL.md frontmatter. No license: do not recommend the candidate.
4. **Fit.** Read the SKILL.md itself: `npx --yes skills use <owner>/<repo>@<skill>` prints it without installing, or open it in the repository. `npx --yes skills add <owner>/<repo> -l` lists a repository's skills without installing. Recommend a skill only when its instructions fit the item, because popularity does not show fit.

Prefer official owners (the framework's own organization, anthropics, openai, vercel-labs, microsoft, github) and known authors.

## 3. Report

Keep at most two candidates per gap, best first. On the gap line, name the queries you ran, so the caller sees what was searched. For each give: source (`<owner>/<repo>`), skill name, installs, first seen, every audit verdict with categories or `not audited`, license, the skills.sh link, and the install commands from `references/install.md`.
