# ADR-0109: Unified Signal-DOM Activation Layer

- Status: ACCEPTED (P0 + P1 implemented; P2 remains future work)
- Date: 2026-06-22

## Context

OpenElement currently has two independent signal→DOM binding paths:

- **Path A (CSR creation)**: `packages/core/src/jsx-render-dom.ts:applyProps()` binds signals to DOM nodes while they are being created from a VNode tree.
- **Path D (DSD hydration)**: `packages/element/src/open-element-hydration.ts:hydrateSignals()` binds signals to DOM nodes that already exist inside a Declarative Shadow DOM template, discovering them via `data-signal*` markers and resolving signal identity through `signalRegistry`.

Both paths implement the same binding semantics—text content, attributes, CSS classes, and VNode child rendering—but with different input sources (VNode props vs. DOM attributes) and different cleanup wiring. This duplication was noted in the v0.41.0-alpha.1 architecture review and flagged as technical debt.

We have also considered more radical cures:

- A framework-specific JSX→imperative-DOM compiler. This would eliminate the split by making CSR and hydration share the same generated binding code, but it turns OpenElement into a Stencil-like toolchain and violates our “no framework compiler” boundary.
- Tagged template literals (Lit-style `html`\`...\``). This would give us a TemplateResult/Part abstraction that naturally unifies SSR and hydration, but it abandons JSX and makes OpenElement a direct Lit competitor.

Both were rejected. We need a solution that keeps JSX, keeps no framework compiler, and still removes the duplicated binding logic.

## Decision

Introduce a single **Activation Layer** that owns all signal→DOM and event→DOM bindings. The layer consumes abstract **Binding Descriptors** and is agnostic to how those descriptors were produced.

### Binding Descriptor abstraction

A descriptor is a plain object describing one binding:

```ts
type BindingDescriptor =
  | { kind: 'text'; target: Node; signal: Signal<unknown> }
  | { kind: 'attr'; el: Element; attr: string; signal: Signal<unknown> }
  | { kind: 'class'; el: Element; class: string; signal: Signal<unknown> }
  | { kind: 'render'; el: Element; signal: Signal<unknown> }
  | { kind: 'event'; el: Element; type: string; handler: EventListener; signal?: AbortSignal };
```

One function applies the descriptor and returns a dispose function:

```ts
applyBindingDescriptor(desc: BindingDescriptor, lifecycle: Lifecycle): () => void
```

### Two discovery paths, one binding implementation

| Path          | Discovery                                                                    | Binding                    |
| ------------- | ---------------------------------------------------------------------------- | -------------------------- |
| CSR creation  | `applyProps()` walks VNode props and emits descriptors                       | `applyBindingDescriptor()` |
| DSD hydration | `hydrateSignals()` parses `data-signal*` markers into descriptors            | `applyBindingDescriptor()` |
| Events        | `collectEventBindings()` / `hydrateEventMarkers()` emits `event` descriptors | `applyBindingDescriptor()` |

The split is reduced from “two binding implementations” to “two descriptor discovery mechanisms.”

### Layered package exports

Split `@openelement/core` into runtime-scoped subpaths so that static DSD components do not pay for DOM binding code:

- `@openelement/core/static` — SSR/SSG-only code paths; no DOM binding, no signal effects.
- `@openelement/core/hydrate` — DSD interactive components; marker hydration + events.
- `@openelement/core/csr` — CSR fallback and pure islands; full `renderToDom`.

### What we are NOT doing

- No framework-specific JSX compiler.
- No tagged template literal syntax.
- No virtual DOM diff/reconciliation.
- No synthetic event system.

## Consequences

### Positive

- Binding logic lives in one place; fixes and new binding kinds only require one change.
- CSR and hydration share the same effect lifecycle and disposal semantics.
- Static DSD components can avoid loading DOM binding code entirely.
- The architecture stays aligned with ADR-0057 (no framework compiler), ADR-0065 (VNode as description), and ADR-0067 (DSD-first signal-native hydration).
- Future migration to TC39 Signals or DOM Parts only requires replacing `applyBindingDescriptor`, not two parallel paths.

### Negative

- We still have two descriptor discovery mechanisms, so the split is not fully gone—just moved and standardized.
- Without a compiler, we cannot eliminate the runtime cost of walking VNodes or querying markers.
- `signalRegistry` must remain a required concept for both CSR and hydration.

### Neutral

- The user-facing API does not change.
- JSX compilation remains the standard TypeScript automatic JSX transform.

## VNode naming

We keep the public name `VNode`. It is entrenched in the protocol, core, element packages, tests, and existing ADRs. Renaming it would be a broad breaking change with limited practical benefit.

Instead, we document its actual meaning:

> `VNode` is a **JSX description node**: a short-lived, plain-object description of a DOM subtree. It is not a virtual DOM node and is not retained as a runtime tree.

If a clearer public name becomes necessary in the future, we can introduce it as an alias and deprecate `VNode` gradually.

## Long-term targets

We do **not** commit to a framework-specific compiler or to tagged templates.

- **Compiler**: Treated only as a fallback if runtime VNode costs are proven unacceptable and partial pre-compilation fails.
- **Tagged templates**: Explicitly out of scope; incompatible with our JSX-first product identity.
- **Real long-term targets**: Web platform standards that remove the need for framework-owned binding code:
  - TC39 Signals
  - DOM Templating API / DOM Parts
  - Declarative Custom Elements

When these standards mature, OpenElement can migrate `applyBindingDescriptor` to use native primitives without changing the user-facing JSX API.

## Implementation roadmap

### P0 (this cycle)

1. Create `BindingDescriptor` type and `applyBindingDescriptor()` in `packages/core`.
2. Refactor `jsx-render-dom.ts:applyProps()` to emit descriptors and call the unified binder.
3. Refactor `open-element-hydration.ts:hydrateSignals()` to parse markers into descriptors and call the unified binder.
4. Refactor event binding (`event-hydration.ts`) to emit `event` descriptors through the same binder.

### P1 (next cycle)

5. Remove `@prop()` decorator runtime; keep only `static props`.
6. Split `@openelement/core` into `static`, `hydrate`, and `csr` subpaths.
7. Standardize marker format and document it as a protocol contract.

### P2 (future)

8. Add TC39 Signal engine adapter when the standard stabilizes.
9. Add DOM Templating output adapter when the API is available.
10. Evaluate Declarative Custom Element generation for supported browsers.
