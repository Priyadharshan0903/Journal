---
title: "Err Tells You A Context Was Canceled, Cause Tells You Why"
tags: [go, context, errors, observability]
created: 2026-08-20
source: session
---

# Err Tells You A Context Was Canceled, Cause Tells You Why

`ctx.Err()` only ever returns one of two sentinels — `context.Canceled` or
`context.DeadlineExceeded` — so it can tell you *that* a context ended but never
*why*. `context.WithCancelCause` + `context.Cause(ctx)` (Go 1.20+) carry the
real error through, which is what a log line actually needs.

## Why it matters

Branching on the two sentinels is a real decision point, not bookkeeping. In an
HTTP handler they mean opposite things:

- `context.DeadlineExceeded` — *our* budget ran out and the client is still
  waiting. Return a status; the response will be read.
- `context.Canceled` — the client hung up. Nobody will read anything you write,
  so log it and abandon the work.

And `context.Canceled` as a log line is almost worthless on its own: "context
canceled" tells an on-call engineer nothing about which upstream failed.
`Cause` is how the reason survives the trip up the stack.

## Details

```go
errUpstream := errors.New("upstream billing service returned 503")

ctx, cancel := context.WithCancelCause(context.Background()) // cancel takes an error
go func() {
	time.Sleep(100 * time.Millisecond)
	cancel(errUpstream)
}()

<-ctx.Done()
fmt.Println(ctx.Err())                                  // the sentinel
fmt.Println(context.Cause(ctx))                         // the real reason
fmt.Println(errors.Is(context.Cause(ctx), errUpstream))  // works with errors.Is
```

Actual output (Go 1.26.5):

```
ctx.Err()          = context canceled
context.Cause(ctx) = upstream billing service returned 503
errors.Is(cause, errUpstream) = true
is Canceled? true | is DeadlineExceeded? false
```

`Cause` falls back to `Err()` when no cause was set, so it is safe to log
unconditionally — reach for `context.Cause(ctx)` over `ctx.Err()` by default.

### Branching in a handler

```go
case <-ctx.Done():
	if errors.Is(ctx.Err(), context.Canceled) {
		log.Printf("client disconnected after %v; abandoning request", time.Since(start))
		return // no point writing to a dead connection
	}
	http.Error(w, "Request Context Timeout", http.StatusGatewayTimeout)
```

Observed on a real request pair: a client that waited produced
`upstream exceeded budget after 2.001s: context deadline exceeded` and a 504,
while `curl --max-time 0.5` produced
`client disconnected after 506ms; abandoning request` and no write at all.

Note the status code: **504 Gateway Timeout** is the right answer when an
upstream you called was too slow. **408 Request Timeout** means the *client*
took too long to send its request, which is a different failure.

### Related API surface

- `context.WithDeadlineCause(parent, d, cause)` — attach a cause to a deadline.
- `context.AfterFunc(ctx, f)` — run `f` in its own goroutine once `ctx` ends;
  returns a `stop func() bool` to unregister.

## Related

- [[Context Cancellation Is Cooperative Not Preemptive]]
- [[A Derived Context Can Only Shorten Its Parent's Deadline]]
- [[A Server Request Context Dies When ServeHTTP Returns]]
