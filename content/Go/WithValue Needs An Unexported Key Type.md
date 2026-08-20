---
title: "WithValue Needs An Unexported Key Type"
tags: [go, context, api-design, types]
created: 2026-08-20
source: session
---

# WithValue Needs An Unexported Key Type

`context.WithValue` keys are compared by *type and value*, so a plain `string`
key like `"user"` can collide with any other package that picked the same
string — silently overwriting it. The fix is a private named type whose values
no other package can construct.

## Why it matters

Two independent middlewares that both store `"user"` under a `string` key will
clobber each other, and nothing warns you: no compile error, no panic, just the
wrong value read at the far end. With an unexported key type the collision is
impossible by construction, because an outside package cannot produce a value of
a type it cannot name.

The second half of the reason: `Value` returns `any`, so every read is an
unchecked type assertion. Use the two-value form or a nil `any` will panic your
handler.

## Details

```go
type key int          // unexported: no other package can make one
const UserKey key = 0 // typed constant, not the untyped string "user"

ctx := context.WithValue(context.Background(), UserKey, "123")

// Always the two-value assertion -- the value may be absent or the wrong type.
if userID, ok := ctx.Value(UserKey).(string); ok {
	fmt.Println("User Id : ", userID)
} else {
	fmt.Println("no userId found")
}
```

Even `type key struct{}` with `var UserKey key` works and costs zero bytes; the
point is only that the type is unexported.

### What belongs in a context value

Request-scoped metadata that crosses API boundaries and that intermediate layers
shouldn't have to know about: trace/request IDs, the authenticated subject,
locale.

What does **not** belong: anything a function actually needs to do its job.
Optional parameters, config, database handles and loggers-as-dependencies should
be explicit arguments or struct fields. A context value is invisible to the
compiler — moving a required input into one converts a compile error into a
runtime `nil`.

### The typed-accessor pattern

Hide the key entirely and export functions instead, so callers cannot get the
type wrong:

```go
func WithUser(ctx context.Context, id string) context.Context {
	return context.WithValue(ctx, UserKey, id)
}

func UserFromContext(ctx context.Context) (string, bool) {
	id, ok := ctx.Value(UserKey).(string)
	return id, ok
}
```

This is what the standard library does internally, and it keeps the assertion in
exactly one place.

## Related

- [[A Server Request Context Dies When ServeHTTP Returns]]
- [[Context Cancellation Is Cooperative Not Preemptive]]
- [[Go From JavaScript - Where Each Analogy Breaks]]
