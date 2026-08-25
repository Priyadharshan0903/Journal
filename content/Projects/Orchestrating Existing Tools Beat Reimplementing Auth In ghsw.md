---
title: Orchestrating Existing Tools Beat Reimplementing Auth In ghsw
tags: [projects, ghsw, go, cli-design]
created: 2026-08-25
source: https://github.com/Priyadharshan0903/Git-Switcher/releases/tag/v0.0.1
---

`ghsw` — a Go CLI that switches machine-wide GitHub identities — deliberately owns none of the hard parts: no OAuth flow, no credential storage, no SSH key generation. It orchestrates three already-correct, already-hardened mechanisms (`gh auth switch`, git's global config plus `includeIf`, and an SSH `IdentityFile` symlink indirection) behind one command. That scope discipline is why the whole tool stayed under a handful of small `internal/` packages with ~62 tests, and why it shipped as a real tagged release (`v0.0.1`) rather than stalling on edge cases — there was almost nothing project-specific left to get wrong.

## Why it matters

The instinct when building a "switcher" tool is to model the domain yourself — store credentials, manage keys, reimplement precedence rules. Every one of those is a place a security or correctness bug can hide, and every one of them is a solved problem in the tool it would be duplicating. Treating the CLI's job as *coordination* rather than *implementation* — call the existing tool, read its real output, shell out rather than reimplement — kept the surface area small enough that the actual bugs found during the build were shallow, mechanical ones (an argument-parsing order issue, a symlink permission fallback for Windows) instead of deep logic errors in a home-grown auth system.

The other recurring pattern across the build: **verify against the live system, not against assumptions**. Every non-trivial claim in this project got checked against something real before being trusted — the actual `flag.Parse` behavior via a failing smoke test, SSH's actual precedence rules before choosing prepend-vs-append, the real GitHub API for commit attribution and release assets, and the actual published `v0.0.1` binaries downloaded and run end-to-end (including checksum verification) rather than assumed to work from the workflow YAML alone.

## Details

Concrete learnings this build produced, each now its own note:

- **Args before flags silently lost their values.** `ghsw add work --key ... --dir ...` (name before flags, the natural way to type it) parsed as if the flags were never given, because of how Go's `flag` package scans — [[Go Flag Parse Stops At The First Non-Flag Argument|flag.Parse stops at the first non-flag argument]]. Caught by actually running the built binary against a fake `$HOME`, not by reading the code.
- **The SSH global-switch design depended on precedence rules that aren't obvious from the man page** — [[SSH Config Resolves Each Setting To The First Matching Host Block]] — which is why the managed `Host github.com` block gets *prepended*, not appended, and why switching accounts repoints a symlink instead of rewriting `IdentityFile` on every `ghsw use`.
- **Phantom "undefined" errors in the editor turned out to be gopls, not the code** — [[Gopls Tracks A Workspace Folder By Its Exact-Case Path Even On macOS]]. `go build`/`go vet`/`gofmt` all passing cleanly was the signal that the IDE, not the source, needed fixing.
- **Release assets were deliberately named without a version** so `/releases/latest/download/...` stays valid forever — [[GitHub Releases Latest Download Needs A Version Free Filename|GitHub's Latest-Download URL Needs A Version-Free Filename]] — and that, plus the whole download → checksum-verify → extract → run flow, was tested against the real `v0.0.1` release rather than only the workflow YAML.
- **A "why don't I show up as a contributor" question** surfaced an unrelated but useful fact — [[GitHub Only Attributes A Commit To Your Account Via A Verified Email]] — found by querying the live GitHub API rather than guessing from the UI.

Known gaps, left as deliberate scope cuts rather than oversights: no Windows binary in the release (dropped to match a provided workflow template), and the `gh`/`git` shell-outs themselves are untested in CI since they need a real authenticated `gh` install — only the pure parsing/config-building logic around them has table-driven tests.

## Related

- [[Go Flag Parse Stops At The First Non-Flag Argument|flag.Parse stops at the first non-flag argument]]
- [[SSH Config Resolves Each Setting To The First Matching Host Block]]
- [[Gopls Tracks A Workspace Folder By Its Exact-Case Path Even On macOS]]
- [[GitHub Releases Latest Download Needs A Version Free Filename|GitHub's Latest-Download URL Needs A Version-Free Filename]]
- [[GitHub Only Attributes A Commit To Your Account Via A Verified Email]]
