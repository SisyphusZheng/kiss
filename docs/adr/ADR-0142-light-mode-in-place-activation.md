# ADR-0142: Light-Mode In-Place Activation of Renderer-Owned SSR DOM

- Status: Accepted
- Date: 2026-08-26
- Amends: ADR-0092
- Related: #1148, ADR-0140, ADR-0067, #631, #917, #942, #1067

## Context

ADR-0092 chose an explicit render-root policy: `shadow` renders into Shadow DOM
and emits DSD on the server; `light` renders into the host and does not attach
a shadow root. It specified SSR and CSR independently but never defined the
transition from server-rendered light DOM to an upgraded interactive element,
nor who owns host children during that transition.

As a result, the client runtime routes every light-mode connection through
`renderIntoLightDom()`, which calls `clearChildren(host)` and mounts fresh DOM
(`packages/element/src/open-element-render.ts`). `pre-hydration-click.ts`
skips light-mode hosts (#1067) because the recorded click target is detached
by that replacement, so a pre-upgrade click inside a light island is silently
lost.

Two facts make a narrow correction possible:

- Light-mode SSR output already carries the complete hydration marker set —
  `data-eid`, `data-signal`, `data-signal-attr`, `data-signal-class`,
  `data-signal-render`, `<!--oe-branch:...-->`, `<!--oe-for-item:N-->`,
  `<!--oe-for-end-->`, and `data-ssr-props` — emitted by the same serialization
  pipeline as shadow content (`render-ir.ts`, `render-ir-serialization.ts`).
  The gap is entirely on the client binding side.
- The hydration machinery (`HydrationScope`, `event-hydration.ts`) is already
  root-agnostic in everything but parameter types and three `shadowRoot.host`
  reads.

Maintainer classification (#1148): this is a compatibility correction to the
existing `renderMode = 'light'` SSR/CSR promise, not a new render mode. Under
the ADR-0140 change-classification table it remains patch-eligible only while
it adds no public option, public lifecycle hook, runtime default, or other
additive semantic; any such need discovered during implementation must stop
and be reclassified through ADR-0140 as future-minor work.

## Decision

Amend the ADR-0092 light-mode contract with the following renderer-ownership
and in-place activation rules.

1. `renderMode = 'light'` means the component owns the host's rendered child
   subtree.
2. SSR output for that subtree is the authoritative initial DOM.
3. On client upgrade, matching SSR DOM is activated in place by binding the
   existing event, signal, attribute, and branch markers; no nodes are
   replaced.
4. Matching activation preserves node identity, focus, selection, live form
   values, nested custom-element instances, and pre-upgrade interaction
   targets.
5. A structural or marker mismatch emits the existing structured hydration
   diagnostic (`OPEN_ELEMENT_HYDRATION_MISMATCH`, #631) and degrades to a full
   client render of the host subtree. Binding is never attempted against
   misaligned DOM.
6. Light mode does not simultaneously promise arbitrary consumer-owned child
   projection. Use Shadow DOM plus slots for projection, or a separate
   enhancement/controller pattern for decorating arbitrary existing DOM.

Supporting contract details:

- **SSR provenance marker.** Light-layer host tags carry the internal boolean
  marker attribute `data-oe-light` in SSR output. The marker proves the host's
  light subtree was server-rendered by this contract and scopes nested light
  subtrees during a parent's activation walk. It is internal hydration
  metadata (like `data-eid`), not a public API; client rendering never writes
  it and it is never removed, so upgrade ordering between nested hosts cannot
  strand a parent walk.
- **Activation trigger.** A light-mode connection activates in place when the
  host carries `data-oe-light`; otherwise (empty `createElement` host, or
  marker stripped upstream) the existing clear-and-render CSR path runs
  unchanged. Explicit `update()` remains a full client re-render in both modes.
- **Nested host scoping.** When the activation root is a light host, marker
  collection (event, signal, branch-token, and list-region walks) prunes the
  rendered subtree of any nested host carrying `data-oe-light`; the nested
  host's own tag — including its host-level `data-eid` — stays in the parent
  scope. Nested shadow hosts remain isolated by their
  `<template shadowrootmode>` boundary, and their light children remain
  parent-owned projection content, exactly as before. Consumer children passed
  to a light-mode registered custom element are outside the supported contract
  (rule 6): their markers are pruned with the nested subtree, the parent
  marker count diverges, and rule 5 degradation applies instead of mis-binding.
- **Shadow behavior unchanged.** Scope pruning applies only when the
  activation root is a light host. A shadow-mode parent containing a light-mode
  child keeps today's behavior (marker-count mismatch, diagnostic, clean
  client-side re-render); in-place activation for that combination is not part
  of this amendment.
- **Lifecycle hooks.** No hook is added, removed, or moved. Light-mode
  connections continue to fire `onCsrRendered()` on both the in-place
  activation path and the CSR path, so existing light-mode init code keeps a
  single hook; `onDsdHydrated()` remains shadow/DSD-only.
- **Reconnect.** Disconnect disposes scope bindings as before. A reconnect with
  the SSR marker present re-activates against the surviving DOM; if an
  intervening `update()` replaced the subtree, marker counts diverge and the
  rule-5 degrade path re-renders cleanly.
- **Pre-hydration clicks.** Click capture/replay (#942) extends to light-mode
  hosts carrying `data-oe-light`: the recorded target now survives activation
  (rule 4), so the latest pre-upgrade click is replayed exactly once after the
  host's bindings are live. The one-click-per-host queue cap (#1027) and the
  flushed-host re-entry guard are unchanged.
- **Signal-render regions.** An author-written `data-signal-render` region
  keeps its existing first-activation contract (SSR content replaced by the
  client-rendered VNode tree). That region is an explicit opt-in and is
  unchanged by this amendment.

## Consequences

Positive:

- Light-mode SSR becomes interactive without losing node identity, focus,
  selection, form values, or pre-upgrade clicks — the same promise DSD already
  makes for shadow mode.
- Nested light custom elements survive parent activation untouched and hydrate
  with their own scope; the fixture proving this becomes part of the package
  test matrix.
- The correction reuses the existing mismatch diagnostic and degrade path; no
  new failure surface is introduced.

Negative / accepted:

- Light SSR output gains one internal marker attribute per host.
- Consumer children passed to light-mode registered custom elements now
  deterministically degrade (rule 5) instead of appearing to half-work.
- A light-mode host whose SSR HTML was produced before this amendment (no
  `data-oe-light`) keeps the old clear-and-render behavior; activation is
  opt-in by provenance, never guessed from content.

## Non-Goals

- No change to the default Shadow/DSD mode or its behavior.
- No public option, lifecycle hook, or runtime default added.
- No generic DOM diffing or reconciliation engine.
- No arbitrary light-child projection contract.
- No in-place activation change for shadow-mode parents containing light-mode
  children.
