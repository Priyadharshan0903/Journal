
---
title: Golang & Platform Engineering Roadmap
tags: [golang, roadmap, meta, kubernetes]
---

# Golang Journey — Roadmap (coming from JavaScript)

This is the master plan for the whole journey — every note in this vault should
eventually link back here, and this note should link out to each topic note as
it gets written. Think of this as the "hub" node in the graph.

Mental model: you already know async I/O, event loops, and dynamic typing from JS.
Go's whole personality is the opposite of that — static types, explicit errors, no
exceptions, no classes, concurrency as a language primitive instead of a runtime trick.
Every phase below calls out the JS analogue so you can map new concepts onto what you
already know instead of learning from zero.

> **Changelog vs. original roadmap:** added a full Kubernetes / `client-go` phase
> (the biggest gap for a platform-engineering goal), a generics pass in Phase 3,
> an observability pass in Phase 9, and a second capstone track so the concurrency
> skills get applied to both an MCP orchestrator *and* a real K8s controller/webhook
> that gates CI/CD. Pace is now ~12 weeks instead of 9 — that's fine, better to do
> the K8s phase properly than rush it.

## Repo layout

One `go.mod` for the whole repo (already done). Every folder with its own `main.go`
is an independently runnable program — Go doesn't need a new module per exercise the
way Node needs a new `package.json` per project.

```
exercises/day-NN-topic/main.go   # small daily drills, run with: go run ./exercises/day-NN-topic
projects/NN-project-name/        # the 8-project ladder, each gets its own folder + README.md
```

Exercise folders are numbered/prefixed by day (`day-01-hello-world`, `day-02-variables`, ...)
so they sort chronologically and map 1:1 to the day-by-day checklist below.

## Flowchart

```
flowchart TD
    A[Phase 0: Setup & Tooling] --> B[Phase 1: Syntax & Types]
    B --> C[Phase 2: Error Handling & Pointers]
    C --> D[Phase 3: Structs, Methods, Interfaces, Generics]
    D --> E[Phase 4: Packages & Project Layout]
    E --> F[Phase 5: Goroutines & Channels]
    F --> G[Phase 6: Stdlib Deep Dive - net/http, encoding/json, testing]
    G --> H[Phase 7: Concurrency Patterns - worker pools, context, errgroup]
    H --> I[Phase 8: Web Services - REST, middleware, DB access]
    I --> J[Phase 8.5: Kubernetes & client-go - informers, controllers, webhooks]
    J --> K[Phase 9: Testing, Profiling, Observability, Tooling]
    K --> L[Phase 10: Deployment - Docker, cross-compile, CI/CD gating]
    L --> M[Capstone A: LLM + MCP Orchestration Panel]
    L --> N[Capstone B: K8s Controller + Webhook gating CI/CD]

    style M fill:#2d6a4f,stroke:#1b4332,color:#fff
    style N fill:#1b4965,stroke:#0d2b3e,color:#fff
```

## Day-by-day schedule (1–2 hrs/day pace, ~12 weeks)

6 study days/week + 1 rest/catch-up day. Check boxes off as you go and commit —
that's your actual "journey" log. Each day maps back to a Phase above; see
**Phase-by-phase** below for the concept detail behind each line.

### Week 1 — Setup + Syntax & Types (Phase 0–1)

- [ ] **Day 1** — Install/tooling check, `go mod init`, Hello World, `go run`/`build`/`test`, VS Code Go extension.
- [ ] **Day 2** — Variables, constants, zero values, basic types, type conversion (no implicit coercion, unlike JS).
- [ ] **Day 3** — Control flow: `if`/`for`/`switch` (no `while`, no ternary `?:`).
- [ ] **Day 4** — Arrays vs slices deep dive: `append`, `len` vs `cap`, slicing gotchas (shared backing array).
- [ ] **Day 5** — Maps + struct basics (fields, zero-value structs).
- [ ] **Day 6** — Functions: multiple returns, variadic args, closures. Do 3–4 small exercises (e.g. FizzBuzz, word counter).
- [ ] **Day 7** — Rest / review. Skim what confused you on Days 1–6.

