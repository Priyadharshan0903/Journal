---
title: "Context Cancellation Is Cooperative, Not Preemptive"
tags: [go, context, concurrency, cancellation]
created: 2026-08-20
source: session
---

# Context Cancellation Is Cooperative, Not Preemptive

Closing `ctx.Done()` stops nothing. It is a broadcast that *asks* goroutines to
wind up; a goroutine that never checks it runs to completion, holding its
locks, connections and memory the whole way. A context deadline is therefore a
promise the **callee** has to keep, not one the runtime enforces.

## Why it matters

`context.WithTimeout(ctx, 2*time.Second)` reads like a kill switch and isn't
one. Two things break when this is misread:

- **Timeouts silently do not apply.** A handler that returns 504 after 2s while
  its worker goroutine keeps running for 30s hasn't bounded anything — it has
  bounded *the response* and leaked the work. Under load that's how a service
  ends up with more in-flight work than it has concurrency limits for.
- **Every blocking call needs a ctx-aware variant.** `time.Sleep` cannot be
  cancelled; `select` on `time.After` can. `db.Query` cannot; `db.QueryContext`
  can. The rule is: if a call can block and doesn't take a `ctx`, it is a hole
  in your cancellation story.

Go has no goroutine kill primitive at all — this is the same underlying fact as
[[When Main Returns Go Kills Every Goroutine Mid-Flight]], seen from the other
side. `main` returning is the *only* thing that stops a goroutine you didn't
write cooperatively, and it doesn't let it clean up.

## Details

Two workers, one 300ms deadline. The deaf one ignores `ctx`:

```go
ctx, cancel := context.WithTimeout(context.Background(), 300*time.Millisecond)
defer cancel()

go func() { // deaf: no ctx check anywhere
	for i := 1; i <= 5; i++ {
		time.Sleep(200 * time.Millisecond)
		fmt.Printf("deaf   worker: step %d done (ctx.Err() = %v)\n", i, ctx.Err())
	}
}()

go func() { // polite: races each unit of work against Done()
	for i := 1; ; i++ {
		select {
		case <-ctx.Done():
			fmt.Printf("polite worker: giving up before step %d: %v\n", i, ctx.Err())
			return
		case <-time.After(200 * time.Millisecond):
			fmt.Printf("polite worker: step %d done\n", i)
		}
	}
}()
```

Actual output (Go 1.26.5):

```
polite worker: step 1 done
deaf   worker: step 1 done (ctx.Err() = <nil>)
polite worker: giving up before step 2: context deadline exceeded
deaf   worker: step 2 done (ctx.Err() = context deadline exceeded)
deaf   worker: step 3 done (ctx.Err() = context deadline exceeded)
deaf   worker: step 4 done (ctx.Err() = context deadline exceeded)
deaf   worker: step 5 done (ctx.Err() = context deadline exceeded)
```

The deaf worker logs four more completed steps while `ctx.Err()` is already
non-nil. Nothing intervenes.

### The shape to write instead

Check the context at every loop iteration and before every expensive step:

```go
for _, item := range items {
	if err := ctx.Err(); err != nil {
		return err // bail early, cheaply
	}
	if err := process(ctx, item); err != nil { // and pass it down
		return err
	}
}
```

`ctx.Err()` is the cheap non-blocking poll; `select` on `<-ctx.Done()` is the
form to use when you also need to wait for something else.

## Related

- [[A Derived Context Can Only Shorten Its Parent's Deadline]]
- [[Err Tells You A Context Was Canceled, Cause Tells You Why]]
- [[A Server Request Context Dies When ServeHTTP Returns]]
- [[When Main Returns Go Kills Every Goroutine Mid-Flight]]
- [[An Unbuffered Channel Is A Rendezvous Not A Queue]]
