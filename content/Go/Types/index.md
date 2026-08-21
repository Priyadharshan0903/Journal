---
title: Types
description: Interfaces, embedding and the places Go's type rules are stricter than they look.
tags: [go, types, index]
---

Go's type system is small enough to feel obvious and strict enough to catch you out. These
are the cases where the code reads correctly and still doesn't mean what you think.

## Interfaces

- [[An io.Reader Is Drained By Its First Read|An io.Reader is drained by its first read]] —
  it's a one-shot stream, not a buffer, so the second consumer gets nothing and no error
  says so.

## Composition

- [[Struct Embedding Promotes Fields And Methods|Struct embedding promotes fields and methods]]
  — it looks like inheritance right up to the point where it isn't, and a single comma
  turns promotion into a plain field.

## Strictness

- [[Go Function Types Match Exactly - http.Request Is Not A *http.Request|Function types match exactly: http.Request is not a *http.Request]]
  — no implicit conversion between a value and a pointer, however similar the names look.
