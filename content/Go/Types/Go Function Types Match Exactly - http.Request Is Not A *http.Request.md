---
title: "Go Function Types Match Exactly: http.Request Is Not A *http.Request"
tags: [go, net-http, types, pointers, compiler-errors]
created: 2026-08-20
source: session
---

# Go Function Types Match Exactly: http.Request Is Not A *http.Request

`http.HandleFunc` takes exactly `func(http.ResponseWriter, *http.Request)`. Declaring
the handler with a value parameter — `r http.Request` — produces a *different type*,
and Go rejects it at the call site rather than silently taking the address:

```
cannot use helloHandler (value of type func(w http.ResponseWriter, r http.Request))
as func(http.ResponseWriter, *http.Request) value in argument to http.HandleFunc
```

The fix is one character: `r *http.Request`. Nothing about the function body has to
change, because `r.URL.Path` and friends read the same through a pointer.

## Why it matters

The error is a *type identity* failure, not a missing-conversion failure. Go has no
implicit `&`/`*` at a function boundary, and function assignability requires the
parameter types to be **identical** — not merely convertible, not merely
"same struct". So `T` and `*T` in a parameter list make two unrelated function
types, and no amount of correct logic inside the body will make the assignment
compile. Reading the message this way is what makes it a five-second fix instead of
a hunt through the handler.

Two further reasons the standard library chose the pointer:

- **Identity.** Middleware chains hand the *same* request down the stack. A value
  parameter would copy a large struct per hop, and any mutation (context, headers)
  would be invisible to the caller. The library exposes
  `func (r *Request) Clone(ctx context.Context) *Request` precisely because copying
  a request is a deliberate act, not something that should happen by accident on a
  parameter pass.
- **Body is single-use.** `r.Body` is an `io.ReadCloser`; copying the struct
  duplicates the handle, not the stream, so two copies fight over one drained
  reader — see [[An io.Reader Is Drained By Its First Read]].

Note the deliberate asymmetry in the signature: `ResponseWriter` is an *interface*
passed by value (it already holds a pointer internally), while `Request` is a
*struct* passed by pointer. Only one of the two gets a `*`.

## Details

```go
// ✗ func(w http.ResponseWriter, r http.Request) — a different type entirely
func helloHandler(w http.ResponseWriter, r http.Request) {
	fmt.Fprintf(w, "hello %s", r.URL.Path)
}

// ✓ matches http.HandlerFunc
func helloHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "hello %s", r.URL.Path)
}

func main() {
	http.HandleFunc("/hello", helloHandler)
	log.Fatal(http.ListenAndServe(":8080", nil))
}
```

The target type is named, and worth memorising as a unit:

```go
type HandlerFunc func(ResponseWriter, *Request)
```

Anything assigned to `http.HandleFunc`, stored in a `http.Handler`, or wrapped by
middleware has to match it character for character.

### Reading the error generally

`cannot use X (value of type A) as B value in argument to F` always means A and B
are *not identical types*. For function values, walk the parameter lists
left-to-right and diff them — the mismatch is almost always a missing `*`, a
swapped parameter order, or a return value the caller doesn't want.

## Related

- [[Go From JavaScript - Where Each Analogy Breaks]]
- [[An io.Reader Is Drained By Its First Read]]
- [[Struct Embedding Promotes Fields And Methods]]
- [[A Server Request Context Dies When ServeHTTP Returns]] — what `r.Context()` on that pointer is good for
