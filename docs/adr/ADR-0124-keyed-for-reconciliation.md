# ADR-0124: Keyed List Reconciliation for `<For>`

- Status: ACCEPTED (implemented on the v0.42.0-alpha.15 train, #890)
- Date: 2026-08-08
- Builds on: ADR-0123 (standards-as-seams precedent), #890

## Context

`applyList` (`packages/element/src/internal/core/binding-activation.ts`)
re-rendered the entire list on every signal change: clear all children,
dispose every item's effects, re-render every item. A 100-item list with
one insertion at the head caused 100 removals + 100 insertions, lost input
focus/scroll, and tore down every item's signal subscriptions.

React/Vue/Solid all support keyed reconciliation; `<For>` had no `key`
option.

## Decision

1. `<For>` gains an optional `key?: (item, index) => string | number`
   prop. When provided, the CSR list binding (`applyList`) reconciles by
   key instead of full re-render.
2. Reconciliation strategy: **move-then-create, single anchor pass**.
   Previous entries are kept in a key → { nodes, disposers } map. Each new
   key is matched against the previous map once (`seen` guard — duplicate
   keys render fresh, React semantics); surviving keys keep their exact DOM
   nodes (moved via `insertBefore(anchor)`) and their disposers untouched;
   vanished keys are disposed; new keys render through the normal
   `renderToChildren` path.
3. **Lifecycle preservation**: each keyed item renders with its own
   disposer set, so removal disposes only that item's effects. A
   `combinedDispose` wrapper disposes leftover keyed entries on full
   lifecycle teardown, so no item effect leaks.
4. Unkeyed `<For>` keeps the current clear-and-render behavior verbatim;
   `key` is an additive API, never a breaking change. The key fn is
   captured once per binding (the descriptor is immutable), so a binding
   never switches reconciliation mode mid-flight.
5. SSR is unaffected: static rendering already emits the full list; `key`
   is a client-only reconciliation hint and is ignored by `render-ir.ts`.

## Consequences

- O(n) worst-case (all keys changed) equals today's cost; common edits are
  O(delta) DOM operations with state preservation.
- Duplicate keys are tolerated (fresh render per duplicate) but
  discouraged; the ADR does not attempt duplicate-key diffing, which
  React-class reconciliation abandoned for the same cost/benefit reason.
- Benchmark fixture: a keyed 1000-item list mutated at the head must reuse
  the same DOM node objects for all surviving items (the test asserts node
  identity, not just counts).
