---
title: Jenkins tools Binds An Installation Name Not A Version
tags: [jenkins, ci-cd, nodejs, pipeline]
created: 2026-08-19
source: session
---

The string in a declarative `tools` block is an opaque label, not a version constraint. `tools { nodejs 'NodeJS 26.7.0' }` resolves only if an installation named exactly `NodeJS 26.7.0` exists under Manage Jenkins → Tools. Jenkins performs no version resolution whatsoever — a label that looks like a version number is a naming convention and nothing more, and it will happily point at an installation of a different version.

## Why it matters

The pipeline parses successfully and fails later, at tool-resolution time, so the error surfaces well after the syntax has been validated. Worse, the directive is skipped silently under `agent none`: the Jenkins docs state plainly that `tools` "is ignored if `agent none` is specified." A job can then go green while running against whatever toolchain happened to be on the agent's `PATH`.

## Details

```groovy
pipeline {
    agent any

    tools {
        nodejs 'NodeJS 26.7.0'   // must match Manage Jenkins → Tools character for character
    }
    stages {
        stage('install') {
            steps {
                sh 'npm install'
            }
        }
    }
}
```

The effect of the directive is narrow: it prepends the selected installation's folder to `PATH` for the duration of the pipeline.

Core declarative Pipeline supports only three tools — `maven`, `jdk`, and `gradle`. `nodejs` is contributed by the NodeJS plugin, so the block above is a parse error on a controller without that plugin installed.

That the identifier is a name rather than a version is explicit in the plugin's scripted-pipeline form, where the parameter is spelled out:

```groovy
nodejs(nodeJSInstallationName: 'Node 6.x') {
    sh 'npm config ls'
}
```

Scripted pipelines have no `tools` directive and must use this wrapper, or manage `PATH` by hand.

## Related

- [[Case-Only Jenkinsfile Renames Are Invisible On macOS]]
- [[Jenkins Agent Directive Controls Where Stages Execute]]