### Week 2 — Errors, Pointers, Structs, Interfaces, Generics (Phase 2–3) + Project 1

- [ ] **Day 8** — Error handling idioms: `errors.New`, `fmt.Errorf`, `%w` wrapping, `errors.Is`/`As`.
- [ ] **Day 9** — Pointers: `*T`/`&x`, value vs reference semantics, when a function needs a pointer receiver.
- [ ] **Day 10** — Structs & methods (value vs pointer receivers).
- [ ] **Day 11** — Interfaces (implicit satisfaction) + embedding/composition.
- [ ] **Day 12** — **Generics**: type parameters, constraint interfaces (`~int | ~float64`), write a generic `Map`/`Filter`/`Reduce` and a generic cache. This is Go 1.18+ territory and shows up constantly in modern codebases.
- [ ] **Day 13** — **Project 1: CLI task tracker** — add/list/complete tasks, JSON file persistence, flags/`os.Args`, a couple of tests.

### Week 3 — Packages, Stdlib Basics (Phase 4–6) + Project 2

- [ ] **Day 14** — Go modules deep dive, project layout (`cmd/`, `internal/`, `pkg/`), exported vs unexported names.
- [ ] **Day 15** — `encoding/json`: struct tags, `Marshal`/`Unmarshal`, nested structs.
- [ ] **Day 16** — `os`, `io`, `bufio` — file handling, reading stdin, buffered I/O.
- [ ] **Day 17** — `testing` package: table-driven tests, subtests, `t.Run`.
- [ ] **Day 18** — **Project 2: URL shortener** — basic `net/http` server, in-memory map + `sync.Mutex`.
- [ ] **Day 19** — Finish Project 2: add persistence (JSON file or SQLite), write handler tests.

### Week 4 — Goroutines & Channels (Phase 5, the big mental shift)

*See [[Golang/Concurrency]] for the deep-dive notes on this phase.*

- [ ] **Day 20** — Goroutines basics: the `go` keyword, `sync.WaitGroup`.
- [ ] **Day 21** — Channels basics: unbuffered vs buffered, send/receive/close semantics.
- [ ] **Day 22** — `select` statement, common deadlocks and how to spot them.
- [ ] **Day 23** — `sync` package: `Mutex`, `RWMutex`, `Once`.
- [ ] **Day 24** — `context` package: cancellation, timeouts, passing request-scoped values.
- [ ] **Day 25** — Mini exercises: simple fan-in/fan-out, a goroutine-based counter with race detection (`go test -race`).

### Week 5 — Concurrency Patterns (Phase 7) + Project 3 start

- [ ] **Day 26** — Worker pool pattern (bounded concurrency over a task queue).
- [ ] **Day 27** — Pipeline pattern, `golang.org/x/sync/errgroup`.
- [ ] **Day 28** — **Project 3: REST API + DB** — schema design, `database/sql` + Postgres/SQLite driver setup.
- [ ] **Day 29** — Project 3: CRUD handlers wired to the DB.
- [ ] **Day 30** — Project 3: middleware (logging, recover-from-panic), request validation.
- [ ] **Day 31** — Project 3: tests for handlers + DB layer, wrap up.

### Week 6 — Web Services Deeper (Phase 8) + Project 4

- [ ] **Day 32** — `net/http` deep dive: middleware chaining, router comparison (stdlib mux vs `chi`/`gin`).
- [ ] **Day 33** — HTTP client timeouts, basic rate limiting (`x/time/rate`).
- [ ] **Day 34** — **Project 4: concurrent web scraper** — sequential version first, get it correct.
- [ ] **Day 35** — Project 4: parallelize with goroutines + worker pool, respect rate limits.
- [ ] **Day 36** — Project 4: error handling across goroutines, aggregate results, tests.
- [ ] **Day 37** — Buffer/review day — catch up or revisit anything shaky from Weeks 4–6.

### Week 7 — Kubernetes & client-go, Part 1 (Phase 8.5)

*New phase. This is where the roadmap turns toward platform engineering specifically.*

