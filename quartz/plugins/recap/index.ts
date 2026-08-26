// This plugin is component-only (see package.json `quartz.category`), so the
// loader always imports this main entry point for potential side effects —
// see `loadQuartzConfig`'s `isComponentOnly` branch in
// quartz/plugins/loader/config-loader.ts. Recap has none; the real exports
// live under `./components` (RecapCard, plus the plain RecapRail helper
// consumed directly by Homepage.tsx).
export {}
