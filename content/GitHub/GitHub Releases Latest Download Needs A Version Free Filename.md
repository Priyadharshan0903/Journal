---
title: GitHub's Latest-Download URL Needs A Version-Free Filename
tags: [github, releases, ci-cd, distribution]
created: 2026-08-25
source: session
---

GitHub's stable "latest" download URL, `.../releases/latest/download/<filename>`, resolves to whichever release is currently marked latest, then looks for an asset with that *exact* filename inside it. If your release asset names embed the version (`myapp-v0.1.0-darwin-arm64.tar.gz`), that URL breaks the moment a newer version ships, because the new latest release has no asset by the old name.

## Why it matters

A one-line `curl -L .../releases/latest/download/myapp-darwin-arm64.tar.gz | tar -xz` install command is only actually stable across releases if the asset filename has no version in it. Naming release assets with the version baked in (a very natural instinct, and what `goreleaser`-style tooling often defaults to) silently breaks any install command that hardcodes the filename — old links 404 as soon as you cut a new release, unless callers also update the version string in the URL every time.

## Details

Verified against a real repo with two tags:

- `v0.1.0` release assets: `clw-v0.1.0-darwin-arm64.tar.gz` (version in the name)
- `v0.1.1` release (now tagged "latest") assets: `clw-darwin-arm64.tar.gz` (version dropped from the name)

```
# Versionless name, resolved against whatever is "latest" right now → 200
curl -sL -o /dev/null -w "%{http_code}\n" \
  https://github.com/<owner>/<repo>/releases/latest/download/clw-darwin-arm64.tar.gz

# Old versioned name, no longer present on the release "latest" points to → 404
curl -sL -o /dev/null -w "%{http_code}\n" \
  https://github.com/<owner>/<repo>/releases/latest/download/clw-v0.1.0-darwin-arm64.tar.gz
```

So for install one-liners meant to stay valid forever, name release assets by platform only (`myapp-<os>-<arch>.tar.gz`), and put the version inside `checksums.txt` or the release notes instead of the filename. If you need pinned-version downloads too, use the fully-qualified path (`.../releases/download/v0.1.0/<filename>`) rather than `latest/download/`.

## Related

- [[A Duplicate Env Var Appended Last Wins At Exec Time]]
- [[Orchestrating Existing Tools Beat Reimplementing Auth In ghsw]] — same pattern applied and verified end-to-end against a real published release.