- [ ] **Day 38** — `client-go` setup: build a read-only CLI that lists pods/deployments across namespaces. Understand `Clientset` vs dynamic client vs `RESTMapper`.
- [ ] **Day 39** — Informers deep dive: the watch mechanism, `SharedInformerFactory`, resync periods, indexers.
- [ ] **Day 40** — Workqueue pattern: build a pod-watcher using an informer + workqueue that logs state changes (not polling).
- [ ] **Day 41** — Read `kubernetes/sample-controller` start to finish, take notes. It's short and it's the reference implementation everyone else's controller code copies.
- [ ] **Day 42** — Reproduce a small version of `sample-controller`'s reconcile loop yourself, from memory/notes, against a local `kind` or `minikube` cluster.
- [ ] **Day 43** — Buffer/review day for the informer/workqueue mental model — this is the single most important concept in this whole phase, worth the extra day if needed.

### Week 8 — Kubernetes & client-go, Part 2: Kubebuilder + Webhooks (Phase 8.5 cont.)

- [ ] **Day 44** — Install `kubebuilder`, scaffold a CRD (e.g. a `PodPolicy` resource with a CPU threshold field).
- [ ] **Day 45** — Implement `Reconcile()` logic — e.g. auto-annotate pods exceeding the CPU threshold defined in your CRD.
- [ ] **Day 46** — Add a status subresource + conditions; write a reconciler test with `envtest`.
- [ ] **Day 47** — Validating admission webhook — reject a resource that violates a policy (e.g. a Deployment with no resource limits).
- [ ] **Day 48** — Mutating admission webhook — default/patch a field automatically (e.g. inject a resource limit if missing).
- [ ] **Day 49** — Deploy the controller + webhook to a local `kind`/`minikube` cluster end to end; buffer/review day.

### Week 9 — Testing, Profiling, Observability, Tooling (Phase 9) + Project 5

- [ ] **Day 50** — `go test -race`, benchmarks (`go test -bench`).
- [ ] **Day 51** — `pprof` basics — profile CPU/memory on Project 4's scraper.
- [ ] **Day 52** — **Observability**: instrument something (Project 3 or 4) with `prometheus/client_golang` metrics; basic OpenTelemetry-Go tracing. Platform engineering without metrics isn't platform engineering.
- [ ] **Day 53** — `golangci-lint` setup, clean up lint warnings across all projects so far.
- [ ] **Day 54** — **Project 5: mini KV store over TCP** — `net` package, define a tiny wire protocol, concurrent client handling.
- [ ] **Day 55** — Project 5: disk persistence (append-only log or periodic snapshot), tests, wrap up.

### Week 10 — Deployment + CI/CD Gating (Phase 10) + Capstone planning

- [ ] **Day 56** — Docker multi-stage builds for a Go binary.
- [ ] **Day 57** — Cross-compilation (`GOOS`/`GOARCH`), static binary builds.
- [ ] **Day 58** — Package the Week 8 controller/webhook as a container and wire it into a GitHub Actions pipeline as a policy-gate step — this is the concrete "automation in CI/CD" deliverable.
- [ ] **Day 59** — Optional: `bubbletea` TUI basics (skip if going straight to a web UI for Capstone A).
- [ ] **Day 60** — **Capstone planning**: sketch both capstones' architecture side by side — notice the informer/workqueue shape in Capstone B mirrors the MCP fan-out shape in Capstone A.
- [ ] **Day 61** — Capstone planning: define the API surface for whichever capstone you start first.

### Week 11+ — Capstone build (two tracks, pick order)

**Capstone A — LLM + MCP Orchestration Panel**
- [ ] **Day 62** — Wire up one MCP client + one local LLM backend, end-to-end happy path only.
- [ ] **Day 63** — Add `context` cancellation/timeouts around the MCP + LLM calls.
- [ ] **Day 64** — Generalize the MCP client to an interface; add a second MCP server.
- [ ] **Day 65** — Generalize the LLM backend to an interface; swap between local models.
- [ ] **Day 66** — Fan-out across multiple MCPs concurrently, fan-in/aggregate results.
- [ ] **Day 67** — Error handling/resilience: one MCP or LLM failing shouldn't take down the panel.

