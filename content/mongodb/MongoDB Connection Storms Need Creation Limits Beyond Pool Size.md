
---
tags: [mongodb, system-design, connection-pooling, rate-limiting]

created: 2026-09-29

source: https://github.com/mongodb/specifications/blob/e1fa73dd9d31769d1f10db02d3c776b0cfe7ee31/source/connection-monitoring-and-pooling/connection-monitoring-and-pooling.md

---

MongoDB controls connection storms by reusing connections, limiting concurrent connection creation in each client pool, and offering server-side admission rate limiting. A maximum pool size bounds how many connections a pool holds; it does not independently bound how quickly the pool creates them. Protecting a database requires accounting for both local pool behavior and aggregate fleet pressure.

> **Evidence boundary:** This is a design case study based on documentation and source code verified on 2026-09-29. It is not a confirmed incident postmortem. The sequence below explains the architecture, rather than establishing an incident-specific timeline of attempted fixes or measured results.

## Why it matters

After a deployment, failover, or network disruption, many application instances can reconnect together. Establishment involves TCP, optional TLS, a MongoDB handshake, and authentication. Simultaneous setup work competes with useful operations and can create a feedback loop: slower responses cause timeouts, which cause more connection attempts.

For illustration, 200 application instances with pools capped at 100 connections can collectively grow toward 20,000 application connections to one server:

```text

200 application instances × 100 connections = 20,000 connections

```

Monitoring connections are additional. These are teaching numbers, not MongoDB incident measurements.

```mermaid

flowchart LR

A[Many clients reconnect] --> B[Connection setup consumes resources]

B --> C[Connections and queries slow down]

C --> D[Timeouts trigger more attempts]

D --> A

```

This is a **thundering herd**: independent clients respond to a shared event at approximately the same time.

## Details

### The baseline solution reuses connections

A connection pool lends an established connection to an operation and takes it back when the operation finishes:

```text

Borrow connection → Execute operation → Return connection

```

Reusing a client within an application process avoids rebuilding its pools for each request. MongoDB's Node.js driver maintains a pool per server within each `MongoClient`, and `maxPoolSize` caps pool capacity. [Connection-pool documentation](https://www.mongodb.com/docs/drivers/node/current/connect/connection-options/connection-pools/)

Pooling reduces repeated setup work, but pool capacity and creation pressure are separate concerns:

- **Pool capacity:** How many connections may this pool hold?

- **Creation pressure:** How many connections may it establish simultaneously?

An empty pool capped at 100 connections can still create a damaging burst if it attempts to establish those connections together. Multiplying that behavior across many application instances increases aggregate pressure.

### The client limits simultaneous establishment

MongoDB's driver specification requires a separate `maxConnecting` limit. Its changelog records the introduction of this requirement on 2020-09-24.

Illustrative settings:

```text

maxPoolSize = 100

maxConnecting = 2

```

The pool may eventually reach 100 connections, but it establishes at most two concurrently. The checkout process conceptually works as follows:

1. Reuse an available, valid connection.

2. If none exists, create one only when both pool capacity and an establishment slot are available.

3. Otherwise, wait for a returned connection or an establishment slot.

Waiting must allow other operations to return connections. Some queued work can therefore reuse those connections without creating more. [Connection-pooling specification](https://github.com/mongodb/specifications/blob/e1fa73dd9d31769d1f10db02d3c776b0cfe7ee31/source/connection-monitoring-and-pooling/connection-monitoring-and-pooling.md)

`maxConnecting` is a concurrency limit, not a fixed connections-per-second limit. Its effective creation rate also depends on setup duration.

This protection is local to each pool. Across 200 pools, a limit of two can still permit 400 concurrent establishment attempts.

### The server controls aggregate admission

MongoDB also provides server-side controls for connection-establishment rate, burst allowance, queue depth, and client exemptions. Documentation lists availability in 8.2, as well as 8.1.1 and 8.0.12; the documented enable flag defaults to `false`. The presence of the feature does not mean every deployment enables it. [Server parameters](https://www.mongodb.com/docs/manual/reference/parameters/#mongodb-parameter-param.ingressConnectionEstablishmentRateLimiterEnabled)

This is **admission control**: regulate how quickly incoming work enters a resource-intensive stage.

The verified source routes session establishment through an admission limiter built around `folly::TokenBucket`, with queue limits, interruption handling, and metrics. [Session-establishment limiter](https://github.com/mongodb/mongo/blob/9e0943627a5f732ce070b98b509d4701286b86cc/src/mongo/transport/session_establishment_rate_limiter.cpp), [admission-limiter interface](https://github.com/mongodb/mongo/blob/9e0943627a5f732ce070b98b509d4701286b86cc/src/mongo/db/admission/rate_limiter.h)

A token bucket works as follows:

- Tokens accumulate at a configured rate, up to a capacity.

- Each admission consumes a token.

- An attempt without an available token waits if queueing permits, or is rejected.

For example:

```text

Refill rate: 100 tokens per second

Bucket capacity: 200 tokens

```