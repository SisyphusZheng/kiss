# ADR-0143: Re-enter v0.44 with the Compiled OpenElement Model

- Status: ACCEPTED (2026-08-27, maintainer directive)
- Date: 2026-08-27
- Supersedes: ADR-0140 sequencing and the assumption that no minor is scheduled
- Replaces after migration: ADR-0058/0065/0077 runtime VNode and binding-path decisions
- Preserves: Web-standard Custom Elements, DSD-first server output, progressive
  enhancement, the five-package application boundary until a separate package ADR
  proves otherwise

## Context

The 0.43 line was frozen because it appeared to need only compatible maintenance.
Subsequent architecture review found a foundational design error instead: TSX loses
the identity of dynamic DOM locations, then the runtime reconstructs that identity
through VNodes, binding descriptors, marker discovery, activation registries,
hydration scopes and collection-specific ownership. The system works, but the same
semantic fact is represented repeatedly and the cost grows at every lifecycle seam.

The accepted correction is not a second renderer. It is a replacement architecture
that compiles the one public authoring path into the one executable DOM program.
Because this is intentionally breaking, it opens a new prerelease line rather than
being hidden in a 0.43 patch.

## Decision

### 1. OpenElement is the component model and the concrete base class

`OpenElement extends HTMLElement` remains the center of the product. The phrase
“OpenElement Model” names the semantics implemented by that class; it does not name
an abstract layer from which the class may be removed.

The canonical authoring form is:

```ts
@element('oe-counter')
export class Counter extends OpenElement {
  @property({ reflect: true })
  count = 0;

  render() {
    return <button onClick={() => this.count++}>Count: {this.count}</button>;
  }
}
```

`@element` replaces registration helpers, not `OpenElement`. `@property` compiles
ordinary class fields into the property/attribute contract; authors do not write an
additional `accessor` declaration. The compiler uses standard decorator semantics.
Unknown decorators on an OpenElement class fail until a versioned compiler-plugin
contract exists.

### 2. There is one rendering path

```text
TSX source
   -> OpenElement compiler
   -> Part Program (static structure + typed mutation/region instructions)
   -> server serialization | browser creation | existing-DOM claim
```

There is no public tagged-template authoring path and no runtime `Template` object.
There is no VNode diff renderer, runtime binding-tree discovery, or fallback
`render/update` interpreter in the shipped path. Static structure is compiler data;
the only runtime locations are Parts and Regions owned by the element instance.

### 3. Parts are the mutable DOM primitive

- Fixed Parts own text, attribute, property, boolean attribute, class, style, event
  and ref sinks.
- Regions own a bounded DOM range, nested lifetime and structural identity for
  conditional content, keyed/unkeyed iteration and dynamic subtrees.
- A Signal invalidates only its subscribed Part or Region.
- One element instance owns all local Parts, Regions, subscriptions and cleanup.

The old `BindingDescriptor -> activation -> effect -> DOM` chain is removed once
the compiled path reaches parity. Compatibility is provided by migration tooling and
the 0.43 maintenance line, not by shipping two renderers in 0.44.

### 4. SignalEngine remains replaceable

Signals are not compiled into a framework-owned state implementation. OpenElement
owns a small `SignalEngine` contract and a conformance suite. Preact Signals Core is
the default engine for 0.44; an application may select another conforming engine at
build time. Engine selection is static for one compiled application and does not add
per-update dispatch. A future native/TC39 or OpenElement-owned engine can replace the
default without changing Part Program semantics.

The public signal intrinsics remain owned by `@openelement/element`; a separate public
package is not created merely to mirror the internal plugin seam.

### 5. Root semantics follow the platform

OpenElement owns light DOM, open Shadow DOM and closed Shadow DOM. “Closed” always
means a closed `ShadowRoot`; it is never an alias for light DOM. DSD serializes the
corresponding shadow mode. The Part Program targets the element-owned root without
creating a second render model. Styles, slots, CSS parts, context and form-associated
behavior cross these roots through platform semantics and compiled ownership.

### 6. Claim replaces generic hydration

Server serialization, fresh browser creation and claiming existing SSR DOM consume
the same Part Program. Claim attaches Parts, events and subscriptions to existing
nodes; it does not recreate a component tree. Exact structure/identity mismatches
produce structured diagnostics and a bounded element-local recovery. Live form
values, focus, selection, nested custom-element instances and captured pre-upgrade
events must survive a successful claim.

### 7. Islands own delivery; Elements own behavior; App owns orchestration

```text
App     = route, data, head, SSR/SSG and request orchestration
Island  = whether/when client capability is delivered (one island may contain N elements)
Element = browser lifecycle, state, local behavior and reactive DOM ownership
```

A static route ships no component runtime. An interactive island downloads generated
activation modules and lets the browser upgrade Custom Elements. The island loader
does not understand Parts, Signals or element rendering. There is no separate
application-wide Client layer.

### 8. The compiler is mandatory but not a new public product package

The official Vite adapter owns compiler integration, module splitting, HMR, source
maps and manifests. Compiler internals may be isolated into workspace modules, but a
new public package requires an independent consumer or a later package-boundary ADR.
Unsupported syntax fails at build time with source-located diagnostics; it never
silently falls back to the old runtime.

## Compatibility policy

- `0.43.x` remains available as the stable maintenance line while 0.44 is prerelease.
- `0.44.0-alpha.*` may make breaking changes between alphas when the version plan and
  migration record say so.
- The accepted final alpha freezes the intended framework substrate for product
  qualification. `beta.1` rebuilds the UI system with validated Zag composition;
  `beta.2` rebuilds the website and Starter from beta.1 public artifacts.
- A beta defect may produce another beta. A required compiled-architecture or framework
  public-surface change returns the train to alpha.
- Public-surface changes freeze at RC entry. After `rc.1`, only release blockers,
  documentation corrections and changes proven not to alter the frozen contract land.
- The independent SaaS consumes exact public RC artifacts. Its successful qualification
  is mandatory Stable evidence, not a substitute for the pre-RC UI and website gates.
- Stable `0.44.0` removes the old VNode/binding implementation from distributed
  artifacts. It does not carry a hidden compatibility renderer.

## Consequences

- The architecture is smaller in concepts but requires a compiler, transform-aware
  diagnostics, HMR and source-map quality as product features.
- The server and browser can no longer drift by independently discovering dynamic
  locations.
- Signal engines remain pluggable without making DOM ownership pluggable.
- 0.44 must be proved as a whole vertical slice; isolated replacement of one binding
  kind is not sufficient evidence.

## Verification

The active version plan defines the alpha, beta, RC and Stable gates. The line may enter
beta only when the distributed default path contains no runtime VNode renderer,
binding-descriptor tree, generic hydration walker or interpreter fallback, and the same
fixtures pass server serialization, fresh DOM creation and SSR claim in Chromium,
Firefox and WebKit. RC additionally requires the beta.1 UI and beta.2 website gates.
Stable additionally requires the independent SaaS to qualify exact public RC artifacts.
