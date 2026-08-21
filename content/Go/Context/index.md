---
title: Context
description: How cancellation, deadlines and request-scoped values actually behave in Go.
tags: [go, context, index]
---

`context.Context` looks like a cancellation switch and behaves like a polite request.
Nothing here is about the API surface — it's about the gap between what the signature
suggests and what the runtime does.

## Cancellation

Cancelling a context does not stop anything on its own. It closes a channel and hopes
somebody is listening.

- [[Context Cancellation Is Cooperative Not Preemptive]] — a cancelled context never
  interrupts running code; a function that doesn't check `Done()` runs to completion.
- [[A Server Request Context Dies When ServeHTTP Returns]] — which is why passing a
  request context into background work silently kills it the moment you respond.

## Deadlines

- [[A Derived Context Can Only Shorten Its Parent's Deadline]] — `WithTimeout` on an
  already-expiring parent cannot buy you more time, however generous the value you pass.

## Inspecting and carrying

- [[Err Tells You A Context Was Canceled, Cause Tells You Why]] — `Err()` collapses every
  reason into the same two sentinels; `Cause()` is where the actual reason survives.
- [[WithValue Needs An Unexported Key Type]] — a `string` key is a collision waiting to
  happen across packages you don't control.
