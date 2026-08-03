# Design note: RFC 9110 conditional requests for the 0.44 ISR contract

> Issue: #866 (ADR-0123 addendum item 16). Design only — **no implementation
> on the alpha.13 train**; ISR stays inert on 0.42 (VERSION_PLAN "ISR status
> (0.42)"). Pairs with ADR-0123 item 7 (Cache API as the 0.44 ISR contract)
> and item 2 / #858 (fetch middleware seam). Supersedes no 0.42 behavior.

## Problem

The 0.44 ISR layer needs revalidation semantics: when a cached page is
stale, how do client, cache and origin agree on whether the bytes actually
changed? The ADR-0123 rule applies — a real standard exists, so no bespoke
staleness protocol: **RFC 9110 conditional requests** (ETag /
`If-None-Match`) on top of the **Cache API** contract.

## The seams this lands on (current facts)

- The generated server entry emits every request-time response with
  `Cache-Control: no-store` (ADR-0121, #550 —
  `packages/adapter-vite/src/internal/ssg/entry-render-helpers.ts`); action
  POST responses add `Vary: x-openelement-action`. This default is frozen
  (ADR-0122 §2) and does not change: conditional caching applies **only** to
  GET routes that declare `revalidate`, once 0.44 wires it.
- The build already emits `isr-manifest.json` recording each route's
  `revalidate` seconds (inert forward-compat data on 0.42).
- #858 formalizes the middleware seam as
  `(request: Request, next: () => Promise<Response>) => Promise<Response>`
  executed at the handler boundary — the ISR/conditional layer is exactly
  such a wrapper around the generated GET handler, identical in dev,
  `start`, fixtures and Nitro.
- The bespoke `MemoryIsrCache`/`IsrKvCache` contract
  (`docs/current/ISR_KV_ADAPTER.md`) is retired, not wired (ADR-0123 item 5,
  #860); the Cache API replaces it.

## Mapping

**Validators.** A rendered page is byte-deterministic per (route, loader
data), so the origin emits a **strong ETag** — a content hash of the
response bytes (RFC 9110 §8.8.3). `Last-Modified` alone is too coarse for
sub-second re-render cycles; if it is emitted at all, `If-None-Match` takes
precedence over `If-Modified-Since` anyway (§13.1.2, §13.2.1), so ETag is
the only validator the contract depends on.

**Request flow** (GET/HEAD only — action POSTs stay `no-store` + `Vary` and
never enter this path):

1. `cache.match(request)` (Cache API; key is the URL, honoring `Vary` once
   one exists on GET).
2. **Fresh hit** (`age < revalidate`): serve the stored `Response` — its
   ETag/Cache-Control headers ride along unchanged.
3. **Stale hit**: compare the request's `If-None-Match` against the stored
   ETag first. Match → **304 Not Modified** carrying `ETag`,
   `Cache-Control` and `Vary` (the §15.4.5 set a 200 would have sent) — the
   client already holds the bytes, so no re-render happens. No match →
   re-render, hash the bytes, `cache.put(request, response)` with the new
   strong ETag, return 200.
4. **Miss**: re-render, store, 200 as above.

Step 3 is the payoff: a stale entry whose bytes are still current answers
304 without re-rendering, and a re-render that produces identical bytes
reuses the same ETag, so the _next_ conditional request still short-circuits.

**routeRules pairing (deployment backing).** Nitro `routeRules` is the
deploy-time expression of the same per-route policy (e.g.
`/blog/**` → `isr: 60`), mapping one-to-one onto the `revalidate` entries
the build already records in `isr-manifest.json`. Backing store per target:
unstorage under Node/self-host, `caches.default` (CacheStorage) under
Workers. Per ADR-0123 item 7, **Cache API stays the user-facing contract
regardless of backing** — routeRules/unstorage are plumbing, not surface.

## Invariants and open questions

- Frozen surfaces untouched: the CSRF default, the action error algebra,
  the morph client contract and the `no-store` default for non-ISR routes
  are all unchanged; this note adds semantics only to routes that opt into
  `revalidate` at 0.44.
- Stale-while-revalidate (serve stale, re-render in background via
  `executionCtx.waitUntil`) is a compatible extension over the same flow;
  deferred to the 0.44 implementation decision.
- **Open question for 0.44:** the enhanced (fetch) navigation path must
  decide whether framework-issued GETs send `If-None-Match` — a 304
  reaching `fetch()` is not transparently unwrapped like a browser
  navigation, so either the framework client skips conditional headers or
  the entry answers 200 to negotiated framework requests. Recorded here so
  the 0.44 design does not discover it late.
