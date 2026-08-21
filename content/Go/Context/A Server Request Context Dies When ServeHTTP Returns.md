---
title: "A Server Request Context Dies When ServeHTTP Returns"
tags: [go, context, net-http, concurrency, cancellation]
created: 2026-08-20
source: session
---

# A Server Request Context Dies When ServeHTTP Returns

For an incoming server request, `r.Context()` is canceled on **three** events,
not one: the client's connection closes, the request is canceled (HTTP/2), *or
`ServeHTTP` returns*. That third clause is the one that surprises people — it
means any goroutine you launch from a handler and leave running has its context
killed the instant you respond.

## Why it matters

The classic bug is fire-and-forget background work:

```go
func Handler(w http.ResponseWriter, r *http.Request) {
	go auditLog(r.Context(), event) // ✗ ctx is dead before this gets going
	w.WriteHeader(http.StatusAccepted)
}
```

The handler returns immediately, `r.Context()` is canceled, and `auditLog`
either aborts or — worse — writes half its work. Failures are load-dependent
and nearly impossible to reproduce locally, because whether the goroutine gets
far enough before cancellation is pure scheduling luck.

Note this also means a handler's context is *not* a reliable "client is still
there" signal after you've responded, and that spawned work inherits a deadline
you probably didn't intend. Since cancellation is only ever advisory
([[Context Cancellation Is Cooperative Not Preemptive]]), the goroutine isn't
killed — it just starts failing its ctx-aware calls.

## Details

The fix is `context.WithoutCancel` (Go 1.21+): it keeps the parent's **values**
— trace IDs, request IDs, auth subject — while dropping cancellation and
deadline.

```go
func Handler(w http.ResponseWriter, r *http.Request) {
	// Values survive; cancellation does not.
	bg := context.WithoutCancel(r.Context())

	// Detached work still needs its own bound, or it can hang forever.
	bg, cancel := context.WithTimeout(bg, 5*time.Second)

	go func() {
		defer cancel()
		auditLog(bg, event)
	}()

	w.WriteHeader(http.StatusAccepted)
}
```

Verified behaviour (Go 1.26.5) — the parent is canceled, the derived context is
not, and it can still carry its own fresh deadline:

```
original ctx.Err() = context canceled
detached ctx.Err() = <nil> (still usable)
detached flush has its own deadline in 500ms
```

`WithoutCancel` returns a context whose `Done()` channel is `nil` and whose
`Deadline()` reports nothing — which is exactly why layering your own
`WithTimeout` on top is not optional. An unbounded detached goroutine is a leak
waiting for a slow dependency.

### Reading the doc clause directly

```
$ go doc net/http.Request.Context
For incoming server requests, the context is canceled when the client's
connection closes, the request is canceled (with HTTP/2), or when the
ServeHTTP method returns.
```

For *outgoing client* requests the same context means something different — it
controls cancellation of the request you are making. Same accessor, opposite
direction.

## Related

- [[Context Cancellation Is Cooperative Not Preemptive]]
- [[A Derived Context Can Only Shorten Its Parent's Deadline]]
- [[Err Tells You A Context Was Canceled, Cause Tells You Why]]
- [[WithValue Needs An Unexported Key Type]]
- [[Go Function Types Match Exactly - http.Request Is Not A *http.Request]]
