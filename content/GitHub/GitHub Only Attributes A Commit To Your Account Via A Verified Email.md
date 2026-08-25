---
title: GitHub Only Attributes A Commit To Your Account Via A Verified Email
tags: [github, git, contributions]
created: 2026-08-25
source: session
---

GitHub links a commit to a user's profile — avatar in the commit list, a square on the contribution graph, a count in the Contributors sidebar — only when the commit's git author email exactly matches an email verified on that GitHub account. A commit made while `git config user.email` was set to an unverified address (a work domain, an old Gmail never added to the account) shows up in history with a plain name and no avatar, and doesn't count anywhere, even though `git log` clearly shows the right name as the author.

## Why it matters

A repo can look like it has "no contributors" or a suspiciously sparse contribution graph purely because of git config drift across machines or sessions, with the commits themselves perfectly intact and correctly authored by the same person. It's easy to misread this as a GitHub bug or a broken repo rather than an identity-matching detail.

## Details

Verified on a real repo (`Priyadharshan0903/Git-Switcher`) via `gh api repos/{owner}/{repo}/commits`: 3 of 4 commits had `author.login: null` because their git email (`priyadharshan@gmail.com`, and a corporate `@....celonis.cloud` address) had never been added and verified on the account; only the commit made with the verified `priyadharshansenthil@gmail.com` linked correctly. Fix: add and verify the missing email under GitHub Settings → Emails — GitHub retroactively re-attributes existing commits once the email is verified, no history rewrite needed.

A separate, compounding quirk hit at the same time: the sidebar's Contributors widget and the Insights → Contributors graph are both backed by `GET /repos/{owner}/{repo}/stats/contributors`, which computes **asynchronously**. The first request against a repo without cached stats returns empty (triggering background computation); a follow-up request shortly after returns the real data. So a brand-new repo can show "No contributors" purely from the stats job not having run yet, independent of the email-attribution issue above — worth ruling out before assuming a repo has an actual attribution problem.

```sh
gh api repos/OWNER/REPO/commits --jq '.[] | {sha: .sha[0:7], login: .author.login, email: .commit.author.email}'
gh api repos/OWNER/REPO/stats/contributors   # may return {} on first call; retry
```

## Related

- [[GitHub Releases Latest Download Needs A Version Free Filename|GitHub's Latest-Download URL Needs A Version-Free Filename]]
- [[Orchestrating Existing Tools Beat Reimplementing Auth In ghsw]]
