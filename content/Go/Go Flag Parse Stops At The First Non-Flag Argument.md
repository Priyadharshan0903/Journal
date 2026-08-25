---
title: flag.Parse stops at the first non-flag argument
tags: [go, cli, flag, stdlib]
created: 2026-08-25
source: session
---

Go's stdlib `flag` package does not permute arguments the way `getopt` does. `flag.Parse` scans left to right and stops the instant it hits a token that isn't a recognized flag — everything after that, including any later `--flag value`, is dumped into `Args()` unparsed rather than being found and consumed.

## Why it matters

A CLI usage form like `mytool add <name> [--email <email>]` — flag *after* the positional argument, which reads naturally and is what most people type — silently fails to populate the flag. No error, no panic: the flag variable just keeps its zero value, because `Parse` gave up scanning as soon as it saw `<name>` and never reached `--email` at all. This surfaced as a real bug: `clw add work --email me@work.com` saved an empty email to the registry, with no indication anything had gone wrong.

## Details

```go
fs := flag.NewFlagSet("add", flag.ContinueOnError)
email := fs.String("email", "", "")
fs.Parse([]string{"work", "--email", "me@work.com"})
// fs.NArg() == 3, fs.Args() == ["work", "--email", "me@work.com"]
// *email == "" — never parsed, because "work" (non-flag) came first
```

Putting the flag first works fine (`--email me@work.com work`), but that's not the order most CLI docs and muscle memory expect. Fixes:

- Document and enforce flags-before-positional-args (`mytool add --email <email> <name>`), or
- Hand-roll the split: walk `os.Args`, pull out recognized `--flag`/`--flag=value`/boolean-flag tokens from anywhere in the slice, and treat whatever's left as positional. A few lines of manual parsing, but it matches the usage order users actually type.

## Related

- [[A Duplicate Env Var Appended Last Wins At Exec Time]]
- [[Orchestrating Existing Tools Beat Reimplementing Auth In ghsw]] — the same bug, independently hit and fixed while building `ghsw`.
