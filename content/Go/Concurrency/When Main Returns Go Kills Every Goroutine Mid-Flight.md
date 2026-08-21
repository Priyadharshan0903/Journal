---
title: When main Returns, Go Kills Every Goroutine Mid-Flight
tags: [go, concurrency, goroutines, runtime]
created: 2026-08-19
source: session
---

`go f()` starts a goroutine and returns immediately, handing back **nothing** —
no handle, no promise, no way to await it. When `main` returns the process
exits, and any goroutine still running is killed where it stands, mid-statement,
with no unwinding and no output. Work that was 99% done simply vanishes.

## Why it matters

This is the opposite of Node. There, the process stays alive while the event
loop has pending work, so a forgotten `await` still runs to completion and the
bug is invisible. In Go the same forgotten synchronization means the work never
happens at all — and because a killed goroutine prints nothing, the program
looks like it silently skipped the work rather than crashing.

```go
func main() {
	fmt.Println("Start!")
	go sayHello() // never prints
	fmt.Println("Mid")
}
```

`sayHello` is scheduled, `main` reaches the end of its body, and the process
exits before the goroutine is ever picked up.

## Details

The two hacks that "fix" it, and why neither is the answer:

```go
time.Sleep(100 * time.Millisecond) // guesses how long the work takes
fmt.Scanln()                       // blocks until a human presses enter
```

Both work by keeping `main` alive long enough, which means both are races — a
slower machine, and the goroutine is killed again. Use a real synchronizer:

```go
// 1. WaitGroup — when you only need to know that the work finished.
var wg sync.WaitGroup
for _, order := range orders {
	wg.Go(func() { processOrder(order) }) // Go 1.25+; does Add/Done for you
}
wg.Wait()

// 2. Channel — when you need a value back. A goroutine cannot return anything,
//    so results travel over a channel or into a pre-sized slice.
reply := make(chan string)
go func() { reply <- sendConfirmation(" No. 2") }()
fmt.Println(<-reply) // blocks until the goroutine sends
```

A subtlety worth internalizing: `wg.Wait()` and `<-reply` do not "keep the
program alive" as a side effect the way `Sleep` does — they block `main` on a
condition that is true exactly when the work is done. That is the difference
between waiting and guessing.

Writing into distinct slice slots from several goroutines needs no mutex, since
separate indices are independent memory:

```go
results := make([]string, 3)
for i := range results {
	wg.Go(func() { results[i] = fmt.Sprintf("worker %d done", i) })
}
```

Only `main`'s return is special. A non-main goroutine finishing kills nothing.

## Related

- [[An Unbuffered Channel Is A Rendezvous Not A Queue]]
- [[Sync WaitGroup Go Skips Done When F Panics]]
- [[Go From JavaScript - Where Each Analogy Breaks]]