**Capstone B — Kubernetes Controller + Webhook Gating CI/CD**
- [ ] **Day 68** — Take the Week 8 controller further: watch a second resource type, add a finalizer for cleanup on delete.
- [ ] **Day 69** — Add idempotency handling — reconcile should be safe to run repeatedly with no side effects on a no-op resync.
- [ ] **Day 70** — Extend the admission webhook into a real policy set (e.g. required labels, resource limits, image allowlist).
- [ ] **Day 71** — Add Prometheus metrics to the controller itself (reconcile duration, error counts) — full-circle back to Phase 9's observability work.
- [ ] **Day 72** — Wire the whole thing into a real CI/CD pipeline: a PR that violates policy should fail the build; a compliant one should pass and deploy.
- [ ] **Day 73+** — Iterate: this is your actual portfolio piece from here — both capstones together demonstrate the full "CLI + orchestrator + K8s automation" goal.

## Phase-by-phase

### Phase 0 — Setup & Tooling

- Install: already done (Go 1.26.5 detected).
- `go mod init`, understand modules (this replaces `package.json` + npm registry —
no central registry, modules are fetched by git URL/proxy).
- Editor: VS Code + Go extension (gopls, delve debugger, gofmt-on-save).
- Learn the trio you'll run constantly: `go run`, `go build`, `go test`.

### Phase 1 — Syntax & Types

- Static typing, `var`/`:=`, zero values (no `undefined`/`null` ambiguity — every
type has a concrete zero value).
- Arrays vs **slices** (slices ≈ JS arrays but backed by a fixed array + growth
semantics — this trips up everyone coming from JS, spend real time here).
- Maps (≈ JS `Object`/`Map`), but no guaranteed iteration order.
- Functions: multiple return values (this is how errors work — no try/catch),
no default params, no overloading.

### Phase 2 — Error Handling & Pointers

- Errors are values, returned explicitly (`if err != nil`) — mentally replace every
`try/catch` habit with "check the second return value."
- Pointers (`*T`, `&x`) — JS objects are always reference types; Go lets you choose
value vs pointer semantics explicitly. This is the biggest new concept for you.
- `panic`/`recover` exist but are NOT your error handling mechanism — don't reach
for them like `throw`.

### Phase 3 — Structs, Methods, Interfaces, Generics

- Structs ≈ plain JS objects/classes without inheritance.
- Methods with value vs pointer receivers (decides if mutation is visible to caller).
- Interfaces are satisfied **implicitly** (structural typing, like TypeScript
interfaces but even looser — no `implements` keyword).
- Embedding (composition) instead of class inheritance.
- **Generics** (Go 1.18+): type parameters `[T any]`, constraint interfaces
(`~int | ~float64`), when generics are the right tool vs. just using an
interface — don't over-reach for generics where a plain interface reads cleaner.

### Phase 4 — Packages & Project Layout

- Conventional layout: `cmd/`, `internal/`, `pkg/`, `go.mod` at root.
- Exported vs unexported identifiers via capitalization (`Foo` public, `foo` private)
instead of `export`/explicit visibility keywords.

### Phase 5 — Goroutines & Channels (the big one)

- Goroutines ≈ lightweight threads, not Promises — you `go func(){}()` and it runs
concurrently on Go's own scheduler (M:N threading), not the single-threaded event
loop you're used to.
- Channels are typed pipes for communicating between goroutines — think of them as
a blocking queue, very unlike anything in JS.
- `select` ≈ `Promise.race`-ish, but for channels.
- This is where "coming from JS" stops helping and Go's actual value prop starts.

### Phase 6 — Stdlib Deep Dive

- `net/http` (build a server with zero dependencies — no Express needed).
- `encoding/json` (struct tags ≈ JSON (de)serialization, similar shape to
class-validator/decorators but via tags).
- `testing` package — table-driven tests are idiomatic here, no Jest/Mocha.
- `context` package — cancellation/timeouts/request-scoped values, threaded
explicitly through every function signature (JS hides this in Promise chains).

