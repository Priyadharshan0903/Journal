---
title: SSH Config Resolves Each Setting To The First Matching Host Block
tags: [ssh, config, cli-design]
created: 2026-08-25
source: session
---

OpenSSH resolves `~/.ssh/config` per keyword, not per block: for a given host, each setting (`IdentityFile`, `User`, `HostName`, ...) takes whatever value the *first* matching `Host` block defines, and every later matching block only fills in whatever that first block left unset. A second `Host github.com` block further down the file does not override an earlier one's `IdentityFile` — it's silently ignored for that keyword, with nothing in normal `ssh` output flagging it.

## Why it matters

This breaks the natural assumption that config files apply top-to-bottom with later entries winning, which is how most other tools (shell rc files, most `include` mechanisms) behave. It also means "add a new `Host` block for a program-managed key" only works reliably if the new block is inserted *before* any existing block for the same host — appending it, the instinctive choice, silently does nothing if an earlier block already sets `IdentityFile`.

## Details

Two consequences worth designing around:

- A tool that manages its own `Host` block for a shared hostname (e.g. `github.com`) should **prepend** that block to `~/.ssh/config`, not append it, so its settings win regardless of what else is already in the file — and should still warn if it detects a pre-existing unmanaged block for the same host, since SSH's rule means that block's *other* settings (`ProxyCommand`, `Port`, ...) still apply even when it loses on `IdentityFile`.
- For a value that needs to change repeatedly (e.g. "which key is currently active"), point `IdentityFile` at one stable path — a symlink — and repoint *that* on every switch, rather than rewriting the `Host` block's `IdentityFile` line each time. The config file itself only needs to be touched once; every later switch is just a symlink swap, sidestepping the reinsert-before-existing-blocks problem entirely.

```
# managed block, prepended so it wins over anything appended later
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/current_key   # symlink, repointed on switch
  IdentitiesOnly yes
```

## Related

- [[Orchestrating Existing Tools Beat Reimplementing Auth In ghsw]]
