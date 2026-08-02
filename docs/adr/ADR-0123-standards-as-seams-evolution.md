# ADR-0123: Standards as Seams — Evolution Plan

- Status: PROPOSED (execution begins on the alpha.13 train; review at TP-6)
- Date: 2026-08-02
- Builds on: ADR-0120 (0.42 scope), ADR-0122 (0.42.0 stable freeze proposal),
  ADR-0119 (standards-first precedent)

## Context

The architecture's strongest structural property is that layer seams are
made of standards, not framework-private APIs. Two proven instances:

- **Component seam**: tag names, attributes, DSD. Payoff: third-party Web
  Components compose as page components with zero adapters and survive
  morph updates (`third-party-wc:smoke` gate).
- **Server seam**: `Request → Response` (fetch). Payoff: the generated
  server app runs unchanged under the dev server, the `start` CLI, the e2e
  fixture, and Nitro — and the middleware contract needs no HTTP-framework
  dialect.

This ADR records the systematic extension of that principle: every
remaining custom seam is evaluated against an existing standard, and
custom machinery that a standard makes redundant is scheduled for
elimination. Two rules govern the plan. First, **real standards win over
de-facto ones** (W3C/WHATWG/TC39 > ecosystem conventions); de-facto
standards are acceptable only where no real standard exists. Second,
**nothing in this plan touches the frozen surfaces** — the 0.41.x static
freeze (ADR-0119) and the 0.42 freeze proposal (ADR-0122) are surface
contracts; every item here is an internal/seam change or an additive
option.

Current-state facts established at filing time: Nitro v3.0.0 (fetch-native)
and h3 2.0.1-rc are already in the dependency tree; URLPattern is already
used by the SSG route scanner and element context, while two hand-written
matchers remain (the SPA client router and the generated
`matchRequestTimeRoute`); `import ... with { type: 'json' }` is already in
production use (`packages/ui/src/manifest.ts`); unstorage is present as a
Nitro transitive dependency; the Cache API is unused; `cli/start.ts` and
`cli/preview.ts` are parallel entry points.

## Decision

### Near term — alpha.13 train

1. **Route matching standardizes on URLPattern (WHATWG).** The SPA client
   router's `matchPattern` and the generated `matchRequestTimeRoute`
   collapse onto URLPattern, eliminating the remaining custom pattern
   dialects (the round-6 #812 fix made them compatible; this item deletes
   the dialects). `PageRenderingMode`'s `'auto'` placeholder collapses
   under the same item (#609).
2. **The fetch middleware contract is formalized** as
   `type Middleware = (request: Request, next: () => Promise<Response>) => Promise<Response>`
   (WinterCG shape), executed at the handler boundary so it runs identically
   in dev, `start`, fixtures, and Nitro. Configuration surface:
   `middleware: { corsOrigin, use: [...] }` extending the existing
   `FrameworkOptions.middleware`. HTTP-framework middleware (Hono) remains
   welcome inside user API routes; the framework contract stays
   dialect-free.
3. **nitro-mount is re-evaluated against Nitro v3's fetch-native handler
   shape** and slimmed to the thinnest correct adapter (or removed). The
   translation layer was written against pre-v3 event shapes.
4. **`cli/start` and `cli/preview` merge** into one command with a mode
   flag; one entry, one doc.
5. **The custom ISR runtime is retired, not wired.** `isr-runtime.ts` /
   `MemoryIsrCache` (currently unreachable dead code) is deleted; the 0.44
   ISR contract will be defined on the Cache API instead (item 7).

### Roadmap-recorded — 0.43 / 0.44

6. **Generated data moves to import attributes** (`with { type: 'json' }`),
   replacing the codegen + resolver layer where the data is static. The
   pattern is already proven in-tree (`packages/ui/src/manifest.ts`).
7. **The 0.44 ISR contract uses Cache API semantics**
   (`cache.match(request)` / `cache.put(request, response)`) rather than a
   bespoke cache interface, with Nitro `routeRules`/unstorage evaluated as
   the storage backing — Cache API remains the user-facing contract
   regardless of backing.
8. **Data adapters (#620 MemoryDataAdapter, #629 FileDataAdapter) adopt
   the unstorage interface** as the de-facto KV standard instead of a
   bespoke adapter interface.
9. **Streaming SSR (#626) emits Web `ReadableStream`** end to end; no
   custom chunk protocol.

### Watched decision points (no commitment)

10. **TC39 Signals proposal alignment.** The element signal API shape
    should track the TC39 Signals proposal (`Signal.State` /
    `Signal.Computed`) so a future native landing can be delegated to.
    Evaluation issue only; no API change is promised.
11. **h3 unification decision.** When h3 v2 reaches a stable release
    (currently `2.0.1-rc`), evaluate rewriting the generated server app
    from Hono to h3: dev/prod semantics unify, nitro-mount and the
    request-time parity gate can retire. Constraints recorded: the thin
    fetch middleware contract (item 2) makes this swap invisible to users;
    Hono remains supported in user API routes; the trade-off is
    single-vendor consolidation on UnJS, accepted deliberately if taken.
12. **SPA bootstrap vs island enhance client.** Record the evaluation of
    merging the two client paths into one runtime with two modes. Not
    scheduled.

## Consequences

- Issues are filed for the alpha.13 items (1–5) and the watched items
  (10–11); items 6–9 attach to the existing 0.43/0.44 roadmap entries.
- The request-time parity gate stays until item 11 is executed; it is the
  standing price of the Hono/h3 overlap, paid knowingly.
- The frozen surfaces are untouched: no public API changes are required by
  any item; each alpha.13 item ships with its parity/contract tests first.
- The review checklist for every future seam addition becomes: does a real
  standard exist for this seam; if yes, why are we not using it?
