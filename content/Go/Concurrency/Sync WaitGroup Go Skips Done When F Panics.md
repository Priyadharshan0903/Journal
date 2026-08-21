---
title: sync.WaitGroup.Go Skips Done() When f Panics
tags: [go, concurrency, sync, waitgroup]
created: 2026-08-19
source: session
---

`wg.Go(f)` is `Add(1)` + `go` + a deferred `Done()` — except when `f` panics.
The deferred wrapper calls `recover()`, sees a non-nil value, and re-panics
**without decrementing the counter**. `Done()` runs only when `f` returns
normally or exits via `runtime.Goexit`. The public doc comment says only
"The function f must not panic"; the reason lives in the implementation.

## Why it matters

The process dies either way — the point is the ordering. If `Go` called `Done()`
on the panic path, `Wait()` in the main goroutine would unblock and race the
fatal panic, potentially reaching `os.Exit(0)` before the panic finishes
printing. The crash would vanish, and the program would exit 0 on a bug.

The practical consequence: a panicking `wg.Go` task is not a task that "just
decrements the counter and moves on." It takes the whole program down, and
`Wait()` never returns. Any recovery must live **inside** `f`. This differs from
the hand-rolled `defer wg.Done()` worker, where `Done` is an ordinary defer that
runs during panic unwinding — so a worker that recovers internally lets `Wait()`
return normally.

## Details

Panicking task under `wg.Go` — `Wait()` never returns:

```go
var wg sync.WaitGroup
wg.Go(func() { panic("boom") })
wg.Wait()
fmt.Println("unreachable")
```

```
panic: boom [recovered, repanicked]

goroutine 7 [running]:
sync.(*WaitGroup).Go.func1.1()
	.../src/sync/waitgroup.go:251
```

The `[recovered, repanicked]` tag is the tell. Contrast with the manual form,
which prints its trailing line because the deferred `Done()` still fires:

```go
wg.Add(1)
go func() {
	defer wg.Done()
	defer func() { recover() }()
	panic("boom")
}()
wg.Wait() // returns
```

Source, `$GOROOT/src/sync/waitgroup.go:236`:

```go
func (wg *WaitGroup) Go(f func()) {
	wg.Add(1)
	go func() {
		defer func() {
			if x := recover(); x != nil {
				// Calling Done will unblock Wait in the main goroutine,
				// allowing it to race with the fatal panic and
				// possibly even exit the process (os.Exit(0))
				// before the panic completes.
				panic(x)
			}
			wg.Done()
		}()
		f()
	}()
}
```

Availability: Go 1.25 (`$GOROOT/api/go1.25.txt`, proposal #63796). Verified
against go1.26.5 darwin/arm64.

## Related

- [[Go From JavaScript - Where Each Analogy Breaks]]
- [[WaitGroup.Go Removes The WaitGroup Parameter From Workers]]
- [[Go 1.22 Gives Each Loop Iteration Its Own Variable]]
