# ADR-0038: ISR + Edge KV Architecture

> **Status**: SUPERSEDED — ISR was removed from the codebase in v0.44
> (issue #1217, ADR-0151 release train). This ADR is retained as historical
> record only; none of the contracts named below exist anymore. Any future
> ISR/cache capability must be re-earned from real evidence (#1221) and must
> not assume this API.
>
> **Former status**: ACCEPTED
> **Date**: 2026-05-23
> **Supersedes**: ADR-0033 (renderer timing independence — confirmed)
> **Applies to**: v0.21 (contract) → v0.22 (production implementation)

## Context

v0.21 defined the ISR cache contract (`IsrCache`, `MemoryIsrCache`, `isr-manifest.json`).
The initial implementation included a TCP Redis adapter (`RedisIsrCache`) using raw RESP
protocol — a mistake.

LessJS targets edge-first deployment (Cloudflare Workers, Deno Deploy). TCP connections
are not available on Cloudflare Workers, and Deno has `Deno.openKv()` natively. Redis is
an unnecessary infrastructure dependency for a framework whose primary selling point is
zero-runtime static output.

## Decision

1. **Redis adapter deleted from codebase.** The RESP-based `RedisIsrCache` was removed.
2. **IsrCache interface remains the single contract.** `MemoryIsrCache` is the reference
   implementation for dev/tests.
3. **Production adapters go in v0.22**, targeting the platforms LessJS actually runs on:

| Platform            | Adapter                               | Backend                    |
| ------------------- | ------------------------------------- | -------------------------- |
| Cloudflare Workers  | `CfKvIsrCache`                        | Workers KV (`KVNamespace`) |
| Deno Deploy / Deno  | `DenoKvIsrCache`                      | `Deno.openKv()`            |
| Self-hosted / Redis | `RedisIsrCache` (optional, community) | Redis via `ioredis`        |

4. **The adapter pattern enables platform-native TTL** without framework-level timer
   management. CF KV `expirationTtl` and Deno KV `expireIn` both match ISR's
   `revalidate` semantics exactly.

## Architecture

```
Route exports revalidate: 60
        ↓
Build writes isr-manifest.json
        ↓
Edge handler (CF Worker / Deno)
        ↓
IsrCache.get(cacheKey)
   ├─ miss  → renderDsd(tagName, component, props)
   │          → cache.set(key, { html, revalidate: 60 })
   │          → return fresh HTML
   ├─ hit   → return cached HTML
   ├─ stale → return cached HTML + trigger async regeneration
   └─ error → return last good HTML or 500
```

The key insight from ADR-0033: `renderDsd()` is timing-independent. Whether called at
build time (SSG) or request time (ISR regeneration), the output is identical. ISR is
not "adding SSR" — it is reusing the same renderer behind an HTTP endpoint.

## Why Not Redis?

| Concern             | CF Workers               | Deno Deploy               |
| ------------------- | ------------------------ | ------------------------- |
| TCP availability    | ❌ No raw TCP            | ✅ via `Deno.connect`     |
| KV alternative      | ✅ Workers KV            | ✅ `Deno.openKv()`        |
| Global distribution | ✅ KV is edge-replicated | ✅ Deno KV (FoundationDB) |
| TTL                 | ✅ `expirationTtl`       | ✅ `expireIn`             |
| Cold start          | ✅ API call, no connect  | ✅ API call, no connect   |

Redis is appropriate for self-hosted deployments but should not be the default.
A community-maintained `RedisIsrCache` can exist as an optional adapter.

## Consequences

### Positive

- Framework aligns with deployment targets actually used (CF Workers, Deno).
- No TCP dependency or connection management code in core.
- Each platform adapter is ~20 lines — the `IsrCache` interface is the right abstraction.

### Negative

- Redis users need to bring their own adapter (or use a community package).
- `DenoKvIsrCache` requires Deno 2.x+ (KV is stable since 2.0).
- ISR production handler still needs to be built (v0.22 scope).

## Related

- ADR-0033: Renderer Kernel — timing-independent `renderDsd()`
- ADR-0035: SSG Admission — client-only island exclusion (v0.20)
- ADR-0036: Ocean-Island Architecture (v0.20)
- ADR-0037: DSD-First Strategic Boundary (v0.20)
- v0.21 changelog: ISR contract + build manifest
- v0.22 roadmap: Production ISR handler + KV adapters + Showcase
