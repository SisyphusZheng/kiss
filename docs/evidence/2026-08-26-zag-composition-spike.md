# Zag Vanilla + Open Props + OpenElement composition spike (#1149)

Evidence record for GitHub issue #1149 (`experiment(ui): prove Zag Vanilla +
Open Props + OpenElement composition`, milestone v0.43.3, **NON-BLOCKING**,
P3). This is a spike: it adds no public Zag adapter, no public API, and no
published-package dependency. All Zag imports resolve only through the
fixture-local import map.

## Baseline and environment

- Commit: `ef3bb277` (`docs(release): align v0.43.2 published anchors`) plus
  unrelated uncommitted #1148/#1146 work in the same tree (untouched by this
  spike; the spike adds only untracked files under the fixture).
- Date: 2026-08-26
- Deno 2.9.0 (aarch64-apple-darwin), Vite 8.0.16, Playwright 1.59.1
- Browsers: Chromium 147.0.7727.15, Firefox 148.0.2, WebKit 26.4
- `@zag-js/combobox@1.43.3`, `@zag-js/vanilla@1.43.3` (locked in
  `packages/adapter-vite/__fixtures__/request-time/deno.lock`)
- Open Props: consumed the way this repo already consumes it — the vendored
  token sheet in `packages/ui/src/open-props-tokens.css`. The request-time
  fixture deliberately does not depend on `@openelement/ui`, so the spike's
  island stylesheet mirrors a subset of those token values and exposes
  `--oe-*` semantic aliases (`--oe-bg-surface`, `--oe-text`, `--oe-border`,
  `--oe-accent`, `--oe-highlight-bg`, …). No `open-props` npm package was
  added.

## What was built (method)

One representative combobox, three fixture files plus a route and a spec, all
under `packages/adapter-vite/__fixtures__/request-time/`:

- `app/components/zag-combobox-shared.tsx` — the imperative wiring:
  `VanillaMachine(combobox.machine, …)` with `getRootNode` configured per
  variant, `machine.subscribe(() => spreadProps(part, api.get*Props()))`
  in-place part updates, `machine.start()` after OpenElement activation,
  deterministic `stop()` (unsubscribe + spread cleanups + `machine.stop()`),
  consumer-owned typeahead filtering via `updateProps({ collection })`.
- `app/islands/zag-combobox.tsx` — shadow/DSD island (`ssr: true, dsd:
  true`); machine starts in `onDsdHydrated`/`onCsrRendered`, stops in
  `disconnectedCallback`. Open Props/`--oe-*` sheet via `static styles`.
- `app/islands/zag-combobox-light.tsx` — `renderMode = 'light'` island
  (`ssr: true`, no DSD); tokens SSR'd as a `<style>` node since light mode
  applies no static styles.
- `app/routes/combobox.tsx` — `/combobox` request-time page: two shadow
  islands (`machine-id` shadow-a/shadow-b), one light island inside a native
  unenhanced `<form method="post">`, plus a `#move-target` container.
- `e2e/zag-combobox.spec.ts` — 9 tests, run on all three browsers.
- `deno.json` (fixture-local) — the only place Zag versions are named; it
  also mirrors the root fmt/lint/compiler options so repo-wide gates behave
  identically inside the fixture subtree. `deno.lock` (fixture-local) pins
  the resolved tree.

The island client pipeline imports npm packages without any adapter change:
`open:deno-import-map-resolve` defers `npm:` targets to Vite, which resolves
`@zag-js/*` from the fixture's `node_modules` (materialized with
`nodeModulesDir: "auto"` + `deno cache` of the app files — see the command
list; do **not** run bare `deno install` in the fixture, which installs the
whole workspace graph including a second Playwright copy that breaks the e2e
runner with a dual-instance conflict). The fixture config excludes `e2e/` so
spec files keep resolving `@playwright/test` from the root workspace — the
same module instance as the Playwright CLI.

## Verdict matrix (issue checklist)