### Phase 7 — Concurrency Patterns

- Worker pools, fan-in/fan-out, pipelines.
- `sync.WaitGroup`, `sync.Mutex`, `errgroup.Group`.
- Context cancellation propagation across goroutines.

### Phase 8 — Web Services

- Router: start with stdlib `net/http` mux, then try `chi` or `gin`.
- Middleware pattern (closures wrapping `http.Handler`).
- DB access: `database/sql` + driver, then `sqlx` or `gorm`; migrations via `goose` or `golang-migrate`.
- gRPC + protobuf is optional here — deprioritize it relative to Phase 8.5.
Most K8s-adjacent tooling (client-go, the API server's watch mechanism) is
REST/watch-stream based, not gRPC, so gRPC pays off less for this specific goal
than it would for a general backend track.

### Phase 8.5 — Kubernetes & client-go

*New phase — this is the direct bridge from "Go developer" to "platform engineer."*

- `client-go`: `Clientset` (typed, generated from the K8s API swagger spec) vs
dynamic client (untyped, works with any resource including CRDs) vs `RESTMapper`
(resolves GVK ↔ GVR).
- **Informers + workqueue**: the pattern behind every controller you'll ever write.
An informer watches the API server and pushes change events; a workqueue
decouples "event arrived" from "do the work," with retry/backoff built in.
This is worth over-investing in — it's the shape that recurs everywhere in this
ecosystem, including in your MCP orchestrator's fan-out logic.
- `kubernetes/sample-controller`: read this like a textbook, not a reference you
skim once.
- `kubebuilder` + `controller-runtime`: scaffolding a CRD, implementing
`Reconcile()`, status subresources, finalizers for cleanup, idempotency
(reconcile must be safe to call repeatedly / out of order).
- Admission webhooks (validating and mutating): this is your direct route to
"automation jobs in CI/CD" — a webhook or a CI step that calls the K8s API can
block or auto-fix non-compliant resources before they ever get deployed.

### Phase 9 — Testing, Profiling, Observability, Tooling

- `go test -race` (catches data races — use this constantly once you touch goroutines).
- Benchmarks (`go test -bench`), `pprof` for profiling.
- **Observability**: `prometheus/client_golang` for metrics (counters, histograms
for reconcile duration/error rates), basic OpenTelemetry-Go for tracing. A
controller or service with no metrics is a black box in production — this isn't
optional for platform-engineering work.
- `golangci-lint` for linting.

### Phase 10 — Deployment

- Static binary builds, cross-compilation (`GOOS`/`GOARCH`) — no `node_modules`,
no runtime needed on the target machine, single binary ships.
- Docker multi-stage builds (tiny final images since Go binaries are static).
- Wiring a Go binary (controller, webhook, or policy-check CLI) into an actual
CI/CD pipeline as a gate — the concrete deliverable that ties this whole roadmap
back to your original stated goal.

### Capstone A — LLM + MCP Orchestration Panel

- Goroutines/channels → orchestrating multiple MCP server calls concurrently.
- `context` → cancellation/timeouts when a local LLM or MCP server hangs.
- Interfaces → abstracting "MCP client" / "LLM backend" so you can swap local models.
- `net/http` → the panel's own API/UI backend (pair with a JS/React frontend — your
existing strength).
- Worker pools → fan-out requests across multiple MCPs, fan-in results.

### Capstone B — Kubernetes Controller + Webhook Gating CI/CD

- Informers/workqueue → the same fan-out/fan-in shape as Capstone A, applied to
watching K8s resources instead of calling MCP servers.
- `context` → cancellation on controller shutdown (SIGTERM in a pod), timeouts on
API server calls.
- Admission webhook → the CI/CD gate: a PR/deploy that violates policy fails,
one that complies passes.
- Prometheus metrics → observability on the controller itself, closing the loop
back to Phase 9.
- This is the piece that makes "K8s scheduling and automation in CI/CD" a real,
demonstrable thing on your GitHub, not just a roadmap bullet point.

