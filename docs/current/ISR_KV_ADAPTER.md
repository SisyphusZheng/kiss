# ISR KV Adapter — self-build contract (multi-instance / edge)

> Status: **experimental, 0.42.** ISR is not wired into the 0.42 request-time
> server entry (see `docs/current/VERSION_PLAN.md` → "ISR status (0.42)"). This
> document is the forward-compatibility contract for teams that want to run ISR
> at the edge once it is enabled (targeting **0.44**). The in-box
> `MemoryIsrCache` is intentionally single-instance only.
>
> **Not importable on 0.42:** the ISR runtime named below
> (`renderIsrResponse`, `findIsrManifestEntry`, `IsrRuntimeCache`,
> `MemoryIsrCache`, `isIsrRouteConfig`) lives in
> `packages/element/src/internal/` and is **not** forwarded by any public
> export entry of `@openelement/element` on the 0.42 line, so application
> code cannot import it. Only the `IsrCacheEntry` / `IsrCacheResult` /
> `CacheEntry` **types** are public (`@experimental`). The runtime is
> scheduled to be wired and exposed with the 0.44 ISR work; treat the
> `renderIsrResponse` wiring instructions below as the 0.44 contract, not a
> 0.42 how-to.

## Why a KV adapter is required

`MemoryIsrCache` (`packages/element/src/internal/core/isr.ts`) is an in-process
LRU. Under multi-instance or edge deployment it has two structural gaps:

1. **No cross-instance invalidation.** After a successful `action` POST, the
   stale HTML in instance B is never purged — `CacheAdapter.purgeTag` is
   unimplemented (the interface declares it in
   `packages/element/src/internal/protocol/isr.ts` but no adapter provides it).
2. **No shared cache.** Instance A's regenerated entry is invisible to instance B,
   so the same URL can serve two different versions.

Until a KV-backed adapter exists, ISR at the edge is unsafe. Build your own
against the contract below, or wait for the 0.44 reference implementation
(ADR-0038 promised `DenoKvIsrCache` / `CfKvIsrCache`).

## The contract to implement

The ISR runtime (`renderIsrResponse`,
`packages/element/src/internal/core/isr-runtime.ts`) expects a cache shaped like
`MemoryIsrCache`:

```ts
import type { IsrCacheEntry, IsrCacheResult } from '@openelement/element';

export interface IsrKvCache {
  /** Returns hit/stale/miss/error for `key` evaluated at time `now` (epoch ms). */
  get(key: string, now: number): Promise<IsrCacheResult>;
  /** Store a rendered entry. */
  set(key: string, entry: IsrCacheEntry): Promise<void>;
  /** Drop a single key (optional). */
  delete?(key: string): Promise<void>;
  /**
   * Invalidate every key carrying `tag` across ALL instances. The ISR runtime
   * never calls this — `renderIsrResponse` only reads and writes entries. It
   * is the host's responsibility to call `purgeTag` after a successful action
   * write; doing so is what makes multi-instance deployment safe.
   */
  purgeTag(tag: string): Promise<number>;
}
```

`IsrCacheEntry` is `{ html: string; createdAt: number; revalidate: number; headers?: Record<string,string> }`
(`packages/element/src/internal/protocol/isr.ts`, re-exported from
`@openelement/element` as an `@experimental` type). It carries **no `tags`
field** — cache tags live on the generic `CacheEntry` contract
(`{ value, createdAt, revalidate?, tags? }`) in the same module. The runtime
computes `stale` when `now - createdAt >= revalidate * 1000`.

## Worked example — Deno KV

A reference `DenoKvIsrCache` implementing the contract, with a tag index for
cross-instance `purgeTag`. Deno KV is an unstable API: type-checking the
`Deno.Kv` type needs the `deno.unstable` lib (or `--unstable-kv` at runtime):

```ts
import type { CacheEntry, IsrCacheEntry, IsrCacheResult } from '@openelement/element';

// IsrCacheEntry has no `tags` field; the KV adapter persists the route's cache
// tags (shaped like CacheEntry['tags']) alongside the entry so purgeTag can
// reach the key from any instance.
type KvIsrEntry = IsrCacheEntry & Pick<CacheEntry, 'tags'>;

export class DenoKvIsrCache {
  #kv: Deno.Kv;
  constructor(kv: Deno.Kv) {
    this.#kv = kv;
  }

  async get(key: string, now: number): Promise<IsrCacheResult> {
    const entry = (await this.#kv.get<KvIsrEntry>(['isr', key])).value;
    if (!entry) return { state: 'miss' };
    const ageSeconds = Math.max(0, Math.floor((now - entry.createdAt) / 1000));
    if (ageSeconds >= entry.revalidate) return { state: 'stale', entry };
    return { state: 'hit', entry };
  }

  async set(key: string, entry: KvIsrEntry): Promise<void> {
    await this.#kv.set(['isr', key], entry);
    // Maintain the tag index so purgeTag can reach this key from any instance.
    for (const tag of entry.tags ?? []) {
      await this.#kv
        .atomic()
        .mutate({ type: 'set', key: ['isr', 'tag', tag, key], value: true })
        .commit();
    }
  }

  async delete(key: string): Promise<void> {
    await this.#kv.delete(['isr', key]);
  }

  async purgeTag(tag: string): Promise<number> {
    let count = 0;
    const prefix = ['isr', 'tag', tag];
    for await (const res of this.#kv.list({ prefix })) {
      const key = res.key[res.key.length - 1] as string;
      await this.#kv.delete(['isr', key]);
      await this.#kv.delete(res.key);
      count++;
    }
    return count;
  }
}
```

Wire it by passing an instance as the `cache` option to `renderIsrResponse`
once ISR is enabled in the request-time entry and the runtime is exposed
through the public export surface (0.44 target — see the status note above).
Two responsibilities stay with the host, not the runtime:

- **Persisting tags.** `IsrCacheEntry` has no `tags` field; store your route's
  cache tags alongside the entry (the `KvIsrEntry` intersection above) so the
  tag index stays populated.
- **Calling `purgeTag`.** `renderIsrResponse` never calls `purgeTag`. After a
  successful action write, the host invokes `purgeTag` with the affected tags
  to invalidate stale HTML across all instances.

## Deployment prerequisite (until 0.44)

Treat a KV adapter as a **deployment prerequisite** for ISR, not an optional
extra: without `purgeTag`, a published action can leave every edge node serving
stale HTML indefinitely. Single-instance (`deno task start`, one process) is
the only safe 0.42 topology, and even there ISR is inert until wired.
