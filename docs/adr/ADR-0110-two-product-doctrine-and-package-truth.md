# ADR-0110: Two-Product Doctrine and Package Truth

- Status: Accepted
- Date: 2026-07-01
- Supersedes in part: ADR-0091 and ADR-0099 public product wording

## Context

ADR-0091 and ADR-0099 established a four-product platform vocabulary while the
project was still separating Elements, UI, Framework, and Protocols. The
v0.40.x cleanup train and v0.41.0 alpha line collapsed the active package graph
to 11 packages and made the public story narrower: OpenElement is now a Web
Components fullstack framework powered by a small Basic Element authoring layer.

The repository still contained mixed public wording: README text described a
product matrix, roadmap/current plans described two primary products, and some
status text incorrectly implied that `@openelement/protocol` had been removed
from the current package graph. That drift makes release truth and contributor
onboarding weaker than the code.

## Decision

The current public product doctrine is:

```text
openElement = Web Components Fullstack Framework + Basic Element
supporting packages = Protocols + UI + official stack adapters
```

The public sentence is:

> OpenElement is a Web Components-native fullstack framework with a JSX-first
> Basic Element authoring layer.

- **Web Components Fullstack Framework** owns application concepts: routes,
  request context, render pipeline, layouts, islands, assets, deployment, and
  desktop targets.
- **Basic Element** is the native Web Components authoring surface exposed by
  `@openelement/element` and `OpenElement`.
- **Protocols** are foundation contracts and conformance surfaces. They support
  the two products but are not marketed as a separate product line.
- **UI** is the Open Props-backed reference component library and dogfood
  surface. It supports the framework and Basic Element; it is not a separate
  design-system empire.
- **Official stack adapters** such as Vite, Hono, Nitro, and Deno Desktop
  implement OpenElement-owned concepts. They are defaults, not product owners.
- **Dogfood apps** validate OpenElement. Reader and future desktop dogfood lines
  can block release quality as evidence, but they do not define product identity.
- **Governance infrastructure** such as AutoFlow3, docs truth, release evidence,
  and workflow gates protects the project. It is not part of the Framework
  product promise.

Historical four-product ADRs remain useful as context, but current public docs,
release notes, package-surface docs, and roadmap summaries must use the
two-product doctrine unless they are explicitly describing history.

## Consequences

- README, STATUS, ROADMAP, VERSION_PLAN, release plans, and package-surface docs
  must agree on the current doctrine.
- `@openelement/protocol` stays in the current 11-package graph as a foundation
  package.
- Alpha.6 owns the product-truth cleanup and should add a docs truth gate so the
  drift does not return.
- Public docs should distinguish product, supporting, adapter, dogfood, and
  infrastructure surfaces when a repo directory or package could be mistaken for
  product scope.
