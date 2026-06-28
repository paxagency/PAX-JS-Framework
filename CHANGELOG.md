# Changelog

## 1.0.0 — 2026-06-28

First stable release. HTML-first micro framework — no build step required.

### Added
- **`show` / `hide` directives** — toggle visibility from data expressions
- **`attr:*` binding** — bind `src`, `checked`, `class`, `disabled`, and more
- **`load.error` hook** — handle failed ajax requests
- **`destroy` lifecycle** — cleanup when routed apps navigate away
- **Incremental list updates** — `push` / `pop` patch rows instead of full `innerHTML` when possible
- **Documentation site** (`index.html`) — guided path from basics to advanced
- **`pax.version`** — runtime version string
- **ES module build** — `dist/pax.esm.js` and `dist/pax.esm.min.js`
- **TypeScript definitions** — `pax.d.ts`
- **Smoke tests** — `npm test`

### Fixed
- **`getVals(key, ids)`** — reads from the correct app (`values` / `data`)
- **`_mergeApp`** — safely merges `load` and other objects when the app stub lacks them
- Example source panels in docs no longer target wrong `<code>` elements
- Example debug buttons use `pax.print()` for visible output in iframes

### Changed
- **Source of truth** — `src/pax.js` → build → `dist/`
- Package description typo fixed (`Lightweight`)
- npm `files` includes docs and examples

### Notes
- npm package: [pax-js-framework](https://www.npmjs.com/package/pax-js-framework)
- Previous npm releases stopped at `0.0.158` (Dec 2023); this release supersedes that line as **1.0.0**
