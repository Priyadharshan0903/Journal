---
title: An io.Reader Is Drained By Its First Read
tags: [go, io, interfaces, streams]
created: 2026-08-19
source: session
---

An `io.Reader` is a one-shot stream, not a buffer. Once a function reads it to
EOF, every later read returns **zero bytes and a nil error** — so passing the
same reader to two consumers silently gives the second one nothing. There is no
rewind on the interface: `io.Reader` has exactly one method, `Read`.

## Why it matters

The failure is silent. The second consumer's `err != nil` check passes, so the
bug looks like empty input rather than a misuse of the stream, and it surfaces
as a blank field or an empty body far from the cause.

```go
func hashAndBroadcast(r io.Reader) error {
	b, err := io.ReadAll(r) // drains r
	if err != nil {
		return err
	}
	fmt.Println(hex.EncodeToString(sha1.Sum(b)[:])) // real hash
	return broadCast(r)                             // r is now empty
}

func broadCast(r io.Reader) error {
	b, err := io.ReadAll(r) // len(b) == 0, err == nil
	fmt.Println("string of the bytes:", string(b))
	return err
}
```

Output — the hash computes, then the payload is gone, with no error anywhere:

```
c25b760c946dca7184f1a80cba6b8a8d39876ed2
string of the bytes:
```

## Details

Three ways out, in order of preference:

```go
// 1. Read once, pass the bytes. Simplest when the payload fits in memory.
b, err := io.ReadAll(r)
hash(b)
broadcast(b)

// 2. Tee: fan the stream out while reading it, for a single pass over
//    data you don't want to buffer twice.
var buf bytes.Buffer
hash(io.TeeReader(r, &buf))
broadcast(&buf)

// 3. Ask for a seeker when the caller can supply one (files, bytes.Reader).
//    io.Reader alone cannot rewind; io.ReadSeeker can.
func hashAndBroadcast(r io.ReadSeeker) error {
	// ... read ...
	_, err := r.Seek(0, io.SeekStart)
}
```

Note that `bytes.NewReader(payload)` *can* be rewound — but only because the
concrete type has `Seek`. Once it is passed as an `io.Reader`, that capability
is invisible to the callee. This is the cost of accepting the narrow interface,
and usually still the right trade: accept `io.Reader`, read it once.

`ioutil.ReadAll` is deprecated since Go 1.16 — use `io.ReadAll`.

## Related

- [[Go From JavaScript - Where Each Analogy Breaks]]
- [[Struct Embedding Promotes Fields And Methods]]