## Project ladder (do these roughly in order)

1. **CLI task tracker** — flags/`os.Args`, file persistence (JSON), no deps.
   Teaches: syntax, structs, JSON, file I/O.
2. **In-memory URL shortener (HTTP API)** — `net/http`, maps, `sync.Mutex`.
   Teaches: stdlib HTTP, concurrency-safety basics.
3. **REST API with a real DB** (notes/bookstore app) — `net/http` or `chi`,
   Postgres via `database/sql`.
   Teaches: layered architecture, DB access, testing handlers.
4. **Concurrent web scraper/crawler** — goroutines + channels + worker pool,
   rate limiting.
   Teaches: Phase 5–7 concurrency patterns for real.
5. **Mini key-value store server** (Redis-lite) over TCP — `net`, custom protocol,
   persistence to disk.
   Teaches: raw networking, concurrency, protocol design.
6. **Kubernetes controller + admission webhook** — `client-go`, informers,
   `kubebuilder`, validating/mutating webhooks.
   Teaches: Phase 8.5 for real; this is the platform-engineering project.
7. **TUI dashboard** using `bubbletea` — optional; could be a dry run for either
   capstone's UI if you want a terminal-first version before a web UI.
8. **Capstones: LLM + MCP orchestration panel, and K8s controller/webhook gating
   CI/CD** — tie everything together; build incrementally on each, and notice
   how similar their concurrency skeletons are.

## Resources

Keep these three open as permanent tabs — they cover 80% of day-to-day lookups:

