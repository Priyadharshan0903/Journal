---
title: gopls Tracks A Workspace Folder By Its Exact-Case Path Even On macOS
tags: [go, gopls, vscode, macos, tooling]
created: 2026-08-25
source: session
---

gopls resolves a file's module by comparing the workspace folder's URI as a case-sensitive string, even though the underlying filesystem (APFS) is case-insensitive but case-preserving. If any tool ever addresses the same project directory using a different case than the one VSCode registered as the workspace root, gopls sees two different roots and reports the file's real module as "not included in your workspace" — despite `go build`, `go vet`, and `gofmt` all passing cleanly on the exact same files.

## Why it matters

The diagnostic text names a module path that looks identical to the real one at a glance, so the instinct is to suspect a broken `go.mod`, a missing `go.work`, or a multi-module workspace conflict — none of which is the actual cause. The compiler is oblivious to the whole problem because build tooling resolves paths through the filesystem, not by comparing URI strings the way an editor's language server does. On macOS specifically, every tool that ever touches the project via a differently-cased path — a shell `cd`, a script, an agent's file operations — writes that casing into VSCode's own state (`workspaceStorage/*/state.vscdb`), even though every read and write lands on the identical inode.

## Details

Evidence trail that confirmed the cause rather than guessed at it:

- gopls diagnostic: `This file is within module ".../desktop/Projects/..." which is not included in your workspace.` (lowercase `desktop`)
- The workspace's own `workspace.json`: `"folder": "file:///Users/.../Desktop/Projects/..."` (capital `D`)
- `state.vscdb` (readable with `strings`) showed one open tab's `resourceJSON.fsPath` using lowercase `desktop` alongside a separate `preferredResourceJSON` for the *same file* using capital `D` — two casings for one file, both live in the editor's state simultaneously.

Fix: close and reopen the affected tab from the Explorer sidebar (not however it originally got opened), then run "Go: Restart Language Server"; if diagnostics persist, "Developer: Reload Window" clears cached URIs entirely. Prevention: always address a project's files using the exact case its VSCode workspace root was opened with — don't let a shell session drift to a different-cased `cd` path mid-project.

## Related

- [[Case-Only Jenkinsfile Renames Are Invisible On macOS]] — a different tool (git/Jenkins vs. gopls/VSCode), the same underlying macOS case-insensitive-but-preserving mechanism.
