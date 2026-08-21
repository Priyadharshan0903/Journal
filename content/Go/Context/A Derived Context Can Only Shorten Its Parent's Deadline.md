---
title: "A Derived Context Can Only Shorten Its Parent's Deadline"
tags: [go, context, timeouts, cancellation]
created: 2026-08-20
source: session
---

# A Derived Context Can Only Shorten Its Parent's Deadline

`context.WithTimeout(parent, d)` does not set the deadline to `d` — it sets it
to *the earlier of* `d` and whatever the parent already had. Asking for longer
than you inherited is silently ignored, and there is no API to widen a deadline.
Cancellation flows parent → child only; cancelling a child never touches its
parent.

## Why it matters

This is what makes a request budget actually hold across a call chain. An
inner-most helper can ask for a generous 5s and cannot escape the 200ms the
edge handler allotted — you get a monotonically tightening budget for free, and
no single layer can undermine it.

The corollary bites in tests and background jobs: if you find yourself wanting
a *longer* deadline than the parent, the parent is the wrong parent. Detach
deliberately with `context.WithoutCancel` (see
[[A Server Request Context Dies When ServeHTTP Returns]]) rather than hunting
for a way to extend.

## Details

A child asking for 5s under a parent with 200ms left:

```go
parent, cancelParent := context.WithTimeout(context.Background(), 200*time.Millisecond)
defer cancelParent()

child, cancelChild := context.WithTimeout(parent, 5*time.Second)
defer cancelChild()

if deadline, ok := child.Deadline(); ok {
	fmt.Printf("child asked for 5s, its real deadline is in %v\n", time.Until(deadline).Round(10*time.Millisecond))
}
start := time.Now()
<-child.Done()
fmt.Printf("child finished after %v: %v\n", time.Since(start).Round(10*time.Millisecond), child.Err())
```

Actual output (Go 1.26.5):

```
child asked for 5s, its real deadline is in 200ms
child finished after 200ms: context deadline exceeded
parent is also done: context deadline exceeded
```

Note `child.Deadline()` reports **200ms**, not 5s — the truncation is visible
through the API, not just in the timing.

### `defer cancel()` is not optional

Every `WithCancel` / `WithTimeout` / `WithDeadline` returns a `cancel` you must
call, including on the path where the timeout already fired. `cancel` unlinks
the child from its parent and releases the timer; skipping it leaks both until
the parent itself is done — which for a long-lived parent means "never".

```go
ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
defer cancel() // releases the timer AND unlinks from the parent
```

`go vet` catches the common cases via its `lostcancel` check, so
`go vet ./...` is the cheap guard here.

## Related

- [[Context Cancellation Is Cooperative Not Preemptive]]
- [[A Server Request Context Dies When ServeHTTP Returns]]
- [[Err Tells You A Context Was Canceled, Cause Tells You Why]]
