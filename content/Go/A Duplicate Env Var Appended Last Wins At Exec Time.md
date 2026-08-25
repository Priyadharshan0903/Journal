---
title: A duplicate environment variable appended last wins at exec time
tags: [go, unix, exec, environment-variables]
created: 2026-08-25
source: session
---

To override one environment variable while keeping the rest of the parent's environment, it's safe to just append a duplicate key to `os.Environ()` rather than filtering the old one out first: `append(os.Environ(), "FOO=new")` and hand that slice straight to `syscall.Exec` or `exec.Cmd.Env`. The last occurrence of a duplicate key in the envp array is the one every layer — shell, Python, Node, Go's own `os.Getenv` — resolves to.

## Why it matters

The instinct is that this is unsafe or undefined — "what if the child just sees the first one and ignores my override?" It's a reasonable worry, since raw `execve` does pass the *entire* envp array through unmodified, duplicates and all; nothing in the syscall itself deduplicates. But every layer built on top of it (`getenv(3)`, Go's `os.Getenv`, Python's `os.environ`, Node's `process.env`) resolves duplicate keys the same way: last one wins. Skipping the override-safety filtering step is one less thing to get wrong when a CLI tool re-execs another binary with one env var changed (e.g. `CLAUDE_CONFIG_DIR` to point a wrapped `claude` invocation at a different config directory).

## Details

Verified empirically: exec a child with `FOO=first` then `FOO=second` both present in envp, and check what different consumers report.

```go
env := append(os.Environ(), "FOO=first", "FOO=second")
syscall.Exec("/bin/sh", []string{"/bin/sh", "-c", `echo $FOO`}, env)
```

Raw envp listing (`/usr/bin/env` with no args) shows **both** entries, confirming `execve` doesn't dedupe:

```
FOO=first
FOO=second
```

But every getenv-style consumer downstream picks the last one:

```
sh:     $FOO      -> second
libc:   printenv  -> second
python: os.environ['FOO'] -> second
node:   process.env.FOO   -> second
```

So `append(os.Environ(), "KEY="+newValue)` is a correct, sufficient override — no need to build a new slice that filters out the old `KEY=` entry first.

## Related

- [[Go Flag Parse Stops At The First Non-Flag Argument]]
