---
title: "Go From JavaScript: Where Each Analogy Breaks"
tags: [go, javascript, mental-model, index]
created: 2026-08-19
source: session
---

Coming from JS, most Go concepts have a serviceable analogy — and every one of
them breaks at a specific, predictable point. The analogy gets you to working
code; the breaking point is where the bugs live. This note is the map: each
topic, the analogy that transfers, and the exact place it stops being true.

## Why it matters

Learning Go "from zero" is slower than learning it as a diff against JS. But an
analogy carried one step too far is worse than no analogy — it produces code
that compiles and is wrong. Slices aliasing a shared array, a value receiver
that silently mutates a copy, and a nil-error-but-empty `io.Reader` are all
cases where the JS intuition is confidently incorrect.

## The map

| Topic | Transfers from JS | Breaks when |
| --- | --- | --- |
| Types & zero values | `let x = 5` ≈ `x := 5` | There is no `undefined`/`null` gap — every type has a concrete zero (`0`, `""`, `nil`). A missing map key returns the zero value, not `undefined`, so absence and "set to zero" are indistinguishable without the two-value `v, ok := m[k]` form. |
| Slices | `[]int` ≈ JS array | A slice is a *view* over a backing array. Two slices can share storage, so writing through one mutates the other, and `append` may or may not reallocate depending on `cap`. JS arrays never alias. |
| Maps | ≈ `Object`/`Map` | Iteration order is deliberately randomized, not insertion-ordered. |
| Functions | closures, first-class funcs | Multiple return values instead of tuples/objects; no default params, no overloading. |
| Errors | — | No `try`/`catch`. Errors are ordinary values returned alongside results; the habit to replace is "check the second return value." `panic`/`recover` is **not** `throw`/`catch` — see [[Sync WaitGroup Go Skips Done When F Panics]]. |
| Pointers | JS objects are always references | Go makes you choose. A value receiver or plain arg gets a *copy*, so mutations vanish silently. This has no JS counterpart at all. `T` and `*T` are also distinct types in a signature, with no implicit `&` at the call boundary — see [[Go Function Types Match Exactly - http.Request Is Not A *http.Request]]. |
| Structs & methods | ≈ objects/classes | Value vs pointer receiver decides whether the caller sees mutation: `func (r Rectangle) Area()` reads, `func (r *Rectangle) Scale()` mutates. |
| Embedding | ≈ `extends` | It is composition, not inheritance — there is no supertype and no virtual dispatch onto the outer type. See [[Struct Embedding Promotes Fields And Methods]]. |
| Interfaces | ≈ TypeScript structural typing | Satisfied *implicitly* — no `implements`. A type conforms by having the methods, so a package can satisfy an interface it has never heard of. |
| `io.Reader` | ≈ a stream | Single-use. Reading it once empties it, and the second read yields empty data with a **nil** error. See [[An io.Reader Is Drained By Its First Read]]. |
| Goroutines | ≈ `async` calls | Not Promises and not an event loop — real M:N scheduling across OS threads, so genuine parallelism and genuine data races. `go f()` returns nothing; there is no handle to await, and unfinished goroutines die when `main` returns. See [[When Main Returns Go Kills Every Goroutine Mid-Flight]]. |
| Channels | no JS equivalent | Not queues by default — an unbuffered channel is a rendezvous, and each value reaches exactly one receiver rather than caching for any number of readers. See [[An Unbuffered Channel Is A Rendezvous Not A Queue]]. |
| `select` | ≈ `Promise.race` | Operates on channel readiness, blocks by default, and picks randomly among several ready cases rather than by completion time. |
| `sync.WaitGroup` | ≈ `Promise.all` | A counter, not a collection — it carries no results and no errors. Values come back over a channel or a shared slice you guard yourself. |
| `context.Context` | ≈ `AbortController` + `AbortSignal` in one value | The signal does **not** abort anything — no `fetch` equivalent honours it for you, so every layer must check `ctx.Done()` itself. It is also threaded as an explicit first argument through every call rather than captured in a closure. See [[Context Cancellation Is Cooperative Not Preemptive]]. |
| Deadlines | ≈ `AbortSignal.timeout(ms)` | Deadlines only ever *tighten* down a call chain; a child cannot ask for longer than its parent has left. See [[A Derived Context Can Only Shorten Its Parent's Deadline]]. |

## Details

The concurrency row is where the JS mental model stops helping entirely. In JS,
single-threaded execution means a read-modify-write on a shared variable is
implicitly atomic between `await` points. In Go it is not, and the tool that
catches it is not code review:

```sh
go test -race ./...
go run -race ./exercises/concurrency
```

## Related

- [[When Main Returns Go Kills Every Goroutine Mid-Flight]]
- [[An Unbuffered Channel Is A Rendezvous Not A Queue]]
- [[Sync WaitGroup Go Skips Done When F Panics]]
- [[An io.Reader Is Drained By Its First Read]]
- [[Struct Embedding Promotes Fields And Methods]]
- [[Go Function Types Match Exactly - http.Request Is Not A *http.Request]]
- [[Context Cancellation Is Cooperative Not Preemptive]]
- [[A Derived Context Can Only Shorten Its Parent's Deadline]]
- [[Err Tells You A Context Was Canceled, Cause Tells You Why]]
- [[A Server Request Context Dies When ServeHTTP Returns]]
- [[WithValue Needs An Unexported Key Type]]
