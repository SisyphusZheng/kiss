# Current architecture

Current product architecture is organized by responsibility:

- [Product model](./product-model.md)
- [Compiler and element runtime](./compiler-and-element-runtime.md)
- [Rendering and claim](./rendering-and-claim.md)
- [App and server runtime](./app-and-server-runtime.md)
- [Packages and distribution](./packages-and-distribution.md)
- [Security and release engineering](./security-and-release-engineering.md)

Active ADRs record only unresolved or still-governing hard decisions. Stable facts
graduate into these pages. Historical ADR identity is its original path plus Git blob
SHA, recorded by the ADR migration manifest.

## Planning and public metadata map

- [Beta.2.x checkpoints and acceptance](../current/VERSION_PLAN.md)
- [Roadmap](../roadmap/ROADMAP.md)
- [Issue ownership map](../roadmap/v0.44.0-ISSUES.md)
- [Fork and Native/Lit decision](../adr/ADR-0152-product-router-and-alpha-convergence.md)

Public docs sitemap/search are generated from eligible route/catalog metadata under
[#1327](https://github.com/open-element/openelement/issues/1327). Do not hand-maintain
XML or publish planned APIs as implemented documentation. SSG discovery repair is a
Beta.2.1 prerequisite; metadata convergence remains Beta.2.2.
