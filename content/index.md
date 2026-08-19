---
title: Hi, I'm Priyadharshan
description: Notes on Go, Jenkins, and platform engineering — written down the day I learned them.
---

<p class="hero">
I'm a platform engineer, and this is my second brain: short, self-contained notes about the
things that didn't work the first time — Go concurrency, CI pipelines, and the small details
that only show up once you've been bitten by them.
</p>

Every note here is one idea, written the day I hit it. They're deliberately narrow, and
most of them exist because the docs were technically correct but didn't say the part that
actually mattered.

## 🧠 What's in here

<div class="card-grid">
  <a class="card" href="./go/">
    <span class="card-title">Go</span>
    <span class="card-desc">Concurrency, interfaces, and composition — mostly the places where an intuition from another language quietly breaks.</span>
  </a>
  <a class="card" href="./jenkins/">
    <span class="card-title">Jenkins</span>
    <span class="card-desc">Pipeline behaviour that isn't obvious from the Jenkinsfile you're looking at.</span>
  </a>
  <a class="card" href="./tags/">
    <span class="card-title">All tags</span>
    <span class="card-desc">Browse the whole vault by topic instead of by folder.</span>
  </a>
</div>

## 📝 Start here

<div class="card-grid">
  <a class="card" href="./go/an-unbuffered-channel-is-a-rendezvous-not-a-queue">
    <span class="card-title">An Unbuffered Channel Is A Rendezvous, Not A Queue</span>
    <span class="card-desc">Why a send blocks even though nothing looks full.</span>
  </a>
  <a class="card" href="./go/when-main-returns-go-kills-every-goroutine-mid-flight">
    <span class="card-title">When main Returns, Go Kills Every Goroutine Mid-Flight</span>
    <span class="card-desc">No graceful shutdown, no warning — the work just stops.</span>
  </a>
  <a class="card" href="./go/an-io.reader-is-drained-by-its-first-read">
    <span class="card-title">An io.Reader Is Drained By Its First Read</span>
    <span class="card-desc">The second consumer gets nothing, and no error tells you so.</span>
  </a>
  <a class="card" href="./go/sync-waitgroup-go-skips-done-when-f-panics">
    <span class="card-title">sync.WaitGroup.Go Skips Done() When f Panics</span>
    <span class="card-desc">A panic in a worker turns into a hang somewhere else entirely.</span>
  </a>
  <a class="card" href="./go/struct-embedding-promotes-fields-and-methods">
    <span class="card-title">Struct Embedding Promotes Fields And Methods</span>
    <span class="card-desc">It looks like inheritance right up until it doesn't.</span>
  </a>
  <a class="card" href="./go/go-from-javascript---where-each-analogy-breaks">
    <span class="card-title">Go From JavaScript: Where Each Analogy Breaks</span>
    <span class="card-desc">An index of the mental models that transfer, and the ones that mislead.</span>
  </a>
</div>

## 🔧 From the pipeline side

<div class="card-grid">
  <a class="card" href="./jenkins/case-only-jenkinsfile-renames-are-invisible-on-macos">
    <span class="card-title">Case-Only Jenkinsfile Renames Are Invisible On macOS</span>
    <span class="card-desc">Git tracked the rename; the filesystem pretended nothing happened.</span>
  </a>
  <a class="card" href="./jenkins/jenkins-tools-binds-an-installation-name-not-a-version">
    <span class="card-title">Jenkins tools Binds An Installation Name, Not A Version</span>
    <span class="card-desc">The version you pinned isn't necessarily the one you get.</span>
  </a>
</div>

## 🚀 What I'm working towards

I'm working through a [Go and platform engineering roadmap](./platform-engineer-roadmap---golang)
— Go, Kubernetes, and distributed systems, built by breaking things rather than reading about
them. Most notes here are fallout from that.

<div class="link-row">
  <a class="link-chip" href="https://github.com/Priyadharshan0903">GitHub</a>
</div>
