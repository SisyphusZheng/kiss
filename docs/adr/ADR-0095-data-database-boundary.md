# ADR-0095: Data / Database Boundary

Status: SUPERSEDED (2026-08-27 by ADR-0143 and the current composition rule)

Date: 2026-06-10

> Historical note: the proposed `@openelement/core/data` package was retired and
> `MemoryDataAdapter` never shipped. Current route loader/action contracts remain in
> App/Element ownership, while database implementations compose through recipes. The
> unimplemented generic adapter is not reintroduced into the 0.44 Element kernel.

## Context

openElement has implicit data patterns (FileIsrCache, MemoryIsrCache, blog-data
generation, i18n loading, nav scanning, route `revalidate`, `isr-manifest.json`)
but no explicit data adapter contract. This leads to:

- ad-hoc filesystem access in ISR cache implementations;
- generated data coupled to Vite plugin lifecycle;
- no standard way to inject a database-backed data source into SSG/SSR.

ADR-0091 mandates "database work enters through data/database boundaries and
recipes, not a built-in ORM." ADR-0093's ISR runtime contract established the
pattern: define a platform-neutral contract with baseline implementations and
keep platform choices at the adapter level.

## Decision

Add a minimal `DataAdapter<T>` contract in `@openelement/core/data`. The
contract defines two methods:

```ts
export interface DataAdapter<T = unknown> {
  name: string;
  get(key: string): Promise<T | undefined>;
  keys?(): Promise<string[]>;
}
```

Provide a single baseline implementation: `MemoryDataAdapter` — zero I/O,
backed by `Map`. It serves as the test/development baseline and the reference
implementation for future adapters.

**FileDataAdapter is deferred** to a recipe level. The framework core must not
import `node:fs`, `Deno.readTextFile`, or any filesystem API. A file-backed
adapter is a natural recipe for build-time data loading.

**Recipe recommendations** (not bundled, not defaults):

- **Drizzle ORM** — Deno-compatible, TypeScript-first, zero runtime deps. Maps
  naturally to `DataAdapter<Row>`.
- **Hono JWT middleware** — Already the API layer. Stateless JWT fits SSG/edge.
  No session store required.

## Consequences

### Positive

- `MemoryDataAdapter` proves the contract is testable without real I/O.
- Existing ISR caches (`FileIsrCache`, `MemoryIsrCache`) remain untouched.
  The data adapter is additive, not a replacement.
- Future database integrations (Drizzle, KV, SQL) can implement `DataAdapter`
  without framework changes.
- The contract imports zero platform APIs — it works in Deno, Node, Bun, Edge.

### Neutral

- `FileDataAdapter` is deferred to recipe. Build-time JSON loading is a solved
  problem; the framework does not need to own it.

### Negative

- Users expecting "batteries included" database support will find a contract
  and a recipe, not a built-in solution. This is intentional.

## Non-Goals

- No built-in ORM. Drizzle is a recommended recipe, not a dependency.
- No built-in auth. Hono JWT is a recommended recipe.
- No migration system.
- No `@openelement/database` package.
- No replacement of `FileIsrCache` or `MemoryIsrCache`.

## Rollback

The `./data` subpath is a new export. Removing it has zero impact on existing
consumers. `MemoryDataAdapter` is self-contained.

## Related

- ADR-0091: Four-Product Platform Roadmap.
- ADR-0093: SSR / ISR Runtime Contract (cache/injection pattern precedent).
- ADR-0094: Core Type Consolidation.
