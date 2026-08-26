#!/usr/bin/env node
// Compiles the Blueprint local plugins' TS/TSX source into plain ESM JS under
// each plugin's dist/, mirroring how @quartz-community/* packages ship
// tsup-compiled dist output.
//
// Why this exists: `npx quartz build` bundles Quartz's own source via esbuild
// (see quartz/cli/handlers.js) and executes the result with plain `node`.
// Local plugin entry points are loaded via a *runtime* `import()` of a
// dynamically-computed path (quartz/plugins/loader/gitLoader.ts's
// getPluginEntryPoint/toFileUrl) — esbuild can't statically bundle a
// computed import target, so that import hits Node's native ESM resolver
// directly, with no TypeScript/extension-less-import support. Raw .ts local
// plugin sources are NOT actually loadable at runtime by the real build
// pipeline (confirmed empirically — `npx tsx` alone masked this because it
// registers a loader hook for the whole process, which the real build does
// not). Each plugin's own relative imports are bundled into one file so
// nothing but real npm packages (preact, @quartz-community/*) stay as
// external `import` statements Node resolves normally from node_modules.
import esbuild from "esbuild"

const targets = [
  { in: "quartz/plugins/directories/index.ts", out: "quartz/plugins/directories/dist/index.js" },
  {
    in: "quartz/plugins/tag-directory/index.ts",
    out: "quartz/plugins/tag-directory/dist/index.js",
  },
  {
    in: "quartz/plugins/tag-directory/components/index.tsx",
    out: "quartz/plugins/tag-directory/dist/components/index.js",
  },
  {
    in: "quartz/plugins/note-siblings/index.ts",
    out: "quartz/plugins/note-siblings/dist/index.js",
  },
  {
    in: "quartz/plugins/note-siblings/components/index.tsx",
    out: "quartz/plugins/note-siblings/dist/components/index.js",
  },
  { in: "quartz/plugins/recap/index.ts", out: "quartz/plugins/recap/dist/index.js" },
  {
    in: "quartz/plugins/recap/components/index.tsx",
    out: "quartz/plugins/recap/dist/components/index.js",
  },
]

for (const t of targets) {
  await esbuild.build({
    entryPoints: [t.in],
    outfile: t.out,
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node22",
    jsx: "automatic",
    jsxImportSource: "preact",
    packages: "external",
    logLevel: "info",
  })
}
console.log(`Compiled ${targets.length} local plugin entry points.`)
