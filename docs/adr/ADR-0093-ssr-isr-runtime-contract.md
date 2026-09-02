# ADR-0093: SSR / ISR Runtime Contract

Status: Superseded — the ISR half of this contract was removed in v0.44
(issue #1217, ADR-0151 release train): no `IsrCache`, no ISR manifest, no
request-time ISR runtime. SSR remains core. Retained as historical record;
any future ISR capability must be re-earned from real evidence (#1221) and
must not assume the contract below.

Former status: Accepted

Date: 2026-06-09

## Context

ADR-0091 makes SSR and ISR framework core capabilities. The repository already
has build-time SSR bundle evidence, Streaming DSD evidence, `IsrCache`,
`MemoryIsrCache`, `FileIsrCache`, route `revalidate`, and `isr-manifest.json`
generation. What was missing was a small request-time runtime contract that can
be used by Deno, Node, Cloudflare, Hono, Express, or a custom server without
selecting one as the product default.

## Decision

Add a platform-neutral ISR runtime contract in `@openelement/core/isr-runtime`.

The contract:

- resolves an `IsrManifestEntry` from path and params;
- checks an injected `IsrCache`;
- serves cache hits as Web `Response` objects;
- renders and stores cache misses through an injected render function;
- serves stale entries with blocking regeneration by default;
- allows background regeneration through an injected scheduler;
- returns `not-found` when the requested route is not in the ISR manifest.

This is not a server adapter. It does not depend on Hono, Express, Cloudflare,
Deno KV, Node APIs, Vite, or filesystem access.

## Consequences

- Request-time ISR now has a testable core contract.
- Server adapters can wrap the contract without redefining cache semantics.
- Memory and file caches remain baseline implementations.
- Cloudflare KV, Deno KV, D1, database-backed caches, and other backends stay
  future adapters or recipes.
- AutoFlow may check manifest/cache/report evidence, but it must not choose a
  hosting provider or default cache backend.

## Non-Goals

- No new hosting default.
- No built-in database, ORM, auth, or session layer.
- No replacement guarantee for Hono/Express/Node/Deno in this version.
- No package split before the v0.38 product surface reset.
