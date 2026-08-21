---
title: Concurrency
description: Channels, goroutines and WaitGroups — mostly the failure modes that don't error.
tags: [go, concurrency, index]
---

The recurring theme: Go's concurrency primitives fail by _blocking_ or by _vanishing_,
almost never by returning an error you can handle.

## Channels

- [[An Unbuffered Channel Is A Rendezvous Not A Queue]] — a send blocks until a receiver
  is ready, so the first send deadlocks if nobody is waiting.

## Goroutine lifetime

- [[When Main Returns Go Kills Every Goroutine Mid-Flight|When main returns, Go kills every goroutine mid-flight]]
  — no graceful shutdown, no warning; in-flight work is simply gone.

## Coordination

- [[Sync WaitGroup Go Skips Done When F Panics|sync.WaitGroup.Go skips Done() when f panics]]
  — a panic in one worker turns into a permanent hang in whoever is waiting, far from the
  actual fault.
