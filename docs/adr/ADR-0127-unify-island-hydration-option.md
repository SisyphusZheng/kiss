# ADR-0127: Unify Island Hydration Option Name (`strategy` → `hydrate`)

- Status: ACCEPTED (implemented on the v0.42.0-alpha.16 train, #920)
- Date: 2026-08-13
- Amends: ADR-0119 freeze surface (element `IslandOptions`)

## Context

The island hydration option had two names for one concept:

- `@openelement/element` `defineIsland(tag, Ctor, options)` took
  `IslandOptions.strategy?: HydrationStrategy`
  (`packages/element/src/internal/protocol/island.ts`).
- `@openelement/app` `defineIslandConfig({ ... })` and `defineIsland(...)`
  took `hydrate?: HydrationStrategy`
  (`packages/app/src/authoring.ts`), bridged internally to the element
  option.

Both accept the same `HydrationStrategy` values
(`'load' | 'idle' | 'visible' | 'only'`) and map to the same runtime
behavior. The split forced every author to remember which package they were
in, and the only mitigation was a JSDoc cross-reference on each side
pointing at the other name — documentation cannot fix an API split.

#920 asked to unify the naming. Option A (chosen): rename the element side
to `hydrate`, matching the app side, which already uses the target name.

## Decision

1. **`IslandOptions.strategy` is renamed to `hydrate` and the old name is
   deleted outright** — no deprecated alias, no dual acceptance. The alpha
   line permits breaking changes to the unfrozen/alpha surface, and a
   compile-time rename fails loudly (type error) rather than silently
   changing behavior.
2. The same rename applies to the two adjacent element-side declarations of
   the same concept, so no `strategy`-named island option survives in
   element: `HydrationHint.strategy`
   (`packages/element/src/internal/protocol/render.ts`) and the `@internal`
   `static client?: { strategy?: ... }` on the base element class
   (`packages/element/src/open-element-implementation.ts`) become `hydrate`.
   Neither field has any reader in the current graph.
3. The app-side bridge in `defineIsland()`
   (`packages/app/src/authoring.ts`) now passes `hydrate` straight through;
   the JSDoc cross-references describing the dual naming are removed.
4. **Out of scope**: `@openelement/adapter-vite`'s internal wire fields
   named `strategy` (client-entry descriptors, island manifests, scheduler
   `open:ready` event detail) stay as-is. They are adapter-internal protocol
   with their own consumers (generated code, e2e fixtures,
   `HYDRATION_CONTRACT.md`), not the authoring option this ADR unifies.
   Historical ADRs, release notes and dated blog posts keep their original
   wording.

## Consequences

- **Breaking change** on the element surface: any alpha consumer calling
  element's `defineIsland(..., { strategy: '...' })` gets a compile error.
  Migration is one line per call site: rename `strategy` → `hydrate`.
  Consumers authoring through `@openelement/app` (`defineIslandConfig` /
  app `defineIsland`) are unaffected — that side was already named
  `hydrate`.
- One option name (`hydrate`) across both packages; the JSDoc
  cross-reference mitigation is deleted with the split.
- The frozen-surface inventory (`docs/current/PACKAGE_SURFACE.md`) records
  the rename; the public interface snapshot is unchanged (it tracks export
  statements, not interface members).
- Adapter-vite internals keep `strategy` as a field name; readers should
  not confuse that internal wire vocabulary with the authoring option.

## Migration impact

- `packages/element`: `IslandOptions`, `defineIsland()` implementation,
  `HydrationHint`, base-class `static client` declaration, and the
  `island-strategy` test options.
- `packages/app`: `defineIsland()` bridge to the element runtime.
- `packages/create` templates, `examples/`, `www`: no `strategy` option
  usage found — no changes required.