| #  | Evidence item                                                                    | Verdict                                                             | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Server-side Zag import touches no browser globals                                | **PASS**                                                            | `deno eval` import probe (fixture config): after importing both packages, `document in globalThis === false` (Deno's own `navigator` exists regardless). Additionally the fixture build inlines Zag into `dist/server/index.js` and `GET /combobox` returns 200 with rendered markup — the server imported and executed the modules.                                                                                                                            |
| 2  | SSR output readable and form-meaningful before JS                                | **PASS**                                                            | Raw-HTML assertions (label text, `<ul>`/`<li>` items, `<input name="fruit">` inside the form, two DSD templates, `data-oe-light` marker) + a `javaScriptEnabled: false` browser test: light input visible, named, 5 items rendered.                                                                                                                                                                                                                             |
| 3  | ShadowRoot scoping: two instances do not collide                                 | **PASS**                                                            | Two `zag-combobox` islands on one page; typing+selecting 'Banana' in shadow-a leaves shadow-b closed, empty, and unqueried (each machine's `getRootNode` is its own island ShadowRoot; per-machine id scoping verified via distinct generated ids).                                                                                                                                                                                                             |
| 4  | Light-mode qualification composes with ADR-0142 (#1148)                          | **PASS**                                                            | Modeled on `www/e2e/light-mode-activation.spec.ts`: the light island chunk is held while the user types `typed-before-upgrade` and focuses the input; after release, identical host/input nodes, preserved value and focus, no shadow root, no hydration-mismatch diagnostic, and the machine binds to the surviving DOM (full keyboard select works). One composition seam was required, see Finding F1.                                                       |
| 5  | Keyboard nav, typeahead, Escape, blur, focus restoration, disabled options, ARIA | **PASS (ARIA contract)** / **INCONCLUSIVE (literal screen reader)** | Playwright: role/aria-autocomplete/aria-expanded/aria-controls/aria-activedescendant/aria-disabled assertions; typeahead filtering; ArrowDown highlight + Enter select; focus returns to the input after selection (deep active-element check); Escape closes; blur via outside click closes; disabled Cherry carries `aria-disabled`/`data-disabled` and a dispatched click selects nothing (Zag's `itemState.disabled` guard). No real screen reader was run. |
| 6  | Disconnect/reconnect and same-turn DOM move duplicate nothing                    | **PASS**                                                            | Same-turn `appendChild` move and a later-task remove/re-append each restart the machine exactly once; one selection gesture after each lifecycle event increments the per-instance `onValueChange` counter by exactly 1 (1 → 2 → 3 across the whole test).                                                                                                                                                                                                      |
| 7  | Controlled prop updates and form submission semantics                            | **PASS**                                                            | `machine.updateProps({ value: ['mango'], inputValue: 'Mango' })` reaches machine state (snapshot: value/valueAsString/inputValue all reflect mango) and the DOM input repaints on the next machine transition (Finding F2). Form: selecting 'Orange' in the light island and submitting the native unenhanced form POSTs `fruit=Orange` (303 PRG to `/combobox?selected=Orange`).                                                                               |
| 8  | Dependency and client-bundle cost                                                | **PASS (recorded)**                                                 | See "Bundle cost" below: 2 direct deps, 18 npm packages total; combobox island chunk 102,009 B minified / 32,413 B gzip.                                                                                                                                                                                                                                                                                                                                        |
| 9  | Exercised in nextCrm                                                             | **INCONCLUSIVE**                                                    | nextCrm is an external private repository, unavailable to this spike. Not faked; per the issue's discipline this item stays open.                                                                                                                                                                                                                                                                                                                               |
| 10 | PASS/FAIL/INCONCLUSIVE with versions and commands                                | **PASS**                                                            | This document.                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

### Commands

```sh
# dependency materialization (fixture-local import map only)
cd packages/adapter-vite/__fixtures__/request-time && deno cache \
  app/islands/zag-combobox.tsx app/islands/zag-combobox-light.tsx \
  app/components/zag-combobox-shared.tsx app/routes/combobox.tsx

# build + full 3-browser e2e gate (includes the 9 new spike tests)
deno task fixture:request-time:gate          # 213 passed (36.5s)

# spike spec alone, all browsers
no_proxy=127.0.0.1,localhost deno run -A npm:@playwright/test@1.59.1 test \
  --config packages/adapter-vite/__fixtures__/request-time/e2e/playwright.config.ts \
  zag-combobox.spec.ts                        # 27 passed (9 × 3 browsers)

# hygiene on new/changed files
deno fmt --check packages/adapter-vite/__fixtures__/request-time/   # clean
deno lint packages/adapter-vite/__fixtures__/request-time/{app,e2e} # clean
cd packages/adapter-vite/__fixtures__/request-time && deno check \
  app/components/zag-combobox-shared.tsx app/islands/zag-combobox.tsx \
  app/islands/zag-combobox-light.tsx app/routes/combobox.tsx          # clean
deno check \
  packages/adapter-vite/__fixtures__/request-time/e2e/zag-combobox.spec.ts # clean (root workspace config governs e2e/)

# pre-existing parity suite
no_proxy=127.0.0.1,localhost deno test --allow-read --allow-write --allow-env \
  --allow-run --allow-ffi --allow-net=127.0.0.1,localhost \
  packages/adapter-vite/__tests__/request-time-parity.test.ts       # 1 passed (23 steps)
```

## Bundle cost (item 8)

From `dist/client/islands/` of the fixture build (oxc-minified):

| Chunk                            |       Raw |     gzip | Notes                                                                                    |
| -------------------------------- | --------: | -------: | ---------------------------------------------------------------------------------------- |
| `client.js` (entry)              |  11,273 B |  4,101 B | island scheduler + enhance layer                                                         |
| `island-live-counter-*.js`       |  43,889 B | 14,980 B | pre-existing baseline (carries the shared OpenElement client runtime)                    |
| `island-zag-combobox-*.js`       | 102,009 B | 32,413 B | **all Zag code for both combobox islands** (rollup co-locates the shared Zag graph here) |
| `island-zag-combobox-light-*.js` |   1,017 B |    602 B | light variant; imports the Zag chunk                                                     |

Marginal client cost of one Zag combobox island over the counter baseline:
≈ +58 KB minified / +17.4 KB gzip on first load of the Zag chunk, then ~1 KB
per additional Zag island variant sharing it.

Dependency count: 2 direct deps resolve to **18 npm packages** total — 14
`@zag-js/*` (combobox, vanilla, core, dom-query, collection, popper,
dismissable, interact-outside, live-region, focus-visible, anatomy, store,
types, utils), 3 `@floating-ui/*` (core 1.8.0, dom 1.8.0, utils 0.2.12), and
`proxy-compare@3.0.1`.

## Findings (glue assessment)

The composition works with one ~200-line shared wiring module. Three real
seams were found; none required framework changes, and none is "excessive
glue" in the issue's sense, but all three belong in any future adapter
contract:

- **F1 — focus predating the machine (ADR-0142 seam).** In-place activation
  preserves a focus that existed before the island chunk loaded, so no
  `focus` event ever reaches the machine; Zag's `idle` state has no
  `INPUT.CHANGE` transition, so typing would be dead until the user
  re-focuses. The binding syncs reality at start: if the input is already
  the scope's active element, it sends `INPUT.FOCUS` once. Three lines, but
  load-bearing — any hydration-preserving adapter needs an equivalent.
- **F2 — controlled updates do not repaint the input synchronously.** Zag
  spreads `defaultValue` (not live `value`) onto the input; the visible text
  follows `inputValue` only on the machine's next `syncInputValue`
  transition (open/close/select). Controlled updates therefore must set
  `value` + `inputValue` together, and DOM assertion must wait for a
  transition. This is Zag's machine-owns-the-input design, not a spike bug.
- **F3 — typeahead filtering is consumer-owned.** A static collection never
  filters; the binding swaps in a filtered collection from
  `onInputValueChange` and hides non-matching SSR'd `<li>` nodes. Expected
  per Zag docs, but it means SSR'd full lists need a hiding rule in the
  wiring.

Also recorded:

- **F4 — engine floor.** `@zag-js/core`'s scope does
  `getRootNode().getElementById(id)`; scoping a machine to a ShadowRoot
  therefore requires `ShadowRoot.getElementById` (verified present in
  Chromium 147, Firefox 148, WebKit 26.4). Older engines would need a
  `getRootNode` wrapper; this spike did not polyfill it.
- **F5 — WebKit + Playwright test-tooling quirk (not a composition defect).**
  WebKit 26.4's `elementsFromPoint` on a doubly-nested DSD shadow root
  returns a stack headed by the outer page host, which fails Playwright's
  actionability hit-test for pointer clicks on the shadow islands' input.
  Singular `elementFromPoint` returns the input correctly and real pointer
  dispatch is unaffected; the affected spec steps use DOM `focus()` /
  keyboard / dispatched click events instead. Clicks one shadow level deep
  (the light island's form controls) work normally in all three browsers.

## What was NOT verified

- No real screen reader was run (item 5's literal screen-reader part).
- nextCrm exercise (item 9) — external private repo unavailable.
- No other Zag machine was tried; per the issue's non-goals this says
  nothing about other machines, and no "all Zag machines are SSR-safe"
  claim is made. SSR-safety evidence covers module import/render of
  `@zag-js/combobox` + `@zag-js/vanilla` only.
- The optional declarative prop-normalizer variant (Zag's lowercased event
  props vs OpenElement's `onClick`/`on-click` markers) was **not** attempted;
  the imperative `spreadProps()` path is the one proven here.
- Popover positioning visuals (floating-ui placement) were not visually
  asserted; content visibility/geometry styling is minimal.
- Pre-hydration click replay into the combobox input (ADR-0142's replay
  path) was not combined with Zag selection; the light test covers typing +
  focus + identity only.

## Outcome-rule mapping (#1150 / v0.44 decision)

Issue outcome rules applied literally:

- Repository spike: **PASS** — the composition works with modest,
  well-understood glue (F1–F3), no adapter changes, and green gates on three
  browsers.
- Item 9 (nextCrm): **INCONCLUSIVE** — external repo unavailable.
- Therefore, per the issue's own rules ("PASS plus nextCrm evidence may
  unlock the linked parked v0.44 follow-up through ADR-0140"), this spike
  alone does **not** unlock #1150 or any v0.44 activation. The recommended
  next step is a nextCrm exercise of the same binding module; if that passes,
  #1150 can be evaluated through ADR-0140 with F1–F3 as known adapter
  contract points. Nothing here blocks v0.43.3 (the issue is NON-BLOCKING).