- **[A Tour of Go](https://go.dev/tour/)** — official, interactive, in-browser. Do this alongside Weeks 1–2.
- **[Go by Example](https://gobyexample.com/)** — one page per topic with runnable snippets. Best quick reference while working through any day above.
- **[pkg.go.dev](https://pkg.go.dev/std)** — stdlib docs. This is your MDN.

### Per-phase resources

**Phase 0–1 (Setup, Syntax & Types)**

- [Effective Go](https://go.dev/doc/effective_go) — official idioms doc, skim early, re-read after Week 2 when it'll mean more.
- [Go Tour: Slices](https://go.dev/tour/moretypes/7) + [Go blog: Slices, usage and internals](https://go.dev/blog/slices-intro) — the slice-semantics gotcha deserves this dedicated read.

**Phase 2–3 (Errors, Pointers, Structs, Interfaces, Generics)**

- [Go blog: Error handling and Go](https://go.dev/blog/error-handling-and-go)
- [Go blog: Errors are values](https://go.dev/blog/errors-are-values)
- [Go blog: An Introduction To Generics](https://go.dev/blog/intro-generics)
- Book: *[Learning Go](https://www.oreilly.com/library/view/learning-go/9781492077206/)* by Jon Bodner — best single book for someone coming from another language; covers interfaces/structs/generics cleanly.

**Phase 4 (Packages & Project Layout)**

- [Go blog: Organizing a Go module](https://go.dev/doc/modules/layout)
- [golang-standards/project-layout](https://github.com/golang-standards/project-layout) (community convention, not official, but widely copied)

**Phase 5 (Goroutines & Channels — the big one)**

- [Go Tour: Concurrency](https://go.dev/tour/concurrency/1)
- [Go blog: Go Concurrency Patterns (Rob Pike, Google I/O talk)](https://go.dev/blog/io2013-talk-concurrency-patterns) — watch the talk, not just the slides.
- Book: *[Concurrency in Go](https://www.oreilly.com/library/view/concurrency-in-go/9781491941294/)* by Katherine Cox-Buday — the definitive concurrency book, read this during/after Week 4.

**Phase 6–7 (Stdlib, Concurrency Patterns)**

- [Go blog: Go Concurrency Patterns: Pipelines and cancellation](https://go.dev/blog/pipelines)
- [Go blog: Context](https://go.dev/blog/context)
- [gophercises](https://gophercises.com/) (free, by Jon Calhoun) — exercise-driven, several map directly onto the project ladder (URL shortener, quiz game, task manager).

**Phase 8 (Web Services)**

- Book/site: *[Let's Go](https://lets-go.alexedwards.net/)* by Alex Edwards — best resource specifically for building a real REST service in idiomatic Go (routing, middleware, DB, sessions).
- [go-chi/chi docs](https://github.com/go-chi/chi) — lightweight router, good stdlib-adjacent middle ground before gin.
- [database/sql tutorial](https://go.dev/doc/database/index) (official).

**Phase 8.5 (Kubernetes & client-go)**

- [kubernetes/client-go](https://github.com/kubernetes/client-go) — the library itself; the `examples/` directory is the best starting point.
- [kubernetes/sample-controller](https://github.com/kubernetes/sample-controller) — read this end to end; it's the canonical reference implementation of the informer/workqueue pattern.
- [The Kubebuilder Book](https://book.kubebuilder.io/) — closest thing to an official curriculum for CRDs, controllers, and webhooks.
- freeCodeCamp — *Build Your Own Kubernetes Operators with Go and Kubebuilder* (full course on the freeCodeCamp.org YouTube channel) — goes deep on informers, caches, finalizers, and idempotency, treating K8s as an SDK rather than just something you deploy to.
- [Kubernetes API Concepts docs](https://kubernetes.io/docs/reference/using-api/api-concepts/) — official reference for watch semantics, resource versions, and the API conventions your controller code will lean on.

**Phase 9 (Testing, Profiling, Observability, Tooling)**

- [Go blog: Profiling Go Programs](https://go.dev/blog/pprof)
- [Go wiki: Table Driven Tests](https://go.dev/wiki/TableDrivenTests)
- [prometheus/client_golang docs](https://github.com/prometheus/client_golang) — official Go client for instrumenting services with Prometheus metrics.
- [OpenTelemetry Go docs](https://opentelemetry.io/docs/languages/go/) — official getting-started guide for tracing/metrics instrumentation.
- Book: *[100 Go Mistakes and How to Avoid Them](https://100go.co/)* by Teiva Harsanyi — read this after you have a few projects done; it'll reframe mistakes you already made.

**Phase 10 (Deployment)**

- [Docker's official Go language guide](https://docs.docker.com/language/golang/)
- [Go blog: Optimizing Go binary size / cross-compilation basics](https://go.dev/doc/install/source#environment) (`GOOS`/`GOARCH` reference)
- [GitHub Actions docs](https://docs.github.com/en/actions) — for wiring the Week 10 policy-gate step into a real pipeline.

**Capstone A (LLM + MCP panel)**

- [Model Context Protocol docs](https://modelcontextprotocol.io/) — spec + concepts, provider-agnostic.
- [modelcontextprotocol/go-sdk](https://github.com/modelcontextprotocol/go-sdk) — the official Go SDK for MCP servers/clients, maintained in collaboration with Google.
- [Ollama API docs](https://github.com/ollama/ollama/blob/main/docs/api.md) — if the local LLMs you're orchestrating run through Ollama.

**Capstone B (K8s controller + webhook)**

- Everything from Phase 8.5, applied end to end.
- [Kubernetes admission webhooks docs](https://kubernetes.io/docs/reference/access-authn-authz/extensible-admission-controllers/) — official reference for validating/mutating webhook configuration.
- [kubernetes-sigs/kubebuilder sample projects](https://github.com/kubernetes-sigs/kubebuilder) — the `docs/book/src` and linked example repos show full working controller + webhook projects.

### If you want structured/paid courses instead of books

- [Boot.dev's Go course](https://www.boot.dev/tracks/backend) — interactive, project-driven, explicitly designed for people switching from another language.
- [Exercism's Go track](https://exercism.org/tracks/go) — free, mentored code exercises with real feedback, good supplement alongside the day-by-day schedule.

## Suggested next step

If Phase 0–7 are already done (per your existing progress), scaffold Phase 8.5
next: install `kubebuilder`, spin up a local `kind` cluster, and start Day 38
(the read-only `client-go` CLI) as the first hands-on rep in the new Kubernetes
phase. Say the word and I'll set that up.