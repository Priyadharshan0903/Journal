---
title: An Unbuffered Channel Is A Rendezvous Not A Queue
tags: [go, concurrency, channels, deadlock]
created: 2026-08-19
source: session
---

An unbuffered channel holds nothing. A send blocks until another goroutine is
ready to receive, and a receive blocks until someone sends — the two goroutines
meet, hand off one value, and both continue. Each value goes to **exactly one**
receiver. A buffered channel is the queue: sends only block once the buffer is
full.

## Why it matters

The JS instinct is that a channel is a stream or a Promise, so it should be
readable by anyone, any number of times, with the value sitting there waiting.
None of that is true. A value is consumed by the first receiver and is then
gone; a second receive blocks for a value that will never come. And because
blocking is the default, a channel mistake does not raise an error you can
handle — it hangs the goroutine, and often kills the process.

```go
unbuffered := make(chan string)
go func() { unbuffered <- "handed off" }() // needs a goroutine, or it deadlocks
fmt.Println(<-unbuffered)                   // "handed off"
// <-unbuffered                             // blocks forever: nobody will send again

buffered := make(chan string, 2)
buffered <- "first"  // no goroutine needed
buffered <- "second" // buffer now full; a third send would block
fmt.Printf("len=%d cap=%d\n", len(buffered), cap(buffered)) // len=2 cap=2
```

## Details

**Closing and draining.** `close` means "no more values coming" — it is a
sender-side signal, not cleanup, and an unclosed channel leaks nothing. `range`
drains until closed, yielding values only (no index):

```go
close(buffered)
for v := range buffered { fmt.Println(v) } // first, second

v, ok := <-buffered // ok is false once closed AND drained
fmt.Printf("v=%q ok=%v\n", v, ok) // v="" ok=false
```

Closed-channel behavior splits three ways, and only one of them is benign:

| Operation on a closed channel | Result |
| --- | --- |
| receive | zero value, `ok == false` — never blocks, never panics |
| send | `panic: send on closed channel` — recoverable |
| `close` again | `panic: close of closed channel` — recoverable |

This is why the sender closes, never the receiver: only the sender knows no
further sends are coming.

**Deadlock is a fatal error, not a panic.** Block every goroutine and the
runtime kills the program outright:

```
fatal error: all goroutines are asleep - deadlock!
goroutine 1 [chan send]:
```

`recover()` cannot catch it — a `defer`/`recover` wrapped around the send never
runs, and the process exits with status 2. It is not part of the error-handling
system at all.

The detector is also narrower than it looks: it fires only when *every*
goroutine is blocked with no possible progress. A goroutine sitting in
`time.Sleep(3 * time.Second)` postpones detection for the full three seconds,
because a pending timer is future progress. Goroutines blocked in syscalls or on
network reads don't count either — which is why a hung server never reports a
deadlock and just stops responding instead. Treat the message as a lucky catch
in small programs, not a safety net in real ones.

## Related

- [[When Main Returns Go Kills Every Goroutine Mid-Flight]]
- [[Sync WaitGroup Go Skips Done When F Panics]]
- [[Go From JavaScript - Where Each Analogy Breaks]]
