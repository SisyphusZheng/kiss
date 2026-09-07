# Product model

OpenElement has three products: **Element**, **UI** and **Router**. This is the
accepted target under [ADR-0152](../adr/ADR-0152-product-router-and-alpha-convergence.md);
Beta.2.x issues track implementation. It does not claim all target APIs already ship.

| Product                | Responsibility                                                                                                        | Dependency boundary                                             |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Element                | Compiled Web Components, reactivity, lifecycle, server serialization, fresh DOM and existing-DOM claim/update, styles | Independent component execution foundation                      |
| UI                     | Selected reusable components, interaction, accessibility, themes and composition                                      | Element; Router optional                                        |
| Router: Route Mode     | Explicit records, matching/resolution, HTTP and browser integration entry points                                      | Matching core independent of Element, Hono, Vite and filesystem |
| Router: Framework Mode | File routing by default, page data/forms/errors, layouts, Document, SSR/SSG, navigation and Vite integration          | Same Router core plus Element; UI optional                      |

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
forms and local interactive components. UI stays selected; a full design system,
generic RPC/ORM/cache/queue framework and comprehensive offline application data
layer are outside this convergence sprint.
