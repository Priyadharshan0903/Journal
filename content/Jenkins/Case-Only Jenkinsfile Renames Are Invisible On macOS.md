---
title: Case-Only Jenkinsfile Renames Are Invisible On macOS
tags: [jenkins, git, macos, ci-cd]
created: 2026-08-19
source: session
---

Git records a path with its exact case, but APFS and HFS+ are case-insensitive. A file committed as `jenkinsfile` when the Jenkins job expects `Jenkinsfile` therefore looks completely correct in the local working tree, and fails only once a case-sensitive Linux agent checks the repository out. Renaming the file in Finder or with plain `mv` does not fix it — git treats the rename as a no-op.

## Why it matters

The build fails with a "script not found" error that points at the job's SCM configuration and its Script Path field, while `ls` locally shows the file sitting exactly where it should be. The evidence directs the search at the Jenkins config, which is not where the defect is. The same trap applies to any case-sensitive path in a pipeline, not just the Jenkinsfile — directory names in a Script Path such as `HelloWorld/Scripts/Jenkinsfile` fail identically.

## Details

Git's own explanation of the behavior, from `git help config`:

> `core.ignoreCase` — Internal variable which enables various workarounds to enable Git to work better on filesystems that are not case sensitive, like APFS, HFS+, FAT, NTFS, etc. For example, if a directory listing finds "makefile" when Git expects "Makefile", Git will assume it is really the same file, and continue to remember it as "Makefile".

The default is `false`, but `git init` and `git clone` "probe and set `core.ignoreCase` true if appropriate when the repository is created" — so every repository created on a Mac has it enabled without the author ever choosing it.

Diagnose:

```sh
git config --get core.ignoreCase   # true on a Mac-created repo
git ls-files | grep -i jenkinsfile # shows the case git actually tracks
```

`git ls-files` is the authoritative check: it reports the case in the index, which is what the Linux agent receives. A directory listing does not.

Fix — use `git mv`, which stages the change as a real rename even though the filesystem considers both names to be the same file:

```sh
git mv jenkinsfile Jenkinsfile
git status --short   # R  jenkinsfile -> Jenkinsfile
```

Renaming through Finder or plain `mv` produces an empty `git status`: the working tree looks fixed while the index still holds the old case, so the next push changes nothing. Verified on git 2.50.1, where `git mv` needs no `-f`; if an older git refuses with `fatal: destination exists`, rename through a temporary name in two steps.

Commit `a93cf02` in the `Jenkins-Learning` repository is this exact fix in the wild: `R100  jenkinsfile → Jenkinsfile`, zero insertions and zero deletions. A commit whose entire diff is a capital letter.

## Related

- [[Jenkins tools Binds An Installation Name Not A Version]]
- [[Git Preserves Case That The Filesystem Does Not]]
