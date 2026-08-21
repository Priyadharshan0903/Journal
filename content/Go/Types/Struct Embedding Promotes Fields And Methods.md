---
title: Struct Embedding Promotes Fields And Methods
tags: [go, structs, composition, embedding]
created: 2026-08-19
source: session
---

Embedding a struct — writing the type with **no field name** — promotes the
inner type's fields and methods onto the outer type. The syntactic tell is
subtle: `Shape` on its own line embeds, while `Shape,` in a comma-separated
group declares a plain field named `Shape` of whatever type follows, which
silently costs you every promoted method.

## Why it matters

The comma version still compiles as a struct declaration; the failure appears
later at the call site as `b.Describe undefined`, which reads like a missing
method rather than a one-character declaration bug. Embedding is also the
closest thing Go has to `extends`, so it is where inheritance habits land — but
it is composition: there is no supertype, and the outer type is not substitutable
for the inner one.

## Details

```go
type Shape struct{ Name string }

func (s Shape) Describe() { fmt.Println("This is", s.Name) }

type Box struct {
	Shape         // embedded: no field name, no comma
	Width, Height float64
}

b := Box{Shape: Shape{Name: "Box"}, Width: 4, Height: 3}

b.Describe()                 // promoted method — Box never declares it
fmt.Println(b.Name)          // promoted field — shorthand for b.Shape.Name
fmt.Println(b.Shape.Name)    // explicit path always works
```

The embedded field's name *is* its type name, which is why the literal sets it
as `Shape:`.

The trap — a trailing comma turns it into an ordinary field:

```go
type Box struct {
	Shape,        // now: a float64 field named Shape
	Width, Height float64
}
```

```
./main.go:18:4: b.Describe undefined (type Box has no field or method Describe)
```

Shadowing follows the outer-wins rule: if `Box` declares its own `Describe()`,
it takes precedence and the embedded one stays reachable at `b.Shape.Describe()`.
Promotion is resolved at compile time by depth — it is not virtual dispatch, so
`Shape`'s own methods calling `Describe()` still call `Shape.Describe`, never
`Box`'s override. That is the concrete difference from class inheritance.

Embedding an interface works the same way and is how partial implementations are
built: embed `io.Reader` in a struct and the struct satisfies `io.Reader`,
delegating to whatever was assigned — panicking at runtime if it is nil.

## Related

- [[Go From JavaScript - Where Each Analogy Breaks]]
- [[An io.Reader Is Drained By Its First Read]]
