# Product model

OpenElement has two core products: **Element** and **Router**. UI is dogfood
and a reference implementation, not a third core product. This is the
accepted target under [ADR-0152](../adr/ADR-0152-product-router-and-alpha-convergence.md);
Beta.2.x issues track implementation. It does not claim all target APIs already ship.

| Product                | Responsibility                                                                                                        | Dependency boundary                                             |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Element                | Compiled Web Components, reactivity, lifecycle, server serialization, fresh DOM and existing-DOM claim/update, styles | Independent component execution foundation                      |
| UI (reference)         | Dogfood components demonstrating interaction, accessibility, themes and composition                                   | Element; Router optional                                        |
| Router: Route Mode     | Explicit records, matching/resolution, HTTP and browser integration entry points                                      | Matching core independent of Element, Hono, Vite and filesystem |
| Router: Framework Mode | File routing by default, page data/forms/errors, layouts, Document, SSR/SSG, navigation and Vite integration          | Same Router core plus Native or Lit integration; UI optional    |

A standard Custom Element is the durable component boundary. JSX is compiled
input, not a public runtime virtual-DOM contract. Element's compiler semantics
remain separate from Vite integration under ADR-0148.

Explicit routes and file-generated routes share one RouteTable/RouteResolution.
File routes never require a second handwritten path declaration. The Router owns
composition/order/collision and HTTP policy; its self-maintained URLPatternList
owns candidate indexing and ordered matching. URLPattern owns single-pattern
syntax and captures. Public browser records exclude server-only code and bindings.

Element execution and URLPatternList are strategic technical assets. Vite adapter,
CLI/create, deployment integration and compiler tooling are supporting surfaces,
not extra product lines. Current packages remain `element`, `app`, `adapter-vite`,
`create` and optional `ui` until an explicit export migration is implemented.
Product count is not npm package count.

The initial application target is HTML-first content and dynamic business pages,
forms and local interactive components. UI stays a selected dogfood/reference surface; a full design system,
generic RPC/ORM/cache/queue framework and comprehensive offline application data
layer are outside this convergence sprint.

## Standalone delivery and reference applications

Element must be independently authored, built, packed and consumed from plain HTML
without Router or private workspace dependencies. Its compiler remains private,
with a versioned artifact contract; build integration delivers the compiler through
an explicit tooling entry. Runtime/browser/type entry graphs must exclude Vite,
TypeScript compiler and Node-only implementation. Native Framework tooling reuses the same
Element compilation path; Lit integration uses its own rendering lifecycle. Neither
changes the shared routing/application semantics.

UI supplies selected dogfood components. The website and a representative consumer
supply reference application evidence. Their defects can reveal core blockers, but
component count, UI redesign, replacement with Web Awesome, and reference-site
expansion are not independent Beta.2.x release objectives. The existing ui package
may remain published; product demotion is not a package removal or migration claim.

Foreign Custom Elements are opaque browser-standard boundaries. OE binds host
properties/attributes/events/slots without compiling their internals. Foreign SSR
and hydration require an explicit supported integration; DSD alone is not a shared
hydration protocol. No mandatory Web Awesome dependency or wrapper library.

## Native and Lit Framework Mode target

The 2026-09-08 plan makes Native and Lit first-class support targets. Beta.2.2 proves
SSR/client continuation/navigation/actions for both; Beta.2.3 hardens packed consumers
and documents runtime differences. This is not a claim of currently shipped Lit SSR.
Router owns application outcomes and cancellation; rendering integrations own their
serialization and client lifecycle. Extract only interfaces proven by both flows.

The generic matching layer is maintained in the public URLPatternList fork, consumed
as a pinned qualified package. Upstream contributions are independent of OE delivery;
a return to upstream is optional. HTTP and framework semantics stay outside the fork.
